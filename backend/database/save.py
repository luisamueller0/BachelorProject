import pandas as pd
from neo4j import GraphDatabase

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

def get_exhibited_artworks_count(driver, min_limit, max_limit):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            WHERE a.artForms <> [] AND a.birthCountry <> '\\N' 
                  AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
            RETURN a.TotalExhibitedArtworks AS total_exhibited_artworks
            """, {"minLimit": min_limit, "maxLimit": max_limit}
        )
        return [record["total_exhibited_artworks"] for record in result]

# Retrieve data from Neo4j
min_limit = 1
max_limit = 2217
exhibited_artworks_data = get_exhibited_artworks_count(driver, min_limit, max_limit)

# Create a DataFrame from the extracted data
df_exhibited_artworks = pd.DataFrame(exhibited_artworks_data, columns=['total_exhibited_artworks'])

# Define bins in intervals of 10 and group the remaining in '200+' if needed
bin_edges = list(range(1, 201, 10)) + [max_limit]  # Bins: 1-10, 11-20, ..., 191-200, 200+
bin_labels = [f"{i}-{i+9}" for i in range(1, 191, 10)] + ['200+']

# Assign artworks to corresponding bins
df_exhibited_artworks['binned_artworks'] = pd.cut(df_exhibited_artworks['total_exhibited_artworks'], 
                                                  bins=bin_edges, labels=bin_labels, right=False, include_lowest=True)

# Count the number of artists in each bin
count_data = df_exhibited_artworks['binned_artworks'].value_counts().sort_index()

# Convert to a DataFrame for easy saving
df_count_data = count_data.reset_index()
df_count_data.columns = ['Artwork Range', 'Number of Artists']

# Save to a temporary file
temp_file_path = "./artists_grouped_by_artworks.csv"
df_count_data.to_csv(temp_file_path, index=False)

# Close the driver
driver.close()

print(f"Data saved to: {temp_file_path}")
