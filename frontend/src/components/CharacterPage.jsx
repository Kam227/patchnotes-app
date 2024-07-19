import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const CharacterPage = () => {
    const { character } = useParams();
    const [stats, setStats] = useState(null);

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

        fetchStats();
    }, [character]);

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
