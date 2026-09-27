import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.js";
import {
  applyLeave,
  myRequests,
  getBalance,
  pendingRequests,
  allRequests,
  approveRequest,
  rejectRequest,
} from "../controllers/leaveController.js";

const router = express.Router();

// Employee routes
router.post("/apply", verifyToken, requireRole("employee"), applyLeave);
router.get("/my-requests", verifyToken, requireRole("employee"), myRequests);
router.get("/balance", verifyToken, requireRole("employee"), getBalance);

// Manager routes
router.get("/pending", verifyToken, requireRole("manager"), pendingRequests);
router.get("/all", verifyToken, requireRole("manager"), allRequests);
router.patch("/:id/approve", verifyToken, requireRole("manager"), approveRequest);
router.patch("/:id/reject", verifyToken, requireRole("manager"), rejectRequest);

export default router;
