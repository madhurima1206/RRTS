// models/ResourceRequest.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const ResourceRequest = sequelize.define('ResourceRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  supervisorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  complaintId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estimatedMaterials: {
    type: DataTypes.TEXT, // you can store a JSON string or comma-separated list
    allowNull: true
  },
  requiredMachines: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requiredPersonnel: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  estimatedDays: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ResourceRequests',
  timestamps: true
});

module.exports = ResourceRequest;
