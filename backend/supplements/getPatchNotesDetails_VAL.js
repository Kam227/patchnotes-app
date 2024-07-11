const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const stopCategories = [
    'CONSOLE',
    'COMPETITIVE UPDATES',
    'GAMEPLAY SYSTEMS UPDATES',
    'PLAYER BEHAVIOR UPDATES',
    'PREMIER UPDATES',
    'BUG FIXES',
    'PERFORMANCE UPDATES',
    'SOCIAL SYSTEMS UPDATES',
    'STORE UPDATES',
    'KNOWN ISSUES',
    'ESPORTS FEATURES'
];

const getAgentUpdates = ($) => {
    const patchDetails = {
        agentUpdates: []
    };

    let currentAgent = null;
    let abilityUpdates = new Set();

    const flushContentBuffer = () => {
        if (currentAgent && abilityUpdates.size > 0) {
            patchDetails.agentUpdates.push({
                title: currentAgent,
                abilityUpdates: Array.from(abilityUpdates)
            });
            currentAgent = null;
            abilityUpdates.clear();
        }
    };

    let stopScraping = false;

    $('*').each((index, element) => {
        if (stopScraping) return false;

        const tag = $(element).prop('tagName');
        const text = $(element).text().trim().toUpperCase();

        if (tag === 'H1' && text.includes('AGENT UPDATES')) {
            flushContentBuffer();
            currentAgent = 'AGENT UPDATES';
        } else if (stopCategories.includes(text)) {
            flushContentBuffer();
            stopScraping = true;
        } else if (currentAgent && tag === 'H2') {
            flushContentBuffer();
            currentAgent = $(element).text().trim();
        } else if (currentAgent && (tag === 'LI' || tag === 'P' || tag === 'STRONG') && text) {
            let cleanText = text.replace(/&nbsp;|&gt;/g, '').trim();
            if (!Array.from(abilityUpdates).some(update => update.includes(cleanText) || cleanText.includes(update))) {
                abilityUpdates.add(cleanText);
            }
        }
    });

    flushContentBuffer();
    return patchDetails;
};

const getMapUpdates = ($) => {
    const patchDetails = {
        mapUpdates: []
    };

    let currentMapUpdate = null;
    let abilityUpdates = new Set();

    const flushContentBuffer = () => {
        if (currentMapUpdate && abilityUpdates.size > 0) {
            patchDetails.mapUpdates.push({
                title: currentMapUpdate,
                abilityUpdates: Array.from(abilityUpdates)
            });
            currentMapUpdate = null;
            abilityUpdates.clear();
        }
    };

    let scrapingMapUpdates = false;

    $('*').each((index, element) => {
        const tag = $(element).prop('tagName');
        const text = $(element).text().trim().toUpperCase();

        if (tag === 'H1' && text.includes('MAP UPDATES')) {
            flushContentBuffer();
            scrapingMapUpdates = true;
        } else if (stopCategories.includes(text)) {
            flushContentBuffer();
            scrapingMapUpdates = false;
        } else if (scrapingMapUpdates && tag === 'H2') {
            flushContentBuffer();
            currentMapUpdate = $(element).text().trim();
        } else if (scrapingMapUpdates && (tag === 'LI' || tag === 'P') && text) {
            let cleanText = $(element).text().replace(/&nbsp;|&gt;/g, '').trim();
            if (!Array.from(abilityUpdates).some(update => update.includes(cleanText) || cleanText.includes(update))) {
                abilityUpdates.add(cleanText);
            }
        }
    });

    flushContentBuffer();
    return patchDetails;
};

const getBugFixes = ($) => {
    const patchDetails = {
        bugFixes: []
    };

    let currentCategory = null;
    let abilityUpdates = new Set();

    const flushContentBuffer = () => {
        if (currentCategory && abilityUpdates.size > 0) {
            patchDetails.bugFixes.push({
                title: currentCategory,
                abilityUpdates: Array.from(abilityUpdates)
            });
            currentCategory = null;
            abilityUpdates.clear();
        }
    };

    let scrapingBugFixes = false;

    $('*').each((index, element) => {
        const tag = $(element).prop('tagName');
        let text = $(element).text().trim();

        if (tag === 'H1' && text.toUpperCase().includes('BUG FIXES')) {
            flushContentBuffer();
            scrapingBugFixes = true;
        } else if (scrapingBugFixes && text.toUpperCase() === 'RECENT ARTICLES') {
            flushContentBuffer();
            scrapingBugFixes = false;
        } else if (scrapingBugFixes && (tag === 'H2' || tag === 'STRONG')) {
            flushContentBuffer();
            currentCategory = $(element).text().trim();
        } else if (scrapingBugFixes && (tag === 'LI' || tag === 'P') && text) {
            text = text.replace(/&nbsp;|&gt;/g, '').trim();
            abilityUpdates.add(text.endsWith('.') ? text : text + '.');
        }
    });

    flushContentBuffer();
    return patchDetails;
};

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

        const agentUpdates = getAgentUpdates($);
        const mapUpdates = getMapUpdates($);
        const bugFixes = getBugFixes($);

        const patchDetails = {
            ...agentUpdates,
            ...mapUpdates,
            ...bugFixes
        };

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
};

module.exports = { getPatchNotesDetails_VAL };
