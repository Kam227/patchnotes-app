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

        const patchDetails = {
            agentUpdates: [],
            mapUpdates: [],
            bugFixes: []
        };

        const roleSections = {
            "AGENT UPDATES": patchDetails.agentUpdates,
            "MAP UPDATES": patchDetails.mapUpdates,
            "BUG FIXES": patchDetails.bugFixes
        };

        $('.sc-4225abdc-0').each((index, element) => {
            const sectionTitle = $(element).find('h1, h2').first().text().trim().toUpperCase();
            if (roleSections[sectionTitle]) {
                const content = $(element).html().trim();
                if (content) {
                    roleSections[sectionTitle].push(content);
                }
            }
        });

        const patch = await prisma.patchnotes_val.findFirst({
            where: {
                text: `valorant-patch-notes-${version}`
            }
        });

        let patchId;
        if (!patch) {
            const newPatch = await prisma.patchnotes_val.create({
                data: {
                    text: `valorant-patch-notes-${version}`
                }
            });
            patchId = newPatch.id;
        } else {
            patchId = patch.id;
        }

        for (const agentUpdate of patchDetails.agentUpdates) {
            const existingAgentUpdate = await prisma.agent.findFirst({
                where: {
                    patchId: patchId,
                    text: agentUpdate
                }
            });

            if (!existingAgentUpdate) {
                await prisma.agent.create({
                    data: {
                        patchId: patchId,
                        text: agentUpdate
                    }
                });
            }
        }

        for (const mapUpdate of patchDetails.mapUpdates) {
            const existingMapUpdate = await prisma.valMap.findFirst({
                where: {
                    patchId: patchId,
                    text: mapUpdate
                }
            });

            if (!existingMapUpdate) {
                await prisma.valMap.create({
                    data: {
                        patchId: patchId,
                        text: mapUpdate
                    }
                });
            }
        }

        for (const bugFix of patchDetails.bugFixes) {
            const existingBugFix = await prisma.valBug.findFirst({
                where: {
                    patchId: patchId,
                    text: bugFix
                }
            });

            if (!existingBugFix) {
                await prisma.valBug.create({
                    data: {
                        patchId: patchId,
                        text: bugFix
                    }
                });
            }
        }

        return patchDetails;
    } catch (error) {
        console.error('Error while fetching patch notes details:', error.message);
        throw new Error('Failed to fetch patch notes details');
    }
}

module.exports = { getPatchNotesDetails_VAL };
