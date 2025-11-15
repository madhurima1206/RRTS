// server/routes/complaints.js
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// Create complaint (Resident / Clerk)
router.post('/', async (req, res) => {
  try {
    const { title, description, problemType, severity, location, reporter } = req.body;
    if (!title || !reporter?.name || !reporter?.phone || !location?.city) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const complaint = new Complaint({
      title, description, problemType, severity,
      location,
      reporter
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get complaints, optional query filters: area, city, status
// e.g. GET /api/complaints?city=Hyderabad&area=West&status=pending
router.get('/', async (req, res) => {
  try {
    const { city, area, status } = req.query;
    const filter = {};
    if (city) filter['location.city'] = city;
    if (area) filter['location.area'] = area;
    if (status) filter.status = status;

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update status or assignment
router.put('/:id', async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const update = {};
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
