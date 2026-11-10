# backend/dashboard/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('admin/stats/', views.AdminDashboardStats.as_view(), name='admin-stats'),
    path('student/stats/', views.StudentDashboardStats.as_view(), name='student-stats'),
    path('student/placement-history/', views.StudentPlacementHistory.as_view(), name='student-placement-history'),
    path('admin/placements/', views.AdminPlacements.as_view(), name='admin-placements'),
]