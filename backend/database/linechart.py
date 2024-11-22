import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

# Create a DataFrame using the provided data
data = {
    'Artwork Range': [
        '1-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100',
        '101-110', '111-120', '121-130', '131-140', '141-150', '151-160', '161-170', '171-180',
        '181-190', '200+'
    ],
    'Number of Artists': [
        6179, 1042, 402, 217, 164, 108, 82, 68, 50, 31, 37, 34, 32, 29, 12, 13, 13, 9, 6, 108
    ]
}

df = pd.DataFrame(data)


# Plotting the grouped bar chart with a linear scale
plt.figure(figsize=(15, 7))
plt.bar(df['Artwork Range'], df['Number of Artists'], color='skyblue', label='Number of Artists', width=0.8)
# Title and labels
plt.title('Number of Artists per Amount of Exhibited Artworks (Grouped)', fontsize=16, fontweight='bold')
plt.xlabel('Total Exhibited Artworks (Grouped)', fontsize=14,fontweight='bold')
plt.ylabel('Number of Artists', fontsize=14,fontweight='bold')
# Format y-axis labels for readability
ax = plt.gca()
ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda y, _: f'{int(y):,}'))

# Set custom y-ticks to include 100, then 1000, 2000, etc.
y_ticks = [100] + list(range(1000, 7001, 1000))  # Add 100, then 1000, 2000, ..., 6000
ax.set_yticks(y_ticks)

# Adjust grid and ticks
plt.grid(True, linestyle='--', alpha=0.5, axis='y')
plt.xticks(rotation=45, fontsize=11)  # Adjust x-tick labels' size and rotation
plt.yticks(fontsize=11)  # Adjust y-tick labels' size for readability
plt.tight_layout()
plt.show()
