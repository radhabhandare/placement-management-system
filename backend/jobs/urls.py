# backend/jobs/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('public/list/', views.PublicJobListView.as_view(), name='public-jobs'),
    path('public/<int:pk>/', views.PublicJobDetail.as_view(), name='public-job-detail'),
    path('public/companies/', views.PublicCompanyList.as_view(), name='public-companies'),
    path('public/stats/', views.LandingStats.as_view(), name='public-stats'),

    # Student
    path('student/<int:pk>/eligibility/', views.StudentEligibilityView.as_view(), name='student-eligibility'),
    path('student/<int:pk>/apply/', views.StudentApplyJob.as_view(), name='student-apply'),
    path('student/applications/', views.StudentApplicationList.as_view(), name='student-applications'),
    path('student/applications/<int:pk>/', views.StudentApplicationDetail.as_view(), name='student-app-detail'),
    path('student/applications/<int:pk>/withdraw/', views.StudentWithdrawApplication.as_view(), name='student-withdraw'),
    path('student/saved/', views.StudentSavedJobs.as_view(), name='student-saved'),
    path('student/saved/<int:pk>/', views.StudentUnsaveJob.as_view(), name='student-unsave'),

    # Admin — companies
    path('admin/companies/', views.AdminCompanyListCreate.as_view(), name='admin-companies'),
    path('admin/companies/<int:pk>/', views.AdminCompanyDetail.as_view(), name='admin-company-detail'),

    # Admin — jobs
    path('admin/jobs/', views.AdminJobListCreate.as_view(), name='admin-jobs'),
    path('admin/jobs/<int:pk>/', views.AdminJobDetail.as_view(), name='admin-job-detail'),

    # Admin — applications
    path('admin/applications/', views.AdminApplicationList.as_view(), name='admin-applications'),
    path('admin/applications/<int:pk>/status/', views.AdminUpdateApplicationStatus.as_view(), name='admin-app-status'),
    path('admin/applications/<int:pk>/interview/', views.AdminScheduleInterview.as_view(), name='admin-interview'),
]