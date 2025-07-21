// import
// import logo from "./logo.svg";
import { useState, useEffect } from "react";
import { check_server_health } from "./services/apiService";
import { io } from "socket.io-client";
import "./App.css";

// Real-time notification system (matching "đẩy thông báo xác nhận, nhắc lịch thi")
function RealTimeNotifications() {
	const [notifications, set_notifications] = useState([]);
	const [is_connected, set_is_connected] = useState(false);

	useEffect(() => {
		// Mock real-time notifications - later implement WebSocket
		const mock_notifications = [
			{
				id: 1,
				type: "exam_reminder",
				message:
					"Nhắc nhở: Bạn có kỳ thi Toán học vào 10:00 AM ngày mai",
				timestamp: new Date().toLocaleString(),
				is_read: false,
			},
			{
				id: 2,
				type: "registration_confirmed",
				message: "Xác nhận: Đăng ký thi Vật lý thành công",
				timestamp: new Date().toLocaleString(),
				is_read: false,
			},
			{
				id: 3,
				type: "schedule_conflict",
				message: "Cảnh báo: Phát hiện trùng lặp lịch thi",
				timestamp: new Date().toLocaleString(),
				is_read: false,
			},
		];

		set_notifications(mock_notifications);
		set_is_connected(true); // Mock WebSocket connection
	}, []);

	const mark_as_read = (notification_id) => {
		set_notifications((prev) =>
			prev.map((notif) =>
				notif.id === notification_id
					? { ...notif, is_read: true }
					: notif
			)
		);
	};

	return (
		<div className="card mb-4">
			<div className="card-header d-flex justify-content-between align-items-center">
				<h5 className="mb-0">Thông Báo Realtime</h5>
				<span
					className={`badge ${
						is_connected ? "badge-success" : "badge-danger"
					}`}
				>
					{is_connected ? "🟢 Kết nối" : "🔴 Mất kết nối"}
				</span>
			</div>
			<div className="card-body">
				{notifications.length > 0 ? (
					<div className="list-group">
						{notifications.map((notification) => (
							<div
								key={notification.id}
								className={`list-group-item ${
									!notification.is_read ? "bg-light" : ""
								}`}
							>
								<div className="d-flex justify-content-between">
									<div>
										<p className="mb-1">
											{notification.message}
										</p>
										<small className="text-muted">
											{notification.timestamp}
										</small>
									</div>
									{!notification.is_read && (
										<button
											className="btn btn-sm btn-outline-primary"
											onClick={() =>
												mark_as_read(notification.id)
											}
										>
											Đã đọc
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-muted">Không có thông báo mới</p>
				)}
			</div>
		</div>
	);
}

// Schedule optimization component (matching "tối ưu hóa lịch thi, tránh trùng lặp")
function ScheduleOptimization() {
	const [optimization_status, set_optimization_status] = useState("idle");
	const [conflicts_found, set_conflicts_found] = useState([]);

	const run_optimization = () => {
		set_optimization_status("running");

		// Mock optimization process
		setTimeout(() => {
			const mock_conflicts = [
				{
					id: 1,
					conflict_type: "time_overlap",
					description:
						"Trùng lặp thời gian: Toán học và Vật lý cùng lúc 10:00 AM",
					severity: "high",
					suggested_solution: "Dời Vật lý sang 2:00 PM",
				},
				{
					id: 2,
					conflict_type: "room_conflict",
					description:
						"Trùng phòng: Phòng A1 được sử dụng cho 2 kỳ thi",
					severity: "medium",
					suggested_solution: "Sử dụng phòng B2 cho kỳ thi thứ 2",
				},
			];

			set_conflicts_found(mock_conflicts);
			set_optimization_status("completed");
		}, 2000);
	};

	return (
		<div className="card mb-4">
			<div className="card-header">
				<h5 className="mb-0">Tối Ưu Hóa Lịch Thi</h5>
			</div>
			<div className="card-body">
				<div className="row">
					<div className="col-md-4">
						<button
							className="btn btn-primary btn-block"
							onClick={run_optimization}
							disabled={optimization_status === "running"}
						>
							{optimization_status === "running"
								? "Đang tối ưu..."
								: "Chạy Tối Ưu Hóa"}
						</button>
					</div>
					<div className="col-md-8">
						{optimization_status === "running" && (
							<div className="progress">
								<div
									className="progress-bar progress-bar-striped progress-bar-animated"
									style={{ width: "100%" }}
								>
									Đang kiểm tra trùng lặp...
								</div>
							</div>
						)}

						{conflicts_found.length > 0 &&
							optimization_status === "completed" && (
								<div className="mt-3">
									<h6>
										Phát hiện {conflicts_found.length} xung
										đột:
									</h6>
									{conflicts_found.map((conflict) => (
										<div
											key={conflict.id}
											className="alert alert-warning"
										>
											<strong>
												{conflict.description}
											</strong>
											<br />
											<small>
												Đề xuất:{" "}
												{conflict.suggested_solution}
											</small>
										</div>
									))}
								</div>
							)}
					</div>
				</div>
			</div>
		</div>
	);
}

// Real-time exam monitoring (matching "kiểm tra thời gian thực")
function RealTimeExamMonitoring() {
	const [active_exams, set_active_exams] = useState([]);
	const [monitoring_status, set_monitoring_status] = useState("active");

	useEffect(() => {
		// Mock real-time exam monitoring
		const mock_active_exams = [
			{
				id: 1,
				subject: "Toán học",
				start_time: "10:00 AM",
				end_time: "12:00 PM",
				room: "Phòng A1",
				students_present: 23,
				total_students: 25,
				proctor: "Giáo viên Nguyễn",
				status: "in_progress",
			},
			{
				id: 2,
				subject: "Tiếng Anh",
				start_time: "2:00 PM",
				end_time: "4:00 PM",
				room: "Phòng B2",
				students_present: 18,
				total_students: 20,
				proctor: "Giáo viên Trần",
				status: "starting_soon",
			},
		];

		set_active_exams(mock_active_exams);

		// Mock real-time updates
		const interval = setInterval(() => {
			set_active_exams((prev) =>
				prev.map((exam) => ({
					...exam,
					students_present: Math.min(
						exam.students_present + Math.floor(Math.random() * 2),
						exam.total_students
					),
				}))
			);
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	const get_status_badge = (status) => {
		switch (status) {
			case "in_progress":
				return (
					<span className="badge badge-success">Đang diễn ra</span>
				);
			case "starting_soon":
				return <span className="badge badge-warning">Sắp bắt đầu</span>;
			case "completed":
				return (
					<span className="badge badge-secondary">Hoàn thành</span>
				);
			default:
				return (
					<span className="badge badge-secondary">
						Không xác định
					</span>
				);
		}
	};

	return (
		<div className="card mb-4">
			<div className="card-header d-flex justify-content-between align-items-center">
				<h5 className="mb-0">Kiểm Tra Kỳ Thi Realtime</h5>
				<span
					className={`badge ${
						monitoring_status === "active"
							? "badge-success"
							: "badge-danger"
					}`}
				>
					{monitoring_status === "active"
						? "🟢 Đang giám sát"
						: "🔴 Tạm dừng"}
				</span>
			</div>
			<div className="card-body">
				{active_exams.length > 0 ? (
					<div className="table-responsive">
						<table className="table table-sm">
							<thead>
								<tr>
									<th>Môn thi</th>
									<th>Thời gian</th>
									<th>Phòng</th>
									<th>Học sinh</th>
									<th>Giám thị</th>
									<th>Trạng thái</th>
								</tr>
							</thead>
							<tbody>
								{active_exams.map((exam) => (
									<tr key={exam.id}>
										<td>{exam.subject}</td>
										<td>
											{exam.start_time} - {exam.end_time}
										</td>
										<td>{exam.room}</td>
										<td>
											<span
												className={`badge ${
													exam.students_present ===
													exam.total_students
														? "badge-success"
														: "badge-warning"
												}`}
											>
												{exam.students_present}/
												{exam.total_students}
											</span>
										</td>
										<td>{exam.proctor}</td>
										<td>{get_status_badge(exam.status)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-muted">
						Hiện tại không có kỳ thi nào đang diễn ra
					</p>
				)}
			</div>
		</div>
	);
}

// Updated role-based stats to match Vietnamese context
function AdminDashboardStats() {
	const [admin_stats, set_admin_stats] = useState({
		total_exam_sessions: 0,
		registered_students: 0,
		active_teachers: 0,
		schedule_conflicts: 0,
		pending_registrations: 0,
	});

	useEffect(() => {
		set_admin_stats({
			total_exam_sessions: 45,
			registered_students: 250,
			active_teachers: 15,
			schedule_conflicts: 3,
			pending_registrations: 8,
		});
	}, []);

	return (
		<div className="row mb-4">
			<div className="col-md-2">
				<div className="card text-center">
					<div className="card-body">
						<h6 className="card-title">Tổng Kỳ Thi</h6>
						<h3 className="text-primary">
							{admin_stats.total_exam_sessions}
						</h3>
					</div>
				</div>
			</div>
			<div className="col-md-3">
				<div className="card text-center">
					<div className="card-body">
						<h6 className="card-title">Học Sinh Đăng Ký</h6>
						<h3 className="text-success">
							{admin_stats.registered_students}
						</h3>
					</div>
				</div>
			</div>
			<div className="col-md-2">
				<div className="card text-center">
					<div className="card-body">
						<h6 className="card-title">Giáo Viên</h6>
						<h3 className="text-info">
							{admin_stats.active_teachers}
						</h3>
					</div>
				</div>
			</div>
			<div className="col-md-3">
				<div className="card text-center">
					<div className="card-body">
						<h6 className="card-title">Xung Đột Lịch</h6>
						<h3 className="text-warning">
							{admin_stats.schedule_conflicts}
						</h3>
					</div>
				</div>
			</div>
			<div className="col-md-2">
				<div className="card text-center">
					<div className="card-body">
						<h6 className="card-title">Chờ Duyệt</h6>
						<h3 className="text-danger">
							{admin_stats.pending_registrations}
						</h3>
					</div>
				</div>
			</div>
		</div>
	);
}

// Component to check if server is running
/**
 * ServerHealthCheck Component
 * 
 * Real-time health monitoring for the exam management system server.
 * Uses WebSocket for live connection status and provides role-based error messages.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.current_user_role - Current user role (student/teacher/admin)
 */
function ServerHealthCheck({ current_user_role }) {
    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const [server_status, set_server_status] = useState("Đang kiểm tra...");
    const [is_loading, set_is_loading] = useState(true);
    const [is_connected, set_is_connected] = useState(false);
    const [responses, set_responses] = useState([]);

    // ============================================
    // ERROR MESSAGE HELPERS
    // ============================================
    
    /**
     * Generate role-appropriate error messages for general errors
     * Admin sees technical details, others see user-friendly messages
     */
    const get_error_message_for_role = (error, user_role) => {
        switch (user_role) {
            case "admin":
                return `Error ${error.code}: ${error.message}`;
            case "teacher":
            case "student":
                return `❌ Lỗi kết nối (Mã lỗi: ${error.code || "UNKNOWN"})`;
            default:
                return "❌ Lỗi hệ thống";
        }
    };

    /**
     * Generate role-appropriate error messages for connection failures
     * Different levels of detail based on user role
     */
    const get_connection_error_message = (error, user_role) => {
        switch (user_role) {
            case "admin":
                return `❌ Không thể kết nối server: ${error.message}`;
            case "teacher":
            case "student":
                return `❌ Máy chủ không phản hồi (Mã lỗi: CONN_REFUSED)`;
            default:
                return "❌ Lỗi kết nối hệ thống";
        }
    };

    /**
     * Create standardized error response object
     * Admin gets full error details, others get limited info for security
     */
    const create_error_response = (error, user_role) => {
        const base_response = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            server_status: "error",
            received_at: new Date().toLocaleString(),
        };

        if (user_role === "admin") {
            return {
                ...base_response,
                connection_id: "unknown",
                error_message: error.message,
                error_stack: error.stack,
            };
        } else {
            return {
                ...base_response,
                connection_id: "hidden",
                error_code: error.code || "CONN_ERROR",
            };
        }
    };

    // ============================================
    // RESPONSE VALIDATION HELPERS
    // ============================================
    
    /**
     * Validate server response data
     * Returns true if valid, false otherwise
     */
    const validate_server_response = (server_data) => {
        if (!server_data) {
            console.warn("⚠️ Received empty response from server");
            set_server_status("⚠️ Phản hồi máy chủ không đầy đủ");
            return false;
        }

        if (!server_data.server_status) {
            console.warn("Health pong missing server_status field");
            set_server_status("⚠️ Phản hồi máy chủ không đầy đủ");
            return false;
        }

        return true;
    };

    /**
     * Process valid server response
     * Updates UI status and response history
     */
    const process_server_response = (server_data) => {
        // Update status display based on server health
        if (server_data.server_status === "healthy") {
            set_server_status("✅ Máy chủ hoạt động bình thường");
        } else {
            set_server_status("❌ Máy chủ không phản hồi");
        }

        // Create response record for history
        const new_response = {
            id: Date.now(),
            timestamp: server_data.timestamp,
            server_status: server_data.server_status,
            connection_id: server_data.connection_id,
            received_at: new Date().toLocaleString(),
        };

        // Keep only last 5 responses
        set_responses((prev) => [new_response, ...prev].slice(0, 5));
    };

    // ============================================
    // WEBSOCKET CONNECTION EFFECT
    // ============================================
    useEffect(() => {
        console.log(`🔌 Initializing health check for role: ${current_user_role}`);
        
        // Initialize WebSocket connection to server
		const socket_url = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
        const socket = io(socket_url);
        let ping_interval = null;

        // ========== CONNECTION HANDLERS ==========
        
        socket.on("connect", () => {
            console.log("WebSocket connected for health check");
            console.log(`🔌 Client connected: ${socket.id}`);
            console.log('📝 Note: Each browser tab creates a separate connection');
    
            set_is_loading(false);
            set_is_connected(true);

            // Send initial health ping
            socket.emit("health_ping");

            ping_interval = setInterval(() => {
                if (socket.connected) {
                    console.log("Sending health ping...");
                    socket.emit("health_ping");
                }
            }, 15000);
        });

        socket.on("disconnect", () => {
            console.log("WebSocket disconnected");
            
            if (!socket.disconnected) {
                console.error(`Failed to close connection!`);
            }
        });

        // ========== RESPONSE HANDLERS ==========
        
        socket.on("health_pong", (server_data) => {
            try {
                console.log("Received health response: ", server_data);

                // Validate response data
                if (!validate_server_response(server_data)) {
                    return; // Early exit if invalid
                }

                // Process valid response
                process_server_response(server_data);

            } catch (error) {
                console.error("Error handling health pong: ", error);

                // Generate role-appropriate error message
                const error_message = get_error_message_for_role(
                    error,
                    current_user_role
                );
                set_server_status(error_message);

                // Add error to response history
                const error_response = create_error_response(
                    error,
                    current_user_role
                );
                set_responses((prev) => [error_response, ...prev].slice(0, 5));
            }
        });

        // ========== ERROR HANDLERS ==========
        
        socket.on("connect_error", (error) => {
            console.error(`WebSocket connection failed: ${error}`);
            set_is_connected(false);
            set_is_loading(false);

            // Set role-appropriate error message
            set_server_status(
                get_connection_error_message(error, current_user_role)
            );
        });

        // ========== CLEANUP ==========
        
        return () => {
            console.log("🧹 Cleaning up health check...");

            // Clear ping interval if it exists
            if (ping_interval) {
                console.log("Clearing ping interval");
                clearInterval(ping_interval);
                ping_interval = null;
            }

            // Disconnect WebSocket
            if (socket && socket.connected) {
                console.log("Disconnecting WebSocket");
                socket.disconnect();
            }
            console.log("🔌 Health check WebSocket cleaned up ✅");
        };
    }, [current_user_role]);

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Trạng Thái Hệ Thống</h5>
                <span
                    className={`badge ${
                        is_connected ? "badge-success" : "badge-danger"
                    }`}
                >
                    {is_connected ? "🟢 Kết nối" : "🔴 Mất kết nối"}
                </span>
            </div>
            <div className="card-body">
                {is_loading ? (
                    <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <span>Đang kiểm tra máy chủ...</span>
                    </div>
                ) : (
					<>
                    <p className="mb-0">{server_status}</p>
					
					{/* Show response history */}
					{responses.length > 0 && (
						<div className="mt-3">
							<h6>Lịch sử kiểm tra gần đây:</h6>
							<div className="table-responsive">
								<table className="table table-sm">
									<thead>
										<tr>
											<th>Thời gian</th>
											<th>Trạng thái</th>
											{current_user_role === "admin" && <th>Connection ID</th>}
										</tr>
									</thead>
									<tbody>
										{responses.map((response) => (
											<tr key={response.id}>
												<td>{response.received_at}</td>
												<td>
													<span className={`badge ${
														response.server_status === "healthy" 
															? "badge-success" 
															: "badge-danger"
													}`}>
														{response.server_status === "healthy" 
															? "✅ Hoạt động" 
															: "❌ Lỗi"}
													</span>
												</td>
												{current_user_role === "admin" && (
													<td><small className="text-muted">{response.connection_id}</small></td>
												)}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
					</>
                )}
            </div>
        </div>
    );
}

function App() {
	const [current_user_role, set_current_user_role] = useState("student");

	return (
		<div className="App">
			<header className="App-header bg-primary text-white py-3">
				<div className="container">
					<h1 className="mb-0">
						Hệ Thống Quản Lý Đăng Ký & Xếp Lịch Thi
					</h1>
					<small>
						Kiểm tra thời gian thực - WebSocket + Dashboard
					</small>
				</div>
			</header>
			<main className="container my-4">
				<div className="row">
					<div className="col-12">
						<ServerHealthCheck
							current_user_role={current_user_role}
						/>

						{/* Role selector */}
						<div className="card mb-4">
							<div className="card-header">
								<h5 className="mb-0">
									Vai trò:{" "}
									{current_user_role === "student"
										? "Học sinh"
										: current_user_role === "teacher"
										? "Giáo viên"
										: "Quản trị viên"}
								</h5>
							</div>
							<div className="card-body">
								<div className="btn-group" role="group">
									<button
										className={`btn ${
											current_user_role === "student"
												? "btn-primary"
												: "btn-outline-primary"
										}`}
										onClick={() =>
											set_current_user_role("student")
										}
									>
										👨‍🎓 Học sinh
									</button>
									<button
										className={`btn ${
											current_user_role === "teacher"
												? "btn-success"
												: "btn-outline-success"
										}`}
										onClick={() =>
											set_current_user_role("teacher")
										}
									>
										👨‍🏫 Giáo viên
									</button>
									<button
										className={`btn ${
											current_user_role === "admin"
												? "btn-danger"
												: "btn-outline-danger"
										}`}
										onClick={() =>
											set_current_user_role("admin")
										}
									>
										👨‍💼 Quản trị viên
									</button>
								</div>
							</div>
						</div>

						{/* Real-time features matching project description */}
						<RealTimeNotifications />
						<ScheduleOptimization />
						<RealTimeExamMonitoring />
						<AdminDashboardStats />
					</div>
				</div>
			</main>
			<footer className="bg-light py-3 mt-auto">
				<div className="container text-center">
					<p className="mb-0 text-muted">
						© 2024 Hệ Thống Quản Lý Thi - Dành cho trường học và
						trung tâm đào tạo
					</p>
				</div>
			</footer>
		</div>
	);
}

export default App;