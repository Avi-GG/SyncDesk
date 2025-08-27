import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
	const [form, setForm] = useState({ email: "", password: "" });
	const navigate = useNavigate();

	const handleChange = (e) =>
		setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await axios.post(
				"http://localhost:5000/api/auth/login",
				form
			);
			localStorage.setItem("token", res.data.token);
			localStorage.setItem("username", res.data.user.username);
			navigate("/");
		} catch (err) {
			alert(err.response?.data?.error || "Login failed");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800  px-4">
			<div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg border border-white/10">
				<h2 className="text-3xl font-semibold text-center mb-6 ">Sign In</h2>
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label className="block text-sm mb-1 text-gray-400">Email</label>
						<input
							name="email"
							placeholder="Enter your email"
							className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-gray-500 transition-all"
							onChange={handleChange}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-400">Password</label>
						<input
							name="password"
							type="password"
							placeholder="••••••••"
							className="w-full px-3 py-2  rounded-lg bg-black/30 border border-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-gray-500 transition-all"
							onChange={handleChange}
						/>
					</div>
					<button
						type="submit"
						className="w-full py-3 rounded-lg cursor-pointer bg-amber-500 hover:bg-amber-600 transition-all font-medium shadow-md hover:shadow-lg"
					>
						Login
					</button>
				</form>

				<p className="text-center text-sm mt-6">
					Don't have an account?{" "}
					<Link
						to="/register"
						className="text-blue-400 hover:underline font-bold hover:text-blue-300"
					>
						Register
					</Link>
				</p>
			</div>
		</div>
	);
};

export default Login;
