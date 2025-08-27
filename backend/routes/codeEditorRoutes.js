import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import Document from "../models/Document.js";
import crypto from "crypto";

const router = express.Router();

// Middleware to check document permissions
async function checkPermission(req, res, next) {
	const { docId } = req.params;
	const userId = req.body.userId || req.query.userId;
	if (!docId || !userId) return res.status(400).json({ error: "Missing docId or userId" });
	const doc = await Document.findById(docId);
	if (!doc) return res.status(404).json({ error: "Document not found" });
	const collab = doc.collaborators.find(c => c.userId.toString() === userId);
	if (!collab) return res.status(403).json({ error: "No access to this document" });
	req.userRole = collab.role;
	next();
}

// Add collaborator
router.post("/documents/:docId/collaborators", async (req, res) => {
	const { docId } = req.params;
	const { userId, role } = req.body;
	if (!userId || !role) return res.status(400).json({ error: "Missing userId or role" });
	const doc = await Document.findById(docId);
	if (!doc) return res.status(404).json({ error: "Document not found" });
	if (doc.collaborators.find(c => c.userId.toString() === userId)) {
		return res.status(400).json({ error: "User already a collaborator" });
	}
	doc.collaborators.push({ userId, role });
	await doc.save();
	res.json({ message: "Collaborator added", collaborators: doc.collaborators });
});

// Remove collaborator
router.delete("/documents/:docId/collaborators/:userId", async (req, res) => {
	const { docId, userId } = req.params;
	const doc = await Document.findById(docId);
	if (!doc) return res.status(404).json({ error: "Document not found" });
	doc.collaborators = doc.collaborators.filter(c => c.userId.toString() !== userId);
	await doc.save();
	res.json({ message: "Collaborator removed", collaborators: doc.collaborators });
});

// Change collaborator role
router.patch("/documents/:docId/collaborators/:userId", async (req, res) => {
	const { docId, userId } = req.params;
	const { role } = req.body;
	if (!role) return res.status(400).json({ error: "Missing role" });
	const doc = await Document.findById(docId);
	if (!doc) return res.status(404).json({ error: "Document not found" });
	const collab = doc.collaborators.find(c => c.userId.toString() === userId);
	if (!collab) return res.status(404).json({ error: "Collaborator not found" });
	collab.role = role;
	await doc.save();
	res.json({ message: "Role updated", collaborators: doc.collaborators });
});

// Get collaborators
router.get("/documents/:docId/collaborators", async (req, res) => {
	const { docId } = req.params;
	const doc = await Document.findById(docId).populate("collaborators.userId", "username email");
	if (!doc) return res.status(404).json({ error: "Document not found" });
	res.json({ collaborators: doc.collaborators });
});

// Generate or enable a public link for a document (auto-create if missing)
router.post("/documents/:docId/public-link", async (req, res) => {
	const { docId } = req.params;
	let doc = await Document.findById(docId);
	if (!doc) {
		doc = await Document.create({ _id: docId, data: "", collaborators: [] });
	}
	if (!doc.publicToken) {
		doc.publicToken = crypto.randomBytes(16).toString("hex");
		await doc.save();
	}
	res.json({ publicLink: `/docs/${docId}/public/${doc.publicToken}` });
});

// Disable public link
router.delete("/documents/:docId/public-link", async (req, res) => {
	const { docId } = req.params;
	const doc = await Document.findById(docId);
	if (!doc) return res.status(404).json({ error: "Document not found" });
	doc.publicToken = undefined;
	await doc.save();
	res.json({ message: "Public link disabled" });
});

// Set default public access role
router.patch("/documents/:docId/public-access", async (req, res) => {
	const { docId } = req.params;
	const { role } = req.body;
	if (!['viewer', 'editor'].includes(role)) return res.status(400).json({ error: "Invalid role" });
	const doc = await Document.findById(docId);
	if (!doc) return res.status(404).json({ error: "Document not found" });
	doc.publicAccess = role;
	await doc.save();
	res.json({ message: "Public access role updated", publicAccess: doc.publicAccess });
});

// Access document by public link
router.get("/documents/public/:publicToken", async (req, res) => {
	const { publicToken } = req.params;
	const doc = await Document.findOne({ publicToken });
	if (!doc) return res.status(404).json({ error: "Document not found" });
	res.json({ data: doc.data, role: doc.publicAccess });
});

// Get document metadata (for public link panel)
router.get("/documents/:docId", async (req, res) => {
  const { docId } = req.params;
  const doc = await Document.findById(docId);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json({
    publicAccess: doc.publicAccess,
    publicToken: doc.publicToken,
    // add more fields if needed
  });
});

router.post("/code-editor", (req, res) => {
	const { roomId, code } = req.body;
	io.to(roomId).emit("code-changed", code);
	res.status(200).send("OK");
});

export default router;