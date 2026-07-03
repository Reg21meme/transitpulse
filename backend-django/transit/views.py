from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Stop
from .serializers import StopSerializer
from . import analytics


class StopListView(generics.ListAPIView):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer


@api_view(["GET"])
def reliability_view(request):
    delays = analytics.compute_delays()
    return Response({
        "overall": analytics.reliability_overall(delays),
        "by_line": analytics.reliability_by_line(delays),
    })


@api_view(["GET"])
def delays_by_line_view(request):
    delays = analytics.compute_delays()
    return Response(analytics.aggregate_by_line(delays))


@api_view(["GET"])
def delays_by_stop_view(request):
    delays = analytics.compute_delays()
    return Response(analytics.aggregate_by_stop(delays))


@api_view(["GET"])
def delays_by_hour_view(request):
    delays = analytics.compute_delays()
    return Response(analytics.aggregate_by_hour(delays))

@api_view(["GET"])
def delays_by_line_hour_view(request):
    delays = analytics.compute_delays()
    return Response(analytics.aggregate_by_line_hour(delays))