import React, { useState, useEffect, useCallback, useMemo } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
import useWebsocketConnection from '../../hooks/use_websocket_connection';
import { 
    getAllExams, 
    createExam, 
    updateExam, 
    deleteExam,
    getAllSubjects,
    getAllRooms
} from '../../services/apiService';

function ManageExamPage({ current_user_role }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    // Exam data
    const [exams, set_exams] = useState([]);
    const [subjects, set_subjects] = useState([]);
    const [rooms, set_rooms] = useState([]);
    const [exam_stats, set_exam_stats] = useState({
        // Structure: exam_id -> { unregistered_student_ids: [], unassigned_proctor_ids: [] }
        // Example: 1: { unregistered_student_ids: [101, 102], unassigned_proctor_ids: [201] }
    });

    // UI states
    const [loading, set_loading] = useState(true);
    const [show_modal, set_show_modal] = useState(false);
    const [modal_mode, set_modal_mode] = useState('create'); // 'create', 'edit', 'delete'
    const [selected_exam, set_selected_exam] = useState(null);
    
    // Form data
    const [form_data, set_form_data] = useState({
        title: '',
        subject_code: '',
        description: '',
        exam_date: '',
        start_time: '',
        end_time: '',
        duration_minutes: 120,
        max_students: 20,
        room_id: '',
        method: 'multiple_choices',
        status: 'draft'
    });
    
    // Filters and search
    const [search_term, set_search_term] = useState('');
    const [filter_subject, set_filter_subject] = useState('all');
    const [filter_status, set_filter_status] = useState('all');
    const [error_message, set_error_message] = useState('');

    // WebSocket state is now managed by the custom hook

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    function get_exam_alert_counts(exam_id) {
        const stats = exam_stats[exam_id];
        if (!stats) return { unregistered_student_count: 0, unassigned_proctor_count: 0 };
        
        return {
            unregistered_student_count: stats.unregistered_student_ids?.length || 0,
            unassigned_proctor_count: stats.unassigned_proctor_ids?.length || 0
        };
    }

    function get_subject_name(subject_code) {
        const subject = subjects.find(s => s.subject_code === subject_code);
        return subject ? subject.subject_name : subject_code;
    }

    function get_room_name(room_id) {
        if (!room_id) return 'Chưa phân phòng';
        const room = rooms.find(r => r.room_id === parseInt(room_id));
        return room ? room.room_name : `Phòng #${room_id}`;
    }

    // ====================================================================
    // EFFECTS - WEBSOCKET CONNECTION USING SINGLETON HOOK
    // ====================================================================
    const handle_exam_stats_update = useCallback((data) => {
        console.log('📊 Exam stats updated:', data);
        set_exam_stats(prev => ({
            ...prev,
            [data.exam_id]: {
                unregistered_student_ids: data.unregistered_student_ids || [],
                unassigned_proctor_ids: data.unassigned_proctor_ids || []
            }
        }));
    }, []); // Empty dependency array as set_exam_stats is stable

    const handle_assignment_notification = useCallback((notification) => {
        console.log('🔔 New assignment notification:', notification);
    }, []);

    const ws_events = useMemo(() => ({
        exam_stats_update: handle_exam_stats_update,
        assignment_notification: handle_assignment_notification,
    }), [handle_exam_stats_update, handle_assignment_notification]);
    
    const { 
        connection_status,
        emit_event,
        is_connected 
    } = useWebsocketConnection({
        events: ws_events,
        debug: true
    });
    
    // Request exam stats when connected
    useEffect(() => {
        if (is_connected) {
            console.log('🔌 Requesting exam stats...');
            emit_event('request_exam_stats');
        }
    }, [is_connected, emit_event]);


    // ====================================================================
    // EFFECTS - INITIAL DATA LOADING
    // ====================================================================
    const handle_api_get_all_exams = async () => {
        try {
            console.log('📊 Fetching exams from API...');
            const result = await getAllExams();
            
            if (result.success) {
                set_exams(result.data || []);
                console.log('✅ Exams loaded successfully:', result.data?.length || 0, 'exams');
            } else {
                console.warn('⚠️ API returned no data');
                set_exams([]);
            }
        } catch (error) {
            console.error('❌ Failed to fetch exams:', error);
            set_exams([]);
            set_error_message('Không thể tải danh sách kỳ thi');
        } finally {
            set_loading(false);
        }
    };

    const handle_api_get_subjects = async () => {
        try {
            console.log('📚 Fetching subjects from API...');
            const result = await getAllSubjects();
            
            if (result.success) {
                set_subjects(result.subjects || []);
                console.log('✅ Subjects loaded successfully:', result.subjects?.length || 0, 'subjects');
            } else {
                console.warn('⚠️ Subject API returned no data');
                set_subjects([]);
            }
        } catch (error) {
            console.error('❌ Failed to fetch subjects:', error);
            set_subjects([]);
        }
    };

    const handle_api_get_rooms = async () => {
        try {
            console.log('🏢 Fetching rooms from API...');
            const result = await getAllRooms();
            
            if (result.success) {
                set_rooms(result.rooms || []);
                console.log('✅ Rooms loaded successfully:', result.rooms?.length || 0, 'rooms');
            } else {
                console.warn('⚠️ Room API returned no data');
                set_rooms([]);
            }
        } catch (error) {
            console.error('❌ Failed to fetch rooms:', error);
            set_rooms([]);
        }
    };

    useEffect(() => {
        handle_api_get_all_exams();
        handle_api_get_subjects();
        handle_api_get_rooms();
    }, []);

    // Check if user has admin access
    if (current_user_role !== 'admin') {
        return <AccessDeniedPage />;
    }

    const get_status_text = (status) => {
        switch (status) {
            case 'draft': return 'Bản nháp';
            case 'published': return 'Đã xuất bản';
            case 'in_progress': return 'Đang thi';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const get_status_badge_class = (status) => {
        switch (status) {
            case 'draft': return 'bg-secondary';
            case 'published': return 'bg-primary';
            case 'in_progress': return 'bg-warning';
            case 'completed': return 'bg-success';
            case 'cancelled': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    const get_method_text = (method) => {
        switch (method) {
            case 'essay': return 'Tự luận';
            case 'multiple_choices': return 'Trắc nghiệm';
            default: return 'Không xác định';
        }
    };

    const handle_create_exam = () => {
        set_modal_mode('create');
        set_selected_exam(null);
        set_form_data({
            title: '',
            subject_code: '',
            description: '',
            exam_date: '',
            start_time: '',
            end_time: '',
            duration_minutes: 120,
            max_students: 20,
            room_id: '',
            method: 'multiple_choices',
            status: 'draft'
        });
        set_error_message('');
        set_show_modal(true);
    };

    const handle_edit_exam = (exam) => {
        set_modal_mode('edit');
        set_selected_exam(exam);
        
        // Calculate end_time from start_time and duration_minutes if not provided
        let calculated_end_time = exam.end_time;
        if (!calculated_end_time && exam.start_time && exam.duration_minutes) {
            const [hours, minutes] = exam.start_time.split(':').map(Number);
            const start_date = new Date();
            start_date.setHours(hours, minutes, 0, 0);
            const end_date = new Date(start_date.getTime() + exam.duration_minutes * 60000);
            calculated_end_time = end_date.toTimeString().slice(0, 5);
        }
        
        set_form_data({
            title: exam.title,
            subject_code: exam.subject_code,
            description: exam.description || '',
            exam_date: exam.exam_date,
            start_time: exam.start_time,
            end_time: calculated_end_time,
            duration_minutes: exam.duration_minutes,
            max_students: exam.max_students,
            room_id: exam.room_id || '',
            method: exam.method,
            status: exam.status
        });
        set_error_message('');
        set_show_modal(true);
    };

    const handle_delete_exam = (exam) => {
        set_modal_mode('delete');
        set_selected_exam(exam);
        set_show_modal(true);
    };

    const handle_form_submit = async (e) => {
        e.preventDefault();
        set_error_message('');
        
        try {
            let result;
            
            if (modal_mode === 'create') {
                console.log('Creating exam:', form_data);
                result = await createExam(form_data);
                
                if (result.success) {
                    console.log('✅ Exam created successfully:', result.data);
                } else {
                    throw new Error(result.message || 'Failed to create exam');
                }
            } else if (modal_mode === 'edit') {
                console.log('Updating exam:', selected_exam.exam_id, form_data);
                result = await updateExam(selected_exam.exam_id, form_data);
                
                if (result.success) {
                    console.log('✅ Exam updated successfully:', result.data);
                } else {
                    throw new Error(result.message || 'Failed to update exam');
                }
            } else if (modal_mode === 'delete') {
                console.log('Deleting exam:', selected_exam.exam_id);
                result = await deleteExam(selected_exam.exam_id);
                
                if (result.success) {
                    console.log('✅ Exam deleted successfully');
                } else {
                    throw new Error(result.message || 'Failed to delete exam');
                }
            }

            set_show_modal(false);
            handle_api_get_all_exams(); // Refresh the list
        } catch (error) {
            console.error('❌ Form submission error:', error);
            set_error_message(error.message || 'Đã xảy ra lỗi khi thực hiện thao tác');
        }
    };

    const handle_input_change = (e) => {
        const { name, value } = e.target;
        set_form_data(prev => {
            const updated_data = {
                ...prev,
                [name]: value
            };
            
            // Auto-calculate end_time when start_time or duration_minutes changes
            if (name === 'start_time' || name === 'duration_minutes') {
                const start_time = name === 'start_time' ? value : prev.start_time;
                const duration = name === 'duration_minutes' ? parseInt(value) || 0 : prev.duration_minutes;
                
                if (start_time && duration > 0) {
                    // Parse start time
                    const [hours, minutes] = start_time.split(':').map(Number);
                    const start_date = new Date();
                    start_date.setHours(hours, minutes, 0, 0);
                    
                    // Add duration in minutes
                    const end_date = new Date(start_date.getTime() + duration * 60000);
                    
                    // Format as HH:MM
                    const end_time = end_date.toTimeString().slice(0, 5);
                    updated_data.end_time = end_time;
                }
            }
            
            return updated_data;
        });
    };

    // Filter exams based on search and filter criteria
    const filtered_exams = exams.filter(exam => {
        const matches_search = exam.title.toLowerCase().includes(search_term.toLowerCase()) ||
                             exam.subject_code.toLowerCase().includes(search_term.toLowerCase());
        const matches_subject = filter_subject === 'all' || exam.subject_code === filter_subject;
        const matches_status = filter_status === 'all' || exam.status === filter_status;
        
        return matches_search && matches_subject && matches_status;
    });

    return (
        <div className="container-fluid">
            {/* Breadcrumb Navigation */}
            <Breadcrumb items={[
                { label: 'Quản lý Thi', path: '/', icon: 'bi-journal-check' },
                { label: 'Kỳ Thi', icon: 'bi-calendar-event' }
            ]} />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">📝 Quản lý Kỳ thi</h5>
                            
                            <div className="d-flex align-items-center gap-3">
                                {/* Connection Status Indicator */}
                                <div className="d-flex align-items-center">
                                    <i className={`bi ${connection_status === 'connected' ? 'bi-wifi text-success' : 'bi-wifi-off text-muted'} me-2`}></i>
                                    <small className="text-muted">
                                        {connection_status === 'connected' ? 'Realtime' : 'Offline'}
                                    </small>
                                </div>
                                
                                <button 
                                    className="btn btn-success"
                                    onClick={handle_create_exam}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Tạo kỳ thi mới
                                </button>
                            </div>
                        </div>
                        
                        <div className="card-body">
                            {/* Search and Filter Controls */}
                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm kỳ thi..."
                                            value={search_term}
                                            onChange={(e) => set_search_term(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filter_subject}
                                        onChange={(e) => set_filter_subject(e.target.value)}
                                    >
                                        <option value="all">Tất cả môn học</option>
                                        {subjects.map(subject => (
                                            <option key={subject.subject_code} value={subject.subject_code}>
                                                {subject.subject_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filter_status}
                                        onChange={(e) => set_filter_status(e.target.value)}
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="draft">Bản nháp</option>
                                        <option value="published">Đã xuất bản</option>
                                        <option value="in_progress">Đang thi</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <span className="text-muted">
                                        {filtered_exams.length} kỳ thi
                                    </span>
                                </div>
                            </div>

                            {/* Loading State */}
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Đang tải danh sách kỳ thi...</p>
                                </div>
                            ) : (
                                /* Exam Table */
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th scope="col">Mã</th>
                                                <th scope="col">Tên kỳ thi</th>
                                                <th scope="col">Môn học</th>
                                                <th scope="col">Ngày thi</th>
                                                <th scope="col">Thời gian</th>
                                                <th scope="col">Phòng thi</th>
                                                <th scope="col">Phương thức</th>
                                                <th scope="col">Trạng thái</th>
                                                <th scope="col">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered_exams.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9" className="text-center py-4 text-muted">
                                                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                        Không có kỳ thi nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                filtered_exams.map(exam => (
                                                    <tr key={exam.exam_id}>
                                                        <td>
                                                            <code className="text-muted">#{exam.exam_id}</code>
                                                        </td>
                                                        <td style={{minWidth: '181px'}}>
                                                            <strong>{exam.title}</strong>
                                                            {exam.description && (
                                                                <div className="text-muted small">
                                                                    {exam.description.length > 50 
                                                                        ? exam.description.substring(0, 50) + '...' 
                                                                        : exam.description}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-info text-dark">
                                                                {exam.subject_code}
                                                            </span>
                                                            <div className="text-muted small">
                                                                {get_subject_name(exam.subject_code)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {new Date(exam.exam_date).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td>
                                                            <div className="small">
                                                                <div><strong>{exam.start_time}</strong> - {exam.end_time}</div>
                                                                <div className="text-muted">
                                                                    {exam.duration_minutes} phút
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${exam.room_id ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                {get_room_name(exam.room_id)}
                                                            </span>
                                                            {exam.max_students && (
                                                                <div className="text-muted small">
                                                                    Tối đa {exam.max_students} người
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary">
                                                                {get_method_text(exam.method)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${get_status_badge_class(exam.status)}`}>
                                                                {get_status_text(exam.status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group btn-group-sm" role="group">
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => handle_edit_exam(exam)}
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => handle_delete_exam(exam)}
                                                                    title="Xóa"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Create/Edit/Delete */}
            {show_modal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modal_mode === 'create' && '✨ Tạo kỳ thi mới'}
                                    {modal_mode === 'edit' && '✏️ Chỉnh sửa kỳ thi'}
                                    {modal_mode === 'delete' && '🗑️ Xóa kỳ thi'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => set_show_modal(false)}
                                ></button>
                            </div>
                            
                            <form onSubmit={handle_form_submit}>
                                <div className="modal-body">
                                    {error_message && (
                                        <div className="alert alert-danger" role="alert">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            {error_message}
                                        </div>
                                    )}

                                    {modal_mode === 'delete' ? (
                                        <div className="text-center">
                                            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
                                            <h5 className="mt-3">Bạn có chắc chắn muốn xóa kỳ thi này?</h5>
                                            <p className="text-muted">
                                                <strong>{selected_exam?.title}</strong><br />
                                                Hành động này không thể hoàn tác.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="row">
                                            <div className="col-md-8">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Tên kỳ thi <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="title"
                                                        value={form_data.title}
                                                        onChange={handle_input_change}
                                                        placeholder="Ví dụ: Kỳ thi Toán học giữa kỳ"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Môn học <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        name="subject_code"
                                                        value={form_data.subject_code}
                                                        onChange={handle_input_change}
                                                        required
                                                    >
                                                        <option value="">Chọn môn học</option>
                                                        {subjects.map(subject => (
                                                            <option key={subject.subject_code} value={subject.subject_code}>
                                                                {subject.subject_code} - {subject.subject_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label">Mô tả</label>
                                                    <textarea
                                                        className="form-control"
                                                        name="description"
                                                        rows="3"
                                                        value={form_data.description}
                                                        onChange={handle_input_change}
                                                        placeholder="Mô tả chi tiết về kỳ thi..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Ngày thi <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        name="exam_date"
                                                        value={form_data.exam_date}
                                                        onChange={handle_input_change}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Giờ bắt đầu <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className="form-control"
                                                        name="start_time"
                                                        value={form_data.start_time}
                                                        onChange={handle_input_change}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Giờ kết thúc <span className="text-muted">(Tự động)</span>
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className="form-control bg-light"
                                                        name="end_time"
                                                        value={form_data.end_time}
                                                        readOnly
                                                        placeholder="Sẽ tự động tính"
                                                    />
                                                    <small className="text-muted">
                                                        Được tính từ giờ bắt đầu + thời lượng
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">Thời lượng (phút)</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        name="duration_minutes"
                                                        value={form_data.duration_minutes}
                                                        onChange={handle_input_change}
                                                        min="15"
                                                        max="300"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">Số học sinh tối đa</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        name="max_students"
                                                        value={form_data.max_students}
                                                        onChange={handle_input_change}
                                                        min="1"
                                                        max="100"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">Phương thức thi</label>
                                                    <select
                                                        className="form-select"
                                                        name="method"
                                                        value={form_data.method}
                                                        onChange={handle_input_change}
                                                    >
                                                        <option value="multiple_choices">Trắc nghiệm</option>
                                                        <option value="essay">Tự luận</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Phòng thi</label>
                                                    <select
                                                        className="form-select"
                                                        name="room_id"
                                                        value={form_data.room_id}
                                                        onChange={handle_input_change}
                                                    >
                                                        <option value="">Chưa phân phòng</option>
                                                        {rooms.map(room => (
                                                            <option key={room.room_id} value={room.room_id}>
                                                                {room.room_name} ({room.capacity} chỗ)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Trạng thái</label>
                                                    <select
                                                        className="form-select"
                                                        name="status"
                                                        value={form_data.status}
                                                        onChange={handle_input_change}
                                                    >
                                                        <option value="draft">Bản nháp</option>
                                                        <option value="published">Đã xuất bản</option>
                                                        <option value="cancelled">Đã hủy</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => set_show_modal(false)}
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={`btn ${modal_mode === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                                    >
                                        {modal_mode === 'create' && 'Tạo kỳ thi'}
                                        {modal_mode === 'edit' && 'Lưu thay đổi'}
                                        {modal_mode === 'delete' && 'Xóa kỳ thi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageExamPage;