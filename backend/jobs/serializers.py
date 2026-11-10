# backend/jobs/serializers.py
from rest_framework import serializers
from .models import (
    Company, Job, Application, ApplicationStatusHistory, Interview, SavedJob,
)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_applications_count(self, obj):
        return obj.applications.count()


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.job_title', read_only=True)
    job_code = serializers.CharField(source='job.job_code', read_only=True)
    company_name = serializers.CharField(source='job.company.company_name', read_only=True)
    student_name = serializers.SerializerMethodField()
    student_regno = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['id', 'application_id', 'student',
                            'applied_at', 'updated_at', 'status']

    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"

    def get_student_regno(self, obj):
        return obj.student.user.registration_number

    def get_student_email(self, obj):
        return obj.student.user.email

    def get_resume_url(self, obj):
        if obj.resume_used:
            return obj.resume_used.url
        if obj.student.resume:
            return obj.student.resume.url
        return None


class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source='changed_by.email', read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = '__all__'


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['id', 'created_at']