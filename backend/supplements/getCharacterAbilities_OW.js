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
                const match = content.match(/(\d+)\s*(seconds|%)?\s*to\s*(\d+)\s*(seconds|%)?/i);
                if (match) {
                    const oldValue = parseInt(match[1]);
                    const newValue = parseInt(match[3]);
                    const percentChange = ((newValue - oldValue) / oldValue) * 100;

                    if (isFinite(percentChange)) {
                        const existingAbility = await prisma.ability.findFirst({
                            where: {
                                patchIdOW: patchId,
                                character: character,
                                name: update.name
                            }
                        });

                        if (!existingAbility) {
                            await prisma.ability.create({
                                data: {
                                    patchIdOW: patchId,
                                    character: character,
                                    name: update.name,
                                    percentile: percentChange
                                }
                            });
                        } else {
                            console.log(`Ability already exists for patchId ${patchId}, character ${character}, and ability ${update.name}`);
                        }
                    } else {
                        console.log(`Warning: Invalid percentile change for patchId ${patchId} and ability ${update.name}`);
                    }
                }
            }
        } else {
            console.log(`Warning: Invalid ability update format for patchId ${patchId} and character ${character}`);
        }
    }
};

const getCharacterAbilities_OW = async () => {
    try {
        const patchNotes = await prisma.patchnotes_ow.findMany({
            select: {
                id: true,
                details: true
            }
        });

        for (const patch of patchNotes) {
            const details = patch.details;
            const roles = ['tank', 'damage', 'support'];

            let hasValidUpdates = false;
            for (const role of roles) {
                if (Array.isArray(details[role])) {
                    for (const hero of details[role]) {
                        if (hero.abilityUpdates && Array.isArray(hero.abilityUpdates)) {
                            hasValidUpdates = true;
                            await parseAbilityUpdates(patch.id, hero.title, hero.abilityUpdates);
                        } else {
                            console.log(`Warning: abilityUpdates is not an array for patchId ${patch.id} in role ${role}`);
                        }
                    }
                }
            }

            if (!hasValidUpdates) {
                console.log(`Skipping patchId ${patch.id} as it has no valid ability updates.`);
            }
        }
    } catch (error) {
        console.error('Error while parsing ability updates:', error.message);
    } finally {
        await prisma.$disconnect();
    }
};

module.exports = { getCharacterAbilities_OW };
