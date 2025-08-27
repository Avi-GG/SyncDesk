import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Whiteboard from "./Whiteboard";
import { useSocket } from "../context/SocketContext";

const ChatRoom = () => {
	const { roomId } = useParams();
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState([]);
	const username = localStorage.getItem("username") || "Guest";
	const { socket, onlineUsers, typingUser } = useSocket();

	// Refs to manage typing state
	const typingTimeoutRef = useRef(null);
	const isTypingRef = useRef(false);

	// store consistent colors for this session
	const [userColors, setUserColors] = useState({});

	const getUniqueColor = (existingColors) => {
		let color;
		let attempt = 0;
		do {
			const hue = Math.floor(Math.random() * 360);
			color = `hsl(${hue}, 90%, 50%)`;
			attempt++;
		} while (Object.values(existingColors).includes(color) && attempt < 50);
		return color;
	};

	useEffect(() => {
		setUserColors((prev) => {
			const updated = { ...prev };
			onlineUsers.forEach((user) => {
				if (!updated[user.id]) {
					updated[user.id] = getUniqueColor(updated);
				}
			});
			return updated;
		});
	}, [onlineUsers]);

	useEffect(() => {
		if (!socket) return;
		console.log("Joining room", roomId);
		socket.emit("join_room", roomId);

		socket.on("previous_messages", (oldMessages) => {
			console.log("📜 Old messages:", oldMessages);
			setMessages(oldMessages);
		});

		socket.on("receive_message", (data) => {
			setMessages((prev) => [...prev, data]);
		});

		// Cleanup
		return () => {
			socket.emit("leave_room", { roomId, username });
			socket.off("previous_messages");
			socket.off("receive_message");
			// Clear typing timeout on cleanup
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, [socket, roomId]);

	const sendMessage = () => {
		if (message.trim() && socket) {
			// Stop typing indicator immediately when sending message
			stopTyping();

			socket.emit("send_message", {
				roomId,
				message,
				sender: username,
			});
			setMessage("");
		}
	};

	const startTyping = () => {
		if (!socket || isTypingRef.current) return;

		isTypingRef.current = true;
		socket.emit("user-typing", { roomId, username });
		console.log("Started typing");
	};

	const stopTyping = () => {
		if (!socket || !isTypingRef.current) return;

		isTypingRef.current = false;
		socket.emit("user-stopped-typing", { roomId, username });
		console.log("Stopped typing");

		// Clear any existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
			typingTimeoutRef.current = null;
		}
	};

	const handleInputChange = (e) => {
		setMessage(e.target.value);

		// Start typing if not already typing
		if (!isTypingRef.current) {
			startTyping();
		}

		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		// Set new timeout to stop typing after 1 second of inactivity
		typingTimeoutRef.current = setTimeout(() => {
			stopTyping();
		}, 1000); // Much shorter delay - 1 second
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			sendMessage();
		}
	};

	// Stop typing when input loses focus
	const handleInputBlur = () => {
		stopTyping();
	};

	return (
		<div className="w-full">
			<div className="text-white">
				<h4>Online Users:</h4>
				<div className="m-3">
					{onlineUsers?.map((user) => (
						<span
							key={user.id}
							style={{
								backgroundColor: "rgba(255,255,255,0.1)",
								display: "inline-flex",
								alignItems: "center",
								gap: "6px",
								padding: "4px 8px",
								borderRadius: "999px",
							}}
							className="py-1 px-2 mx-1 rounded-[999px]"
							title={user.id}
						>
							<span
								style={{
									width: "10px",
									height: "10px",
									borderRadius: "50%",
									backgroundColor: userColors[user.id] || "gray",
								}}
							></span>
							{user.username || "User"}
						</span>
					))}
				</div>
			</div>

			<div className="flex gap-4 w-full">
				<div className="w-8.5/12">
					<Whiteboard roomId={roomId} userColors={userColors} />
				</div>
				<div className="w-3.5/12">
					<div className="border w-full h-96 overflow-y-auto p-2 mb-4 rounded-lg bg-[#1c1c1c] text-white">
						{messages.map((msg, i) => (
							<div key={i} className="mb-1">
								<strong style={{ color: userColors[msg.senderId] || "white" }}>
									{msg.sender}:
								</strong>{" "}
								{msg.message}
							</div>
						))}
					</div>
					<p className="text-sm text-gray-400 h-5">
						{typingUser &&
							typingUser !== username &&
							`${typingUser} is typing...`}
					</p>
					<div className="flex gap-2">
						<input
							type="text"
							value={message}
							className="flex-grow border p-2 bg-[#1c1c1c] text-white"
							placeholder="Type message..."
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							onBlur={handleInputBlur}
						/>
						<button
							className="!bg-green-700 text-white px-2 py-1 rounded"
							onClick={sendMessage}
						>
							Send
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChatRoom;
