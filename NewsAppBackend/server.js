const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Add root route handler
app.get("/", (req, res) => {
  res.json({ 
    status: "Server is running",
    endpoints: {
      "POST /api/store-summary": "Store a summarized category",
      "GET /api/last-category/:email": "Get last summarized category for a user",
      "POST /api/summarize-news": "Summarize news articles (on port 5002)"
    }
  });
});

// ✅ MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/newsapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Schema and Model
const UserSummary = mongoose.model("UserSummary", new mongoose.Schema({
  email: { type: String, required: true },
  category: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}));
const userRoutes = require("./routes/summaryRoutes");
app.use("/api", userRoutes);


// ✅ Store Summarized Category
app.post("/api/store-summary", async (req, res) => {
  try {
    const { email, category } = req.body;
    await UserSummary.create({ email, category });
    res.json({ success: true, message: "Category stored successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error storing category", error });
  }
});

// ✅ Retrieve Last Summarized Category
app.get("/api/last-category/:email", async (req, res) => {
  try {
      const { email } = req.params;
      console.log(`🔍 Fetching last summarized category for: ${email}`);

      const lastSummary = await UserSummary.findOne({ email }).sort({ timestamp: -1 });

      if (!lastSummary) {
          console.log("⚠️ No category found for email:", email);
          return res.status(404).json({ 
              success: false, 
              message: "No category found for this user" 
          });
      }

      console.log("✅ Found last category:", lastSummary.category);
      res.json({ category: lastSummary.category });
  } catch (error) {
      console.error("❌ Error fetching category:", error);
      res.status(500).json({ success: false, message: "Error fetching category", error });
  }
});


// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
