from neo4j import GraphDatabase

# Neo4j connection details
uri = "bolt://localhost:7687"
username = "neo4j"
password = "24032102"

# Create a driver instance
driver = GraphDatabase.driver(uri, auth=(username, password))

# Complete city-to-country mapping for the year 1900
""" city_country_mapping = {
    'Warsaw': 'Russian Empire',
    'Breslau': 'Germany',
    'Wartha (Niederschlesien, Region)': 'Germany',
    'Golluschütz (Westpreussen)': 'Germany',
    'Sýňovská Nowá Wes': 'Austria-Hungary',
    'Șandra': 'Austria-Hungary',
    'Danzig': 'Germany',
    'Clifton (Ontario)': 'Canada',
    'London, Ontario': 'Canada',
    '\\N': 'Unknown',
    'Elbing': 'Germany',
    'Yendrikhovtsy': 'Russian Empire',
    'Gleiwitz': 'Germany',
    'Lviv': 'Austria-Hungary',
    'Myślachowice': 'Austria-Hungary',
    'Leorda': 'Austria-Hungary',
    'Cracow': 'Austria-Hungary',
    'Deva, Romania': 'Austria-Hungary',
    'Yevpatoria': 'Russian Empire',
    'Grottkau': 'Germany',
    'Cherson (now Sevastopol)': 'Russian Empire',
    'Fichtwerder (bei Landsberg an der Warthe)': 'Germany',
    'Szczebrzeszyn': 'Austria-Hungary',
    'Ząbkowice Śląskie': 'Germany',
    'Stargard in Pommern': 'Germany',
    'Peleș': 'Austria-Hungary',
    'Preußisch Holland': 'Germany',
    'Hammerstein': 'Germany',
    'Constanta': 'Romania',
    'Luborzyca bei Miechów': 'Austria-Hungary',
    'Korelivschyna': 'Russian Empire',
    'Ekaterinoslav': 'Russian Empire',
    'Reteag': 'Austria-Hungary',
    'Kukhi (near Kutaisi)': 'Russian Empire',
    'Ponjemon': 'Russian Empire',
    'Nizhnii Bereziv': 'Austria-Hungary',
    'Wszeliwy': 'Austria-Hungary',
    'Howick, Ontario': 'Canada',
    'Ternopillja': 'Austria-Hungary',
    'Bukowicz': 'Austria-Hungary',
    'Saint John, New Brunswick': 'Canada',
    'Borszyn': 'Germany',
    'Kałusz': 'Austria-Hungary',
    'Barszczowice': 'Austria-Hungary',
    'Harklowa, Lesser Poland Voivodeship': 'Austria-Hungary',
    'Alexandria': 'Egypt',
    'Guaira de la Melena, Cuba': 'Cuba',
    'Lipiny (Świętochłowice)': 'Germany',
    'Picton (Canada)': 'Canada',
    'Samborsko': 'Austria-Hungary',
    'Lębork': 'Germany',
    'Brody, Żary County': 'Austria-Hungary',
    'Kowary': 'Germany',
    'Birnbaum': 'Germany',
    'Kościanki': 'Germany',
    'Victoria, British Columbia': 'Canada',
    'Tyszowce': 'Austria-Hungary',
    'Wólka Zerzeńska': 'Austria-Hungary',
    'Havana': 'Cuba',
    'Stettin': 'Germany'
}
 """

