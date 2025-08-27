import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import mammoth from "mammoth";
import JSZip from "jszip";
import { useSocket } from "../context/SocketContext";

// NO MORE QUILL-CURSORS - we'll build our own

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
	[{ header: [1, 2, 3, 4, 5, 6, false] }],
	["bold", "italic", "underline"],
	[{ list: "ordered" }, { list: "bullet" }],
	["link", "image"],
	["clean"],
];

// Generate a color per user
const getUserColor = (username) => {
	const colors = [
		"#FF0000",
		"#00FF00",
		"#0000FF",
		"#FFA500",
		"#FF00FF",
		"#00FFFF",
		"#FFD700",
		"#8A2BE2",
	];
	let hash = 0;
	for (let i = 0; i < username?.length; i++) {
		hash = username?.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colors[Math.abs(hash) % colors?.length];
};

// Custom cursor overlay component with selection highlighting
const CursorOverlay = ({ cursors, quillRef }) => {
	const [positions, setPositions] = useState({});

	useEffect(() => {
		if (!quillRef.current) return;

		const updatePositions = () => {
			const newPositions = {};
			const quill = quillRef.current;

			Object.entries(cursors).forEach(([socketId, cursor]) => {
				try {
					const { index, length } = cursor.range;

					if (length > 0) {
						// Handle text selection
						const startBounds = quill.getBounds(index, 0);
						const endBounds = quill.getBounds(index + length, 0);

						if (startBounds && endBounds) {
							// Get all the bounds for multi-line selections
							const selectionBounds = [];

							// For single line selection
							if (startBounds.top === endBounds.top) {
								selectionBounds.push({
									left: startBounds.left,
									top: startBounds.top,
									width: endBounds.left - startBounds.left,
									height: startBounds.height,
								});
							} else {
								// Multi-line selection
								// First line (from start to end of line)
								const editorWidth =
									quill.container.querySelector(".ql-editor").offsetWidth;
								selectionBounds.push({
									left: startBounds.left,
									top: startBounds.top,
									width: editorWidth - startBounds.left - 20, // Account for padding
									height: startBounds.height,
								});

								// Middle lines (full width)
								let currentTop = startBounds.top + startBounds.height;
								while (currentTop < endBounds.top) {
									selectionBounds.push({
										left: 0,
										top: currentTop,
										width: editorWidth - 20,
										height: startBounds.height,
									});
									currentTop += startBounds.height;
								}

								// Last line (from start of line to end position)
								if (endBounds.left > 0) {
									selectionBounds.push({
										left: 0,
										top: endBounds.top,
										width: endBounds.left,
										height: endBounds.height,
									});
								}
							}

							newPositions[socketId] = {
								type: "selection",
								selectionBounds,
								cursorBounds: endBounds, // Show cursor at end of selection
								color: cursor.color,
								name: cursor.name,
								isTyping: cursor.isTyping,
							};
						}
					} else {
						// Handle cursor position only
						const bounds = quill.getBounds(index, 0);
						if (bounds) {
							newPositions[socketId] = {
								type: "cursor",
								cursorBounds: bounds,
								color: cursor.color,
								name: cursor.name,
								isTyping: cursor.isTyping,
							};
						}
					}
				} catch (err) {
					// Skip invalid ranges
					console.warn("Invalid range for cursor:", err);
				}
			});

			setPositions(newPositions);
		};

		// Update positions when cursors change
		updatePositions();

		// Also update on scroll/resize
		const container = quillRef.current.container;
		const handleUpdate = () => updatePositions();

		container.addEventListener("scroll", handleUpdate);
		window.addEventListener("resize", handleUpdate);

		return () => {
			container.removeEventListener("scroll", handleUpdate);
			window.removeEventListener("resize", handleUpdate);
		};
	}, [cursors, quillRef]);

	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				zIndex: 1000,
			}}
		>
			{Object.entries(positions).map(([socketId, pos]) => (
				<div key={socketId}>
					{/* Selection highlighting */}
					{pos.type === "selection" &&
						pos.selectionBounds?.map((bounds, index) => (
							<div
								key={`selection-${index}`}
								style={{
									position: "absolute",
									left: bounds.left + 10,
									top: bounds.top + 40,
									width: bounds.width,
									height: bounds.height,
									backgroundColor: pos.color,
									opacity: 0.3,
									borderRadius: "2px",
								}}
							/>
						))}

					{/* Cursor line */}
					{pos.cursorBounds && (
						<div
							style={{
								position: "absolute",
								left: pos.cursorBounds.left + 10,
								top: pos.cursorBounds.top + 40,
								width: 2,
								height: pos.cursorBounds.height,
								backgroundColor: pos.color,
								borderRadius: "1px",
								animation: pos.isTyping ? "pulse 1s infinite" : "none",
							}}
						/>
					)}

					{/* Cursor label */}
					{pos.cursorBounds && (
						<div
							style={{
								position: "absolute",
								left: pos.cursorBounds.left + 10,
								top: pos.cursorBounds.top + 15,
								backgroundColor: pos.color,
								color: "white",
								padding: "2px 6px",
								borderRadius: "4px",
								fontSize: "12px",
								fontWeight: "bold",
								whiteSpace: "nowrap",
								transform: "translateX(-50%)",
							}}
						>
							{pos.name}
						</div>
					)}
				</div>
			))}
			<style>{`
				@keyframes pulse {
					0%,
					50% {
						opacity: 1;
					}
					51%,
					100% {
						opacity: 0.3;
					}
				}
			`}</style>
		</div>
	);
};

