import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
import { useRoom } from "../context/RoomContext"; // import your RoomContext

const Home = () => {
	const { setRoomId } = useRoom(); // get the setter from context
	const [roomLinkCode, setRoomLinkCode] = useState("");
	const [roomLinkDocs, setRoomLinkDocs] = useState("");
	const [roomLinkWhiteboard, setRoomLinkWhiteboard] = useState("");

	const generateRoom = () => {
		const roomId = uuidv4();

		// set in RoomContext so Navbar can read it
		setRoomId(roomId);

		// set the links like before
		setRoomLinkCode(`${window.location.origin}/room/${roomId}/code`);
		setRoomLinkDocs(`${window.location.origin}/room/${roomId}/docs`);
		setRoomLinkWhiteboard(
			`${window.location.origin}/room/${roomId}/whiteboard`
		);
	};

	const copyToClipboard = (link) => {
		navigator.clipboard.writeText(link).then(() => {
			alert("Link copied to clipboard!");
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex flex-col items-center py-12 px-4 text-gray-100">
			<h1 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-wide">
				Welcome to Real-Time Collaboration App
			</h1>

			<button
				onClick={generateRoom}
				className="mb-10 px-8 py-3 font-semibold text-white !rounded-[999px] bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-lg hover:scale-105 transform transition duration-300"
			>
				Generate Room Link
			</button>

			{/* ...rest of your existing UI stays exactly the same */}
			{roomLinkCode && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-5">
					{/* Code Editor */}
					<div className="bg-gray-800 p-6 rounded-3xl shadow-lg hover:shadow-xl transition duration-300 flex flex-col items-center border border-gray-700">
						<h3 className="text-xl font-semibold mb-4 text-indigo-400">
							Code Editor
						</h3>
						<Link
							to={roomLinkCode}
							className="mb-4  px-6 py-2 rounded-full text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow hover:opacity-90 transition !no-underline"
						>
							Go to Code Editor
						</Link>
						<div className="flex items-center gap-2 w-full">
							<input
								type="text"
								value={roomLinkCode}
								readOnly
								className="flex-1 border border-gray-600 px-3 py-2 rounded-lg text-sm bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<button
								onClick={() => copyToClipboard(roomLinkCode)}
								className="px-4 py-2 !rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
							>
								Copy
							</button>
						</div>
					</div>

					{/* Docs Editor */}
					<div className="bg-gray-800 p-6 rounded-3xl shadow-lg hover:shadow-xl transition duration-300 flex flex-col items-center border border-gray-700">
						<h3 className="text-xl font-semibold mb-4 text-yellow-400">
							Docs Editor
						</h3>
						<Link
							to={roomLinkDocs}
							className="mb-4 px-6 py-2 rounded-full text-white bg-gradient-to-r from-yellow-500 to-orange-500 shadow hover:opacity-90 transition !no-underline"
						>
							Go to Docs Editor
						</Link>
						<div className="flex items-center gap-2 w-full">
							<input
								type="text"
								value={roomLinkDocs}
								readOnly
								className="flex-1 border border-gray-600 px-3 py-2 rounded-lg text-sm bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
							/>
							<button
								onClick={() => copyToClipboard(roomLinkDocs)}
								className="px-4 py-2 !rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
							>
								Copy
							</button>
						</div>
					</div>

					{/* Whiteboard / Chat */}
					<div className="bg-gray-800 p-6 rounded-3xl shadow-lg hover:shadow-xl transition duration-300 flex flex-col items-center border border-gray-700">
						<h3 className="text-xl font-semibold mb-4 text-red-400">
							Whiteboard
						</h3>
						<Link
							to={roomLinkWhiteboard}
							className="mb-4 px-6 py-2 rounded-full text-white bg-gradient-to-r from-red-500 to-pink-600 shadow hover:opacity-90 transition !no-underline"
						>
							Go to Whiteboard
						</Link>
						<div className="flex items-center gap-2 w-full">
							<input
								type="text"
								value={roomLinkWhiteboard}
								readOnly
								className="flex-1 border border-gray-600 px-3 py-2 rounded-lg text-sm bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
							/>
							<button
								onClick={() => copyToClipboard(roomLinkWhiteboard)}
								className="px-4 py-2 !rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
							>
								Copy
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Home;
