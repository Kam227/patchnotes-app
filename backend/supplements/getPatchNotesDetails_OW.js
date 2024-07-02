const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        const patch = await prisma.patchnotes_ow.findFirst({
            where: {
                text: `${year}/${month}`
            }
        });

        let patchId;
        if (!patch) {
            const newPatch = await prisma.patchnotes_ow.create({
                data: {
                    text: `${year}/${month}`
                }
            });
            patchId = newPatch.id;
        } else {
            patchId = patch.id;
        }

        for (const tank of patchDetails.tank) {
            const existingTank = await prisma.tank.findFirst({
                where: {
                    patchId: patchId,
                    text: tank
                }
            });

            if (!existingTank) {
                await prisma.tank.create({
                    data: {
                        patchId: patchId,
                        text: tank
                    }
                });
            }
        }

        for (const damage of patchDetails.damage) {
            const existingDamage = await prisma.damage.findFirst({
                where: {
                    patchId: patchId,
                    text: damage
                }
            });

            if (!existingDamage) {
                await prisma.damage.create({
                    data: {
                        patchId: patchId,
                        text: damage
                    }
                });
            }
        }

        for (const support of patchDetails.support) {
            const existingSupport = await prisma.support.findFirst({
                where: {
                    patchId: patchId,
                    text: support
                }
            });

            if (!existingSupport) {
                await prisma.support.create({
                    data: {
                        patchId: patchId,
                        text: support
                    }
                });
            }
        }

        for (const mapUpdate of patchDetails.mapUpdates) {
            const existingMapUpdate = await prisma.owMap.findFirst({
                where: {
                    patchId: patchId,
                    text: mapUpdate
                }
            });

            if (!existingMapUpdate) {
                await prisma.owMap.create({
                    data: {
                        patchId: patchId,
                        text: mapUpdate
                    }
                });
            }
        }

        for (const bugFix of patchDetails.bugFixes) {
            const existingBugFix = await prisma.owBug.findFirst({
                where: {
                    patchId: patchId,
                    text: bugFix
                }
            });

            if (!existingBugFix) {
                await prisma.owBug.create({
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

module.exports = { getPatchNotesDetails_OW };
