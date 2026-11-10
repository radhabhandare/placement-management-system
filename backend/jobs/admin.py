# backend/jobs/admin.py
from django.contrib import admin
from .models import (
    Company, Job, Application, ApplicationStatusHistory, Interview, SavedJob,
)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'company_code', 'industry', 'location', 'is_active')
    search_fields = ('company_name', 'company_code')
    list_filter = ('is_active', 'industry')


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('job_code', 'job_title', 'company', 'job_location',
                    'salary_lpa', 'status', 'created_at')
    list_filter = ('status', 'employment_type', 'company')
    search_fields = ('job_code', 'job_title', 'company__company_name')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('application_id', 'student', 'job', 'status', 'applied_at')
    list_filter = ('status', 'job__company')
    search_fields = ('student__user__email', 'student__user__registration_number',
                     'job__job_code')


@admin.register(ApplicationStatusHistory)
class StatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('application', 'from_status', 'to_status', 'changed_by', 'changed_at')
    list_filter = ('to_status',)


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('application', 'scheduled_at', 'mode')
    list_filter = ('mode',)


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('student', 'job', 'created_at')