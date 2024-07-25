const request = require('request-promise');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPatchNotesUrls_LOL } = require('./getPatchNotesUrls_LOL');

async function getCharacterDetails_LOL() {
  const url = 'https://www.leagueofgraphs.com/champions/builds';
  try {
    const html = await request({
      uri: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Accept': 'text/html',
        'Accept-Language': 'en-US'
      }
    });

    const $ = cheerio.load(html);
    const characterStats = [];

    $('tr').each((index, element) => {
      const character = $(element).find('td').eq(1).find('.name').text().trim();
      const pickrate = parseFloat($(element).find('td').eq(2).find('progressBar').attr('data-value')) * 100;
      const winrate = parseFloat($(element).find('td').eq(3).find('progressBar').attr('data-value')) * 100;
      const banrate = parseFloat($(element).find('td').eq(4).find('progressBar').attr('data-value')) * 100;
      const kda = null;

      if (character) {
        characterStats.push({ character, pickrate, winrate, banrate, kda });
      }
    });

    for (const stats of characterStats) {
      const updatedStats = await prisma.statistics.upsert({
        where: { character: stats.character },
        update: {
          pickrate: Math.round(stats.pickrate * 100),
          winrate: Math.round(stats.winrate * 100),
          kda: stats.kda,
          banrate: Math.round(stats.banrate * 100),
        },
        create: {
          character: stats.character,
          pickrate: Math.round(stats.pickrate * 100),
          winrate: Math.round(stats.winrate * 100),
          kda: stats.kda,
          banrate: Math.round(stats.banrate * 100),
        }
      });

      await prisma.pickrateHistory.create({
        data: {
          statisticsId: updatedStats.id,
          value: stats.pickrate,
        }
      });

      const patchUrls = await getPatchNotesUrls_LOL();
      for (const { version, url, prefix } of patchUrls) {
        const modifiedVersion = version.replace('-', '.');
        const lolalyticsUrl = `https://lolalytics.com/?tier=all&patch=${modifiedVersion}`;
        console.log(lolalyticsUrl);
        const patchRecord = await prisma.patchnotes_lol.findFirst({
          where: { text: `${prefix ? 'lol-' : ''}patch-${version}-notes` }
        });
        if (!patchRecord) continue;
        const patchId = patchRecord.id;

        const lolalyticsHtml = await request({
          uri: lolalyticsUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            'Accept': 'text/html',
            'Accept-Language': 'en-US'
          }
        });

        console.log('hello')
        const $$ = cheerio.load(lolalyticsHtml);
        let currentCharacter = '';
        let foundCharacter = false;

        $$('div.mx-auto.mb-4.flex').each(async (i, el) => {
          console.log('Character found');
          const characterAnchor = $$(el).find('a').first();
          const characterUrl = characterAnchor.attr('href');
          const characterNameMatch = characterUrl && characterUrl.match(/\/lol\/([^\/]*)\/build/);
          console.log(characterNameMatch[1])
          if (characterNameMatch && characterNameMatch[1]) {
            currentCharacter = characterNameMatch[1];
            foundCharacter = true;
          }

          if (foundCharacter) {
            const winrateChangeText = $$(el).find('div:contains("Win Rate:")').next().html();
            const winrateChangeMatch = winrateChangeText.match(/<!--t=\d+r-->[+\-]?<!---->([\d.]+)<!--t=\d+s-->%<!---->/);
            console.log(winrateChangeText)
            if (winrateChangeMatch) {
              const winrateChange = parseFloat(winrateChangeMatch[1]);
              if (currentCharacter && !isNaN(winrateChange)) {
                await prisma.winrateChangeHistory.create({
                  data: {
                    statisticsId: updatedStats.id,
                    winrateChange,
                    patchId,
                    character: currentCharacter,
                  }
                });
                foundCharacter = false;
              }
            }
          }
        });
      }
    }

    console.log('Scraping and storing League of Legends data completed successfully.');
  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { getCharacterDetails_LOL };

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const CharacterPage = () => {
  const { character } = useParams();
  const location = useLocation();
  const { id, game } = location.state || {};
  const [stats, setStats] = useState(null);
  const [nerfs, setNerfs] = useState([]);
  const [buffs, setBuffs] = useState([]);
  const [probabilities, setProbabilities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:3000/stats/${character}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching character stats:', error);
      }
    };

    const fetchNerfsAndBuffs = async () => {
      try {
        const response = await fetch('http://localhost:3000/changes', {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ patchId: id, game }),
          method: 'POST',
        });
        const data = await response.json();
        setNerfs(data.nerfs);
        setBuffs(data.buffs);
        calculateProbabilities(data.nerfs, data.buffs, data.pickrateHistory);
      } catch (error) {
        console.error('Error fetching nerfs and buffs:', error);
      }
    };

    const calculateProbabilities = (nerfs, buffs, pickrateHistory) => {
      const characters = [...new Set([...nerfs.map(n => n.character), ...buffs.map(b => b.character)])];

      const probabilities = characters.map(character => {
        const charStats = pickrateHistory[character] || [];
        if (!charStats || charStats.length === 0) {
          return { character, probability: 50 };
        }

        let latestChange = 0;
        for (let i = charStats.length - 1; i > 0; i--) {
          const change = charStats[i].value - charStats[i - 1].value;
          if (change !== 0) {
            latestChange = change;
            break;
          }
        }

        const buffsForCharacter = buffs.filter(b => b.character === character);
        const nerfsForCharacter = nerfs.filter(n => n.character === character);

        const impact = latestChange;
        const buffImpact = latestChange > 0 ? impact : impact * 1.5;
        const nerfImpact = latestChange < 0 ? impact : impact / 1.5;

        const updatedProbability = 50 + (buffsForCharacter.length * buffImpact) - (nerfsForCharacter.length * nerfImpact);
        const boundedProbability = Math.min(Math.max(updatedProbability, 0), 100);

        return { character, probability: boundedProbability };
      });

      setProbabilities(probabilities);
    };

    fetchStats();
    fetchNerfsAndBuffs();
  }, [character, id, game]);

  const pickrateGraphData = {
    labels: stats?.pickrateHistory.map(data => new Date(data.timestamp).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Pickrate',
        data: stats?.pickrateHistory.map(data => data.value) || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  const message = (probability) => {
    if (probability > 50) {
      return 'Rising Popularity';
    } else if (probability < 50) {
      return 'Falling Popularity';
    } else {
      return 'Stable Popularity';
    }
  };

  const probability = probabilities.find(prob => prob.character === character);

  return (
    <div className='character-page'>
      <Navbar />
      <p>{character}</p>
      {probability && (
        <div>
          <p>{message(probability.probability)}: {probability.probability.toFixed(2)}%</p>
        </div>
      )}
      {stats ? (
        <div>
          <p>Pickrate: {stats.pickrate / 100}%</p>
          <p>Winrate: {stats.winrate / 100}%</p>
          <p>{stats.kda ? `KDA: ${stats.kda / 100}` : null}</p>
          <p>{stats.banrate ? `Banrate: ${stats.banrate / 100}%` : null}</p>
        </div>
      ) : (
        <p>Loading stats...</p>
      )}
      {stats?.pickrateHistory.length > 0 ? (
        <div>
          <h2>Pickrate Over Time</h2>
          <Line data={pickrateGraphData} />
        </div>
      ) : (
        <p>Loading pickrate data...</p>
      )}
    </div>
  );
}

export default CharacterPage;

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const CharacterPage = () => {
    const { character } = useParams();
    const [stats, setStats] = useState(null);
    const [abilities, setAbilities] = useState([]);
    const [winrateHistory, setWinrateHistory] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingAbilities, setLoadingAbilities] = useState(true);
    const [loadingWinrateHistory, setLoadingWinrateHistory] = useState(true);
    const [winratePredictor, setWinratePredictor] = useState(0);
    const location = useLocation();
    const { id } = location.state || {};

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`http://localhost:3000/stats/${character}`);
                const data = await response.json();
                setStats(data);
                setLoadingStats(false);
            } catch (error) {
                console.error('Error fetching character stats:', error);
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, [character]);

    useEffect(() => {
        const fetchAbilities = async () => {
            try {
                const response = await fetch(`http://localhost:3000/abilities?patchId=${id}`);
                const data = await response.json();
                setAbilities(data);
                setLoadingAbilities(false);
            } catch (error) {
                console.error('Error fetching abilities:', error);
                setLoadingAbilities(false);
            }
        };

        if (id) {
            fetchAbilities();
        }
    }, [id]);

    useEffect(() => {
        const fetchWinrateHistory = async () => {
            try {
                const response = await fetch(`http://localhost:3000/winratehistory/${id}`);
                const data = await response.json();
                setWinrateHistory(data);
                setLoadingWinrateHistory(false);
            } catch (error) {
                console.error('Error fetching winrate history:', error);
                setLoadingWinrateHistory(false);
            }
        };

        if (id) {
            fetchWinrateHistory();
        }
    }, [id]);

    const calculateWinrateChangeRatio = (characterName) => {
        const winrateChange = winrateHistory.find(item => item.character === characterName)?.winrateChange || 0;
        const sumPercentiles = abilities.filter(ability => ability.character === characterName).reduce((acc, ability) => acc + ability.percentile, 0);

        if (sumPercentiles === 0) {
            return 0;
        }

        return winrateChange / sumPercentiles;
    };

    useEffect(() => {
        const calculateWinratePredictor = () => {
            const validCharacters = abilities.filter(ability => ability.percentile !== 0).map(ability => ability.character);
            const uniqueCharacters = [...new Set(validCharacters)];
            const totalWinrateChangeRatio = uniqueCharacters.reduce((acc, characterName) => {
                return acc + calculateWinrateChangeRatio(characterName);
            }, 0);
            const winratePredictor = uniqueCharacters.length > 0 ? totalWinrateChangeRatio / uniqueCharacters.length : 0;
            setWinratePredictor(winratePredictor);
        };

        if (abilities.length > 0 && winrateHistory.length > 0) {
            calculateWinratePredictor();
        }
    }, [abilities, winrateHistory]);

    const calculateUpdatedWinrateChange = (characterName) => {
        const winrateChangeRatio = calculateWinrateChangeRatio(characterName);
        return winrateChangeRatio * winratePredictor;
    };

    const pickrateGraphData = {
        labels: stats?.pickrateHistory.map(data => new Date(data.timestamp).toLocaleDateString()) || [],
        datasets: [
            {
                label: 'Pickrate',
                data: stats?.pickrateHistory.map(data => data.value) || [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    };

    return (
        <div className='character-page'>
            <Navbar />
            <p>{character}</p>
            {loadingStats ? (
                <p>Loading stats...</p>
            ) : (
                <div>
                    <p>Pickrate: {stats.pickrate / 100}%</p>
                    <p>Winrate: {stats.winrate / 100}%</p>
                    <p>{stats.kda ? `KDA: ${stats.kda / 100}` : null}</p>
                    <p>{stats.banrate ? `Banrate: ${stats.banrate / 100}%` : null}</p>
                </div>
            )}
            {stats?.pickrateHistory.length > 0 ? (
                <div>
                    <h2>Pickrate Over Time</h2>
                    <Line data={pickrateGraphData} />
                </div>
            ) : (
                <p>Loading pickrate data...</p>
            )}
            {loadingAbilities || loadingWinrateHistory ? (
                <p>Loading patch data...</p>
            ) : (
                <div>
                    <div key={character}>
                        <p>Name: {character}</p>
                        <p>Percentile Sum: {abilities.reduce((acc, ability) => acc + ability.percentile, 0)}</p>
                        <p>Winrate Change Ratio: {calculateWinrateChangeRatio(character)}</p>
                        <p>Updated Winrate Change: {calculateUpdatedWinrateChange(character)}</p>
                    </div>
                    <div>
                        <h2>Winrate Predictor: {winratePredictor}</h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterPage;

// character stats
app.get('/stats/:character', async (req, res) => {
  const { character } = req.params;
  try {
    const stats = await prisma.statistics.findUnique({
      where: { character },
      include: { pickrateHistory: true }
    });
    if (stats) {
      res.json(stats);
    } else {
      res.status(404).json({ error: 'Character not found' });
    }
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/abilities', async (req, res) => {
  const { patchId } = req.query;

  try {
    let abilities;

    if (patchId) {
      abilities = await prisma.ability.findMany({
        where: { patchIdLOL: parseInt(patchId) } // Adjust based on the game as needed
      });
    } else {
      abilities = await prisma.ability.findMany();
    }

    const abilityMap = {};

    abilities.forEach((ability) => {
      const key = `${ability.character}-${ability.name}`;
      if (!abilityMap[key]) {
        abilityMap[key] = {
          character: ability.character,
          name: ability.name,
          overallPercentile: ability.overallPercentile,
          count: 0,
        };
      }
      abilityMap[key].count += 1;
    });

    const abilityDifferences = abilities.map((ability) => {
      const key = `${ability.character}-${ability.name}`;
      const difference = ability.percentile - abilityMap[key].overallPercentile;
      return {
        character: ability.character,
        name: ability.name,
        percentile: ability.percentile,
        difference,
        count: abilityMap[key].count,
      };
    });

    res.json(abilityDifferences);
  } catch (error) {
    console.error('Error fetching abilities:', error.message);
    res.status(500).json({ error: 'Failed to fetch abilities' });
  }
});

app.get('/winratehistory/:patchId', async (req, res) => {
  const { patchId } = req.params;

  try {
    const winrateHistory = await prisma.winrateChangeHistory.findMany({
      where: { patchId: parseInt(patchId) }
    });
    res.json(winrateHistory);
  } catch (error) {
    console.error('Error fetching winrate history:', error);
    res.status(500).json({ error: 'Failed to fetch winrate history' });
  }
});


app.get('/:character', (req, res) => {
  res.send('character page');
});
