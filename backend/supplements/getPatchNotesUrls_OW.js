const request = require('request-promise');
const cheerio = require('cheerio');

const getPatchNotesUrls_OW = async (url) => {
    try {
        const response = await request({
            uri: url,
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
                    url: `${url}live/${year}/${month}/`,
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

module.exports = { getPatchNotesUrls_OW }
