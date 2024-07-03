const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPatchNotesUrls_VAL = async () => {
    const url = "https://playvalorant.com/en-us/news/tags/patch-notes/";

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

        const patchNotesUrls = [];

        $('[data-testid="articlefeaturedcard-component"]').each((index, element) => {
            const patchUrl = $(element).attr('href');
            if (patchUrl) {
                const fullUrl = `https://playvalorant.com${patchUrl}`;
                const patchNumberMatch = patchUrl.match(/valorant-patch-notes-([\d.-]+)/);
                const patchNumber = patchNumberMatch ? patchNumberMatch[1] : null;
                if (patchNumber) {
                    patchNotesUrls.push({
                        url: fullUrl,
                        version: patchNumber
                    });
                }
            }
        });

        for (const { version, url } of patchNotesUrls) {
            const patchNote = `valorant-patch-notes-${version}`;
            const existingPatchNote = await prisma.patchnotes_val.findFirst({
                where: { text: patchNote }
            });

            if (!existingPatchNote) {
                await prisma.patchnotes_val.create({
                    data: { text: patchNote }
                });
            }
        }

        return patchNotesUrls;
    } catch (error) {
        console.error('Error while fetching patch notes:', error.message);
        throw new Error('Failed to fetch patch notes');
    }
}

module.exports = { getPatchNotesUrls_VAL };
