""" from datetime import datetime
from neo4j import GraphDatabase
import json

import time 
# File path to your JSON data
file_path = 'ArtistsNew.json'

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:  # Ensure correct encoding
        data = json.load(file)
    return data

def update_artist_places(driver):
    data = load_json_data(file_path)
    print("Data read successfully")
    
    with driver.session() as session:
        for entry in data:
            artist_id = entry.get("ID")
            birthplace = entry.get("Place of Birth", "\\N")
            deathplace = entry.get("Place of Death", "\\N")
            
            session.run(
                
                MATCH (n:Artist {id: $artist_id})
                SET n.birthplace = $birthplace, n.deathplace = $deathplace
                ,
                artist_id=artist_id, birthplace=birthplace, deathplace=deathplace
            )
            

if __name__ == "__main__":
    start_time = time.time()
    update_artist_places(driver)
    driver.close()
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
 """""" 
from datetime import datetime
from neo4j import GraphDatabase
import json
import time

# File path to your geoName data
file_path_geo_name = 'geoName.json'

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:  # Ensure correct encoding
        data = json.load(file)
    return data

def find_country_for_place(place, geo_data):
    for entry in geo_data:
        if entry["place"] == place or entry["place_alt"] == place:
            return entry["country"]
    return "\\N"

def update_artist_countries(driver):
    geo_data = load_json_data(file_path_geo_name)
    print("Geo data loaded successfully")
    
    with driver.session() as session:
        # Fetch all artists with birthplace and deathplace
        result = session.run(
            MATCH (n:Artist)
            RETURN n.id as id, n.birthplace as birthplace, n.deathplace as deathplace
        )
        
        for record in result:
            artist_id = record["id"]
            birthplace = record["birthplace"]
            deathplace = record["deathplace"]
            
            birthCountry = find_country_for_place(birthplace, geo_data) if birthplace != "\\N" else "\\N"
            deathCountry = find_country_for_place(deathplace, geo_data) if deathplace != "\\N" else "\\N"
            
            session.run(
                
                MATCH (n:Artist {id: $artist_id})
                SET n.birthCountry = $birthCountry, n.deathCountry = $deathCountry
                ,
                artist_id=artist_id, birthCountry=birthCountry, deathCountry=deathCountry
            )

if __name__ == "__main__":
    start_time = time.time()
    update_artist_countries(driver)
    driver.close()
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
 """

from datetime import datetime
from neo4j import GraphDatabase
import json
import time

# File paths to your JSON data
file_path_deathplaces = 'deathplaces.json'
file_path_birthplaces = 'birthplaces.json'

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:  # Ensure correct encoding
        data = json.load(file)
    return data

def find_country_for_place(place, geo_data):
    for entry in geo_data:
        if entry["deathplace"] == place:
            return entry["country"]
    return "\\N"

def update_artist_countries(driver):
    deathplace_data = load_json_data(file_path_deathplaces)
    birthplace_data = load_json_data(file_path_birthplaces)
    print("Geo data loaded successfully")
    
    with driver.session() as session:
        # Fetch all artists with birthplace and deathplace
        result = session.run("""
            MATCH (n:Artist)
            RETURN n.id as id, n.birthplace as birthplace, n.deathplace as deathplace
        """)
        
        for record in result:
            artist_id = record["id"]
            birthplace = record["birthplace"]
            deathplace = record["deathplace"]
            
            birthCountry = find_country_for_place(birthplace, birthplace_data) if birthplace != "\\N" else "\\N"
            deathCountry = find_country_for_place(deathplace, deathplace_data) if deathplace != "\\N" else "\\N"
            
            session.run(
                """
                MATCH (n:Artist {id: $artist_id})
                SET n.birthCountry = $birthCountry, n.deathCountry = $deathCountry
                """,
                artist_id=artist_id, birthCountry=birthCountry, deathCountry=deathCountry
            )

if __name__ == "__main__":
    start_time = time.time()
    update_artist_countries(driver)
    driver.close()
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
