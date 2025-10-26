// Changed require → import
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Schema stays the same
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: Number, required: true },
    userType: {
      type: String,
      required: true,
      enum: ["BOOK_READER", "ADMIN", "SILVER", "GOLD", "BASIC"],
    },
    resetOtp: { type: String },
    otpExpiry: { type: Date },
  },
  { timestamps: true }
);

// Middleware remains same
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Changed module.exports → export default
const User = mongoose.model("User", userSchema);
export default User;
