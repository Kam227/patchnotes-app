const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPatchNotesDetails_LOL = async (url, version, prefix) => {
    const uri = `${url}${prefix ? 'lol-' : ''}patch-${version}-notes/`;

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
            champions: [],
            items: [],
            bugFixes: []
        };

        const parseChampionUpdate = (element) => {
            const championUpdate = {};
            const title = $(element).find('.change-title').text().trim();
            if (title) {
                championUpdate.title = title;
                championUpdate.generalUpdates = [];
                championUpdate.abilityUpdates = [];

                $(element).find('.change-detail-title').each((_, detail) => {
                    const detailTitle = $(detail).text().trim();
                    if (detailTitle === "Base Stats") {
                        $(detail).next('ul').find('li').each((_, li) => {
                            championUpdate.generalUpdates.push($(li).text().trim());
                        });
                    } else {
                        const abilityUpdate = {
                            name: detailTitle,
                            content: []
                        };
                        $(detail).next('ul').find('li').each((_, li) => {
                            abilityUpdate.content.push($(li).text().trim());
                        });
                        if (abilityUpdate.name) {
                            championUpdate.abilityUpdates.push(abilityUpdate);
                        }
                    }
                });

                return championUpdate;
            }
            return null;
        };

        const parseItemUpdate = (element) => {
            const itemUpdate = {};
            const title = $(element).find('.change-title').text().trim();
            if (title) {
                itemUpdate.title = title;
                itemUpdate.content = [];
                $(element).find('ul li').each((_, li) => {
                    itemUpdate.content.push($(li).text().trim());
                });

                return itemUpdate;
            }
            return null;
        };

        let parseChampions = true;
        let parseItems = false;
        let parseBugFixes = false;

        $('.content-border').each((index, element) => {
            if ($(element).prev('header').find('#patch-items').length > 0) {
                parseChampions = false;
                parseItems = true;
                parseBugFixes = false;
            } else if ($(element).prev('header').find('#patch-bugfixes-and-qol-changes').length > 0) {
                parseChampions = false;
                parseItems = false;
                parseBugFixes = true;
            }

            if (parseChampions) {
                $(element).find('.patch-change-block').each((i, el) => {
                    const championUpdate = parseChampionUpdate(el);
                    if (championUpdate) {
                        patchDetails.champions.push(championUpdate);
                    }
                });
            } else if (parseItems) {
                $(element).find('.patch-change-block').each((i, el) => {
                    const itemUpdate = parseItemUpdate(el);
                    if (itemUpdate) {
                        patchDetails.items.push(itemUpdate);
                    }
                });
            } else if (parseBugFixes) {
                $(element).find('ul li').each((i, el) => {
                    patchDetails.bugFixes.push($(el).text().trim());
                });
            }
        });

        const patchNote = await prisma.patchnotes_lol.findFirst({
            where: {
                text: `${prefix ? 'lol-' : ''}patch-${version}-notes`
            }
        });

        if (!patchNote) {
            await prisma.patchnotes_lol.create({
                data: {
                    text: `${prefix ? 'lol-' : ''}patch-${version}-notes`,
                    details: patchDetails
                }
            });
        } else {
            await prisma.patchnotes_lol.update({
                where: {
                    id: patchNote.id
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
};

module.exports = { getPatchNotesDetails_LOL };
