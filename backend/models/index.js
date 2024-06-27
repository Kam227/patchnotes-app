// models/index.js
import { User } from './user.js';
import { Comment } from './comment.js';
import { Vote } from './vote.js';

User.hasMany(Comment, { as: 'comments', foreignKey: 'userId' });
Comment.belongsTo(User, { as: 'user', foreignKey: 'userId' });

Comment.hasMany(Vote, { as: 'votes', foreignKey: 'commentId' });
Vote.belongsTo(Comment, { as: 'comment', foreignKey: 'commentId' });

User.hasMany(Vote, { as: 'votes', foreignKey: 'userId' });
Vote.belongsTo(User, { as: 'user', foreignKey: 'userId' });

export { User, Comment, Vote };
