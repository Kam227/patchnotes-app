const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCharacterDetails_LOL() {
  const url = 'https://www.leagueofgraphs.com/champions/builds';
  try {
    const html = await request({
      uri: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Accept': 'text/html',
        'Accept-Language': 'en-US'
      }
    });

    const $ = cheerio.load(html);
    const characterStats = [];

    $('tr').each((index, element) => {
      const character = $(element).find('td').eq(1).find('.name').text().trim();
      const pickrate = parseFloat($(element).find('td').eq(2).find('progressBar').attr('data-value')) * 100;
      const winrate = parseFloat($(element).find('td').eq(3).find('progressBar').attr('data-value')) * 100;
      const banrate = parseFloat($(element).find('td').eq(4).find('progressBar').attr('data-value')) * 100;
      const kda = null;

      if (character) {
        characterStats.push({ character, pickrate, winrate, banrate, kda });
      }
    });

    for (const stats of characterStats) {
      const updatedStats = await prisma.statistics.upsert({
        where: { character: stats.character },
        update: {
          pickrate: Math.round(stats.pickrate * 100),
          winrate: Math.round(stats.winrate * 100),
          kda: stats.kda,
          banrate: Math.round(stats.banrate * 100),
        },
        create: {
          character: stats.character,
          pickrate: Math.round(stats.pickrate * 100),
          winrate: Math.round(stats.winrate * 100),
          kda: stats.kda,
          banrate: Math.round(stats.banrate * 100),
        }
      });

      await prisma.pickrateHistory.create({
        data: {
          statisticsId: updatedStats.id,
          value: stats.pickrate,
        }
      });
    }

    console.log('Scraping and storing League of Legends data completed successfully.');
  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { getCharacterDetails_LOL };
