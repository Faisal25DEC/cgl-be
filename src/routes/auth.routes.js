// Changed require → import (external module)
import express from "express";

// Changed require → import (local file)
// Added .js extension (mandatory in ESM)
// Destructuring stays the same
import { register, login, getProfile, updateProfile, deleteUser, forgotPassword, confirmOtp, resetPassword } from "../controllers/auth.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile/update", authMiddleware, updateProfile);
router.delete("/profile/delete", authMiddleware, deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/confirm-otp", confirmOtp);
router.post("/reset-password", resetPassword);

// Changed module.exports → export default
export default router;
