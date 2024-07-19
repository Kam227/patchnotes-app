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
const stats_OW = require('./supplements/getCharacterDetails_OW');
const stats_LOL = require('./supplements/getCharacterDetails_LOL');
const abilities_OW = require('./supplements/getCharacterAbilities_OW');
const abilities_LOL = require('./supplements/getCharacterAbilities_LOL');
const userRoutes = require('./routes/users');
const calc = require('./supplements/calculateOverallPercentile');

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

  try {
    await stats_OW.getCharacterDetails_OW();
    console.log('Initial scraping completed.');
  } catch (error) {
    console.error('Error during initial scraping:', error.message);
  }

  try {
    await stats_LOL.getCharacterDetails_LOL();
    console.log('Initial scraping completed.');
  } catch (error) {
    console.error('Error during initial scraping:', error.message);
  }

  try {
    await abilities_OW.getCharacterAbilities_OW();
    console.log('Initial ability parsing completed.');
  } catch (error) {
    console.error('Error during initial ability parsing:', error.message);
  }

  try {
    await abilities_LOL.getCharacterAbilities_LOL();
    console.log('Initial ability parsing completed.');
  } catch (error) {
    console.error('Error during initial ability parsing:', error.message);
  }

  try {
    await calc.calculateOverallPercentile();
    console.log('Overall percentile calculation completed.');
  } catch (error) {
      console.error('Error during overall percentile calculation:', error.message);
  }
});

app.get('/', (req, res) => {
  res.send('game selection');
});

// devtools
app.get('/devtools', (req, res) => {
  res.send('developer tools');
});

