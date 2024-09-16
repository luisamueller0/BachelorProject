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
            RETURN e.id AS exhibition_id, e.tookPlaceInOldCountry AS old_country
            """
        )
        return [{"exhibition_id": record["exhibition_id"], "old_country": record["old_country"]} for record in result]

def update_exhibition_with_old_european_region(driver, exhibition_id, old_region):
    with driver.session() as session:
        session.run(
            """
            MATCH (e:Exhibition {id: $exhibition_id})
            SET e.oldEuropeanRegion = $old_region
            """, {
                "exhibition_id": exhibition_id,
                "old_region": old_region
            }
        )

def determine_old_region(country_code):
    oldEuropeanRegions = {
        "North Europe": ["IS", "SN", "DK", "UK"],
        "Eastern Europe": ["RO", "SR", "BU", "RE"],
        "Southern Europe": ["ES", "PT", "IT", "GR", "MT", "OT", "RS", "MO", "BH"],
        "Western Europe": ["LU", "BE", "NL", "FR", "BG"],
        "Central Europe": ["AH", "DE", "CH"],
        "Others": [
            "AF", "AG", "AN", "AR", "AU", "BA", "BO", "BR", "BRJ", "CA", "CC", "CEY", "CL", "CR", "CU", "CZ", "DO",
            "DZ", "EC", "EG", "HK", "ID", "IE", "IJ", "IN", "JP", "KH", "LU", "MX", "NEI", "NL", "NZ", "PE", "PY",
            "QLD", "RAT", "SA", "SE", "SG", "SR", "SV", "TN", "TV", "UY", "VIC", "WA", "ZA", "US", "NSW", "GT", "JM", "MA",
            "MC", "MU", "MY", "PH", "PR", "TH", "TR", "VN", "CD", "CW", "SY", "GY",
            "M?ori", "ME", "FI", "VE", "GI", "NA", "PF"
        ],
        "\\N": ["\\N"]
    }

    for region, countries in oldEuropeanRegions.items():
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
            old_region = determine_old_region(exhibition['old_country'])
            
            # Step 2: Update the exhibition with the determined old region
            update_exhibition_with_old_european_region(driver, exhibition_id, old_region)
            
        except Exception as e:
            print(f"Error processing exhibition ID {exhibition_id}: {e}")
            continue
    
    # Close the driver when finished
    driver.close()
    
    end_time = time.time()
    execution_time = round(end_time - start_time)
    print(f"Execution time: {execution_time} seconds.")
