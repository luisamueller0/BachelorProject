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

# Cache file to store geocoding results
cache_file = "geocode_cache.pkl"

# Load cache if it exists
if os.path.exists(cache_file):
    with open(cache_file, 'rb') as f:
        geocode_cache = pickle.load(f)
else:
    geocode_cache = {}

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            RETURN a.id AS artist_id, a.birthplace AS birth, a.deathplace AS death
            """
        )
        return [{"artist_id": record["artist_id"], "birth": record["birth"], "death": record["death"]} for record in result]

def update_artist_with_old_country(driver, artist_id, old_birth_country, old_death_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.oldBirthCountry = $old_birth_country,
                a.oldDeathCountry = $old_death_country
            """, {
                "artist_id": artist_id,
                "old_birth_country": old_birth_country,
                "old_death_country": old_death_country
            }
        )

# Geocode function to convert city names to latitude and longitude, with caching
def geocode_city(city_name):
    if city_name in geocode_cache:
        return geocode_cache[city_name]

    geolocator = Nominatim(user_agent="geoapiExercises")
    try:
        location = geolocator.geocode(city_name)
        if location:
            geocode_cache[city_name] = {"lat": location.latitude, "lon": location.longitude}
            return geocode_cache[city_name]
        return None
    except GeocoderTimedOut:
        return None

# Load the old geojson map
old_data = gpd.read_file('oldMap.geojson')

def find_country(geodata, lat, lon):
    point = Point(lon, lat)
    
    # Check which country the point is located in
    for _, feature in geodata.iterrows():
        country_shape = feature.geometry
        if country_shape.contains(point):
            return feature['NAME']  # Adjust based on the GeoDataFrame's structure
    
    return None

if __name__ == "__main__":
    try:
        # Step 1: Retrieve all artists
        all_artists = get_all_artists(driver)
        
        for artist in all_artists:
            artist_id = artist['artist_id']
            try:
                # Geocode the birth and death cities to get coordinates
                birth_place = geocode_city(artist['birth'])
                death_place = geocode_city(artist['death'])

                # Find the old birth and death countries based on coordinates
                old_birth_country = find_country(old_data, birth_place['lat'], birth_place['lon']) if birth_place else None
                old_death_country = find_country(old_data, death_place['lat'], death_place['lon']) if death_place else None
                
                # Step 2: Update the artist with the determined old countries
                update_artist_with_old_country(driver, artist_id, old_birth_country, old_death_country)
                print(f"Finished processing artist with ID {artist_id}")
            
            except Exception as e:
                print(f"Error processing artist ID {artist_id}: {e}")
                continue

        # Save the cache at the end of the script
        with open(cache_file, 'wb') as f:
            pickle.dump(geocode_cache, f)

    finally:
        # Close the driver when finished
        driver.close()
