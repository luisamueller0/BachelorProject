import pandas as pd
from datetime import datetime
from neo4j import GraphDatabase
import time

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

def get_all_exhibitions(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (e:Exhibition)
            RETURN e.id AS exhibition_id, e.tookPlaceInCountry AS country
            """
        )
        return [{"exhibition_id": record["exhibition_id"], "country": record["country"]} for record in result]

def update_exhibition_with_european_region(driver, exhibition_id, region):
    with driver.session() as session:
        session.run(
            """
            MATCH (e:Exhibition {id: $exhibition_id})
            SET e.europeanRegion = $region
            """, {
                "exhibition_id": exhibition_id,
                "region": region
            }
        )

def determine_region(country_code):
    europeanRegions = {
        "North Europe": ["DK", "EE", "FI", "IS", "IE", "LV", "LT", "NO", "SE", "GB"],
        "Eastern Europe": ["AZ", "BY", "BG", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA", "AM", "GE"],
        "Southern Europe": ["BA", "HR", "GI", "GR", "IT", "ME", "PT", "RS", "SI", "ES", "AL", "AD", "MT", "MK", "SM"],
        "Western Europe": ["AT", "BE", "FR", "DE", "LU", "MC", "NL", "CH", "LI"],
        "Others": [
            "US", "AU", "GE", "MX", "AM", "IL", "CL", "AR", "CA", "DO", "PE", "JP", "TR",
            "BR", "ZA", "NZ", "VE", "GT", "UY", "SV", "PY", "IN", "PF", "KZ", "UZ", "VN", 
            "NA", "JO", "IR", "KH", "JM", "SA", "DZ", "CN", "EG", "VI", "ID", "CU", "TN", 
            "MQ", "MU", "LK", "EC", "SG", "BL", "TH", "BO"
        ] 
    }

    for region, countries in europeanRegions.items():
        if country_code in countries:
            return region
    return '\\N'  # Return null if no region matches

if __name__ == "__main__":
    start_time = time.time()
    
    # Step 1: Retrieve all exhibitions
    all_exhibitions = get_all_exhibitions(driver)
    
    for exhibition in all_exhibitions:
        exhibition_id = exhibition['exhibition_id']
        try:
            region = determine_region(exhibition['country'])
            
            # Step 2: Update the exhibition with the determined region
            update_exhibition_with_european_region(driver, exhibition_id, region)
            
        except Exception as e:
            print(f"Error processing exhibition ID {exhibition_id}: {e}")
            continue
    
    # Close the driver when finished
    driver.close()
    
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
