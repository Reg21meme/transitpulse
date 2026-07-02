import os
import requests
from dotenv import load_dotenv

# Load the API key from .env
load_dotenv()
API_KEY = os.getenv("MBTA_API_KEY")

BASE_URL = "https://api-v3.mbta.com"

def fetch_red_line_vehicles():
    """Fetch live Red Line vehicle positions from the MBTA API."""
    url = f"{BASE_URL}/vehicles"
    params = {"filter[route]": "Red", "api_key": API_KEY}
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()  # crash loudly if the request failed
    return response.json()

def main():
    data = fetch_red_line_vehicles()
    vehicles = data["data"]

    print(f"Found {len(vehicles)} Red Line vehicles\n")

    for v in vehicles:
        attrs = v["attributes"]
        vehicle_id = v["id"]
        status = attrs["current_status"]
        direction = attrs["direction_id"]
        lat = attrs["latitude"]
        lon = attrs["longitude"]
        updated = attrs["updated_at"]

        # The stop it's at / heading toward lives in relationships
        stop = v["relationships"]["stop"]["data"]
        stop_id = stop["id"] if stop else "unknown"

        direction_label = "North" if direction == 1 else "South"

        print(
            f"{vehicle_id}  {status:14}  {direction_label:5}  "
            f"stop={stop_id:10}  ({lat:.4f}, {lon:.4f})  {updated}"
        )

if __name__ == "__main__":
    main()