# backend/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from datetime import timedelta
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('role', 'ADMIN')
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('status', 'APPROVED')
        extra.setdefault('is_active', True)
        extra.setdefault('first_name', 'Admin')
        extra.setdefault('last_name', 'User')
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('ADMIN', 'Admin'), ('STUDENT', 'Student')]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]

    email = models.EmailField(unique=True)
    registration_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    location = models.CharField(max_length=150, blank=True)
    contact_number = models.CharField(max_length=15, blank=True)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    activation_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    activation_token_created = models.DateTimeField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['role', 'status']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def is_locked(self):
        return bool(self.locked_until and self.locked_until > timezone.now())

    def lock_for(self, minutes=30):
        self.locked_until = timezone.now() + timedelta(minutes=minutes)
        self.save(update_fields=['locked_until'])

    def unlock(self):
        self.locked_until = None
        self.failed_login_attempts = 0
        self.save(update_fields=['locked_until', 'failed_login_attempts'])

    def profile_completion_percent(self):
        try:
            p = self.profile
        except Exception:
            return 0
        total = 10
        done = 0
        if self.first_name and self.last_name:
            done += 1
        if self.date_of_birth:
            done += 1
        if self.location and self.contact_number:
            done += 1
        if p.educations.exists():
            done += 1
        if p.experiences.exists():
            done += 1
        if p.technical_skills.exists():
            done += 1
        if p.soft_skills.exists():
            done += 1
        if p.projects.exists():
            done += 1
        if p.certifications.exists():
            done += 1
        if p.resume:
            done += 1
        return int(done / total * 100)


class StudentProfile(models.Model):
    EXPERIENCE_TYPE = [('FRESHER', 'Fresher'), ('EXPERIENCED', 'Experienced')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)

    experience_type = models.CharField(max_length=15, choices=EXPERIENCE_TYPE, default='FRESHER')
    experience_details = models.TextField(blank=True)

    hobbies = models.TextField(blank=True)
    interests = models.TextField(blank=True)
    desired_job_positions = models.CharField(max_length=300, blank=True)
    preferred_locations = models.CharField(max_length=300, blank=True)

    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.email}"


class Education(models.Model):
    LEVELS = [
        ('TENTH', '10th'),
        ('TWELFTH', '12th'),
        ('GRAD', 'Graduation'),
        ('POST_GRAD', 'Post-Graduation'),
        ('OTHER', 'Other'),
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='educations')
    level = models.CharField(max_length=15, choices=LEVELS)
    institution = models.CharField(max_length=200)
    degree = models.CharField(max_length=150, blank=True)
    branch = models.CharField(max_length=150, blank=True)
    passing_year = models.IntegerField()
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    active_backlogs = models.IntegerField(default=0)
    total_backlogs = models.IntegerField(default=0)

    class Meta:
        ordering = ['-passing_year']

    def __str__(self):
        return f"{self.get_level_display()} - {self.institution}"


class StudentSkill(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='technical_skills')
    skill_name = models.CharField(max_length=100)

    class Meta:
        unique_together = [('student', 'skill_name')]


class StudentSoftSkill(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='soft_skills')
    skill_name = models.CharField(max_length=100)

    class Meta:
        unique_together = [('student', 'skill_name')]


class Project(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    technologies = models.CharField(max_length=300, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    link = models.URLField(blank=True)


class Certification(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='certifications')
    title = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200)
    issue_date = models.DateField(null=True, blank=True)
    credential_url = models.URLField(blank=True)


class Experience(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='experiences')
    company_name = models.CharField(max_length=200)
    role = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_current = models.BooleanField(default=False)


class StudentDocument(models.Model):
    DOC_TYPES = [
        ('RESUME', 'Resume'),
        ('MARKSHEET', 'Marksheet'),
        ('CERTIFICATE', 'Certificate'),
        ('OTHER', 'Other'),
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)