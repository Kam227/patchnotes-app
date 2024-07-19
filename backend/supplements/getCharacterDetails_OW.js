const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCharacterDetails_OW() {
  const url = 'https://www.overbuff.com/heroes?platform=pc&timeWindow=month';
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

    $('tr.group').each((index, element) => {
      const character = $(element).find('a.font-semibold.uppercase.whitespace-nowrap').text().trim();
      const pickrateText = $(element).find('td').eq(1).find('span').first().text().replace('%', '');
      const winrateText = $(element).find('td').eq(2).find('span').first().text().replace('%', '');
      const kdaText = $(element).find('td').eq(3).find('span').first().text();

      const pickrate = parseFloat(pickrateText);
      const winrate = parseFloat(winrateText);
      const kda = parseFloat(kdaText);
      const banrate = null;
      characterStats.push({ character, pickrate, winrate, kda, banrate });
    });

    for (const stats of characterStats) {
      const updatedStats = await prisma.statistics.upsert({
        where: { character: stats.character },
        update: {
          pickrate: Math.round(stats.pickrate * 100),
          winrate: Math.round(stats.winrate * 100),
          kda: Math.round(stats.kda * 100),
          banrate: stats.banrate,
        },
        create: {
          character: stats.character,
          pickrate: Math.round(stats.pickrate * 100),
          winrate: Math.round(stats.winrate * 100),
          kda: Math.round(stats.kda * 100),
          banrate: stats.banrate,
        }
      });

      await prisma.pickrateHistory.create({
        data: {
          statisticsId: updatedStats.id,
          value: stats.pickrate,
        }
      });
    }

    console.log('Scraping and storing Overwatch data completed successfully.');
  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { getCharacterDetails_OW };
