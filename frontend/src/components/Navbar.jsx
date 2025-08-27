import { useState } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
	const isLoggedIn = !!localStorage.getItem("token");
	const navigate = useNavigate();
	const location = useLocation();
	const { roomId } = useParams(); // get roomId from URL
	const [isOpen, setIsOpen] = useState(false);

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/login");
	};

	const toggleMenu = () => setIsOpen(!isOpen);

	// Only show room links if we're on a room route
	const showRoomLinks = location.pathname.startsWith("/room") && roomId;

	// Determine current page for dropdown
	let currentValue = ""; // the URL of the current page
	if (location.pathname.endsWith("/code"))
		currentValue = `/room/${roomId}/code`;
	else if (location.pathname.endsWith("/docs"))
		currentValue = `/room/${roomId}/docs`;
	else if (location.pathname.endsWith("/whiteboard"))
		currentValue = `/room/${roomId}/whiteboard`;

	const handleRoomSelect = (e) => {
		navigate(e.target.value);
	};

	return (
		<nav className="bg-[#1c1c1c] px-4 py-1 shadow-md shadow-black text-white flex justify-between items-center relative">
			<Link to="/" className=" !no-underline flex justify-center items-center">
				<img src="/image.png" alt="" />
				<h1 className="text-xl !text-orange-500 font-bold">SyncVerse</h1>
			</Link>
			{/* Desktop links */}
			<div className="hidden md:flex items-center gap-4">
				{showRoomLinks && (
					<select
						value={currentValue}
						onChange={handleRoomSelect}
						className={`px-5 py-3 rounded-md bg-gray-700 text-white focus:outline-none cursor-pointer`}
					>
						<option
							className="bg-[#0f0a19] cursor-pointer"
							value={`/room/${roomId}/code`}
						>
							Code Editor
						</option>
						<option
							className="bg-[#0f0a19] cursor-pointer"
							value={`/room/${roomId}/docs`}
						>
							Docs Editor
						</option>
						<option
							className="bg-[#0f0a19] cursor-pointer"
							value={`/room/${roomId}/whiteboard`}
						>
							Whiteboard
						</option>
					</select>
				)}

				{isLoggedIn ? (
					<button
						onClick={handleLogout}
						className="px-4 py-2 !rounded-lg border-2 !border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white focus:outline-none cursor-pointer"
					>
						Logout
					</button>
				) : (
					<Link to="/login" className="hover:text-blue-400 cursor-pointer">
						Login
					</Link>
				)}
			</div>

			{/* Mobile burger */}
			<button
				onClick={toggleMenu}
				className="md:hidden focus:outline-none z-50"
			>
				{isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
			</button>

			{/* Mobile menu */}
			{isOpen && (
				<div className="absolute top-16 right-4 w-48 bg-gray-900 rounded-xl shadow-xl flex flex-col gap-3 p-4 animate-slide-down z-50">
					{/* Room links for mobile */}
					{showRoomLinks && (
						<>
							<Link
								to={`/room/${roomId}/code`}
								className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-center hover:opacity-90 transition"
								onClick={() => setIsOpen(false)}
							>
								Code
							</Link>
							<Link
								to={`/room/${roomId}/docs`}
								className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-center hover:opacity-90 transition"
								onClick={() => setIsOpen(false)}
							>
								Docs
							</Link>
							<Link
								to={`/room/${roomId}/whiteboard`}
								className="px-4 py-2 rounded-lg bg-red-600 text-white text-center hover:opacity-90 transition"
								onClick={() => setIsOpen(false)}
							>
								Whiteboard
							</Link>
						</>
					)}

					{isLoggedIn ? (
						<button
							onClick={() => {
								handleLogout();
								setIsOpen(false);
							}}
							className="px-4 py-2 rounded-lg text-white text-center hover:bg-gray-700 transition"
						>
							Logout
						</button>
					) : (
						<Link
							to="/login"
							className="px-4 py-2 rounded-lg text-white text-center hover:bg-gray-700 transition"
							onClick={() => setIsOpen(false)}
						>
							Login
						</Link>
					)}
				</div>
			)}
		</nav>
	);
};

export default Navbar;
