const express = require('express');
const cors = require('cors');
const urls_OW = require('./supplements/getPatchNotesUrls_OW');
const details_OW = require('./supplements/getPatchNotesDetails_OW');
const urls_VAL = require('./supplements/getPatchNotesUrls_VAL');
const details_VAL = require('./supplements/getPatchNotesDetails_VAL');

const OVERWATCH_URL = "https://overwatch.blizzard.com/en-us/news/patch-notes/";
const VALORANT_URL = "https://playvalorant.com/en-us/news/tags/patch-notes/";

const startServer = async () => {
    const app = express();
    app.use(cors());

    const PORT = 3000;

    app.listen(PORT, () => {
        console.log(`App is listening on http://localhost:${PORT}`);
    });

    app.get('/', (req, res) => {
        res.send('game selection');
    });

    app.get('/patchnotes/overwatch', async (req, res) => {
        try {
            const urls = await urls_OW.getPatchNotesUrls_OW(OVERWATCH_URL);
            res.json(urls);
        } catch (error) {
            console.error('Error in /patchnotes/overwatch route:', error.message);
            res.status(500).send({ error: 'Error while fetching patch notes' });
        }
    });

    app.get('/patchnotes/valorant', async (req, res) => {
        try {
            const urls = await urls_VAL.getPatchNotesUrls_VAL(VALORANT_URL);
            res.json(urls);
        } catch (error) {
            console.error('Error in /patchnotes/valorant route:', error.message);
            res.status(500).send({ error: 'Error while fetching patch notes' });
        }
    });

    app.get('/patchnotes/overwatch/:year/:month', async (req, res) => {
        const { year, month } = req.params;
        try {
            const details = await details_OW.getPatchNotesDetails_OW(OVERWATCH_URL, year, month);
            res.json(details);
        } catch (error) {
            console.error('Error in /patchnotes/overwatch/:year/:month route:', error.message);
            res.status(500).send({ error: 'Error while fetching patch notes details' });
        }
    });

    app.get('/patchnotes/valorant/:version', async (req, res) => {
        const { version } = req.params;
        try {
            const details = await details_VAL.getPatchNotesDetails_VAL(VALORANT_URL, version);
            res.json(details);
        } catch (error) {
            console.error('Error in /patchnotes/valorant/:version route:', error.message);
            res.status(500).send({ error: 'Error while fetching patch notes details' });
        }
    });

    // work on this later
    app.get('/game/patchnotes/:id', (req, res) => {
        res.send('character stats section');
    });
}

startServer();
