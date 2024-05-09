const dbSemaphore = require('../semaphoreHandler');
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
        this.europeanRegionMostExhibited = this.determineRegion(data.mostExhibitedInCountry);
        this.most_exhibited_in_amount = data.mostExhibitedInCountryAmount;
        this.total_exhibited_artworks = data.TotalExhibitedArtworks;
        this.deathcountry = data.deathCountry;
        this.europeanRegionDeath = this.determineRegion(data.deathCountry);
        this.birthcountry = data.birthCountry;
        this.europeanRegionBirth = this.determineRegion(data.birthCountry);
        this.total_exhibitions = data.TotalExhibitions;
        this.techniques_freq = data.artFormsFreq;
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
      "NZ", "ZA", "LU", "VE", "GT", "UY", "SV", "PY", "IN", "ME", "TN", "MD", "ID"
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
    const { session } = require('../db');
    const result = await session.run('MATCH (a:Artist) RETURN a LIMIT 25');
    return result.records.map(record => record.get('a').properties);
};

const findAllNationalityTechnique = async () => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
        console.log('Semaphore acquired by normal')
    
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.country <> '\\N'
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
});
};

const findAllNationalityTechniqueAmount = async (minLimit, maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
        console.log('Semaphore acquired by amount')
    const result = await session.run(
   // Collect artists where total
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.country <> '\\N' AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);
});
};


const findAllBirthcountryTechnique = async () => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.birthCountry <> '\\N'
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
});
};

const findAllBirthcountryTechniqueAmount = async (minLimit,maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist) 
    WHERE a.artForms <> [] AND a.birthCountry <> '\\N' AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);
});
};

const findAllDeathcountryTechnique = async () => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.deathCountry <> '\\N'
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

});
};

const findAllDeathcountryTechniqueAmount = async (minLimit,maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.deathCountry <> '\\N'  AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);

});
};


const findAllMostExhibitedInTechnique = async () => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.mostExhibitedInCountry <> '\\N' AND a.unclearMostExhibitedInCountry = FALSE 
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
});
};

const findAllMostExhibitedInTechniqueAmount = async (minLimit,maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.mostExhibitedInCountry <> '\\N' AND a.unclearMostExhibitedInCountry = FALSE  AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);

});
};


const findAllTechniques = async () => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.artFormsFreq <> '{}'
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

});
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

const math = require('mathjs');

  // Assuming 'artists' is an array of artist nodes and 'relationships' is an array of edges with weights
const normalizeLogarithmically = (values) => {
    const logMaxValue = Math.log1p(Math.max(...values.values()));
    const logMinValue = Math.log1p(Math.min(...values.values()));
    const range = logMaxValue - logMinValue;
    const normalized = new Map();
   
    values.forEach((value, id) => {
        normalized.set(id, (Math.log1p(value) - logMinValue) / range); // Normalize by dividing by the max degree
    });
    return normalized;
};

async function spectralClustering(artists, relationships, k) {
    // Step 0: Extract sharedExhibitionMinArtworks values for normalization
    const sharedExhibitionValues = new Map();
    relationships.forEach(relationship => {
        const id = relationship.startId;
        const value = relationship.sharedExhibitionMinArtworks;
        sharedExhibitionValues.set(id, value);
    });

    // Step 0.1: Normalize sharedExhibitionMinArtworks values
    const normalizedSharedExhibitionValues = normalizeLogarithmically(sharedExhibitionValues);

    // Step 1: Construct the adjacency matrix
    const size = artists.length;
    const adjacencyMatrix = math.zeros(size, size);

    relationships.forEach(relationship => {
        const i = artists.findIndex(artist => artist.id === relationship.startId);
        const j = artists.findIndex(artist => artist.id === relationship.endId);
        const weight = normalizedSharedExhibitionValues.get(relationship.startId);

        adjacencyMatrix.set([i, j], Number(weight));
        adjacencyMatrix.set([j, i], Number(weight)); // since it's an undirected graph
    });

    console.log('adjacency', adjacencyMatrix)
   

    // Step 2: Construct the degree matrix
    const degreeMatrix = adjacencyMatrix.map((value, index, matrix) => {
        return index[0] === index[1] ? Number(math.sum(matrix._data[index[0]])) : 0;
    });

    console.log('degreematrix',degreeMatrix)
    // Step 3: Construct the Laplacian matrix
    const laplacianMatrix = math.subtract(degreeMatrix, adjacencyMatrix);

    console.log('laplacian',laplacianMatrix)
   // Step 4: Compute the eigenvalues and eigenvectors
   const eigensystem = math.eigs(laplacianMatrix);

   // Check if the eigenvalues and eigenvectors are defined and not empty
   if (!eigensystem || eigensystem.values.length === 0) {
       throw new Error("Eigenvectors are undefined or missing data.");
   }
   console.log('eigensystem', eigensystem);
   
   // Extract eigenvalues and eigenvectors, and sort them by eigenvalues
   const eigenvaluesAndVectors = eigensystem.values.map((value, index) => ({
       value,
       vector: eigensystem.eigenvectors[index] // Correcting property name here
   }));
   

   console.log('eigenvaluesAndVectors:', eigenvaluesAndVectors);
   // Sort by eigenvalue in ascending order
   const eigenvaluesAndVectorsArray = [];
for (let i = 0; i < eigenvaluesAndVectors._data.length; i++) {
    eigenvaluesAndVectorsArray.push(eigenvaluesAndVectors._data[i]);
}

// Sort the array of objects by eigenvalue in ascending order
eigenvaluesAndVectorsArray.sort((a, b) => a.value - b.value);

   // Filter out the zero or near-zero eigenvalues (depending on context, you might need a threshold to skip very small but non-zero eigenvalues)
   const filteredEigenvaluesAndVectors = eigenvaluesAndVectorsArray.filter(e => e.value > 1e-10);
   
   // Use the first k non-trivial eigenvectors for clustering
   const vectorsForClustering = filteredEigenvaluesAndVectors.slice(0, k).map(e => {
       // Assuming e.vector is a DenseMatrix and needs to be converted to an array
       console.log('e.vector:', e.vector);

       return e.vector.vector.toArray(); // Ensure this conversion matches the actual data structure
   });
   
   const clusters = kMeansClustering(vectorsForClustering, k);
   
   // Assuming kMeansClustering and other related functions are d
   
return clusters;

}

