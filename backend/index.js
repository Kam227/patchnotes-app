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

const classifyUpdate = (text, associations) => {
  for (let keyword of associations.nerf) {
    if (text.toLowerCase().includes(keyword[0].toLowerCase()) && text.toLowerCase().includes(keyword[1].toLowerCase())) {
      return 'nerf';
    }
  }
  for (let keyword of associations.buff) {
    if (text.toLowerCase().includes(keyword[0].toLowerCase()) && text.toLowerCase().includes(keyword[1].toLowerCase())) {
      return 'buff';
    }
  }
  return 'neutral';
};

const classifyAndStore = (updates, category, patchId, associations, game) => {
  const nerfs = [];
  const buffs = [];

  updates.forEach((update) => {
    const classifiedUpdate = {
      character: update.title || category,
      details: [],
    };
    if (game === 'lol') {
      classifiedUpdate.patchIdLOL = patchId;
    } else {
      classifiedUpdate.patchIdOW = patchId;
    }

    if (update.abilityUpdates) {
      update.abilityUpdates.forEach((abilityUpdate) => {
        abilityUpdate.content.forEach((content) => {
          const classification = classifyUpdate(content, associations);
          if (classification === 'nerf') {
            classifiedUpdate.details.push({ ability: abilityUpdate.name, content, type: 'nerf' });
          } else if (classification === 'buff') {
            classifiedUpdate.details.push({ ability: abilityUpdate.name, content, type: 'buff' });
          }
        });
      });
    } else {
      console.log(`No ability updates found for character: ${update.title || category}`);
    }

    if (update.generalUpdates) {
      update.generalUpdates.forEach((generalUpdate) => {
        const classification = classifyUpdate(generalUpdate, associations);
        if (classification === 'nerf') {
          classifiedUpdate.details.push({ content: generalUpdate, type: 'nerf' });
        } else if (classification === 'buff') {
          classifiedUpdate.details.push({ content: generalUpdate, type: 'buff' });
        }
      });
    } else {
      console.log(`No general updates found for character: ${update.title || category}`);
    }

    if (classifiedUpdate.details.length) {
      if (classifiedUpdate.details.some(detail => detail.type === 'nerf')) {
        nerfs.push(classifiedUpdate);
      }
      if (classifiedUpdate.details.some(detail => detail.type === 'buff')) {
        buffs.push(classifiedUpdate);
      }
    }
  });

  return { nerfs, buffs };
};

const processPatchNotes = async (game, patches, associations) => {
  for (const patch of patches) {
    const patchDetails = await prisma[`patchnotes_${game}`].findUnique({
      where: { id: patch.id },
    });
    if (!patchDetails) {
      continue;
    }

    const allCategories = ['tank', 'damage', 'support', 'champions'];
    let allNerfs = [];
    let allBuffs = [];

    allCategories.forEach((category) => {
      if (patchDetails.details[category] && patchDetails.details[category].length) {
        const { nerfs, buffs } = classifyAndStore(patchDetails.details[category], category, patch.id, associations, game);
        allNerfs = allNerfs.concat(nerfs);
        allBuffs = allBuffs.concat(buffs);
      }
    });

    for (const nerf of allNerfs) {
      try {
        await prisma.nerf.create({ data: nerf });
      } catch (error) {
        console.error(`Failed to create nerf: ${error.message}`);
      }
    }
    for (const buff of allBuffs) {
      try {
        await prisma.buff.create({ data: buff });
      } catch (error) {
        console.error(`Failed to create buff: ${error.message}`);
      }
    }
  }
};

