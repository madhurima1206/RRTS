// routes/complaintRoutes.js
const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

// POST /api/complaints
router.post("/", async (req, res) => {
  try {
    const { name, phone, address, area, description, submittedBy } = req.body;

    if (!name || !phone || !address || !area || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newComplaint = new Complaint({
      name,
      phone,
      address,
      location: { area },
      description,
      status: "pending",
      submittedBy,
      createdAt: new Date(),
    });

    await newComplaint.save();
    res.status(201).json({ message: "Complaint created successfully" });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ message: "Server error while creating complaint" });
  }
});

// GET /api/complaints (grouped by area)
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find();
    const grouped = complaints.reduce((acc, complaint) => {
      const area = complaint.location?.area || "Unknown Area";
      if (!acc[area]) acc[area] = [];
      acc[area].push(complaint);
      return acc;
    }, {});
    res.json(grouped);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Error fetching complaints" });
  }
});

module.exports = router;
