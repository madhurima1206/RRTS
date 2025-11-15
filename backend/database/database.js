const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/roadrepair.sqlite',
  logging: false,
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully');
  } catch (error) {
    console.error('❌ Unable to connect to SQLite database:', error);
  }
};

module.exports = { sequelize, testConnection };
