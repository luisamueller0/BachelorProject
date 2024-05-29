import pandas as pd
from datetime import datetime
from neo4j import GraphDatabase
import time

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

"""811 seconds"""
# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            RETURN a.id AS artist_id
            """
        )
        return [record["artist_id"] for record in result]

def get_exhibition_ids(driver, artist_id):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)-[r:EXHIBITED_MODIFIED]->(e:Exhibition)
            WHERE a.id = $artist_id AND e.forUse = true
            RETURN COLLECT(e.id) AS exhibition_ids
            """, {"artist_id": artist_id}
        )
        return [{"exhibition_ids": record["exhibition_ids"]} for record in result]

def parse_date(date_str):
    if len(date_str) == 4:  # Year only
        return date_str + "-07-01"
    else:  # Full date
        return date_str

def update_artist_with_average_dates(driver, artist_id,participated_in_exhibition):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.participated_in_exhibition = $participated_in_exhibition
            """, {
                "artist_id": artist_id,
                "participated_in_exhibition": participated_in_exhibition
            }
        )

if __name__ == "__main__":
    start_time = time.time()
    
    # Step 1: Retrieve all artists
    all_artists = get_all_artists(driver)
    
    for artist_id in all_artists:
        try:
            # Step 2: Retrieve the necessary startdate and enddate for each artist
            data = get_exhibition_ids(driver, artist_id)
            
            if data:
                # Step 4: Update the artist node with the calculated average dates and duration
                update_artist_with_average_dates(driver, artist_id, data[0]["exhibition_ids"])
        except Exception as e:
            print(f"Error processing artist ID {artist_id}: {e}")
            continue
    
    # Close the driver when finished
    driver.close()
    
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