function DocsEditor() {
	const { roomId } = useParams();
	const { socket, onlineUsers } = useSocket();
	const wrapperRef = useRef(null);
	const quillRef = useRef(null);
	const [quillReady, setQuillReady] = useState(false);
	const [remoteCursors, setRemoteCursors] = useState({});

	const userId =
		localStorage.getItem("userId") || localStorage.getItem("id") || null;
	const username =
		localStorage.getItem("username") ||
		localStorage.getItem("userEmail") ||
		`user-${userId || Math.random().toString(36).substr(2, 9)}`;

	/* -------------------------
     Initialize Quill (NO CURSORS MODULE)
     ------------------------- */
	useEffect(() => {
		if (!wrapperRef.current) return;

		const editorContainer = document.createElement("div");
		editorContainer.style.position = "relative";
		editorContainer.style.height = "100%";

		const editorDiv = document.createElement("div");
		editorDiv.style.height = "100%";

		editorContainer.appendChild(editorDiv);
		wrapperRef.current.innerHTML = "";
		wrapperRef.current.appendChild(editorContainer);

		const quill = new Quill(editorDiv, {
			theme: "snow",
			modules: {
				toolbar: TOOLBAR_OPTIONS,
				// NO CURSORS MODULE!
			},
		});

		quillRef.current = quill;
		setQuillReady(true);

		return () => {
			try {
				quill.disable();
			} catch {}
			quillRef.current = null;
			setQuillReady(false);
		};
	}, []);

	/* -------------------------
     Join room & load document
     ------------------------- */
	useEffect(() => {
		if (!socket || !quillReady || !roomId) return;

		socket.emit("join_room", { roomId, username });
		socket.emit("get-document", { docId: roomId, userId });

		const loadHandler = (doc) => {
			const q = quillRef.current;
			if (!q) return;
			if (doc && typeof doc === "object" && doc.ops) {
				q.setContents(doc);
			} else if (typeof doc === "string" && doc.trim()) {
				q.setText(doc);
			} else {
				q.setText("");
			}
			q.enable();
			q.setSelection(0);
		};

		socket.once("load-document", loadHandler);
		return () => socket.off("load-document", loadHandler);
	}, [socket, quillReady, roomId, userId, username]);

	/* -------------------------
     Emit local cursor/selection (updated to handle selections properly)
     ------------------------- */
	useEffect(() => {
		const q = quillRef.current;
		if (!q || !socket || !roomId) return;

		let typingTimeout = null;
		let emitTimeout = null;
		let lastEmitted = null;

		const clampRange = (r) => {
			if (!r) return null;
			const len = q.getLength();
			const index = Math.max(0, Math.min(r.index, len));
			const length = Math.max(0, Math.min(r.length || 0, len - index));
			return { index, length };
		};

		const emitCursor = (isTyping = false, extraDelay = 50) => {
			if (emitTimeout) clearTimeout(emitTimeout);
			emitTimeout = setTimeout(() => {
				const range = clampRange(q.getSelection());
				if (!range) return;
				const serialized = `${range.index}:${range.length}:${isTyping ? 1 : 0}`;
				if (serialized === lastEmitted) return;
				lastEmitted = serialized;
				socket.emit("cursor-position-docs", {
					roomId,
					socketId: socket.id,
					username,
					range,
					isTyping,
				});
			}, extraDelay);
		};

		const stopTyping = () => emitCursor(false);

		const selectionHandler = (range, oldRange, source) => {
			if (source !== "user") return;
			emitCursor(false, 30);
		};

		const textChangeHandler = (delta, oldDelta, source) => {
			if (source !== "user") return;
			const hasDelete = delta.ops.some((op) => op.delete);
			emitCursor(true, hasDelete ? 120 : 50);
			if (typingTimeout) clearTimeout(typingTimeout);
			typingTimeout = setTimeout(stopTyping, 800);
		};

		q.on("selection-change", selectionHandler);
		q.on("text-change", textChangeHandler);

		return () => {
			if (typingTimeout) clearTimeout(typingTimeout);
			if (emitTimeout) clearTimeout(emitTimeout);
			q.off("selection-change", selectionHandler);
			q.off("text-change", textChangeHandler);
		};
	}, [socket, quillReady, roomId, username]);

	/* -------------------------
     Receive remote cursors (CUSTOM OVERLAY)
     ------------------------- */
	useEffect(() => {
		if (!socket || !quillReady) return;

		const onCursor = ({
			socketId,
			username: remoteUsername,
			range,
			isTyping,
		}) => {
			if (socket.id === socketId) return; // skip local

			if (!range) {
				setRemoteCursors((prev) => {
					const newCursors = { ...prev };
					delete newCursors[socketId];
					return newCursors;
				});
				return;
			}

			const q = quillRef.current;
			if (!q) return;

			// Clamp range safely
			const len = q.getLength();
			const safeRange = {
				index: Math.max(0, Math.min(range.index, len)),
				length: Math.max(0, Math.min(range.length || 0, len - range.index)),
			};

			const color = getUserColor(remoteUsername || socketId);
			const displayName = `${remoteUsername || socketId}`;

			setRemoteCursors((prev) => ({
				...prev,
				[socketId]: {
					range: safeRange,
					color,
					name: displayName,
					isTyping,
				},
			}));
		};

		const onCursorRemoved = (socketId) => {
			setRemoteCursors((prev) => {
				const newCursors = { ...prev };
				delete newCursors[socketId];
				return newCursors;
			});
		};

		socket.on("cursor-position-docs", onCursor);
		socket.on("user-cursor-removed", onCursorRemoved);
		socket.on("disconnect", () => setRemoteCursors({}));

		return () => {
			socket.off("cursor-position-docs", onCursor);
			socket.off("user-cursor-removed", onCursorRemoved);
			socket.off("disconnect");
		};
	}, [socket, quillReady]);

	/* -------------------------
     Sync text (same as before)
     ------------------------- */
	useEffect(() => {
		const q = quillRef.current;
		if (!q || !socket || !roomId) return;

		const textHandler = (delta, oldDelta, source) => {
			if (source !== "user") return;
			socket.emit("send-changes", { roomId, delta });
		};
		q.on("text-change", textHandler);
		return () => q.off("text-change", textHandler);
	}, [socket, quillReady, roomId]);

	useEffect(() => {
		if (!socket || !quillRef.current) return;
		const recv = ({ delta }) => quillRef.current.updateContents(delta);
		socket.on("receive-changes", recv);
		return () => socket.off("receive-changes", recv);
	}, [socket, quillReady]);

	/* -------------------------
     Autosave (same as before)
     ------------------------- */
	useEffect(() => {
		if (!socket || !quillRef.current || !roomId) return;
		const interval = setInterval(() => {
			const contents = quillRef.current.getContents();
			socket.emit("save-document", { roomId, data: contents });
		}, SAVE_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [socket, quillReady, roomId]);

	/* -------------------------
     File import (same as before)
     ------------------------- */
	const handleFileImport = (e) => {
		const file = e.target.files?.[0];
		const q = quillRef.current;
		if (!file || !q) return;

		const getInsertIndex = () => {
			const selection = q.getSelection();
			return selection ? selection.index : q.getLength();
		};

		const extension = file.name.split(".").pop().toLowerCase();
		const reader = new FileReader();

		if (extension === "docx") {
			reader.onload = async (event) => {
				try {
					const arrayBuffer = event.target.result;
					const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
					q.clipboard.dangerouslyPasteHTML(getInsertIndex(), html, "user");
				} catch (err) {
					console.error(err);
					alert("Failed to import .docx");
				}
			};
			reader.readAsArrayBuffer(file);
		} else if (extension === "pptx") {
			reader.onload = async (event) => {
				try {
					const arrayBuffer = event.target.result;
					const zip = await JSZip.loadAsync(arrayBuffer);
					const slides = [];
					zip.folder("ppt/slides").forEach((relPath, f) => {
						if (relPath.startsWith("slide") && relPath.endsWith(".xml"))
							slides.push(f.async("string"));
					});
					const slideXmls = await Promise.all(slides);
					let fullText = "";
					slideXmls.forEach((xmlString, i) => {
						const xmlDoc = new DOMParser().parseFromString(
							xmlString,
							"application/xml"
						);
						const textNodes = xmlDoc.getElementsByTagName("a:t");
						fullText += `\n\n--- Slide ${i + 1} ---\n`;
						for (let j = 0; j < textNodes.length; j++)
							fullText += textNodes[j].textContent + "\n";
					});
					q.insertText(getInsertIndex(), fullText, "user");
				} catch (err) {
					console.error(err);
					alert("Failed to import .pptx");
				}
			};
			reader.readAsArrayBuffer(file);
		} else if (extension === "txt" || extension === "md") {
			reader.onload = (event) =>
				q.insertText(getInsertIndex(), event.target.result, "user");
			reader.readAsText(file);
		} else {
			alert("Unsupported file. Use .txt, .md, .docx, or .pptx.");
		}
	};

	return (
		<div className="bg-[#0f0a19] p-2 min-h-screen flex flex-col">
			<div className="text-white">
				<h4>Online Users:</h4>
				<div className="m-3 flex flex-wrap">
					{onlineUsers?.map((user) => (
						<span
							key={user.id}
							className="py-1 px-2 mx-1 rounded-full flex items-center gap-2 bg-white/10"
							title={user.id}
						>
							<span
								style={{
									width: 10,
									height: 10,
									borderRadius: "50%",
									backgroundColor: getUserColor(user.username),
								}}
							/>
							{user.username}
						</span>
					))}
				</div>
			</div>
			<div className="p-2 border-b flex items-center gap-2">
				<label className="cursor-pointer text-gray-500 bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
					📁 Import
					<input
						type="file"
						onChange={handleFileImport}
						accept=".txt,.md,.docx,.pptx"
						className="hidden"
					/>
				</label>
			</div>

			<div className="flex-grow container relative" ref={wrapperRef}>
				{quillReady && (
					<CursorOverlay cursors={remoteCursors} quillRef={quillRef} />
				)}
			</div>
		</div>
	);
}

export default DocsEditor;
