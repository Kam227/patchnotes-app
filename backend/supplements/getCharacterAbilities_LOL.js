const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const parseAbilityUpdates = async (patchId, character, abilityUpdates) => {
    if (!Array.isArray(abilityUpdates)) {
        console.warn(`Warning: abilityUpdates is not an array for patchId ${patchId} and character ${character}`);
        return;
    }

    for (const update of abilityUpdates) {
        if (update && update.content && Array.isArray(update.content)) {
            for (const content of update.content) {
                const match = content.match(/(\d+)\s*⇒\s*(\d+)\s*(seconds|%)?/i);
                if (match) {
                    const oldValue = parseInt(match[1]);
                    const newValue = parseInt(match[2]);
                    const percentChange = ((newValue - oldValue) / oldValue) * 100;

                    if (isFinite(percentChange)) {
                        const existingAbility = await prisma.ability.findFirst({
                            where: {
                                patchIdLOL: patchId,
                                character: character,
                                name: update.name
                            }
                        });

                        if (!existingAbility) {
                            await prisma.ability.create({
                                data: {
                                    patchIdLOL: patchId,
                                    character: character,
                                    name: update.name,
                                    percentile: percentChange
                                }
                            });
                        } else {
                            continue
                        }
                    } else {
                        continue
                    }
                }
            }
        } else {
            continue
        }
    }
};

const getCharacterAbilities_LOL = async () => {
    try {
        const patchNotes = await prisma.patchnotes_lol.findMany({
            select: {
                id: true,
                details: true
            }
        });

        for (const patch of patchNotes) {
            const details = patch.details;
            const champions = details.champions || [];

            let hasValidUpdates = false;
            for (const champion of champions) {
                if (champion.abilityUpdates && Array.isArray(champion.abilityUpdates)) {
                    hasValidUpdates = true;
                    await parseAbilityUpdates(patch.id, champion.title, champion.abilityUpdates);
                } else {
                    console.warn(`Warning: abilityUpdates is not an array for patchId ${patch.id}`);
                }
            }
        }
    } catch (error) {
        console.error('Error while parsing ability updates:', error.message);
    } finally {
        await prisma.$disconnect();
    }
};

module.exports = { getCharacterAbilities_LOL };
