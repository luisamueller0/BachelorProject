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
    "BA": "BH"
}

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            RETURN a.id AS artist_id, a.mostExhibitedInCountry AS mostExhibitedInCountry
            """
        )
        return [{
            "artist_id": record["artist_id"], 
            "mostExhibitedInCountry": record["mostExhibitedInCountry"]
        } for record in result]

def update_artist_with_old_exhibition_country(driver, artist_id, most_exhibited_in_old_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.mostExhibitedInOldCountry = $most_exhibited_in_old_country,
                a.changedM= true
            """, {
                "artist_id": artist_id,
                "most_exhibited_in_old_country": most_exhibited_in_old_country
            }
        )

if __name__ == "__main__":
    try:
        # Retrieve all artists
        all_artists = get_all_artists(driver)
        
        for artist in all_artists:
            artist_id = artist['artist_id']
            try:
                # Use the mapping to find old most exhibited country
                most_exhibited_in_old_country = country_mapping.get(artist['mostExhibitedInCountry'])
                
                # Update the artist's old most exhibited country if a mapping was found
                if most_exhibited_in_old_country:
                    update_artist_with_old_exhibition_country(driver, artist_id, most_exhibited_in_old_country)
                    print(f"Updated most exhibited country for artist with ID {artist_id}")
                else:
                    print(f"No mapping found for artist ID {artist_id}, skipping update.")
            
            except Exception as e:
                print(f"Error processing artist ID {artist_id}: {e}")
                continue

    finally:
        # Close the driver when finished
        driver.close()
