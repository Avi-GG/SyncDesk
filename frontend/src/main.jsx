import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import router from "./router";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./helpers/theme";
import { SocketProvider } from "./context/SocketContext";
import { useSocket } from "./context/SocketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ChakraProvider theme={theme} resetCSS={false}>
			<RouterProvider router={router} />
		</ChakraProvider>
	</React.StrictMode>
);
