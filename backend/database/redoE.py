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

def get_all_exhibitions(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (e:Exhibition)
            RETURN e.id AS exhibition_id, e.country AS country
            """
        )
        return [{
            "exhibition_id": record["exhibition_id"],
            "country": record["country"]
        } for record in result]

def update_exhibition_with_old_country(driver, exhibition_id, took_place_in_old_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (e:Exhibition {id: $exhibition_id})
            SET e.tookPlaceInOldCountry = $took_place_in_old_country,
                e.changed = true
            """, {
                "exhibition_id": exhibition_id,
                "took_place_in_old_country": took_place_in_old_country
            }
        )

if __name__ == "__main__":
    try:
        # Retrieve all exhibitions
        all_exhibitions = get_all_exhibitions(driver)
        
        for exhibition in all_exhibitions:
            exhibition_id = exhibition['exhibition_id']
            try:
                # Use the mapping to find the old country for the exhibition
                took_place_in_old_country = country_mapping.get(exhibition['country'])
                
                # Update the exhibition if a mapping was found
                if took_place_in_old_country:
                    update_exhibition_with_old_country(driver, exhibition_id, took_place_in_old_country)
                    print(f"Updated exhibition with ID {exhibition_id}")
                else:
                    print(f"No mapping found for exhibition ID {exhibition_id}, skipping update.")
            
            except Exception as e:
                print(f"Error processing exhibition ID {exhibition_id}: {e}")
                continue

    finally:
        # Close the driver when finished
        driver.close()
