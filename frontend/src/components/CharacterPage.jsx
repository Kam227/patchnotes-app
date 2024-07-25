import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const CharacterPage = () => {
    const { character } = useParams();
    const [stats, setStats] = useState(null);
    const [patchData, setPatchData] = useState([]);
    const [winrateHistory, setWinrateHistory] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingPatchData, setLoadingPatchData] = useState(true);
    const [winratePredictor, setWinratePredictor] = useState(0);
    const [updatedWinrateChange, setUpdatedWinrateChange] = useState(0);
    const [rawPercentileSums, setRawPercentileSums] = useState([]);
    const [transformedPercentileSums, setTransformedPercentileSums] = useState([]);
    const location = useLocation();
    const { id: patchId } = location.state || {};

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
                const response = await fetch(`http://localhost:3000/patchdata/${patchId}`);
                const data = await response.json();
                setPatchData(data);
                setLoadingPatchData(false);
            } catch (error) {
                console.error('Error fetching patch data:', error);
                setLoadingPatchData(false);
            }
        };

        if (patchId) {
            fetchPatchData();
        }
    }, [patchId]);

    useEffect(() => {
        const fetchWinrateHistory = async () => {
            try {
                const response = await fetch(`http://localhost:3000/winratehistory/${patchId}`);
                const data = await response.json();
                setWinrateHistory(data);
            } catch (error) {
                console.error('Error fetching winrate history:', error);
            }
        };

        if (patchId) {
            fetchWinrateHistory();
        }
    }, [patchId]);

    useEffect(() => {
        const fetchWinratePredictor = async () => {
            try {
                const response = await fetch(`http://localhost:3000/winratePredictor`);
                const data = await response.json();
                setWinratePredictor(data.predictorValue);
                setRawPercentileSums(data.rawPercentileSums);
                setTransformedPercentileSums(data.transformedPercentileSums);
            } catch (error) {
                console.error('Error fetching winrate predictor:', error);
            }
        };

        fetchWinratePredictor();
    }, []);

    useEffect(() => {
        if (patchData.length > 0 && winratePredictor !== 0) {
            const characterData = patchData.find(patchCharacter => patchCharacter.character === character);
            if (characterData) {
                const updatedWinrate = characterData.percentile * winratePredictor;
                setUpdatedWinrateChange(updatedWinrate);
            }
        }
    }, [patchData, winratePredictor, character]);

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
                                <p>Updated Winrate Change: {updatedWinrateChange}</p>
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
