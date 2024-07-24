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
