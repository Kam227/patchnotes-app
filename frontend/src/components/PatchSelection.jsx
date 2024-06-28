import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
                console.log(data);
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
        <div>
            {patchNotes.map((note, index) => (
                <p
                    key={index}
                    onClick={() => {
                        if (game === "overwatch") {
                            navigate(`/patchnotes/overwatch/${note.year}/${note.month}`);
                        } else {
                            navigate(`/patchnotes/valorant/${note.version}`);
                        }
                    }}
                >
                    {note.year ? `${note.year} ${note.month}` : `Patch ${note.version}`}
                </p>
            ))}
        </div>
    );
};

export default PatchSelection;
