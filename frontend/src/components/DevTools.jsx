import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import '../styles/DevTools.css';

const fillerWords = [
  "is", "are", "now", "the", "and", "a", "an", "in", "on", "to", "from", "for", "with", "of", "at", "by", "but", "or",
  "nor", "so", "too", "very", "can", "could", "will", "would", "should", "shall", "may", "might", "must", "ought",
  "it", "if"
];

const DevTools = () => {
  const [overwatchData, setOverwatchData] = useState([]);
  const [leagueData, setLeagueData] = useState([]);
  const [error, setError] = useState('');
  const [usableWords, setUsableWords] = useState([]);
  const [deletedWords, setDeletedWords] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [classifiers, setClassifiers] = useState([]);
  const [nerfs, setNerfs] = useState([]);
  const [buffs, setBuffs] = useState([]);
  const [selectingFor, setSelectingFor] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [selectedWords, setSelectedWords] = useState([]);
  const [actionType, setActionType] = useState('');

useEffect(() => {
  const fetchWords = async () => {
    try {
      const wordsResponse = await fetch('http://localhost:3000/words');
      if (!wordsResponse.ok) {
        throw new Error('Network response was not ok');
      }
      const wordsData = await wordsResponse.json();

      console.log('Server Response:', wordsData);

      setUsableWords(Array.from(new Set(wordsData.usableWords || [])));
      setDeletedWords(Array.from(new Set(wordsData.deletedWords || [])));
      setKeywords(Array.from(new Set(wordsData.keywords || [])));
      setClassifiers(Array.from(new Set(wordsData.classifiers || [])));
    } catch (error) {
      console.error('Error fetching words:', error);
      setError('Failed to fetch words.');
    }
  };

  const fetchAssociations = async () => {
    try {
      const associationsResponse = await fetch('http://localhost:3000/associations');
      if (!associationsResponse.ok) {
        throw new Error('Network response was not ok');
      }
      const associationsData = await associationsResponse.json();
      setNerfs(Array.from(new Set(associationsData.nerf || [])));
      setBuffs(Array.from(new Set(associationsData.buff || [])));
    } catch (error) {
      console.error('Error fetching associations:', error);
      setError('Failed to fetch associations. Please try again later.');
    }
  };

  fetchWords();
  fetchAssociations();
  fetchPatchnotesData();
}, []);

const fetchPatchnotesData = async () => {
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

      setOverwatchData(overwatchData);
      setLeagueData(leagueData);

      const extractedWords = extractWords(overwatchData, leagueData);
      await saveWordsToDatabase(extractedWords);
    } catch (error) {
      console.error('Error fetching patch details:', error);
      setError('Failed to fetch patch details. Please try again later.');
    }
};

  const saveWordsToDatabase = async (extractedWords) => {
    try {
      const response = await fetch('http://localhost:3000/words');
      if (!response.ok) {
        throw new Error('Failed to fetch words from database');
      }
      const wordsData = await response.json();

      const existingWords = new Set([
        ...wordsData.usableWords,
        ...wordsData.deletedWords,
        ...wordsData.keywords,
        ...wordsData.classifiers
      ]);

      const newUsableWords = extractedWords.filter(word => !existingWords.has(word));

      const data = {
        usableWords: newUsableWords,
        deletedWords: [],
        keywords: [],
        classifiers: []
      };

      const saveResponse = await fetch('http://localhost:3000/words', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!saveResponse.ok) {
        throw new Error('Failed to save words to database');
      }
    } catch (error) {
      console.error('Error saving words to database:', error);
    }
  };

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
          const splitWords = content.split(/[\s,.;:!?\(\)\[\]{}<>"'\\\/|]+/);
          splitWords.forEach(word => {
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

  const handleWordClick = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const updateWordsCategory = async (category) => {
    try {
      const response = await fetch(`http://localhost:3000/words/category/${category}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words: selectedWords }),
      });
      if (!response.ok) {
        throw new Error('Failed to update words');
      }

      if (category === 'keyword') {
        setKeywords(prevKeywords => Array.from(new Set([...prevKeywords, ...selectedWords])));
        setUsableWords(prevUsableWords => prevUsableWords.filter(word => !selectedWords.includes(word)));
      } else if (category === 'classifier') {
        setClassifiers(prevClassifiers => Array.from(new Set([...prevClassifiers, ...selectedWords])));
        setUsableWords(prevUsableWords => prevUsableWords.filter(word => !selectedWords.includes(word)));
      }

      setSelectedWords([]);
      setActionType('');
    } catch (error) {
      console.error('Error updating words:', error);
    }
  };

  const deleteWord = async (word) => {
    try {
      const response = await fetch(`http://localhost:3000/words/${word}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete word');
      }

      setUsableWords(prevUsableWords => prevUsableWords.filter(w => w !== word));
      setKeywords(prevKeywords => prevKeywords.filter(kw => kw !== word));
      setClassifiers(prevClassifiers => prevClassifiers.filter(cl => cl !== word));
      setDeletedWords(prevDeletedWords => prevDeletedWords.filter(dw => dw !== word));
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  const deleteAssociation = async (type, index) => {
    try {
      await fetch(`http://localhost:3000/associations/${type}/${index}`, {
        method: 'DELETE',
      });
      if (type === 'nerf') {
        setNerfs(nerfs.filter((_, i) => i !== index));
      } else if (type === 'buff') {
        setBuffs(buffs.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error('Error deleting association:', error);
    }
  };

  const applyAction = async () => {
    if (actionType === 'delete') {
      await Promise.all(selectedWords.map(deleteWord));
    } else {
      await updateWordsCategory(actionType);
    }
    setSelectingFor(null);
    setActionType('');
  };

  const cancelAction = () => {
    setSelectedWords([]);
    setActionType('');
  };

  const startAction = (type) => {
    setActionType(type);
    setSelectedWords([]);
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
        <h2>Available Words</h2>
        <button onClick={() => startAction('keyword')}>Keyword</button>
        <button onClick={() => startAction('classifier')}>Classifier</button>
        <button onClick={() => startAction('delete')}>Delete</button>
        {actionType && <button onClick={applyAction}>Apply {actionType}</button>}
        {actionType && <button onClick={cancelAction}>Cancel</button>}
        <div className='word-list'>
          {usableWords?.map((word, index) => (
            <span
              key={index}
              className={`word ${selectedWords.includes(word) ? 'selected' : ''}`}
              onClick={() => handleWordClick(word)}
            >
              {`${word}  `}
            </span>
          ))}
        </div>
      </div>
      <div className='selection-box'>
        <h2>Keywords</h2>
        <div className='selected-list'>
          {keywords.map((word, index) => (
            <span key={index} className='selected-word'>
              {word} <span className='trash-icon' onClick={() => deleteWord(word)}>🗑️</span>
            </span>
          ))}
        </div>
      </div>
      <div className='selection-box'>
        <h2>Classifiers</h2>
        <div className='selected-list'>
          {classifiers.map((word, index) => (
            <span key={index} className='selected-word'>
              {word} <span className='trash-icon' onClick={() => deleteWord(word)}>🗑️</span>
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
              <li key={index}>
                {association.join(' + ')} <span className='trash-icon' onClick={() => deleteAssociation('nerf', index)}>🗑️</span>
              </li>
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
              <li key={index}>
                {association.join(' + ')} <span className='trash-icon' onClick={() => deleteAssociation('buff', index)}>🗑️</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button className='submit-button' onClick={handleSubmit}>Submit Associations</button>
    </div>
  );
};

export default DevTools;
