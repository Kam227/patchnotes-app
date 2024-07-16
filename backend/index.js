const express = require('express');
const session = require('express-session');
const cors = require('cors');
const connectPgSimple = require('connect-pg-simple');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const urls_OW = require('./supplements/getPatchNotesUrls_OW');
const details_OW = require('./supplements/getPatchNotesDetails_OW');
const urls_LOL = require('./supplements/getPatchNotesUrls_LOL');
const details_LOL = require('./supplements/getPatchNotesDetails_LOL');
const userRoutes = require('./routes/users');

const OVERWATCH_URL = 'https://overwatch.blizzard.com/en-us/news/patch-notes/';
const LEAGUE_OF_LEGENDS_URL = 'https://www.leagueoflegends.com/en-us/news/game-updates/';

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
        const lolUrls = await urls_LOL.getPatchNotesUrls_LOL();
        for (const { version, prefix } of lolUrls) {
            await details_LOL.getPatchNotesDetails_LOL(LEAGUE_OF_LEGENDS_URL, version, prefix);
        }
    } catch (error) {
        console.error('Error while scraping and storing League of Legends patch notes:', error.message);
    }
});

app.get('/', (req, res) => {
    res.send('game selection');
});

app.get('/devtools', (req, res) => {
    res.send('developer tools')
})

app.get('/patchnotes/overwatch', async (req, res) => {
    try {
        const patchNotes = await prisma.patchnotes_ow.findMany();
        res.json(patchNotes);
    } catch (error) {
        console.error('Error in /patchnotes/overwatch route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes' });
    }
});

app.get('/patchnotes/league-of-legends', async (req, res) => {
    try {
        const patchNotes = await prisma.patchnotes_lol.findMany();
        res.json(patchNotes);
    } catch (error) {
        console.error('Error in /patchnotes/league-of-legends route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes' });
    }
});

app.get('/patchnotes/overwatch/:year/:month', async (req, res) => {
    const { year, month } = req.params;
    try {
        const patchDetails = await prisma.patchnotes_ow.findFirst({
            where: { text: `${year}/${month}` },
            include: {
                comments: {
                    include: {
                        user: true,
                        replies: {
                            include: { user: true, replyTo: true }
                        }
                    }
                }
            }
        });
        res.json(patchDetails || {});
    } catch (error) {
        console.error('Error in /patchnotes/overwatch/:year/:month route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes details' });
    }
});

app.get('/patchnotes/league-of-legends/:version', async (req, res) => {
    const { version } = req.params;
    try {
        const patchDetails = await prisma.patchnotes_lol.findFirst({
            where: {
                OR: [
                    { text: `lol-patch-${version}-notes` },
                    { text: `patch-${version}-notes` }
                ]
            },
            include: {
                comments: {
                    include: {
                        user: true,
                        replies: {
                            include: { user: true, replyTo: true }
                        }
                    }
                }
            }
        });
        res.json(patchDetails || {});
    } catch (error) {
        console.error('Error in /patchnotes/league-of-legends/:version route:', error.message);
        res.status(500).send({ error: 'Error while fetching patch notes details' });
    }
});

app.post('/patchnotes/overwatch/:year/:month/comments', async (req, res) => {
    const { message, patchId, userId } = req.body;
    try {
        const newComment = await prisma.comment_ow.create({
            data: {
                message,
                patchId,
                userId,
            },
        });
        res.json(newComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

app.post('/patchnotes/league-of-legends/:version/comments', async (req, res) => {
    const { message, patchId, userId } = req.body;
    try {
        const newComment = await prisma.comment_lol.create({
            data: {
                message,
                patchId,
                userId,
            },
        });
        res.json(newComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

app.delete('/patchnotes/overwatch/:year/:month/:commentId', cors(), async (req, res) => {
    const { commentId } = req.params;
    try {
        const deletedComment = await prisma.comment_ow.delete({
            where: { id: parseInt(commentId, 10) },
        });
        res.json(deletedComment)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

app.delete('/patchnotes/league-of-legends/:version/:commentId', cors(), async (req, res) => {
    const { commentId } = req.params;
    try {
        const deletedComment = await prisma.comment_lol.delete({
            where: { id: parseInt(commentId, 10) },
        });
        res.json(deletedComment)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

app.put('/patchnotes/overwatch/:year/:month/:commentId/vote', cors(), async (req, res) => {
    const { commentId } = req.params;
    try {
        const updatedVote = await prisma.comment_ow.update({
            where: { id: parseInt( commentId, 10) },
            data: {
                voteCount: { increment: 1 },
            },
        });
        res.json(updatedVote);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upvote comment'});
    }
});

app.put('/patchnotes/league-of-legends/:version/:commentId/vote', cors(), async (req, res) => {
    const { commentId } = req.params;
    try {
        const updatedVote = await prisma.comment_lol.update({
            where: { id: parseInt( commentId, 10) },
            data: {
                voteCount: { increment: 1 },
            },
        });
        res.json(updatedVote);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upvote comment'});
    }
});

// REPLIES
app.post('/patchnotes/overwatch/:year/:month/comments/:commentId/replies', async (req, res) => {
    const { message, userId, replyToId, parentReplyId } = req.body;
    const { commentId } = req.params;
    try {
        const newReply = await prisma.reply_ow.create({
            data: {
                message,
                user: { connect: { id: userId } },
                comment: { connect: { id: parseInt(commentId, 10) } },
                replyTo: { connect: { id: replyToId } },
                parentReply: parentReplyId ? { connect: { id: parentReplyId } } : undefined
            },
            include: { user: true, replyTo: true },
        });
        res.json(newReply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create reply' });
    }
});

app.get('/patchnotes/overwatch/:year/:month/comments/:commentId/replies', async (req, res) => {
    const { commentId } = req.params;
    try {
        const replies = await prisma.reply_ow.findMany({
            where: { commentId: parseInt(commentId, 10) },
            include: { user: true, replyTo: true, replies: true },
        });
        res.json(replies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch replies' });
    }
});

// ASSOCIATIONS
app.post('/associations', async (req, res) => {
    const { nerf, buff } = req.body;
    try {
        await prisma.association.deleteMany({});

        const newAssociation = await prisma.association.create({
            data: {
                nerf,
                buff
            },
        });
        res.json(newAssociation);
    } catch (error) {
        console.error('Error in /associations route:', error.message);
        res.status(500).json({ error: 'Failed to create association' });
    }
});

app.get('/associations', async (req, res) => {
    try {
        const associations = await prisma.association.findFirst();
        res.json(associations);
    } catch (error) {
        console.error('Error fetching associations:', error.message);
        res.status(500).json({ error: 'Failed to fetch associations' });
    }
});
