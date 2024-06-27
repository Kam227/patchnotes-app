const request = require('request-promise');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');

const BASE_URL = "https://overwatch.blizzard.com/en-us/news/patch-notes/";

const getPatchNotesUrls = async () => {
    try {
        const response = await request({
            uri: BASE_URL,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/html',
                'Accept-Language': 'en-US'
            }
        });
        const $ = cheerio.load(response);

        const years = [];
        const months = [];

        $('#year-select option').each((index, element) => {
            const year = $(element).val();
            if (year) {
                years.push(year);
            }
        });

        $('#month-select option').each((index, element) => {
            const month = $(element).val();
            if (month) {
                months.push(month);
            }
        });

        const patchNotesUrls = [];
        years.forEach(year => {
            months.forEach(month => {
                patchNotesUrls.push({
                    url: `${BASE_URL}live/${year}/${month}/`,
                    year,
                    month
                });
            });
        });

        return patchNotesUrls;
    } catch (error) {
        console.error('Error while fetching patch notes:', error.message);
        throw new Error('Failed to fetch patch notes');
    }
}

const getPatchNotesDetails = async (year, month) => {
    const url = `${BASE_URL}live/${year}/${month}/`;
    try {
        const response = await request({
            uri: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }
        });
        const $ = cheerio.load(response);

        const patchDetails = {
            tank: [],
            damage: [],
            support: [],
            mapUpdates: [],
            bugFixes: []
        };

        const roleSections = {
            TANK: patchDetails.tank,
            DAMAGE: patchDetails.damage,
            SUPPORT: patchDetails.support,
            "MAP UPDATES": patchDetails.mapUpdates,
            "BUG FIXES": patchDetails.bugFixes
        };

        $('.PatchNotes-section').each((index, element) => {
            const sectionTitle = $(element).find('.PatchNotes-sectionTitle').text().trim().toUpperCase();
            if (roleSections[sectionTitle]) {
                $(element).find('.PatchNotes-sectionTitle').remove();
                const content = $(element).html().trim();
                if (content) {
                    roleSections[sectionTitle].push(content);
                }
            }
        });

        return patchDetails;
    } catch (error) {
        console.error('Error while fetching patch notes details:', error.message);
        throw new Error('Failed to fetch patch notes details');
    }
}

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

    app.get('/patchnotes', async (req, res) => {
        try {
            const urls = await getPatchNotesUrls();
            res.json(urls);
        } catch (error) {
            console.error('Error in /patchnotes route:', error.message);
            res.status(500).send({ error: 'Error while fetching patch notes' });
        }
    });

    app.get('/patchnotes/:year/:month', async (req, res) => {
        const { year, month } = req.params;
        try {
            const details = await getPatchNotesDetails(year, month);
            res.json(details);
        } catch (error) {
            console.error('Error in /patchnotes/:year/:month route:', error.message);
            res.status(500).send({ error: 'Error while fetching patch notes details' });
        }
    });

    app.get('/game/patch/character', (req, res) => {
        res.send('character stats section');
    });
}

startServer();
