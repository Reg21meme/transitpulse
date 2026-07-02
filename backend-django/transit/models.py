from django.db import models


class Route(models.Model):
    """A transit line, e.g. the Red Line. Reference data — seeded once."""
    route_id = models.CharField(max_length=64, primary_key=True)
    long_name = models.CharField(max_length=128)
    color = models.CharField(max_length=6, blank=True)
    route_type = models.IntegerField()

    def __str__(self):
        return self.long_name


class Stop(models.Model):
    """A station/stop, e.g. Park Street. Reference data — seeded once."""
    stop_id = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=128)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return self.name


class VehicleSnapshot(models.Model):
    """One observation of one vehicle at one moment. Time-series — grows forever."""
    vehicle_id = models.CharField(max_length=64, db_index=True)
    trip_id = models.CharField(max_length=64, blank=True, db_index=True)    
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="snapshots")
    stop_id = models.CharField(max_length=64, blank=True)  # plain text, not FK (see design note)
    current_status = models.CharField(max_length=32)
    direction_id = models.IntegerField(null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    bearing = models.IntegerField(null=True)
    updated_at = models.DateTimeField()      # timestamp MBTA reported the position
    recorded_at = models.DateTimeField(auto_now_add=True)  # when we saved the row

    class Meta:
        indexes = [
            models.Index(fields=["route", "recorded_at"]),
        ]

    def __str__(self):
        return f"{self.vehicle_id} @ {self.recorded_at}"


class Prediction(models.Model):
    """A predicted arrival/departure at a stop. Time-series — grows forever."""
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="predictions")
    stop_id = models.CharField(max_length=64, db_index=True)
    trip_id = models.CharField(max_length=64, blank=True)
    direction_id = models.IntegerField(null=True)
    arrival_time = models.DateTimeField(null=True)
    departure_time = models.DateTimeField(null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["stop_id", "recorded_at"]),
        ]

    def __str__(self):
        return f"pred {self.trip_id} @ {self.stop_id}"