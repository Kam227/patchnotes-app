// models/votes.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

export const Vote = sequelize.define('Vote', {
  voteCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});
