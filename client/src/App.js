import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MainPage from "./pages/MainPage";
import DevelopmentPage from "./pages/DevelopmentPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import "./App.css";
import { checkAuth, logout } from "./services/apiService";
import ManageUserPage from "./pages/ManageUserPage";

function get_role_text(user_role) {
	switch (user_role) {
		case "admin":
			return "Quản trị viên";
		case "teacher":
			return "Giáo viên";
		case "student":
			return "Học sinh";
		case "Guest":
		default:
			return "Khách";
	}
}

/**
 * Main App Component with Routing
 *
 * Sets up routing between the main production page and development page.
 * In production builds, the development route should be disabled.
 */
function App() {
	// Allow development page in localhost environments
	const is_development =
		process.env.NODE_ENV === "development" ||
		window.location.hostname === "localhost";
	const [is_logged_in, set_is_logged_in] = useState(false);
	const [current_user_id, set_current_user_id] = useState("");
	const [current_full_name, set_current_full_name] = useState("");
	const [current_user_name, set_current_user_name] = useState("");
	const [current_user_role, set_current_user_role] = useState("Guest");

	async function handle_logout() {
		const result = await logout();

		if (result.success) {
			set_is_logged_in(false);
			set_current_user_id("");
			set_current_user_name("Guest user");
			set_current_full_name("Guest");
			set_current_user_role("Guest");
		}
	}

	useEffect(() => {
		async function check_auth_status() {
			const user = await checkAuth();
			if (user) {
				set_is_logged_in(true);
				set_current_user_id(user.id);
				set_current_user_name(user.user_name);
				set_current_full_name(user.full_name);
				set_current_user_role(user.role);
			} else {
				set_is_logged_in(false);
				set_current_user_id("");
				set_current_user_name("Guest user");
				set_current_full_name("Guest");
				set_current_user_role("Guest");
			}
		}

		check_auth_status();
	}, []);

	return (
		<Router>
			<div className="App">
				{/* Navigation Bar */}
				<nav className="navbar navbar-expand-lg navbar-dark bg-primary">
					<div className="container-fluid">
						<Link className="navbar-brand" to="/">
							📚 ExamPro Scheduler
						</Link>

						{/* Hamburger Toggle Button */}
						<button
							className="navbar-toggler"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#navbarNav"
							aria-controls="navbarNav"
							aria-expanded="false"
							aria-label="Toggle navigation"
						>
							<span className="navbar-toggler-icon"></span>
						</button>

						{/* Collapsible Navigation Content */}
						<div
							className="collapse navbar-collapse"
							id="navbarNav"
						>
							<div className="navbar-nav me-auto">
								<Link className="nav-link" to="/">
									🏠 Trang Chủ
								</Link>
								{is_development && (
									<Link
										className="nav-link"
										to="/development"
									>
										🛠️ Development
									</Link>
								)}
							</div>
							<div className="navbar-nav">
								{is_logged_in ? (
									<div className="d-flex align-items-center gap-3">
										<div className="d-flex align-items-center gap-2">
											<span className="badge bg-light text-dark px-3 py-2">
												{get_role_text(
													current_user_role
												)}
											</span>
											<span className="text-white">
												{current_full_name}
											</span>
										</div>
										<button
											className="btn btn-outline-light"
											onClick={handle_logout}
										>
											🚪 Đăng xuất
										</button>
									</div>
								) : (
									<Link className="nav-link" to="/login">
										🔐 Đăng Nhập
									</Link>
								)}
							</div>
						</div>
					</div>
				</nav>

				{/* Main Content Area */}
				<main className="container-fluid d-flex flex-column flex-grow-1 bg-body-secondary">
					<Routes>
						<Route
							path="/"
							element={
								<MainPage
									current_user_role={current_user_role}
								/>
							}
						/>
						{is_development && (
							<Route
								path="/development"
								element={<DevelopmentPage />}
							/>
						)}
						{/* Fallback route */}
						<Route
							path="*"
							element={
								<div className="container mt-5 text-center">
									<h2>404 - Trang không tồn tại</h2>
									<p>
										Trang bạn đang tìm kiếm không tồn tại.
									</p>
									<Link to="/" className="btn btn-primary">
										Về Trang Chủ
									</Link>
								</div>
							}
						/>

						<Route
							path="/login"
							element={
								<LoginPage
									set_is_logged_in={set_is_logged_in}
									set_current_user_id={set_current_user_id}
									set_current_user_name={
										set_current_user_name
									}
									set_current_full_name={
										set_current_full_name
									}
									set_current_user_role={
										set_current_user_role
									}
								/>
							}
						/>
						<Route
							path="/forgot-password"
							element={<ForgotPasswordPage></ForgotPasswordPage>}
						/>
						<Route
							path="/admin/manage-user"
							element={<ManageUserPage></ManageUserPage>}
						/>
					</Routes>
				</main>

				{/* Footer */}
				<footer className="bg-light text-center p-3">
					<small className="text-muted">
						© 2025 ExamPro Scheduler - Hệ thống quản lý lịch thi
						{is_development && (
							<span className="ms-2 badge bg-warning text-dark">
								DEVELOPMENT MODE
							</span>
						)}
					</small>
				</footer>
			</div>
		</Router>
	);
}

export default App;
