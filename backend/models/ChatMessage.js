import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
	roomId: String,
	sender: String,
	message: String,
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

export default mongoose.model("ChatMessage", chatMessageSchema);
