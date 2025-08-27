import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
	const [documents, setDocuments] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				const response = await fetch("http://localhost:5000/api/documents");
				if (!response.ok) throw new Error("Network response was not ok");
				const data = await response.json();
				setDocuments(data);
			} catch (error) {
				console.error("Failed to fetch documents:", error);
			}
		};

		fetchDocuments();
	}, []);

	const createNewDocument = async () => {
		try {
			const response = await fetch("http://localhost:5000/api/documents", {
				method: "POST",
			});
			if (!response.ok) throw new Error("Failed to create document");
			const data = await response.json();
			navigate(`/documents/${data.id}`);
		} catch (error) {
			console.error("Error creating new document:", error);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-8">
			<h1 className="text-3xl font-bold mb-6">My Documents</h1>
			<button
				onClick={createNewDocument}
				className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
			>
				Create New Document
			</button>
			<ul className="space-y-2">
				{documents.map((doc) => (
					<li key={doc._id} className="border p-4 rounded-md hover:bg-gray-50">
						<Link
							to={`/documents/${doc._id}`}
							className="text-blue-600 hover:underline"
						>
							{doc.title || "Untitled Document"}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};

export default Home;