app.listen(PORT, async () => {
  console.log(`App is listening on http://localhost:${PORT}`);

  const associationsResponse = await prisma.association.findMany();
  const associations = {
    nerf: associationsResponse.filter(a => a.type === 'nerf').map(a => [a.keyword, a.classifier]),
    buff: associationsResponse.filter(a => a.type === 'buff').map(a => [a.keyword, a.classifier]),
  };

  try {
    const owUrls = await urls_OW.getPatchNotesUrls_OW();
    for (const { year, month } of owUrls) {
      await details_OW.getPatchNotesDetails_OW(OVERWATCH_URL, year, month);
    }

    const owPatches = await prisma.patchnotes_ow.findMany();
    await processPatchNotes('ow', owPatches, associations);
  } catch (error) {
    console.error('Error while scraping and storing Overwatch patch notes:', error.message);
  }

  try {
    const lolUrls = await urls_LOL.getPatchNotesUrls_LOL();
    for (const { version, prefix } of lolUrls) {
      await details_LOL.getPatchNotesDetails_LOL(LEAGUE_OF_LEGENDS_URL, version, prefix);
    }

    const lolPatches = await prisma.patchnotes_lol.findMany();
    await processPatchNotes('lol', lolPatches, associations);
  } catch (error) {
    console.error('Error while scraping and storing League of Legends patch notes:', error.message);
  }

  try {
    await stats_OW.getCharacterDetails_OW();
  } catch (error) {
    console.error('Error during initial scraping:', error.message);
  }

  try {
    await stats_LOL.getCharacterDetails_LOL();
  } catch (error) {
    console.error('Error during initial scraping:', error.message);
  }

  try {
    await abilities_OW.getCharacterAbilities_OW();
  } catch (error) {
    console.error('Error during initial ability parsing:', error.message);
  }

  try {
    await abilities_LOL.getCharacterAbilities_LOL();
  } catch (error) {
    console.error('Error during initial ability parsing:', error.message);
  }

  try {
    await calc.calculateOverallPercentile();
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
    const patchNotes = await prisma.patchnotes_ow.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(patchNotes);
  } catch (error) {
    console.error('Error in /patchnotes/overwatch route:', error.message);
    res.status(500).send({ error: 'Error while fetching patch notes' });
  }
});

