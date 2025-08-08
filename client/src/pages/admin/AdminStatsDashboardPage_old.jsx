import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getSystemStatistics, getEnrollmentStatistics, getExamStatistics } from "../../services/apiService";

function AdminStatsDashboardPage({ current_user_role }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [system_stats, set_system_stats] = useState({});
    const [enrollment_stats, set_enrollment_stats] = useState({});
    const [exam_stats, set_exam_stats] = useState({});
    const [loading, set_loading] = useState(true);
    const [selected_period, set_selected_period] = useState('current_semester');
    // TODO: const [chart_data, set_chart_data] = useState({});

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        console.log('📊 Loading admin statistics...');
        
        setTimeout(() => {
            const mock_system_stats = {
                total_users: 1247,
                total_students: 945,
                total_teachers: 48,
                total_admins: 4,
                active_users: 1198,
                total_subjects: 25,
                total_classes: 36,
                total_rooms: 18,
                total_exams: 156,
                published_exams: 142,
                draft_exams: 14,
                completed_exams: 89,
                upcoming_exams: 53,
                total_registrations: 4287,
                approved_registrations: 4156,
                pending_registrations: 131,
                avg_class_size: 26.3,
                system_utilization: 85.4
            };

            const mock_enrollment_stats = {
                by_grade: [
                    { grade: 10, students: 315, classes: 12 },
                    { grade: 11, students: 298, classes: 12 },
                    { grade: 12, students: 332, classes: 12 }
                ],
                by_subject: [
                    { subject_code: 'MATH', subject_name: 'Toán học', enrolled: 945, capacity: 1000 },
                    { subject_code: 'PHYS', subject_name: 'Vật lý', enrolled: 687, capacity: 800 },
                    { subject_code: 'CHEM', subject_name: 'Hóa học', enrolled: 623, capacity: 700 },
                    { subject_code: 'LIT', subject_name: 'Ngữ văn', enrolled: 945, capacity: 1000 },
                    { subject_code: 'ENG', subject_name: 'Tiếng Anh', enrolled: 945, capacity: 1000 }
                ],
                enrollment_trend: [
                    { month: 'Tháng 8', enrollments: 234 },
                    { month: 'Tháng 9', enrollments: 189 },
                    { month: 'Tháng 10', enrollments: 156 },
                    { month: 'Tháng 11', enrollments: 98 },
                    { month: 'Tháng 12', enrollments: 67 }
                ]
            };

            const mock_exam_stats = {
                by_status: [
                    { status: 'completed', count: 89, percentage: 57.1 },
                    { status: 'upcoming', count: 53, percentage: 34.0 },
                    { status: 'draft', count: 14, percentage: 8.9 }
                ],
                by_subject: [
                    { subject_code: 'MATH', exam_count: 24, avg_score: 7.8 },
                    { subject_code: 'PHYS', exam_count: 18, avg_score: 7.2 },
                    { subject_code: 'CHEM', exam_count: 16, avg_score: 7.5 },
                    { subject_code: 'LIT', exam_count: 22, avg_score: 8.1 },
                    { subject_code: 'ENG', exam_count: 20, avg_score: 7.9 }
                ],
                performance_trend: [
                    { month: 'Tháng 8', avg_score: 7.8, exam_count: 45 },
                    { month: 'Tháng 9', avg_score: 7.6, exam_count: 38 },
                    { month: 'Tháng 10', avg_score: 7.9, exam_count: 42 },
                    { month: 'Tháng 11', avg_score: 8.0, exam_count: 31 }
                ],
                room_utilization: [
                    { room_name: 'Phòng A1', utilization: 95.2 },
                    { room_name: 'Phòng A2', utilization: 87.3 },
                    { room_name: 'Phòng B1', utilization: 91.6 },
                    { room_name: 'Phòng B2', utilization: 78.4 },
                    { room_name: 'Phòng C1', utilization: 82.1 }
                ]
            };

            set_system_stats(mock_system_stats);
            set_enrollment_stats(mock_enrollment_stats);
            set_exam_stats(mock_exam_stats);
            set_loading(false);
        }, 1500);
    }, [selected_period]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_performance_color = (percentage) => {
        if (percentage >= 90) return 'text-success';
        if (percentage >= 70) return 'text-warning';
        return 'text-danger';
    };

    const get_status_badge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="badge bg-success">Hoàn thành</span>;
            case 'upcoming':
                return <span className="badge bg-primary">Sắp tới</span>;
            case 'draft':
                return <span className="badge bg-secondary">Bản nháp</span>;
            default:
                return <span className="badge bg-secondary">Khác</span>;
        }
    };

    const calculate_utilization_color = (utilization) => {
        if (utilization >= 90) return 'bg-danger';
        if (utilization >= 80) return 'bg-warning';
        if (utilization >= 60) return 'bg-success';
        return 'bg-info';
    };

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'admin') {
        return <AccessDeniedPage />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Dashboard", link: "/main" },
        { label: "Thống kê Hệ thống", icon: "bi-graph-up-arrow" }
    ];

    return (
        <div className="container-fluid">
            <Breadcrumb items={breadcrumb_items} />
            
            <div className="row">
                {/* Header */}
                <div className="col-12 mb-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-8">
                                    <h4 className="card-title mb-1">
                                        <i className="bi bi-graph-up-arrow me-2"></i>
                                        Thống kê Hệ thống ExamPro
                                    </h4>
                                    <p className="card-text mb-0">
                                        Tổng quan về hoạt động và hiệu suất của hệ thống quản lý thi cử
                                    </p>
                                </div>
                                <div className="col-md-4">
                                    <select 
                                        className="form-select"
                                        value={selected_period}
                                        onChange={(e) => set_selected_period(e.target.value)}
                                    >
                                        <option value="current_semester">Học kỳ hiện tại</option>
                                        <option value="current_year">Năm học hiện tại</option>
                                        <option value="last_semester">Học kỳ trước</option>
                                        <option value="all_time">Toàn bộ thời gian</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="col-12">
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-3 text-muted">Đang tải thống kê hệ thống...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* System Overview Stats */}
                        <div className="col-12 mb-4">
                            <h5 className="mb-3">
                                <i className="bi bi-speedometer2 me-2"></i>
                                Tổng quan Hệ thống
                            </h5>
                            <div className="row">
                                <div className="col-md-2 mb-3">
                                    <div className="card text-center border-primary">
                                        <div className="card-body">
                                            <i className="bi bi-people display-4 text-primary"></i>
                                            <h5 className="card-title mt-2">{system_stats.total_users?.toLocaleString()}</h5>
                                            <p className="card-text text-muted">Tổng người dùng</p>
                                            <small className="text-success">
                                                <i className="bi bi-check-circle me-1"></i>
                                                {system_stats.active_users?.toLocaleString()} hoạt động
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-2 mb-3">
                                    <div className="card text-center border-success">
                                        <div className="card-body">
                                            <i className="bi bi-mortarboard display-4 text-success"></i>
                                            <h5 className="card-title mt-2">{system_stats.total_students?.toLocaleString()}</h5>
                                            <p className="card-text text-muted">Học sinh</p>
                                            <small className="text-info">
                                                Trung bình {system_stats.avg_class_size} HS/lớp
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-2 mb-3">
                                    <div className="card text-center border-warning">
                                        <div className="card-body">
                                            <i className="bi bi-person-workspace display-4 text-warning"></i>
                                            <h5 className="card-title mt-2">{system_stats.total_teachers}</h5>
                                            <p className="card-text text-muted">Giáo viên</p>
                                            <small className="text-info">
                                                {system_stats.total_classes} lớp học
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-2 mb-3">
                                    <div className="card text-center border-info">
                                        <div className="card-body">
                                            <i className="bi bi-book display-4 text-info"></i>
                                            <h5 className="card-title mt-2">{system_stats.total_subjects}</h5>
                                            <p className="card-text text-muted">Môn học</p>
                                            <small className="text-info">
                                                {system_stats.total_rooms} phòng thi
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-2 mb-3">
                                    <div className="card text-center border-danger">
                                        <div className="card-body">
                                            <i className="bi bi-clipboard-check display-4 text-danger"></i>
                                            <h5 className="card-title mt-2">{system_stats.total_exams}</h5>
                                            <p className="card-text text-muted">Tổng kỳ thi</p>
                                            <small className="text-success">
                                                {system_stats.published_exams} đã xuất bản
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-2 mb-3">
                                    <div className="card text-center border-secondary">
                                        <div className="card-body">
                                            <i className="bi bi-speedometer display-4 text-secondary"></i>
                                            <h5 className="card-title mt-2">{system_stats.system_utilization}%</h5>
                                            <p className="card-text text-muted">Hiệu suất HT</p>
                                            <small className={get_performance_color(system_stats.system_utilization)}>
                                                <i className="bi bi-graph-up me-1"></i>
                                                {system_stats.system_utilization >= 80 ? 'Tốt' : 'Cần cải thiện'}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Statistics */}
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        <i className="bi bi-person-plus me-2"></i>
                                        Thống kê Đăng ký
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {/* By Grade */}
                                    <h6 className="mb-3">Theo Khối lớp</h6>
                                    <div className="row mb-4">
                                        {enrollment_stats.by_grade?.map(grade => (
                                            <div key={grade.grade} className="col-4 text-center">
                                                <div className="card border-light">
                                                    <div className="card-body py-2">
                                                        <h5 className="text-primary">Khối {grade.grade}</h5>
                                                        <p className="mb-1">{grade.students} HS</p>
                                                        <small className="text-muted">{grade.classes} lớp</small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Subject Enrollment */}
                                    <h6 className="mb-3">Đăng ký theo Môn học</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Môn học</th>
                                                    <th>Đã đăng ký</th>
                                                    <th>Sức chứa</th>
                                                    <th>Tỷ lệ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {enrollment_stats.by_subject?.map(subject => {
                                                    const percentage = (subject.enrolled / subject.capacity) * 100;
                                                    return (
                                                        <tr key={subject.subject_code}>
                                                            <td>{subject.subject_name}</td>
                                                            <td>{subject.enrolled}</td>
                                                            <td>{subject.capacity}</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="progress flex-grow-1 me-2" style={{height: '6px'}}>
                                                                        <div 
                                                                            className={`progress-bar ${calculate_utilization_color(percentage)}`}
                                                                            style={{width: `${percentage}%`}}
                                                                        ></div>
                                                                    </div>
                                                                    <small>{percentage.toFixed(1)}%</small>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Exam Statistics */}
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        <i className="bi bi-clipboard-data me-2"></i>
                                        Thống kê Thi cử
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {/* Exam Status */}
                                    <h6 className="mb-3">Trạng thái Kỳ thi</h6>
                                    <div className="row mb-4">
                                        {exam_stats.by_status?.map(status => (
                                            <div key={status.status} className="col-4 text-center">
                                                <div className="card border-light">
                                                    <div className="card-body py-2">
                                                        {get_status_badge(status.status)}
                                                        <h5 className="mt-2">{status.count}</h5>
                                                        <small className="text-muted">{status.percentage}%</small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Performance by Subject */}
                                    <h6 className="mb-3">Hiệu suất theo Môn học</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Môn học</th>
                                                    <th>Số kỳ thi</th>
                                                    <th>Điểm TB</th>
                                                    <th>Xếp hạng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {exam_stats.by_subject?.map((subject, index) => (
                                                    <tr key={subject.subject_code}>
                                                        <td>{subject.subject_code}</td>
                                                        <td>{subject.exam_count}</td>
                                                        <td>
                                                            <span className={`fw-bold ${get_performance_color(subject.avg_score * 10)}`}>
                                                                {subject.avg_score.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-dark">#{index + 1}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Room Utilization */}
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        <i className="bi bi-door-open me-2"></i>
                                        Sử dụng Phòng thi
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {exam_stats.room_utilization?.map(room => (
                                        <div key={room.room_name} className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="fw-semibold">{room.room_name}</span>
                                                <span className={`${get_performance_color(room.utilization)}`}>
                                                    {room.utilization.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="progress" style={{height: '8px'}}>
                                                <div 
                                                    className={`progress-bar ${calculate_utilization_color(room.utilization)}`}
                                                    style={{width: `${room.utilization}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        <i className="bi bi-activity me-2"></i>
                                        Hoạt động Gần đây
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="list-group list-group-flush">
                                        <div className="list-group-item border-0 px-0">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-person-plus text-success me-3"></i>
                                                <div>
                                                    <h6 className="mb-1">23 học sinh mới đăng ký</h6>
                                                    <small className="text-muted">2 giờ trước</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="list-group-item border-0 px-0">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-clipboard-check text-primary me-3"></i>
                                                <div>
                                                    <h6 className="mb-1">5 kỳ thi được xuất bản</h6>
                                                    <small className="text-muted">4 giờ trước</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="list-group-item border-0 px-0">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-door-open text-warning me-3"></i>
                                                <div>
                                                    <h6 className="mb-1">2 phòng thi được bảo trì</h6>
                                                    <small className="text-muted">6 giờ trước</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="list-group-item border-0 px-0">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-graph-up text-info me-3"></i>
                                                <div>
                                                    <h6 className="mb-1">Báo cáo tuần được tạo</h6>
                                                    <small className="text-muted">1 ngày trước</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        <i className="bi bi-lightning me-2"></i>
                                        Hành động Nhanh
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-3 mb-2">
                                            <button className="btn btn-primary w-100">
                                                <i className="bi bi-file-earmark-text me-2"></i>
                                                Tạo báo cáo
                                            </button>
                                        </div>
                                        <div className="col-md-3 mb-2">
                                            <button className="btn btn-success w-100">
                                                <i className="bi bi-download me-2"></i>
                                                Xuất dữ liệu
                                            </button>
                                        </div>
                                        <div className="col-md-3 mb-2">
                                            <button className="btn btn-warning w-100">
                                                <i className="bi bi-gear me-2"></i>
                                                Cấu hình hệ thống
                                            </button>
                                        </div>
                                        <div className="col-md-3 mb-2">
                                            <button className="btn btn-info w-100">
                                                <i className="bi bi-arrow-clockwise me-2"></i>
                                                Đồng bộ dữ liệu
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminStatsDashboardPage;
