# backend/notifications/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification


class NotificationListCreate(APIView):
    def get(self, request):
        qs = request.user.notifications.all()[:50]
        return Response([
            {
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at,
            } for n in qs
        ])

    def post(self, request):
        # Mark all as read
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({'message': 'All marked as read'})


class NotificationMarkRead(APIView):
    def post(self, request, pk):
        try:
            n = request.user.notifications.get(pk=pk)
            n.is_read = True
            n.save()
            return Response({'message': 'Marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)