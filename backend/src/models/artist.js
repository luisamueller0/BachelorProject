const { session } = require('../db.js');

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
