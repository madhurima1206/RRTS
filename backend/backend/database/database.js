const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'roadrepair.sqlite'),
  logging: false,
});

// Create SQLite database connection


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
