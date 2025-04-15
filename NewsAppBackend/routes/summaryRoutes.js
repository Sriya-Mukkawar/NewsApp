const express = require("express");
const router = express.Router();
const UserSummary = require("../models/UserSummary");

// Store Summarized Category
router.post("/store-summary", async (req, res) => {
  try {
    const { email, category } = req.body;
    await UserSummary.create({ email, category });
    res.json({ success: true, message: "Category stored successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error storing category", error });
  }
});

// Retrieve Last Summarized Category
router.get("/last-category/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const lastSummary = await UserSummary.findOne({ email }).sort({ timestamp: -1 });

    res.json({ category: lastSummary ? lastSummary.category : "general" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching category", error });
  }
});

module.exports = router;
