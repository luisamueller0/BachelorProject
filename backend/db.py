from datetime import datetime
from neo4j import GraphDatabase
import json

import time 

# Create a driver instance
"""
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

file_path = 'catalogue_entries.json'

def load_json_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def update_entriesTechniques(driver):
    data = load_json_data(file_path)
    print("data read")
    
    with driver.session() as session:
        session.run(
            UNWIND $data AS value
            WITH value.ID AS jsonID, value.Type AS jsonType

MATCH (n:CatalogueEntry)
WHERE n.id = toString(jsonID)
SET n.artForm = jsonType
        , data=data) 
    print(f"Updated {file_path} successfully.")

def getTotal(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:CatalogueEntry) RETURN count(n) as total", technique="\\N")
        print(result.single()['total'])

if __name__ == "__main__":
    getTotal(driver)
    start_time = time.time()
    update_entriesTechniques(driver)
   
    driver.close()  # Close the driver when finished
    end_time = time.time()
    execution_time = round( end_time - start_time ) # Calculate the execution time
    print(f"Execution time: {execution_time} seconds.")

"""
""" # Update the techniques for each CatalogueEntry
# Some catalogueEntries have missing artforms but techniques exist (905)
# Use of json "missing_artforms_categories.json" to update the artform for these entries
file_path = 'missing_artforms_categories.json'

# Create a driver instance
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:  # Specifying UTF-8 encoding
        data = json.load(file)
    return data


def update_entriesTechniques(driver):
    data = load_json_data(file_path)
    print("data read")
    
    with driver.session() as session:
        session.run(
            UNWIND $data AS value
            WITH value.technique AS technique, value.category AS artForm

MATCH (n:CatalogueEntry)
WHERE n.technique = technique AND n.artForm = 'missing'
SET n.artForm = artForm
        , data=data) 
    print(f"Updated {file_path} successfully.")

def getTotal(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:CatalogueEntry) RETURN count(n) as total", technique="\\N")
        print(result.single()['total'])

if __name__ == "__main__":
    getTotal(driver)
    start_time = time.time()
    update_entriesTechniques(driver)
   
    driver.close()  # Close the driver when finished
    end_time = time.time()
    execution_time = round( end_time - start_time ) # Calculate the execution time
    print(f"Execution time: {execution_time} seconds.")
 """
""" # Create GeoName label from official neo4j website to get a way to retrieve the birthcountry from artist birthplaces
# Use of json "geoName.json" to create these labels
file_path = 'geoName.json'

# Create a driver instance
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:  # Specify UTF-8 encoding here
        data = json.load(file)
    return data

def create_entries(driver):
    data = load_json_data(file_path)
    print("data read")
    
    with driver.session() as session:
        result = session.run(
            UNWIND $data AS geoName
            CREATE (n:GeoName {
                country: geoName.country,
                place_alt: geoName.place_alt,
                latitude: geoName.latitude,
                tgn: geoName.tgn,
                place: geoName.place,
                id: geoName.id,
                type: geoName.type,
                longitude: geoName.longitude
            })
RETURN count(n) as createdNodes
        , data=data)
        print(f"Nodes created: {result.single()['createdNodes']}")
    print(f"Updated database with data from {file_path} successfully.")

def getTotal(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:CatalogueEntry) RETURN count(n) as total", technique="\\N")
        print(result.single()['total'])

if __name__ == "__main__":
    start_time = time.time()
    create_entries(driver)
    driver.close()  # Close the driver when finished
    end_time = time.time()
    execution_time = round( end_time - start_time ) # Calculate the execution time
    print(f"Execution time: {execution_time} seconds.") """

# Create GeoName label from official neo4j website to get a way to retrieve the birthcountry from artist birthplaces
# Use of json "geoName.json" to create these labels
""" file_path = 'artists.json'

# Create a driver instance
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))


def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:  # Specifying UTF-8 encoding
        data = json.load(file)
    return data


def update_entriesTechniques(driver):
    data = load_json_data(file_path)
    data  = [entry['n']['properties'] for entry in data]
    print("data read")
  
    
    with driver.session() as session:
        session.run(
         UNWIND $data AS value
            MATCH (n:Artist {id: value.id})
            SET n.pnd = value.pnd, n.ulan = value.ulan
        , data=data) 
    print(f"Updated {file_path} successfully.")

def getTotal(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:Artist) RETURN count(n) as total")
        print(result.single()['total'])

if __name__ == "__main__":
    getTotal(driver)
    start_time = time.time()
    update_entriesTechniques(driver)
   
    driver.close()  # Close the driver when finished
    end_time = time.time()
    execution_time = round( end_time - start_time ) # Calculate the execution time
    print(f"Execution time: {execution_time} seconds.") """

