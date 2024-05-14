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
        this.cluster = -1; // Default value
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
    console.log('cluster')
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

    // Step 2: Construct the degree matrix
    const degreeMatrix = adjacencyMatrix.map((value, index, matrix) => {
        return index[0] === index[1] ? Number(math.sum(matrix._data[index[0]])) : 0;
    });

    // Step 3: Construct the Laplacian matrix
    const laplacianMatrix = math.subtract(degreeMatrix, adjacencyMatrix);

   // Step 4: Compute the eigenvalues and eigenvectors
   const eigensystem = math.eigs(laplacianMatrix);

   // Check if the eigenvalues and eigenvectors are defined and not empty
   if (!eigensystem || eigensystem.values.length === 0) {
       throw new Error("Eigenvectors are undefined or missing data.");
   }
 

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
      // Perform initial kMeans Clustering
      let clusters = kMeansClustering(featureMatrixUTransposed, k, 1); // Assume minClusterSize = 1 for basic example

      // Redistribute clusters here
      clusters = redistributeClusters(featureMatrixUTransposed, clusters, k, 5, 15); // Example sizes
  
   // Assuming kMeansClustering and other related functions are d
   
    // Associate artists with their clusters
    const clusterArray = artists.map((artist, index) => ({
        ...artist,
        cluster: clusters[index]
    }));
    // Associate artists with their clusters
    const clusterAssignments = artists.map((artist, index) => {
    artist.cluster = clusters[index]; // Assign the cluster to the artist
        
});
   
    // Initialize an array of k empty arrays for the clusters
const clusteredArtists = Array.from({ length: k }, () => []);

// Populate the cluster arrays with artists
artists.forEach((artist, index) => {
  const clusterIndex = clusters[index]; // Retrieve the cluster index assigned to the artist
  clusteredArtists[clusterIndex].push(artist); // Add the artist to the corresponding cluster
});

const clusterMap = new Map();
artists.forEach((artist, index) => {
    clusterMap.set(artist.id, clusters[index]); // Correctly associate artist ID with cluster index
});


const intraClusterRelationships = Array.from({ length: k }, () => []);
const interClusterRelationshipsMap = new Map();

relationships.forEach(relationship => {
    const clusterA = clusterMap.get(relationship.startId);
    const clusterB = clusterMap.get(relationship.endId);

    if (clusterA === clusterB) {
        intraClusterRelationships[clusterA].push(relationship);
    } else {
        const key = `${Math.min(clusterA, clusterB)}-${Math.max(clusterA, clusterB)}`;
        if (!interClusterRelationshipsMap.has(key)) {
            interClusterRelationshipsMap.set(key, { 
                startId: Math.min(clusterA, clusterB), 
                endId: Math.max(clusterA, clusterB), 
                sharedExhibitions: 0, 
                sharedExhibitionMinArtworks: 0 
            });
        }
        const aggregatedRelationship = interClusterRelationshipsMap.get(key);
        aggregatedRelationship.sharedExhibitions += relationship.sharedExhibitions;
        aggregatedRelationship.sharedExhibitionMinArtworks += relationship.sharedExhibitionMinArtworks;
    }
});

const interClusterRelationships = Array.from(interClusterRelationshipsMap.values()).map(rel => 
    new exhibited_with(
        { id: rel.startId }, 
        { id: rel.endId }, 
        { sharedExhibitions: rel.sharedExhibitions, sharedExhibitionMinArtworks: rel.sharedExhibitionMinArtworks }
    )
);
console.log(clusteredArtists.length, clusteredArtists[0].length, clusteredArtists[1].length)

console.log('cluster finished')
return [
    clusteredArtists,
    intraClusterRelationships,
    interClusterRelationships  // You might want to further organize this by cluster pairs if needed
];

}
function redistributeClusters(data, clusters, k, minClusterSize, maxClusterSize) {
    const centroids = calculateCentroids(data, clusters, k);
    let clusterSizes = new Array(k).fill(0);
    clusters.forEach(cluster => clusterSizes[cluster]++);

    const needsHelp = clusterSizes.map((size, index) => ({
        index,
        size,
        type: size < minClusterSize ? 'undersized' : (size > maxClusterSize ? 'oversized' : 'ok')
    })).filter(stat => stat.type !== 'ok');

    needsHelp.forEach(need => {
        if (need.type === 'oversized') {
            data.forEach((point, idx) => {
                if (clusters[idx] === need.index) {
                    const currentClusterIndex = need.index;
                    let closest = { index: -1, distance: Infinity };
                    
                    centroids.forEach((centroid, index) => {
                        if (index !== currentClusterIndex && clusterSizes[index] < maxClusterSize) {
                            const distance = euclideanDistance(point, centroid);
                            if (distance < closest.distance) {
                                closest = { index, distance };
                            }
                        }
                    });

                    if (closest.index !== -1) {
                        clusters[idx] = closest.index;
                        clusterSizes[currentClusterIndex]--;
                        clusterSizes[closest.index]++;
                    }
                }
            });
        }
    });

    return clusters;
}
function calculateCentroids(data, clusters, k) {
    const centroids = Array(k).fill(null).map(() => []);
    data.forEach((point, index) => {
        centroids[clusters[index]].push(point);
    });
    return centroids.map(cluster => cluster.reduce((mean, point) => 
        mean.map((m, idx) => m + point[idx] / cluster.length), new Array(data[0].length).fill(0))
    );
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
    const centroids = [data[Math.floor(Math.random() * data.length)]]; // Start with one random centroid
    for (let i = 1; i < k; i++) {
        const distances = data.map(point => Math.min(...centroids.map(centroid => euclideanDistance(point, centroid))));
        const totalDistance = distances.reduce((a, b) => a + b, 0);
        const probabilities = distances.map(distance => distance / totalDistance);
        const cumulativeProbabilities = probabilities.reduce((acc, prob, index) => {
            if (index === 0) acc.push(prob);
            else acc.push(acc[index - 1] + prob);
            return acc;
        }, []);
        
        const rand = Math.random();
        const nextCentroidIndex = cumulativeProbabilities.findIndex(cumProb => cumProb >= rand);
        centroids.push(data[nextCentroidIndex]);
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





async function spectralClusteringNationality(min, max, k) {
    try {
        const [artists, relationships] = await findAllNationalityTechniqueAmount(min, max);
        const clusteredArtists = await spectralClustering(artists, relationships, k);
        return clusteredArtists;

    } catch (error) {
        console.error(error);
    }
}
async function spectralClusteringBirthcountry(min, max, k) {
    try {
        const [artists, relationships] = await findAllBirthcountryTechniqueAmount(min, max);
        const artistsWithClusters = await spectralClustering(artists, relationships, k);
        return [artistsWithClusters, relationships];

    } catch (error) {
        console.error(error);
    }
}
async function spectralClusteringDeathcountry(min, max, k) 
{
    try {
        const [artists, relationships] = await findAllDeathcountryTechniqueAmount(min, max);
        const artistsWithClusters = await spectralClustering(artists, relationships, k);
        return [artistsWithClusters, relationships];

    } catch (error) {
        console.error(error);
    }
}
async function spectralClusteringMostExhibited(min, max, k) {
    try {
        const [artists, relationships] = await findAllMostExhibitedInTechniqueAmount(min, max);
        const artistsWithClusters= await spectralClustering(artists, relationships, k);
        return [artistsWithClusters, relationships];
    } catch (error) {
        console.error(error);
    }

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
    spectralClusteringNationality,
    spectralClusteringBirthcountry,
    spectralClusteringDeathcountry,
    spectralClusteringMostExhibited
};