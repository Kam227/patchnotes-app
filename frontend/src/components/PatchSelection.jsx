import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/PatchSelection.css'

const PatchSelection = ({ game }) => {
    const [patchNotes, setPatchNotes] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatchNotes = async () => {
            try {
                const response = await fetch(`http://localhost:3000/patchnotes/${game}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setPatchNotes(data);
            } catch (error) {
                console.error('Error fetching patch notes:', error);
                setError('Failed to fetch patch notes. Please try again later.');
            }
        };

        fetchPatchNotes();
    }, [game]);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className='patch-selection'>
            <Navbar />
            {patchNotes.map((note, index) => (
                <p
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
                >
                    {note.text}
                </p>
            ))}
        </div>
    );
};

export default PatchSelection;
