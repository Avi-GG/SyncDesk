import { Component } from "react";

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white min-h-full">
					<div className="text-center p-8">
						<h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
						<p className="text-gray-400 mb-4">
							We encountered an unexpected error. Please refresh the page.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
						>
							Refresh Page
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
