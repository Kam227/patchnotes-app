import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const CharacterPage = () => {
    const { character } = useParams();
    const [stats, setStats] = useState(null);
    const [patchData, setPatchData] = useState([]);
    const [winrateHistory, setWinrateHistory] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingPatchData, setLoadingPatchData] = useState(true);
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
        const fetchPatchData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/patchdata/${id}`);
                const data = await response.json();
                setPatchData(data);
                setLoadingPatchData(false);
            } catch (error) {
                console.error('Error fetching patch data:', error);
                setLoadingPatchData(false);
            }
        };

        if (id) {
            fetchPatchData();
        }
    }, [id]);

    useEffect(() => {
        const fetchWinrateHistory = async () => {
            try {
                const response = await fetch(`http://localhost:3000/winratehistory/${id}`);
                const data = await response.json();
                setWinrateHistory(data);
            } catch (error) {
                console.error('Error fetching winrate history:', error);
            }
        };

        if (id) {
            fetchWinrateHistory();
        }
    }, [id]);

    const calculateWinrateChangeRatio = (character) => {
        const winrateChange = winrateHistory.find(item => item.character === character.character)?.winrateChange || 0;
        const sumPercentiles = character.percentile;

        if (sumPercentiles === 0) {
            return 0;
        }

        return winrateChange / sumPercentiles;
    };

    useEffect(() => {
        const calculateWinratePredictor = () => {
            const validCharacters = patchData.filter(character => character.percentile !== 0);
            const totalWinrateChangeRatio = validCharacters.reduce((acc, character) => {
                return acc + calculateWinrateChangeRatio(character);
            }, 0);
            const winratePredictor = validCharacters.length > 0 ? totalWinrateChangeRatio / validCharacters.length : 0;
            setWinratePredictor(winratePredictor);
        };

        if (patchData.length > 0 && winrateHistory.length > 0) {
            calculateWinratePredictor();
        }
    }, [patchData, winrateHistory]);

    const calculateUpdatedWinrateChange = (character) => {
        const winrateChangeRatio = calculateWinrateChangeRatio(character);
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
            {loadingPatchData ? (
                <p>Loading patch data...</p>
            ) : (
                <div>
                    {patchData
                        .filter(patchCharacter => patchCharacter.character === character)
                        .map(patchCharacter => (
                            <div key={patchCharacter.character}>
                                <p>Name: {patchCharacter.character}</p>
                                <p>Percentile Sum: {patchCharacter.percentile}</p>
                                <p>Winrate Change Ratio: {calculateWinrateChangeRatio(patchCharacter)}</p>
                                <p>Updated Winrate Change: {calculateUpdatedWinrateChange(patchCharacter)}</p>
                            </div>
                        ))}
                    <div>
                        <h2>Winrate Predictor: {winratePredictor}</h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterPage;
