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

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            RETURN a.id AS artist_id
            """
        )
        return [record["artist_id"] for record in result]

def get_exhibition_dates(driver, artist_id):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)-[r:EXHIBITED_MODIFIED]->(e:Exhibition)
            WHERE a.id = $artist_id AND e.startdate IS NOT NULL AND e.enddate IS NOT NULL
            RETURN e.startdate AS startdate, e.enddate AS enddate
            """, {"artist_id": artist_id}
        )
        return [{"startdate": record["startdate"], "enddate": record["enddate"]} for record in result]

def parse_date(date_str):
    if len(date_str) == 4:  # Year only
        return date_str + "-07-01"
    else:  # Full date
        return date_str

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
    start_time = time.time()
    
    # Step 1: Retrieve all artists
    all_artists = get_all_artists(driver)
    
    for artist_id in all_artists:
        try:
            # Step 2: Retrieve the necessary startdate and enddate for each artist
            data = get_exhibition_dates(driver, artist_id)
            
            if data:
                # Step 3: Convert to DataFrame
                df = pd.DataFrame(data)

                df['startdate'] = df['startdate'].apply(parse_date)
                df['enddate'] = df['enddate'].apply(parse_date)
                
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
                df['duration'] = (df['enddate'] - df['startdate']).dt.days + 1  # Consider the day it was as well, so that if start and enddate are the same, the exhibition is 1 day
                avg_duration = df['duration'].mean()
                
                # Convert average dates to string format for Neo4j
                avg_start_date_str = avg_start_date.strftime('%Y-%m-%d')
                avg_end_date_str = avg_end_date.strftime('%Y-%m-%d')
                overall_avg_date_str = overall_avg_date.strftime('%Y-%m-%d')
                
                # Step 4: Update the artist node with the calculated average dates and duration
                update_artist_with_average_dates(driver, artist_id, avg_start_date_str, avg_end_date_str, overall_avg_date_str, avg_duration)
        except Exception as e:
            print(f"Error processing artist ID {artist_id}: {e}")
            continue
    
    # Close the driver when finished
    driver.close()
    
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
