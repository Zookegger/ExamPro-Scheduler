import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getStudentSchedule, getStudentExams } from "../../services/apiService";

function StudentSchedulePage({ current_user_role, current_user_id }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [schedule_data, set_schedule_data] = useState([]);
    const [loading, set_loading] = useState(true);
    const [view_mode, set_view_mode] = useState('week'); // 'week', 'month', 'upcoming'
    const [selected_date, set_selected_date] = useState(new Date().toISOString().split('T')[0]);

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        console.log('📅 Loading student schedule...');
        
        setTimeout(() => {
            const mock_schedule = [
                {
                    id: 1,
                    type: 'class',
                    title: 'Học Toán 12',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    class_code: '12A1',
                    class_name: 'Lớp 12A1 - Khối Tự Nhiên',
                    teacher_name: 'Nguyễn Văn A',
                    date: '2025-08-15',
                    start_time: '07:30:00',
                    end_time: '08:15:00',
                    room_name: 'Phòng A1',
                    description: 'Tiết học thường',
                    status: 'enrolled'
                },
                {
                    id: 2,
                    type: 'exam',
                    title: 'Thi giữa kỳ Toán 12',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    exam_id: 1,
                    date: '2025-08-20',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    room_name: 'Phòng A1',
                    description: 'Kỳ thi giữa học kỳ I',
                    status: 'registered',
                    registration_date: '2025-08-10'
                },
                {
                    id: 3,
                    type: 'class',
                    title: 'Học Vật lý 12',
                    subject_code: 'PHYS12',
                    subject_name: 'Vật lý 12',
                    class_code: '12A1',
                    class_name: 'Lớp 12A1 - Khối Tự Nhiên',
                    teacher_name: 'Trần Thị B',
                    date: '2025-08-16',
                    start_time: '10:05:00',
                    end_time: '10:50:00',
                    room_name: 'Phòng B2',
                    description: 'Tiết học thường',
                    status: 'enrolled'
                },
                {
                    id: 4,
                    type: 'exam',
                    title: 'Thi cuối kỳ Hóa học',
                    subject_code: 'CHEM12',
                    subject_name: 'Hóa học 12',
                    exam_id: 2,
                    date: '2025-08-25',
                    start_time: '14:00:00',
                    end_time: '16:00:00',
                    room_name: 'Phòng C1',
                    description: 'Kỳ thi cuối học kỳ I',
                    status: 'pending_registration',
                    registration_deadline: '2025-08-18'
                }
            ];

            set_schedule_data(mock_schedule);
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_type_badge = (type, status) => {
        if (type === 'class') {
            return <span className="badge bg-primary">Lớp học</span>;
        } else if (type === 'exam') {
            switch (status) {
                case 'registered':
                    return <span className="badge bg-success">Đã đăng ký thi</span>;
                case 'pending_registration':
                    return <span className="badge bg-warning text-dark">Chưa đăng ký</span>;
                case 'completed':
                    return <span className="badge bg-secondary">Đã thi</span>;
                default:
                    return <span className="badge bg-info">Kỳ thi</span>;
            }
        }
        return <span className="badge bg-secondary">Khác</span>;
    };

    const get_urgency_class = (date, type) => {
        const today = new Date();
        const event_date = new Date(date);
        const diff_days = Math.ceil((event_date - today) / (1000 * 60 * 60 * 24));
        
        if (diff_days < 0) return 'text-muted';
        if (type === 'exam') {
            if (diff_days === 0) return 'text-danger fw-bold';
            if (diff_days <= 3) return 'text-warning fw-bold';
            if (diff_days <= 7) return 'text-info';
        }
        return 'text-dark';
    };

    const format_time_range = (start_time, end_time) => {
        return `${start_time.slice(0, 5)} - ${end_time.slice(0, 5)}`;
    };

    // ====================================================================
    // FILTERING
    // ====================================================================
    const filtered_schedule = schedule_data
        .filter(item => {
            const item_date = new Date(item.date);
            const selected = new Date(selected_date);
            
            if (view_mode === 'week') {
                const week_start = new Date(selected);
                week_start.setDate(week_start.getDate() - week_start.getDay() + 1);
                const week_end = new Date(week_start);
                week_end.setDate(week_start.getDate() + 6);
                
                return item_date >= week_start && item_date <= week_end;
            } else if (view_mode === 'upcoming') {
                const today = new Date();
                return item_date >= today;
            }
            
            return item_date.getMonth() === selected.getMonth() && 
                   item_date.getFullYear() === selected.getFullYear();
        })
        .sort((a, b) => {
            const date_diff = new Date(a.date) - new Date(b.date);
            if (date_diff !== 0) return date_diff;
            return a.start_time.localeCompare(b.start_time);
        });

    // Group by date
    const grouped_schedule = filtered_schedule.reduce((groups, item) => {
        const date = item.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
        return groups;
    }, {});

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'student') {
        return <AccessDeniedPage message="Chỉ học sinh mới có thể xem lịch học của mình." />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Lịch học của tôi", icon: "bi-calendar-event-fill" }
    ];

    if (loading) {
        return (
            <div className="container-fluid px-4">
                <Breadcrumb items={breadcrumb_items} />
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-3">Đang tải lịch học...</p>
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
                        <i className="bi bi-calendar-event text-success me-2"></i>
                        Lịch học của tôi
                    </h2>
                    <p className="text-muted mb-0">Xem lịch học và lịch thi cá nhân</p>
                </div>
            </div>

            {/* Controls */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="view_mode" className="form-label">Chế độ xem</label>
                            <select
                                id="view_mode"
                                className="form-select"
                                value={view_mode}
                                onChange={(e) => set_view_mode(e.target.value)}
                            >
                                <option value="week">Tuần này</option>
                                <option value="month">Tháng này</option>
                                <option value="upcoming">Sắp tới</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="selected_date" className="form-label">Ngày</label>
                            <input
                                type="date"
                                id="selected_date"
                                className="form-control"
                                value={selected_date}
                                onChange={(e) => set_selected_date(e.target.value)}
                            />
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                            <button className="btn btn-outline-primary">
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Display */}
            <div className="row">
                <div className="col-12">
                    {Object.keys(grouped_schedule).length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-calendar-x display-1 text-muted"></i>
                            <h4 className="text-muted mt-3">Không có lịch học</h4>
                            <p className="text-muted">Không có lịch học nào trong khoảng thời gian đã chọn.</p>
                        </div>
                    ) : (
                        Object.entries(grouped_schedule).map(([date, items]) => (
                            <div key={date} className="card mb-3">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">
                                        <i className="bi bi-calendar-date me-2"></i>
                                        {new Date(date).toLocaleDateString('vi-VN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h5>
                                </div>
                                <div className="card-body p-0">
                                    <div className="list-group list-group-flush">
                                        {items.map(item => (
                                            <div key={item.id} className="list-group-item">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <h6 className="mb-0 me-2">{item.title}</h6>
                                                            {get_type_badge(item.type, item.status)}
                                                        </div>
                                                        
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <small className="text-muted d-block">
                                                                    <i className="bi bi-book me-1"></i>
                                                                    {item.subject_name} ({item.subject_code})
                                                                </small>
                                                                {item.teacher_name && (
                                                                    <small className="text-muted d-block">
                                                                        <i className="bi bi-person me-1"></i>
                                                                        {item.teacher_name}
                                                                    </small>
                                                                )}
                                                                <small className="text-muted d-block">
                                                                    <i className="bi bi-geo-alt me-1"></i>
                                                                    {item.room_name}
                                                                </small>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small className="text-muted d-block">
                                                                    <i className="bi bi-clock me-1"></i>
                                                                    {format_time_range(item.start_time, item.end_time)}
                                                                </small>
                                                                {item.description && (
                                                                    <small className="text-muted d-block">
                                                                        <i className="bi bi-info-circle me-1"></i>
                                                                        {item.description}
                                                                    </small>
                                                                )}
                                                                {item.type === 'exam' && item.status === 'pending_registration' && (
                                                                    <small className="text-warning d-block">
                                                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                                                        Hạn đăng ký: {new Date(item.registration_deadline).toLocaleDateString('vi-VN')}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-end">
                                                        <span className={`fw-bold ${get_urgency_class(item.date, item.type)}`}>
                                                            {Math.ceil((new Date(item.date) - new Date()) / (1000 * 60 * 60 * 24))} ngày
                                                        </span>
                                                        {item.type === 'exam' && item.status === 'pending_registration' && (
                                                            <div className="mt-2">
                                                                <button className="btn btn-sm btn-warning">
                                                                    <i className="bi bi-pencil-square me-1"></i>
                                                                    Đăng ký
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentSchedulePage;
