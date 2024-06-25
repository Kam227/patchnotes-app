// models/comment.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

export const Comment = sequelize.define('Comment', {
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  replies: {
    type: DataTypes.ARRAY(DataTypes.JSON),
    allowNull: true,
    defaultValue: []
  },
  voteCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  voters: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
    defaultValue: []
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
});
