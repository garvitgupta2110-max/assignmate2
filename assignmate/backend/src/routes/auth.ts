import { Router } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcryptjs";

const router = Router();

// Google OAuth callback
router.post("/google", async (req, res) => {
  try {
    const { email, name, profileImage } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
        profileImage,
      });
      await user.save();
    }

    const token = generateToken(user._id.toString(), user.role);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Error with Google authentication" });
  }
});

// Email/Password login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id.toString(), user.role);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: "Error during login" });
  }
});

// Email/Password signup
router.post("/signup", async (req, res) => {
  try {
    const { email, name, password, college, branch, semester, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      name,
      password: hashedPassword,
      college,
      branch,
      semester,
      role: role || "student",
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.role);
    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: "Error during signup" });
  }
});

// OTP verification (placeholder)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // TODO: Implement OTP verification logic
    // For now, just verify the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateToken(user._id.toString(), user.role);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

export default router;
