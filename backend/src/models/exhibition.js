const dbSemaphore = require('../semaphoreHandler');
const math = require('mathjs');
const { session } = require('../db');  // Ensure this is correctly importing the session



class Exhibition {
    constructor(data) {
        this.id = Number(data.id); 
        this.start_date = data.startdate;
        this.end_date = data.enddate;
        this.name = data.title;
        this.took_place_in_country = data.tookPlaceInCountry;
        this.type = data.type;
    }


}

const findAllExhibitions = async () => {
    const query = `MATCH (n:Exhibition) WHERE n.forUse = true RETURN n`;
    
    try {
        return await dbSemaphore.runExclusive(async () => {
            const result = await session.run(query);
            return processExhibitions(result);
        });
    } catch (error) {
        console.error('Error finding exhibitions:', error);
        throw error;
    } finally {
        session.close();  // Ensure the session is closed after the query
    }
};

const processExhibitions = (result) => {
    const exhibitions = [];
    
    result.records.forEach(record => {
        const data = record.get('n').properties;  // Access the properties of the node
        const exhibition = new Exhibition(data);
        exhibitions.push(exhibition);
    });
    
    return exhibitions;
};

module.exports = {
    findAllExhibitions
};
