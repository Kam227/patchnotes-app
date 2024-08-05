import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import '../styles/CharacterPage.css';

const CharacterPage = ({ game }) => {
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
    const [characterImage, setCharacterImage] = useState(null);
    const location = useLocation();
    const { id: patchId } = location.state || {};

    useEffect(() => {
        window.scrollTo(0, 0);

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

    const calculateHistogram = (data, intervals) => {
        const bins = Array(intervals.length).fill(0);

        data.forEach(value => {
            for (let i = 0; i < intervals.length; i++) {
                if (value >= intervals[i][0] && value < intervals[i][1]) {
                    bins[i]++;
                    break;
                }
            }
        });

        const binLabels = intervals.map(interval => `${interval[0]} - ${interval[1]}`);

        return { bins, binLabels };
    };

    const intervals = [
        [-6.698, -3],
        [-3, -2],
        [-2, -1],
        [-1, -0.1],
        [-0.1, -0.01],
        [0.01, 0.1],
        [0.1, 1],
        [1, 2],
        [2, 3],
        [3, 10.759]
    ];

    const { bins, binLabels } = calculateHistogram(transformedPercentileSums, intervals);

    const histogramData = {
        labels: binLabels,
        datasets: [
            {
                label: 'Transformed Percentile Sums',
                data: bins,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const pickrateGraphData = {
        labels: stats?.pickrateHistory.map((_, index) => `Time ${index + 1}`) || [],
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

    const pickrateGraphOptions = {
        maintainAspectRatio: false,
        scales: {
            x: {
                display: false,
            },
            y: {
                suggestedMin: Math.min(...(stats?.pickrateHistory.map(data => data.value) || [0])) - 2,
                suggestedMax: Math.max(...(stats?.pickrateHistory.map(data => data.value) || [10])) + 2,
                ticks: {
                    stepSize: 2,
                },
            },
        },
    };

    useEffect(() => {
        const loadImage = async () => {
            try {
                const lowerCaseCharacter = character.toLowerCase();
                const lowerCaseGame = game.toLowerCase();
                let image;
                if (game === 'overwatch') {
                    image = await import(`../assets/${lowerCaseGame}/${lowerCaseCharacter}.png`);
                }
                if (game === 'league-of-legends') {
                    image = await import(`../assets/${lowerCaseGame}/${lowerCaseCharacter}.webp`);
                }
                setCharacterImage(image.default);
            } catch (error) {
                console.error('Error loading character image:', error);
            }
        };

        loadImage();
    }, [game, character]);

    const winrateChangeText = (updatedWinrateChange * 100).toFixed(2);
    const winrateChangeDisplay = updatedWinrateChange > 0 ? `+${winrateChangeText}%` : `${winrateChangeText}%`;

    return (
        <div className='character-page'>
            <div className="navbar">
                <Navbar game={game} />
            </div>
            <div className='content'>
                <div className='left'>
                    <div className='histogram'>
                        <h2>Historical Statistics</h2>
                        <Bar data={histogramData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className='right'>
                    <div className='character-icon'>
                        {characterImage && (
                            <div className='character-image-wrapper'>
                                <img src={characterImage} alt={character} />
                                <p>{character}</p>
                                {(game !== 'overwatch') && (
                                    <div className='winrate-change' title={`${character}'s winrate is projected to change by ${winrateChangeDisplay}`}>
                                        {winrateChangeDisplay}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className='character-stats'>
                        <div className='top-stats'>
                            <div className='stat'>Pick Rate: {stats?.pickrate / 100}%</div>
                            <div className='stat'>Win Rate: {stats?.winrate / 100}%</div>
                            {game === 'overwatch' && stats?.kda && (
                                <div className='stat'>KDA: {stats?.kda / 100}</div>
                            )}
                            {game === 'league-of-legends' && stats?.banrate && (
                                <div className='stat'>Ban Rate: {stats?.banrate / 100}%</div>
                            )}
                        </div>
                        <div className='pickrate-graph'>
                            {stats?.pickrateHistory.length > 0 ? (
                                <Line data={pickrateGraphData} options={pickrateGraphOptions} />
                            ) : (
                                <p>Loading pickrate data...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CharacterPage;
