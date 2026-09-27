import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "ok", message: "Leave Management API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler (safety net)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

if (process.env.NODE_ENV !== "test") {
  connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
