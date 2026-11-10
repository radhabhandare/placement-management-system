# backend/dashboard/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from accounts.permissions import IsAdminRole, IsApprovedStudent
from accounts.models import User
from jobs.models import Company, Job, Application
from jobs.serializers import JobSerializer, ApplicationSerializer


class AdminDashboardStats(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_students = User.objects.filter(role='STUDENT').count()
        pending = User.objects.filter(role='STUDENT', status='PENDING').count()
        approved = User.objects.filter(role='STUDENT', status='APPROVED').count()
        rejected = User.objects.filter(role='STUDENT', status='REJECTED').count()
        companies = Company.objects.filter(is_active=True).count()
        active_jobs = Job.objects.filter(status='PUBLISHED').count()
        total_apps = Application.objects.count()
        shortlisted = Application.objects.filter(status='SHORTLISTED').count()
        selected = Application.objects.filter(status='SELECTED').count()
        placement_pct = round((selected / approved * 100), 2) if approved else 0

        recent = Application.objects.select_related(
            'job', 'job__company', 'student__user'
        ).order_by('-applied_at')[:5]

        return Response({
            'total_students': total_students,
            'pending_approvals': pending,
            'approved_students': approved,
            'rejected_students': rejected,
            'registered_companies': companies,
            'active_jobs': active_jobs,
            'total_applications': total_apps,
            'shortlisted': shortlisted,
            'selected_students': selected,
            'placement_percentage': placement_pct,
            'recent_applications': [
                {
                    'student': f"{a.student.user.first_name} {a.student.user.last_name}",
                    'job': a.job.job_title,
                    'company': a.job.company.company_name,
                    'status': a.status,
                    'applied_at': a.applied_at,
                } for a in recent
            ],
        })


class StudentDashboardStats(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        user = request.user
        profile = user.profile
        available = Job.objects.filter(status='PUBLISHED').count()
        applied = profile.applications.count()
        pending_apps = profile.applications.filter(status__in=['APPLIED', 'REVIEWING']).count()
        shortlisted = profile.applications.filter(status='SHORTLISTED').count()
        selected = profile.applications.filter(status='SELECTED').count()

        recent_jobs = Job.objects.filter(status='PUBLISHED').order_by('-created_at')[:5]

        upcoming_interviews_qs = profile.applications.filter(
            status='INTERVIEW',
            interview__scheduled_at__gte=timezone.now(),
        ).select_related('interview', 'job', 'job__company')

        return Response({
            'profile_completion': user.profile_completion_percent(),
            'available_jobs': available,
            'applied_count': applied,
            'pending_applications': pending_apps,
            'shortlisted_count': shortlisted,
            'selected_count': selected,
            'recent_jobs': JobSerializer(recent_jobs, many=True).data,
            'recent_applications': ApplicationSerializer(
                profile.applications.order_by('-applied_at')[:5], many=True
            ).data,
            'upcoming_interviews': [
                {
                    'job': a.job.job_title,
                    'company': a.job.company.company_name,
                    'scheduled_at': a.interview.scheduled_at,
                    'mode': a.interview.mode,
                    'location_or_link': a.interview.location_or_link,
                } for a in upcoming_interviews_qs
            ],
        })


class StudentPlacementHistory(APIView):
    """Selected applications for the logged-in student."""
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        placed = request.user.profile.applications.filter(
            status='SELECTED'
        ).select_related('job', 'job__company', 'interview')

        return Response([
            {
                'id': a.id,
                'job_title': a.job.job_title,
                'job_code': a.job.job_code,
                'company_name': a.job.company.company_name,
                'salary_lpa': a.job.salary_lpa,
                'job_location': a.job.job_location,
                'selected_at': a.updated_at,
            } for a in placed
        ])


class AdminPlacements(APIView):
    """All selected students (for admin placement report)."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        placed = Application.objects.filter(
            status='SELECTED'
        ).select_related(
            'student__user', 'job', 'job__company'
        ).order_by('-updated_at')

        return Response([
            {
                'id': a.id,
                'student_name': f"{a.student.user.first_name} {a.student.user.last_name}",
                'student_email': a.student.user.email,
                'student_regno': a.student.user.registration_number,
                'job_title': a.job.job_title,
                'job_code': a.job.job_code,
                'company_name': a.job.company.company_name,
                'salary_lpa': a.job.salary_lpa,
                'placed_at': a.updated_at,
            } for a in placed
        ])