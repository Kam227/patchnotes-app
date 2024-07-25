const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const parseAbilityUpdates = async (patchId, character, abilityUpdates) => {
    if (!Array.isArray(abilityUpdates)) {
        return;
    }

    for (const update of abilityUpdates) {
        if (update && update.content && Array.isArray(update.content) && update.name) {
            for (const content of update.content) {
                const match = content.match(/(\d+(?:\/\d+)*\s*(?:\(.*?\))*)\s*⇒\s*(\d+(?:\/\d+)*\s*(?:\(.*?\))*)/i);
                if (match) {
                    const oldValueStr = match[1];
                    const newValueStr = match[2];

                    const oldValues = oldValueStr.match(/\d+/g).map(Number);
                    const newValues = newValueStr.match(/\d+/g).map(Number);

                    const percentChanges = oldValues.map((oldValue, index) => {
                        const newValue = newValues[index];
                        return ((newValue - oldValue) / oldValue);
                    });

                    const averagePercentChange = percentChanges.reduce((sum, change) => sum + change, 0) / percentChanges.length;

                    if (isFinite(averagePercentChange)) {
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
                                    percentile: averagePercentChange
                                }
                            });
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
                }
            }
        } else {
            continue;
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

            for (const champion of champions) {
                if (champion.abilityUpdates && Array.isArray(champion.abilityUpdates)) {
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
