const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPatchNotesUrls_OW = async () => {
    const url = "https://overwatch.blizzard.com/en-us/news/patch-notes/";

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
        for (const year of years) {
            for (const month of months) {
                const patchUrl = `${url}live/${year}/${month}/`;
                patchNotesUrls.push({ year, month, url: patchUrl });

                const existingPatchNote = await prisma.patchnotes_ow.findFirst({
                    where: { text: `${year}/${month}` }
                });

                if (!existingPatchNote) {
                    await prisma.patchnotes_ow.create({
                        data: { text: `${year}/${month}` }
                    });
                }
            }
        }

        return patchNotesUrls;
    } catch (error) {
        console.error('Error while fetching patch notes:', error.message);
        throw new Error('Failed to fetch patch notes');
    }
}

module.exports = { getPatchNotesUrls_OW };
