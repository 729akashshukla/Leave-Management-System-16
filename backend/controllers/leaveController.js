import mongoose from "mongoose";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import { countWorkingDays, rangesOverlap, parseDateOnly } from "../utils/dateUtils.js";

// POST /api/leave/apply  (employee)
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["Casual", "Sick"].includes(leaveType)) {
      return res.status(400).json({ message: "leaveType must be 'Casual' or 'Sick'" });
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid date(s) supplied" });
    }
    if (start > end) {
      return res.status(400).json({ message: "startDate cannot be after endDate" });
    }

    // Edge case: overlapping leave requests.
    // Block a new request if it overlaps an existing Pending or Approved
    // request for the SAME employee. Rejected requests never block.
    const existing = await LeaveRequest.find({
      employee: req.user.id,
      status: { $in: ["Pending", "Approved"] },
    });
    const overlap = existing.find((r) => rangesOverlap(start, end, r.startDate, r.endDate));
    if (overlap) {
      return res.status(409).json({
        message: `This date range overlaps with an existing ${overlap.status.toLowerCase()} request (${overlap.startDate.toDateString()} - ${overlap.endDate.toDateString()})`,
      });
    }

    const workingDays = countWorkingDays(start, end);

    // Edge case: insufficient balance.
    // Checked against CURRENT balance at application time so the employee gets
    // immediate feedback, and re-checked again at approval time below.
    const user = await User.findById(req.user.id);
    if (workingDays > user.leaveBalance[leaveType]) {
      return res.status(400).json({
        message: `Insufficient ${leaveType} leave balance. Requested ${workingDays} working day(s), available ${user.leaveBalance[leaveType]}.`,
      });
    }

    const request = await LeaveRequest.create({
      employee: req.user.id,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      workingDays,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: "Failed to apply for leave", error: err.message });
  }
};

// GET /api/leave/my-requests (employee)
export const myRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ employee: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
};

// GET /api/leave/balance (employee)
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("leaveBalance name email");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch balance", error: err.message });
  }
};

// GET /api/leave/pending (manager)
export const pendingRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ status: "Pending" })
      .populate("employee", "name email leaveBalance")
      .sort({ createdAt: 1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending requests", error: err.message });
  }
};

// GET /api/leave/all (manager) - full history, useful for context
export const allRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({})
      .populate("employee", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
};

// PATCH /api/leave/:id/approve (manager)
export const approveRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const request = await LeaveRequest.findById(req.params.id).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}` });
    }

    const employee = await User.findById(request.employee).session(session);

    // Re-check balance at approval time in case it changed since application
    // (e.g. another request for the same employee was approved in between).
    if (request.workingDays > employee.leaveBalance[request.leaveType]) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Cannot approve: employee's current ${request.leaveType} balance (${employee.leaveBalance[request.leaveType]}) is less than the requested ${request.workingDays} day(s).`,
      });
    }

    employee.leaveBalance[request.leaveType] -= request.workingDays;
    await employee.save({ session });

    request.status = "Approved";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save({ session });

    await session.commitTransaction();
    res.json({ request, updatedBalance: employee.leaveBalance });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: "Failed to approve request", error: err.message });
  } finally {
    session.endSession();
  }
};

// PATCH /api/leave/:id/reject (manager)
export const rejectRequest = async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Pending") {
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}` });
    }

    request.status = "Rejected";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request", error: err.message });
  }
};
