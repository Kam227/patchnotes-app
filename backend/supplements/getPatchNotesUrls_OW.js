const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPatchNotesUrls_OW = async () => {
    const url = "https://overwatch.blizzard.com/en-us/news/patch-notes/";
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

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
            const year = parseInt($(element).val(), 10);
            if (year && year <= currentYear) {
                years.push(year);
            }
        });

        $('#month-select option').each((index, element) => {
            const month = parseInt($(element).val(), 10);
            if (month && month <= 12) {
                months.push(month);
            }
        });

        const patchNotesUrls = [];
        for (const year of years) {
            for (const month of months) {
                if (year < currentYear || (year === currentYear && month <= currentMonth)) {
                    const patchUrl = `${url}live/${year}/${month}/`;
                    patchNotesUrls.push({ year, month, url: patchUrl });
                }
            }
        }

        patchNotesUrls.sort((a, b) => {
            if (a.year === b.year) {
                return b.month - a.month;
            }
            return b.year - a.year;
        });

        for (const patchNote of patchNotesUrls) {
            const { year, month, url: patchUrl } = patchNote;
            const existingPatchNote = await prisma.patchnotes_ow.findFirst({
                where: { text: `${year}/${month}` }
            });

            if (!existingPatchNote) {
                await prisma.patchnotes_ow.create({
                    data: {
                        text: `${year}/${month}`,
                        details: {}
                    }
                });
            }
        }

        return patchNotesUrls;
    } catch (error) {
        console.error('Error while fetching patch notes:', error.message);
        throw new Error('Failed to fetch patch notes');
    }
}

module.exports = { getPatchNotesUrls_OW };
