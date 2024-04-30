from datetime import datetime
from neo4j import GraphDatabase
import json
from tqdm import tqdm  # Import tqdm for progress bar

# Create a driver instance
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"
driver = GraphDatabase.driver(uri, auth=(username, password))

file_path = 'catalogue_entries_0.json'

def load_json_data(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def update_entriesTechniques(driver):
    data = load_json_data(file_path)
    print("data read")
    print(data)
    with driver.session() as session:
        session.run("""
            UNWIND $data AS value
            WITH value.ID AS jsonID, value.Type AS jsonType
MATCH (n:CatalogueEntry)
WHERE n.id = toString(jsonID)
SET n.tech = jsonType
        """, data=data) 
    print(f"Updated {file_path} successfully.")

def getTotal(driver):
    with driver.session() as session:
        result = session.run("MATCH (n:CatalogueEntry) RETURN count(n) as total", technique="\\N")
        print(result.single()['total'])

if __name__ == "__main__":
    getTotal(driver)
    update_entriesTechniques(driver)
    driver.close()  # Close the driver when finished