app.get('/words', async (req, res) => {
  try {
    const words = await prisma.word.findMany();
    const categorizedWords = words.reduce((acc, word) => {
      acc[word.category] = acc[word.category] || [];
      acc[word.category].push(word.word);
      return acc;
    }, {});

    res.json({
      usableWords: categorizedWords.usable || [],
      deletedWords: categorizedWords.deleted || [],
      keywords: categorizedWords.keyword || [],
      classifiers: categorizedWords.classifier || [],
    });
  } catch (error) {
    console.error('Error fetching words:', error.message);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});


app.put('/words', async (req, res) => {
  const { usableWords, deletedWords, keywords, classifiers } = req.body;

  try {
    await prisma.$transaction(
      usableWords.map(word => prisma.word.upsert({
        where: { word },
        update: { category: 'usable' },
        create: { word, category: 'usable' }
      }))
    );

    await prisma.$transaction(
      deletedWords.map(word => prisma.word.upsert({
        where: { word },
        update: { category: 'deleted' },
        create: { word, category: 'deleted' }
      }))
    );

    await prisma.$transaction(
      keywords.map(word => prisma.word.upsert({
        where: { word },
        update: { category: 'keyword' },
        create: { word, category: 'keyword' }
      }))
    );

    await prisma.$transaction(
      classifiers.map(word => prisma.word.upsert({
        where: { word },
        update: { category: 'classifier' },
        create: { word, category: 'classifier' }
      }))
    );

    res.json({ message: 'Words updated successfully' });
  } catch (error) {
    console.error('Error saving words:', error.message);
    res.status(500).json({ error: 'Failed to save words' });
  }
});

app.put('/words/category/:category', async (req, res) => {
  const { category } = req.params;
  const { words } = req.body;

  if (!['keyword', 'classifier', 'usable', 'deleted'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    await prisma.$transaction(
      words.map(word => prisma.word.upsert({
        where: { word },
        update: { category },
        create: { word, category }
      }))
    );

    res.json({ message: 'Words updated successfully' });
  } catch (error) {
    console.error('Error updating words:', error.message);
    res.status(500).json({ error: 'Failed to update words' });
  }
});

app.delete('/words/:word', async (req, res) => {
  const { word } = req.params;
  try {
    await prisma.word.deleteMany({ where: { word } });
    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Error deleting word:', error.message);
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

// main
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

// comments
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
    res.json(deletedComment);
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
    res.json(deletedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

app.put('/patchnotes/overwatch/:year/:month/:commentId/vote', cors(), async (req, res) => {
  const { commentId } = req.params;
  try {
    const updatedVote = await prisma.comment_ow.update({
      where: { id: parseInt(commentId, 10) },
      data: {
        voteCount: { increment: 1 },
      },
    });
    res.json(updatedVote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upvote comment' });
  }
});

app.put('/patchnotes/league-of-legends/:version/:commentId/vote', cors(), async (req, res) => {
  const { commentId } = req.params;
  try {
    const updatedVote = await prisma.comment_lol.update({
      where: { id: parseInt(commentId, 10) },
      data: {
        voteCount: { increment: 1 },
      },
    });
    res.json(updatedVote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upvote comment' });
  }
});

// replies
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

// associations
app.post('/associations', async (req, res) => {
  const { nerf, buff } = req.body;

  try {
    await prisma.association.deleteMany({});

    await prisma.$transaction(
      nerf.map(([keyword, classifier]) => prisma.association.create({
        data: { type: 'nerf', keyword, classifier }
      }))
    );

    await prisma.$transaction(
      buff.map(([keyword, classifier]) => prisma.association.create({
        data: { type: 'buff', keyword, classifier }
      }))
    );

    res.json({ message: 'Associations updated successfully' });
  } catch (error) {
    console.error('Error in /associations route:', error.message);
    res.status(500).json({ error: 'Failed to create associations' });
  }
});

app.get('/associations', async (req, res) => {
  try {
    const associations = await prisma.association.findMany();
    const nerfs = associations.filter(a => a.type === 'nerf').map(a => [a.keyword, a.classifier]);
    const buffs = associations.filter(a => a.type === 'buff').map(a => [a.keyword, a.classifier]);

    res.json({ nerf: nerfs, buff: buffs });
  } catch (error) {
    console.error('Error fetching associations:', error.message);
    res.status(500).json({ error: 'Failed to fetch associations' });
  }
});


app.delete('/associations/:type/:index', async (req, res) => {
  const { type, index } = req.params;
  try {
    const associations = await prisma.association.findMany({ where: { type } });
    const associationId = associations[index].id;

    await prisma.association.delete({ where: { id: associationId } });

    res.json({ message: 'Association deleted successfully' });
  } catch (error) {
    console.error('Error deleting association:', error.message);
    res.status(500).json({ error: 'Failed to delete association' });
  }
});

// character stats
app.get('/stats/:character', async (req, res) => {
  const { character } = req.params;
  try {
    const stats = await prisma.statistics.findUnique({
      where: { character },
      include: { pickrateHistory: true }
    });
    if (stats) {
      res.json(stats);
    } else {
      res.status(404).json({ error: 'Character not found' });
    }
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// abilities
app.get('/abilities', async (req, res) => {
  try {
    const abilities = await prisma.ability.findMany();
    const abilityMap = {};

    abilities.forEach((ability) => {
      const key = `${ability.character}-${ability.name}-${ability.patchIdOW || ability.patchIdLOL}`;
      if (!abilityMap[key]) {
        abilityMap[key] = {
          character: ability.character,
          name: ability.name,
          combinedPercentile: 0,
          count: 0,
          overallPercentile: ability.overallPercentile,
        };
      }
      abilityMap[key].combinedPercentile += Math.abs(ability.percentile);
      abilityMap[key].count += 1;
    });

    const abilityDifferences = Object.values(abilityMap).map((entry) => {
      const averagePercentile = entry.combinedPercentile / entry.count;
      const difference = averagePercentile - entry.overallPercentile;
      return {
        character: entry.character,
        name: entry.name,
        difference,
      };
    });

    res.json(abilityDifferences);
  } catch (error) {
    console.error('Error fetching abilities:', error.message);
    res.status(500).json({ error: 'Failed to fetch abilities' });
  }
});

app.get('/:character', (req, res) => {
  res.send('character page');
});
