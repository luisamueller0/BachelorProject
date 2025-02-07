import pandas as pd
from datetime import datetime
from neo4j import GraphDatabase
import time

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            RETURN a.id AS artist_id, a.country AS nat, a.birthCountry AS birth, a.deathCountry AS death, a.mostExhibitedInCountry AS most
            """
        )
        return [{"artist_id": record["artist_id"], "nat": record["nat"], "birth": record["birth"], "death": record["death"], "most": record["most"]} for record in result]

def update_artist_with_european_region(driver, artist_id, nat, birth, death, most):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.europeanRegionNationality = $nat,
                a.europeanRegionBirthCountry = $birth,
                a.europeanRegionDeathCountry = $death,
                a.europeanRegionMostExhibitedInCountry = $most
            """, {
                "artist_id": artist_id,
                "nat": nat,
                "birth": birth,
                "death": death,
                "most": most
            }
        )

def determine_region(country_code):
    europeanRegions = {
        "North Europe": ["DK", "EE", "FI", "IE", "LV", "LT", "NO", "SE", "GB"],
        "Eastern Europe": ["BY", "BG", "CZ", "HU", "PL", "MD", "RO", "RU", "SK", "UA"],
        "Southern Europe": ["BA", "HR", "GI", "GR", "IT", "ME", "PT", "RS", "SI", "ES", "XK","MT", "MK"],
     "Western Europe": ["AT", "BE", "FR", "DE", "LU", "NL", "CH"],
     "Others": ["ID", "US", "AU", "CA", "GE", "DZ", "MX", "AZ", "EE", "AR", "UY", "CU", "TN", "EG", "TR", "VI", "DO", 
           "JP", "MQ", "IN", "MU", "CL", "ZA", "NZ", "KH", "VE", "GT", "SV", "PY", "LK", "EC", "BR", "SG", "BL", 
           "PE", "TH", "PF", "AM", "IL", "MC", "CN", "UZ", "KZ", "MA", "BO", "VN", "NA", "JO", "IR", "JM", "SA", "CD", "CW","SY","GY"]
    }

    
    for region, countries in europeanRegions.items():
        if country_code in countries:
            return region
    return '\\N'  # Return null if no region matches

if __name__ == "__main__":
    start_time = time.time()
    
    # Step 1: Retrieve all artists
    all_artists = get_all_artists(driver)
    
    for artist in all_artists:
        artist_id = artist['artist_id']
        try:
            nat_region = determine_region(artist['nat'])
            birth_region = determine_region(artist['birth'])
            death_region = determine_region(artist['death'])
            most_region = determine_region(artist['most'])
            
            # Step 2: Update the artist with the determined regions
            update_artist_with_european_region(driver, artist_id, nat_region, birth_region, death_region, most_region)
            
        except Exception as e:
            print(f"Error processing artist ID {artist_id}: {e}")
            continue
    
    # Close the driver when finished
    driver.close()
    
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
