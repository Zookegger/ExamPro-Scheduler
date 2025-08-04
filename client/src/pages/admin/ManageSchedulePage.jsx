import React, { useEffect, useState, useCallback, useMemo} from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import useWebsocketConnection from '../../hooks/use_websocket_connection';
import { 
    getScheduleOverview, 
    getUnassignedData, 
    getAllRooms, 
    getAllSubjects, 
    assignStudentsToExam, 
    assignProctorsToExam 
} from '../../services/apiService';

function ManageSchedulePage() {
    // ====================================================================
    // CONSTANTS & CONFIGURATION
    // ====================================================================
    const breadcrumb_items = [
        { label: "Quản lý Thi", link: "/" },
        { label: "Lập lịch thi", icon: "bi-calendar-event-fill" }
    ];

    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    // Data states
    const [schedule_overview, set_schedule_overview] = useState([]);
    const [unregistered_students, set_unregistered_students] = useState([]);
    const [unassigned_proctors, set_unassigned_proctors] = useState([]);
    const [statistics, set_statistics] = useState({});
    const [rooms, set_rooms] = useState([]);
    const [subjects, set_subjects] = useState([]);
    
    // UI states
    const [is_loading, set_is_loading] = useState(false);
    const [show_student_list, set_show_student_list] = useState(false);
    const [show_proctor_list, set_show_proctor_list] = useState(false);
    const [selected_exam_for_assignment, set_selected_exam_for_assignment] = useState(null);
    const [show_assignment_modal, set_show_assignment_modal] = useState(false);
    const [assignment_type, set_assignment_type] = useState('student'); // 'student' or 'proctor'
    
    // Filter states
    const [filter_start_date, set_filter_start_date] = useState('');
    const [filter_end_date, set_filter_end_date] = useState('');
    const [filter_room, set_filter_room] = useState('all');
    const [filter_subject, set_filter_subject] = useState('all');

    // Assignment states
    const [selected_students, set_selected_students] = useState([]);
    const [selected_proctors, set_selected_proctors] = useState([]);

    // ====================================================================
    // API FUNCTIONS
    // ====================================================================
    const load_schedule_overview = useCallback(async () => {
        try {
            set_is_loading(true);
            const filters = {};
            
            if (filter_start_date) filters.start_date = filter_start_date;
            if (filter_end_date) filters.end_date = filter_end_date;
            if (filter_room !== 'all') filters.room_id = filter_room;
            if (filter_subject !== 'all') filters.subject_code = filter_subject;
            filters.include_stats = 'true';

            const response = await getScheduleOverview(filters);
            
            if (response.success) {
                set_schedule_overview(response.data || []);
                set_statistics(response.statistics || {});
            }
        } catch (error) {
            console.error('Error loading schedule overview:', error);
        } finally {
            set_is_loading(false);
        }
    }, [filter_start_date, filter_end_date, filter_room, filter_subject]);

    const load_unassigned_data = useCallback(async () => {
        try {
            const response = await getUnassignedData();
            
            if (response.success) {
                set_unregistered_students(response.data.unregistered_students || []);
                set_unassigned_proctors(response.data.unassigned_proctors || []);
            }
        } catch (error) {
            console.error('Error loading unassigned data:', error);
        }
    }, []);

    const load_filter_options = useCallback(async () => {
        try {
            const [rooms_response, subjects_response] = await Promise.all([
                getAllRooms(),
                getAllSubjects()
            ]);

            if (rooms_response.success) {
                set_rooms(rooms_response.data || []);
            }
            if (subjects_response.success) {
                set_subjects(subjects_response.data || []);
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }, []);

    const assign_students_to_exam = useCallback(async (exam_id, student_ids) => {
        try {
            const response = await assignStudentsToExam(exam_id, student_ids, 'approved');

            if (response.success) {
                await Promise.all([
                    load_schedule_overview(),
                    load_unassigned_data()
                ]);
                return { success: true, message: response.message };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error assigning students:', error);
            return { success: false, message: 'Lỗi kết nối máy chủ' };
        }
    }, [load_schedule_overview, load_unassigned_data]);

    const assign_proctors_to_exam = useCallback(async (exam_id, proctor_assignments) => {
        try {
            const response = await assignProctorsToExam(exam_id, proctor_assignments);

            if (response.success) {
                await Promise.all([
                    load_schedule_overview(),
                    load_unassigned_data()
                ]);
                return { success: true, message: response.message };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error assigning proctors:', error);
            return { success: false, message: 'Lỗi kết nối máy chủ' };
        }
    }, [load_schedule_overview, load_unassigned_data]);

    // ====================================================================
    // EVENT HANDLERS
    // ====================================================================
    const handle_assignment_submit = useCallback(async () => {
        if (!selected_exam_for_assignment) return;

        let result;
        if (assignment_type === 'student') {
            result = await assign_students_to_exam(
                selected_exam_for_assignment.exam_id,
                selected_students
            );
        } else {
            const proctor_assignments = selected_proctors.map(proctor_id => ({
                proctor_id,
                role: 'assistant',
                notes: 'Được phân công từ lập lịch thi'
            }));
            result = await assign_proctors_to_exam(
                selected_exam_for_assignment.exam_id,
                proctor_assignments
            );
        }

        if (result.success) {
            alert(result.message);
            set_show_assignment_modal(false);
            set_selected_students([]);
            set_selected_proctors([]);
        } else {
            alert(result.message);
        }
    }, [selected_exam_for_assignment, assignment_type, selected_students, selected_proctors, assign_students_to_exam, assign_proctors_to_exam]);

    const handle_filter_change = useCallback(() => {
        load_schedule_overview();
    }, [load_schedule_overview]);

    const open_assignment_modal = useCallback((exam, type) => {
        set_selected_exam_for_assignment(exam);
        set_assignment_type(type);
        set_show_assignment_modal(true);
        set_selected_students([]);
        set_selected_proctors([]);
    }, []);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_exam_status_badge = useCallback((exam) => {
        if (exam.is_fully_booked && exam.proctor_count > 0) {
            return <span className="badge bg-success">Đã đủ</span>;
        } else if (exam.is_fully_booked) {
            return <span className="badge bg-warning">Thiếu giám thị</span>;
        } else if (exam.proctor_count > 0) {
            return <span className="badge bg-info">Thiếu học sinh</span>;
        } else {
            return <span className="badge bg-danger">Chưa đủ</span>;
        }
    }, []);

    const render_schedule_table = useCallback(() => {
        if (schedule_overview.length === 0) {
            return (
                <div className="text-center p-4">
                    <i className="bi bi-calendar-x display-4 text-muted"></i>
                    <h5 className="mt-3 text-muted">Không có lịch thi nào</h5>
                    <p className="text-muted">Điều chỉnh bộ lọc hoặc tạo kỳ thi mới</p>
                </div>
            );
        }

        return (
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead className="table-light">
                        <tr>
                            <th>Kỳ thi</th>
                            <th>Ngày thi</th>
                            <th>Thời gian</th>
                            <th>Phòng</th>
                            <th>Học sinh</th>
                            <th>Giám thị</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule_overview.map(exam => (
                            <tr key={exam.exam_id}>
                                <td>
                                    <div>
                                        <strong>{exam.title}</strong>
                                        <br />
                                        <small className="text-muted">
                                            {exam.subject?.subject_name || exam.subject_code}
                                        </small>
                                    </div>
                                </td>
                                <td>{exam.formatted_date}</td>
                                <td>
                                    {exam.start_time} - {exam.end_time}
                                    <br />
                                    <small className="text-muted">{exam.duration_minutes} phút</small>
                                </td>
                                <td>
                                    {exam.room ? (
                                        <div>
                                            <strong>{exam.room.room_name}</strong>
                                            <br />
                                            <small className="text-muted">
                                                Sức chứa: {exam.room.capacity}
                                            </small>
                                        </div>
                                    ) : (
                                        <span className="text-muted">Trực tuyến</span>
                                    )}
                                </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <span className="me-2">
                                            {exam.registration_count}/{exam.max_students}
                                        </span>
                                        <div className="progress flex-grow-1" style={{height: '4px'}}>
                                            <div 
                                                className={`progress-bar ${exam.capacity_percentage >= 100 ? 'bg-success' : 'bg-primary'}`}
                                                style={{width: `${Math.min(exam.capacity_percentage, 100)}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${exam.proctor_count > 0 ? 'bg-success' : 'bg-warning'}`}>
                                        {exam.proctor_count} giám thị
                                    </span>
                                </td>
                                <td>{get_exam_status_badge(exam)}</td>
                                <td>
                                    <div className="btn-group-vertical btn-group-sm">
                                        <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => open_assignment_modal(exam, 'student')}
                                            disabled={exam.is_fully_booked}
                                        >
                                            <i className="bi bi-person-plus me-1"></i>
                                            Thêm HS
                                        </button>
                                        <button 
                                            className="btn btn-outline-info btn-sm"
                                            onClick={() => open_assignment_modal(exam, 'proctor')}
                                        >
                                            <i className="bi bi-person-badge me-1"></i>
                                            Thêm GT
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }, [schedule_overview, get_exam_status_badge, open_assignment_modal]);

    // ====================================================================
    // EFFECTS - WEBSOCKET CONNECTION
    // ====================================================================
    const handle_student_assignment_update = useCallback((data) => {
        console.log('📊 Student assignment updated:', data);
        set_unregistered_students(data.unregistered_students || []);
        set_unassigned_proctors(data.unassigned_proctors || []);
    }, []);

    const handle_assignment_notification = useCallback((notification) => {
        console.log('🔔 New assignment notification:', notification);
    }, []);

    const ws_events = useMemo(() => ({
        student_assignment_update: handle_student_assignment_update,
        assignment_notification: handle_assignment_notification
    }), [handle_student_assignment_update, handle_assignment_notification]);

    const { 
        connection_status, 
        emit_event, 
        is_connected 
    } = useWebsocketConnection({
        events: ws_events,
        debug: true
    });
    
    // Request initial stats when connected
    useEffect(() => {
        if (is_connected) {
            emit_event('request_live_stats');
        }
    }, [is_connected, emit_event]);

    // ====================================================================
    // EFFECTS - INITIAL DATA LOADING
    // ====================================================================
    useEffect(() => {
        Promise.all([
            load_schedule_overview(),
            load_unassigned_data(),
            load_filter_options()
        ]);
    }, [load_schedule_overview, load_unassigned_data, load_filter_options]);

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    return (
        <div className="container-fluid py-4">
            <Breadcrumb items={breadcrumb_items} />
            
            {/* Main Card */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                        <i className="bi bi-calendar-event me-2"></i>
                        Lập lịch thi
                    </h4>
                    
                    {/* Statistics badges */}
                    <div className="status-bar d-flex flex-column gap-2">
                        <button 
                            className="btn btn-warning btn-sm" 
                            onClick={() => set_show_student_list(!show_student_list)}
                        >
                            <i className="bi bi-person-exclamation me-2"></i>
                            <span className="badge bg-light text-dark">
                                {unregistered_students.length}
                            </span>
                            <span className="ms-2">Học sinh chưa đăng ký</span>
                        </button>
                        
                        <button 
                            className="btn btn-info btn-sm"
                            onClick={() => set_show_proctor_list(!show_proctor_list)}
                        >
                            <i className="bi bi-person-check me-2"></i>
                            <span className="badge bg-light text-dark">
                                {unassigned_proctors.length}
                            </span>
                            <span className="ms-2">Giám thị chưa phân công</span>
                        </button>
                    </div>
                </div>
                
                <div className="card-body">
                    {/* Filters */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <label className="form-label">Từ ngày</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filter_start_date}
                                onChange={(e) => set_filter_start_date(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Đến ngày</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filter_end_date}
                                onChange={(e) => set_filter_end_date(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Phòng</label>
                            <select 
                                className="form-select" 
                                value={filter_room}
                                onChange={(e) => set_filter_room(e.target.value)}
                            >
                                <option value="all">Tất cả phòng</option>
                                {rooms.map(room => (
                                    <option key={room.room_id} value={room.room_id}>
                                        {room.room_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Môn học</label>
                            <select 
                                className="form-select" 
                                value={filter_subject}
                                onChange={(e) => set_filter_subject(e.target.value)}
                            >
                                <option value="all">Tất cả môn</option>
                                {subjects.map(subject => (
                                    <option key={subject.subject_code} value={subject.subject_code}>
                                        {subject.subject_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button 
                                className="btn btn-primary w-100"
                                onClick={handle_filter_change}
                                disabled={is_loading}
                            >
                                <i className="bi bi-funnel me-2"></i>
                                Lọc
                            </button>
                        </div>
                    </div>

                    {/* Statistics Overview */}
                    {Object.keys(statistics).length > 0 && (
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="card bg-light">
                                    <div className="card-body text-center">
                                        <h5>Tổng quan</h5>
                                        <div className="row">
                                            <div className="col-6">
                                                <h3 className="text-primary">{statistics.total_exams}</h3>
                                                <small>Tổng kỳ thi</small>
                                            </div>
                                            <div className="col-6">
                                                <h3 className="text-success">{statistics.completion_percentage}%</h3>
                                                <small>Hoàn thành</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card bg-light">
                                    <div className="card-body text-center">
                                        <h5>Cần phân công</h5>
                                        <div className="row">
                                            <div className="col-6">
                                                <h3 className="text-warning">{statistics.exams_needing_students}</h3>
                                                <small>Thiếu học sinh</small>
                                            </div>
                                            <div className="col-6">
                                                <h3 className="text-info">{statistics.exams_needing_proctors}</h3>
                                                <small>Thiếu giám thị</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading indicator */}
                    {is_loading && (
                        <div className="text-center p-3">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                        </div>
                    )}

                    {/* Expandable student list */}
                    {show_student_list && !is_loading && (
                        <div className="mb-4">
                            <div className="card border-warning">
                                <div className="card-header bg-warning bg-opacity-10">
                                    <h6 className="mb-0">
                                        <i className="bi bi-list-ul me-2"></i>
                                        Học sinh chưa đăng ký ({unregistered_students.length})
                                    </h6>
                                </div>
                                <div className="card-body">
                                    {unregistered_students.length === 0 ? (
                                        <p className="text-muted mb-0">Tất cả học sinh đã được đăng ký thi</p>
                                    ) : (
                                        <div className="row">
                                            {unregistered_students.map(student => (
                                                <div key={student.student_id} className="col-md-4 mb-2">
                                                    <div className="card border-0 bg-light">
                                                        <div className="card-body py-2">
                                                            <h6 className="mb-1">{student.full_name}</h6>
                                                            <small className="text-muted">{student.email}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expandable proctor list */}
                    {show_proctor_list && !is_loading && (
                        <div className="mb-4">
                            <div className="card border-info">
                                <div className="card-header bg-info bg-opacity-10">
                                    <h6 className="mb-0">
                                        <i className="bi bi-list-ul me-2"></i>
                                        Giám thị chưa phân công ({unassigned_proctors.length})
                                    </h6>
                                </div>
                                <div className="card-body">
                                    {unassigned_proctors.length === 0 ? (
                                        <p className="text-muted mb-0">Tất cả giám thị đã được phân công</p>
                                    ) : (
                                        <div className="row">
                                            {unassigned_proctors.map(proctor => (
                                                <div key={proctor.proctor_id} className="col-md-4 mb-2">
                                                    <div className="card border-0 bg-light">
                                                        <div className="card-body py-2">
                                                            <h6 className="mb-1">{proctor.full_name}</h6>
                                                            <small className="text-muted">{proctor.email}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Table */}
                    {!is_loading && render_schedule_table()}

                    {/* WebSocket connection status */}
                    <div className="alert alert-info d-flex align-items-center mt-3">
                        <i className={`bi ${connection_status === 'connected' ? 'bi-wifi text-success' : 'bi-wifi-off text-danger'} me-2`}></i>
                        <span>
                            Trạng thái kết nối: 
                            <strong className={connection_status === 'connected' ? 'text-success' : 'text-danger'}>
                                {connection_status === 'connected' ? ' Đã kết nối' : ' Mất kết nối'}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            {show_assignment_modal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {assignment_type === 'student' ? 'Phân công học sinh' : 'Phân công giám thị'} - {selected_exam_for_assignment?.title}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => set_show_assignment_modal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {assignment_type === 'student' ? (
                                    <div>
                                        <h6>Chọn học sinh để phân công:</h6>
                                        <div className="row">
                                            {unregistered_students.map(student => (
                                                <div key={student.student_id} className="col-md-6 mb-2">
                                                    <div className="form-check">
                                                        <input 
                                                            className="form-check-input" 
                                                            type="checkbox" 
                                                            checked={selected_students.includes(student.student_id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    set_selected_students(prev => [...prev, student.student_id]);
                                                                } else {
                                                                    set_selected_students(prev => prev.filter(id => id !== student.student_id));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label">
                                                            {student.full_name}
                                                            <br />
                                                            <small className="text-muted">{student.email}</small>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {unregistered_students.length === 0 && (
                                            <p className="text-muted">Không có học sinh chưa đăng ký</p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h6>Chọn giám thị để phân công:</h6>
                                        <div className="row">
                                            {unassigned_proctors.map(proctor => (
                                                <div key={proctor.proctor_id} className="col-md-6 mb-2">
                                                    <div className="form-check">
                                                        <input 
                                                            className="form-check-input" 
                                                            type="checkbox" 
                                                            checked={selected_proctors.includes(proctor.proctor_id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    set_selected_proctors(prev => [...prev, proctor.proctor_id]);
                                                                } else {
                                                                    set_selected_proctors(prev => prev.filter(id => id !== proctor.proctor_id));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label">
                                                            {proctor.full_name}
                                                            <br />
                                                            <small className="text-muted">{proctor.email}</small>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {unassigned_proctors.length === 0 && (
                                            <p className="text-muted">Không có giám thị chưa phân công</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => set_show_assignment_modal(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={handle_assignment_submit}
                                    disabled={
                                        assignment_type === 'student' 
                                            ? selected_students.length === 0 
                                            : selected_proctors.length === 0
                                    }
                                >
                                    Phân công ({assignment_type === 'student' ? selected_students.length : selected_proctors.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageSchedulePage;