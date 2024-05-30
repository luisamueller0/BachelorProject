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
            WHERE e.startdate IS NOT NULL AND e.enddate IS NOT NULL AND e.forUse = true
            RETURN e.id AS exhibition_id, e.startdate AS startdate, e.enddate AS enddate
            """
        )
        return [{"exhibition_id": record["exhibition_id"], "startdate": record["startdate"], "enddate": record["enddate"]} for record in result]

def parse_date(date_str):
    if len(date_str) == 4:  # Year only
        return date_str + "-07-01"
    else:  # Full date
        return date_str

def update_exhibition_with_duration(driver, exhibition_id, duration):
    with driver.session() as session:
        session.run(
            """
            MATCH (e:Exhibition {id: $exhibition_id})
            SET e.duration = $duration
            """, {
                "exhibition_id": exhibition_id,
                "duration": duration
            }
        )

if __name__ == "__main__":
    start_time = time.time()
    
    # Step 1: Retrieve all exhibitions
    all_exhibitions = get_all_exhibitions(driver)
    
    for exhibition in all_exhibitions:
        try:
            # Parse dates
            start_date = pd.to_datetime(parse_date(exhibition["startdate"]), format='%Y-%m-%d')
            end_date = pd.to_datetime(parse_date(exhibition["enddate"]), format='%Y-%m-%d')
            
            # Calculate duration
            duration = (end_date - start_date).days + 1  # Consider the day it was as well, so that if start and enddate are the same, the exhibition is 1 day
            
            # Step 4: Update the exhibition node with the calculated duration
            update_exhibition_with_duration(driver, exhibition["exhibition_id"], duration)
        except Exception as e:
            print(f"Error processing exhibition ID {exhibition['exhibition_id']}: {e}")
            continue
    
    # Close the driver when finished
    driver.close()
    
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
