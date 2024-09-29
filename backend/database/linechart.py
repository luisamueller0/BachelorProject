import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
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

def create_grouped_bar_chart_with_log_normal_values(artworks_data, min_limit, max_limit):
    # Create a DataFrame from the list of total exhibited artworks
    df = pd.DataFrame(artworks_data, columns=['total_exhibited_artworks'])
    
    # Define bins in intervals of 10 and group the remaining in '200+' if needed
    bin_edges = list(range(1, 201, 10)) + [max_limit]  # Bins: 1-10, 11-20, ..., 191-200, 200+
    bin_labels = [f"{i}-{i+9}" for i in range(1, 191, 10)] + ['200+']

    # Assign artworks to corresponding bins
    df['binned_artworks'] = pd.cut(df['total_exhibited_artworks'], bins=bin_edges, labels=bin_labels, right=False, include_lowest=True)

    # Count the number of artists in each bin
    count_data = df['binned_artworks'].value_counts().sort_index()

    # Plot the grouped bar chart with log scale
    plt.figure(figsize=(15, 7))
    plt.bar(count_data.index.astype(str), count_data.values, color='#F167CD', label='Number of Artists', width=0.8)
    plt.title('Number of Artists per Amount of Exhibited Artworks (Grouped)')
    plt.xlabel('Total Exhibited Artworks (Grouped)')
    plt.ylabel('Number of Artists')
    
    # Set y-axis to log scale and limit to 10^4
  
    # Use logarithmic ticks with normal values (1, 10, 100, 1000, 10000)
      # Set y-axis to square root scale
    ax = plt.gca()
    ax.set_yscale('sqrt')  # Apply the square root scale
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda y, _: f'{int(y):,}'))
    # Adjust grid and ticks
    plt.grid(True, linestyle='--', alpha=0.5, axis='y')
    plt.xticks(rotation=45, fontsize=8)  # Adjust x-tick labels' size and rotation
    plt.yticks(fontsize=8)  # Adjust y-tick labels' size for readability
    plt.tight_layout()
    plt.show()
def create_grouped_bar_chart_with_linear_scale(artworks_data, min_limit, max_limit):
    # Create a DataFrame from the list of total exhibited artworks
    df = pd.DataFrame(artworks_data, columns=['total_exhibited_artworks'])
    
    # Define bins in intervals of 10 and group the remaining in '200+' if needed
    bin_edges = list(range(1, 201, 10)) + [max_limit]  # Bins: 1-10, 11-20, ..., 191-200, 200+
    bin_labels = [f"{i}-{i+9}" for i in range(1, 191, 10)] + ['200+']

    # Assign artworks to corresponding bins
    df['binned_artworks'] = pd.cut(df['total_exhibited_artworks'], bins=bin_edges, labels=bin_labels, right=False, include_lowest=True)

    # Count the number of artists in each bin
    count_data = df['binned_artworks'].value_counts().sort_index()

    # Plot the grouped bar chart with a linear scale
    plt.figure(figsize=(15, 7))
    plt.bar(count_data.index.astype(str), count_data.values, color='#F167CD', label='Number of Artists', width=0.8)
    plt.title('Number of Artists per Amount of Exhibited Artworks (Grouped)')
    plt.xlabel('Total Exhibited Artworks (Grouped)')
    plt.ylabel('Number of Artists')
    
    # Use a linear scale (default, no need to set)
    ax = plt.gca()
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda y, _: f'{int(y):,}'))
    
    # Adjust grid and ticks
    plt.grid(True, linestyle='--', alpha=0.5, axis='y')
    plt.xticks(rotation=45, fontsize=8)  # Adjust x-tick labels' size and rotation
    plt.yticks(fontsize=8)  # Adjust y-tick labels' size for readability
    plt.tight_layout()
    plt.show()
def create_grouped_bar_chart_with_specific_ticks(artworks_data, min_limit, max_limit):
    # Create a DataFrame from the list of total exhibited artworks
    df = pd.DataFrame(artworks_data, columns=['total_exhibited_artworks'])
    
    # Define bins in intervals of 10 and group the remaining in '200+' if needed
    bin_edges = list(range(1, 201, 10)) + [max_limit]  # Bins: 1-10, 11-20, ..., 191-200, 200+
    bin_labels = [f"{i}-{i+9}" for i in range(1, 191, 10)] + ['200+']

    # Assign artworks to corresponding bins
    df['binned_artworks'] = pd.cut(df['total_exhibited_artworks'], bins=bin_edges, labels=bin_labels, right=False, include_lowest=True)

    # Count the number of artists in each bin
    count_data = df['binned_artworks'].value_counts().sort_index()

    # Plot the grouped bar chart with a linear scale
    plt.figure(figsize=(15, 7))
    plt.bar(count_data.index.astype(str), count_data.values, color='#F167CD', label='Number of Artists', width=0.8)
    plt.title('Number of Artists per Amount of Exhibited Artworks (Grouped)')
    plt.xlabel('Total Exhibited Artworks (Grouped)')
    plt.ylabel('Number of Artists')
    
    # Use a linear scale (default)
    ax = plt.gca()
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda y, _: f'{int(y):,}'))
    
    # Set custom y-ticks to include 100, then 1000, 2000, etc.
    y_ticks = [100] + list(range(1000, 6001, 1000))  # Add 100, then 1000, 2000, ..., 6000
    ax.set_yticks(y_ticks)

    # Adjust grid and ticks
    plt.grid(True, linestyle='--', alpha=0.5, axis='y')
    plt.xticks(rotation=45, fontsize=8)  # Adjust x-tick labels' size and rotation
    plt.yticks(fontsize=8)  # Adjust y-tick labels' size for readability
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    # Retrieve data from Neo4j
    min_limit = 1
    max_limit = 2217
    exhibited_artworks_data = get_exhibited_artworks_count(driver, min_limit, max_limit)
    
    # Create the grouped bar chart with a linear y-axis
    create_grouped_bar_chart_with_specific_ticks(exhibited_artworks_data, min_limit, max_limit)
    
    # Close the driver when finished
    driver.close()

if __name__ == "__main__":
    # Retrieve data from Neo4j
    min_limit = 1
    max_limit = 2217
    exhibited_artworks_data = get_exhibited_artworks_count(driver, min_limit, max_limit)
    
    # Create the grouped bar chart with normal numeric values on the logarithmic y-axis
    create_grouped_bar_chart_with_linear_scale(exhibited_artworks_data, min_limit, max_limit)
    
    # Close the driver when finished
    driver.close()
