const { Sequelize } = require('sequelize');

// Create SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/roadrepair.sqlite',
  logging: false, // Set to console.log to see SQL queries
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully');
  } catch (error) {
    console.error('❌ Unable to connect to SQLite database:', error);
  }
};

module.exports = { sequelize, testConnection };
