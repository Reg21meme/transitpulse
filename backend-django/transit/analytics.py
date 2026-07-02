from collections import defaultdict
from statistics import mean
from zoneinfo import ZoneInfo
from .models import VehicleSnapshot, Prediction

BOSTON_TZ = ZoneInfo("America/New_York")


def get_actual_arrivals():
    """
    From snapshots, find when each (trip_id, stop_id) actually arrived.
    Actual arrival = earliest 'updated_at' where the train was STOPPED_AT the stop.
    Returns: dict keyed by (trip_id, stop_id) -> {"time": datetime, "route_id": str}.
    """
    stopped = (
        VehicleSnapshot.objects
        .filter(current_status="STOPPED_AT")
        .exclude(trip_id="")
        .exclude(stop_id="")
        .values("trip_id", "stop_id", "updated_at", "route_id")
    )

    actuals = {}
    for snap in stopped:
        key = (snap["trip_id"], snap["stop_id"])
        if key not in actuals or snap["updated_at"] < actuals[key]["time"]:
            actuals[key] = {"time": snap["updated_at"], "route_id": snap["route_id"]}
    return actuals


def get_earliest_predictions():
    """
    First predicted arrival for each (trip_id, stop_id) — the original promise.
    Returns: dict keyed by (trip_id, stop_id) -> predicted arrival datetime.
    """
    preds = (
        Prediction.objects
        .exclude(trip_id="")
        .exclude(stop_id="")
        .filter(arrival_time__isnull=False)
        .values("trip_id", "stop_id", "arrival_time", "recorded_at")
        .order_by("recorded_at")
    )

    predicted = {}
    for p in preds:
        key = (p["trip_id"], p["stop_id"])
        if key not in predicted:
            predicted[key] = p["arrival_time"]
    return predicted


def compute_delays():
    """
    Match actual arrivals against original predictions; delay in minutes.
    Returns: list of dicts, one per matched (trip_id, stop_id).
    """
    actuals = get_actual_arrivals()
    predicted = get_earliest_predictions()

    delays = []
    for key, info in actuals.items():
        if key not in predicted:
            continue
        trip_id, stop_id = key
        actual_time = info["time"]
        predicted_time = predicted[key]
        delay_seconds = (actual_time - predicted_time).total_seconds()
        delays.append({
            "trip_id": trip_id,
            "stop_id": stop_id,
            "route_id": info["route_id"],
            "predicted": predicted_time,
            "actual": actual_time,
            "delay_minutes": round(delay_seconds / 60, 1),
        })
    return delays


def aggregate_by_line(delays):
    """Average delay grouped by route. Returns list sorted by route_id."""
    groups = defaultdict(list)
    for d in delays:
        groups[d["route_id"]].append(d["delay_minutes"])

    result = [
        {
            "route_id": route_id,
            "count": len(vals),
            "avg_delay_minutes": round(mean(vals), 2),
        }
        for route_id, vals in groups.items()
    ]
    return sorted(result, key=lambda x: x["route_id"])


def aggregate_by_stop(delays):
    """Average delay grouped by stop. Returns list sorted worst-delay first."""
    groups = defaultdict(list)
    for d in delays:
        groups[d["stop_id"]].append(d["delay_minutes"])

    result = [
        {
            "stop_id": stop_id,
            "count": len(vals),
            "avg_delay_minutes": round(mean(vals), 2),
        }
        for stop_id, vals in groups.items()
    ]
    return sorted(result, key=lambda x: x["avg_delay_minutes"], reverse=True)


def aggregate_by_hour(delays):
    """Average delay grouped by hour of day (Boston time). Returns list sorted by hour."""
    groups = defaultdict(list)
    for d in delays:
        hour = d["actual"].astimezone(BOSTON_TZ).hour
        groups[hour].append(d["delay_minutes"])

    result = [
        {
            "hour": hour,
            "count": len(vals),
            "avg_delay_minutes": round(mean(vals), 2),
        }
        for hour, vals in sorted(groups.items())
    ]
    return result