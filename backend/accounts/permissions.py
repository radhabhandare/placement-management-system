# backend/accounts/permissions.py
from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Any authenticated user with role STUDENT (regardless of status)."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'STUDENT'
        )


class IsAdminRole(BasePermission):
    """Any authenticated user with role ADMIN."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class IsApprovedStudent(BasePermission):
    """
    Strictest:
      - Must be STUDENT
      - Must be APPROVED (not PENDING / REJECTED)
      - Must be activated (is_active=True → password was set via activation link)
    """
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and u.role == 'STUDENT'
            and u.status == 'APPROVED'
            and u.is_active
        )