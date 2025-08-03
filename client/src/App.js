import React, { useEffect, useState } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Link,
	useNavigate,
} from "react-router-dom";
import "./App.css";
import { LoginPage, DevelopmentPage, MainPage, ForgotPasswordPage, ManageUserPage, ManageExamPage, ManageRoomPage, ManageSchedulePage, ManageSubjectPage } from "./pages";
import { checkAuth, logout, getUserNotifications, markNotificationsAsRead, markAllNotificationsAsRead } from "./services/apiService";
import useWebsocketConnection from './hooks/use_websocket_connection';

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
	
	// Notification state
	const [notifications, set_notifications] = useState([]);
	const [is_notifications_offcanvas_visible, set_is_notifications_offcanvas_visible] = useState(false);
	const [unread_count, set_unread_count] = useState(0);

	// Real-time notification handlers
	const handle_new_notification = (data) => {
		if (data.success && data.notification) {
			console.log('🔔 New notification received:', data.notification);
			
			// Add to notifications list
			set_notifications(prev => [data.notification, ...prev]);
			
			// Update unread count
			set_unread_count(prev => prev + 1);
			
			// Optional: Show browser notification
			if (Notification.permission === 'granted') {
				new Notification(data.notification.title, {
					body: data.notification.message,
					icon: '/favicon.ico'
				});
			}
		}
	};

	const handle_unread_count_update = (data) => {
		if (data.success) {
			set_unread_count(data.unread_count);
		}
	};

	// WebSocket connection for real-time notifications
	const { emit_event, is_connected } = useWebsocketConnection({
		events: {
			'new_notification': handle_new_notification,
			'unread_count_update': handle_unread_count_update,
		},
		auto_connect: is_logged_in && current_user_id
	});

	// Join notification room when user is logged in
	useEffect(() => {
		if (is_connected && current_user_id) {
			emit_event('join_notification_room', current_user_id);
		}
	}, [is_connected, current_user_id, emit_event]);

	// Request browser notification permission
	useEffect(() => {
		if (is_logged_in && 'Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}, [is_logged_in]);

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

	// Notification functions
	async function load_notifications() {
		try {
			const response = await getUserNotifications();
			if (response.success) {
				// Handle different response structures
				const notificationData = response.notifications || response.data || [];
				set_notifications(Array.isArray(notificationData) ? notificationData : []);
				const unread = notificationData.filter(n => !n.is_read).length;
				set_unread_count(unread);
			} else {
				console.warn('Failed to load notifications:', response.message);
				set_notifications([]);
				set_unread_count(0);
			}
		} catch (error) {
			console.error('Error loading notifications:', error);
			set_notifications([]);
			set_unread_count(0);
		}
	}

	async function handle_notification_read(notification_id) {
		try {
			const response = await markNotificationsAsRead([notification_id]);
			if (response.success) {
				// Update local state immediately for better UX
				set_notifications(prev => 
					prev.map(notification => 
						notification.notification_id === notification_id 
							? { ...notification, is_read: true }
							: notification
					)
				);
				set_unread_count(prev => Math.max(0, prev - 1));
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	}

	async function handle_mark_all_read() {
		try {
			const response = await markAllNotificationsAsRead();
			if (response.success) {
				// Update local state immediately
				set_notifications(prev => 
					prev.map(notification => ({ ...notification, is_read: true }))
				);
				set_unread_count(0);
			}
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	}	function toggle_notifications_offcanvas() {
		set_is_notifications_offcanvas_visible(!is_notifications_offcanvas_visible);
	}

	// Load notifications when user logs in
	React.useEffect(() => {
		if (is_logged_in && current_user_role === 'admin') {
			load_notifications();
			
			// Set up periodic refresh for real-time updates
			const interval = setInterval(load_notifications, 30000); // Every 30 seconds
			return () => clearInterval(interval);
		}
	}, [is_logged_in, current_user_role]);

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
			{/* Role-Based Navigation Bar */}
			{(() => {
				switch (current_user_role) {
					case "admin":
						// Admin users don't get a navbar (they have sidebar)
						return null;

					case "student":
						return (
							<nav className="navbar navbar-expand-lg navbar-dark bg-success">
								<div className="container-fluid">
									<Link className="navbar-brand" to="/">
										🎓 ExamPro Student
									</Link>

									{/* Hamburger Toggle Button */}
									<button
										className="navbar-toggler"
										type="button"
										data-bs-toggle="collapse"
										data-bs-target="#studentNavbar"
										aria-controls="studentNavbar"
										aria-expanded="false"
										aria-label="Toggle navigation"
									>
										<span className="navbar-toggler-icon"></span>
									</button>

									{/* Student Navigation Menu */}
									<div className="collapse navbar-collapse" id="studentNavbar">
										<div className="navbar-nav me-auto">
											<Link className="nav-link" to="/">
												<i className="bi bi-house me-1"></i>
												Dashboard
											</Link>
											<Link className="nav-link" to="/student/subject-enrollment">
												<i className="bi bi-book me-1"></i>
												Đăng ký môn học
											</Link>
											<Link className="nav-link" to="/student/my-exams">
												<i className="bi bi-calendar-check me-1"></i>
												Lịch thi của tôi
											</Link>
											<Link className="nav-link" to="/student/exam-schedule">
												<i className="bi bi-calendar-event me-1"></i>
												Lịch thi chung
											</Link>
										</div>
										
										{/* Student User Info */}
										<div className="navbar-nav">
											<div className="d-flex align-items-center gap-3">
												<div className="d-flex align-items-center gap-2">
													<span className="badge bg-light text-success px-3 py-2">
														<i className="bi bi-mortarboard me-1"></i>
														{get_role_text(current_user_role)}
													</span>
													<span className="text-white fw-semibold">
														{current_full_name}
													</span>
												</div>
												<button
													className="btn btn-outline-light btn-sm"
													onClick={handle_logout}
												>
													<i className="bi bi-box-arrow-right me-1"></i>
													Đăng xuất
												</button>
											</div>
										</div>
									</div>
								</div>
							</nav>
						);

					case "teacher":
						return (
							<nav className="navbar navbar-expand-lg navbar-dark bg-info">
								<div className="container-fluid">
									<Link className="navbar-brand" to="/">
										👨‍🏫 ExamPro Teacher
									</Link>

									{/* Hamburger Toggle Button */}
									<button
										className="navbar-toggler"
										type="button"
										data-bs-toggle="collapse"
										data-bs-target="#teacherNavbar"
										aria-controls="teacherNavbar"
										aria-expanded="false"
										aria-label="Toggle navigation"
									>
										<span className="navbar-toggler-icon"></span>
									</button>

									{/* Teacher Navigation Menu */}
									<div className="collapse navbar-collapse" id="teacherNavbar">
										<div className="navbar-nav me-auto">
											<Link className="nav-link" to="/">
												<i className="bi bi-house me-1"></i>
												Dashboard
											</Link>
											<Link className="nav-link" to="/teacher/my-subjects">
												<i className="bi bi-journal-text me-1"></i>
												Môn học của tôi
											</Link>
											<Link className="nav-link" to="/teacher/exam-proctor">
												<i className="bi bi-eye me-1"></i>
												Giám thị thi
											</Link>
										</div>
										
										{/* Teacher User Info */}
										<div className="navbar-nav">
											<div className="d-flex align-items-center gap-3">
												<div className="d-flex align-items-center gap-2">
													<span className="badge bg-light text-info px-3 py-2">
														<i className="bi bi-person-badge me-1"></i>
														{get_role_text(current_user_role)}
													</span>
													<span className="text-white fw-semibold">
														{current_full_name}
													</span>
												</div>
												<button
													className="btn btn-outline-light btn-sm"
													onClick={handle_logout}
												>
													<i className="bi bi-box-arrow-right me-1"></i>
													Đăng xuất
												</button>
											</div>
										</div>
									</div>
								</div>
							</nav>
						);

					default:
						// Guest users (not logged in)
						return (
							<nav className="navbar navbar-expand-lg navbar-dark bg-primary">
								<div className="container-fluid">
									<Link className="navbar-brand" to="/">
										📚 ExamPro Scheduler
									</Link>

									<div className="navbar-nav ms-auto">
										<Link className="nav-link" to="/login">
											<i className="bi bi-box-arrow-in-right me-1"></i>
											Đăng Nhập
										</Link>
									</div>
								</div>
							</nav>
						);
				}
			})()}

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
											<div className="d-flex align-items-center justify-content-between gap-2 mb-1">
												<div className="d-flex gap-2 align-items-center">
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
												{/* Notification Bell - Only for admin */}
												{current_user_role === 'admin' && (
													<button
														className="btn btn-secondary text-white rounded-circle position-relative me-1"
														onClick={toggle_notifications_offcanvas}
														title="Thông báo"
													>
														<i className="bi bi-bell fs-6"></i>
														{unread_count > 0 && (
															<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
																{unread_count > 99 ? '99+' : unread_count}
																<span className="visually-hidden">thông báo chưa đọc</span>
															</span>
														)}
													</button>
												)}
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
						
						{/* Authentication Routes */}
						<Route
							path="/login"
							element={
								<LoginPage
									set_is_logged_in={set_is_logged_in}
									set_current_user_id={set_current_user_id}
									set_current_user_name={set_current_user_name}
									set_current_full_name={set_current_full_name}
									set_current_user_role={set_current_user_role}
								/>
							}
						/>
						<Route
							path="/forgot-password"
							element={<ForgotPasswordPage />}
						/>

						{/* Admin Routes */}
						<Route
							path="/admin/manage-user"
							element={<ManageUserPage current_user_role={current_user_role} />}
						/>
						<Route
							path="/admin/manage-schedule"
							element={<ManageSchedulePage current_user_role={current_user_role} />}
						/>
						<Route
							path="/admin/manage-exam"
							element={<ManageExamPage current_user_role={current_user_role} />}
						/>
						<Route
							path="/admin/manage-room"
							element={<ManageRoomPage current_user_role={current_user_role} />}
						/>
						<Route
							path="/admin/manage-subject"
							element={<ManageSubjectPage current_user={current_user_id} current_user_role={current_user_role} />}
						/>

						{/* Student Routes */}
						<Route
							path="/student/subject-enrollment"
							element={
								<div className="container mt-4">
									<h3>🎓 Subject Enrollment</h3>
									<p>Student subject enrollment page - TODO: Implement SubjectEnrollmentPage component</p>
								</div>
							}
						/>
						<Route
							path="/student/my-exams"
							element={
								<div className="container mt-4">
									<h3>📋 My Exams</h3>
									<p>Student personal exams page - TODO: Implement MyExamsPage component</p>
								</div>
							}
						/>
						<Route
							path="/student/exam-schedule"
							element={
								<div className="container mt-4">
									<h3>📅 Exam Schedule</h3>
									<p>Public exam schedule page - TODO: Implement ExamSchedulePage component</p>
								</div>
							}
						/>

						{/* Teacher Routes */}
						<Route
							path="/teacher/my-subjects"
							element={
								<div className="container mt-4">
									<h3>📚 My Subjects</h3>
									<p>Teacher subjects management page - TODO: Implement MySubjectsPage component</p>
								</div>
							}
						/>
						<Route
							path="/teacher/exam-proctor"
							element={
								<div className="container mt-4">
									<h3>👁️ Exam Proctoring</h3>
									<p>Teacher exam proctoring page - TODO: Implement ExamProctorPage component</p>
								</div>
							}
						/>

						{/* Development Route */}
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
					</Routes>
				</div>
			</main>

			{/* Role-Based Footer */}
			{(() => {
				switch (current_user_role) {
					case "admin":
						// Admin users don't get a footer (full-height layout)
						return null;

					case "student":
						return (
							<footer className="bg-success text-white text-center p-3">
								<small>
									© 2025 ExamPro Scheduler - Student Portal
									{is_development && (
										<span className="ms-2 badge bg-warning text-dark">
											DEVELOPMENT MODE
										</span>
									)}
								</small>
							</footer>
						);

					case "teacher":
						return (
							<footer className="bg-info text-white text-center p-3">
								<small>
									© 2025 ExamPro Scheduler - Teacher Portal
									{is_development && (
										<span className="ms-2 badge bg-warning text-dark">
											DEVELOPMENT MODE
										</span>
									)}
								</small>
							</footer>
						);

					default:
						// Guest users
						return (
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
						);
				}
			})()}

			{/* Notifications Offcanvas - Only for admin */}
			{current_user_role === 'admin' && (
				<div
					className={`offcanvas offcanvas-end ${is_notifications_offcanvas_visible ? 'show' : ''}`}
					tabIndex="-1"
					id="notificationsOffcanvas"
					aria-labelledby="notificationsOffcanvasLabel"
					style={{ visibility: is_notifications_offcanvas_visible ? 'visible' : 'hidden' }}
				>
					<div className="offcanvas-header">
						<h5 className="offcanvas-title" id="notificationsOffcanvasLabel">
							<i className="bi bi-bell me-2"></i>
							Thông báo
						</h5>
						<button
							type="button"
							className="btn-close"
							onClick={toggle_notifications_offcanvas}
							aria-label="Close"
						></button>
					</div>
					<div className="offcanvas-body p-0">
						{/* Notification Actions */}
						<div className="p-3 border-bottom bg-light">
							<div className="d-flex justify-content-center">
								<button 
									type="button" 
									className="btn btn-sm btn-outline-primary"
									onClick={handle_mark_all_read}
									disabled={unread_count === 0}
								>
									<i className="fas fa-check-double me-1"></i>
									Đánh dấu tất cả đã đọc
								</button>
							</div>
						</div>

						{/* Notifications List */}
						<div className="notification-list" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
							{!notifications || notifications.length === 0 ? (
								<div className="text-center py-5">
									<i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
									<h6 className="text-muted">Không có thông báo</h6>
									<p className="text-muted small">
										Bạn sẽ nhận được thông báo khi có hoạt động mới trong hệ thống.
									</p>
								</div>
							) : (
								notifications.map(notification => (
									<div 
										key={notification.notification_id}
										className={`p-3 border-bottom ${
											!notification.is_read ? 'bg-light border-primary border-2' : ''
										}`}
										style={{ cursor: 'pointer' }}
										onClick={() => {
											if (!notification.is_read) {
												handle_notification_read(notification.notification_id);
											}
										}}
										onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
										onMouseLeave={(e) => e.target.style.backgroundColor = !notification.is_read ? '#f8f9fa' : 'transparent'}
									>
										<div className="d-flex align-items-start">
											<div className="flex-shrink-0 me-3">
												<div className={`rounded-circle d-flex align-items-center justify-content-center ${
													notification.type === 'subject' ? 'bg-primary' :
													notification.type === 'system' ? 'bg-info' :
													notification.type === 'success' ? 'bg-success' :
													notification.type === 'warning' ? 'bg-warning' :
													notification.type === 'error' ? 'bg-danger' : 'bg-secondary'
												}`} style={{ width: '40px', height: '40px' }}>
													<i className={`fas ${
														notification.type === 'subject' ? 'fa-book' :
														notification.type === 'system' ? 'fa-cog' :
														notification.type === 'success' ? 'fa-check' :
														notification.type === 'warning' ? 'fa-exclamation-triangle' :
														notification.type === 'error' ? 'fa-times' : 'fa-bell'
													} text-white fa-sm`}></i>
												</div>
											</div>
											<div className="flex-grow-1">
												<div className="d-flex justify-content-between align-items-start mb-1">
													<h6 className="mb-0 fw-bold text-dark">
														{notification.title}
													</h6>
													{!notification.is_read && (
														<div className="bg-primary rounded-circle" 
															 style={{ width: '8px', height: '8px' }}></div>
													)}
												</div>
												<p className="mb-1 text-muted small">
													{notification.message}
												</p>
												<div className="d-flex justify-content-between align-items-center">
													<small className="text-muted">
														<i className="fas fa-clock me-1"></i>
														{new Date(notification.created_at).toLocaleString('vi-VN', {
															year: 'numeric',
															month: '2-digit',
															day: '2-digit',
															hour: '2-digit',
															minute: '2-digit'
														})}
													</small>
													<span className={`badge text-capitalize ${
														notification.type === 'subject' ? 'bg-primary' :
														notification.type === 'system' ? 'bg-info' :
														notification.type === 'success' ? 'bg-success' :
														notification.type === 'warning' ? 'bg-warning text-dark' :
														notification.type === 'error' ? 'bg-danger' : 'bg-secondary'
													}`}>
														{notification.type}
													</span>
												</div>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			)}

			{/* Offcanvas Backdrop */}
			{is_notifications_offcanvas_visible && (
				<div
					className="offcanvas-backdrop fade show"
					onClick={toggle_notifications_offcanvas}
				></div>
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
