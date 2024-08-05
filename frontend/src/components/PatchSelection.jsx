import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import '../styles/PatchSelection.css';

const PatchSelection = ({ game }) => {
    const [patchNotes, setPatchNotes] = useState([]);
    const [displayedPatchNotes, setDisplayedPatchNotes] = useState([]);
    const [error, setError] = useState(null);
    const [visibleCount, setVisibleCount] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchPatchNotes = async () => {
            try {
                const response = await fetch(`http://localhost:3000/patchnotes/${game}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setPatchNotes(data);
                setDisplayedPatchNotes(data.slice(0, visibleCount));
            } catch (error) {
                console.error('Error fetching patch notes:', error);
                setError('Failed to fetch patch notes. Please try again later.');
            }
        };

        fetchPatchNotes();
    }, [game]);

    useEffect(() => {
        setDisplayedPatchNotes(patchNotes.slice(0, visibleCount));
    }, [patchNotes, visibleCount]);

    const handleShowMore = () => {
        setVisibleCount(prevCount => prevCount + 5);
    };

    if (error) {
        return <div>{error}</div>;
    }

    const monthMap = {
        1: 'Jan',
        2: 'Feb',
        3: 'Mar',
        4: 'Apr',
        5: 'May',
        6: 'Jun',
        7: 'Jul',
        8: 'Aug',
        9: 'Sep',
        10: 'Oct',
        11: 'Nov',
        12: 'Dec',
    };

    return (
        <div>
            <div className='patch-selection'>
                <div className="navbar">
                    <Navbar game={game} />
                </div>
                {displayedPatchNotes.map((note, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            if (game === "overwatch") {
                                const [year, month] = note.text.split('/');
                                navigate(`/patchnotes/overwatch/${year}/${month}`);
                            } else {
                                const version = note.text.split('patch-')[1].split('-notes')[0];
                                navigate(`/patchnotes/league-of-legends/${version}`);
                            }
                        }}
                        className='patch-note'
                    >
                        {game === 'overwatch' ? (
                            <p>{`${monthMap[parseInt(note.text.split('/')[1])]}, ${note.text.split('/')[0]} Patch`}</p>
                        ) : (
                            <p>{`Patch ${note.text.split('patch-')[1].split('-notes')[0]}`}</p>
                        )}
                    </div>
                ))}
                {visibleCount < patchNotes.length && (
                    <button onClick={handleShowMore} className='show-more-button'>
                        Show More
                    </button>
                )}
            </div>
            <div>
                <Footer />
            </div>
        </div>
    );
};

export default PatchSelection;
