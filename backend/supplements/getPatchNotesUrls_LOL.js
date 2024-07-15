const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPatchNotesUrls_LOL = async () => {
    const url = "https://www.leagueoflegends.com/en-us/news/tags/patch-notes/";

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
                const fullUrl = `https://www.leagueoflegends.com${patchUrl}`;
                const patchNumberMatch = patchUrl.match(/(lol-)?patch-(\d{1,2}-\d{1,2})-notes/);
                const patchNumber = patchNumberMatch ? patchNumberMatch[2] : null;
                const prefix = patchNumberMatch && patchNumberMatch[1];
                if (patchNumber) {
                    patchNotesUrls.push({
                        url: fullUrl,
                        version: patchNumber,
                        prefix: !!prefix
                    });
                }
            }
        });

        for (const { version, url, prefix } of patchNotesUrls) {
            const patchNote = `${prefix ? 'lol-' : ''}patch-${version}-notes`;
            const existingPatchNote = await prisma.patchnotes_lol.findFirst({
                where: { text: patchNote }
            });

            if (!existingPatchNote) {
                await prisma.patchnotes_lol.create({
                    data: {
                        text: patchNote,
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

module.exports = { getPatchNotesUrls_LOL };
