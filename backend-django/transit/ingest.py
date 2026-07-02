import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from .models import Route, VehicleSnapshot, Prediction

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
API_KEY = os.getenv("MBTA_API_KEY")
BASE_URL = "https://api-v3.mbta.com"

SUBWAY_ROUTES = ["Red", "Orange", "Blue", "Green-B", "Green-C", "Green-D", "Green-E"]


def ensure_routes():
    """Fetch subway routes and make sure each exists in the Route table."""
    url = f"{BASE_URL}/routes"
    params = {"filter[type]": "0,1", "api_key": API_KEY}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()

    count = 0
    for route in resp.json()["data"]:
        attrs = route["attributes"]
        Route.objects.update_or_create(
            route_id=route["id"],
            defaults={
                "long_name": attrs.get("long_name", ""),
                "color": attrs.get("color", "") or "",
                "route_type": attrs.get("type", 0),
            },
        )
        count += 1
    return count


def ingest_vehicles():
    """Fetch live vehicles and save a snapshot row for each."""
    url = f"{BASE_URL}/vehicles"
    params = {"filter[route]": ",".join(SUBWAY_ROUTES), "api_key": API_KEY}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()

    saved = 0
    skipped = 0
    for v in resp.json()["data"]:
        attrs = v["attributes"]
        route_data = v["relationships"]["route"]["data"]

        if not route_data or attrs.get("latitude") is None:
            skipped += 1
            continue

        try:
            route = Route.objects.get(route_id=route_data["id"])
        except Route.DoesNotExist:
            skipped += 1
            continue

        stop_data = v["relationships"].get("stop", {}).get("data")
        stop_id = stop_data["id"] if stop_data else ""

        trip_data = v["relationships"].get("trip", {}).get("data")
        trip_id = trip_data["id"] if trip_data else ""
        VehicleSnapshot.objects.create(
            vehicle_id=v["id"],
            trip_id=trip_id,
            route=route,
            stop_id=stop_id,
            current_status=attrs.get("current_status", ""),
            direction_id=attrs.get("direction_id"),
            latitude=attrs["latitude"],
            longitude=attrs["longitude"],
            bearing=attrs.get("bearing"),
            updated_at=datetime.fromisoformat(attrs["updated_at"]),
        )
        saved += 1

    return saved, skipped


def ingest_predictions():
    """Fetch current predictions and save a row for each."""
    url = f"{BASE_URL}/predictions"
    params = {"filter[route]": ",".join(SUBWAY_ROUTES), "api_key": API_KEY}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()

    saved = 0
    skipped = 0
    for p in resp.json()["data"]:
        attrs = p["attributes"]
        rels = p["relationships"]
        route_data = rels.get("route", {}).get("data")

        if not route_data:
            skipped += 1
            continue

        try:
            route = Route.objects.get(route_id=route_data["id"])
        except Route.DoesNotExist:
            skipped += 1
            continue

        stop_data = rels.get("stop", {}).get("data")
        stop_id = stop_data["id"] if stop_data else ""

        trip_data = rels.get("trip", {}).get("data")
        trip_id = trip_data["id"] if trip_data else ""

        arrival = attrs.get("arrival_time")
        departure = attrs.get("departure_time")

        # Skip predictions with no arrival time — useless for delay calc
        if arrival is None:
            skipped += 1
            continue

        Prediction.objects.create(
            route=route,
            stop_id=stop_id,
            trip_id=trip_id,
            direction_id=attrs.get("direction_id"),
            arrival_time=datetime.fromisoformat(arrival),
            departure_time=datetime.fromisoformat(departure) if departure else None,
        )
        saved += 1

    return saved, skipped


def run_ingestion():
    """Full pass: ensure routes, then save vehicle snapshots and predictions."""
    routes = ensure_routes()
    v_saved, v_skipped = ingest_vehicles()
    p_saved, p_skipped = ingest_predictions()
    return {
        "routes": routes,
        "vehicles_saved": v_saved,
        "vehicles_skipped": v_skipped,
        "predictions_saved": p_saved,
        "predictions_skipped": p_skipped,
    }