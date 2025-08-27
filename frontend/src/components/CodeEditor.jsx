import { useEffect, useRef, useState } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import Output from "./Output";
import { CODE_SNIPPETS } from "../helpers/constants";
import { useSocket } from "../context/SocketContext";

const COLORS = ["#FF5733", "#33C1FF", "#9B59B6", "#2ECC71", "#F1C40F"];

const CodeEditor = ({ roomId = "default-room", username }) => {
	const { socket, onlineUsers } = useSocket();
	const editorRef = useRef(null);

	// Initialize state from sessionStorage if available
	const [value, setValue] = useState(() => {
		const savedCode = sessionStorage.getItem(`code_${roomId}`);
		return savedCode || "";
	});

	const [language, setLanguage] = useState(() => {
		const savedLanguage = sessionStorage.getItem(`language_${roomId}`);
		return savedLanguage || "javascript";
	});

	const [userCursors, setUserCursors] = useState({});
	const storedUsername = localStorage.getItem("username");
	const [editorUsername, setEditorUsername] = useState(
		username || storedUsername || "User"
	);

	const debounceRef = useRef(null);
	const userColorMap = useRef({});

	// Save to sessionStorage whenever value or language changes
	useEffect(() => {
		if (value) {
			sessionStorage.setItem(`code_${roomId}`, value);
		}
	}, [value, roomId]);

	useEffect(() => {
		sessionStorage.setItem(`language_${roomId}`, language);
	}, [language, roomId]);

	// Update editorUsername if prop changes
	useEffect(() => {
		if (username) {
			setEditorUsername(username);
		} else {
			const stored = localStorage.getItem("username");
			if (stored) setEditorUsername(stored);
		}
	}, [username]);

	const assignColor = (id) => {
		if (!id) return COLORS[0];
		if (!userColorMap.current[id]) {
			const used = new Set(Object.values(userColorMap.current));
			const firstFree = COLORS.find((c) => !used.has(c));
			userColorMap.current[id] =
				firstFree ??
				COLORS[Object.keys(userColorMap.current).length % COLORS.length];
		}
		return userColorMap.current[id];
	};

	// Socket listeners
	useEffect(() => {
		if (!socket || !editorUsername) return;

		socket.emit("join_room", { roomId, username: editorUsername });

		const onCodeChanged = (newCode) => {
			if (editorRef.current && editorRef.current.getValue() !== newCode) {
				const pos = editorRef.current.getPosition();
				editorRef.current.setValue(newCode);
				if (pos) editorRef.current.setPosition(pos);
			}
		};

		const onCursorPosition = ({
			userId,
			username: remoteUsername,
			position,
		}) => {
			if (!position || !position.lineNumber || !position.column) return;
			setUserCursors((prev) => ({
				...prev,
				[userId]: {
					position,
					username: remoteUsername,
					color: assignColor(userId),
				},
			}));
		};

		const onUserLeft = (leftId) => {
			setUserCursors((prev) => {
				const updated = { ...prev };
				delete updated[leftId];
				return updated;
			});
			const styleElement = document.querySelector(
				`style[data-user="remote-cursor-${String(leftId).replace(
					/[^a-zA-Z0-9]/g,
					"_"
				)}"]`
			);
			if (styleElement) styleElement.remove();
			delete userColorMap.current[leftId];
		};

		socket.off("code-changed", onCodeChanged);
		socket.off("cursor-position", onCursorPosition);
		socket.off("user-left", onUserLeft);

		socket.on("code-changed", onCodeChanged);
		socket.on("cursor-position", onCursorPosition);
		socket.on("user-left", onUserLeft);

		return () => {
			socket.emit("leave_room", { roomId, username: editorUsername });
			socket.off("code-changed", onCodeChanged);
			socket.off("cursor-position", onCursorPosition);
			socket.off("user-left", onUserLeft);
		};
	}, [socket, roomId, editorUsername]);

	const injectCSSClass = (className, color, label, position) => {
		const existingStyle = document.querySelector(
			`style[data-user="${className}"]`
		);
		if (existingStyle) existingStyle.remove();

		const isNearTop = position && position.lineNumber <= 3;
		const topOffset = isNearTop ? "20px" : "-25px";
		const isAtStart = position && position.column <= 5;
		const leftOffset = isAtStart ? "0" : "-50%";
		const leftPosition = isAtStart ? "10px" : "0";

		const style = document.createElement("style");
		style.setAttribute("data-user", className);
		style.innerHTML = `
      .${className}::after {
        content: "${label}";
        position: absolute;
        background: ${color};
        color: white;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        top: ${topOffset};
        left: ${leftPosition};
        transform: translateX(${leftOffset});
        white-space: nowrap;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .${className} {
        border-left: 2px solid ${color};
        margin-left: -1px;
        box-sizing: border-box;
        width: 2px !important;
        position: relative;
        overflow: visible;
      }
    `;
		document.head.appendChild(style);
	};

	const handleEditorMount = (editor) => {
		editorRef.current = editor;
		editor.focus();

		editor.onDidChangeCursorPosition((e) => {
			const position = e.position;
			if (!socket || !editorUsername) return;
			socket.emit("cursor-position", {
				roomId,
				userId: socket.id,
				username: editorUsername,
				position,
			});
		});
	};

	// Render remote cursors
	useEffect(() => {
		if (!editorRef.current || !window.monaco) return;
		const editor = editorRef.current;

		const decorations = Object.entries(userCursors)
			.filter(([id]) => id !== (socket?.id || ""))
			.map(([userId, { position, color, username: remoteUsername }]) => {
				if (!position || !position.lineNumber || !position.column) return null;

				const className = `remote-cursor-${String(userId).replace(
					/[^a-zA-Z0-9]/g,
					"_"
				)}`;
				injectCSSClass(className, color, remoteUsername, position);

				return {
					range: new window.monaco.Range(
						position.lineNumber,
						position.column,
						position.lineNumber,
						position.column
					),
					options: {
						className,
						afterContentClassName: className,
						inlineClassName: className,
						stickiness:
							window.monaco.editor.TrackedRangeStickiness
								.NeverGrowsWhenTypingAtEdges,
					},
				};
			})
			.filter(Boolean);

		const ids = editor.deltaDecorations([], decorations);
		return () => {
			try {
				editor.deltaDecorations(ids, []);
			} catch {
				/* editor disposed */
			}
		};
	}, [userCursors, socket?.id]);

	const handleLanguageChange = (lang) => {
		setLanguage(lang);
		// Only set to default snippet if there's no saved code
		const savedCode = sessionStorage.getItem(`code_${roomId}`);
		if (!savedCode) {
			setValue(CODE_SNIPPETS[lang] || "");
		}
	};

	const handleCodeChange = (newValue) => {
		setValue(newValue);
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			if (!socket) return;
			socket.emit("code-changed", { roomId, code: newValue });
		}, 300);
	};

	return (
		<div>
			{/* Online Users */}
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
									backgroundColor: assignColor(user.id),
								}}
							></span>
							{user.username || "User"}
						</span>
					))}
				</div>
			</div>

			{/* Editor & Output */}
			<Box>
				<HStack spacing={4}>
					<Box w="50%">
						<LanguageSelector
							language={language}
							onSelect={handleLanguageChange}
						/>
						<Editor
							height="75vh"
							language={language}
							theme="vs-dark"
							options={{ minimap: { enabled: false } }}
							defaultValue={value || CODE_SNIPPETS[language]}
							value={value}
							onMount={handleEditorMount}
							onChange={handleCodeChange}
						/>
					</Box>
					<Output editorRef={editorRef} language={language} />
				</HStack>
			</Box>
		</div>
	);
};

export default CodeEditor;
