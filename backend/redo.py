from neo4j import GraphDatabase

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

# Mapping of modern country codes to old country codes
country_mapping = {
    "IS": "IS",
    "SE": "SN", "NO": "SN",
    "DK": "DK",
    "GB": "UK", "IR": "UK",
    "RS": "RS",
    "FI": "RE", "LV": "RE", "EE": "RE", "RU": "RE", "BY": "RE", "GE": "RE",
    "ES": "ES",
    "PT": "PT",
    "IT": "IT",
    "MT": "MT",
    "TR": "OT",
    "MO": "MO",
    "LU": "LU",
    "BE": "BE",
    "NL": "NL",
    "BG": "BG",
    "FR": "FR",
    "AT": "AH", "HU": "AH", "SK": "AH", "SI": "AH", "CZ": "AH", "HR": "AH",
    "DE": "DE",
    "CH": "CH",
    "BA": "BA"
}

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            RETURN a.id AS artist_id, a.birthCountry AS birthcountry, a.deathCountry AS deathcountry
            """
        )
        return [{
            "artist_id": record["artist_id"], 
            "birthcountry": record["birthcountry"],
            "deathcountry": record["deathcountry"]
        } for record in result]

def update_artist_with_old_birth_country(driver, artist_id, old_birth_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.oldBirthCountry = $old_birth_country,
                a.changedB = true
            """, {
                "artist_id": artist_id,
                "old_birth_country": old_birth_country
            } 
        )

def update_artist_with_old_death_country(driver, artist_id, old_death_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.oldDeathCountry = $old_death_country,
                a.changedD = true
            """, {
                "artist_id": artist_id,
                "old_death_country": old_death_country
            }
        )

if __name__ == "__main__":
    try:
        # Step 1: Retrieve all artists
        all_artists = get_all_artists(driver)
        
        for artist in all_artists:
            artist_id = artist['artist_id']
            try:
                # Use the mapping to find old birth and death countries
                old_birth_country = country_mapping.get(artist['birthcountry'])
                old_death_country = country_mapping.get(artist['deathcountry'])
                
                # Update the artist's old birth country if a mapping was found
                if old_birth_country:
                    update_artist_with_old_birth_country(driver, artist_id, old_birth_country)
                    print(f"Updated birth country for artist with ID {artist_id}")
                
                # Update the artist's old death country if a mapping was found
                if old_death_country:
                    update_artist_with_old_death_country(driver, artist_id, old_death_country)
                    print(f"Updated death country for artist with ID {artist_id}")
                
                # If no mapping was found, skip
                if not old_birth_country and not old_death_country:
                    print(f"No mapping found for artist ID {artist_id}, skipping update.")
            
            except Exception as e:
                print(f"Error processing artist ID {artist_id}: {e}")
                continue

    finally:
        # Close the driver when finished
        driver.close()
