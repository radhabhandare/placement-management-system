# backend/accounts/views.py
import uuid
import logging
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone

from .models import (
    User, StudentProfile, Education, StudentSkill, StudentSoftSkill,
    Project, Certification, Experience,
)
from .serializers import (
    StudentRegistrationSerializer, LoginSerializer, UserSerializer,
    StudentProfileSerializer, EducationSerializer, SkillSerializer,
    SoftSkillSerializer, ProjectSerializer, CertificationSerializer,
    ExperienceSerializer,
)
from .permissions import IsApprovedStudent, IsAdminRole
from .utils import (
    send_registration_email, send_approval_email, send_rejection_email,
    send_password_reset_email,
)

logger = logging.getLogger(__name__)


def _tokens_for(user):
    """Produce a fresh access/refresh JWT pair."""
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


# ==================================================================
# 1. PUBLIC AUTH
# ==================================================================
class RegisterView(APIView):
    """
    POST /api/auth/register/
    Creates a real User row in MySQL with status=PENDING.
    Sends a 'registration received' email to the student's inbox.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        logger.info(
            f"[REGISTER] Created user {user.email} "
            f"(reg={user.registration_number}, status=PENDING). "
            f"Sending confirmation to {user.email}..."
        )

        send_registration_email(user)

        return Response(
            {
                'message': 'Registration submitted. Pending admin approval.',
                'email': user.email,
                'registration_number': user.registration_number,
                'status': user.status,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Real authenticate() call. Issues JWT on success.
    Blocks pending/rejected/unactivated students.
    Locks account for 30 minutes after 3 failed attempts.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data['email'].lower()
        password = s.validated_data['password']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            logger.warning(f"[LOGIN] No such user: {email}")
            return Response({'error': 'Invalid credentials.'}, status=401)

        # Lockout
        if user.is_locked:
            logger.warning(f"[LOGIN] {email} locked until {user.locked_until}")
            return Response(
                {'error': f'Account locked until {user.locked_until.isoformat()}. Try later.'},
                status=423,
            )

        # Student-only status gates
        if user.role == 'STUDENT':
            if user.status == 'PENDING':
                logger.info(f"[LOGIN] {email} is PENDING — blocked.")
                return Response({'error': 'Account pending admin approval.'}, status=403)
            if user.status == 'REJECTED':
                return Response({'error': 'Account was rejected. Contact admin.'}, status=403)
            if not user.is_active:
                return Response(
                    {'error': 'Account not activated. Please use your activation link.'},
                    status=403,
                )

        # Real authentication
        auth_user = authenticate(request, email=email, password=password)
        if auth_user is None:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 3:
                user.lock_for(30)
                logger.warning(f"[LOGIN] {email} locked for 30 min after 3 fails.")
                return Response(
                    {'error': 'Too many failed attempts. Account locked for 30 minutes.'},
                    status=423,
                )
            user.save(update_fields=['failed_login_attempts'])
            remaining = 3 - user.failed_login_attempts
            return Response(
                {'error': f'Invalid credentials. {remaining} attempt(s) left.'},
                status=401,
            )

        # Success
        user.unlock()
        logger.info(f"[LOGIN] {email} ({user.role}) logged in OK.")
        return Response({
            'message': 'Login successful',
            'tokens': _tokens_for(user),
            'user': UserSerializer(user).data,
        })


class ActivateAccountView(APIView):
    """
    POST /api/auth/activate/<uuid>/
    Real one-time activation. Sets password, flips is_active=True.
    Student received the UUID in their approval email.
    """
    permission_classes = [AllowAny]

    def post(self, request, token):
        password = request.data.get('password', '')
        confirm = request.data.get('confirm_password', '')

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)
        if password != confirm:
            return Response({'error': 'Passwords do not match.'}, status=400)

        try:
            user = User.objects.get(activation_token=token, status='APPROVED')
        except User.DoesNotExist:
            logger.warning(f"[ACTIVATE] Invalid token: {token}")
            return Response({'error': 'Invalid or expired activation link.'}, status=400)

        if user.is_active:
            return Response({'error': 'Account already activated. Please log in.'}, status=400)

        user.set_password(password)
        user.is_active = True
        user.unlock()
        user.save()
        logger.info(f"[ACTIVATE] {user.email} activated and can now log in.")
        return Response({'message': 'Account activated. You can log in now.'})


class MeView(APIView):
    """GET /api/auth/me/ — current logged-in user info."""
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ==================================================================
# 2. PASSWORD RESET (public)
# ==================================================================
class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Body: { "email": "student@example.com" }

    Always returns the same message whether the email exists or not.
    This prevents attackers from probing which emails are registered.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=400)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Do NOT reveal whether the email exists
            return Response({
                'message': 'If this email is registered, a password reset link has been sent.'
            })

        # Only allow reset for approved + active accounts
        if user.status != 'APPROVED' or not user.is_active:
            return Response({
                'message': 'If this email is registered, a password reset link has been sent.'
            })

        # Regenerate token to invalidate any old reset links
        user.reset_token = uuid.uuid4()
        user.reset_token_created = timezone.now()
        user.save(update_fields=['reset_token', 'reset_token_created'])

        logger.info(f"[FORGOT-PW] Reset link sent to {user.email}")
        send_password_reset_email(user)

        return Response({
            'message': 'If this email is registered, a password reset link has been sent.'
        })


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/<uuid>/
    Body: { "password": "...", "confirm_password": "..." }

    Validates token, checks expiry (24h), sets new password.
    """
    permission_classes = [AllowAny]

    def post(self, request, token):
        password = request.data.get('password', '')
        confirm = request.data.get('confirm_password', '')

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)
        if password != confirm:
            return Response({'error': 'Passwords do not match.'}, status=400)

        try:
            user = User.objects.get(reset_token=token)
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired reset link.'}, status=400)

        # 24-hour expiry
        if user.reset_token_created < timezone.now() - timedelta(hours=24):
            return Response({'error': 'Reset link has expired. Please request a new one.'}, status=400)

        user.set_password(password)
        # Rotate token so the link can't be reused
        user.reset_token = uuid.uuid4()
        user.reset_token_created = timezone.now()
        # Unlock account in case they were locked out for failed attempts
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save()

        logger.info(f"[RESET-PW] Password reset completed for {user.email}")
        return Response({'message': 'Password reset successful. You can now log in.'})


