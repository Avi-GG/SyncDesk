import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";

const Whiteboard = ({ roomId, userColors }) => {
	const { socket } = useSocket();
	const canvasRef = useRef(null);
	const ctxRef = useRef(null);
	const drawing = useRef(false);

	const [color, setColor] = useState("#000000");
	const [tool, setTool] = useState("pen"); // pen, eraser, rect, circle, line, triangle, star, fill
	const [startPos, setStartPos] = useState(null); // used for shapes
	const [history, setHistory] = useState([]);

	// for live preview of shapes (stores base canvas before drag)
	const previewImgRef = useRef(null);
	const [eraserSize, setEraserSize] = useState(10);

	// shapes in the popup menu
	const SHAPES = ["rect", "circle", "line", "triangle", "star"];
	const [showShapesMenu, setShowShapesMenu] = useState(false);

	// Function to save canvas to sessionStorage
	const saveCanvasToSession = () => {
		if (canvasRef.current) {
			const canvasData = canvasRef.current.toDataURL();
			sessionStorage.setItem(`whiteboard_${roomId}`, canvasData);
		}
	};

	// Function to load canvas from sessionStorage (silently, no socket emissions)
	const loadCanvasFromSession = () => {
		const savedCanvas = sessionStorage.getItem(`whiteboard_${roomId}`);
		if (savedCanvas && canvasRef.current && ctxRef.current) {
			const img = new Image();
			img.onload = () => {
				// Silently restore canvas without triggering socket events
				ctxRef.current.clearRect(
					0,
					0,
					canvasRef.current.width,
					canvasRef.current.height
				);
				ctxRef.current.drawImage(img, 0, 0);
				// Save this initial state to history
				saveHistory();
			};
			img.src = savedCanvas;
		}
	};

	// Helper function to save current canvas state to history
	const saveHistory = () => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (canvas && ctx) {
			setHistory((prev) => [
				...prev,
				ctx.getImageData(0, 0, canvas.width, canvas.height),
			]);
		}
	};

	useEffect(() => {
		if (!socket) return;

		const canvas = canvasRef.current;
		canvas.width = 1000;
		canvas.height = 500;
		canvas.style.border = "1px solid #000";

		const ctx = canvas.getContext("2d");
		ctx.lineCap = "round";
		ctx.lineWidth = tool === "eraser" ? eraserSize : 5;

		ctx.strokeStyle = color;
		ctxRef.current = ctx;

		// Load saved canvas after setting up context
		setTimeout(() => loadCanvasFromSession(), 100);

		// listen for freehand lines from others
		socket.on("draw_line", ({ x0, y0, x1, y1, color }) => {
			drawLine(x0, y0, x1, y1, color, false);
			// Save state after receiving remote drawing
			setTimeout(() => saveHistory(), 0);
		});

		// listen for shapes from others
		socket.on("draw_shape", ({ shape, x0, y0, x1, y1, color }) => {
			drawShape(shape, x0, y0, x1, y1, color, false);
			// Save state after receiving remote shape
			setTimeout(() => saveHistory(), 0);
		});

		// listen for fill from others
		socket.on("fill_area", ({ x, y, color }) => {
			fillArea(x, y, color, false);
			// Save state after receiving remote fill
			setTimeout(() => saveHistory(), 0);
		});

		// listen for clear from others
		socket.on("clear_board", () => {
			ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
			// When others clear the board, clear your sessionStorage too since the board is now empty
			sessionStorage.removeItem(`whiteboard_${roomId}`);
			// Clear history as well since board is empty
			setHistory([]);
		});

		// listen for undo from others
		socket.on("undo_action", ({ imageData }) => {
			if (imageData && ctxRef.current) {
				const img = new Image();
				img.onload = () => {
					ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
					ctxRef.current.drawImage(img, 0, 0);
					// Save this state to history after remote undo
					setTimeout(() => saveHistory(), 0);
				};
				img.src = imageData;
			}
		});

		// remote cursor name tag
		socket.on("drawing_cursor", ({ x, y, userId, username }) => {
			const cursorId = `cursor-${userId}`;
			let cursorElem = document.getElementById(cursorId);
			const bgColor = userColors[userId] || "black";

			if (!cursorElem) {
				cursorElem = document.createElement("span");
				cursorElem.id = cursorId;
				cursorElem.style.position = "absolute";
				cursorElem.style.background = bgColor;
				cursorElem.style.color = "#fff";
				cursorElem.style.padding = "2px 6px";
				cursorElem.style.borderRadius = "5px";
				cursorElem.style.fontSize = "12px";
				cursorElem.style.fontWeight = "bold";
				cursorElem.style.whiteSpace = "nowrap";
				cursorElem.style.pointerEvents = "none";
				document.getElementById("user-cursors").appendChild(cursorElem);
			}

			cursorElem.innerText = username;
			cursorElem.style.left = `${x + 10}px`;
			cursorElem.style.top = `${y - 20}px`;
			cursorElem.style.background = bgColor;

			clearTimeout(cursorElem.timeoutId);
			cursorElem.timeoutId = setTimeout(() => {
				cursorElem.remove();
			}, 2000);
		});

		return () => {
			socket.off("draw_line");
			socket.off("draw_shape");
			socket.off("fill_area");
			socket.off("clear_board");
			socket.off("undo_action");
			socket.off("drawing_cursor");
			document.querySelectorAll("[id^='cursor-']").forEach((el) => el.remove());
		};
	}, [socket, roomId, userColors]);

	const undo = () => {
		if (history.length === 0) return;

		const last = history[history.length - 1];
		ctxRef.current.putImageData(last, 0, 0);
		setHistory((prev) => prev.slice(0, -1));

		// Send undo action to all users
		const currentCanvasData = canvasRef.current.toDataURL();
		socket.emit("undo_action", { roomId, imageData: currentCanvasData });

		// Update your own sessionStorage
		saveCanvasToSession();
	};

	const clearAll = () => {
		ctxRef.current.clearRect(
			0,
			0,
			canvasRef.current.width,
			canvasRef.current.height
		);
		socket.emit("clear_board", { roomId });
		// Clear YOUR sessionStorage when YOU clear the board
		sessionStorage.removeItem(`whiteboard_${roomId}`);
		// Clear history as well
		setHistory([]);
	};

	const drawLine = (x0, y0, x1, y1, colorToUse, emit) => {
		const ctx = ctxRef.current;

		ctx.lineWidth = colorToUse === "#FFFFFF" ? eraserSize : 5;
		ctx.strokeStyle = colorToUse;
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();
		ctx.closePath();

		if (emit) {
			socket.emit("draw_line", {
				roomId,
				x0,
				y0,
				x1,
				y1,
				color: colorToUse,
			});
			// Only save YOUR own drawings
			saveCanvasToSession();
		}
	};

	const drawShape = (shape, x0, y0, x1, y1, colorToUse, emit) => {
		const ctx = ctxRef.current;
		ctx.strokeStyle = colorToUse;
		ctx.fillStyle = colorToUse;

		if (shape === "rect") {
			ctx.beginPath();
			ctx.rect(x0, y0, x1 - x0, y1 - y0);
			ctx.stroke();
			ctx.closePath();
		} else if (shape === "circle") {
			const radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
			ctx.beginPath();
			ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.closePath();
		} else if (shape === "line") {
			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y1);
			ctx.stroke();
			ctx.closePath();
		} else if (shape === "triangle") {
			ctx.beginPath();
			ctx.moveTo(x0, y1);
			ctx.lineTo((x0 + x1) / 2, y0);
			ctx.lineTo(x1, y1);
			ctx.closePath();
			ctx.stroke();
		} else if (shape === "star") {
			drawStar(ctx, x0, y0, 5, Math.abs(x1 - x0), Math.abs(y1 - y0) / 2);
		}

		if (emit) {
			socket.emit("draw_shape", {
				roomId,
				shape,
				x0,
				y0,
				x1,
				y1,
				color: colorToUse,
			});
			// Only save YOUR own shapes
			saveCanvasToSession();
		}
	};

	const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
		let rot = (Math.PI / 2) * 3;
		let x = cx;
		let y = cy;
		const step = Math.PI / spikes;
		ctx.beginPath();
		ctx.moveTo(cx, cy - outerRadius);
		for (let i = 0; i < spikes; i++) {
			x = cx + Math.cos(rot) * outerRadius;
			y = cy + Math.sin(rot) * outerRadius;
			ctx.lineTo(x, y);
			rot += step;
			x = cx + Math.cos(rot) * innerRadius;
			y = cy + Math.sin(rot) * innerRadius;
			ctx.lineTo(x, y);
			rot += step;
		}
		ctx.closePath();
		ctx.stroke();
	};

	const fillArea = (startX, startY, fillColor, emit) => {
		const ctx = ctxRef.current;
		const canvas = canvasRef.current;
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		const targetColor = getPixel(data, startX, startY, canvas.width);
		const fillR = parseInt(fillColor.slice(1, 3), 16);
		const fillG = parseInt(fillColor.slice(3, 5), 16);
		const fillB = parseInt(fillColor.slice(5, 7), 16);

		if (
			targetColor[0] === fillR &&
			targetColor[1] === fillG &&
			targetColor[2] === fillB
		) {
			return;
		}

		const stack = [[startX, startY]];
		while (stack.length) {
			const [x, y] = stack.pop();
			if (
				x >= 0 &&
				y >= 0 &&
				x < canvas.width &&
				y < canvas.height &&
				colorsMatch(getPixel(data, x, y, canvas.width), targetColor)
			) {
				setPixel(data, x, y, [fillR, fillG, fillB, 255]);
				stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
			}
		}
		ctx.putImageData(imageData, 0, 0);

		if (emit) {
			socket.emit("fill_area", {
				roomId,
				x: startX,
				y: startY,
				color: fillColor,
			});
			// Only save YOUR own fill operations
			saveCanvasToSession();
		}
	};

	const getPixel = (data, x, y, width) => {
		const idx = (y * width + x) * 4;
		return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
	};

	const setPixel = (data, x, y, [r, g, b, a]) => {
		const idx = (y * canvasRef.current.width + x) * 4;
		data[idx] = r;
		data[idx + 1] = g;
		data[idx + 2] = b;
		data[idx + 3] = a;
	};

	const colorsMatch = (c1, c2) => {
		return (
			c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3]
		);
	};

	const handleMouseDown = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		const x = Math.floor(e.clientX - rect.left);
		const y = Math.floor(e.clientY - rect.top);

		saveHistory();

		// live preview setup for shapes
		if (SHAPES.includes(tool)) {
			setStartPos({ x, y });
			previewImgRef.current = ctxRef.current.getImageData(
				0,
				0,
				canvasRef.current.width,
				canvasRef.current.height
			);
			return;
		}

		// pen/eraser/fill logic unchanged
		if (tool === "pen" || tool === "eraser") {
			drawing.current = { x, y };
		} else if (tool === "fill") {
			fillArea(x, y, color, true);
		}
	};

	const handleMouseMove = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		const x = Math.floor(e.clientX - rect.left);
		const y = Math.floor(e.clientY - rect.top);

		// live preview for shapes during drag
		if (SHAPES.includes(tool) && startPos) {
			// restore base image then draw outline preview (no emit)
			if (previewImgRef.current) {
				ctxRef.current.putImageData(previewImgRef.current, 0, 0);
			}
			drawShape(tool, startPos.x, startPos.y, x, y, color, false);
			return;
		}

		// pen/eraser freehand
		if (!drawing.current) return;

		const x0 = drawing.current.x;
		const y0 = drawing.current.y;
		const strokeColor = tool === "eraser" ? "#FFFFFF" : color;
		drawLine(x0, y0, x, y, strokeColor, true);
		drawing.current = { x, y };

		// cursor label emission (unchanged)
		socket.emit("drawing_cursor", {
			roomId,
			x,
			y,
			userId: socket.id,
			username: localStorage.getItem("username") || "Guest",
		});
	};

	const handleMouseUp = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		const x1 = Math.floor(e.clientX - rect.left);
		const y1 = Math.floor(e.clientY - rect.top);

		// finalize shape on release (emit once)
		if (SHAPES.includes(tool) && startPos) {
			// ensure base is restored, then draw final shape and emit
			if (previewImgRef.current) {
				ctxRef.current.putImageData(previewImgRef.current, 0, 0);
			}
			drawShape(tool, startPos.x, startPos.y, x1, y1, color, true);
			setStartPos(null);
			previewImgRef.current = null;
		}

		drawing.current = false;
	};

	return (
		<div className="w-full h-full relative">
			{/* overlay for remote cursor labels */}
			<div
				id="user-cursors"
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					pointerEvents: "none",
					zIndex: 1000,
				}}
			/>

			{/* canvas */}
			<canvas
				ref={canvasRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseOut={handleMouseUp}
				className="border border-gray-300 rounded bg-white"
			></canvas>

			{/* toolbar under canvas */}
			<div className="flex flex-wrap gap-2 mt-2 items-center">
				{/* Pen */}
				<button
					onClick={() => setTool("pen")}
					className={`px-2 py-1 rounded ${
						tool === "pen"
							? "border border-black shadow-md bg-gray-700"
							: "bg-gray-800"
					}`}
				>
					✏️ Pen
				</button>

				{/* Eraser */}
				<button
					onClick={() => setTool("eraser")}
					className={`px-2 py-1 rounded ${
						tool === "eraser"
							? "border border-black shadow-md bg-gray-700"
							: "bg-gray-800"
					}`}
				>
					🧽 Eraser
				</button>
				{tool === "eraser" && (
					<input
						type="range"
						min="5"
						max="50"
						value={eraserSize}
						onChange={(e) => setEraserSize(Number(e.target.value))}
					/>
				)}

				{/* Shapes menu */}
				<div className="relative">
					<button
						onClick={() => setShowShapesMenu((s) => !s)}
						className={`px-2 py-1 rounded ${
							SHAPES.includes(tool)
								? "border border-black shadow-md bg-gray-700"
								: "bg-gray-800"
						}`}
						title="Shapes"
					>
						🔺 Shapes
					</button>
					{showShapesMenu && (
						<div className="absolute bottom-full mb-2 bg-gray-800 border p-2 rounded shadow-md z-50 flex flex-col gap-1">
							{SHAPES.map((shape) => (
								<button
									key={shape}
									onClick={() => {
										setTool(shape);
										setShowShapesMenu(false);
									}}
									className={`text-left px-2 py-1 rounded ${
										tool === shape ? "bg-gray-700" : ""
									}`}
								>
									{shape}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Fill */}
				<button
					onClick={() => setTool("fill")}
					className={`px-2 py-1 rounded ${
						tool === "fill"
							? "border border-black shadow-md bg-gray-700"
							: "bg-gray-800"
					}`}
				>
					🪣 Fill
				</button>

				{/* Color */}
				<input
					type="color"
					value={color}
					onChange={(e) => setColor(e.target.value)}
				/>

				{/* Undo / Clear */}
				<button
					onClick={undo}
					className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
				>
					↩️ Undo
				</button>
				<button
					onClick={clearAll}
					className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
				>
					🗑️ Clear
				</button>
			</div>
		</div>
	);
};

export default Whiteboard;
