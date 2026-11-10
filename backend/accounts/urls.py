# backend/accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ----- Public auth -----
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('activate/<uuid:token>/', views.ActivateAccountView.as_view(), name='activate'),
    path('me/', views.MeView.as_view(), name='me'),

    # ----- Profile -----
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/photo/', views.UploadPhotoView.as_view(), name='upload-photo'),
    path('profile/resume/', views.UploadResumeView.as_view(), name='upload-resume'),

    # ----- Education -----
    path('education/', views.EducationListCreate.as_view(), name='education-list'),
    path('education/<int:pk>/', views.EducationDetail.as_view(), name='education-detail'),

    # ----- Technical skills -----
    path('skills/', views.SkillListCreate.as_view(), name='skill-list'),
    path('skills/<int:pk>/', views.SkillDetail.as_view(), name='skill-detail'),

    # ----- Soft skills -----
    path('soft-skills/', views.SoftSkillListCreate.as_view(), name='soft-skill-list'),
    path('soft-skills/<int:pk>/', views.SoftSkillDetail.as_view(), name='soft-skill-detail'),

    # ----- Projects -----
    path('projects/', views.ProjectListCreate.as_view(), name='project-list'),
    path('projects/<int:pk>/', views.ProjectDetail.as_view(), name='project-detail'),

    # ----- Certifications -----
    path('certifications/', views.CertificationListCreate.as_view(), name='cert-list'),
    path('certifications/<int:pk>/', views.CertificationDetail.as_view(), name='cert-detail'),

    # ----- Experience -----
    path('experiences/', views.ExperienceListCreate.as_view(), name='exp-list'),
    path('experiences/<int:pk>/', views.ExperienceDetail.as_view(), name='exp-detail'),

    # ----- Admin: students -----
    path('admin/students/', views.AdminStudentListView.as_view(), name='admin-students'),
    path('admin/students/<int:pk>/', views.AdminStudentDetail.as_view(), name='admin-student-detail'),
    path('admin/students/<int:pk>/approve/', views.AdminApproveStudent.as_view(), name='admin-approve'),
    path('admin/students/<int:pk>/reject/', views.AdminRejectStudent.as_view(), name='admin-reject'),
]