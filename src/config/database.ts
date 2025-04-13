import { Sequelize } from 'sequelize';
import { config } from './env';
import path from 'path';

const dbPath = path.resolve(process.cwd(), config.database.path || './data/game.db');

// Create the data directory if it doesn't exist
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: config.server.nodeEnv === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

export const initializeDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Connected to SQLite database');
      
    // Sync all models
    await sequelize.sync({ alter: config.server.nodeEnv === 'development' });
    console.log('Database models synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}; 