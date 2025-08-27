import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
	_id: String,
	data: Object,
	collaborators: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
			role: {
				type: String,
				enum: ["owner", "editor", "viewer"],
				required: true,
			},
		},
	],
	publicToken: { type: String, unique: true, sparse: true },
	publicAccess: { type: String, enum: ["viewer", "editor"], default: "viewer" },
});

export default mongoose.model("Document", DocumentSchema);
