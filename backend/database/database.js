const { Sequelize } = require('sequelize');
const path = require('path');

// Absolute path to roadrepair.sqlite
const dbPath = path.join(__dirname, 'roadrepair.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully at:', dbPath);
  } catch (error) {
    console.error('❌ Unable to connect to SQLite database:', error);
  }
};

module.exports = { sequelize, testConnection };
