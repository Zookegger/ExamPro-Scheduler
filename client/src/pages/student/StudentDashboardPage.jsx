import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";

function StudentDashboardPage({ current_user_role, current_user_id, current_full_name }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [my_exams, set_my_exams] = useState([]);
    const [loading, set_loading] = useState(true);
    const [filter_status, set_filter_status] = useState('all');

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        // TODO: Replace with actual API call
        // const fetch_student_exams = async () => { ... }
        
        console.log('📚 Loading student dashboard data...');
        
        setTimeout(() => {
            const mock_student_exams = [
                {
                    exam_id: 1,
                    title: 'Kiểm tra giữa kỳ Toán học',
                    subject_code: 'MATH101',
                    subject_name: 'Toán học cơ bản',
                    exam_date: '2025-08-15',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    duration_minutes: 120,
                    room_name: 'Phòng A1',
                    building: 'Tòa A',
                    method: 'multiple_choices',
                    status: 'published',
                    registration_status: 'approved',
                    instructions: 'Mang theo CCCD và dụng cụ học tập'
                },
                {
                    exam_id: 2,
                    title: 'Thi cuối kỳ Vật lý',
                    subject_code: 'PHYS101',
                    subject_name: 'Vật lý đại cương',
                    exam_date: '2025-09-20',
                    start_time: '14:00:00',
                    end_time: '16:30:00',
                    duration_minutes: 150,
                    room_name: 'Phòng B2',
                    building: 'Tòa B',
                    method: 'essay',
                    status: 'draft',
                    registration_status: 'approved',
                    instructions: 'Thi tự luận, mang theo máy tính cầm tay'
                },
                {
                    exam_id: 3,
                    title: 'Thực hành Lập trình',
                    subject_code: 'CS101',
                    subject_name: 'Lập trình cơ bản',
                    exam_date: '2025-08-25',
                    start_time: '08:00:00',
                    end_time: '10:00:00',
                    duration_minutes: 120,
                    room_name: 'Phòng máy C1',
                    building: 'Tòa C',
                    method: 'practical',
                    status: 'published',
                    registration_status: 'pending',
                    instructions: 'Mang theo USB và đăng nhập tài khoản trường'
                }
            ];

            set_my_exams(mock_student_exams);
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_status_badge = (status) => {
        switch (status) {
            case 'published':
                return <span className="badge bg-success">Đã xuất bản</span>;
            case 'draft':
                return <span className="badge bg-secondary">Bản nháp</span>;
            case 'in_progress':
                return <span className="badge bg-warning text-dark">Đang thi</span>;
            case 'completed':
                return <span className="badge bg-primary">Hoàn thành</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const get_registration_badge = (reg_status) => {
        switch (reg_status) {
            case 'approved':
                return <span className="badge bg-success">Đã duyệt</span>;
            case 'pending':
                return <span className="badge bg-warning text-dark">Chờ duyệt</span>;
            case 'rejected':
                return <span className="badge bg-danger">Từ chối</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const get_method_text = (method) => {
        switch (method) {
            case 'multiple_choices':
                return 'Trắc nghiệm';
            case 'essay':
                return 'Tự luận';
            case 'practical':
                return 'Thực hành';
            default:
                return 'Không xác định';
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
    // FILTERING LOGIC
    // ====================================================================
    const filtered_exams = my_exams.filter(exam => {
        if (filter_status === 'all') return true;
        if (filter_status === 'upcoming') {
            return get_days_until_exam(exam.exam_date) >= 0;
        }
        if (filter_status === 'past') {
            return get_days_until_exam(exam.exam_date) < 0;
        }
        return exam.status === filter_status;
    });

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'student') {
        return <AccessDeniedPage />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Lịch thi của tôi", icon: "bi-calendar-check" }
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
                                <i className="bi bi-person-circle me-2"></i>
                                Xin chào, {current_full_name}!
                            </h4>
                            <p className="card-text mb-0">
                                Bạn có {my_exams.filter(exam => get_days_until_exam(exam.exam_date) >= 0).length} kỳ thi sắp tới
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="col-md-3 mb-4">
                    <div className="card text-center border-info">
                        <div className="card-body">
                            <i className="bi bi-calendar-check display-4 text-info"></i>
                            <h5 className="card-title mt-2">
                                {my_exams.filter(exam => get_days_until_exam(exam.exam_date) >= 0).length}
                            </h5>
                            <p className="card-text text-muted">Kỳ thi sắp tới</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-warning">
                        <div className="card-body">
                            <i className="bi bi-clock-history display-4 text-warning"></i>
                            <h5 className="card-title mt-2">
                                {my_exams.filter(exam => exam.registration_status === 'pending').length}
                            </h5>
                            <p className="card-text text-muted">Chờ duyệt</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-success">
                        <div className="card-body">
                            <i className="bi bi-check-circle display-4 text-success"></i>
                            <h5 className="card-title mt-2">
                                {my_exams.filter(exam => exam.registration_status === 'approved').length}
                            </h5>
                            <p className="card-text text-muted">Đã duyệt</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-secondary">
                        <div className="card-body">
                            <i className="bi bi-archive display-4 text-secondary"></i>
                            <h5 className="card-title mt-2">
                                {my_exams.filter(exam => get_days_until_exam(exam.exam_date) < 0).length}
                            </h5>
                            <p className="card-text text-muted">Đã qua</p>
                        </div>
                    </div>
                </div>

                {/* Exam List */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-list-task me-2"></i>
                                Danh sách kỳ thi
                            </h5>
                            <select 
                                className="form-select w-auto"
                                value={filter_status}
                                onChange={(e) => set_filter_status(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="upcoming">Sắp tới</option>
                                <option value="past">Đã qua</option>
                                <option value="published">Đã xuất bản</option>
                                <option value="draft">Bản nháp</option>
                            </select>
                        </div>
                        
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Đang tải danh sách kỳ thi...</p>
                                </div>
                            ) : filtered_exams.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                    Không có kỳ thi nào
                                </div>
                            ) : (
                                <div className="row">
                                    {filtered_exams.map(exam => {
                                        const days_until = get_days_until_exam(exam.exam_date);
                                        
                                        return (
                                            <div key={exam.exam_id} className="col-md-6 col-lg-4 mb-3">
                                                <div className="card h-100 border-start border-4 border-primary">
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
                                                                    <i className="bi bi-calendar3 d-block text-primary"></i>
                                                                    <small>{new Date(exam.exam_date).toLocaleDateString('vi-VN')}</small>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <i className="bi bi-clock d-block text-primary"></i>
                                                                <small>{exam.start_time} - {exam.end_time}</small>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="small mb-2">
                                                            <div className="d-flex justify-content-between">
                                                                <span><i className="bi bi-geo-alt me-1"></i>Phòng:</span>
                                                                <strong>{exam.room_name}</strong>
                                                            </div>
                                                            <div className="d-flex justify-content-between">
                                                                <span><i className="bi bi-building me-1"></i>Tòa:</span>
                                                                <strong>{exam.building}</strong>
                                                            </div>
                                                            <div className="d-flex justify-content-between">
                                                                <span><i className="bi bi-pencil-square me-1"></i>Hình thức:</span>
                                                                <strong>{get_method_text(exam.method)}</strong>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            {get_status_badge(exam.status)}
                                                            {get_registration_badge(exam.registration_status)}
                                                        </div>
                                                        
                                                        {exam.instructions && (
                                                            <div className="mt-2 p-2 bg-light rounded">
                                                                <small className="text-muted">
                                                                    <i className="bi bi-info-circle me-1"></i>
                                                                    {exam.instructions}
                                                                </small>
                                                            </div>
                                                        )}
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

export default StudentDashboardPage;