city_country_mapping = {
    'Atuona': 'France',  # French Colonial Empire
    'New York': 'United States of America',
    'Monte Carlo': 'Monaco',
    'Frankfurt am Main': 'German Empire',
    'Luzern': 'Switzerland',
    'Potsdam': 'German Empire',
    'Ukraine': 'Russian Empire',  # Ukraine was part of the Russian Empire
    'Jarovnice': 'Austria-Hungary',
    'Haifa': 'Ottoman Empire',
    'Laguna Beach': 'United States of America',
    'Vienna': 'Austria-Hungary',
    'San Francisco': 'United States of America',
    'Biedenkopf': 'German Empire',
    'Pruszków': 'Russian Empire',  # Part of Russian-controlled Poland
    'Munich': 'German Empire',
    'Wiesneck': 'German Empire',
    'Zakopane': 'Austria-Hungary',
    'Sandomierz': 'Russian Empire',  # Part of Russian-controlled Poland
    'Budapest': 'Austria-Hungary',
    'Algeria': 'France',  # French Colonial Empire
    'Samarkand': 'Russian Empire',  # In Central Asia, part of the Russian Empire
    'London': 'United Kingdom of Great Britain and Ireland',
    'KZ Lublin-Majdanek or Sobibor': 'Russian Empire',  # Located in Russian-controlled Poland
    'Berlin': 'German Empire',
    'Dessau': 'German Empire',
    'Kazakhstan': 'Russian Empire',  # Part of the Russian Empire in 1900
    'Radom': 'Russian Empire',  # Part of Russian-controlled Poland
    'Eching am Ammersee': 'German Empire',
    'Glasow': 'German Empire',
    'Baia Mare': 'Austria-Hungary',  # Part of the Kingdom of Hungary within Austria-Hungary
    'Stade': 'German Empire',
    'Warsaw Ghetto': 'Russian Empire',  # Part of Russian-controlled Poland
    'Sergiyev Posad': 'Russian Empire',
    'Novorzhev': 'Russian Empire',
    'Bessarabia Governorate': 'Russian Empire',
    'Tbilisi': 'Russian Empire',  # Part of the Russian Empire
    'Jordan': 'Ottoman Empire',  # Part of the Ottoman Empire
    'Baczków near Bochnia': 'Austria-Hungary',
    'Buenos Aires': 'Argentina',
    'Marakesh': 'Morocco',
    'Sofia': 'Bulgaria',
    'Moorea': 'France',  # French Polynesia
    'Wiśnicz Nowy': 'Austria-Hungary',
    'Nowy Targ': 'Austria-Hungary',
    'Livorno': 'Italy',
    'Kostiuchnówka': 'Russian Empire',  # Part of the Russian-controlled Poland/Ukraine
    'San Lorenzo, Paraguay': 'Paraguay',
    'Izbica [Ghetto]': 'Russian Empire',  # Part of Russian-controlled Poland
    'Barcelona': 'Spain',
    'Menton': 'France',
    'Port Said': 'Egypt',  # Part of the British Empire under Egyptian Khedive rule
    'Bellagio': 'Italy',
    'Montrose, Victoria': 'Australia',
    'Waplewo, Olsztyn County': 'German Empire',  # Part of East Prussia in the German Empire
    'Mecca': 'Ottoman Empire',
    'Carpathian Mountains': 'Austria-Hungary',  # Regions part of the Austria-Hungary empire
    'Richmond, Victoria': 'Australia',
    'Sopot': 'German Empire',  # Part of the German Empire (near Danzig)
    'Pszenno': 'German Empire',  # Part of Silesia in the German Empire
    'Frankfurt an der Oder': 'German Empire',
    'Ixelles': 'Belgium',
    'Yanonge, Congo': 'Belgium',  # Belgian Congo
    'Collias': 'France',
    'Paris': 'France',
    'Skierniewice': 'Russian Empire',  # Part of Russian-controlled Poland
    'Madrid': 'Spain',
    'Belgirate': 'Italy',
    'Buchenwald': 'German Empire',
    'Hongō, Tokyo': 'Japan'
}

def get_all_artists(driver):
    with driver.session() as session:
        result = session.run(
            """
            MATCH (a:Artist)
            WHERE a.oldBirthCountry IS NULL OR a.oldDeathCountry IS NULL
            RETURN a.id AS artist_id, a.birthplace AS birth, a.deathplace AS death
            """
        )
        return [{"artist_id": record["artist_id"], "birth": record["birth"], "death": record["death"]} for record in result]

def find_old_country_for_place_using_mapping(place_name):
    # Use the city_country_mapping to find the old country
    return city_country_mapping.get(place_name)

def update_artist_with_old_country(driver, artist_id, old_birth_country, old_death_country):
    with driver.session() as session:
        session.run(
            """
            MATCH (a:Artist {id: $artist_id})
            SET a.oldBirthCountry = $old_birth_country,
                a.oldDeathCountry = $old_death_country
            """, {
                "artist_id": artist_id,
                "old_birth_country": old_birth_country,
                "old_death_country": old_death_country
            }
        )

if __name__ == "__main__":
    try:
        # Step 1: Retrieve all artists with missing oldBirthCountry or oldDeathCountry
        all_artists = get_all_artists(driver)
        
        for artist in all_artists:
            artist_id = artist['artist_id']
            birth_place = artist['birth']
            death_place = artist['death']

            try:
                # Find the old countries using the mapping
                old_birth_country = find_old_country_for_place_using_mapping(birth_place) if birth_place else None
                old_death_country = find_old_country_for_place_using_mapping(death_place) if death_place else None

                # Step 2: Update the artist with the determined old countries
                if old_birth_country or old_death_country:  # Only update if at least one value is found
                    update_artist_with_old_country(driver, artist_id, old_birth_country, old_death_country)
                    print(f"Finished processing artist with ID {artist_id}")
                else:
                    print(f"No old countries found for artist with ID {artist_id}")
            
            except Exception as e:
                print(f"Error processing artist ID {artist_id}: {e}")
                continue

    finally:
        # Close the driver when finished
        driver.close()
