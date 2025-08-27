// src/App.jsx
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Outlet, useParams } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { RoomProvider } from "./context/RoomContext";

const App = () => {
	const { roomId } = useParams();
	const username = localStorage.getItem("username") || "Guest";

	return (
		<SocketProvider roomId={roomId} username={username}>
			<RoomProvider>
				<div className="min-h-screen flex flex-col">
					<Navbar />
					<main className="flex-grow p-4">
						<Outlet />
					</main>
					<Footer />
				</div>
			</RoomProvider>
		</SocketProvider>
	);
};

export default App;
