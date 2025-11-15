// server-working.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { sequelize, testConnection } = require('./database/database');

// Sequelize models — make sure these files exist
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Resource = require('./models/Resource');
const ResourceRequest = require('./models/ResourceRequest'); // optional — your code referenced it
const Allocation = require('./models/Allocation'); // optional — your code referenced it

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// === Temporary request logger (useful for debugging) ===
app.use((req, res, next) => {
  console.log('---- INCOMING REQUEST ----');
  console.log('METHOD:', req.method);
  console.log('URL   :', req.originalUrl || req.url);
  console.log('AUTH  :', !!req.headers.authorization);
  console.log('CONTENT-TYPE:', req.headers['content-type']);
  next();
});

// JWT Secret
const JWT_SECRET = 'ecaedd0e8cf57913de87c64daa31fe2032dfdd6491cb3477e18c37c3d9fb503054725c6626ecfda76ed7fd094576b06232e68ed5f5939e9f3e78de64f36b6eb2';

// Initialize database and create tables
const initializeDatabase = async () => {
  try {
    await testConnection();
    
    // Create tables if they don't exist
    await User.sync({ force: false });
    await Complaint.sync({ force: false });
    await Resource.sync({ force: false });

    // If you have ResourceRequest & Allocation models, sync them too
    if (ResourceRequest && typeof ResourceRequest.sync === 'function') {
      await ResourceRequest.sync({ force: false });
    }
    if (Allocation && typeof Allocation.sync === 'function') {
      await Allocation.sync({ force: false });
    }
    
    console.log('✅ Database tables synchronized');
    
    // Create sample users if they don't exist
    await createSampleUsers();
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Create sample users
const createSampleUsers = async () => {
  try {
    const sampleUsers = [
      { name: 'John Resident', email: 'resident@example.com', password: 'password123', role: 'resident' },
      { name: 'Sarah Clerk', email: 'clerk@example.com', password: 'password123', role: 'clerk' },
      { name: 'Mike Supervisor', email: 'supervisor@example.com', password: 'password123', role: 'supervisor' },
      { name: 'Admin User', email: 'administrator@example.com', password: 'password123', role: 'administrator' },
      { name: 'City Mayor', email: 'mayor@example.com', password: 'password123', role: 'mayor' },
      { name: 'Road Worker', email: 'worker@example.com', password: 'password123', role: 'worker' }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        await User.create(userData);
        console.log(`✅ Created sample user: ${userData.name}`);
      }
    }
    
    console.log('✅ Sample users check completed');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
  }
};

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.count();
    const complaintCount = await Complaint.count();
    const resourceCount = await Resource.count();
    
    res.json({ 
      message: 'Backend Server is Running with SQL Database!', 
      timestamp: new Date().toISOString(),
      usersCount: userCount,
      complaintsCount: complaintCount,
      resourcesCount: resourceCount,
      database: 'SQLite'
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    console.log('Registration attempt:', { name, email, role });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'resident'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log('Login attempt:', { email, role });

    // Find user by email and role
    const user = await User.findOne({ where: { email, role } });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Get user profile
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Complaints routes
app.post('/api/complaints', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const complaint = await Complaint.create({
      ...req.body,
      residentId: decoded.userId
    });

    res.status(201).json({
      message: 'Complaint submitted successfully!',
      complaint
    });

  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/complaints/my-complaints', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const complaints = await Complaint.findAll({
      where: { residentId: decoded.userId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(complaints);

  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resource Request routes (if ResourceRequest model exists)
app.post('/api/resource-requests', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'supervisor') {
      return res.status(403).json({ message: 'Only supervisors can create resource requests' });
    }

    const resourceRequest = await ResourceRequest.create({
      ...req.body,
      supervisorId: decoded.userId
    });

    res.status(201).json({
      message: 'Resource request submitted successfully!',
      resourceRequest
    });

  } catch (error) {
    console.error('Error creating resource request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/resource-requests/supervisor', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'supervisor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const resourceRequests = await ResourceRequest.findAll({
      where: { supervisorId: decoded.userId },
      include: [
        {
          model: Complaint,
          attributes: ['title', 'location', 'severity']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(resourceRequests);

  } catch (error) {
    console.error('Error fetching resource requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/resource-requests/admin', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const resourceRequests = await ResourceRequest.findAll({
      include: [
        {
          model: Complaint,
          attributes: ['title', 'location', 'severity', 'problemType']
        },
        {
          model: User,
          attributes: ['name', 'email'],
          as: 'supervisor'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(resourceRequests);

  } catch (error) {
    console.error('Error fetching resource requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/resource-requests/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requestId = req.params.id;
    const { status, adminNotes } = req.body;
    
    const resourceRequest = await ResourceRequest.findByPk(requestId);
    if (!resourceRequest) {
      return res.status(404).json({ message: 'Resource request not found' });
    }

    await resourceRequest.update({
      status,
      adminNotes: adminNotes || resourceRequest.adminNotes
    });

    res.json({
      message: 'Resource request status updated successfully!',
      resourceRequest
    });

  } catch (error) {
    console.error('Error updating resource request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================================
// ADMIN: PATCH UPDATE COMPLAINT (compatibility)
// ===============================================
app.patch('/api/complaints/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // ONLY ADMIN IS ALLOWED TO PATCH (allocation uses this)
    if (decoded.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaintId = req.params.id;
    const updates = req.body;

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await complaint.update(updates);

    res.json({
      message: 'Complaint updated successfully (PATCH route)',
      complaint
    });

  } catch (error) {
    console.error('PATCH /api/complaints/:id error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===============================================
// Allocation endpoint (transactional, admin-only)
// PUT /api/complaints/:id/allocate
// Body (recommended):
// {
//   allocatedMaterials: [{ resourceId, name, quantity, unit }],
//   allocatedMachines: [{ resourceId, name, quantity?, unit? }],
//   allocatedPersonnel: [{ resourceId, name, quantity, unit }],
//   allocatedBy: <userId> (optional)
// }
// ===============================================
app.put('/api/complaints/:id/allocate', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      await t.rollback();
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'administrator') {
      await t.rollback();
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaintId = req.params.id;
    const complaint = await Complaint.findByPk(complaintId, { transaction: t });
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Accept allocation details from body (frontend should send these)
    const {
      allocatedMaterials = [],
      allocatedMachines = [],
      allocatedPersonnel = [],
      allocatedBy = decoded.userId
    } = req.body || {};

    // 1) Update complaint status + assignedResources metadata
    const assignedResourcesMeta = {
      materials: allocatedMaterials,
      machines: allocatedMachines,
      personnel: allocatedPersonnel
    };

    await complaint.update({
      status: 'assigned',
      assignedResources: assignedResourcesMeta,
      assignedAt: new Date().toISOString(),
      assignedBy
    }, { transaction: t });

    // 2) Update resources (materials -> reduce quantity, machines -> mark unavailable, personnel -> reduce quantity)
    // Each update must be applied to an existing Resource row
    for (const mat of allocatedMaterials || []) {
      const resRow = await Resource.findByPk(mat.resourceId, { transaction: t });
      if (!resRow) {
        await t.rollback();
        return res.status(404).json({ message: `Material resource ${mat.resourceId} not found` });
      }
      const currentQty = parseInt(resRow.quantity || 0, 10);
      const deduct = parseInt(mat.quantity || 0, 10);
      if (isNaN(deduct) || deduct <= 0) {
        await t.rollback();
        return res.status(400).json({ message: `Invalid quantity for material ${mat.resourceId}` });
      }
      if (deduct > currentQty) {
        await t.rollback();
        return res.status(400).json({ message: `Not enough quantity for ${resRow.name}. Requested ${deduct}, available ${currentQty}` });
      }
      await resRow.update({ quantity: currentQty - deduct }, { transaction: t });
    }

    for (const mach of allocatedMachines || []) {
      const resRow = await Resource.findByPk(mach.resourceId, { transaction: t });
      if (!resRow) {
        await t.rollback();
        return res.status(404).json({ message: `Machine resource ${mach.resourceId} not found` });
      }
      // mark machine unavailable
      await resRow.update({ available: false }, { transaction: t });
    }

    for (const pers of allocatedPersonnel || []) {
      const resRow = await Resource.findByPk(pers.resourceId, { transaction: t });
      if (!resRow) {
        await t.rollback();
        return res.status(404).json({ message: `Personnel resource ${pers.resourceId} not found` });
      }
      const currentQty = parseInt(resRow.quantity || 0, 10);
      const deduct = parseInt(pers.quantity || 0, 10);
      if (isNaN(deduct) || deduct <= 0) {
        await t.rollback();
        return res.status(400).json({ message: `Invalid personnel quantity for ${pers.resourceId}` });
      }
      if (deduct > currentQty) {
        await t.rollback();
        return res.status(400).json({ message: `Not enough personnel for ${resRow.name}. Requested ${deduct}, available ${currentQty}` });
      }
      await resRow.update({ quantity: currentQty - deduct }, { transaction: t });
    }

    // 3) Create Allocation record (if Allocation model exists)
    let allocationRecord = null;
    if (Allocation) {
      allocationRecord = await Allocation.create({
        complaintId,
        allocatedMaterials,
        allocatedMachines,
        allocatedPersonnel,
        allocatedBy,
        allocatedAt: new Date().toISOString()
      }, { transaction: t });
    }

    // Commit transaction
    await t.commit();

    res.json({
      message: 'Complaint assigned and resources allocated successfully',
      complaint,
      allocation: allocationRecord
    });
  } catch (error) {
    console.error('Error in /api/complaints/:id/allocate:', error);
    try { await t.rollback(); } catch(e){/* ignore rollback errors */ }
    res.status(500).json({ message: 'Server error during allocation', error: error.message });
  }
});

// Allocation routes (fallback/simple create)
app.post('/api/allocations', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allocation = await Allocation.create(req.body);

    res.status(201).json({
      message: 'Resource allocated successfully!',
      allocation
    });

  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/allocations/request/:requestId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET); // if token invalid, catch below

    const allocations = await Allocation.findAll({
      where: { resourceRequestId: req.params.requestId },
      include: [
        {
          model: Resource,
          attributes: ['name', 'type']
        }
      ]
    });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all complaints (admin/clerk/supervisor/mayor)
app.get('/api/complaints', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!['clerk', 'supervisor', 'administrator', 'mayor'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaints = await Complaint.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json(complaints);
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update complaint (PUT) - allowed to clerk & supervisor in your original code
app.put('/api/complaints/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!['clerk', 'supervisor'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const complaintId = req.params.id;
    const updates = req.body;
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    await complaint.update(updates);
    res.json({ message: 'Complaint updated successfully!', complaint });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resource management (for administrator)
app.get('/api/resources', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'administrator') return res.status(403).json({ message: 'Access denied' });

    const resources = await Resource.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'administrator') return res.status(403).json({ message: 'Access denied' });

    const resource = await Resource.create(req.body);
    res.status(201).json({ message: 'Resource added successfully!', resource });
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Statistics (for mayor)
app.get('/api/statistics', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'mayor') return res.status(403).json({ message: 'Access denied' });

    const totalComplaints = await Complaint.count();
    const pendingComplaints = await Complaint.count({ where: { status: 'pending' } });
    const inProgressComplaints = await Complaint.count({ where: { status: 'in_progress' } });
    const completedComplaints = await Complaint.count({ where: { status: 'completed' } });
    const totalResources = await Resource.count();
    const availableResources = await Resource.count({ where: { available: true } });

    const complaintsBySeverity = {
      low: await Complaint.count({ where: { severity: 'low' } }),
      medium: await Complaint.count({ where: { severity: 'medium' } }),
      high: await Complaint.count({ where: { severity: 'high' } }),
      critical: await Complaint.count({ where: { severity: 'critical' } })
    };

    const stats = {
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      completedComplaints,
      totalResources,
      availableResources,
      complaintsBySeverity
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start server
const PORT = 5001;
// -----------------------------
// Admin: PATCH /api/resources/:id
// Update quantity and/or availability for a resource
// body example: { quantity: 5 } or { available: false } or { quantity: 3, available: true }
// -----------------------------
app.patch('/api/resources/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    // keep admin-only like your other resource routes
    if (decoded.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const resourceId = req.params.id;
    const updates = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'quantity')) {
      // ensure integer and non-negative
      const q = parseInt(req.body.quantity, 10);
      if (Number.isNaN(q) || q < 0) return res.status(400).json({ message: 'Invalid quantity' });
      updates.quantity = q;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'available')) {
      updates.available = !!req.body.available;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    const resource = await Resource.findByPk(resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    await resource.update(updates);

    res.json({ message: 'Resource updated successfully', resource });
  } catch (err) {
    console.error('PATCH /api/resources/:id error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Get workers (users with role 'worker')
app.get('/api/users/workers', async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workers', error: error.message });
  }
});

// Notifications endpoints
app.get('/api/notifications/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

app.patch('/api/notifications/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
});

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🚀 ROAD REPAIR BACKEND SERVER STARTED');
      console.log('='.repeat(50));
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`💾 Database: SQLite (roadrepair.sqlite)`);
      console.log('👤 Demo users available for all roles');
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
