from rest_framework import generics
from .models import Stop
from .serializers import StopSerializer


class StopListView(generics.ListAPIView):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer