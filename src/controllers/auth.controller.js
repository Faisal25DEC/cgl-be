// Changed require → import (local & external)
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";
import dotenv from "dotenv";

dotenv.config();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, country, phone, userType } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ firstName, lastName, email, password, country, phone, userType });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User profile fetched successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, country, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.country = country || user.country;
    user.phone = phone || user.phone;

    await user.save();

    res.json({ message: "User profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
    await user.save();

    // Send OTP Email
    const subject = "Password Reset OTP";
    const text = `Your OTP is: ${otp}. This OTP will expire in 10 minutes.`;
    const html = `
            <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                <div style="text-align: center; padding-bottom: 20px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                </div>
                <p style="font-size: 16px; color: #555;">Hello <strong>${user.firstName || user.name || "User"}</strong>,</p>
                <p style="font-size: 16px; color: #555;">You have requested to reset your password. Use the OTP below to proceed:</p>
                <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px; border: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 24px; font-weight: bold; color: #007bff; ">${otp}</p>
                </div>
                <p style="font-size: 16px; color: #555;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                <p style="font-size: 16px; color: #555;">For security reasons, do not share this OTP with anyone.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 14px; color: #777;">Need help? Contact our <a href="mailto:support@yourwebsite.com" style="color: #007bff; text-decoration: none;">Support Team</a></p>
                </div>
            </div>
        `;

    await sendEmail(user.email, subject, text, html);

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const confirmOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.resetOtp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.resetOtp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    user.markModified("password");
    user.resetOtp = null;
    user.otpExpiry = null;
    await user.save();

    const subject = "Password Reset Successful";
    const text = `Your password has been reset successfully.`;
    const html = `
            <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                <div style="text-align: center; padding-bottom: 20px;">
                    <h2 style="color: #333;">Password Reset Confirmation</h2>
                </div>
                <p style="font-size: 16px; color: #555;">Hello <strong>${user.firstName || "User"}</strong>,</p>
                <p style="font-size: 16px; color: #555;">Your password has been <strong>reset successfully</strong>. You can now log in with your new password.</p>
                <p style="font-size: 16px; color: #555;">If you did not initiate this change, please contact our support team immediately.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://yourwebsite.com/login" style="display: inline-block; padding: 12px 20px; font-size: 16px; font-weight: bold; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Login Now</a>
                </div>
                <p style="font-size: 14px; color: #777; margin-top: 20px; text-align: center;">
                    Need help? Contact our <a href="mailto:support@yourwebsite.com" style="color: #007bff; text-decoration: none;">Support Team</a>.
                </p>
            </div>
        `;

    await sendEmail(user.email, subject, text, html);

    res.json({ message: "Password reset successfully. Check your email for confirmation." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
