import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import Document from "./models/Document.js";
import User from "./models/User.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
import authRoutes from "./routes/authRoutes.js";
import ChatMessage from "./models/ChatMessage.js";
import codeEditorRoutes from "./routes/codeEditorRoutes.js";
import { send } from "process";
app.use("/api/auth", authRoutes);
app.use("/", codeEditorRoutes);

// MongoDB Connection
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB Connected"))
	.catch((err) => console.log(err));

// 🔌 Socket.IO Setup
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
	},
});

const typingUsers = new Map(); // roomId -> Map(username -> timeout)
const cursorPositions = new Map(); // roomId -> Map(username -> position)
const onlineUsers = new Map(); // roomId => Set of { id, username }

const documents = {}; // In-memory store

const getUserRoleForDoc = (doc, userId) => {
	if (!doc || !doc.collaborators) return null;
	const collab = doc.collaborators.find((c) => c.userId.toString() === userId);
	return collab ? collab.role : null;
};

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	socket.on("get-document", async ({ docId, userId }) => {
		if (!docId) return;
		const document = await findOrCreateDocument(docId, userId);
		socket.emit("load-document", document.data || "");
	});

	socket.on("join_room", async ({ roomId, username }) => {
		socket.join(roomId);
		socket.data = { ...(socket.data || {}), roomId, username };
		console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

		// Debug: Log all rooms this socket is now in
		console.log(
			`Socket ${socket.id} is now in rooms:`,
			Array.from(socket.rooms)
		);

		// ✅ Track online users without duplicates
		if (!onlineUsers.has(roomId)) {
			onlineUsers.set(roomId, new Set());
		}
		const roomSet = onlineUsers.get(roomId);

		// Remove any previous entry for the same username
		for (const userStr of roomSet) {
			const user = JSON.parse(userStr);
			if (user.username === username) {
				roomSet.delete(userStr);
			}
		}

		// Add the current connection
		roomSet.add(JSON.stringify({ id: socket.id, username }));

		// ✅ Emit updated list to room
		const usersArray = Array.from(roomSet).map((u) => JSON.parse(u));
		io.to(roomId).emit("online_users", usersArray);
		console.log(`Emitted online_users to room ${roomId}:`, usersArray);

		// ✅ Send previous chat messages
		const previousMessages = await ChatMessage.find({ roomId }).sort({
			timestamp: 1,
		});
		socket.emit("previous_messages", previousMessages);
	});

	socket.on("leave_room", ({ roomId, username }) => {
		socket.leave(roomId);

		// Remove from onlineUsers[roomId]
		if (onlineUsers[roomId]) {
			onlineUsers[roomId] = onlineUsers[roomId].filter(
				(user) => user.userId !== socket.id
			);
		}

		// Broadcast updated list to the room
		io.to(roomId).emit("online_users", onlineUsers[roomId] || []);
	});

	socket.on("draw_line", ({ roomId, x0, y0, x1, y1, color }) => {
		socket.to(roomId).emit("draw_line", { x0, y0, x1, y1, color });
	});

	socket.on("drawing_cursor", ({ roomId, x, y, userId, username }) => {
		if (!roomId || x == null || y == null || !userId || !username) return;
		socket
			.to(roomId)
			.emit("drawing_cursor", { x, y, userId: socket.id, username });
	});

	socket.on("send_message", async ({ roomId, message, sender }) => {
		const roomTypingUsers = typingUsers.get(roomId);
		if (roomTypingUsers && roomTypingUsers.has(sender)) {
			clearTimeout(roomTypingUsers.get(sender));
			roomTypingUsers.delete(sender);
			socket.to(roomId).emit("user-stopped-typing", sender);
		}
		await ChatMessage.create({ roomId, message, sender });
		io.to(roomId).emit("receive_message", {
			message,
			sender,
			senderId: socket.id,
		});
	});

	socket.on("code-changed", ({ roomId, code }) => {
		if (!roomId || typeof code !== "string") return;
		socket.to(roomId).emit("code-changed", code);
	});

	socket.on("user-typing", ({ roomId, username }) => {
		if (!roomId || !username) return;
		if (!typingUsers.has(roomId)) {
			typingUsers.set(roomId, new Map());
		}
		const roomTypingUsers = typingUsers.get(roomId);
		if (roomTypingUsers.has(username)) {
			clearTimeout(roomTypingUsers.get(username));
		}
		socket.to(roomId).emit("user-typing", username);
		const timeoutId = setTimeout(() => {
			roomTypingUsers.delete(username);
			socket.to(roomId).emit("user-stopped-typing", username);
		}, 2000);
		roomTypingUsers.set(username, timeoutId);
	});

	socket.on("user-stopped-typing", ({ roomId, username }) => {
		if (!roomId || !username) return;
		const roomTypingUsers = typingUsers.get(roomId);
		if (roomTypingUsers && roomTypingUsers.has(username)) {
			clearTimeout(roomTypingUsers.get(username));
			roomTypingUsers.delete(username);
			socket.to(roomId).emit("user-stopped-typing", username);
		}
	});

	socket.on("cursor-position", ({ roomId, userId, username, position }) => {
		if (!roomId || !userId || !username || !position) return;

		// Broadcast to everyone else in the same room
		socket.to(roomId).emit("cursor-position", {
			userId,
			username,
			position,
		});
	});

	socket.on("send-changes", ({ roomId, delta }) => {
		socket.broadcast.to(roomId).emit("receive-changes", { delta });
	});

	socket.on("save-document", async ({ roomId, data }) => {
		if (!roomId) return;
		await Document.findByIdAndUpdate(
			roomId,
			{ data },
			{ upsert: true, new: true }
		);
	});

	socket.on(
		"cursor-position-docs",
		({ roomId, socketId, username, range, isTyping }) => {
			console.log("Server received cursor position:", {
				roomId,
				socketId,
				username,
				range,
				isTyping,
			});

			// Broadcast cursor position and typing status to all other users in the room
			socket.to(roomId).emit("cursor-position-docs", {
				socketId,
				username,
				range,
				isTyping: isTyping || false, // Default to false if not provided
			});
		}
	);

	socket.on("clear_board", ({ roomId }) => {
		socket.to(roomId).emit("clear_board");
	});

	socket.on("undo_action", ({ roomId, imageData }) => {
		socket.to(roomId).emit("undo_action", { imageData });
	});

	socket.on("disconnect", () => {
		const { roomId, username } = socket.data || {};

		console.log("User disconnecting:", {
			socketId: socket.id,
			roomId,
			username,
		});

		if (roomId) {
			// Notify other users to remove this user's cursor
			socket.to(roomId).emit("user-cursor-removed", socket.id);
		}
		console.log("User disconnected:", socket.id);

		// ✅ Remove user from onlineUsers map
		if (roomId && onlineUsers.has(roomId)) {
			const roomSet = onlineUsers.get(roomId);
			for (const userStr of roomSet) {
				const user = JSON.parse(userStr);
				if (user.id === socket.id || user.username === username) {
					roomSet.delete(userStr);
				}
			}
			const usersArray = [...roomSet].map((u) => JSON.parse(u));
			io.to(roomId).emit("online_users", usersArray);
		}

		// ✅ Typing user cleanup
		if (roomId && username) {
			const roomTypingUsers = typingUsers.get(roomId);
			if (roomTypingUsers && roomTypingUsers.has(username)) {
				clearTimeout(roomTypingUsers.get(username));
				roomTypingUsers.delete(username);
			}
			io.to(roomId).emit("user-left", username);
		}
	});
});

const findOrCreateDocument = async (id, userId) => {
	if (!id) return;
	let doc = await Document.findById(id);
	if (!doc) {
		doc = await Document.create({
			_id: id,
			data: "",
			collaborators: userId ? [{ userId, role: "owner" }] : [],
		});
	}
	return doc;
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
