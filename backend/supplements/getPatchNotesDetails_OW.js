const request = require('request-promise');
const cheerio = require('cheerio');

const getPatchNotesDetails_OW = async (url, year, month) => {
    const uri = `${url}live/${year}/${month}/`;

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

module.exports = { getPatchNotesDetails_OW }
