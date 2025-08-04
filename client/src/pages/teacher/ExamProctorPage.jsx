import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getProctorExams, updateExamStatus } from "../../services/apiService";

function ExamProctorPage({ current_user_role, current_user_id }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [exams_data, set_exams_data] = useState([]);
    const [loading, set_loading] = useState(true);
    const [filter_status, set_filter_status] = useState('all'); // 'all', 'upcoming', 'today', 'completed'
    const [selected_exam, set_selected_exam] = useState(null);

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        console.log('👁️ Loading proctor exams...');
        
        setTimeout(() => {
            const mock_exams = [
                {
                    exam_id: 1,
                    title: 'Thi giữa kỳ Toán 12',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    exam_date: '2025-08-15',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    duration_minutes: 120,
                    room_name: 'Phòng A1',
                    room_capacity: 40,
                    registered_students: 35,
                    proctor_role: 'main_proctor',
                    status: 'today',
                    subject_teacher: 'Nguyễn Văn A',
                    other_proctors: ['Trần Thị B'],
                    exam_method: 'offline',
                    description: 'Kỳ thi giữa học kỳ I'
                },
                {
                    exam_id: 2,
                    title: 'Thi cuối kỳ Hóa học',
                    subject_code: 'CHEM11',
                    subject_name: 'Hóa học 11',
                    exam_date: '2025-08-20',
                    start_time: '14:00:00',
                    end_time: '16:00:00',
                    duration_minutes: 120,
                    room_name: 'Phòng B2',
                    room_capacity: 35,
                    registered_students: 28,
                    proctor_role: 'assistant_proctor',
                    status: 'upcoming',
                    subject_teacher: 'Lê Thị C',
                    other_proctors: ['Phạm Văn D'],
                    exam_method: 'offline',
                    description: 'Kỳ thi cuối học kỳ I'
                },
                {
                    exam_id: 3,
                    title: 'Kiểm tra 15 phút Văn',
                    subject_code: 'LIT12',
                    subject_name: 'Ngữ văn 12',
                    exam_date: '2025-08-10',
                    start_time: '10:05:00',
                    end_time: '10:20:00',
                    duration_minutes: 15,
                    room_name: 'Phòng C1',
                    room_capacity: 32,
                    registered_students: 30,
                    proctor_role: 'main_proctor',
                    status: 'completed',
                    subject_teacher: 'Hoàng Thị E',
                    other_proctors: [],
                    exam_method: 'offline',
                    description: 'Kiểm tra định kỳ',
                    completed_time: '2025-08-10T10:25:00'
                },
                {
                    exam_id: 4,
                    title: 'Thi thử THPT Quốc gia - Toán',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    exam_date: '2025-08-25',
                    start_time: '08:00:00',
                    end_time: '11:30:00',
                    duration_minutes: 210,
                    room_name: 'Hội trường lớn',
                    room_capacity: 100,
                    registered_students: 85,
                    proctor_role: 'assistant_proctor',
                    status: 'upcoming',
                    subject_teacher: 'Nguyễn Văn A',
                    other_proctors: ['Trần Thị B', 'Lê Văn F'],
                    exam_method: 'offline',
                    description: 'Kỳ thi thử THPT Quốc gia năm 2025'
                }
            ];

            set_exams_data(mock_exams);
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_status_badge = (status) => {
        switch (status) {
            case 'today':
                return <span className="badge bg-danger">Hôm nay</span>;
            case 'upcoming':
                return <span className="badge bg-primary">Sắp tới</span>;
            case 'completed':
                return <span className="badge bg-success">Hoàn thành</span>;
            case 'cancelled':
                return <span className="badge bg-secondary">Đã hủy</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const get_role_badge = (role) => {
        switch (role) {
            case 'main_proctor':
                return <span className="badge bg-warning text-dark">Giám thị chính</span>;
            case 'assistant_proctor':
                return <span className="badge bg-info">Giám thị phụ</span>;
            default:
                return <span className="badge bg-secondary">Giám thị</span>;
        }
    };

    const get_urgency_class = (exam_date, exam_time) => {
        const now = new Date();
        const exam_datetime = new Date(`${exam_date}T${exam_time}`);
        const diff_hours = (exam_datetime - now) / (1000 * 60 * 60);
        
        if (diff_hours < 0) return 'text-muted';
        if (diff_hours < 2) return 'text-danger fw-bold';
        if (diff_hours < 24) return 'text-warning fw-bold';
        if (diff_hours < 72) return 'text-info';
        return 'text-dark';
    };

    const format_time_range = (start_time, end_time) => {
        return `${start_time.slice(0, 5)} - ${end_time.slice(0, 5)}`;
    };

    const get_capacity_percentage = (registered, capacity) => {
        return Math.round((registered / capacity) * 100);
    };

    // ====================================================================
    // FILTERING
    // ====================================================================
    const filtered_exams = exams_data
        .filter(exam => {
            if (filter_status === 'all') return true;
            if (filter_status === 'today') {
                const today = new Date().toISOString().split('T')[0];
                return exam.exam_date === today;
            }
            return exam.status === filter_status;
        })
        .sort((a, b) => {
            // Sort by date and time
            const date_a = new Date(`${a.exam_date}T${a.start_time}`);
            const date_b = new Date(`${b.exam_date}T${b.start_time}`);
            return date_a - date_b;
        });

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'teacher') {
        return <AccessDeniedPage message="Chỉ giáo viên mới có thể xem danh sách giám thị thi." />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Giám thị thi", icon: "bi-eye-fill" }
    ];

    if (loading) {
        return (
            <div className="container-fluid px-4">
                <Breadcrumb items={breadcrumb_items} />
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-3">Đang tải lịch giám thị...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid px-4">
            <Breadcrumb items={breadcrumb_items} />
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="h3 mb-1">
                        <i className="bi bi-eye text-info me-2"></i>
                        Lịch giám thị thi
                    </h2>
                    <p className="text-muted mb-0">Quản lý nhiệm vụ giám thị các kỳ thi</p>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="filter_status" className="form-label">Lọc theo trạng thái</label>
                            <select
                                id="filter_status"
                                className="form-select"
                                value={filter_status}
                                onChange={(e) => set_filter_status(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="today">Hôm nay</option>
                                <option value="upcoming">Sắp tới</option>
                                <option value="completed">Hoàn thành</option>
                            </select>
                        </div>
                        <div className="col-md-8 d-flex align-items-end">
                            <button className="btn btn-outline-primary me-2">
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Làm mới
                            </button>
                            <button className="btn btn-outline-success">
                                <i className="bi bi-download me-1"></i>
                                Xuất lịch
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-danger text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Hôm nay</h5>
                                    <h3 className="mb-0">{exams_data.filter(e => e.status === 'today').length}</h3>
                                </div>
                                <i className="bi bi-clock-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Sắp tới</h5>
                                    <h3 className="mb-0">{exams_data.filter(e => e.status === 'upcoming').length}</h3>
                                </div>
                                <i className="bi bi-calendar-plus-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Hoàn thành</h5>
                                    <h3 className="mb-0">{exams_data.filter(e => e.status === 'completed').length}</h3>
                                </div>
                                <i className="bi bi-check-circle-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-dark">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Giám thị chính</h5>
                                    <h3 className="mb-0">{exams_data.filter(e => e.proctor_role === 'main_proctor').length}</h3>
                                </div>
                                <i className="bi bi-star-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exams List */}
            <div className="row">
                <div className="col-12">
                    {filtered_exams.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-calendar-x display-1 text-muted"></i>
                            <h4 className="text-muted mt-3">Không có lịch giám thị</h4>
                            <p className="text-muted">Không có kỳ thi nào cần giám thị trong thời gian đã chọn.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="bi bi-list-ul me-2"></i>
                                    Lịch giám thị ({filtered_exams.length})
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="list-group list-group-flush">
                                    {filtered_exams.map(exam => (
                                        <div key={exam.exam_id} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <h6 className="mb-0 me-2">{exam.title}</h6>
                                                        {get_status_badge(exam.status)}
                                                        {get_role_badge(exam.proctor_role)}
                                                    </div>
                                                    
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-book me-1"></i>
                                                                {exam.subject_name} ({exam.subject_code})
                                                            </small>
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-calendar me-1"></i>
                                                                {new Date(exam.exam_date).toLocaleDateString('vi-VN')}
                                                            </small>
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-clock me-1"></i>
                                                                {format_time_range(exam.start_time, exam.end_time)} ({exam.duration_minutes} phút)
                                                            </small>
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-geo-alt me-1"></i>
                                                                {exam.room_name}
                                                            </small>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-person-badge me-1"></i>
                                                                Giáo viên môn: {exam.subject_teacher}
                                                            </small>
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-people me-1"></i>
                                                                Sĩ số: {exam.registered_students}/{exam.room_capacity} ({get_capacity_percentage(exam.registered_students, exam.room_capacity)}%)
                                                            </small>
                                                            {exam.other_proctors.length > 0 && (
                                                                <small className="text-muted d-block">
                                                                    <i className="bi bi-eye me-1"></i>
                                                                    Giám thị khác: {exam.other_proctors.join(', ')}
                                                                </small>
                                                            )}
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-info-circle me-1"></i>
                                                                {exam.description}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-end">
                                                    <span className={`fw-bold ${get_urgency_class(exam.exam_date, exam.start_time)}`}>
                                                        {Math.ceil((new Date(`${exam.exam_date}T${exam.start_time}`) - new Date()) / (1000 * 60 * 60 * 24))} ngày
                                                    </span>
                                                    <div className="mt-2">
                                                        {exam.status === 'today' && (
                                                            <button className="btn btn-sm btn-success me-1">
                                                                <i className="bi bi-play-fill me-1"></i>
                                                                Bắt đầu
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => set_selected_exam(exam)}
                                                        >
                                                            <i className="bi bi-eye me-1"></i>
                                                            Chi tiết
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Exam Detail Modal */}
            {selected_exam && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Chi tiết giám thị: {selected_exam.title}</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => set_selected_exam(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Thông tin kỳ thi</h6>
                                        <p><strong>Môn học:</strong> {selected_exam.subject_name}</p>
                                        <p><strong>Ngày thi:</strong> {new Date(selected_exam.exam_date).toLocaleDateString('vi-VN')}</p>
                                        <p><strong>Thời gian:</strong> {format_time_range(selected_exam.start_time, selected_exam.end_time)}</p>
                                        <p><strong>Thời lượng:</strong> {selected_exam.duration_minutes} phút</p>
                                        <p><strong>Phòng thi:</strong> {selected_exam.room_name}</p>
                                        <p><strong>Sĩ số:</strong> {selected_exam.registered_students}/{selected_exam.room_capacity}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Thông tin giám thị</h6>
                                        <p><strong>Vai trò:</strong> {get_role_badge(selected_exam.proctor_role)}</p>
                                        <p><strong>Giáo viên môn:</strong> {selected_exam.subject_teacher}</p>
                                        <p><strong>Giám thị khác:</strong> {
                                            selected_exam.other_proctors.length > 0 
                                                ? selected_exam.other_proctors.join(', ')
                                                : 'Không có'
                                        }</p>
                                        <p><strong>Trạng thái:</strong> {get_status_badge(selected_exam.status)}</p>
                                    </div>
                                </div>
                                
                                <hr />
                                
                                <h6 className="fw-bold">Hướng dẫn giám thị</h6>
                                <div className="alert alert-info">
                                    <ul className="mb-0">
                                        <li>Có mặt tại phòng thi trước 15 phút</li>
                                        <li>Kiểm tra giấy tờ tùy thân của thí sinh</li>
                                        <li>Phát đề thi đúng giờ quy định</li>
                                        <li>Theo dõi và giám sát thí sinh trong suốt quá trình thi</li>
                                        <li>Thu bài thi đúng giờ kết thúc</li>
                                        <li>Lập biên bản và báo cáo kết quả</li>
                                    </ul>
                                </div>

                                {selected_exam.proctor_role === 'main_proctor' && (
                                    <div className="alert alert-warning">
                                        <strong>Lưu ý giám thị chính:</strong>
                                        <ul className="mb-0 mt-2">
                                            <li>Chịu trách nhiệm chính trong việc tổ chức thi</li>
                                            <li>Phân công nhiệm vụ cho giám thị phụ</li>
                                            <li>Xử lý các tình huống phát sinh</li>
                                            <li>Lập và ký biên bản thi</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                {selected_exam.status === 'today' && (
                                    <button type="button" className="btn btn-success">
                                        <i className="bi bi-play-fill me-1"></i>
                                        Bắt đầu giám thị
                                    </button>
                                )}
                                <button type="button" className="btn btn-outline-primary">
                                    <i className="bi bi-download me-1"></i>
                                    Tải hướng dẫn
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => set_selected_exam(null)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExamProctorPage;
