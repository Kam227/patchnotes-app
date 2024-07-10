const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPatchNotesDetails_VAL = async (url, version) => {
    const uri = `${url}valorant-patch-notes-${version}/`;

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

        $('head, meta, .metadata, .header').remove();
        $('[data-testid="article-card-carousel"]').remove();

        const patchDetails = {
            agentUpdates: [],
            mapUpdates: [],
            bugFixes: []
        };

        let currentSection = null;
        let contentBuffer = [];
        let inBugFixes = false;

        const flushContentBuffer = () => {
            if (currentSection && contentBuffer.length > 0) {
                patchDetails[currentSection].push(contentBuffer.join(' '));
                contentBuffer = [];
            }
        };

        $('*').each((index, element) => {
            const text = $(element).text().trim().toUpperCase();

            if (text.includes('AGENT UPDATES')) {
                flushContentBuffer();
                currentSection = 'agentUpdates';
                inBugFixes = false;
            } else if (text.includes('MAP UPDATES')) {
                flushContentBuffer();
                currentSection = 'mapUpdates';
                inBugFixes = false;
            } else if (text.includes('BUG FIXES')) {
                flushContentBuffer();
                currentSection = 'bugFixes';
                inBugFixes = true;
            } else if (inBugFixes && (text.includes('KNOWN ISSUES') || text.includes('RELATED ARTICLES'))) {
                flushContentBuffer();
                currentSection = null;
                inBugFixes = false;
                if (text.includes('RELATED ARTICLES')) return false;
            } else if (!inBugFixes && text.includes('CONSOLE')) {
                flushContentBuffer();
                currentSection = null;
            } else if (currentSection && $(element).is('p')) {
                contentBuffer.push($.html(element));
            } else if (inBugFixes) {
                contentBuffer.push($.html(element));
            }
        });

        flushContentBuffer();

        const patch = await prisma.patchnotes_val.findFirst({
            where: {
                text: `valorant-patch-notes-${version}`
            }
        });

        if (!patch) {
            await prisma.patchnotes_val.create({
                data: {
                    text: `valorant-patch-notes-${version}`,
                    details: patchDetails
                }
            });
        } else {
            await prisma.patchnotes_val.update({
                where: {
                    id: patch.id
                },
                data: {
                    details: patchDetails
                }
            });
        }

        return patchDetails;
    } catch (error) {
        console.error('Error while fetching patch notes details:', error.message);
        throw new Error('Failed to fetch patch notes details');
    }
}

module.exports = { getPatchNotesDetails_VAL };
