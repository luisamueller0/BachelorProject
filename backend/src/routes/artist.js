import { Router } from 'express';
import artistModel from '../models/artist';

// ROUTING
/* app.METHOD(PATH, HANDLER)
Where:
- `app` is an instance of `express`.
- `METHOD` is an [HTTP request method], in lowercase.
- `PATH` is a path on the server.
- `HANDLER` is the function executed when the route is matched.
*/


const artist = Router();

artist.get('/', async (req, res) => {
    try {
        const result = await artistModel.findAll();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

artist.get('/nationality/technique', async (req, res) => {
    try {
        const result = await artistModel.findAllNationalityTechnique();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
artist.get('/birthcountry/technique', async (req, res) => {
    try {
        const result = await artistModel.findAllBirthcountryTechnique();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
artist.get('/deathcountry/technique', async (req, res) => {
    try {
        const result = await artistModel.findAllDeathcountryTechnique();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

artist.get('/mostexhibitedincountry/technique', async (req, res) => {
    try {
        const result = await artistModel.findAllMostExhibitedInTechnique();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default artist;
