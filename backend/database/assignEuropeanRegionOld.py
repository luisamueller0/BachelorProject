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
            RETURN a.id AS artist_id, a.oldBirthCountry AS old_birth, a.oldDeathCountry AS old_death, a.mostExhibitedInOldCountry AS old_most
            """
        )
        return [{"artist_id": record["artist_id"], "old_birth": record["old_birth"], "old_death": record["old_death"], "old_most": record["old_most"]} for record in result]

def update_artist_with_european_region(driver, artist_id, birth_region, death_region, most_region):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.europeanRegionOldBirthCountry = $birth_region,
                a.europeanRegionOldDeathCountry = $death_region,
                a.europeanRegionOldMostExhibitedInCountry = $most_region
            """, {
                "artist_id": artist_id,
                "birth_region": birth_region,
                "death_region": death_region,
                "most_region": most_region
            }
        )

def determine_region(country_code):
    oldEuropeanRegions = {
        "North Europe": ["IS", "SN", "DK","UK"],
        "Eastern Europe": ["RO", "SR", "BU", "RE"],
        "Southern Europe": ["ES", "PT", "IT", "GR", "MT", "OT","RS", "MO", "BH"],
        "Western Europe": ["LU", "BE", "NL", "FR","BG"],
        "Central Europe": ["AH", "DE", "CH"],
        "Others": [
            "AF", "AG", "AN", "AR", "AU", "BA", "BO", "BR", "BRJ", "CA", "CC", "CEY", "CL", "CR", "CU", "CZ", "DO",
            "DZ", "EC", "EG", "HK", "ID", "IE", "IJ", "IN", "JP", "KH", "KH", "LU", "MX", "NEI", "NL", "NZ", "PE", "PY",
            "QLD", "RAT", "SA", "SE", "SG", "SR", "SV", "TN", "TV", "UY", "VIC", "WA", "ZA","US", "NSW", "GT", "JM", "MA", 
            "MC", "MU", "MY", "PH", "PR", "TH", "TR", "VN", "CD", "CW", "SY", "GY",
            "M?ori","ME","FI","VE","GI", "NA", "PF"
        ],
        "\\N": ["\\N"]
    } 

    for region, countries in oldEuropeanRegions.items():
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
            birth_region = determine_region(artist['old_birth'])
            death_region = determine_region(artist['old_death'])
            most_region = determine_region(artist['old_most'])
            
            # Step 2: Update the artist with the determined regions
            update_artist_with_european_region(driver, artist_id, birth_region, death_region, most_region)
            
        except Exception as e:
            print(f"Error processing artist ID {artist_id}: {e}")
            continue
    
    # Close the driver when finished
    driver.close()
    
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")