# ==================================================================
# 3. STUDENT PROFILE
# ==================================================================
class ProfileView(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        return Response(
            StudentProfileSerializer(profile, context={'request': request}).data
        )

    def put(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)

        for f in ['first_name', 'last_name', 'date_of_birth',
                  'gender', 'location', 'contact_number']:
            if f in request.data and request.data[f] not in (None, ''):
                setattr(request.user, f, request.data[f])
        request.user.save()

        for f in [
            'experience_type', 'experience_details', 'hobbies', 'interests',
            'desired_job_positions', 'preferred_locations',
            'linkedin_url', 'github_url',
        ]:
            if f in request.data:
                setattr(profile, f, request.data[f])
        profile.save()

        return Response(
            StudentProfileSerializer(profile, context={'request': request}).data
        )


class UploadPhotoView(APIView):
    permission_classes = [IsApprovedStudent]

    def post(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        f = request.FILES.get('profile_photo')
        if not f:
            return Response({'error': 'No file uploaded.'}, status=400)
        if f.size > 2 * 1024 * 1024:
            return Response({'error': 'Max size 2 MB.'}, status=400)
        if not (f.content_type or '').startswith('image/'):
            return Response({'error': 'Only image files allowed.'}, status=400)
        profile.profile_photo = f
        profile.save()
        return Response({'message': 'Photo uploaded.', 'url': profile.profile_photo.url})


class UploadResumeView(APIView):
    permission_classes = [IsApprovedStudent]

    ALLOWED_MIME = {
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }

    def post(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        f = request.FILES.get('resume')
        if not f:
            return Response({'error': 'No file uploaded.'}, status=400)
        if f.size > 5 * 1024 * 1024:
            return Response({'error': 'Max size 5 MB.'}, status=400)
        if f.content_type not in self.ALLOWED_MIME:
            return Response({'error': 'Only PDF / DOC / DOCX allowed.'}, status=400)
        ext = f.name.lower().rsplit('.', 1)[-1]
        if ext not in ('pdf', 'doc', 'docx'):
            return Response({'error': 'Invalid file extension.'}, status=400)
        profile.resume = f
        profile.save()
        return Response({'message': 'Resume uploaded.', 'url': profile.resume.url})


# ---------- Education CRUD ----------
class EducationListCreate(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        return Response(EducationSerializer(request.user.profile.educations.all(), many=True).data)

    def post(self, request):
        s = EducationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(student=request.user.profile)
        return Response(s.data, status=201)


class EducationDetail(APIView):
    permission_classes = [IsApprovedStudent]

    def put(self, request, pk):
        obj = get_object_or_404(Education, pk=pk, student__user=request.user)
        s = EducationSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        Education.objects.filter(pk=pk, student__user=request.user).delete()
        return Response(status=204)


# ---------- Technical skills CRUD ----------
class SkillListCreate(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        return Response(SkillSerializer(request.user.profile.technical_skills.all(), many=True).data)

    def post(self, request):
        name = (request.data.get('skill_name') or '').strip()
        if not name:
            return Response({'error': 'skill_name is required.'}, status=400)
        obj, _ = StudentSkill.objects.get_or_create(student=request.user.profile, skill_name=name)
        return Response(SkillSerializer(obj).data, status=201)


class SkillDetail(APIView):
    permission_classes = [IsApprovedStudent]

    def delete(self, request, pk):
        StudentSkill.objects.filter(pk=pk, student__user=request.user).delete()
        return Response(status=204)


# ---------- Soft skills CRUD ----------
class SoftSkillListCreate(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        return Response(SoftSkillSerializer(request.user.profile.soft_skills.all(), many=True).data)

    def post(self, request):
        name = (request.data.get('skill_name') or '').strip()
        if not name:
            return Response({'error': 'skill_name is required.'}, status=400)
        obj, _ = StudentSoftSkill.objects.get_or_create(student=request.user.profile, skill_name=name)
        return Response(SoftSkillSerializer(obj).data, status=201)


class SoftSkillDetail(APIView):
    permission_classes = [IsApprovedStudent]

    def delete(self, request, pk):
        StudentSoftSkill.objects.filter(pk=pk, student__user=request.user).delete()
        return Response(status=204)


# ---------- Projects CRUD ----------
class ProjectListCreate(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        return Response(ProjectSerializer(request.user.profile.projects.all(), many=True).data)

    def post(self, request):
        s = ProjectSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(student=request.user.profile)
        return Response(s.data, status=201)


class ProjectDetail(APIView):
    permission_classes = [IsApprovedStudent]

    def put(self, request, pk):
        obj = get_object_or_404(Project, pk=pk, student__user=request.user)
        s = ProjectSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        Project.objects.filter(pk=pk, student__user=request.user).delete()
        return Response(status=204)


# ---------- Certifications CRUD ----------
class CertificationListCreate(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        return Response(CertificationSerializer(request.user.profile.certifications.all(), many=True).data)

    def post(self, request):
        s = CertificationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(student=request.user.profile)
        return Response(s.data, status=201)


class CertificationDetail(APIView):
    permission_classes = [IsApprovedStudent]

    def delete(self, request, pk):
        Certification.objects.filter(pk=pk, student__user=request.user).delete()
        return Response(status=204)


# ---------- Experience CRUD ----------
class ExperienceListCreate(APIView):
    permission_classes = [IsApprovedStudent]

    def get(self, request):
        return Response(ExperienceSerializer(request.user.profile.experiences.all(), many=True).data)

    def post(self, request):
        s = ExperienceSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(student=request.user.profile)
        return Response(s.data, status=201)


class ExperienceDetail(APIView):
    permission_classes = [IsApprovedStudent]

    def delete(self, request, pk):
        Experience.objects.filter(pk=pk, student__user=request.user).delete()
        return Response(status=204)


# ==================================================================
# 4. ADMIN — student management
# ==================================================================
class AdminStudentListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = User.objects.filter(role='STUDENT').order_by('-created_at')
        if st := request.query_params.get('status'):
            qs = qs.filter(status=st)
        if search := request.query_params.get('search'):
            qs = qs.filter(email__icontains=search) | \
                 qs.filter(registration_number__icontains=search) | \
                 qs.filter(first_name__icontains=search) | \
                 qs.filter(last_name__icontains=search)
        return Response(UserSerializer(qs, many=True).data)


class AdminStudentDetail(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk, role='STUDENT')
        profile, _ = StudentProfile.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'profile': StudentProfileSerializer(profile, context={'request': request}).data,
        })


class AdminApproveStudent(APIView):
    """
    POST /api/auth/admin/students/<id>/approve/
    - Flips status from PENDING → APPROVED (real DB update)
    - Sends REAL email to the student containing the activation URL
    """
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk, role='STUDENT')
        if user.status != 'PENDING':
            return Response({'error': 'Only PENDING users can be approved.'}, status=400)

        user.status = 'APPROVED'
        user.save(update_fields=['status'])

        activation_url = f"{settings.FRONTEND_URL}/activate/{user.activation_token}"
        logger.info(
            f"[APPROVE] {user.email} approved. "
            f"Activation link: {activation_url}"
        )

        send_approval_email(user)

        return Response({
            'message': 'Approved. Activation email sent.',
            'email': user.email,
            'activation_url': activation_url,
            'note': 'If SMTP is configured, this URL was emailed. If not, use it directly.',
        })


class AdminRejectStudent(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk, role='STUDENT')
        if user.status != 'PENDING':
            return Response({'error': 'Only PENDING users can be rejected.'}, status=400)

        reason = request.data.get('reason', '')
        user.status = 'REJECTED'
        user.save(update_fields=['status'])
        logger.info(f"[REJECT] {user.email} rejected. Reason: {reason}")

        send_rejection_email(user, reason)
        return Response({'message': 'Rejected. Email sent.'})