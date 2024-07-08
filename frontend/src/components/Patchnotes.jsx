import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import Navbar from './Navbar';
import '../styles/Patchnotes.css';

const Patchnotes = ({ game }) => {
    const { year, month, version } = useParams();
    const { user } = useContext(UserContext);
    const [patchnotes, setPatchnotes] = useState({
        id: null,
        Tanks: [],
        Damages: [],
        Supports: [],
        Agents: [],
        Maps: [],
        Bugs: [],
        comments: [],
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatchnotes = async () => {
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

                if (data.length > 0) {
                    const patchData = data[0];
                    setPatchnotes({
                        id: patchData.id || null,
                        Tanks: patchData.Tanks || [],
                        Damages: patchData.Damages || [],
                        Supports: patchData.Supports || [],
                        Agents: patchData.Agents || [],
                        Maps: patchData.Maps || [],
                        Bugs: patchData.Bugs || [],
                        comments: patchData.comments || [],
                    });
                } else {
                    setPatchnotes({
                        id: null,
                        Tanks: [],
                        Damages: [],
                        Supports: [],
                        Agents: [],
                        Maps: [],
                        Bugs: [],
                        comments: [],
                    });
                }
            } catch (error) {
                console.error('Error fetching patch details:', error);
                setError('Failed to fetch patch details. Please try again later.');
            }
        };

        fetchPatchnotes();
    }, [game, year, month, version]);

    const submitComment = async (comment) => {
        try {
            let url = '';
            if (game === 'overwatch') {
                url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}/comments`;
            } else {
                url = `http://localhost:3000/patchnotes/valorant/${version}/comments`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(comment),
            });
            if (!response.ok) {
                throw new Error('Failed to create comment');
            }
            const newComment = await response.json();
            newComment.user = { username: user.username };
            setPatchnotes((prevPatchnotes) => ({
                ...prevPatchnotes,
                comments: [...prevPatchnotes.comments, newComment],
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const deleteComment = async (commentId) => {
        try {
            let url = '';
            if (game === 'overwatch') {
                url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}/${commentId}`;
            } else {
                url = `http://localhost:3000/patchnotes/valorant/${version}/${commentId}`;
            }

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }
            setPatchnotes((prevPatchnotes) => ({
                ...prevPatchnotes,
                comments: prevPatchnotes.comments.filter(comment => comment.id !== commentId),
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const upvoteComment = async (commentId) => {
        try {
            let url = '';
            if (game === 'overwatch') {
                url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}/${commentId}/vote`;
            } else {
                url = `http://localhost:3000/patchnotes/valorant/${version}/${commentId}/vote`;
            }
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to upvote comment');
            }

            const updatedVote = await response.json();
            setPatchnotes((prevPatchnotes) => ({
                ...prevPatchnotes,
                comments: prevPatchnotes.comments.map((comment) =>
                    comment.id === commentId ? { ...comment, voteCount: updatedVote.voteCount } : comment
                ),
            }));
        } catch (error) {
            console.error(error);
        }
    };

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
        <div className='patchnotes'>
            <Navbar />
            <div className='patches'>
                {game === 'overwatch' ? (
                    <>
                        {renderPatchNotes('Tank', patchnotes.Tanks)}
                        {renderPatchNotes('Damage', patchnotes.Damages)}
                        {renderPatchNotes('Support', patchnotes.Supports)}
                        {renderPatchNotes('Map', patchnotes.Maps)}
                        {renderPatchNotes('Bug', patchnotes.Bugs)}
                    </>
                ) : (
                    <>
                        {renderPatchNotes('Agent', patchnotes.Agents)}
                        {renderPatchNotes('Map', patchnotes.Maps)}
                        {renderPatchNotes('Bug', patchnotes.Bugs)}
                    </>
                )}
            </div>
            <div className='comments'>
                <h2>Comments</h2>
                <div>
                    {patchnotes.comments?.map((comment) => (
                        <div key={comment.id} className='comment'>
                            <p>{comment.user.username}: {comment.message}</p>
                            <div className='vote'>
                                <p onClick={() => upvoteComment(comment.id)}>👍</p>
                                <p>{comment.voteCount}</p>
                            </div>
                            <p onClick={() => deleteComment(comment.id)}>🗑️</p>
                        </div>
                    ))}
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = {
                            message: e.target.message.value,
                            patchId: patchnotes.id,
                            userId: user.id,
                        };
                        submitComment(formData);
                    }}
                >
                    <input className='comment-input' type='text' name='message' placeholder='Leave a comment...' required />
                    <button type='submit' className='comment-button'>Submit</button>
                </form>
            </div>
        </div>
    );
};

export default Patchnotes;
