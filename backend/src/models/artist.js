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

   console.log('eigenvec', eigensystem.eigenvectors[0].vector)

   /* 
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
   }); */
   // Extract the first k eigenvectors

   // Extract the first three eigenvectors
const firstThreeEigenvectors = eigensystem.eigenvectors.slice(0, k);

// Initialize the feature matrix
const featureMatrixU = [];

// Loop over the eigenvectors
for (let i = 0; i < firstThreeEigenvectors.length; i++) {
    const vector = firstThreeEigenvectors[i].vector.toArray(); // Convert DenseMatrix to array
    featureMatrixU.push(vector); // Push the vector as a column in the feature matrix
}

// Transpose the feature matrix to have columns as data points
const featureMatrixUTransposed = math.transpose(featureMatrixU);
   const clusters = kMeansClustering(featureMatrixUTransposed, k);
   
   // Assuming kMeansClustering and other related functions are d
   
    // Associate artists with their clusters
    const artistsWithClusters = artists.map((artist, index) => ({
        ...artist,
        cluster: clusters[index]
    }));

    return clusters;

}
function kMeansClustering(data, k, minClusterSize) {
    const maxIterations = 500;
    let bestCentroids = [];
    let bestClusterAssignments = [];
    let minTotalDistance = Infinity;

    for (let initialization = 0; initialization < 10; initialization++) { // Try multiple random initializations
        let centroids = initializeCentroids(data, k);
        let clusterAssignments = [];

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const newClusterAssignments = assignPointsToCentroids(data, centroids);
            const newCentroids = updateCentroids(data, newClusterAssignments, k);

            if (centroidsEqual(newCentroids, centroids)) {
                clusterAssignments = newClusterAssignments;
                break;
            }

            centroids = newCentroids;
        }

        const totalDistance = calculateTotalDistance(data, centroids, clusterAssignments);
        if (totalDistance < minTotalDistance) {
            bestCentroids = centroids;
            bestClusterAssignments = clusterAssignments;
            minTotalDistance = totalDistance;
        }
    }

    // Ensure each cluster meets the minimum size requirement
    let clusterSizes = new Array(k).fill(0);
    bestClusterAssignments.forEach(clusterIndex => {
        clusterSizes[clusterIndex]++;
    });

    // Reassign points until each cluster has at least minClusterSize points
    for (let i = 0; i < k; i++) {
        while (clusterSizes[i] < minClusterSize) {
            // Find the point farthest from its centroid in cluster i
            let farthestPointIndex = -1;
            let maxDistance = -1;

            data.forEach((point, index) => {
                if (bestClusterAssignments[index] === i) {
                    const distance = euclideanDistance(point, bestCentroids[i]);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                        farthestPointIndex = index;
                    }
                }
            });

            // Reassign the farthest point to the nearest cluster
            let minDistance = Infinity;
            let nearestClusterIndex = -1;
            for (let j = 0; j < k; j++) {
                if (j !== i) {
                    const distance = euclideanDistance(data[farthestPointIndex], bestCentroids[j]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestClusterIndex = j;
                    }
                }
            }

            // Reassign the point to the nearest cluster
            bestClusterAssignments[farthestPointIndex] = nearestClusterIndex;
            clusterSizes[i]--;
            clusterSizes[nearestClusterIndex]++;
        }
    }

    return bestClusterAssignments;
}


function initializeCentroids(data, k) {
    const centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k) {
        const index = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(index)) {
            centroids.push(data[index]);
            usedIndices.add(index);
        }
    }
    return centroids;
}

function assignPointsToCentroids(data, centroids) {
    const clusterAssignments = [];
    for (const point of data) {
        let minDistance = Infinity;
        let closestCentroidIndex = -1;
        for (let i = 0; i < centroids.length; i++) {
            const distance = euclideanDistance(point, centroids[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestCentroidIndex = i;
            }
        }
        clusterAssignments.push(closestCentroidIndex);
    }
    return clusterAssignments;
}

function updateCentroids(data, clusterAssignments, k) {
    const newCentroids = new Array(k).fill(0).map(() => new Array(data[0].length).fill(0));
    const clusterCounts = new Array(k).fill(0);

    for (let i = 0; i < data.length; i++) {
        const clusterIndex = clusterAssignments[i];
        for (let j = 0; j < data[i].length; j++) {
            newCentroids[clusterIndex][j] += data[i][j];
        }
        clusterCounts[clusterIndex]++;
    }

    for (let i = 0; i < k; i++) {
        if (clusterCounts[i] !== 0) {
            for (let j = 0; j < newCentroids[i].length; j++) {
                newCentroids[i][j] /= clusterCounts[i];
            }
        } else {
            // If no points were assigned to this cluster, keep the centroid unchanged
        }
    }

    return newCentroids;
}

function centroidsEqual(centroids1, centroids2) {
    for (let i = 0; i < centroids1.length; i++) {
        for (let j = 0; j < centroids1[i].length; j++) {
            if (centroids1[i][j] !== centroids2[i][j]) {
                return false;
            }
        }
    }
    return true;
}

function euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
        sum += (point1[i] - point2[i]) ** 2;
    }
    return Math.sqrt(sum);
}

function calculateTotalDistance(data, centroids, clusterAssignments) {
    let totalDistance = 0;
    for (let i = 0; i < data.length; i++) {
        totalDistance += euclideanDistance(data[i], centroids[clusterAssignments[i]]);
    }
    return totalDistance;
}




const k = 10; // Number of clusters

// Call the spectralClustering function
(async () => {
    try {
        const [artists,relationships] = await findAllNationalityTechniqueAmount(100, 400);
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