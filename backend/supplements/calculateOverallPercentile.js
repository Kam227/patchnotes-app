const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const calculateOverallPercentile = async () => {
  const abilities = await prisma.ability.findMany({
      select: {
          character: true,
          name: true,
          percentile: true
      }
  });

  const groupedAbilities = abilities.reduce((acc, ability) => {
      const key = `${ability.character}:${ability.name}`;
      if (!acc[key]) {
          acc[key] = [];
      }
      acc[key].push(Math.abs(ability.percentile));
      return acc;
  }, {});

  const overallPercentiles = Object.entries(groupedAbilities).map(([key, percentiles]) => {
      const overallPercentile = percentiles.reduce((a, b) => a + b, 0) / percentiles.length;
      const [character, name] = key.split(':');
      return { character, name, overallPercentile };
  });

  for (const { character, name, overallPercentile } of overallPercentiles) {
      await prisma.ability.updateMany({
          where: {
              character: character,
              name: name
          },
          data: {
              overallPercentile: overallPercentile
          }
      });
  }
};

module.exports = { calculateOverallPercentile };
