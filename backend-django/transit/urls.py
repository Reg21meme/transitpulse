from django.urls import path
from . import views

urlpatterns = [
    path("stops/", views.StopListView.as_view(), name="stop-list"),
    path("analytics/reliability/", views.reliability_view, name="reliability"),
    path("analytics/delays/by-line/", views.delays_by_line_view, name="delays-by-line"),
    path("analytics/delays/by-stop/", views.delays_by_stop_view, name="delays-by-stop"),
    path("analytics/delays/by-hour/", views.delays_by_hour_view, name="delays-by-hour"),
    path("analytics/delays/by-line-hour/", views.delays_by_line_hour_view, name="delays-by-line-hour"),
    path("analytics/dashboard/", views.dashboard_view, name="dashboard"),
]