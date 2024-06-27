// seed.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Comment, Vote } from './models/index.js';
import { sequelize } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './seeders/users.json'), 'utf8'));
const commentData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './seeders/comments.json'), 'utf8'));
const voteData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './seeders/votes.json'), 'utf8'));

const seedDatabase = async () => {
  try {
    // Sync all models that aren't already in the database
    await sequelize.sync({ alter: true });

    // Then seed the User and Post data
    await User.bulkCreate(userData);
    console.log('User data has been seeded!');

    await Comment.bulkCreate(commentData);
    console.log('Comment data has been seeded!');

    await Vote.bulkCreate(voteData);
    console.log('Vote data has been seeded!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
