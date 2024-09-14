from neo4j import GraphDatabase

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

# Correct mapping of full country names to their ISO codes or historical abbreviations
country_code_mapping = {
    "United Kingdom of Great Britain and Ireland": "UK",  # Modern UK code is GB
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
    "Sweden–Norway": "SN",  # Historical union, unique abbreviation
    "Ukraine": "UA",
    "United States": "US",
    "Spain": "ES",
    "Sweden-Norway": "SN",  # Duplicate entry for historical union
    "Denmark": "DK",
    "New South Wales (UK)": "NSW",  # Historical region
    "Persia": "IR",  # Now Iran, use IR
    "Mexico": "MX",
    "Ottoman Empire": "OT",  # Historical empire, unique abbreviation
    "Netherlands Indies": "NEI",  # Historical colony, unique abbreviation
    "Monaco": "MC",
    "Dutch Guiana": "SR",  # Now Suriname, use SR
    "Portugal": "PT",
    "United Kingdom": "GB",
    "Canada": "CA",
    "Queensland (UK)": "QLD",  # Historical region
    "German Empire": "GE",  # Historical empire, unique abbreviation
    "Argentina": "AR",
    "Kingdom of Brazil": "BR",  # Now Brazil, use BR
    "Austria-Hungary": "AH",
    "Luxembourg": "LU",
    "Sweden": "SE",
    "Chile": "CL",
    "Romania": "RO",
    "Bosnia-Herzegovina": "BA",
    "Algeria": "DZ",
    "Victoria (UK)": "VIC",  # Historical region
    "Norway": "NO",
    "Manchu Empire": "ME",  # Historical empire, unique abbreviation
    "Serbia": "RS",
    "M?ori": "M?ori",  # Unique case, may require clarification
    "Unknown": "Unknown",
    "Tunisia": "TN",
    "Morocco": "MA",
    "South Australia (UK)": "SA",  # Historical region
    "Ecuador": "EC",
    "Peru": "PE",
    "Bolivia": "BO",
    "Cape Colony": "CC",  # Historical colony
    "Bulgaria": "BG",
    "French Indochina": "FI",  # Historical region, unique abbreviation
    "Transvaal": "TV",  # Historical region
    "Namibia": "NA",
    "Imperial Japan": "IJ",  # Historical empire, unique abbreviation
    "India": "IN",
    "Netherlands Antilles": "AN",  # ISO code for former territories
    "Estonia": "EE",
    "Russia": "RU",
    "Western Australia (UK)": "WA",  # Historical region
    "New Zealand": "NZ",
    "Egypt": "EG",
    "Bunyoro": "BU",  # Historical kingdom
    "Croatia": "HR",
    "Australia": "AU",
    "Ireland": "IE",
    "Uruguay": "UY",
    "El Salvador": "SV",
    "Paraguay": "PY",
    "Indonesia": "ID",
    "British Raj": "BRJ",  # Historical region, unique abbreviation
    "Poland": "PL",
    "Kingdom of Hawaii": "KH",  # Historical kingdom
    "Malta": "MT",
    "Japan": "JP",

      # Additional birth countries from the uploaded file
    "Costa Rica": "CR",
    "Isle of Man": "IM",
    "Mauritius": "MU",
    "Dominican Republic": "DO",
    "Afghanistan": "AF",
    "Guatemala": "GT",
    "Ceylon": "CEY",  # Historical name for Sri Lanka
    "Antigua and Barbuda": "AG",
    "Venezuela": "VE",
    "Singapore": "SG",
    "Hong Kong": "HK",
    "Rattanakosin Kingdom": "RAT"  # Historical name for Thailand
}

def update_old_death_country_to_short(driver, full_name_to_code):
    with driver.session() as session:
        for full_name, short_code in full_name_to_code.items():
            session.run(
                """
                MATCH (a:Artist {oldBirthCountry: $full_name})
                SET a.oldBirthCountry = $short_code
                """, {
                    "full_name": full_name,
                    "short_code": short_code
                }
            )
            print(f"Updated {full_name} to {short_code}")

if __name__ == "__main__":
    try:
        # Step 1: Update oldDeathCountry to short versions
        update_old_death_country_to_short(driver, country_code_mapping)
        print("Finished updating oldDeathCountry to short versions.")
        
    finally:
        # Close the driver when finished
        driver.close()
