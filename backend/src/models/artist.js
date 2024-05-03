/* const { session } = require('../db.js');

class Artist {
    constructor(properties) {
        this.id = properties.id;
        this.firstname = properties.firstname;
        this.lastname = properties.lastname;
        this.title = properties.title;
        this.country = properties.country;
        this.birthdate = new Date(properties.birthdate);
        this.birthplace = properties.birthplace;
        this.deathdate = new Date(properties.deathdate);
        this.deathplace = properties.deathplace;
        this.pnd = String(properties.pnd);
        this.ulan = String(properties.ulan);
    }
}

const findAll = async () => {
    const result = await session.run('MATCH (a:Artist) RETURN a LIMIT 10');
    const artists = result.records.map(record => new Artist(record.get('a').properties));
    return artists;
}

export default {
    findAll
};
 */

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
        this.country = data.country;
        this.sex = data.sex;
        this.title = data.title;
        this.techniques = data.artForms;
        this.amount_techniques=data.amountArtForms;
        this.distinct_techniques=data.distinctArtForms;
        this.europeanRegion = this.determineRegion(data.country);
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
      "NZ", "ZA", "LU", "VE", "GT", "UY", "SV", "PY", "IN", "ME"
    ]
  };
  

  
/* Countries of nationality categroized into what part of europe (for later on choose geographical inner order)

private europeRegions = {
  "North Europe": ["DK", "EE", "FI", "IE", "LT", "LV", "NO", "SE", "IS"], // Denmark, Estonia, Finland, Ireland, Lithuania, Latvia, Norway, Sweden, Iceland
  "Western Europe": ["GB", "FR", "BE", "NL", "LU"], // United Kingdom, France, Belgium, Netherlands, Luxembourg
  "Central Europe": ["DE", "PL", "CZ", "SK", "AT", "HU", "SI", "CH"], // Germany, Poland, Czech Republic, Slovakia, Austria, Hungary, Slovenia, Switzerland
  "Southern Europe": ["PT", "ES", "IT", "GR", "HR", "BA", "RS", "ME", "AL", "MK", "SI"], // Portugal, Spain, Italy, Greece, Croatia, Bosnia and Herzegovina, Serbia, Montenegro, Albania, Macedonia, Slovenia
  "Eastern Europe": ["BY", "BG", "RO", "RU", "UA", "MD"], // Belarus, Bulgaria, Romania, Russia, Ukraine, Moldova
};
 */


/* class exhibited_with {
    constructor(startData, endData) {
        this.artistId = startData.properties.id;
        this.otherArtistId = endData.properties.id;
    }
} */

class exhibited_with {
    constructor(startData, endData) {
        this.startId = Math.min(startData.id, endData.id);
        this.endId = Math.max(startData.id, endData.id);
    }
}



const findAll = async () => {
    const result = await session.run('MATCH (a:Artist) RETURN a LIMIT 25');
    return result.records.map(record => record.get('a').properties);
};

 /* (`MATCH (a:Artist)-[:CREATED]->(b:CatalogueEntry)
    WHERE a.country <> '\N' AND b.technique <> '\N'
    WITH a, b
    MATCH (a)-[:EXHIBITED_WITH]->(otherArtist)-[:CREATED]->(otherEntry)
    WHERE otherArtist.country <> '\N' AND otherEntry.technique <> '\N'
    WITH a, otherArtist
    LIMIT 2
    RETURN (a)-[:EXHIBITED_WITH]->(otherArtist)
     `);  */


/* const findAllNationalityTechnique = async () => {
    const result = await session.run
        (`MATCH (a:Artist)-[:CREATED]->(b:CatalogueEntry)
        WHERE a.country <> '\\N' AND b.technique <> '\\N'
        WITH DISTINCT a
        RETURN a, COLLECT(b.technique) AS techniques
        LIMIT 15 `);
    
        const artists = [];
        result.records.forEach(record => {
            const artist = new artist(a.properties)
            const techniques = record.get('techniques');
            artist.techniques = techniques;
            artists.push(artist);
        });
        const relationships = [];
        for (let i = 0; i < artists.length; i++) {
            for (let j = i + 1; j < artists.length; j++) {
                const artistA = artists[i];
                const artistB = artists[j];
                const result = await session.run(
                    `MATCH (a:Artist)-[:EXHIBITED_WITH]->(b:Artist)
                    WHERE a.id = $artistAId AND b.id = $artistBId
                    RETURN a, b`);
                if (result.records.length > 0) {
                    // Add the relationship to the relationships array
                    const relationship = new relationship(a,b)
                    relationships.push(relationship);
                }
            }
        }
    
        return [artists, relationships];
    }; */

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
   /*     `MATCH p=(a:Artist)-[r:EXHIBITED_WITH]->(b:Artist) 
WHERE exists(a.techniques) AND exists(b.techniques) AND a.country <> '\\N' AND b.country <> '\\N'
RETURN p LIMIT 25`);*/
/*     const result = await session.run(
`MATCH (a:Artist)-[:CREATED]->(b:CatalogueEntry)
WHERE a.country <> '\\N' AND b.technique <> '\\N'
WITH DISTINCT a, b
MATCH p=(a)-[:EXHIBITED_WITH]->(otherArtist:Artist)
WHERE otherArtist.country <> '\\N'
WITH a, otherArtist,b,p
MATCH (otherArtist)-[:CREATED]->(otherEntry:CatalogueEntry)
WHERE otherEntry.technique <> '\\N'
WITH a, otherArtist, COLLECT(b.technique) AS techniques, COLLECT(otherEntry.technique) AS otherTechniques,p
LIMIT 10
RETURN p, techniques, otherTechniques`); */
/* 
    const result = await session.run
    (` MATCH (a:Artist)-[:CREATED]->(b:CatalogueEntry)
    WHERE a.country <> '\\N' AND b.technique <> '\\N'
    WITH a, b
    MATCH (otherArtist)-[:CREATED]->(otherEntry)
    WHERE otherArtist.country <> '\\N' AND otherEntry.technique <> '\\N'
    WITH a, otherArtist, b, otherEntry
    MATCH p=(a)-[:EXHIBITED_WITH]->(otherArtist)
    WITH a, otherArtist, b, otherEntry,p
    LIMIT 10
    RETURN p, COLLECT(b.technique) AS techniques, COLLECT(otherEntry.technique) AS otherTechniques
    `); */

    const artistsId = new Set();
    const relationships = [];
    const artists = [];
    
    result.records.forEach(record => {
        const relationship = record.get('p');
        
        const startData = relationship.start.properties;
        const endData = relationship.end.properties;
        const relation = new exhibited_with(startData, endData);
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
        /* // Create the relationshipId
        const relationshipId = `${startData.id}-${endData.id}`;
        console.log(relationshipId);
    
        // Check if the relationship has not been created yet
        if (!relationshipsId.has(relationshipId)) {
            relationshipsId.add(relationshipId);
            // Create the relationship object
            const relationship = new exhibited_with(startData, endData);
            relationships.push(relationship);
        }  
         */
    });




    return [artists, relationships];
    
    //return result.records.map(record => record.get('(a)-[:EXHIBITED_WITH]->(otherArtist)')); //records.map(record => record.get('a').properties)
};



module.exports = {
    findAll,
    findAllNationalityTechnique
};