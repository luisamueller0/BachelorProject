from datetime import datetime
from neo4j import GraphDatabase
import json
from tqdm import tqdm  # Import tqdm for progress bar
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
# Update the techniques for each CatalogueEntry
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
        session.run("""
            UNWIND $data AS value
            WITH value.technique AS technique, value.category AS artForm

MATCH (n:CatalogueEntry)
WHERE n.technique = technique AND n.artForm = 'missing'
SET n.artForm = artForm
        """, data=data) 
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

