import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

const router = express.Router();

// Register route
router.post("/register", async (req, res) => {
	try {
		const { username, email, password } = req.body;

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await User.create({
			username,
			email,
			password: hashedPassword,
		});
		res.status(201).json("User created successfully");
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Login
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ error: "Invalid credentials" });
		}
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
		res.json({ token, user: { id: user._id, username: user.username } });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get user by email (for collaborator invite)
router.get("/user-by-email", async (req, res) => {
	const { email } = req.query;
	if (!email) return res.status(400).json({ error: "Email is required" });
	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ error: "User not found" });
	res.json({ id: user._id, email: user.email, username: user.username });
});

export default router;
