import pandas as pd
from datetime import datetime
from neo4j import GraphDatabase
import json
import time

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

def get_exhibition_dates(driver, artist_id):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)-[r:EXHIBITED_MODIFIED]->(e:Exhibition)
            WHERE a.id = $artist_id
            RETURN e.startdate AS startdate, e.enddate AS enddate
            """, {"artist_id": artist_id}
        )
        return [{"startdate": record["startdate"], "enddate": record["enddate"]} for record in result]

def update_artist_with_average_dates(driver, artist_id, avg_start_date, avg_end_date, overall_avg_date, avg_duration):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.avg_start_date = $avg_start_date,
                a.avg_end_date = $avg_end_date,
                a.overall_avg_date = $overall_avg_date,
                a.avg_duration = $avg_duration
            """, {
                "artist_id": artist_id,
                "avg_start_date": avg_start_date,
                "avg_end_date": avg_end_date,
                "overall_avg_date": overall_avg_date,
                "avg_duration": avg_duration
            }
        )

if __name__ == "__main__":
    artist_id = '2'
    
    # Step 1: Retrieve the necessary startdate and enddate
    data = get_exhibition_dates(driver, artist_id)
    
    if data:
        # Step 2: Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Convert the dates from strings to datetime
        df['startdate'] = pd.to_datetime(df['startdate'], format='%Y-%m-%d')
        df['enddate'] = pd.to_datetime(df['enddate'], format='%Y-%m-%d')
        
        # Calculate the average date for both startdate and enddate
        avg_start_date = df['startdate'].mean()
        avg_end_date = df['enddate'].mean()
        
        # Calculate the overall average date
        df['midpoint'] = df['startdate'] + (df['enddate'] - df['startdate']) / 2
        overall_avg_date = df['midpoint'].mean()
        
        # Calculate the average duration
        df['duration'] = (df['enddate'] - df['startdate']).dt.days
        avg_duration = df['duration'].mean()
        
        # Convert average dates to string format for Neo4j
        avg_start_date_str = avg_start_date.strftime('%Y-%m-%d')
        avg_end_date_str = avg_end_date.strftime('%Y-%m-%d')
        overall_avg_date_str = overall_avg_date.strftime('%Y-%m-%d')
        
        # Step 3: Update the artist node with the calculated average dates and duration
        update_artist_with_average_dates(driver, artist_id, avg_start_date_str, avg_end_date_str, overall_avg_date_str, avg_duration)
    
    # Close the driver when finished
    driver.close()
