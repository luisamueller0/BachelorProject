import json
import pandas as pd
import matplotlib.pyplot as plt
 
# Load the data from the provided JSON file
with open('path_to_your_file/records.json') as f:
    data = json.load(f)

# Convert the data to a DataFrame
df = pd.DataFrame(data)

# Plotting
plt.figure(figsize=(12, 8))
plt.plot(df["totalExhibited"], df["amount"], marker='o', linestyle='-', color='b')
plt.xlabel('Total Exhibited Artworks')
plt.ylabel('Count')
plt.title('Count vs Total Exhibited Artworks')
plt.yscale('log')  # Use logarithmic scale for better visualization
plt.grid(True, which="both", ls="--", linewidth=0.5)
plt.show()


###MATCH (n:Artist) RETURN n.TotalExhibitedArtworks AS totalExhibited, COunt(n) as amount ORDER BY totalExhibited DESC###