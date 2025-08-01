import React, { useEffect, useState } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Link,
	Navigate,
	useNavigate,
} from "react-router-dom";
import MainPage from "./pages/MainPage";
import DevelopmentPage from "./pages/DevelopmentPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import "./App.css";
import { checkAuth, logout } from "./services/apiService";
import Management from "./pages/management";

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

function AppContent({
	is_development,
	is_logged_in,
	set_is_logged_in,
	current_user_id,
	set_current_user_id,
	current_full_name,
	set_current_full_name,
	current_user_name,
	set_current_user_name,
	current_user_role,
	set_current_user_role,
}) {
	const navigate = useNavigate();
	const [is_sidebar_visible, set_is_sidebar_visible] = useState(true);

	async function handle_logout() {
		const result = await logout();

		if (result.success) {
			set_is_logged_in(false);
			set_current_user_id("");
			set_current_user_name("Guest user");
			set_current_full_name("Guest");
			set_current_user_role("Guest");

			navigate("/");
		}
	}

	function toggle_sidebar() {
		set_is_sidebar_visible(!is_sidebar_visible);
	}
	return (
		<div
			className="App"
			style={{
				maxHeight: current_user_role === "admin" ? "100vh" : "unset",
				overflowY: current_user_role === "admin" ? "hidden" : "auto",
			}}
		>
			{/* Navigation Bar - Hidden for Admin Users */}
			{current_user_role !== "admin" && (
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
								<Link className="nav-link" to="/exam-registration">
									🏠 Đăng ký thi
								</Link>
								
							</div>
							<div className="navbar-nav">
								{is_logged_in ? (
									current_user_role ===
									"admin" ? // Admin users don't show user info in navbar (it's in sidebar)
									null : (
										<div className="d-flex align-items-center gap-3 pb-3">
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
									)
								) : (
									<Link className="nav-link" to="/login">
										🔐 Đăng Nhập
									</Link>
								)}
							</div>
						</div>
					</div>
				</nav>
			)}

			{/* Main Content Area */}
			<main
				className={`container-fluid d-flex ${
					current_user_role === "admin" ? "flex-row" : "flex-column"
				} flex-grow-1 bg-body-secondary p-0`}
				style={{
					overflowY:
						current_user_role === "admin" ? "hidden" : "auto",
				}}
			>
				{/* Admin Sidebar */}
				{current_user_role === "admin" && (
					<div
						className={`side-panel bg-primary text-white d-flex flex-column sidebar-transition ${
							is_sidebar_visible ? "" : "sidebar-hidden w-0"
						}`}
						style={{
							width: "300px",
							minWidth: "260px",
							minHeight: "100vh",
						}}
					>
						<div className="d-flex flex-column h-100">
							<div className="d-flex px-3 py-3 justify-content-between align-items-center border-bottom border-light-subtle">
								<div className="d-flex align-items-center text-white text-decoration-none">
									<i className="bi bi-calendar-check me-2"></i>
									<Link
										to="/"
										className="fs-5 fw-semibold text-white"
										style={{ textDecoration: "none" }}
									>
										ExamPro Admin
									</Link>
								</div>
								{/* Hamburger toggle button */}
								<button
									className="btn btn-outline-light btn-sm"
									onClick={toggle_sidebar}
									title="Thu gọn sidebar"
								>
									<i className="bi bi-list fs-5"></i>
								</button>
							</div>
							<div
								className="flex-grow-1 d-flex flex-column p-0"
								style={{ overflowX: "hidden" }}
							>
								<ul
									className="d-flex nav nav-pills accordion accordion-flush flex-column mb-auto flex-grow-1 gap-1"
									id="accordionSidepanel"
								>
									<li className="accordion-item bg-primary px-2 hvr-border-fade">
										<h2 className="accordion-header">
											<button
												className="accordion-button px-0 py-3 collapsed bg-transparent text-white hvr-underline-from-center"
												type="button"
												data-bs-toggle="collapse"
												data-bs-target="#examMenu"
												aria-expanded="false"
												aria-controls="examMenu"
											>
												<span className="fs-5 fw-semibold">
													<i className="bi bi-journal-check me-2 hvr-icon-back"></i>
													Quản lý Thi
												</span>
											</button>
										</h2>
										<div
											id="examMenu"
											className="accordion-collapse collapse"
											data-bs-parent="#accordionSidepanel"
										>
											<div className="accordion-body ps-3">
												<ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
													<li>
														<Link
															to="/"
															className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
														>
															<span className="text-start d-block fs-6">
																<i className="bi bi-speedometer2 me-2 hvr-icon-back"></i>
																Dashboard
															</span>
														</Link>
													</li>
													<li>
														<Link
															to="/admin/manage-exam"
															className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
														>
															<span className="text-start d-block fs-6">
																<i className="bi bi-people me-2 hvr-icon-back"></i>
																Quản lý kỳ thi
															</span>
														</Link>
													</li>
													<li>
														<Link
															to="/admin/manage-user"
															className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
														>
															<span className="text-start d-block fs-6">
																<i className="bi bi-people me-2 hvr-icon-back"></i>
																Quản lý Người dùng
															</span>
														</Link>
													</li>
													<li>
														<Link 
															to='/admin/manage-schedule'
															className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none" 
														>
															<span className="text-start d-block fs-6">
																<i className="bi bi-calendar-event me-2 hvr-icon-back"></i>
																Lịch Thi
															</span>
														</Link>
													</li>
													<li>
														<Link 
															to='/admin/manage-room'
															className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none" 
														>
															<span className="text-start d-block fs-6">
																<i className="bi bi-door-closed me-2 hvr-icon-back"></i>
																Phòng Thi
															</span>
														</Link>
													</li>
													<li>
														<Link 
															to='/admin/manage-subject'
															className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none" 
														>
															<span className="text-start d-block fs-6">
																<i className="bi bi-door-closed me-2 hvr-icon-back"></i>
																Quản lý môn học
															</span>
														</Link>
													</li>
												</ul>
											</div>
										</div>
									</li>

									{is_development && (
										<li className="accordion-item bg-primary px-2 hvr-border-fade">
											<h2 className="accordion-header">
												<button
													className="accordion-button px-0 py-3 collapsed bg-transparent text-white hvr-underline-from-center"
													type="button"
													data-bs-toggle="collapse"
													data-bs-target="#debugMenu"
													aria-expanded="false"
													aria-controls="debugMenu"
												>
													<span className="fs-5 fw-semibold">
														<i className="bi bi-bug me-2 hvr-icon-back"></i>
														Debug & Chẩn đoán
													</span>
												</button>
											</h2>
											<div
												id="debugMenu"
												className="accordion-collapse collapse"
												data-bs-parent="#accordionSidepanel"
											>
												<div className="accordion-body ps-3">
													<ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
														<li>
															<Link
																to="/development"
																className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
															>
																<span className="text-start d-block fs-6">
																	<i className="bi bi-wrench me-2 hvr-icon-back"></i>
																	Development
																	Page
																</span>
															</Link>
														</li>
														<li>
															<button className="nav-link w-100 text-white ps-2 hvr-underline-from-left bg-transparent border-0 text-start">
																<span className="text-start d-block fs-6">
																	<i className="bi bi-database me-2 hvr-icon-back"></i>
																	Database
																	Info
																</span>
															</button>
														</li>
														<li>
															<button className="nav-link w-100 text-white ps-2 hvr-underline-from-left bg-transparent border-0 text-start">
																<span className="text-start d-block fs-6">
																	<i className="bi bi-activity me-2 hvr-icon-back"></i>
																	Server
																	Health
																</span>
															</button>
														</li>
														<li>
															<button className="nav-link w-100 text-white ps-2 hvr-underline-from-left bg-transparent border-0 text-start">
																<span className="text-start d-block fs-6">
																	<i className="bi bi-graph-up me-2 hvr-icon-back"></i>
																	API Logs
																</span>
															</button>
														</li>
													</ul>
												</div>
											</div>
										</li>
									)}
								</ul>

								{/* Admin User Info Section at Bottom */}
								<div className="mt-auto border-top border-light-subtle pt-3 px-2 mb-3">
									<div className="d-flex align-items-center mb-2">
										<div className="flex-grow-1">
											<div className="d-flex align-items-center gap-2 mb-1">
												<i className="bi bi-person-circle fs-5"></i>
												<span className="text-white fw-semibold small">
													{current_full_name}
												</span>
												<span className="badge bg-light text-dark px-2 py-1 small">
													{get_role_text(
														current_user_role
													)}
												</span>
											</div>
										</div>
									</div>
									<button
										className="btn btn-outline-light btn-sm w-100 py-3"
										onClick={handle_logout}
									>
										<i className="bi bi-box-arrow-right me-2"></i>
										Đăng xuất
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				<div
					className="flex-grow-1 p-3 position-relative"
					style={{
						overflowY:
							current_user_role === "admin" ? "auto" : "hidden",
					}}
				>
					{/* Floating Sidebar Toggle Button - Only shows when sidebar is hidden for admin */}
					{current_user_role === "admin" && !is_sidebar_visible && (
						<button
							className="btn btn-primary position-fixed shadow-lg floating-toggle-btn"
							onClick={toggle_sidebar}
							title="Hiển thị sidebar"
							style={{
								top: "20px",
								left: "20px",
								zIndex: 1050,
								borderRadius: "50%",
								width: "50px",
								height: "50px",
								padding: 0,
							}}
						>
							<i className="bi bi-list fs-4"></i>
						</button>
					)}

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
								element={<DevelopmentPage current_user_role={current_user_role}/>}
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
						<Route path="/logout" action={handle_logout}></Route>
						<Route
							path="/forgot-password"
							element={<ForgotPasswordPage></ForgotPasswordPage>}
						/>
						<Route
							path="/admin/manage-user"
							element={<Management.User current_user_role={current_user_role}></Management.User>}
						/>
						<Route
							path="/admin/manage-schedule"
							element={<Management.Schedule current_user_role={current_user_role}></Management.Schedule>}
						/>
						<Route
							path="/admin/manage-exam"
							element={<Management.Exam current_user_role={current_user_role}></Management.Exam>}
						/>
						<Route
							path="/admin/manage-room"
							element={<Management.Room current_user_role={current_user_role}></Management.Room>}
						/>
						<Route
							path="/admin/manage-subject"
							element={<Management.Subject current_user_role={current_user_role}></Management.Subject>}
						/>
					</Routes>
				</div>
			</main>

			{/* Footer */}
			{current_user_role !== "admin" && (
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
			)}
		</div>
	);
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

	return <Router>
			<AppContent is_development={is_development}
                is_logged_in={is_logged_in}
                set_is_logged_in={set_is_logged_in}
                current_user_id={current_user_id}
                set_current_user_id={set_current_user_id}
                current_full_name={current_full_name}
                set_current_full_name={set_current_full_name}
                current_user_name={current_user_name}
                set_current_user_name={set_current_user_name}
                current_user_role={current_user_role}
                set_current_user_role={set_current_user_role}></AppContent>
		</Router>;
}

export default App;
