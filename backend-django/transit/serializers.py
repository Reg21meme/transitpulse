from rest_framework import serializers
from .models import Stop


class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ["stop_id", "name", "latitude", "longitude"]
