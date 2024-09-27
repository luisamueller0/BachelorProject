from neo4j import GraphDatabase

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
            WHERE a.oldBirthCountry IS NULL OR a.oldDeathCountry IS NULL
            RETURN a.id AS artist_id, a.birthplace AS birth, a.deathplace AS death
            """
        )
        return [{"artist_id": record["artist_id"], "birth": record["birth"], "death": record["death"]} for record in result]

def find_old_country_for_place(driver, place_name):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (g:GeoName)
            WHERE g.place = $place_name AND g.oldCountry IS NOT NULL
            RETURN g.oldCountry AS old_country
            LIMIT 1
            """, {
                "place_name": place_name
            }
        )
        record = result.single()
        return record["old_country"] if record else None

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

if __name__ == "__main__":
    try:
        # Step 1: Retrieve all artists with missing oldBirthCountry or oldDeathCountry
        all_artists = get_all_artists(driver)
        
        for artist in all_artists:
            artist_id = artist['artist_id']
            birth_place = artist['birth']
            death_place = artist['death']

            try:
                # Find the old countries using GeoName
                old_birth_country = find_old_country_for_place(driver, birth_place) if birth_place else None
                old_death_country = find_old_country_for_place(driver, death_place) if death_place else None

                # Step 2: Update the artist with the determined old countries
                if old_birth_country or old_death_country:  # Only update if at least one value is found
                    update_artist_with_old_country(driver, artist_id, old_birth_country, old_death_country)
                    print(f"Finished processing artist with ID {artist_id}")
                else:
                    print(f"No old countries found for artist with ID {artist_id}")
            
            except Exception as e:
                print(f"Error processing artist ID {artist_id}: {e}")
                continue

    finally:
        # Close the driver when finished
        driver.close()
