// models/Allocation.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const Allocation = sequelize.define('Allocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  complaintId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  allocatedMaterials: {
    type: DataTypes.JSON, // stores array of {resourceId,name,quantity,unit}
    allowNull: true
  },
  allocatedMachines: {
    type: DataTypes.JSON,
    allowNull: true
  },
  allocatedPersonnel: {
    type: DataTypes.JSON,
    allowNull: true
  },
  allocatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  allocatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Allocations',
  timestamps: true
});

module.exports = Allocation;
