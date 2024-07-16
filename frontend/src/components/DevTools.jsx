import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import '../styles/DevTools.css';

const fillerWords = ["is", "are", "now", "the", "and", "a", "an", "in", "on", "to", "from", "for", "with", "of", "at", "by", "but", "or", "nor", "so", "too", "very", "can", "could", "will", "would", "should", "shall", "may", "might", "must", "ought"];

const DevTools = () => {
    const [overwatchData, setOverwatchData] = useState([]);
    const [leagueData, setLeagueData] = useState([]);
    const [error, setError] = useState('');
    const [words, setWords] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [classifiers, setClassifiers] = useState([]);
    const [nerfs, setNerfs] = useState([]);
    const [buffs, setBuffs] = useState([]);
    const [selectingFor, setSelectingFor] = useState(null);
    const [selectedKeyword, setSelectedKeyword] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [overwatchResponse, leagueResponse] = await Promise.all([
                    fetch('http://localhost:3000/patchnotes/overwatch/'),
                    fetch('http://localhost:3000/patchnotes/league-of-legends/')
                ]);

                if (!overwatchResponse.ok || !leagueResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const overwatchData = await overwatchResponse.json();
                const leagueData = await leagueResponse.json();

                console.log('Overwatch data:', overwatchData);
                console.log('League data:', leagueData);

                setOverwatchData(overwatchData);
                setLeagueData(leagueData);

                const extractedWords = extractWords(overwatchData, leagueData);
                setWords(extractedWords);
                console.log('Extracted words length:', extractedWords.length);

            } catch (error) {
                console.error('Error fetching patch details:', error);
                setError('Failed to fetch patch details. Please try again later.');
            }
        };

        fetchAllData();
    }, []);

    const extractWords = (overwatchData, leagueData) => {
        const allUpdates = [
            ...overwatchData.map(update => update.details?.tank || []).flat(),
            ...overwatchData.map(update => update.details?.damage || []).flat(),
            ...overwatchData.map(update => update.details?.support || []).flat(),
            ...leagueData.map(update => update.details?.champions || []).flat()
        ];

        const wordsSet = new Set();

        allUpdates.forEach(update => {
            update.abilityUpdates.forEach(ability => {
                ability.content.forEach(content => {
                    content.split(' ').forEach(word => {
                        const cleanedWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
                        if (cleanedWord && !fillerWords.includes(cleanedWord) && isNaN(cleanedWord)) {
                            wordsSet.add(cleanedWord);
                        }
                    });
                });
            });
        });

        return Array.from(wordsSet);
    };

    const handleWordClick = (word, type) => {
        if (type === 'keyword') {
            if (keywords.includes(word)) {
                setKeywords(keywords.filter(k => k !== word));
            } else {
                setKeywords([...keywords, word]);
            }
        } else {
            if (classifiers.includes(word)) {
                setClassifiers(classifiers.filter(c => c !== word));
            } else {
                setClassifiers([...classifiers, word]);
            }
        }
    };

    const isSelected = (word, type) => {
        return type === 'keyword' ? keywords.includes(word) : classifiers.includes(word);
    };

    const startAssociation = (type) => {
        setSelectingFor(type);
        setSelectedKeyword(null);
    };

    const handleAssociationKeywordClick = (keyword) => {
        setSelectedKeyword(keyword);
    };

    const handleAssociationClassifierClick = (classifier) => {
        if (selectingFor === 'nerf') {
            setNerfs([...nerfs, [selectedKeyword, classifier]]);
        } else {
            setBuffs([...buffs, [selectedKeyword, classifier]]);
        }
        setSelectingFor(null);
        setSelectedKeyword(null);
    };

    const handleSubmit = async () => {
        const associations = {
            nerf: nerfs,
            buff: buffs
        };

        try {
            const response = await fetch('http://localhost:3000/associations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(associations),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            console.log('Associations submitted successfully');

            setNerfs([]);
            setBuffs([]);
        } catch (error) {
            console.error('Error submitting associations:', error);
        }
    };

    return (
        <div className='dev-tools'>
            <Navbar />
            {error && <div className='error'>{error}</div>}
            <div className='selection-box'>
                <h2>Available Words for Keywords</h2>
                <div className='word-list'>
                    {words.map((word, index) => (
                        <span
                            key={index}
                            className={`word ${isSelected(word, 'keyword') ? 'selected' : ''}`}
                            onClick={() => handleWordClick(word, 'keyword')}
                        >
                            {word}
                        </span>
                    ))}
                </div>
            </div>
            <div className='selection-box'>
                <h2>Available Words for Classifiers</h2>
                <div className='word-list'>
                    {words.map((word, index) => (
                        <span
                            key={index}
                            className={`word ${isSelected(word, 'classifier') ? 'selected' : ''}`}
                            onClick={() => handleWordClick(word, 'classifier')}
                        >
                            {word}
                        </span>
                    ))}
                </div>
            </div>
            <div className='selection-box'>
                <h2>Keywords</h2>
                <div className='selected-list'>
                    {keywords.map((word, index) => (
                        <span key={index} className='selected-word' onClick={() => handleAssociationKeywordClick(word)}>
                            {word}
                        </span>
                    ))}
                </div>
            </div>
            <div className='selection-box'>
                <h2>Classifiers</h2>
                <div className='selected-list'>
                    {classifiers.map((word, index) => (
                        <span key={index} className='selected-word' onClick={() => handleAssociationClassifierClick(word)}>
                            {word}
                        </span>
                    ))}
                </div>
            </div>
            <div className='association-box'>
                <div className='nerf-box'>
                    <h2>Nerfs</h2>
                    <button onClick={() => startAssociation('nerf')}>Add Association</button>
                    {selectingFor === 'nerf' && !selectedKeyword && (
                        <div className='association-selection'>
                            <h3>Select a Keyword</h3>
                            <div className='selected-list'>
                                {keywords.map((word, index) => (
                                    <span key={index} className='selected-word' onClick={() => handleAssociationKeywordClick(word)}>
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectingFor === 'nerf' && selectedKeyword && (
                        <div className='association-selection'>
                            <h3>Select a Classifier</h3>
                            <div className='selected-list'>
                                {classifiers.map((word, index) => (
                                    <span key={index} className='selected-word' onClick={() => handleAssociationClassifierClick(word)}>
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <ul>
                        {nerfs.map((association, index) => (
                            <li key={index}>{association.join(' + ')}</li>
                        ))}
                    </ul>
                </div>
                <div className='buff-box'>
                    <h2>Buffs</h2>
                    <button onClick={() => startAssociation('buff')}>Add Association</button>
                    {selectingFor === 'buff' && !selectedKeyword && (
                        <div className='association-selection'>
                            <h3>Select a Keyword</h3>
                            <div className='selected-list'>
                                {keywords.map((word, index) => (
                                    <span key={index} className='selected-word' onClick={() => handleAssociationKeywordClick(word)}>
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectingFor === 'buff' && selectedKeyword && (
                        <div className='association-selection'>
                            <h3>Select a Classifier</h3>
                            <div className='selected-list'>
                                {classifiers.map((word, index) => (
                                    <span key={index} className='selected-word' onClick={() => handleAssociationClassifierClick(word)}>
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <ul>
                        {buffs.map((association, index) => (
                            <li key={index}>{association.join(' + ')}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <button className='submit-button' onClick={handleSubmit}>Submit Associations</button>
        </div>
    );
};

export default DevTools;
