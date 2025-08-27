import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ChatRoom from "./pages/ChatRoom";
import CodeEditor from "./components/CodeEditor";
import ProtectedRoute from "./components/ProtectedRoute";
import { Box } from "@chakra-ui/react";
import DocsEditor from "./pages/DocsEditor";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				index: true,
				element: (
					<ProtectedRoute>
						<Home />
					</ProtectedRoute>
				),
			},
			{ path: "register", element: <Register /> },
			{ path: "login", element: <Login /> },
			{
				path: "room",
				children: [
					{ path: ":roomId/whiteboard", element: <ChatRoom /> },
					{
						path: ":roomId/code",
						element: (
							<Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
								<CodeEditor />
							</Box>
						),
					},
					{
						path: ":roomId/docs",
						element: <DocsEditor />,
					},
				],
			},
		],
	},
]);

export default router;
