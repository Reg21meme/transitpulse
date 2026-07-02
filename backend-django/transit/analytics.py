from collections import defaultdict
from .models import VehicleSnapshot, Prediction


def get_actual_arrivals():
    """
    From snapshots, find when each (trip_id, stop_id) actually arrived.
    Actual arrival = earliest 'updated_at' where the train was STOPPED_AT the stop.
    Returns: dict keyed by (trip_id, stop_id) -> actual arrival datetime.
    """
    stopped = (
        VehicleSnapshot.objects
        .filter(current_status="STOPPED_AT")
        .exclude(trip_id="")
        .exclude(stop_id="")
        .values("trip_id", "stop_id", "updated_at")
    )

    actuals = {}
    for snap in stopped:
        key = (snap["trip_id"], snap["stop_id"])
        # Keep the earliest time we saw it stopped there
        if key not in actuals or snap["updated_at"] < actuals[key]:
            actuals[key] = snap["updated_at"]
    return actuals


def get_earliest_predictions():
    """
    From predictions, find the FIRST predicted arrival for each (trip_id, stop_id).
    'First' = the prediction with the earliest 'recorded_at' (the original promise).
    Returns: dict keyed by (trip_id, stop_id) -> predicted arrival datetime.
    """
    preds = (
        Prediction.objects
        .exclude(trip_id="")
        .exclude(stop_id="")
        .filter(arrival_time__isnull=False)
        .values("trip_id", "stop_id", "arrival_time", "recorded_at")
        .order_by("recorded_at")  # earliest first
    )

    predicted = {}
    for p in preds:
        key = (p["trip_id"], p["stop_id"])
        # order_by recorded_at means the first one we hit is the earliest promise
        if key not in predicted:
            predicted[key] = p["arrival_time"]
    return predicted


def compute_delays():
    """
    Match actual arrivals against original predictions and compute delay in minutes.
    Returns: list of dicts, one per matched (trip_id, stop_id).
    """
    actuals = get_actual_arrivals()
    predicted = get_earliest_predictions()

    delays = []
    for key, actual_time in actuals.items():
        if key not in predicted:
            continue  # no promise to compare against — skip
        trip_id, stop_id = key
        predicted_time = predicted[key]
        delay_seconds = (actual_time - predicted_time).total_seconds()
        delays.append({
            "trip_id": trip_id,
            "stop_id": stop_id,
            "predicted": predicted_time,
            "actual": actual_time,
            "delay_minutes": round(delay_seconds / 60, 1),
        })
    return delays