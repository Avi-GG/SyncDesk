// contexts/SocketContext.js
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
	reconnection: true,
	autoConnect: true,
});

const SocketContext = createContext();

export const SocketProvider = ({ username, roomId, children }) => {
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [typingUser, setTypingUser] = useState(null);
	const typingTimeoutRef = useRef(null);

	useEffect(() => {
		if (!roomId || !username) return;

		// Tell server we joined
		socket.emit("join_room", { roomId, username });

		// ✅ Remove previous listeners before adding new ones
		socket.off("online_users").on("online_users", (users) => {
			// Remove duplicates by socket.id
			const uniqueUsers = users.filter(
				(v, i, a) => a.findIndex((t) => t.id === v.id) === i
			);
			console.log("👥 Online users:", uniqueUsers);
			setOnlineUsers(uniqueUsers);
		});

		socket.off("user-typing").on("user-typing", (username) => {
			setTypingUser(username);
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			typingTimeoutRef.current = setTimeout(() => {
				setTypingUser(null);
			}, 2000);
		});

		socket.off("user-stopped-typing").on("user-stopped-typing", () => {
			setTypingUser(null);
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}
		});

		return () => {
			// Tell server we left
			socket.emit("leave_room", { roomId, username });
			socket.off("online_users").on("online_users", (users) => {
				const uniqueUsers = users.filter(
					(user, index, self) =>
						index === self.findIndex((u) => u.username === user.username)
				);
				setOnlineUsers(uniqueUsers);
			});

			// Properly remove the correct listeners
			socket.off("online_users");
			socket.off("user-typing");
			socket.off("user-stopped-typing");

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, [roomId, username]);

	const emitTyping = () => {
		socket.emit("user-typing", { roomId, username });
	};

	const emitStopTyping = () => {
		socket.emit("user-stopped-typing", { roomId, username });
	};

	return (
		<SocketContext.Provider
			value={{
				socket,
				onlineUsers,
				typingUser,
				emitTyping,
				emitStopTyping,
			}}
		>
			{children}
		</SocketContext.Provider>
	);
};

export const useSocket = () => useContext(SocketContext);
