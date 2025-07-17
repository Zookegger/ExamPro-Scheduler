// import
import logo from "./logo.svg";
import { useState, useEffect } from 'react';
import { check_server_health } from './services/apiService'
import "./App.css";

// Component to check if server is running
function ServerHealthCheck() {
	const [server_status, set_server_status] = useState('Checking...');
	const [is_loading, set_is_loading] = useState(true);

	useEffect(() => {
		// Function to check server health
		const check_server = async () => {
			try {
				const response = await check_server_health();
				set_server_status('Server is running!');
				console.log('Server response: ', response);
			} catch (error) {
				set_server_status('Server is not running');        
				console.error('Server check failed:', error);
			} finally {
				set_is_loading(false);
			}
		};

		check_server();
	}, []); // Empty dependency array means this runs once when component mounts

	return (
		<div className="card">
			<div className="card-header">Server Status</div>

			<div className="card-body">
				{is_loading ? (
					<p>Checking server...</p>
				) : (
					<p>{server_status}</p>
				)}
			</div>
		</div>
	);
}

function App() {
	return (
		<div className="App">
			<header className="App-header bg-primary text-white py-3">
				<div className="container">
					<h1 className="mb-0">ExamPro Scheduler</h1>
				</div>
			</header>
			<main className="container my-4">
				<div className="row">
					<div className="col-md-8 mx-auto">
						<ServerHealthCheck />
					</div>
				</div>
			</main>
			<footer className="bg-light py-3 mt-auto">
				<div className="container text-center">
					<p className="mb-0 text-muted">&copy; 2024 ExamPro Scheduler. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
}

export default App;
