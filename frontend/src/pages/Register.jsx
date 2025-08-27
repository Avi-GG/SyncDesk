import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
	const [form, setForm] = useState({ username: "", email: "", password: "" });
	const navigate = useNavigate();

	const handleChange = (e) =>
		setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await axios.post("http://localhost:5000/api/auth/register", form);
			navigate("/login");
		} catch (err) {
			alert(err.response?.data?.error || "Something went wrong");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 px-4">
			<div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg border border-white/10">
				<h2 className="text-3xl font-semibold text-center mb-6">
					Create Account
				</h2>
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label className="block text-sm mb-1 text-gray-400">Username</label>
						<input
							name="username"
							placeholder="Enter your username"
							className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
							onChange={handleChange}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-400">Email</label>
						<input
							name="email"
							placeholder="Enter your email"
							className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
							onChange={handleChange}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-400">Password</label>
						<input
							name="password"
							type="password"
							placeholder="••••••••"
							className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
							onChange={handleChange}
						/>
					</div>
					<button
						type="submit"
						className="w-full py-3 rounded-lg cursor-pointer bg-blue-500 hover:bg-blue-600 transition-all font-medium shadow-md hover:shadow-lg"
					>
						Register
					</button>
				</form>

				<p className="text-center text-sm mt-6">
					Already have an account?{" "}
					<Link
						to="/login"
						className="text-blue-400 hover:underline font-bold hover:text-blue-300"
					>
						Login
					</Link>
				</p>
			</div>
		</div>
	);
};

export default Register;
