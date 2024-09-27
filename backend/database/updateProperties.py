from neo4j import GraphDatabase

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

# Correct mapping of full country names to their ISO codes or historical abbreviations
country_code_mapping = {
    "United Kingdom of Great Britain and Ireland": "UK",
    "Netherlands": "NL",
    "Russian Empire": "RE",
    "Switzerland": "CH",
    "France": "FR",
    "United States of America": "US",
    "Italy": "IT",
    "Austria Hungary": "AH",
    "Germany": "DE",
    "\\N": "\\N",
    "Belgium": "BE",
    "Greece": "GR",
    "Sweden–Norway": "SN",
    "Ukraine": "UA",
    "United States": "US",
    "Spain": "ES",
    "Denmark": "DK",
    "New South Wales (UK)": "NSW",
    "Persia": "IR",
    "Mexico": "MX",
    "Ottoman Empire": "OT",
    "Netherlands Indies": "NEI",
    "Monaco": "MC",
    "Dutch Guiana": "SR",
    "Portugal": "PT",
    "United Kingdom": "GB",
    "Canada": "CA",
    "Queensland (UK)": "QLD",
    "German Empire": "GE",
    "Argentina": "AR",
    "Kingdom of Brazil": "BR",
    "Austria-Hungary": "AH",
    "Luxembourg": "LU",
    "Sweden": "SE",
    "Chile": "CL",
    "Romania": "RO",
    "Bosnia-Herzegovina": "BA",
    "Algeria": "DZ",
    "Victoria (UK)": "VIC",
    "Norway": "NO",
    "Manchu Empire": "ME",
    "Serbia": "RS",
    "M?ori": "M?ori",
    "Unknown": "Unknown",
    "Tunisia": "TN",
    "Morocco": "MA",
    "South Australia (UK)": "SA",
    "Ecuador": "EC",
    "Peru": "PE",
    "Bolivia": "BO",
    "Cape Colony": "CC",
    "Bulgaria": "BG",
    "French Indochina": "FI",
    "Transvaal": "TV",
    "Namibia": "NA",
    "Imperial Japan": "IJ",
    "India": "IN",
    "Netherlands Antilles": "AN",
    "Estonia": "EE",
    "Russia": "RU",
    "Western Australia (UK)": "WA",
    "New Zealand": "NZ",
    "Egypt": "EG",
    "Bunyoro": "BU",
    "Croatia": "HR",
    "Australia": "AU",
    "Ireland": "IE",
    "Uruguay": "UY",
    "El Salvador": "SV",
    "Paraguay": "PY",
    "Indonesia": "ID",
    "British Raj": "BRJ",
    "Poland": "PL",
    "Kingdom of Hawaii": "KH",
    "Malta": "MT",
    "Japan": "JP",
    # Additional birth countries from the uploaded file
    "Costa Rica": "CR",
    "Isle of Man": "IM",
    "Mauritius": "MU",
    "Dominican Republic": "DO",
    "Afghanistan": "AF",
    "Guatemala": "GT",
    "Ceylon": "CEY",
    "Antigua and Barbuda": "AG",
    "Venezuela": "VE",
    "Singapore": "SG",
    "Hong Kong": "HK",
    "Rattanakosin Kingdom": "RAT"
}

def update_host_old_country_to_short(driver, full_name_to_code):
    with driver.session() as session:
        for full_name, short_code in full_name_to_code.items():
            session.run(
                """
                MATCH (h:Host {oldCountry: $full_name})
                SET h.oldCountry = $short_code
                """, {
                    "full_name": full_name,
                    "short_code": short_code
                }
            )
            print(f"Updated {full_name} to {short_code}")

if __name__ == "__main__":
    try:
        # Step 1: Update oldCountry for Host nodes to short versions
        update_host_old_country_to_short(driver, country_code_mapping)
        print("Finished updating oldCountry for Host nodes to short versions.")
        
    finally:
        # Close the driver when finished
        driver.close()
