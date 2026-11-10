# backend/jobs/models.py
from django.db import models
from django.conf import settings
import uuid


class Company(models.Model):
    company_name = models.CharField(max_length=200, unique=True)
    company_code = models.CharField(max_length=50, unique=True)
    industry = models.CharField(max_length=150, blank=True)
    domain = models.CharField(max_length=150, blank=True)
    location = models.CharField(max_length=150, blank=True)
    head_office = models.CharField(max_length=200, blank=True)
    branches = models.TextField(blank=True)
    contact_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    hr_name = models.CharField(max_length=150, blank=True)
    hr_email = models.EmailField(blank=True)
    hr_phone = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Companies'
        indexes = [models.Index(fields=['company_code'])]

    def __str__(self):
        return self.company_name


class Job(models.Model):
    STATUS = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('CLOSED', 'Closed'),
        ('ARCHIVED', 'Archived'),
    ]
    EMPLOYMENT = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('INTERN', 'Internship'),
        ('CONTRACT', 'Contract'),
    ]

    job_code = models.CharField(max_length=50, unique=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    job_title = models.CharField(max_length=200)
    vacancies = models.IntegerField(default=1)
    job_location = models.CharField(max_length=150)
    salary_lpa = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    min_experience = models.IntegerField(default=0)
    max_experience = models.IntegerField(default=0)

    qualification = models.CharField(max_length=150, blank=True)
    eligible_degrees = models.CharField(max_length=300, blank=True,
        help_text="Comma separated: e.g. B.Tech, B.E.")
    eligible_branches = models.CharField(max_length=300, blank=True,
        help_text="Comma separated: e.g. CSE, IT, ECE")
    min_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    min_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    passing_year_from = models.IntegerField(null=True, blank=True)
    passing_year_to = models.IntegerField(null=True, blank=True)
    max_backlogs = models.IntegerField(default=0)

    required_skills = models.TextField(blank=True,
        help_text="Comma separated: e.g. Python, Django, MySQL")
    good_to_have_skills = models.TextField(blank=True)
    description = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)

    industry_type = models.CharField(max_length=150, blank=True)
    department = models.CharField(max_length=150, blank=True)
    job_role = models.CharField(max_length=150, blank=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT, default='FULL_TIME')
    application_deadline = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=15, choices=STATUS, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'job_code']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.job_code} — {self.job_title}"


class Application(models.Model):
    STATUS = [
        ('APPLIED', 'Applied'),
        ('REVIEWING', 'Reviewing'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW', 'Interview'),
        ('SELECTED', 'Selected'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
    ]

    application_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    student = models.ForeignKey(
        'accounts.StudentProfile', on_delete=models.CASCADE, related_name='applications'
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    resume_used = models.FileField(upload_to='application_resumes/', null=True, blank=True)
    experience_note = models.TextField(blank=True)
    relocation_ok = models.BooleanField(default=False)
    relevant_info = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS, default='APPLIED')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # HARD GUARANTEE: one student can't apply twice to the same job
        unique_together = [('student', 'job')]
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['job', 'status']),
        ]

    def __str__(self):
        return f"{self.student.user.email} → {self.job.job_code} [{self.status}]"


class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name='history'
    )
    from_status = models.CharField(max_length=15, blank=True)
    to_status = models.CharField(max_length=15)
    note = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = 'Application status histories'


class Interview(models.Model):
    MODE = [
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('PHONE', 'Phone'),
    ]
    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name='interview'
    )
    scheduled_at = models.DateTimeField()
    mode = models.CharField(max_length=10, choices=MODE, default='ONLINE')
    location_or_link = models.CharField(max_length=400, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class SavedJob(models.Model):
    student = models.ForeignKey(
        'accounts.StudentProfile', on_delete=models.CASCADE, related_name='saved_jobs'
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('student', 'job')]