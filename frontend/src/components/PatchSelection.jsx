import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PatchSelection = () => {
    const [patchNotes, setPatchNotes] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatchNotes = async () => {
            try {
                const response = await fetch('http://localhost:3000/patchnotes');
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
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            {patchNotes.map((note, index) => (
                <p key={index} onClick={() => navigate(`/game/patch/${note.year}/${note.month}`)}>
                    {note.year} {note.month}
                </p>
            ))}
        </div>
    );
};

export default PatchSelection;
