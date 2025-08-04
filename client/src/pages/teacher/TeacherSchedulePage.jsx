import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getTeacherSchedule, getTeacherExams } from "../../services/apiService";

function TeacherSchedulePage({ current_user_role, current_user_id }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [schedule_data, set_schedule_data] = useState([]);
    const [loading, set_loading] = useState(true);
    const [view_mode, set_view_mode] = useState('week'); // 'week', 'month'
    const [selected_date, set_selected_date] = useState(new Date().toISOString().split('T')[0]);
    const [filter_type, set_filter_type] = useState('all'); // 'all', 'teaching', 'proctoring'

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        console.log('📅 Loading teacher schedule...');
        
        setTimeout(() => {
            const mock_schedule = [
                {
                    schedule_id: 1,
                    type: 'teaching',
                    title: 'Dạy Toán 12A1',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    class_code: '12A1',
                    class_name: 'Lớp 12A1 - Khối Tự Nhiên',
                    date: '2025-08-15',
                    start_time: '07:30:00',
                    end_time: '08:15:00',
                    room_name: 'Phòng A1',
                    student_count: 32,
                    description: 'Tiết học thường',
                    is_recurring: true,
                    day_of_week: 1 // Monday
                },
                {
                    schedule_id: 2,
                    type: 'exam',
                    title: 'Thi giữa kỳ Toán 12',
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    class_code: '12A1',
                    class_name: 'Lớp 12A1 - Khối Tự Nhiên',
                    date: '2025-08-15',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    room_name: 'Phòng A1',
                    student_count: 32,
                    description: 'Kỳ thi giữa học kỳ I',
                    exam_id: 1,
                    my_role: 'subject_teacher'
                },
                {
                    schedule_id: 3,
                    type: 'proctoring',
                    title: 'Giám thị thi Hóa học',
                    subject_code: 'CHEM11',
                    subject_name: 'Hóa học 11',
                    class_code: '11B3',
                    class_name: 'Lớp 11B3 - Khối Tự Nhiên',
                    date: '2025-08-16',
                    start_time: '14:00:00',
                    end_time: '16:00:00',
                    room_name: 'Phòng B2',
                    student_count: 28,
                    description: 'Nhiệm vụ giám thị',
                    exam_id: 2,
                    my_role: 'main_proctor'
                },
                {
                    schedule_id: 4,
                    type: 'teaching',
                    title: 'Dạy Toán 11B2',
                    subject_code: 'MATH11',
                    subject_name: 'Toán học 11',
                    class_code: '11B2',
                    class_name: 'Lớp 11B2 - Khối Xã Hội',
                    date: '2025-08-16',
                    start_time: '10:05:00',
                    end_time: '10:50:00',
                    room_name: 'Phòng C1',
                    student_count: 28,
                    description: 'Tiết học thường',
                    is_recurring: true,
                    day_of_week: 2 // Tuesday
                },
                {
                    schedule_id: 5,
                    type: 'meeting',
                    title: 'Họp tổ bộ môn Toán',
                    date: '2025-08-17',
                    start_time: '15:00:00',
                    end_time: '16:30:00',
                    room_name: 'Phòng họp 1',
                    description: 'Họp định kỳ tổ bộ môn'
                }
            ];

            set_schedule_data(mock_schedule);
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_type_badge = (type, my_role) => {
        switch (type) {
            case 'teaching':
                return <span className="badge bg-primary">Giảng dạy</span>;
            case 'exam':
                return <span className="badge bg-success">Thi cử - {my_role === 'subject_teacher' ? 'Giáo viên môn' : 'Giám thị'}</span>;
            case 'proctoring':
                return <span className="badge bg-warning text-dark">Giám thị</span>;
            case 'meeting':
                return <span className="badge bg-info">Họp</span>;
            default:
                return <span className="badge bg-secondary">Khác</span>;
        }
    };

    const get_priority_indicator = (type) => {
        switch (type) {
            case 'exam':
            case 'proctoring':
                return <i className="bi bi-exclamation-triangle text-warning me-2" title="Quan trọng"></i>;
            case 'meeting':
                return <i className="bi bi-info-circle text-info me-2" title="Thông tin"></i>;
            default:
                return <i className="bi bi-circle text-primary me-2"></i>;
        }
    };

    const get_days_until = (date) => {
        const today = new Date();
        const event_date = new Date(date);
        const diff_time = event_date - today;
        const diff_days = Math.ceil(diff_time / (1000 * 60 * 60 * 24));
        return diff_days;
    };

    const get_urgency_class = (days_until) => {
        if (days_until < 0) return 'text-muted';
        if (days_until === 0) return 'text-danger fw-bold';
        if (days_until === 1) return 'text-warning fw-bold';
        if (days_until <= 7) return 'text-info';
        return 'text-dark';
    };

    const format_time_range = (start_time, end_time) => {
        return `${start_time.slice(0, 5)} - ${end_time.slice(0, 5)}`;
    };

    // ====================================================================
    // FILTERING AND SORTING
    // ====================================================================
    const filtered_schedule = schedule_data
        .filter(item => {
            // Date filter based on view mode
            const item_date = new Date(item.date);
            const selected = new Date(selected_date);
            
            if (view_mode === 'week') {
                const week_start = new Date(selected);
                week_start.setDate(week_start.getDate() - week_start.getDay() + 1); // Start from Monday
                const week_end = new Date(week_start);
                week_end.setDate(week_start.getDate() + 6);
                
                if (item_date < week_start || item_date > week_end) return false;
            } else if (view_mode === 'month') {
                if (item_date.getMonth() !== selected.getMonth() || 
                    item_date.getFullYear() !== selected.getFullYear()) return false;
            }
            
            // Type filter
            if (filter_type === 'teaching' && item.type !== 'teaching') return false;
            if (filter_type === 'proctoring' && !['proctoring', 'exam'].includes(item.type)) return false;
            
            return true;
        })
        .sort((a, b) => {
            // Sort by date first, then by start time
            const date_diff = new Date(a.date) - new Date(b.date);
            if (date_diff !== 0) return date_diff;
            
            return a.start_time.localeCompare(b.start_time);
        });

    // Group by date for better display
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
    if (current_user_role !== 'teacher') {
        return <AccessDeniedPage />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Lịch công tác", icon: "bi-calendar-week-fill" }
    ];

    return (
        <div className="container-fluid">
            <Breadcrumb items={breadcrumb_items} />
            
            <div className="row">
                {/* Header and Controls */}
                <div className="col-12 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <h4 className="mb-0">
                                        <i className="bi bi-calendar-week me-2"></i>
                                        Lịch công tác giáo viên
                                    </h4>
                                    <small className="text-muted">Xem lịch giảng dạy, thi cử và các hoạt động khác</small>
                                </div>
                                <div className="col-md-6">
                                    <div className="row g-2">
                                        <div className="col-md-4">
                                            <select 
                                                className="form-select"
                                                value={view_mode}
                                                onChange={(e) => set_view_mode(e.target.value)}
                                            >
                                                <option value="week">Theo tuần</option>
                                                <option value="month">Theo tháng</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <input 
                                                type="date" 
                                                className="form-control"
                                                value={selected_date}
                                                onChange={(e) => set_selected_date(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <select 
                                                className="form-select"
                                                value={filter_type}
                                                onChange={(e) => set_filter_type(e.target.value)}
                                            >
                                                <option value="all">Tất cả</option>
                                                <option value="teaching">Giảng dạy</option>
                                                <option value="proctoring">Thi cử/Giám thị</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="col-md-3 mb-4">
                    <div className="card text-center border-primary">
                        <div className="card-body">
                            <i className="bi bi-book display-4 text-primary"></i>
                            <h5 className="card-title mt-2">
                                {filtered_schedule.filter(item => item.type === 'teaching').length}
                            </h5>
                            <p className="card-text text-muted">Tiết dạy</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-success">
                        <div className="card-body">
                            <i className="bi bi-pencil-square display-4 text-success"></i>
                            <h5 className="card-title mt-2">
                                {filtered_schedule.filter(item => item.type === 'exam').length}
                            </h5>
                            <p className="card-text text-muted">Kỳ thi</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-warning">
                        <div className="card-body">
                            <i className="bi bi-eye display-4 text-warning"></i>
                            <h5 className="card-title mt-2">
                                {filtered_schedule.filter(item => item.type === 'proctoring').length}
                            </h5>
                            <p className="card-text text-muted">Giám thị</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-4">
                    <div className="card text-center border-info">
                        <div className="card-body">
                            <i className="bi bi-people display-4 text-info"></i>
                            <h5 className="card-title mt-2">
                                {filtered_schedule.filter(item => item.type === 'meeting').length}
                            </h5>
                            <p className="card-text text-muted">Họp</p>
                        </div>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-list-task me-2"></i>
                                Lịch công tác chi tiết
                                <span className="badge bg-primary ms-2">{filtered_schedule.length}</span>
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Đang tải lịch công tác...</p>
                                </div>
                            ) : Object.keys(grouped_schedule).length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                                    Không có lịch công tác nào trong khoảng thời gian đã chọn
                                </div>
                            ) : (
                                Object.entries(grouped_schedule).map(([date, items]) => {
                                    const days_until = get_days_until(date);
                                    const date_obj = new Date(date);
                                    
                                    return (
                                        <div key={date} className="mb-4">
                                            <h6 className={`border-bottom pb-2 mb-3 ${get_urgency_class(days_until)}`}>
                                                <i className="bi bi-calendar3 me-2"></i>
                                                {date_obj.toLocaleDateString('vi-VN', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                                {days_until === 0 && <span className="badge bg-danger ms-2">Hôm nay</span>}
                                                {days_until === 1 && <span className="badge bg-warning text-dark ms-2">Ngày mai</span>}
                                                {days_until > 1 && days_until <= 7 && (
                                                    <span className="badge bg-info ms-2">{days_until} ngày nữa</span>
                                                )}
                                            </h6>
                                            
                                            <div className="row">
                                                {items.map(item => (
                                                    <div key={item.schedule_id} className="col-md-6 col-lg-4 mb-3">
                                                        <div className="card h-100 border-start border-4 border-primary">
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    {get_type_badge(item.type, item.my_role)}
                                                                    <small className="text-muted">
                                                                        {format_time_range(item.start_time, item.end_time)}
                                                                    </small>
                                                                </div>
                                                                
                                                                <h6 className="card-title d-flex align-items-center">
                                                                    {get_priority_indicator(item.type)}
                                                                    {item.title}
                                                                </h6>
                                                                
                                                                {item.subject_name && (
                                                                    <p className="text-muted small mb-1">
                                                                        <i className="bi bi-book me-1"></i>
                                                                        {item.subject_name}
                                                                    </p>
                                                                )}
                                                                
                                                                {item.class_name && (
                                                                    <p className="text-muted small mb-1">
                                                                        <i className="bi bi-door-open me-1"></i>
                                                                        {item.class_name}
                                                                    </p>
                                                                )}
                                                                
                                                                <div className="row text-center mb-2">
                                                                    <div className="col-6">
                                                                        <div className="border-end">
                                                                            <i className="bi bi-geo-alt d-block text-primary"></i>
                                                                            <small>{item.room_name}</small>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <i className="bi bi-people d-block text-primary"></i>
                                                                        <small>{item.student_count || 0} học sinh</small>
                                                                    </div>
                                                                </div>
                                                                
                                                                {item.description && (
                                                                    <div className="mt-2 p-2 bg-light rounded">
                                                                        <small className="text-muted">
                                                                            <i className="bi bi-info-circle me-1"></i>
                                                                            {item.description}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                                
                                                                {item.is_recurring && (
                                                                    <div className="mt-2">
                                                                        <span className="badge bg-light text-dark">
                                                                            <i className="bi bi-arrow-repeat me-1"></i>
                                                                            Định kỳ
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherSchedulePage;
