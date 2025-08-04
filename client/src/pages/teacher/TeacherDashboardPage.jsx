import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getTeacherSchedule, getTeacherClasses } from "../../services/apiService";

function TeacherDashboardPage({ current_user_role, current_user_id, current_full_name }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [my_classes, set_my_classes] = useState([]);
    const [upcoming_exams, set_upcoming_exams] = useState([]);
    const [proctoring_assignments, set_proctoring_assignments] = useState([]);
    const [loading, set_loading] = useState(true);
    const [stats, set_stats] = useState({
        total_classes: 0,
        total_students: 0,
        upcoming_exams: 0,
        proctoring_duties: 0
    });

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        // TODO: Replace with actual API calls
        console.log('👨‍🏫 Loading teacher dashboard data...');
        
        setTimeout(() => {
            const mock_classes = [
                {
                    class_id: 1,
                    class_code: '12A1',
                    class_name: 'Lớp 12A1 - Khối Tự Nhiên',
                    grade_level: 12,
                    student_count: 32,
                    max_students: 35,
                    academic_year: '2024-2025',
                    role: 'homeroom_teacher',
                    subjects: [
                        { subject_code: 'MATH12', subject_name: 'Toán học 12' },
                        { subject_code: 'PHYS12', subject_name: 'Vật lý 12' }
                    ]
                },
                {
                    class_id: 2,
                    class_code: '11B2',
                    class_name: 'Lớp 11B2 - Khối Xã Hội',
                    grade_level: 11,
                    student_count: 28,
                    max_students: 35,
                    academic_year: '2024-2025',
                    role: 'subject_teacher',
                    subjects: [
                        { subject_code: 'MATH11', subject_name: 'Toán học 11' }
                    ]
                }
            ];

            const mock_upcoming_exams = [
                {
                    exam_id: 1,
                    title: 'Kiểm tra giữa kỳ Toán 12',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    exam_date: '2025-08-15',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    room_name: 'Phòng A1',
                    class_code: '12A1',
                    student_count: 32,
                    my_role: 'subject_teacher'
                },
                {
                    exam_id: 2,
                    title: 'Thi cuối kỳ Vật lý 12',
                    subject_code: 'PHYS12',
                    subject_name: 'Vật lý 12',
                    exam_date: '2025-08-20',
                    start_time: '14:00:00',
                    end_time: '16:30:00',
                    room_name: 'Phòng B2',
                    class_code: '12A1',
                    student_count: 32,
                    my_role: 'proctor'
                }
            ];

            const mock_proctoring = [
                {
                    exam_id: 3,
                    title: 'Thi Hóa học 11',
                    subject_code: 'CHEM11',
                    subject_name: 'Hóa học 11',
                    exam_date: '2025-08-18',
                    start_time: '08:00:00',
                    end_time: '10:00:00',
                    room_name: 'Phòng C1',
                    student_count: 30,
                    role: 'main_proctor'
                }
            ];

            set_my_classes(mock_classes);
            set_upcoming_exams(mock_upcoming_exams);
            set_proctoring_assignments(mock_proctoring);
            set_stats({
                total_classes: mock_classes.length,
                total_students: mock_classes.reduce((sum, cls) => sum + cls.student_count, 0),
                upcoming_exams: mock_upcoming_exams.length,
                proctoring_duties: mock_proctoring.length
            });
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_role_badge = (role) => {
        switch (role) {
            case 'homeroom_teacher':
                return <span className="badge bg-primary">Chủ nhiệm</span>;
            case 'subject_teacher':
                return <span className="badge bg-success">Giáo viên môn</span>;
            case 'proctor':
                return <span className="badge bg-info">Giám thị</span>;
            case 'main_proctor':
                return <span className="badge bg-warning text-dark">Giám thị chính</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const get_days_until_exam = (exam_date) => {
        const today = new Date();
        const exam = new Date(exam_date);
        const diff_time = exam - today;
        const diff_days = Math.ceil(diff_time / (1000 * 60 * 60 * 24));
        return diff_days;
    };

    const get_urgency_badge = (days_until) => {
        if (days_until < 0) {
            return <span className="badge bg-secondary">Đã qua</span>;
        } else if (days_until === 0) {
            return <span className="badge bg-danger">Hôm nay</span>;
        } else if (days_until === 1) {
            return <span className="badge bg-warning text-dark">Ngày mai</span>;
        } else if (days_until <= 7) {
            return <span className="badge bg-info text-dark">{days_until} ngày nữa</span>;
        } else {
            return <span className="badge bg-light text-dark">{days_until} ngày nữa</span>;
        }
    };

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'teacher') {
        return <AccessDeniedPage />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Dashboard Giáo viên", icon: "bi-person-workspace" }
    ];

    return (
        <div className="container-fluid">
            <Breadcrumb items={breadcrumb_items} />
            
            <div className="row">
                {/* Welcome Header */}
                <div className="col-12 mb-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h4 className="card-title mb-1">
                                <i className="bi bi-person-workspace me-2"></i>
                                Xin chào, {current_full_name}!
                            </h4>
                            <p className="card-text mb-0">
                                Bạn đang quản lý {stats.total_classes} lớp học với {stats.total_students} học sinh
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="col-md-3 mb-4">
                    <div className="card text-center border-primary">
                        <div className="card-body">
                            <i className="bi bi-door-open display-4 text-primary"></i>
                            <h5 className="card-title mt-2">{stats.total_classes}</h5>
                            <p className="card-text text-muted">Lớp học</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-success">
                        <div className="card-body">
                            <i className="bi bi-people display-4 text-success"></i>
                            <h5 className="card-title mt-2">{stats.total_students}</h5>
                            <p className="card-text text-muted">Học sinh</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-warning">
                        <div className="card-body">
                            <i className="bi bi-calendar-check display-4 text-warning"></i>
                            <h5 className="card-title mt-2">{stats.upcoming_exams}</h5>
                            <p className="card-text text-muted">Kỳ thi sắp tới</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-info">
                        <div className="card-body">
                            <i className="bi bi-eye display-4 text-info"></i>
                            <h5 className="card-title mt-2">{stats.proctoring_duties}</h5>
                            <p className="card-text text-muted">Nhiệm vụ giám thị</p>
                        </div>
                    </div>
                </div>

                {/* My Classes */}
                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-door-open me-2"></i>
                                Lớp học của tôi
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                </div>
                            ) : my_classes.length === 0 ? (
                                <div className="text-center py-3 text-muted">
                                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                    Không có lớp học nào
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {my_classes.map(cls => (
                                        <div key={cls.class_id} className="list-group-item border-0 px-0">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="mb-1">
                                                        <span className="badge bg-secondary me-2">{cls.class_code}</span>
                                                        {cls.class_name}
                                                    </h6>
                                                    <p className="mb-1 text-muted small">
                                                        <i className="bi bi-people me-1"></i>
                                                        {cls.student_count}/{cls.max_students} học sinh
                                                    </p>
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        {cls.subjects.map(subject => (
                                                            <span key={subject.subject_code} className="badge bg-light text-dark">
                                                                {subject.subject_name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    {get_role_badge(cls.role)}
                                                    <div className="mt-1">
                                                        <button className="btn btn-outline-primary btn-sm">
                                                            <i className="bi bi-eye me-1"></i>
                                                            Xem chi tiết
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Exams */}
                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-calendar-check me-2"></i>
                                Kỳ thi sắp tới
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                </div>
                            ) : upcoming_exams.length === 0 ? (
                                <div className="text-center py-3 text-muted">
                                    <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                                    Không có kỳ thi nào
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {upcoming_exams.map(exam => {
                                        const days_until = get_days_until_exam(exam.exam_date);
                                        
                                        return (
                                            <div key={exam.exam_id} className="list-group-item border-0 px-0">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6 className="mb-1">{exam.title}</h6>
                                                        <p className="mb-1 text-muted small">
                                                            <i className="bi bi-calendar3 me-1"></i>
                                                            {new Date(exam.exam_date).toLocaleDateString('vi-VN')} • {exam.start_time} - {exam.end_time}
                                                        </p>
                                                        <p className="mb-1 text-muted small">
                                                            <i className="bi bi-geo-alt me-1"></i>
                                                            {exam.room_name} • {exam.student_count} học sinh
                                                        </p>
                                                    </div>
                                                    <div className="text-end">
                                                        {get_urgency_badge(days_until)}
                                                        <div className="mt-1">
                                                            {get_role_badge(exam.my_role)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Proctoring Assignments */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-eye me-2"></i>
                                Nhiệm vụ giám thị
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                </div>
                            ) : proctoring_assignments.length === 0 ? (
                                <div className="text-center py-3 text-muted">
                                    <i className="bi bi-shield-check fs-1 d-block mb-2"></i>
                                    Không có nhiệm vụ giám thị nào
                                </div>
                            ) : (
                                <div className="row">
                                    {proctoring_assignments.map(exam => {
                                        const days_until = get_days_until_exam(exam.exam_date);
                                        
                                        return (
                                            <div key={exam.exam_id} className="col-md-4 mb-3">
                                                <div className="card border-start border-4 border-info">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="badge bg-info">{exam.subject_code}</span>
                                                            {get_urgency_badge(days_until)}
                                                        </div>
                                                        
                                                        <h6 className="card-title">{exam.title}</h6>
                                                        <p className="text-muted small mb-2">{exam.subject_name}</p>
                                                        
                                                        <div className="row text-center mb-3">
                                                            <div className="col-6">
                                                                <div className="border-end">
                                                                    <i className="bi bi-calendar3 d-block text-info"></i>
                                                                    <small>{new Date(exam.exam_date).toLocaleDateString('vi-VN')}</small>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <i className="bi bi-clock d-block text-info"></i>
                                                                <small>{exam.start_time} - {exam.end_time}</small>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="small mb-2">
                                                            <div className="d-flex justify-content-between">
                                                                <span><i className="bi bi-geo-alt me-1"></i>Phòng:</span>
                                                                <strong>{exam.room_name}</strong>
                                                            </div>
                                                            <div className="d-flex justify-content-between">
                                                                <span><i className="bi bi-people me-1"></i>Học sinh:</span>
                                                                <strong>{exam.student_count}</strong>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            {get_role_badge(exam.role)}
                                                            <button className="btn btn-outline-info btn-sm">
                                                                <i className="bi bi-eye me-1"></i>
                                                                Chi tiết
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboardPage;
