import React, { useState, useEffect } from 'react';

/**
 * Main Production Page Component
 * 
 * This is the main application page that users will see in production.
 * Contains the core exam scheduling functionality without development tools.
 */

// Real-time notification system (matching "đẩy thông báo xác nhận, nhắc lịch thi")
function RealTimeNotifications() {
    const [notifications, set_notifications] = useState([]);
    const [is_connected, set_is_connected] = useState(false);

    useEffect(() => {
        // Mock real-time notifications - later implement WebSocket
        const mock_notifications = [
            {
                id: 1,
                type: 'exam_reminder',
                message: 'Nhắc nhở: Bạn có kỳ thi Toán học vào 10:00 AM ngày mai',
                timestamp: new Date().toLocaleString(),
                is_read: false
            },
            {
                id: 2,
                type: 'registration_confirmed',
                message: 'Xác nhận: Đăng ký thi Vật lý thành công',
                timestamp: new Date().toLocaleString(),
                is_read: false
            },
            {
                id: 3,
                type: 'schedule_conflict',
                message: 'Cảnh báo: Phát hiện trùng lặp lịch thi',
                timestamp: new Date().toLocaleString(),
                is_read: false
            }
        ];
        
        set_notifications(mock_notifications);
        set_is_connected(true); // Mock WebSocket connection
    }, []);

    const mark_as_read = (notification_id) => {
        set_notifications(prev => 
            prev.map(notif => 
                notif.id === notification_id ? { ...notif, is_read: true } : notif
            )
        );
    };

    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Thông Báo Realtime</h5>
                <span className={`badge ${is_connected ? 'badge-success' : 'badge-danger'}`}>
                    {is_connected ? '🟢 Kết nối' : '🔴 Mất kết nối'}
                </span>
            </div>
            <div className="card-body">
                {notifications.length > 0 ? (
                    <div className="list-group">
                        {notifications.map(notification => (
                            <div 
                                key={notification.id}
                                className={`list-group-item ${!notification.is_read ? 'bg-light' : ''}`}
                            >
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <p className="mb-1">{notification.message}</p>
                                        <small className="text-muted">{notification.timestamp}</small>
                                    </div>
                                    {!notification.is_read && (
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => mark_as_read(notification.id)}
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
    const [optimization_status, set_optimization_status] = useState('idle');
    const [conflicts_found, set_conflicts_found] = useState([]);

    const run_optimization = () => {
        set_optimization_status('running');
        
        // Mock optimization process
        setTimeout(() => {
            const mock_conflicts = [
                {
                    id: 1,
                    description: 'Hai kỳ thi cùng thời gian: Toán học và Vật lý (10:00 AM)',
                    suggested_solution: 'Chuyển kỳ thi Vật lý sang 2:00 PM'
                },
                {
                    id: 2, 
                    description: 'Phòng A1 được đặt cho 2 kỳ thi khác nhau',
                    suggested_solution: 'Sử dụng phòng B2 cho kỳ thi thứ hai'
                }
            ];
            
            set_conflicts_found(mock_conflicts);
            set_optimization_status('completed');
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
                            disabled={optimization_status === 'running'}
                        >
                            {optimization_status === 'running' ? 'Đang tối ưu...' : 'Chạy Tối Ưu Hóa'}
                        </button>
                    </div>
                    <div className="col-md-8">
                        {optimization_status === 'running' && (
                            <div className="progress">
                                <div 
                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                    style={{ width: '100%' }}
                                >
                                    Đang kiểm tra trùng lặp...
                                </div>
                            </div>
                        )}

                        {conflicts_found.length > 0 && optimization_status === 'completed' && (
                            <div className="mt-3">
                                <h6>Phát hiện {conflicts_found.length} xung đột:</h6>
                                {conflicts_found.map(conflict => (
                                    <div key={conflict.id} className="alert alert-warning">
                                        <strong>{conflict.description}</strong><br />
                                        <small>Đề xuất: {conflict.suggested_solution}</small>
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
    const [monitoring_status] = useState('active');

    useEffect(() => {
        // Mock active exams data
        const mock_exams = [
            {
                id: 1,
                title: 'Kỳ thi Toán học',
                room: 'Phòng A1',
                students_present: 28,
                total_students: 30,
                start_time: '09:00',
                end_time: '11:00',
                status: 'in_progress',
                proctor: 'GV. Nguyễn Văn A'
            },
            {
                id: 2,
                title: 'Kỳ thi Vật lý',
                room: 'Phòng B2', 
                students_present: 25,
                total_students: 25,
                start_time: '14:00',
                end_time: '16:00',
                status: 'upcoming',
                proctor: 'GV. Trần Thị B'
            }
        ];

        set_active_exams(mock_exams);

        // Update exam data every 30 seconds
        const interval = setInterval(() => {
            set_active_exams(prev => prev.map(exam => ({
                ...exam,
                students_present: exam.status === 'in_progress' 
                    ? Math.min(exam.total_students, exam.students_present + Math.floor(Math.random() * 2))
                    : exam.students_present
            })));
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const get_status_badge = (status) => {
        const badges = {
            'in_progress': 'badge-success',
            'upcoming': 'badge-primary', 
            'completed': 'badge-secondary',
            'cancelled': 'badge-danger'
        };
        return badges[status] || 'badge-secondary';
    };

    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Giám Sát Thi Realtime</h5>
                <span className={`badge ${monitoring_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {monitoring_status === 'active' ? '📡 Đang giám sát' : '⏸️ Tạm dừng'}
                </span>
            </div>
            <div className="card-body">
                {active_exams.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Kỳ thi</th>
                                    <th>Phòng</th>
                                    <th>Thí sinh</th>
                                    <th>Thời gian</th>
                                    <th>Trạng thái</th>
                                    <th>Giám thị</th>
                                </tr>
                            </thead>
                            <tbody>
                                {active_exams.map(exam => (
                                    <tr key={exam.id}>
                                        <td>{exam.title}</td>
                                        <td>{exam.room}</td>
                                        <td>
                                            <span className="text-primary">
                                                {exam.students_present}/{exam.total_students}
                                            </span>
                                        </td>
                                        <td>{exam.start_time} - {exam.end_time}</td>
                                        <td>
                                            <span className={`badge ${get_status_badge(exam.status)}`}>
                                                {exam.status === 'in_progress' && '🟢 Đang thi'}
                                                {exam.status === 'upcoming' && '🔵 Sắp bắt đầu'}
                                                {exam.status === 'completed' && '✅ Hoàn thành'}
                                                {exam.status === 'cancelled' && '❌ Đã hủy'}
                                            </span>
                                        </td>
                                        <td><small>{exam.proctor}</small></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted">Không có kỳ thi nào đang diễn ra</p>
                )}
            </div>
        </div>
    );
}

// Updated role-based stats to match Vietnamese context
function AdminDashboardStats() {
    const [stats, set_stats] = useState({
        total_students: 0,
        active_exams: 0,
        pending_registrations: 0,
        system_health: 'good'
    });

    useEffect(() => {
        // Mock stats data with Vietnamese context
        const mock_stats = {
            total_students: 1247,
            active_exams: 3,
            pending_registrations: 28,
            system_health: 'good'
        };
        
        set_stats(mock_stats);

        // Update stats every minute
        const interval = setInterval(() => {
            set_stats(prev => ({
                ...prev,
                active_exams: Math.max(0, prev.active_exams + Math.floor(Math.random() * 3) - 1),
                pending_registrations: Math.max(0, prev.pending_registrations + Math.floor(Math.random() * 10) - 5)
            }));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="row mb-4">
            <div className="col-md-3">
                <div className="card bg-primary text-white">
                    <div className="card-body">
                        <div className="d-flex justify-content-between">
                            <div>
                                <h4>{stats.total_students.toLocaleString()}</h4>
                                <p className="mb-0">Sinh viên</p>
                            </div>
                            <div className="align-self-center">
                                <i className="fas fa-users fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-3">
                <div className="card bg-success text-white">
                    <div className="card-body">
                        <div className="d-flex justify-content-between">
                            <div>
                                <h4>{stats.active_exams}</h4>
                                <p className="mb-0">Kỳ thi đang diễn ra</p>
                            </div>
                            <div className="align-self-center">
                                <i className="fas fa-clock fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-3">
                <div className="card bg-warning text-white">
                    <div className="card-body">
                        <div className="d-flex justify-content-between">
                            <div>
                                <h4>{stats.pending_registrations}</h4>
                                <p className="mb-0">Đăng ký chờ duyệt</p>
                            </div>
                            <div className="align-self-center">
                                <i className="fas fa-file-alt fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-3">
                <div className={`card ${stats.system_health === 'good' ? 'bg-info' : 'bg-danger'} text-white`}>
                    <div className="card-body">
                        <div className="d-flex justify-content-between">
                            <div>
                                <h4>
                                    {stats.system_health === 'good' ? '✅' : '❌'}
                                </h4>
                                <p className="mb-0">Trạng thái hệ thống</p>
                            </div>
                            <div className="align-self-center">
                                <i className="fas fa-server fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Production Page Component
function MainPage() {
    const [current_user_role, set_current_user_role] = useState("admin");

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>📊 ExamPro Scheduler Dashboard</h1>
                        <div>
                            <label className="me-2">Vai trò:</label>
                            <select 
                                className="form-select d-inline-block w-auto"
                                value={current_user_role}
                                onChange={(e) => set_current_user_role(e.target.value)}
                            >
                                <option value="student">Học sinh</option>
                                <option value="teacher">Giáo viên</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Dashboard Stats */}
            {current_user_role === "admin" && <AdminDashboardStats />}

            <div className="row">
                <div className="col-md-6">
                    <RealTimeNotifications />
                    <ScheduleOptimization />
                </div>
                <div className="col-md-6">
                    <RealTimeExamMonitoring />
                </div>
            </div>
        </div>
    );
}

export default MainPage;
