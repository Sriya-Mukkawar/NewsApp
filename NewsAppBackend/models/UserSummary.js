const mongoose = require("mongoose");

const userSummarySchema = new mongoose.Schema({
  email: { type: String, required: true },
  category: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.models.UserSummary || mongoose.model("UserSummary", userSummarySchema);
