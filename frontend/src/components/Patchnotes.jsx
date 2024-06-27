import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const Patchnotes = () => {
    const { year, month } = useParams();
    const [patchDetails, setPatchDetails] = useState({ tank: [], damage: [], support: [], mapUpdates: [], bugFixes: [] });

    useEffect(() => {
        const fetchPatchDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3000/patchnotes/${year}/${month}`);
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
    }, [year, month]);

    return (
        <div>
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
        </div>
    );
};

export default Patchnotes;