""" file_path = 'exhibitionTimeData.json'

# Create a driver instance
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))


def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:  # Specifying UTF-8 encoding
        data = json.load(file)
    return data
def update_exhibitionDates(driver):
    data = load_json_data(file_path)
    print("data read")
    with driver.session() as session:
        session.run(
         UNWIND $data AS ex
            WITH  ex.start_date as start, ex.end_date as end
            MATCH (n:Exhibition {id: toString(ex.id)})
            SET n.startdate = start, n.enddate = end
            , data=data) 
    print(f"Updated {file_path} successfully.")

def getTotal(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:Exhibition) RETURN count(n) as total")
        print(result.single()['total'])

if __name__ == "__main__":
    getTotal(driver)
    start_time = time.time()
    update_exhibitionDates(driver)
   
    driver.close()  # Close the driver when finished
    end_time = time.time()
    execution_time = round( end_time - start_time ) # Calculate the execution time
    print(f"Execution time: {execution_time} seconds.")

         """
# Use exhibition cities data to update the city property of Exhibition nodes (of website)
""" import json
from neo4j import GraphDatabase

file_path_exhibition_cities = 'exhibitionCities.json'

uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))


def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:
        data = json.load(file)
    return data

def get_all_exhibitions(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:Exhibition) RETURN n.id as id")
        return [{"id": record["id"]} for record in result]

def update_exhibition_city(driver, exhibition_id, city):
    with driver.session() as session:
        session.run(
            "MATCH (n:Exhibition {id: $id}) SET n.city = $city",
            id=exhibition_id, city=city
        )

def update_exhibitions_with_city(driver):
    exhibitions = get_all_exhibitions(driver)
    exhibition_cities = load_json_data(file_path_exhibition_cities)

    # Create a dictionary with ID as string keys to match with Neo4j IDs
    city_data = {str(entry['ID']): entry['City'] for entry in exhibition_cities}

    for exhibition in exhibitions:
        ex_id = str(exhibition['id'])  # Convert to string to match dictionary keys
        if ex_id in city_data:
            city = city_data[ex_id]
            update_exhibition_city(driver, ex_id, city)
            print(f"Updated exhibition {ex_id} with city {city}")
        else:
            print(f"City not found for exhibition {ex_id}")

if __name__ == "__main__":
    start_time = time.time()
    update_exhibitions_with_city(driver)
    driver.close()
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
 """

import json
from neo4j import GraphDatabase

# File paths
file_path_exhibition_cities = 'exhibitionCities.json'
file_path_geo_name = 'geoName.json'

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:
        data = json.load(file)
    return data

def get_exhibitions_with_city(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:Exhibition) WHERE n.city IS NOT NULL RETURN n.id as id, n.city as city")
        return [{"id": record["id"], "city": record["city"]} for record in result]

def update_exhibition_country(driver, exhibition_id, country):
    with driver.session() as session:
        session.run(
            "MATCH (n:Exhibition {id: $id}) SET n.country = $country",
            id=exhibition_id, country=country
        )

def find_country_for_city(city, geo_data):
    for entry in geo_data:
        if entry["place"] == city or entry["place_alt"] == city:
            return entry["country"]
    return None

def update_exhibitions_with_country(driver):
    exhibitions = get_exhibitions_with_city(driver)
    geo_data = load_json_data(file_path_geo_name)

    for exhibition in exhibitions:
        city = exhibition['city']
        country = find_country_for_city(city, geo_data)
        if country:
            update_exhibition_country(driver, exhibition['id'], country)
            print(f"Updated exhibition {exhibition['id']} with country {country}")
        else:
            print(f"Country not found for city {city}")

if __name__ == "__main__":
    start_time = time.time()
    update_exhibitions_with_country(driver)
    driver.close()
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")

    
