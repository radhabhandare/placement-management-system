# backend/accounts/serializers.py
import re
from rest_framework import serializers
from .models import (
    User, StudentProfile, Education, StudentSkill, StudentSoftSkill,
    Project, Certification, Experience, StudentDocument,
)

PHONE_RE = re.compile(r'^[6-9]\d{9}$')   # Indian 10-digit mobile


# ==================================================================
# Registration
# ==================================================================
class StudentRegistrationSerializer(serializers.Serializer):
    """
    Handles a new student registration.
    Creates User + StudentProfile. Password is hashed via set_password().
    """
    email = serializers.EmailField()
    registration_number = serializers.CharField(max_length=50)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    date_of_birth = serializers.DateField()
    gender = serializers.CharField(max_length=1, required=False, allow_blank=True)
    location = serializers.CharField(max_length=150)
    contact_number = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value.lower()

    def validate_registration_number(self, value):
        if User.objects.filter(registration_number=value).exists():
            raise serializers.ValidationError("This registration number is already used.")
        return value

    def validate_contact_number(self, value):
        if not PHONE_RE.match(value):
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        return value

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        StudentProfile.objects.create(user=user)
        return user


# ==================================================================
# Login (shape only — actual check is in views.LoginView)
# ==================================================================
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ==================================================================
# Output serializers
# ==================================================================
class UserSerializer(serializers.ModelSerializer):
    profile_completion = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'registration_number', 'first_name', 'last_name',
            'date_of_birth', 'gender', 'location', 'contact_number',
            'role', 'status', 'is_active', 'profile_completion',
        ]
        read_only_fields = ['id', 'email', 'registration_number',
                            'role', 'status', 'is_active']

    def get_profile_completion(self, obj):
        return obj.profile_completion_percent() if obj.role == 'STUDENT' else 100


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = [
            'id', 'level', 'institution', 'degree', 'branch',
            'passing_year', 'percentage', 'cgpa',
            'active_backlogs', 'total_backlogs',
        ]
        read_only_fields = ['id']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSkill
        fields = ['id', 'skill_name']
        read_only_fields = ['id']


class SoftSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSoftSkill
        fields = ['id', 'skill_name']
        read_only_fields = ['id']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'technologies',
                  'start_date', 'end_date', 'link']
        read_only_fields = ['id']


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'title', 'issuer', 'issue_date', 'credential_url']
        read_only_fields = ['id']


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'company_name', 'role', 'start_date', 'end_date',
                  'description', 'is_current']
        read_only_fields = ['id']


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDocument
        fields = ['id', 'doc_type', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    educations = EducationSerializer(many=True, read_only=True)
    technical_skills = SkillSerializer(many=True, read_only=True)
    soft_skills = SoftSkillSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user',
            'profile_photo', 'profile_photo_url',
            'resume', 'resume_url',
            'experience_type', 'experience_details',
            'hobbies', 'interests',
            'desired_job_positions', 'preferred_locations',
            'linkedin_url', 'github_url',
            'educations', 'technical_skills', 'soft_skills',
            'projects', 'certifications', 'experiences', 'documents',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'profile_photo', 'resume',
                            'created_at', 'updated_at']

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            req = self.context.get('request')
            return req.build_absolute_uri(obj.profile_photo.url) if req else obj.profile_photo.url
        return None

    def get_resume_url(self, obj):
        if obj.resume:
            req = self.context.get('request')
            return req.build_absolute_uri(obj.resume.url) if req else obj.resume.url
        return None