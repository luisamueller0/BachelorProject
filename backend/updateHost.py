from neo4j import GraphDatabase

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

# Mapping for places to old countries
place_to_old_country = {
    "Warsaw": "RE",  # Russian Empire
    "Rotterdam": "NL",
    "Breslau": "DE",  # Germany
    "Wartha (Niederschlesien, Region)": "DE",  # Germany
    "Golluschütz (Westpreussen)": "DE",  # Germany
    "Hamburg": "DE",
    "Sýňovská Nowá Wes": "AH",  # Austria Hungary
    "Șandra": "AH",  # Austria Hungary
    "Danzig": "DE",  # Germany
    "Feodosiya": "RE",  # Russian Empire
    "Clifton (Ontario)": "CA",
    "London, Ontario": "CA",
    "Elbing": "DE",  # Germany
    "Yendrikhovtsy": "RE",  # Russian Empire
    "Gleiwitz": "DE",  # Germany
    "Lviv": "AH",  # Austria Hungary
    "Cracow": "AH",  # Austria Hungary
    "Deva, Romania": "AH",  # Austria Hungary
    "Versailles": "FR",
    "Krapivna": "RE",  # Russian Empire
    "Yevpatoria": "RE",  # Russian Empire
    "Słupsk": "DE",  # Germany
    "Grottkau": "DE",  # Germany
    "Fichtwerder (bei Landsberg an der Warthe)": "DE",  # Germany
    "Bremen": "DE",
    "Szczebrzeszyn": "AH",  # Austria Hungary
    "Ząbkowice Śląskie": "DE",  # Germany
    "Stargard in Pommern": "DE",  # Germany
    "Peleș": "AH",  # Austria Hungary
    "Preußisch Holland": "DE",  # Germany
    "Luborzyca bei Miechów": "AH",  # Austria Hungary
    "Korelivschyna": "RE",  # Russian Empire
    "Ekaterinoslav": "RE",  # Russian Empire
    "Reteag": "AH",  # Austria Hungary
    "Baja": "AH",  # Austria Hungary
    "Chişinău": "RE",  # Russian Empire
    "Kukhi (near Kutaisi)": "RE",  # Russian Empire
    "Lublin": "RE",  # Russian Empire
    "Milan": "IT",
    "Ponjemon": "RE",  # Russian Empire
    "Wszeliwy": "AH",  # Austria Hungary
    "Howick, Ontario": "CA",
    "Charlottetown": "CA",
    "Bukowicz": "AH",  # Austria Hungary
    "Saint John, New Brunswick": "CA",
    "\\N": "\\N",  # Unknown
    "Kałusz": "AH",  # Austria Hungary
    "Barszczowice": "AH",  # Austria Hungary
    "Alexandria": "EG",
    "Jarosław": "AH",  # Austria Hungary
    "Asunción": "PY",
    "Guaira de la Melena, Cuba": "CU",
    "Lipiny (Świętochłowice)": "DE",  # Germany
    "Picton (Canada)": "CA",
    "Londesborough": "GB",
    "Samborsko": "AH",  # Austria Hungary
    "Freiburg im Breisgau": "DE",
    "Reinbek": "DE",
    "Dunedin": "NZ",
    "Lębork": "DE",  # Germany
    "Brody, Żary County": "DE",  # Germany
    "Kowary": "DE",  # Germany
    "Birnbaum": "DE",  # Germany
    "Victoria, British Columbia": "CA",
    "Tournai": "BE",
    "Tyszowce": "AH",  # Austria Hungary
    "Wólka Zerzeńska": "AH",  # Austria Hungary
    "Havana": "CU",
    "Stettin": "DE",  # Germany
    "Niigata": "IJ"  # Imperial Japan
}

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (n:Artist)
            WHERE n.oldBirthCountry IS NULL
            RETURN n.id AS artist_id, n.birthplace AS birthplace
            """
        )
        return [{"artist_id": record["artist_id"], "birthplace": record["birthplace"]} for record in result]

def update_artist_with_old_birth_country(driver, artist_id, old_birth_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (n:Artist {id: $artist_id})
            SET n.oldBirthCountry = $old_birth_country
            """, {
                "artist_id": artist_id,
                "old_birth_country": old_birth_country
            }
        )

if __name__ == "__main__":
    try:
        # Step 1: Retrieve all artists with a defined birthplace but missing oldBirthCountry
        all_artists = get_all_artists(driver)
        
        for artist in all_artists:
            artist_id = artist['artist_id']
            birthplace = artist['birthplace']

            # Step 2: Find the old country using the place_to_old_country mapping
            old_birth_country = place_to_old_country.get(birthplace)

            # Step 3: Update the artist with the determined old country
            if old_birth_country:  # Only update if an old country is found
                update_artist_with_old_birth_country(driver, artist_id, old_birth_country)
                print(f"Finished processing artist with ID {artist_id}")
            else:
                print(f"No old country found for artist with ID {artist_id}")
            
    except Exception as e:
        print(f"Error processing artist ID {artist_id}: {e}")

    finally:
        # Close the driver when finished
        driver.close()
