from neo4j import GraphDatabase

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

# Mapping for places to old countries
place_to_old_country = {
    "Cologne": "Germany",
    "Vienna": "Austria Hungary",
    "Prague": "Austria Hungary",
    "Venice": "Italy",
    "Moscow": "Russian Empire",
    "Saint Petersburg": "Russian Empire",
    "Munich": "Germany",
    "Dusseldorf": "Germany",
    "Ostend": "Belgium",
    "Brussels": "Belgium",
    "Florence": "Italy",
    "Christiania": "Sweden–Norway",
    "Zurich": "Switzerland",
    "Hague, The": "Netherlands",
    "Milan": "Italy",
    "Rome": "Italy",
    "Tokyo": "Imperial Japan",
    "Domburg": "Netherlands",
    "Geneva": "Switzerland",
    "Naples": "Italy",
    "Ekaterinoslav": "Russian Empire",
    "Gothenburg": "Sweden–Norway",
    "-": None,
    "Antwerp": "Belgium",
    "Ekaterinodar": "Russian Empire",
    "Ghent": "Belgium",
    "Helsingfors": "Russian Empire",
    "Cracow": "Austria Hungary",
    "Valašské Meziříčí": "Austria Hungary",
    "Brandenburg an der Havel": "Germany",
    "Copenhagen": "Denmark",
    "Breslau": "Germany",
    "Nikolaev": "Russian Empire"
}

def get_all_hosts(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (h:Host)
            WHERE h.place IS NOT NULL AND h.oldCountry IS NULL
            RETURN h.id AS host_id, h.place AS place
            """
        )
        return [{"host_id": record["host_id"], "place": record["place"]} for record in result]

def update_host_with_old_country(driver, host_id, old_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (h:Host {id: $host_id})
            SET h.oldCountry = $old_country
            """, {
                "host_id": host_id,
                "old_country": old_country
            }
        )

if __name__ == "__main__":
    try:
        # Step 1: Retrieve all hosts with a defined place
        all_hosts = get_all_hosts(driver)
        
        for host in all_hosts:
            host_id = host['host_id']
            place = host['place']

            # Step 2: Find the old country using the place_to_old_country mapping
            old_country = place_to_old_country.get(place)

            # Step 3: Update the host with the determined old country
            if old_country:  # Only update if an old country is found
                update_host_with_old_country(driver, host_id, old_country)
                print(f"Finished processing host with ID {host_id}")
            else:
                print(f"No old country found for host with ID {host_id}")
            
    except Exception as e:
        print(f"Error processing host ID {host_id}: {e}")

    finally:
        # Close the driver when finished
        driver.close()
