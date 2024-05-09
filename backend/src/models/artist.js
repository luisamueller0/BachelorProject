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
        const weight = normalizedSharedExhibitionValues.get(relationship.startId); // use normalized value
        adjacencyMatrix.set([i, j], weight);
        adjacencyMatrix.set([j, i], weight); // since it's an undirected graph
    });


    // Step 2: Construct the degree matrix
    const degreeMatrix = adjacencyMatrix.map((value, index, matrix) => {
        return index[0] === index[1] ? math.sum(matrix._data[index[0]]) : 0;
    });

    // Step 3: Construct the Laplacian matrix
    const laplacianMatrix = math.subtract(degreeMatrix, adjacencyMatrix);

    // Step 4: Compute the eigenvalues and eigenvectors
    const {values, vectors} = math.eigs(laplacianMatrix);

    // Step 5: Cluster the rows of the eigenvectors corresponding to the k smallest eigenvalues
    const rows = vectors._data.map(row => row.slice(0, k));
    const clusters = kMeansClustering(rows, k);

    return clusters;
}

function kMeansClustering(data, k, maxIterations = 100) {
    // Step 1: Initialize centroids
    let centroids = initializeCentroids(data, k);

    let prevCentroids;
    let iterations = 0;

    // Repeat until convergence or maxIterations reached
    while (!areCentroidsEqual(centroids, prevCentroids) && iterations < maxIterations) {
        // Step 2: Assign points to clusters
        const clusters = assignPointsToClusters(data, centroids);

        // Step 3: Update centroids
        prevCentroids = centroids;
        centroids = updateCentroids(data, clusters, k);

        iterations++;
    }

    return clusters;
}

function initializeCentroids(data, k) {
    // Randomly select k data points as initial centroids
    const centroids = [];
    const dataCopy = [...data]; // Create a copy to avoid modifying original data

    for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * dataCopy.length);
        centroids.push(dataCopy.splice(randomIndex, 1)[0]); // Remove selected point from dataCopy and add to centroids
    }

    return centroids;
}

function assignPointsToClusters(data, centroids) {
    const clusters = new Array(centroids.length).fill().map(() => []);

    // Assign each point to the nearest centroid
    data.forEach(point => {
        const distances = centroids.map(centroid => calculateDistance(point, centroid));
        const nearestCentroidIndex = distances.indexOf(Math.min(...distances));
        clusters[nearestCentroidIndex].push(point);
    });

    return clusters;
}

function updateCentroids(data, clusters, k) {
    const newCentroids = [];

    // Calculate mean of points in each cluster to get new centroids
    clusters.forEach(cluster => {
        if (cluster.length > 0) {
            const clusterMean = cluster.reduce((acc, point) => {
                return acc.map((val, i) => val + point[i]); // Add corresponding coordinates
            }, new Array(data[0].length).fill(0)).map(val => val / cluster.length); // Calculate mean
            newCentroids.push(clusterMean);
        } else {
            // If cluster is empty, retain the previous centroid
            newCentroids.push(centroids[newCentroids.length]);
        }
    });

    return newCentroids;
}

function calculateDistance(point1, point2) {
    // Euclidean distance between two points in n-dimensional space
    return Math.sqrt(point1.reduce((acc, val, i) => acc + (val - point2[i]) ** 2, 0));
}

function areCentroidsEqual(centroids1, centroids2) {
    if (!centroids1 || !centroids2 || centroids1.length !== centroids2.length) {
        return false;
    }

    // Check if each centroid is equal to its counterpart
    return centroids1.every((centroid, i) => centroid.every((val, j) => val === centroids2[i][j]));
}


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