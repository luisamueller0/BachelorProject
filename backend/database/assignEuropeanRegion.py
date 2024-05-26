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
            RETURN a.id AS artist_id, a.country AS nat, a.birth AS birth, a.death AS death, a.most AS most
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
        "North Europe": ["DK", "EE", "FI", "IS", "IE", "LV", "LT", "NO", "SE"],
        "Eastern Europe": ["AZ", "BY", "BG", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA"],
        "Southern Europe": ["BA", "HR", "GI", "GR", "IT", "ME", "PT", "RS", "SI", "ES"],
        "Western Europe": ["AT", "BE", "FR", "DE", "LU", "MC", "NL", "CH", "GB"],
        "Others": [
            "US", "AU", "GE", "MX", "AM", "IL", "CL", "AR", "CA", "DO", "PE", "JP", "TR",
            "BR", "ZA", "NZ", "VE", "GT", "UY", "SV", "PY", "IN", "PF", "KZ", "UZ", "VN", 
            "NA", "JO", "IR", "KH", "JM", "SA", "DZ", "CN", "EG", "VI", "ID", "CU", "TN", 
            "MQ", "MU", "LK", "EC", "SG", "BL", "TH", "BO"
        ]
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
