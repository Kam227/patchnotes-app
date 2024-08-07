import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons';
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [abilityDifferences, setAbilityDifferences] = useState([]);
  const [abilityPercentiles, setAbilityPercentiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abilities, setAbilities] = useState([]);
  const [abilityDropdown, setAbilityDropdown] = useState([]);
  const navigate = useNavigate();
  const commentInputRef = useRef();

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
          setAbilities(extractAbilities(data.details));
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
        setAbilityDifferences(data);
      } catch (error) {
        console.error('Error fetching ability differences:', error);
      }
    };

    const fetchAbilityPercentiles = async () => {
      try {
        const response = await fetch('http://localhost:3000/abilities/percentiles');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAbilityPercentiles(data);
      } catch (error) {
        console.error('Error fetching ability percentiles:', error);
      }
    };

    fetchPatchnotes();
    fetchAssociations();
    fetchAbilityDifferences();
    fetchAbilityPercentiles();
    setLoading(false);
  }, [game, year, month, version]);

  const extractAbilities = (details) => {
    let abilities = [];
    for (let category in details) {
      for (let update of details[category]) {
        if (update.abilityUpdates) {
          abilities = [...abilities, ...update.abilityUpdates.map(ability => ability.name)];
        }
      }
    }
    return abilities;
  };

  const submitComment = async (comment) => {
    const highlightedComment = highlightAbilities(comment.message);
    comment.message = highlightedComment;
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

  const deleteReply = async (commentId, replyId) => {
    try {
      let url = '';
      if (game === 'overwatch') {
        url = `http://localhost:3000/patchnotes/overwatch/${year}/${month}/comments/${commentId}/replies/${replyId}`;
      } else {
        url = `http://localhost:3000/patchnotes/league-of-legends/${version}/comments/${commentId}/replies/${replyId}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }

      setPatchnotes((prevPatchnotes) => {
        const updateReplies = (replies) => {
          return replies
            .map((reply) => reply.id === replyId ? null : {
              ...reply,
              replies: updateReplies(reply.replies || [])
            })
            .filter(reply => reply !== null);
        };

        const updatedComments = prevPatchnotes.comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: updateReplies(comment.replies)
            };
          }
          return comment;
        });

        return {
          ...prevPatchnotes,
          comments: updatedComments,
        };
      });
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
      // css
      const icon = document.getElementById(`thumbs-up-${commentId}`);
      if (icon) {
        icon.classList.add('thumbs-up-animate');
        setTimeout(() => {
          icon.classList.remove('thumbs-up-animate');
        }, 1000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openReplyModal = (commentId, replyToId, parentReplyId) => {
    setCurrentReply({ message: '', replyToId: replyToId || user.id, commentId, parentReplyId: parentReplyId || null });
    setModalOpen(true);
  };

  const handleCharacterClick = (character) => {
    navigate(`/${character}`, { state: { character, id: patchnotes.id, game } });
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
    return updates.map((update, index) => (
      <div key={index}>
        {update.title && (
          <h3 onClick={() => handleCharacterClick(update.title)}>
            {update.title}
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
            {update.abilityUpdates.map((ability, idx) => {
              const abilityDiff = abilityDifferences.find(ad => ad.character === update.title && ad.name === ability.name);
              const abilityPercentile = abilityPercentiles.find(ad => ad.character === update.title && ad.name === ability.name);
              const historicalMessage = abilityDiff && abilityDiff.count > 1
                ? `The ability has changed by ${abilityDiff.difference.toFixed(1)}% relative to other patches`
                : 'Insufficient data';
              return (
                <div key={idx} id={`ability-${ability.name.replace(/\s+/g, '-')}`}>
                  <h5>
                    {ability.name}
                    {abilityDiff && (
                      <span>
                        {` (Percentage change: ${abilityDiff.percentile.toFixed(1)}, `}
                        <span title={historicalMessage}>
                          {abilityDiff.count > 1 ?
                            `Historical change: ${abilityDiff.difference >= 0 ? `+${abilityDiff.difference.toFixed(1)}` : abilityDiff.difference.toFixed(1)}` :
                            'Historical change: Not enough data'}
                        </span>
                        {')'}
                      </span>
                    )}
                    {abilityPercentile && (
                      <span>
                        {` (Percentile rank: ${abilityPercentile.percentile.toFixed(1)}%)`}
                      </span>
                    )}
                  </h5>
                  <ul>
                    {ability.content?.map((detail, i) => (
                      <li key={i}>{detail.text}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
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

  const renderBugFixes = (bugFixes) => {
    if (Array.isArray(bugFixes) && game === 'league-of-legends') {
      return (
        <div>
          <h2>Bug Fixes</h2>
          <ul>
            {bugFixes?.map((fix, index) => (
              <li key={index}>{fix}</li>
            ))}
          </ul>
        </div>
      );
    } else {
      return (
        <div>
          <h2>Bug Fixes Overwatch</h2>
          <ul>
            {bugFixes?.map((fix, index) => (
              <li key={index}>{fix.name}: {fix.content.join(', ')}</li>
            ))}
          </ul>
        </div>
      );
    }
  };

  const renderCategories = (category, notes) => (
    <>
      <h2>{category} Updates</h2>
      {Array.isArray(notes) && notes.length > 0 && renderUpdates(filterUpdates(notes))}
    </>
  );

  const renderReplies = (replies, commentId) => {
    return Array.isArray(replies) ? replies.map((reply) => (
      <div key={reply.id} className='reply'>
        <img src={`https://ui-avatars.com/api/?name=${reply.user.username}&background=random`} alt={`${reply.user.username}'s avatar`} className='avatar' />
        <p>{reply.user.username}: @{reply.replyTo.username} {reply.message}</p>
        {renderReplies(reply.replies || [], commentId)}
        <button className='reply-button' onClick={() => openReplyModal(commentId, reply.user.id, reply.id)}>Reply</button>
        <button className='delete-button' onClick={() => deleteReply(commentId, reply.id)}>Delete</button>
      </div>
    )) : null;
  };

  const categoryButtons = {
    'overwatch': ['Tank', 'Damage', 'Support', 'Map Updates', 'Bug Fixes'],
    'league-of-legends': ['Champions', 'Items', 'Bug Fixes'],
  };

  const handleCommentInputChange = (e) => {
    const input = e.target.value;
    const atIndex = input.lastIndexOf('@');
    if (atIndex !== -1) {
      const query = input.slice(atIndex + 1).toLowerCase();
      const filteredAbilities = abilities.filter(ability => ability.toLowerCase().includes(query));
      setAbilityDropdown(filteredAbilities);
    } else {
      setAbilityDropdown([]);
    }
  };

  const handleAbilityName = (ability) => {
    const input = commentInputRef.current.value;
    const atIndex = input.lastIndexOf('@');
    const newInput = input.slice(0, atIndex + 1) + ability + ' ';
    commentInputRef.current.value = newInput;
    setAbilityDropdown([]);
  };

  const highlightAbilities = (message) => {
    const regex = /@([a-zA-Z\s]+)/g;
    return message.replace(regex, (match, p1) => {
      const ability = p1.trim();
      return `<span class="highlight" data-ability="${ability.replace(/\s+/g, '-')}">@${ability}</span>`;
    });
  };

  useEffect(() => {
    const handleAbilityClick = (event) => {
      const abilityName = event.target.getAttribute('data-ability').replace(/-/g, ' ');
      let found = false;
      for (const category in patchnotes.details) {
        for (const update of patchnotes.details[category]) {
          if (update.abilityUpdates) {
            for (const ability of update.abilityUpdates) {
              if (ability.name.toLowerCase() === abilityName.toLowerCase()) {
                const element = document.querySelector(`[id='ability-${ability.name.replace(/\s+/g, '-')}']`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  found = true;
                  break;
                }
              }
            }
          }
          if (found) break;
        }
        if (found) break;
      }
    };

    document.querySelectorAll('.highlight').forEach(elem => {
      elem.addEventListener('click', handleAbilityClick);
    });

    return () => {
      document.querySelectorAll('.highlight').forEach(elem => {
        elem.removeEventListener('click', handleAbilityClick);
      });
    };
  }, [patchnotes]);

  return (
    <div className='patchnotes'>
      <Navbar />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className='patches'>
          <div className="filter-buttons">
            <button onClick={() => setFilter('all')}>All</button>
            <button onClick={() => setFilter('buff')}>Buffs</button>
            <button onClick={() => setFilter('nerf')}>Nerfs</button>
          </div>
          <div className="category-buttons">
            {categoryButtons[game]?.map(category => (
              <button key={category} onClick={() => setCategoryFilter(category)}>{category}</button>
            ))}
          </div>
          {game === 'overwatch' ? (
            <>
              {categoryFilter === 'all' || categoryFilter === 'Tank' ? renderCategories('Tank', patchnotes.details.tank) : null}
              {categoryFilter === 'all' || categoryFilter === 'Damage' ? renderCategories('Damage', patchnotes.details.damage) : null}
              {categoryFilter === 'all' || categoryFilter === 'Support' ? renderCategories('Support', patchnotes.details.support) : null}
              {categoryFilter === 'all' || categoryFilter === 'Map Updates' ? renderCategories('Map', patchnotes.details.mapUpdates) : null}
              {categoryFilter === 'all' || categoryFilter === 'Bug Fixes' ? renderBugFixes(patchnotes.details.bugFixes) : null}
            </>
          ) : (
            <>
              {categoryFilter === 'all' || categoryFilter === 'Champions' ? renderCategories('Champion', patchnotes.details.champions) : null}
              {categoryFilter === 'all' || categoryFilter === 'Items' ? renderCategories('Item', patchnotes.details.items) : null}
              {categoryFilter === 'all' || categoryFilter === 'Bug Fixes' ? renderBugFixes(patchnotes.details.bugFixes) : null}
            </>
          )}
        </div>
      )}

      <div className='comments'>
        <h2>Comments</h2>
        <div>
          {patchnotes.comments?.map((comment) => (
            <div key={comment.id} className='comment'>
              <img src={`https://ui-avatars.com/api/?name=${comment.user.username}&background=random`} alt={`${comment.user.username}'s avatar`} className='avatar' />
              <p>{comment.user.username}</p>
              <p dangerouslySetInnerHTML={{ __html: comment.message }}></p>
              <div className='vote'>
                <FontAwesomeIcon
                  id={`thumbs-up-${comment.id}`}
                  icon={faThumbsUp}
                  onClick={() => upvoteComment(comment.id)}
                  style={{ cursor: 'pointer' }}
                />
                <p>{comment.voteCount}</p>
              </div>
              <p onClick={() => deleteComment(comment.id)}>🗑️</p>
              {renderReplies(comment.replies || [], comment.id)}
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
              ref={commentInputRef}
              onChange={handleCommentInputChange}
              required
            />
            {abilityDropdown.length > 0 && (
              <ul className='dropdown'>
                {abilityDropdown.map((ability, index) => (
                  <li key={index} onClick={() => handleAbilityName(ability)}>
                    {ability}
                  </li>
                ))}
              </ul>
            )}
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
