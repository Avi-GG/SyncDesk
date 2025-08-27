import { FaGithub, FaLinkedin, FaHeart } from "react-icons/fa";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-[#1c1c1c] text-gray-300 py-6 mt-auto border-t border-gray-700">
			<div className="max-w-6xl mx-auto px-4">
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					{/* Left side - Brand and copyright */}
					<div className="text-center md:text-left">
						<div className="flex items-center justify-center md:justify-start gap-2 mb-2">
							<img src="/image.png" alt="SyncDesk" className="w-6 h-6" />
							<span className="text-orange-500 font-bold text-lg">
								SyncDesk
							</span>
						</div>
						<p className="text-sm text-gray-400">
							© {currentYear} SyncDesk. All rights reserved.
						</p>
					</div>

					{/* Center - Made by */}
					<div className="text-center">
						<p className="text-sm flex items-center gap-1 justify-center">
							Made with <FaHeart className="text-red-500 text-xs" /> by{" "}
							<span className="text-orange-500 font-semibold">Avi</span>
						</p>
						<p className="text-xs text-gray-400 mt-1">
							Real-time collaboration platform
						</p>
					</div>

					{/* Right side - Social links */}
					<div className="flex items-center gap-4">
						<a
							href="https://github.com/Avi-GG"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-400 hover:text-orange-500 transition-colors duration-200"
							aria-label="GitHub"
						>
							<FaGithub className="text-xl" />
						</a>
						<a
							href="https://www.linkedin.com/in/contact-avigupta/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-400 hover:text-orange-500 transition-colors duration-200"
							aria-label="LinkedIn"
						>
							<FaLinkedin className="text-xl" />
						</a>
					</div>
				</div>

				{/* Bottom section - Additional info */}
			</div>
		</footer>
	);
};

export default Footer;
