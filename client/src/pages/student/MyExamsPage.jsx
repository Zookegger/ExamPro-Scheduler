import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getStudentExams, registerForExam } from "../../services/apiService";

function MyExamsPage({ current_user_role, current_user_id }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [exams_data, set_exams_data] = useState([]);
    const [loading, set_loading] = useState(true);
    const [filter_status, set_filter_status] = useState('all'); // 'all', 'registered', 'pending', 'completed'
    const [search_query, set_search_query] = useState('');

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        console.log('📋 Loading student exams...');
        
        setTimeout(() => {
            const mock_exams = [
                {
                    exam_id: 1,
                    title: 'Thi giữa kỳ Toán 12',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    exam_date: '2025-08-20',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    duration_minutes: 120,
                    room_name: 'Phòng A1',
                    method: 'offline',
                    status: 'registered',
                    registration_date: '2025-08-10T14:30:00',
                    registration_status: 'approved',
                    max_students: 40,
                    registered_count: 32,
                    grade_level: 12,
                    description: 'Kỳ thi giữa học kỳ I - Toán 12'
                },
                {
                    exam_id: 2,
                    title: 'Thi cuối kỳ Vật lý 12',
                    subject_code: 'PHYS12',
                    subject_name: 'Vật lý 12',
                    exam_date: '2025-08-25',
                    start_time: '14:00:00',
                    end_time: '16:00:00',
                    duration_minutes: 120,
                    room_name: 'Phòng B2',
                    method: 'offline',
                    status: 'pending_registration',
                    registration_deadline: '2025-08-18',
                    max_students: 35,
                    registered_count: 28,
                    grade_level: 12,
                    description: 'Kỳ thi cuối học kỳ I - Vật lý 12'
                },
                {
                    exam_id: 3,
                    title: 'Thi thử THPT Quốc gia - Toán',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    exam_date: '2025-09-15',
                    start_time: '08:00:00',
                    end_time: '11:30:00',
                    duration_minutes: 210,
                    room_name: 'Phòng thi chung',
                    method: 'offline',
                    status: 'available',
                    registration_deadline: '2025-09-10',
                    max_students: 200,
                    registered_count: 145,
                    grade_level: 12,
                    description: 'Kỳ thi thử THPT Quốc gia năm 2025'
                },
                {
                    exam_id: 4,
                    title: 'Thi học kỳ I - Hóa học',
                    subject_code: 'CHEM12',
                    subject_name: 'Hóa học 12',
                    exam_date: '2025-08-05',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    duration_minutes: 120,
                    room_name: 'Phòng C1',
                    method: 'offline',
                    status: 'completed',
                    registration_date: '2025-07-20T10:15:00',
                    registration_status: 'approved',
                    score: 8.5,
                    max_students: 30,
                    registered_count: 30,
                    grade_level: 12,
                    description: 'Kỳ thi học kỳ I - Hóa học 12'
                }
            ];

            set_exams_data(mock_exams);
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_status_badge = (status, exam_date) => {
        const today = new Date();
        const exam_day = new Date(exam_date);
        
        switch (status) {
            case 'registered':
                if (exam_day < today) {
                    return <span className="badge bg-success">Đã thi</span>;
                }
                return <span className="badge bg-primary">Đã đăng ký</span>;
            case 'pending_registration':
                return <span className="badge bg-warning text-dark">Chờ đăng ký</span>;
            case 'available':
                return <span className="badge bg-info">Có thể đăng ký</span>;
            case 'completed':
                return <span className="badge bg-success">Hoàn thành</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const get_method_icon = (method) => {
        switch (method) {
            case 'online':
                return <i className="bi bi-laptop text-info me-1"></i>;
            case 'offline':
                return <i className="bi bi-building text-primary me-1"></i>;
            case 'hybrid':
                return <i className="bi bi-globe text-warning me-1"></i>;
            default:
                return <i className="bi bi-question-circle text-muted me-1"></i>;
        }
    };

    const get_urgency_class = (exam_date) => {
        const today = new Date();
        const exam_day = new Date(exam_date);
        const diff_days = Math.ceil((exam_day - today) / (1000 * 60 * 60 * 24));
        
        if (diff_days < 0) return 'text-muted';
        if (diff_days === 0) return 'text-danger fw-bold';
        if (diff_days <= 3) return 'text-warning fw-bold';
        if (diff_days <= 7) return 'text-info';
        return 'text-dark';
    };

    const format_time_range = (start_time, end_time) => {
        return `${start_time.slice(0, 5)} - ${end_time.slice(0, 5)}`;
    };

    const get_capacity_percentage = (registered, max) => {
        return Math.round((registered / max) * 100);
    };

    // ====================================================================
    // FILTERING
    // ====================================================================
    const filtered_exams = exams_data
        .filter(exam => {
            // Status filter
            if (filter_status !== 'all' && exam.status !== filter_status) {
                return false;
            }
            
            // Search filter
            if (search_query.trim() !== '') {
                const query = search_query.toLowerCase();
                return exam.title.toLowerCase().includes(query) ||
                       exam.subject_name.toLowerCase().includes(query) ||
                       exam.subject_code.toLowerCase().includes(query);
            }
            
            return true;
        })
        .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'student') {
        return <AccessDeniedPage message="Chỉ học sinh mới có thể xem danh sách kỳ thi của mình." />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Kỳ thi của tôi", icon: "bi-calendar-check-fill" }
    ];

    if (loading) {
        return (
            <div className="container-fluid px-4">
                <Breadcrumb items={breadcrumb_items} />
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-3">Đang tải danh sách kỳ thi...</p>
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
                        <i className="bi bi-calendar-check text-success me-2"></i>
                        Kỳ thi của tôi
                    </h2>
                    <p className="text-muted mb-0">Quản lý đăng ký và theo dõi kết quả thi</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="filter_status" className="form-label">Trạng thái</label>
                            <select
                                id="filter_status"
                                className="form-select"
                                value={filter_status}
                                onChange={(e) => set_filter_status(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="available">Có thể đăng ký</option>
                                <option value="pending_registration">Chờ đăng ký</option>
                                <option value="registered">Đã đăng ký</option>
                                <option value="completed">Hoàn thành</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="search_query" className="form-label">Tìm kiếm</label>
                            <input
                                type="text"
                                id="search_query"
                                className="form-control"
                                placeholder="Tìm theo tên kỳ thi, môn học..."
                                value={search_query}
                                onChange={(e) => set_search_query(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button className="btn btn-outline-primary w-100">
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Đã đăng ký</h5>
                                    <h3 className="mb-0">{exams_data.filter(e => e.status === 'registered').length}</h3>
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
                                    <h5 className="card-title">Chờ đăng ký</h5>
                                    <h3 className="mb-0">{exams_data.filter(e => e.status === 'pending_registration').length}</h3>
                                </div>
                                <i className="bi bi-clock-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Có thể đăng ký</h5>
                                    <h3 className="mb-0">{exams_data.filter(e => e.status === 'available').length}</h3>
                                </div>
                                <i className="bi bi-plus-circle-fill fs-1 opacity-75"></i>
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
                                <i className="bi bi-trophy-fill fs-1 opacity-75"></i>
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
                            <h4 className="text-muted mt-3">Không có kỳ thi</h4>
                            <p className="text-muted">Không tìm thấy kỳ thi nào phù hợp với bộ lọc.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="bi bi-list-ul me-2"></i>
                                    Danh sách kỳ thi ({filtered_exams.length})
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
                                                        {get_status_badge(exam.status, exam.exam_date)}
                                                        {exam.score && (
                                                            <span className="badge bg-success ms-2">
                                                                Điểm: {exam.score}
                                                            </span>
                                                        )}
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
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small className="text-muted d-block">
                                                                {get_method_icon(exam.method)}
                                                                {exam.method === 'online' ? 'Trực tuyến' : 
                                                                 exam.method === 'offline' ? 'Tại lớp' : 'Kết hợp'}
                                                            </small>
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-geo-alt me-1"></i>
                                                                {exam.room_name}
                                                            </small>
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-people me-1"></i>
                                                                {exam.registered_count}/{exam.max_students} ({get_capacity_percentage(exam.registered_count, exam.max_students)}%)
                                                            </small>
                                                            {exam.registration_deadline && exam.status === 'available' && (
                                                                <small className="text-warning d-block">
                                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                                    Hạn: {new Date(exam.registration_deadline).toLocaleDateString('vi-VN')}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-end">
                                                    <span className={`fw-bold ${get_urgency_class(exam.exam_date)}`}>
                                                        {Math.ceil((new Date(exam.exam_date) - new Date()) / (1000 * 60 * 60 * 24))} ngày
                                                    </span>
                                                    <div className="mt-2">
                                                        {exam.status === 'available' && (
                                                            <button className="btn btn-sm btn-primary me-1">
                                                                <i className="bi bi-plus-circle me-1"></i>
                                                                Đăng ký
                                                            </button>
                                                        )}
                                                        {exam.status === 'registered' && new Date(exam.exam_date) > new Date() && (
                                                            <button className="btn btn-sm btn-outline-danger me-1">
                                                                <i className="bi bi-x-circle me-1"></i>
                                                                Hủy đăng ký
                                                            </button>
                                                        )}
                                                        <button className="btn btn-sm btn-outline-secondary">
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
        </div>
    );
}

export default MyExamsPage;
