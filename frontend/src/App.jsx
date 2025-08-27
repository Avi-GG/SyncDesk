// src/App.jsx
import Navbar from "./components/Navbar";
import { Outlet, useParams } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { RoomProvider } from "./context/RoomContext";

const App = () => {
	const { roomId } = useParams();
	const username = localStorage.getItem("username") || "Guest";

	return (
		<SocketProvider roomId={roomId} username={username}>
			<RoomProvider>
				<Navbar />
				<div className="p-4">
					<Outlet />
				</div>
			</RoomProvider>
		</SocketProvider>
	);
};

export default App;
