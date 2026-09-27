import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["employee", "manager"], required: true },
    leaveBalance: {
      Casual: { type: Number, default: 12 },
      Sick: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
