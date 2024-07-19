import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/Patchnotes.css';

const Patchnotes = ({ game }) => {
  const { year, month, version } = useParams();
  const { user } = useContext(UserContext);
  const [patchnotes, setPatchnotes] = useState({
    id: null,
    details: {
      tank: [],
      damage: [],
      support: [],
      items: [],
      champions: [],
      bugFixes: [],
      mapUpdates: [],
    },
    comments: [],
  });
  const [associations, setAssociations] = useState({ nerf: [], buff: [] });
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentReply, setCurrentReply] = useState({ message: '', replyToId: null, commentId: null, parentReplyId: null });
  const [filter, setFilter] = useState('all');
  const [abilityDifferences, setAbilityDifferences] = useState({});
  const [sortByPercentile, setSortByPercentile] = useState(false);
  const navigate = useNavigate();

  const classifyUpdate = (text) => {
    for (let keyword of associations.nerf) {
      if (text.toLowerCase().includes(keyword[0].toLowerCase()) && text.toLowerCase().includes(keyword[1].toLowerCase())) {
        return 'nerf';
      }
    }
    for (let keyword of associations.buff) {
      if (text.toLowerCase().includes(keyword[0].toLowerCase()) && text.toLowerCase().includes(keyword[1].toLowerCase())) {
        return 'buff';
      }
    }
    return 'neutral';
  };

  useEffect(() => {
    const fetchPatchnotes = async () => {
      try {
        let url = '';
        if (game === 'overwatch') {
          url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}`;
        } else {
          url = `http://localhost:3000/patchnotes/league-of-legends/${version}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data) {
          setPatchnotes({
            id: data.id || null,
            details: data.details || {
              tank: [],
              damage: [],
              support: [],
              items: [],
              champions: [],
              bugFixes: [],
              mapUpdates: [],
            },
            comments: data.comments ? data.comments.map(comment => ({ ...comment, replies: comment.replies || [] })) : [],
          });
        } else {
          setPatchnotes({
            id: null,
            details: {
              tank: [],
              damage: [],
              support: [],
              items: [],
              champions: [],
              bugFixes: [],
              mapUpdates: [],
            },
            comments: [],
          });
        }
      } catch (error) {
        console.error('Error fetching patch details:', error);
        setError('Failed to fetch patch details. Please try again later.');
      }
    };

    const fetchAssociations = async () => {
      try {
        const response = await fetch('http://localhost:3000/associations');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAssociations(data);
      } catch (error) {
        console.error('Error fetching associations:', error);
      }
    };

    const fetchAbilityDifferences = async () => {
      try {
        const response = await fetch('http://localhost:3000/abilities');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const differences = {};
        data.forEach(diff => {
          differences[diff.character] = diff.difference;
        });
        setAbilityDifferences(differences);
      } catch (error) {
        console.error('Error fetching ability differences:', error);
      }
    };

    fetchPatchnotes();
    fetchAssociations();
    fetchAbilityDifferences();
  }, [game, year, month, version]);

  const submitComment = async (comment) => {
    try {
      let url = '';
      if (game === 'overwatch') {
        url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}/comments`;
      } else {
        url = `http://localhost:3000/patchnotes/league-of-legends/${version}/comments`;
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
      newComment.replies = [];
      setPatchnotes((prevPatchnotes) => {
        const updatedComments = [...prevPatchnotes.comments, newComment];
        return {
          ...prevPatchnotes,
          comments: updatedComments
        };
      });
    } catch (error) {
      console.error(error);
    }
  };

  const submitReply = async (reply, replyToUsername) => {
    try {
      let url = '';
      if (game === 'overwatch') {
        url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}/comments/${reply.commentId}/replies`;
      } else {
        url = `http://localhost:3000/patchnotes/league-of-legends/${version}/comments/${reply.commentId}/replies`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reply),
      });
      if (!response.ok) {
        throw new Error('Failed to create reply');
      }
      const newReply = await response.json();
      newReply.user = { username: user.username };
      newReply.replyTo = { username: replyToUsername };
      setPatchnotes((prevPatchnotes) => ({
        ...prevPatchnotes,
        comments: prevPatchnotes.comments.map((comment) =>
          comment.id === reply.commentId
            ? { ...comment, replies: [...comment.replies, newReply] }
            : comment
        ),
      }));
      setModalOpen(false);
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
        url = `http://localhost:3000/patchnotes/league-of-legends/${version}/${commentId}`;
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
        url = `http://localhost:3000/patchnotes/league-of-legends/${version}/${commentId}/vote`;
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

  const openReplyModal = (commentId, replyToId, parentReplyId) => {
    setCurrentReply({ message: '', replyToId, commentId, parentReplyId });
    setModalOpen(true);
  };

  const filterUpdates = (updates) => {
    return updates.map(update => {
      const generalUpdates = update.generalUpdates?.map(generalUpdate => ({
        text: generalUpdate,
        classification: classifyUpdate(generalUpdate)
      }));
      const abilityUpdates = update.abilityUpdates?.map(abilityUpdate => ({
        ...abilityUpdate,
        content: abilityUpdate.content.map(content => ({
          text: content,
          classification: classifyUpdate(content)
        }))
      }));

      return {
        ...update,
        generalUpdates: generalUpdates?.filter(update => filter === 'all' || update.classification === filter),
        abilityUpdates: abilityUpdates?.map(abilityUpdate => ({
          ...abilityUpdate,
          content: abilityUpdate.content.filter(content => filter === 'all' || content.classification === filter)
        })).filter(abilityUpdate => abilityUpdate.content.length > 0)
      };
    }).filter(update => update.generalUpdates?.length > 0 || update.abilityUpdates?.length > 0 || filter === 'all');
  };

  const renderUpdates = (updates) => {
    let sortedUpdates = updates;

    if (sortByPercentile) {
      sortedUpdates = updates.slice().sort((a, b) => {
        const diffA = abilityDifferences[a.title] || 0;
        const diffB = abilityDifferences[b.title] || 0;
        return diffB - diffA;
      });
    }

    return sortedUpdates.map((update, index) => (
      <div key={index}>
        {update.title && (
          <h3 onClick={() => navigate(`/${update.title}`)}>
            {update.title}
            {abilityDifferences[update.title] !== undefined && (
              <span>
                {abilityDifferences[update.title].toFixed(1) >= 0 ? ` +${abilityDifferences[update.title].toFixed(1)}` : ` ${abilityDifferences[update.title].toFixed(1)}`}
              </span>
            )}
          </h3>
        )}
        {update.generalUpdates && update.generalUpdates.length > 0 && (
          <div>
            <ul>
              {update.generalUpdates.map((item, idx) => (
                <li key={idx}>{item.text}</li>
              ))}
            </ul>
          </div>
        )}
        {update.abilityUpdates && update.abilityUpdates.length > 0 && (
          <div>
            {update.abilityUpdates.map((ability, idx) => (
              <div key={idx}>
                <h5>{ability.name}</h5>
                <ul>
                  {ability.content?.map((detail, i) => (
                    <li key={i}>{detail.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {update.content && update.content.length > 0 && (
          <div>
            <ul>
              {update.content.map((content, idx) => (
                <li key={idx}>{content}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ));
  };

  const renderCategories = (category, notes) => (
    <>
      <h2>{category} Updates</h2>
      {Array.isArray(notes) && notes.length > 0 && renderUpdates(filterUpdates(notes))}
    </>
  );

  const renderReplies = (replies) => {
    return Array.isArray(replies) ? replies.map((reply) => (
      <div key={reply.id} className='reply'>
        <p>{reply.user.username}: @{reply.replyTo.username} {reply.message}</p>
        {renderReplies(reply.replies || [])}
        <button className='reply-button' onClick={() => openReplyModal(reply.commentId, reply.user.id, reply.id)}>Reply</button>
      </div>
    )) : null;
  };

  return (
    <div className='patchnotes'>
      <Navbar />
      <div className='patches'>
        <div className="filter-buttons">
          <button onClick={() => setFilter('all')}>All</button>
          <button onClick={() => setFilter('buff')}>Buffs</button>
          <button onClick={() => setFilter('nerf')}>Nerfs</button>
          <button onClick={() => setSortByPercentile(!sortByPercentile)}>
            {sortByPercentile ? 'Sort by Default' : 'Sort by Strength'}
          </button>
        </div>
        {game === 'overwatch' ? (
          <>
            {renderCategories('Tank', patchnotes.details.tank)}
            {renderCategories('Damage', patchnotes.details.damage)}
            {renderCategories('Support', patchnotes.details.support)}
            {renderCategories('Map', patchnotes.details.mapUpdates)}
            {renderCategories('Bug', patchnotes.details.bugFixes)}
          </>
        ) : (
          <>
            {renderCategories('Champion', patchnotes.details.champions)}
            {renderCategories('Item', patchnotes.details.items)}
            {renderCategories('Bug', patchnotes.details.bugFixes)}
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
              {renderReplies(comment.replies || [])}
              <button className='reply-button' onClick={() => openReplyModal(comment.id, comment.user.id, null)}>Reply</button>
            </div>
          ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = {
                message: e.target.message.value,
                patchId: patchnotes.id,
                userId: user.id,
              };
              await submitComment(formData);
              e.target.reset();
            }}
          >
            <input
              className='comment-input'
              type='text'
              name='message'
              placeholder='Leave a comment...'
              required
            />
            <button type='submit' className='comment-button'>Submit</button>
          </form>
        </div>
      </div>
      {modalOpen && (
        <>
          <div className='overlay' onClick={() => setModalOpen(false)}></div>
          <div className='modal'>
            <h2>Reply</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = {
                  message: currentReply.message,
                  commentId: currentReply.commentId,
                  userId: user.id,
                  replyToId: currentReply.replyToId,
                  parentReplyId: currentReply.parentReplyId
                };
                const replyToUsername = patchnotes.comments.find(comment => comment.id === currentReply.commentId)?.user.username || '';
                await submitReply(formData, replyToUsername);
                setCurrentReply({ message: '', replyToId: null, commentId: null, parentReplyId: null });
              }}
            >
              <textarea
                name='message'
                placeholder='Your reply...'
                required
                value={currentReply.message}
                onChange={(e) => setCurrentReply({ ...currentReply, message: e.target.value })}
              />
              <button type='submit' className='reply-button'>Submit</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Patchnotes;