app.get('/patchnotes/league-of-legends', async (req, res) => {
  try {
    const patchNotes = await prisma.patchnotes_lol.findMany({
      orderBy: { id: 'asc' }
    });
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

  if (!replyToId) {
    return res.status(400).json({ error: 'replyToId must be provided' });
  }

  try {
    const data = {
      message,
      user: { connect: { id: userId } },
      comment: { connect: { id: parseInt(commentId, 10) } },
      replyTo: { connect: { id: replyToId } },
      parentReply: parentReplyId ? { connect: { id: parentReplyId } } : undefined
    };

    const newReply = await prisma.reply_ow.create({
      data,
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

app.post('/patchnotes/league-of-legends/:version/comments/:commentId/replies', async (req, res) => {
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

app.get('/patchnotes/league-of-legends/:version/comments/:commentId/replies', async (req, res) => {
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

app.delete('/patchnotes/overwatch/:year/:month/comments/:commentId/replies/:replyId', async (req, res) => {
  const { replyId } = req.params;
  try {
    const deletedReply = await prisma.reply_ow.delete({
      where: { id: parseInt(replyId, 10) },
    });
    res.json(deletedReply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

app.delete('/patchnotes/league-of-legends/:version/comments/:commentId/replies/:replyId', async (req, res) => {
  const { replyId } = req.params;
  try {
    const deletedReply = await prisma.reply_ow.delete({
      where: { id: parseInt(replyId, 10) },
    });
    res.json(deletedReply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete reply' });
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

app.get('/abilities', async (req, res) => {
  try {
    const abilities = await prisma.ability.findMany();
    const abilityMap = {};

    abilities.forEach((ability) => {
      const key = `${ability.character}-${ability.name}`;
      if (!abilityMap[key]) {
        abilityMap[key] = {
          character: ability.character,
          name: ability.name,
          overallPercentile: ability.overallPercentile,
          count: 0,
        };
      }
      abilityMap[key].count += 1;
    });

    const abilityDifferences = abilities.map((ability) => {
      const key = `${ability.character}-${ability.name}`;
      const difference = ability.percentile - abilityMap[key].overallPercentile;
      return {
        character: ability.character,
        name: ability.name,
        percentile: ability.percentile,
        difference,
        count: abilityMap[key].count,
      };
    });

    res.json(abilityDifferences);
  } catch (error) {
    console.error('Error fetching abilities:', error.message);
    res.status(500).json({ error: 'Failed to fetch abilities' });
  }
});

app.get('/abilities/percentiles', async (req, res) => {
  try {
    const abilities = await prisma.ability.findMany();
    const abilityMap = {};

    abilities.forEach((ability) => {
      const key = `${ability.character}-${ability.name}`;
      if (!abilityMap[key]) {
        abilityMap[key] = [];
      }
      abilityMap[key].push(ability.percentChange);
    });

    const abilityPercentiles = abilities.map((ability) => {
      const key = `${ability.character}-${ability.name}`;
      const changes = abilityMap[key].sort((a, b) => a - b);
      const rank = changes.indexOf(ability.percentChange);
      const percentile = (1 - rank) / changes.length;

      return {
        character: ability.character,
        name: ability.name,
        percentChange: ability.percentChange,
        percentile: percentile * 100
      };
    });

    res.json(abilityPercentiles);
  } catch (error) {
    console.error('Error fetching abilities:', error.message);
    res.status(500).json({ error: 'Failed to fetch abilities' });
  }
});

app.get('/patchdata/:patchId', async (req, res) => {
  const { patchId } = req.params;

  try {
    const winrateData = await prisma.winrateChangeHistory.findMany({
      where: { patchId: parseInt(patchId) }
    });

    const abilityData = await prisma.ability.findMany({
      where: { patchIdLOL: parseInt(patchId) }
    });

    const combinedData = {};

    winrateData.forEach(item => {
      if (!combinedData[item.character]) {
        combinedData[item.character] = {
          character: item.character,
          winrateChange: 0,
          percentile: 0
        };
      }
      combinedData[item.character].winrateChange += item.winrateChange;
    });

    abilityData.forEach(item => {
      if (!combinedData[item.character]) {
        combinedData[item.character] = {
          character: item.character,
          winrateChange: 0,
          percentile: 0
        };
      }
      combinedData[item.character].percentile += item.percentile;
    });

    const result = Object.values(combinedData);

    res.json(result);
  } catch (error) {
    console.error('Error fetching patch data:', error);
    res.status(500).json({ error: 'Failed to fetch patch data' });
  }
});

const applyTransformation = (value, lambda = -3) => {
  return (Math.pow(value, lambda) - 1) / lambda;
};

app.get('/winratePredictor', async (req, res) => {
  try {
    const winrateData = await prisma.winrateChangeHistory.findMany();
    const abilityData = await prisma.ability.findMany();

    const combinedData = {};

    winrateData.forEach(item => {
      if (!combinedData[item.character]) {
        combinedData[item.character] = {
          character: item.character,
          winrateChanges: [],
          percentiles: []
        };
      }
      combinedData[item.character].winrateChanges.push({
        patchId: item.patchId,
        winrateChange: item.winrateChange
      });
    });

    abilityData.forEach(item => {
      if (!combinedData[item.character]) {
        combinedData[item.character] = {
          character: item.character,
          winrateChanges: [],
          percentiles: []
        };
      }
      combinedData[item.character].percentiles.push({
        patchId: item.patchIdLOL,
        percentile: item.percentile
      });
    });

    const rawPercentileSums = [];
    const transformedPercentileSums = [];
    const winrateChangeRatios = [];
    let totalCharacterChanges = 0;

    for (const character in combinedData) {
      const data = combinedData[character];
      const patchMap = {};

      data.percentiles.forEach(item => {
        if (!patchMap[item.patchId]) {
          patchMap[item.patchId] = { percentileSum: 0 };
        }
        patchMap[item.patchId].percentileSum += item.percentile;
      });

      data.winrateChanges.forEach(item => {
        if (patchMap[item.patchId]) {
          patchMap[item.patchId].winrateChange = item.winrateChange;
        }
      });

      for (const patchId in patchMap) {
        let { percentileSum, winrateChange } = patchMap[patchId];
        rawPercentileSums.push(percentileSum);
        if (percentileSum !== 0) {
          const transformedPercentileSum = applyTransformation(percentileSum);
          if (!isNaN(percentileSum)) {
            transformedPercentileSums.push(percentileSum);
            if ((winrateChange < 0 && transformedPercentileSum < 0) || (winrateChange > 0 && transformedPercentileSum > 0)) {
              const ratio = winrateChange / transformedPercentileSum;
              if (!isNaN(ratio)) {
                winrateChangeRatios.push(ratio);
                totalCharacterChanges += 1;
              }
            }
          }
        }
      }
    }

    const predictorValue = totalCharacterChanges > 0 ? winrateChangeRatios.reduce((acc, ratio) => acc + ratio, 0) / totalCharacterChanges : 0;

    res.json({
      predictorValue,
      rawPercentileSums,
      transformedPercentileSums
    });
  } catch (error) {
    console.error('Error calculating winrate predictor:', error);
    res.status(500).json({ error: 'Failed to calculate winrate predictor' });
  }
});

app.get('/:character', (req, res) => {
  res.send('character page');
});
