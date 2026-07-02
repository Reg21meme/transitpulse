import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("MBTA_API_KEY")

BASE_URL = "https://api-v3.mbta.com"

# The subway lines we care about. Green has branches (B/C/D/E) but the parent "Green" route id works for fetching its stops.
SUBWAY_ROUTES = ["Red", "Orange", "Blue", "Green-B", "Green-C", "Green-D", "Green-E"]


def fetch_stops_for_route(route_id):
    """Fetch all stops served by a given route."""
    url = f"{BASE_URL}/stops"
    params = {"filter[route]": route_id, "api_key": API_KEY}
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()["data"]


def main():
    total_stops = 0

    for route_id in SUBWAY_ROUTES:
        stops = fetch_stops_for_route(route_id)
        print(f"\n=== {route_id}: {len(stops)} stops ===")

        for stop in stops:
            attrs = stop["attributes"]
            stop_id = stop["id"]
            name = attrs["name"]
            lat = attrs["latitude"]
            lon = attrs["longitude"]
            print(f"  {stop_id:12}  {name:30}  ({lat}, {lon})")

        total_stops += len(stops)

    print(f"\nTotal stops across all subway routes: {total_stops}")


if __name__ == "__main__":
    main()