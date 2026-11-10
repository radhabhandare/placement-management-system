# backend/jobs/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging

from .models import (
    Company, Job, Application, ApplicationStatusHistory, Interview, SavedJob,
)
from .serializers import (
    CompanySerializer, JobSerializer, ApplicationSerializer,
    StatusHistorySerializer, InterviewSerializer,
)
from .eligibility import check_eligibility
from accounts.permissions import IsAdminRole, IsApprovedStudent
from accounts.utils import (
    send_job_application_email, send_status_update_email, send_interview_email,
)

logger = logging.getLogger(__name__)


# ==================================================================
# PUBLIC — anyone can browse published jobs and companies
# ==================================================================
class PublicJobListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Job.objects.filter(status='PUBLISHED').select_related('company').order_by('-created_at')
        p = request.query_params

        if s := p.get('search'):
            qs = qs.filter(job_title__icontains=s) | \
                 qs.filter(company__company_name__icontains=s) | \
                 qs.filter(job_code__icontains=s)
        if c := p.get('company'):
            qs = qs.filter(company_id=c)
        if loc := p.get('location'):
            qs = qs.filter(job_location__icontains=loc)
        if et := p.get('employment_type'):
            qs = qs.filter(employment_type=et)
        if skill := p.get('skill'):
            qs = qs.filter(required_skills__icontains=skill)

        return Response(JobSerializer(qs, many=True).data)


