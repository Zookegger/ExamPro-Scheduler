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
import WebSocketTokenTest from './components/WebSocketTokenTest';
import { 
	NetworkStatusIndicator, 
	RoleBasedNavigation, 
	AdminSidebar, 
	NotificationOffcanvas, 
	RoleBasedFooter 
} from './components';

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

	// Network status animation state
	const [show_network_icon, set_show_network_icon] = useState(false);
	const [network_animation_class, set_network_animation_class] = useState('');

	// Handle connection status changes with animations
	useEffect(() => {
		if (is_logged_in && current_user_id) {
			if (!is_connected) {
				// Show disconnected icon
				set_show_network_icon(true);
				set_network_animation_class('network-icon-show');
			} else if (is_connected && show_network_icon) {
				// Connection restored - animate away
				set_network_animation_class('network-icon-connected');
				// Hide after animation completes
				setTimeout(() => {
					set_show_network_icon(false);
					set_network_animation_class('');
				}, 800);
			}
		} else {
			// Not logged in - hide icon
			set_show_network_icon(false);
			set_network_animation_class('');
		}
	}, [is_connected, is_logged_in, current_user_id, show_network_icon]);

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
			{/* Network Status Indicator */}
			<NetworkStatusIndicator 
				show_network_icon={show_network_icon}
				network_animation_class={network_animation_class}
				is_connected={is_connected}
			/>

			{/* Role-Based Navigation Bar */}
			<RoleBasedNavigation 
				current_user_role={current_user_role}
				current_full_name={current_full_name}
				handle_logout={handle_logout}
			/>

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
					<AdminSidebar 
						is_sidebar_visible={is_sidebar_visible}
						toggle_sidebar={toggle_sidebar}
						current_full_name={current_full_name}
						current_user_role={current_user_role}
						is_development={is_development}
						unread_count={unread_count}
						toggle_notifications_offcanvas={toggle_notifications_offcanvas}
						handle_logout={handle_logout}
					/>
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
							element={<ManageUserPage current_user={current_user_id} current_user_role={current_user_role} />}
						/>
						<Route
							path="/admin/manage-schedule"
							element={<ManageSchedulePage current_user={current_user_id} current_user_role={current_user_role} />}
						/>
						<Route
							path="/admin/manage-exam"
							element={<ManageExamPage current_user={current_user_id} current_user_role={current_user_role} />}
						/>
						<Route
							path="/admin/manage-room"
							element={<ManageRoomPage current_user={current_user_id} current_user_role={current_user_role} />}
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

						{/* WebSocket Token Test Route */}
						{is_development && (
							<Route
								path="/websocket-test"
								element={<WebSocketTokenTest />}
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
			<RoleBasedFooter 
				current_user_role={current_user_role}
				is_development={is_development}
			/>

			{/* Notifications Offcanvas - Only for admin */}
			{current_user_role === 'admin' && (
				<NotificationOffcanvas 
					is_notifications_offcanvas_visible={is_notifications_offcanvas_visible}
					toggle_notifications_offcanvas={toggle_notifications_offcanvas}
					notifications={notifications}
					unread_count={unread_count}
					handle_mark_all_read={handle_mark_all_read}
					handle_notification_read={handle_notification_read}
				/>
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
