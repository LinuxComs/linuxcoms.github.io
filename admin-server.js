import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "src", "data.json");

// Read data
app.get("/api/data", (req, res) => {
  const data = fs.readFileSync(DATA_FILE, "utf8");
  res.json(JSON.parse(data));
});

// Save data
app.post("/api/data", (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: "Data saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Admin API Server running on http://localhost:${PORT}`);
});
