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

        const A = latestChange > 0 ? Math.abs(latestChange) : 0;
        const B = latestChange < 0 ? Math.abs(latestChange) : 0;

        const buffImpact = latestChange > 0 ? A : 0;
        const nerfImpact = latestChange < 0 ? B : 0;

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
