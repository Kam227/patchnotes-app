import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const Patchnotes = ({ game }) => {
    const { year, month, version } = useParams();
    const [patchDetails, setPatchDetails] = useState({
        tank: [],
        damage: [],
        support: [],
        agentUpdates: [],
        mapUpdates: [],
        bugFixes: []
    });

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
                setPatchDetails(data);
            } catch (error) {
                console.error('Error fetching patch details:', error);
            }
        };

        fetchPatchDetails();
    }, [game, year, month, version]);

    return (
        <div>
            {game === 'overwatch' ? (
                <>
                    <h2>Tank Updates</h2>
                    {patchDetails.tank.length > 0 ? (
                        patchDetails.tank.map((content, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
                        ))
                    ) : (
                        <p>No tank updates found.</p>
                    )}

                    <h2>Damage Updates</h2>
                    {patchDetails.damage.length > 0 ? (
                        patchDetails.damage.map((content, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
                        ))
                    ) : (
                        <p>No damage updates found.</p>
                    )}

                    <h2>Support Updates</h2>
                    {patchDetails.support.length > 0 ? (
                        patchDetails.support.map((content, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
                        ))
                    ) : (
                        <p>No support updates found.</p>
                    )}
                </>
            ) : (
                <>
                    <h2>Agent Updates</h2>
                    {patchDetails.agentUpdates.length > 0 ? (
                        patchDetails.agentUpdates.map((content, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
                        ))
                    ) : (
                        <p>No agent updates found.</p>
                    )}

                    <h2>Map Updates</h2>
                    {patchDetails.mapUpdates.length > 0 ? (
                        patchDetails.mapUpdates.map((content, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
                        ))
                    ) : (
                        <p>No map updates found.</p>
                    )}

                    <h2>Bug Fixes</h2>
                    {patchDetails.bugFixes.length > 0 ? (
                        patchDetails.bugFixes.map((content, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
                        ))
                    ) : (
                        <p>No bug fixes found.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Patchnotes;
