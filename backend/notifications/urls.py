# backend/notifications/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListCreate.as_view(), name='notification-list'),
    path('<int:pk>/read/', views.NotificationMarkRead.as_view(), name='notification-read'),
]