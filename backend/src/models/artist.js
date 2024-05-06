const { session } = require('../db');

class Artist {
    constructor(data) {
        this.id = Number(data.id); 
        this.firstname = data.firstname;
        this.lastname = data.lastname;
        this.birthyear = this.calculateYear(data.birthdate.toString());
        this.birthplace = data.birthplace;
        this.deathyear = this.calculateYear(data.deathdate.toString());
        this.deathplace = data.deathplace;
        this.nationality = data.country;
        this.sex = data.sex;
        this.title = data.title;
        this.techniques = data.artForms;
        this.amount_techniques=data.amountArtForms;
        this.distinct_techniques=data.distinctArtForms;
        this.europeanRegionNationality = this.determineRegion(data.country);
        this.most_exhibited_in = data.mostExhibitedInCountry;
        this.most_exhibited_in_amount = data.mostExhibitedInCountryAmount;
        this.total_exhibited_artworks = data.TotalExhibitedArtworks;
        this.deathcountry = data.deathCountry;
        this.europeanRegionDeath = this.determineRegion(data.deathCountry);
        this.birthcountry = data.birthCountry;
        this.europeanRegionBirth = this.determineRegion(data.birthCountry);
        this.total_exhibitions = data.TotalExhibitions;
    }
    calculateYear(date) {
        if (!date) return null; // Handle cases where birthdate is not provided
        const year = parseInt(date.split('-')[0]);
        return year;
    }
    determineRegion(countryCode) {
        for (const region in europeanRegions) {
            if (europeanRegions[region].includes(countryCode)) {
                return region;
            }
        }
        return null; // Return null if no region matches
    }
}
// Define European regions based on country codes
const europeanRegions = {
    "North Europe": ["DK", "EE", "FI", "IE", "LT", "LV", "NO", "SE", "IS"], // Including Iceland (IS)
    "Western Europe": ["GB", "FR", "BE", "NL", "LU", "CH"], // Including Switzerland (CH) and Luxembourg (LU)
    "Central Europe": ["DE", "PL", "CZ", "SK", "AT", "HU"], // Including Austria (AT), Czech Republic (CZ), Slovakia (SK)
    "Southern Europe": ["PT", "ES", "IT", "GR", "HR", "BA", "RS", "ME", "SI"], // Including Slovenia (SI), Croatia (HR), Bosnia and Herzegovina (BA), Serbia (RS), Montenegro (ME)
    "Eastern Europe": ["RU", "UA", "BY", "BG", "RO"], // Including Bulgaria (BG), Belarus (BY)
    "Others": [
      "US", "AU", "GE", "MX", "AM", "IL", "CL", "AR", "CA", "DO", "PE", "JP", "TR", 
      "BR", "ZA", "NZ", "VE", "GT", "UY", "SV", "PY", "IN",  // Non-European countries
      // Adding countries that are outside of Europe but were listed in your dataset
      "NZ", "ZA", "LU", "VE", "GT", "UY", "SV", "PY", "IN", "ME", "TN", "MD"
    ]
  };
  

class exhibited_with {
    constructor(startData, endData, relationshipData) {
        this.startId = Math.min(startData.id, endData.id);
        this.endId = Math.max(startData.id, endData.id);
        this.sharedExhibitions = relationshipData.sharedExhibitions;
        this.sharedExhibitionMinArtworks = relationshipData.sharedExhibitionMinArtworks;
    }
}


const findAll = async () => {
    const result = await session.run('MATCH (a:Artist) RETURN a LIMIT 25');
    return result.records.map(record => record.get('a').properties);
};

const findAllNationalityTechnique = async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE EXISTS(a.artForms) AND a.country <> '\\N'
    WITH a
    LIMIT 25
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `);

    return await processResult(result);
};

const findAllBirthcountryTechnique = async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE EXISTS(a.artForms) AND a.birthCountry IS NOT NULL
    WITH a
    LIMIT 25
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `);

    return await processResult(result);
};

const findAllDeathcountryTechnique = async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE EXISTS(a.artForms) AND a.deathCountry IS NOT NULL
    WITH a
    LIMIT 25
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `);

    return await processResult(result);
};

const processResult = (result) => {
    const artistsId = new Set();
    const relationships = [];
    const artists = [];
    
    result.records.forEach(record => {
        const relationship = record.get('p');

        const startData = relationship.start.properties;
        const endData = relationship.end.properties;
        const relationshipData = relationship.segments[0].relationship.properties;
        const relation = new exhibited_with(startData, endData, relationshipData);
        
        relationships.push(relation);
    
        // Check if the artist with the same ID hasn't been created yet
        const artistId = startData.id;
        if (!artistsId.has(artistId)) {
            const artist = new Artist(startData);
            artistsId.add(artistId);
            artists.push(artist);
            // Store the artist object as needed
        }
    
        const otherArtistId = endData.id;
        if (!artistsId.has(otherArtistId)) {
            const otherArtist = new Artist(endData);
            artistsId.add(otherArtistId);
            artists.push(otherArtist);
        }
    });

    return [artists, relationships];
};

module.exports = {
    findAll,
    findAllNationalityTechnique,
    findAllBirthcountryTechnique,
    findAllDeathcountryTechnique
};