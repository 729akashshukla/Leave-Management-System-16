import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    leaveType: { type: String, enum: ["Casual", "Sick"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    // Number of working (Mon-Fri) days this request will consume. Computed at
    // creation time so balance checks and deductions are consistent.
    workingDays: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveRequest", leaveRequestSchema);