class PublicJobDetail(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        job = get_object_or_404(Job, pk=pk, status='PUBLISHED')
        return Response(JobSerializer(job).data)


class PublicCompanyList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Company.objects.filter(is_active=True).order_by('company_name')
        return Response(CompanySerializer(qs, many=True).data)


class LandingStats(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from accounts.models import User
        return Response({
            'total_jobs': Job.objects.filter(status='PUBLISHED').count(),
            'total_companies': Company.objects.filter(is_active=True).count(),
            'total_students': User.objects.filter(role='STUDENT', status='APPROVED').count(),
            'total_selected': Application.objects.filter(status='SELECTED').count(),
        })


# ==================================================================
# STUDENT — apply, withdraw, save jobs
# ==================================================================
class StudentEligibilityView(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        eligible, reasons = check_eligibility(request.user, job)
        applied = Application.objects.filter(student=request.user.profile, job=job).exists()
        return Response({
            'eligible': eligible,
            'reasons': reasons,
            'already_applied': applied,
        })


class StudentApplyJob(APIView):
    permission_classes = [IsApprovedStudent]

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk, status='PUBLISHED')

        if job.application_deadline and job.application_deadline < timezone.now().date():
            return Response({'error': 'Application deadline has passed.'}, status=400)

        # Duplicate check (also enforced by DB unique_together)
        if Application.objects.filter(student=request.user.profile, job=job).exists():
            return Response({'error': 'You have already applied to this job.'}, status=400)

        eligible, reasons = check_eligibility(request.user, job)
        if not eligible:
            return Response(
                {'error': 'Not eligible to apply.', 'reasons': reasons},
                status=400,
            )

        profile = request.user.profile
        resume = request.FILES.get('resume') or profile.resume

        app = Application.objects.create(
            student=profile,
            job=job,
            resume_used=resume,
            experience_note=request.data.get('experience_note', ''),
            relocation_ok=request.data.get('relocation_ok', False) in [True, 'true', 'True', 'on'],
            relevant_info=request.data.get('relevant_info', ''),
        )
        ApplicationStatusHistory.objects.create(
            application=app, to_status='APPLIED', changed_by=request.user
        )
        send_job_application_email(profile.user, job)

        logger.info(f"[APPLY] {profile.user.email} → {job.job_code}")
        return Response(ApplicationSerializer(app).data, status=201)


class StudentApplicationList(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        qs = request.user.profile.applications.select_related(
            'job', 'job__company'
        ).order_by('-applied_at')
        return Response(ApplicationSerializer(qs, many=True).data)


class StudentApplicationDetail(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request, pk):
        app = get_object_or_404(Application, pk=pk, student__user=request.user)
        return Response({
            'application': ApplicationSerializer(app).data,
            'history': StatusHistorySerializer(app.history.all(), many=True).data,
            'interview': InterviewSerializer(app.interview).data if hasattr(app, 'interview') else None,
        })


class StudentWithdrawApplication(APIView):
    permission_classes = [IsApprovedStudent]

    def post(self, request, pk):
        app = get_object_or_404(Application, pk=pk, student__user=request.user)
        if app.status not in ['APPLIED', 'REVIEWING', 'SHORTLISTED']:
            return Response(
                {'error': f'Cannot withdraw at status: {app.status}.'},
                status=400,
            )
        prev = app.status
        app.status = 'WITHDRAWN'
        app.save()
        ApplicationStatusHistory.objects.create(
            application=app, from_status=prev, to_status='WITHDRAWN',
            changed_by=request.user,
        )
        return Response({'message': 'Application withdrawn.'})


class StudentSavedJobs(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        saved = request.user.profile.saved_jobs.select_related(
            'job', 'job__company'
        ).all()
        return Response([JobSerializer(s.job).data for s in saved])

    def post(self, request):
        job_id = request.data.get('job_id')
        job = get_object_or_404(Job, pk=job_id)
        SavedJob.objects.get_or_create(student=request.user.profile, job=job)
        return Response({'message': 'Job saved.'})


class StudentUnsaveJob(APIView):
    permission_classes = [IsApprovedStudent]

    def delete(self, request, pk):
        SavedJob.objects.filter(student=request.user.profile, job_id=pk).delete()
        return Response(status=204)


# ==================================================================
# ADMIN — Companies CRUD
# ==================================================================
class AdminCompanyListCreate(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = Company.objects.all().order_by('-created_at')
        return Response(CompanySerializer(qs, many=True).data)

    def post(self, request):
        s = CompanySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=201)


class AdminCompanyDetail(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        return Response(CompanySerializer(get_object_or_404(Company, pk=pk)).data)

    def put(self, request, pk):
        c = get_object_or_404(Company, pk=pk)
        s = CompanySerializer(c, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        c = get_object_or_404(Company, pk=pk)
        c.is_active = False
        c.save()
        return Response({'message': 'Company deactivated.'})


# ==================================================================
# ADMIN — Jobs CRUD
# ==================================================================
class AdminJobListCreate(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = Job.objects.select_related('company').order_by('-created_at')
        if st := request.query_params.get('status'):
            qs = qs.filter(status=st)
        return Response(JobSerializer(qs, many=True).data)

    def post(self, request):
        s = JobSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=201)


class AdminJobDetail(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        return Response(JobSerializer(get_object_or_404(Job, pk=pk)).data)

    def put(self, request, pk):
        j = get_object_or_404(Job, pk=pk)
        s = JobSerializer(j, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        j = get_object_or_404(Job, pk=pk)
        j.status = 'ARCHIVED'
        j.save()
        return Response({'message': 'Job archived.'})


# ==================================================================
# ADMIN — Applications & Interviews
# ==================================================================
class AdminApplicationList(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = Application.objects.select_related(
            'student__user', 'job', 'job__company'
        ).order_by('-applied_at')

        if st := request.query_params.get('status'):
            qs = qs.filter(status=st)
        if jc := request.query_params.get('job_code'):
            qs = qs.filter(job__job_code__icontains=jc)
        if search := request.query_params.get('search'):
            qs = qs.filter(student__user__first_name__icontains=search) | \
                 qs.filter(student__user__registration_number__icontains=search) | \
                 qs.filter(student__user__email__icontains=search)
        return Response(ApplicationSerializer(qs, many=True).data)


class AdminUpdateApplicationStatus(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        app = get_object_or_404(Application, pk=pk)
        new_status = request.data.get('status')
        note = request.data.get('note', '')
        if new_status not in dict(Application.STATUS):
            return Response({'error': 'Invalid status value.'}, status=400)

        prev = app.status
        app.status = new_status
        app.save()
        ApplicationStatusHistory.objects.create(
            application=app, from_status=prev, to_status=new_status,
            note=note, changed_by=request.user,
        )
        send_status_update_email(app, new_status)
        return Response(ApplicationSerializer(app).data)


class AdminScheduleInterview(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        app = get_object_or_404(Application, pk=pk)
        interview, _ = Interview.objects.update_or_create(
            application=app,
            defaults={
                'scheduled_at': request.data.get('scheduled_at'),
                'mode': request.data.get('mode', 'ONLINE'),
                'location_or_link': request.data.get('location_or_link', ''),
                'notes': request.data.get('notes', ''),
            },
        )
        prev = app.status
        app.status = 'INTERVIEW'
        app.save()
        ApplicationStatusHistory.objects.create(
            application=app, from_status=prev, to_status='INTERVIEW',
            note='Interview scheduled', changed_by=request.user,
        )
        send_interview_email(app, interview)
        return Response(InterviewSerializer(interview).data)