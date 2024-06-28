const request = require('request-promise');
const cheerio = require('cheerio');

const getPatchNotesDetails_VAL = async (url, version) => {
    const uri = `https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-${version}/`;

    try {
        const response = await request({
            uri: uri,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/html',
                'Accept-Language': 'en-US'
            }
        });
        const $ = cheerio.load(response);

        const patchDetails = {
            agentUpdates: [],
            mapUpdates: [],
            bugFixes: []
        };

        $('.sc-4225abdc-0').each((index, element) => {
            const sectionTitle = $(element).find('h1, h2').first().text().trim().toUpperCase();
            const content = $(element).html().trim();

            if (sectionTitle.includes('AGENT UPDATES')) {
                patchDetails.agentUpdates.push(content);
            } else if (sectionTitle.includes('MAP UPDATES')) {
                patchDetails.mapUpdates.push(content);
            } else if (sectionTitle.includes('BUG FIXES')) {
                patchDetails.bugFixes.push(content);
            }
        });

        return patchDetails;
    } catch (error) {
        console.error('Error while fetching patch notes details:', error.message);
        throw new Error('Failed to fetch patch notes details');
    }
}

module.exports = { getPatchNotesDetails_VAL };
