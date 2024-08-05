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
            "MAP UPDATES": patchDetails.mapUpdates
        };

        const parseHeroUpdate = (element) => {
            const heroUpdate = {};
            heroUpdate.title = $(element).find('.PatchNotesHeroUpdate-name').text().trim();
            heroUpdate.generalUpdates = [];
            $(element).find('.PatchNotesHeroUpdate-generalUpdates ul li').each((_, li) => {
                heroUpdate.generalUpdates.push($(li).text().trim());
            });

            heroUpdate.abilityUpdates = [];
            $(element).find('.PatchNotesAbilityUpdate').each((_, ability) => {
                const abilityUpdate = {
                    name: $(ability).find('.PatchNotesAbilityUpdate-name').text().trim(),
                    content: []
                };
                $(ability).find('.PatchNotesAbilityUpdate-detailList ul li').each((_, li) => {
                    abilityUpdate.content.push($(li).text().trim());
                });
                heroUpdate.abilityUpdates.push(abilityUpdate);
            });

            return heroUpdate;
        };

        $('.PatchNotes-section-hero_update').each((index, element) => {
            const sectionTitle = $(element).find('.PatchNotes-sectionTitle').text().trim().toUpperCase();
            if (roleSections[sectionTitle]) {
                $(element).find('.PatchNotesHeroUpdate').each((_, heroUpdateElement) => {
                    roleSections[sectionTitle].push(parseHeroUpdate(heroUpdateElement));
                });
            }
        });

        $('.PatchNotes-section-map_update .PatchNotesMapUpdate').each((index, element) => {
            const mapUpdate = {
                name: $(element).find('.PatchNotesMapUpdate-name').text().trim(),
                content: []
            };
            $(element).find('.PatchNotesMapUpdate-generalUpdates ul li').each((_, li) => {
                mapUpdate.content.push($(li).text().trim());
            });
            patchDetails.mapUpdates.push(mapUpdate);
        });

        $('.PatchNotes-section-generic_update .PatchNotesGeneralUpdate-description ul li').each((index, element) => {
            patchDetails.bugFixes.push($(element).text().trim());
        });

        const patch = await prisma.patchnotes_ow.findFirst({
            where: {
                text: `${year}/${month}`
            }
        });

        if (!patch) {
            await prisma.patchnotes_ow.create({
                data: {
                    text: `${year}/${month}`,
                    details: patchDetails
                }
            });
        } else {
            await prisma.patchnotes_ow.update({
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

module.exports = { getPatchNotesDetails_OW };
