# backend/accounts/utils.py
"""
Centralized email helpers for the accounts app.

All senders are safe-to-fail: they log errors but never raise.
This means the API keeps working even if SMTP is misconfigured
(very common during local development).
"""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_plain_email(subject, message, recipients):
    """Single point of truth for sending a plain-text email."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
        logger.info(f"[EMAIL SENT] {subject} -> {recipients}")
    except Exception as exc:
        logger.error(f"[EMAIL FAILED] {subject} -> {recipients} | {exc}")


def send_registration_email(user):
    """After a student registers: 'pending approval' notice."""
    send_plain_email(
        "Registration Received - Placement Portal",
        (
            f"Hi {user.first_name},\n\n"
            f"Your registration has been received and is pending admin approval.\n\n"
            f"Registration No: {user.registration_number}\n"
            f"Email: {user.email}\n\n"
            f"We'll notify you once your account is approved.\n\n"
            f"- Placement Cell"
        ),
        [user.email],
    )


def send_approval_email(user):
    """
    Sent when admin approves the student.
    Contains a one-time activation URL (UUID token) so they can set a password.
    Plain-text passwords are NEVER emailed.
    """
    activation_url = f"{settings.FRONTEND_URL}/activate/{user.activation_token}"
    send_plain_email(
        "Account Approved - Activate Your Account",
        (
            f"Hi {user.first_name},\n\n"
            f"Great news! Your account has been APPROVED.\n\n"
            f"Login Email: {user.email}\n\n"
            f"Set your password using this one-time link:\n"
            f"{activation_url}\n\n"
            f"This link is unique to you. Please do not share it.\n\n"
            f"- Placement Cell"
        ),
        [user.email],
    )


def send_rejection_email(user, reason=""):
    send_plain_email(
        "Registration Rejected - Placement Portal",
        (
            f"Hi {user.first_name},\n\n"
            f"Unfortunately, your registration could not be approved.\n"
            f"Reason: {reason or 'Not specified'}\n\n"
            f"For questions, please contact the placement cell.\n\n"
            f"- Placement Cell"
        ),
        [user.email],
    )


def send_job_application_email(student, job):
    send_plain_email(
        f"Application Submitted: {job.job_title}",
        (
            f"Hi {student.first_name},\n\n"
            f"You have successfully applied for:\n"
            f"Role: {job.job_title}\n"
            f"Company: {job.company.company_name}\n"
            f"Job Code: {job.job_code}\n\n"
            f"Track status updates in your dashboard.\n\n"
            f"- Placement Cell"
        ),
        [student.email],
    )


def send_interview_email(application, interview):
    send_plain_email(
        f"Interview Scheduled: {application.job.job_title}",
        (
            f"Hi {application.student.user.first_name},\n\n"
            f"An interview has been scheduled:\n"
            f"Role: {application.job.job_title}\n"
            f"Company: {application.job.company.company_name}\n"
            f"Date/Time: {interview.scheduled_at}\n"
            f"Mode: {interview.mode}\n"
            f"Location/Link: {interview.location_or_link or '-'}\n"
            f"Notes: {interview.notes or '-'}\n\n"
            f"- Placement Cell"
        ),
        [application.student.user.email],
    )


def send_status_update_email(application, new_status):
    send_plain_email(
        f"Application Status Update: {new_status}",
        (
            f"Hi {application.student.user.first_name},\n\n"
            f"Your application status for {application.job.job_title} "
            f"at {application.job.company.company_name} is now: {new_status}.\n\n"
            f"- Placement Cell"
        ),
        [application.student.user.email],
    )


def send_password_reset_email(user):
    """
    Sent when a user requests a password reset.
    Contains a one-time reset link. Plain-text passwords are never emailed.
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{user.reset_token}"
    send_plain_email(
        "Password Reset - Placement Portal",
        (
            f"Hi {user.first_name},\n\n"
            f"We received a request to reset your password.\n\n"
            f"Click the link below to set a new password:\n"
            f"{reset_url}\n\n"
            f"This link will expire in 24 hours. If you didn't request this, "
            f"you can ignore this email — your current password is still valid.\n\n"
            f"- Placement Cell"
        ),
        [user.email],
    )