function kMeansClustering(data, k) {
    const maxIterations = 100;
    let centroids = initializeCentroids(data, k);
    let assignments = new Array(data.length);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Step 1: Assign points to the nearest centroid
        for (let i = 0; i < data.length; i++) {
            let minDistance = Infinity;
            let closestCentroid = 0;
            for (let j = 0; j < k; j++) {
                let distance = euclideanDistance(data[i], centroids[j]);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCentroid = j;
                }
            }
            assignments[i] = closestCentroid;
        }

        // Step 2: Recalculate centroids
        let newCentroids = new Array(k).fill(0).map(() => new Array(data[0].length).fill(0));
        let pointsInCluster = new Array(k).fill(0);

        for (let i = 0; i < assignments.length; i++) {
            const cluster = assignments[i];
            for (let j = 0; j < data[i].length; j++) {
                newCentroids[cluster][j] += data[i][j];
            }
            pointsInCluster[cluster]++;
        }

        for (let i = 0; i < k; i++) {
            if (pointsInCluster[i] !== 0) {
                for (let j = 0; j < newCentroids[i].length; j++) {
                    newCentroids[i][j] /= pointsInCluster[i];
                }
            } else {
                newCentroids[i] = centroids[i]; // In case no points were assigned, keep the old centroid
            }
        }

        // Check for convergence (if centroids do not change)
        if (centroids.every((centroid, index) => euclideanDistance(centroid, newCentroids[index]) === 0)) {
            break;
        }
        centroids = newCentroids;
    }

    return assignments;
}

function initializeCentroids(data, k) {
    let centroids = [];
    let usedIndices = new Set();
    while (centroids.length < k) {
        let index = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(index)) {
            centroids.push(data[index]);
            usedIndices.add(index);
        }
    }
    return centroids;
}

function euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
        sum += (point1[i] - point2[i]) ** 2;
    }
    return Math.sqrt(sum);
}





const artists = [
    { id: 1, name: "Artist 1" },
    { id: 2, name: "Artist 2" },
    { id: 3, name: "Artist 3" },
    { id: 4, name: "Artist 4" },
    { id: 5, name: "Artist 5" },
    { id: 6, name: "Artist 6" },
    { id: 7, name: "Artist 7" },
    { id: 8, name: "Artist 8" },
    { id: 9, name: "Artist 9" },
];

const relationships = [
    // Cluster 1: Artists 1, 2, 3
    { startId: 1, endId: 2, sharedExhibitionMinArtworks: 10 },
    { startId: 1, endId: 3, sharedExhibitionMinArtworks: 12 },
    { startId: 2, endId: 3, sharedExhibitionMinArtworks: 11 },

    // Cluster 2: Artists 4, 5, 6
    { startId: 4, endId: 5, sharedExhibitionMinArtworks: 9 },
    { startId: 4, endId: 6, sharedExhibitionMinArtworks: 8 },
    { startId: 5, endId: 6, sharedExhibitionMinArtworks: 7 },

    // Cluster 3: Artists 7, 8, 9
    { startId: 7, endId: 8, sharedExhibitionMinArtworks: 6 },
    { startId: 7, endId: 9, sharedExhibitionMinArtworks: 5 },
    { startId: 8, endId: 9, sharedExhibitionMinArtworks: 4 },

    // Weak inter-cluster relationships (optional, to slightly connect clusters)
    { startId: 3, endId: 4, sharedExhibitionMinArtworks: 2 }, // Weak link between cluster 1 and 2
    { startId: 6, endId: 7, sharedExhibitionMinArtworks: 1 }, // Weak link between cluster 2 and 3
];


const k = 3; // Number of clusters

// Call the spectralClustering function
(async () => {
    try {
        const clusters = await spectralClustering(artists, relationships, k);
        console.log(clusters);
    } catch (error) {
        console.error(error);
    }
})();
// Inspect the result


// You will need to call this function with appropriate parameters


module.exports = {
    findAll,
    findAllNationalityTechnique,
    findAllBirthcountryTechnique,
    findAllDeathcountryTechnique,
    findAllMostExhibitedInTechnique,
    findAllTechniques, 
    findAllNationalityTechniqueAmount, 
    findAllBirthcountryTechniqueAmount,
    findAllDeathcountryTechniqueAmount,
    findAllMostExhibitedInTechniqueAmount,
    spectralClustering
};