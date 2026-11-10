# backend/accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, StudentProfile, Education, StudentSkill, StudentSoftSkill,
    Project, Certification, Experience, StudentDocument,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the email-based User model."""
    list_display = ('email', 'first_name', 'last_name', 'registration_number',
                    'role', 'status', 'is_active', 'created_at')
    list_filter = ('role', 'status', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'registration_number')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'date_of_birth',
                                      'gender', 'location', 'contact_number')}),
        ('Placement Info', {'fields': ('registration_number', 'role', 'status',
                                       'is_active', 'is_staff', 'is_superuser')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
        ('Security', {'fields': ('failed_login_attempts', 'locked_until',
                                 'activation_token')}),
        ('Timestamps', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2',
                       'role', 'status', 'is_active', 'is_staff'),
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'activation_token')


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'experience_type', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    inlines = [EducationInline]


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('student', 'level', 'institution', 'passing_year',
                    'percentage', 'cgpa')
    list_filter = ('level', 'passing_year')
    search_fields = ('student__user__email', 'institution')


@admin.register(StudentSkill)
class StudentSkillAdmin(admin.ModelAdmin):
    list_display = ('student', 'skill_name')
    search_fields = ('student__user__email', 'skill_name')


@admin.register(StudentSoftSkill)
class StudentSoftSkillAdmin(admin.ModelAdmin):
    list_display = ('student', 'skill_name')
    search_fields = ('student__user__email', 'skill_name')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('student', 'title', 'technologies')
    search_fields = ('student__user__email', 'title')


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ('student', 'title', 'issuer', 'issue_date')
    search_fields = ('student__user__email', 'title')


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ('student', 'company_name', 'role', 'start_date', 'is_current')
    list_filter = ('is_current',)
    search_fields = ('student__user__email', 'company_name', 'role')


@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ('student', 'doc_type', 'uploaded_at')
    list_filter = ('doc_type',)