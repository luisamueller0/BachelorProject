import geopandas as gpd
from shapely.geometry import Point
from neo4j import GraphDatabase
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import pickle
import os

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

# Cache file to store geocoding results (optional if you want to cache)
cache_file = "geocode_cache.pkl"

# Load cache if it exists
if os.path.exists(cache_file):
    with open(cache_file, 'rb') as f:
        geocode_cache = pickle.load(f)
else:
    geocode_cache = {}

# Load the old geojson map
old_data = gpd.read_file('oldMap.geojson')

# Function to find the old country based on latitude and longitude
def find_country(geodata, lat, lon):
    point = Point(lon, lat)
    
    # Check which country the point is located in
    for _, feature in geodata.iterrows():
        country_shape = feature.geometry
        if country_shape.contains(point):
            return feature['NAME']  # Adjust based on the GeoDataFrame's structure
    
    return None

# Fallback: Geocode function to find the country name based on latitude and longitude
def geocode_country(lat, lon):
    # Use the geocode cache to prevent redundant API calls
    if (lat, lon) in geocode_cache:
        return geocode_cache[(lat, lon)]
    
    geolocator = Nominatim(user_agent="geoapiExercises")
    try:
        location = geolocator.reverse(f"{lat}, {lon}", language="en", exactly_one=True)
        if location:
            address = location.raw.get("address", {})
            country = address.get("country")
            geocode_cache[(lat, lon)] = country  # Cache the result
            return country
        return None
    except GeocoderTimedOut:
        return None

# Get all GeoName records where oldCountry is NULL
def get_all_geonames(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (n:GeoName)
            WHERE n.oldCountry IS NULL
            RETURN n.id AS geoname_id, n.latitude AS latitude, n.longitude AS longitude
            """
        )
        return [{"geoname_id": record["geoname_id"], "latitude": record["latitude"], "longitude": record["longitude"]} for record in result]

# Update GeoName with old country in Neo4j
def update_geoname_with_old_country(driver, geoname_id, old_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (n:GeoName {id: $geoname_id})
            SET n.oldCountry = $old_country
            """, {
                "geoname_id": geoname_id,
                "old_country": old_country
            }
        )

if __name__ == "__main__":
    try:
        # Step 1: Retrieve all GeoName records where oldCountry is NULL
        all_geonames = get_all_geonames(driver)
        
        for geoname in all_geonames:
            geoname_id = geoname['geoname_id']
            latitude = geoname['latitude']
            longitude = geoname['longitude']
            
            if latitude is None or longitude is None:
                print(f"Skipping GeoName with ID {geoname_id} due to missing coordinates.")
                continue

            try:
                # Try to find the old country based on coordinates
                print(f"Processing GeoName ID {geoname_id} with coordinates ({latitude}, {longitude})")
                old_country = find_country(old_data, latitude, longitude)
                
                # If no country found, fallback to geocoding
                if not old_country:
                    print(f"No old country found in GeoJSON for GeoName ID {geoname_id}, trying geocoder...")
                    old_country = geocode_country(latitude, longitude)
                
                if old_country:
                    # Step 2: Update the GeoName with the determined old country
                    update_geoname_with_old_country(driver, geoname_id, old_country)
                    print(f"GeoName ID {geoname_id} updated with oldCountry: {old_country}")
                else:
                    print(f"No country found for GeoName ID {geoname_id} at coordinates ({latitude}, {longitude})")
            
            except Exception as e:
                print(f"Error processing GeoName ID {geoname_id}: {e}")
                continue

        # Save the cache at the end of the script (if using caching)
        with open(cache_file, 'wb') as f:
            pickle.dump(geocode_cache, f)

    finally:
        # Close the driver when finished
        driver.close()
