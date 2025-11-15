const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  problemType: {
    type: DataTypes.ENUM('pothole', 'cracked_road', 'flooding', 'poor_drainage', 'sidewalk_issue', 'other'),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'assigned', 'in_progress', 'completed', 'rejected'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  location: {
    type: DataTypes.JSON,
    allowNull: false
  },
  estimatedMaterials: {
    type: DataTypes.TEXT,
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
  residentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'complaints',
  timestamps: true
});

// Import User model and define association
const User = require('./User');
Complaint.belongsTo(User, { foreignKey: 'residentId', as: 'resident' });
User.hasMany(Complaint, { foreignKey: 'residentId' });

module.exports = Complaint;
