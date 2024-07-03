const express = require('express');
const session = require('express-session');
const cors = require('cors');
const connectPgSimple = require('connect-pg-simple');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const urls_OW = require('./supplements/getPatchNotesUrls_OW');
const details_OW = require('./supplements/getPatchNotesDetails_OW');
const urls_VAL = require('./supplements/getPatchNotesUrls_VAL');
const details_VAL = require('./supplements/getPatchNotesDetails_VAL');
const userRoutes = require('./routes/users');

const OVERWATCH_URL = 'https://overwatch.blizzard.com/en-us/news/patch-notes/';
const VALORANT_URL = 'https://playvalorant.com/en-us/news/game-updates/';

const app = express();

app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
);

app.use(express.json());

const store = new (connectPgSimple(session))({ createTableIfMissing: true });

app.use(
    session({
        store: store,
        secret: 'my-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: false,
            secure: false,
            maxAge: 365 * 24 * 60 * 60 * 1000,
        },
    })
);

app.use('/users', userRoutes);

const PORT = 3000;

app.listen(PORT, async () => {
    console.log(`App is listening on http://localhost:${PORT}`);

    try {
        const owUrls = await urls_OW.getPatchNotesUrls_OW();
        for (const { year, month } of owUrls) {
            await details_OW.getPatchNotesDetails_OW(OVERWATCH_URL, year, month);
        }
    } catch (error) {
        console.error('Error while scraping and storing Overwatch patch notes:', error.message);
    }

    try {
        const valUrls = await urls_VAL.getPatchNotesUrls_VAL();
        for (const { version } of valUrls) {
            await details_VAL.getPatchNotesDetails_VAL(VALORANT_URL, version);
        }
    } catch (error) {
        console.error('Error while scraping and storing Valorant patch notes:', error.message);
    }
});

app.get('/', (req, res) => {
    res.send('game selection');
});

app.get('/patchnotes/overwatch', async (req, res) => {
    try {
        const patchNotes = await prisma.patchnotes_ow.findMany();
        res.json(patchNotes);
    } catch (error) {
        console.error('Error in /patchnotes/overwatch route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes' });
    }
});

app.get('/patchnotes/valorant', async (req, res) => {
    try {
        const patchNotes = await prisma.patchnotes_val.findMany();
        res.json(patchNotes);
    } catch (error) {
        console.error('Error in /patchnotes/valorant route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes' });
    }
});

app.get('/patchnotes/overwatch/:year/:month', async (req, res) => {
    const { year, month } = req.params;
    try {
        const patchDetails = await prisma.patchnotes_ow.findMany({
            where: { text: `${year}/${month}` },
            include: { Tanks: true, Damages: true, Supports: true, Maps: true, Bugs: true },
        });
        res.json(patchDetails);
    } catch (error) {
        console.error('Error in /patchnotes/overwatch/:year/:month route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes details' });
    }
});

app.get('/patchnotes/valorant/:version', async (req, res) => {
    const { version } = req.params;
    try {
        const patchDetails = await prisma.patchnotes_val.findMany({
            where: { text: `valorant-patch-notes-${version}` },
            include: { Agents: true, Maps: true, Bugs: true },
        });
        res.json(patchDetails);
    } catch (error) {
        console.error('Error in /patchnotes/valorant/:version route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes details' });
    }
});
