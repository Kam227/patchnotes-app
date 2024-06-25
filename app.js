// app.js
import express from 'express';
import { sequelize } from './database.js';
import { User, Comment, Vote } from './models/index.js';

// Set up Express, middleware, routes, etc. here

sequelize.sync({ alter: true })
  .then(() => {
    app.listen(port, () => {
      console.log(`App is listening on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error);
  });
