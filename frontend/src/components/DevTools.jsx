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
  const [previousState, setPreviousState] = useState({ usableWords: [], keywords: [], classifiers: [] });

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const wordsResponse = await fetch('http://localhost:3000/words');
        if (!wordsResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const wordsData = await wordsResponse.json();
        console.log(wordsData);

        if (!wordsData || wordsData.usableWords.length === 0) {
          await fetchPatchnotesData();
        } else {
          setUsableWords(wordsData.usableWords || []);
          setDeletedWords(wordsData.deletedWords || []);
          setKeywords(wordsData.keywords || []);
          setClassifiers(wordsData.classifiers || []);
          await checkForNewWords(wordsData.usableWords, wordsData.deletedWords);
        }
      } catch (error) {
        console.error('Error fetching words:', error);
        setError('Failed to fetch words. Please try again later.');
      }
    };

    const fetchAssociations = async () => {
      try {
        const associationsResponse = await fetch('http://localhost:3000/associations');
        if (!associationsResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const associationsData = await associationsResponse.json();
        console.log('Fetched associations:', associationsData);
        setNerfs(associationsData?.nerf || []);
        setBuffs(associationsData?.buff || []);
      } catch (error) {
        console.error('Error fetching associations:', error);
        setError('Failed to fetch associations. Please try again later.');
      }
    };

    fetchWords();
    fetchAssociations();
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

      console.log('Overwatch data:', overwatchData);
      console.log('League data:', leagueData);

      setOverwatchData(overwatchData);
      setLeagueData(leagueData);

      const extractedWords = extractWords(overwatchData, leagueData);
      await saveWordsToDatabase({ usableWords: extractedWords, deletedWords: [], keywords: [], classifiers: [] });
      setUsableWords(extractedWords);
    } catch (error) {
      console.error('Error fetching patch details:', error);
      setError('Failed to fetch patch details. Please try again later.');
    }
  };

  const saveWordsToDatabase = async (data) => {
    try {
      const response = await fetch('http://localhost:3000/words', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
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

  const checkForNewWords = async (usableWords, deletedWords) => {
    const allExtractedWords = extractWords(overwatchData, leagueData);
    const newUsableWords = [...usableWords];

    allExtractedWords.forEach(word => {
      if (!usableWords.includes(word) && !deletedWords.includes(word)) {
        newUsableWords.push(word);
      }
    });

    if (newUsableWords.length !== usableWords.length) {
      setUsableWords(newUsableWords);
      await saveWordsToDatabase({
        usableWords: newUsableWords,
        deletedWords,
        keywords,
        classifiers
      });
    }
  };

  const handleWordClick = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const deleteKeyword = async (keyword) => {
    try {
      await fetch(`http://localhost:3000/keywords/${keyword}`, {
        method: 'DELETE',
      });
      setKeywords(keywords.filter(kw => kw !== keyword));
    } catch (error) {
      console.error('Error deleting keyword:', error);
    }
  };

  const deleteClassifier = async (classifier) => {
    try {
      await fetch(`http://localhost:3000/classifiers/${classifier}`, {
        method: 'DELETE',
      });
      setClassifiers(classifiers.filter(cl => cl !== classifier));
    } catch (error) {
      console.error('Error deleting classifier:', error);
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
    let newUsableWords = [...usableWords];
    let newDeletedWords = [...deletedWords];
    let newKeywords = [...keywords];
    let newClassifiers = [...classifiers];

    if (actionType === 'delete') {
      newUsableWords = usableWords.filter(word => !selectedWords.includes(word));
      newDeletedWords = [...new Set([...deletedWords, ...selectedWords])];
    } else if (actionType === 'keyword') {
      newKeywords = [...new Set([...keywords, ...selectedWords])];
    } else if (actionType === 'classifier') {
      newClassifiers = [...new Set([...classifiers, ...selectedWords])];
    }

    const dataToUpdate = {
      usableWords: newUsableWords,
      deletedWords: newDeletedWords,
      keywords: newKeywords,
      classifiers: newClassifiers
    };

    setUsableWords(newUsableWords);
    setDeletedWords(newDeletedWords);
    setKeywords(newKeywords);
    setClassifiers(newClassifiers);
    setSelectedWords([]);

    try {
      await saveWordsToDatabase(dataToUpdate);
    } catch (error) {
      console.error('Error updating words:', error);
    }

    setSelectingFor(null);
    setActionType('');
  };

  const cancelAction = () => {
    setUsableWords(previousState.usableWords);
    setKeywords(previousState.keywords);
    setClassifiers(previousState.classifiers);
    setSelectedWords([]);
    setActionType('');
  };

  const startAction = (type) => {
    setPreviousState({
      usableWords: [...usableWords],
      keywords: [...keywords],
      classifiers: [...classifiers],
    });
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
              {word}
            </span>
          ))}
        </div>
      </div>
      <div className='selection-box'>
        <h2>Keywords</h2>
        <div className='selected-list'>
          {keywords.map((word, index) => (
            <span key={index} className='selected-word'>
              {word} <span className='trash-icon' onClick={() => deleteKeyword(word)}>🗑️</span>
            </span>
          ))}
        </div>
      </div>
      <div className='selection-box'>
        <h2>Classifiers</h2>
        <div className='selected-list'>
          {classifiers.map((word, index) => (
            <span key={index} className='selected-word'>
              {word} <span className='trash-icon' onClick={() => deleteClassifier(word)}>🗑️</span>
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
