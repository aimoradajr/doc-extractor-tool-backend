// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes";
import accuracyRoutes from "./routes/accuracyRoutes";
import { errorHandler } from "./middleware/errorHandler";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists at startup
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// CORS for frontend
app.use(cors());

// Body parsing
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "PDF Document Extraction Tool API",
    status: "OK",
    version: "1.0.0",
  });
});

// Routes
app.use("/api", uploadRoutes);
app.use("/api/accuracy", accuracyRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
