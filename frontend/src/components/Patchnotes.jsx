import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const Patchnotes = ({ game }) => {
    const { year, month, version } = useParams();
    const [patchDetails, setPatchDetails] = useState({
        Tanks: [],
        Damages: [],
        Supports: [],
        Agents: [],
        Maps: [],
        Bugs: []
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatchDetails = async () => {
            try {
                let url = '';
                if (game === 'overwatch') {
                    url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}`;
                } else {
                    url = `http://localhost:3000/patchnotes/valorant/${version}`;
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                console.log(data);

                if (data.length > 0) {
                    const patchData = data[0];
                    setPatchDetails({
                        Tanks: patchData.Tanks || [],
                        Damages: patchData.Damages || [],
                        Supports: patchData.Supports || [],
                        Agents: patchData.Agents || [],
                        Maps: patchData.Maps || [],
                        Bugs: patchData.Bugs || []
                    });
                } else {
                    setPatchDetails({
                        Tanks: [],
                        Damages: [],
                        Supports: [],
                        Agents: [],
                        Maps: [],
                        Bugs: []
                    });
                }
            } catch (error) {
                console.error('Error fetching patch details:', error);
                setError('Failed to fetch patch details. Please try again later.');
            }
        };

        fetchPatchDetails();
    }, [game, year, month, version]);

    if (error) {
        return <div>{error}</div>;
    }

    const renderPatchNotes = (category, notes) => (
        <>
            <h2>{category} Updates</h2>
            {notes.length > 0 ? (
                notes.map((content, index) => (
                    <div key={index} dangerouslySetInnerHTML={{ __html: content.text }} />
                ))
            ) : (
                <p>No {category.toLowerCase()} updates found.</p>
            )}
        </>
    );

    return (
        <div>
            {game === 'overwatch' ? (
                <>
                    {renderPatchNotes('Tank', patchDetails.Tanks)}
                    {renderPatchNotes('Damage', patchDetails.Damages)}
                    {renderPatchNotes('Support', patchDetails.Supports)}
                    {renderPatchNotes('Map', patchDetails.Maps)}
                    {renderPatchNotes('Bug', patchDetails.Bugs)}
                </>
            ) : (
                <>
                    {renderPatchNotes('Agent', patchDetails.Agents)}
                    {renderPatchNotes('Map', patchDetails.Maps)}
                    {renderPatchNotes('Bug', patchDetails.Bugs)}
                </>
            )}
        </div>
    );
};

export default Patchnotes;
