import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../AccessDeniedPage";

function ManageExamPage({ current_user_role }) {
    const [exams, set_exams] = useState([]);
    const [loading, set_loading] = useState(true);
    const [show_modal, set_show_modal] = useState(false);
    const [modal_mode, set_modal_mode] = useState('create'); // 'create', 'edit', 'delete'
    const [selected_exam, set_selected_exam] = useState(null);
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
    const [search_term, set_search_term] = useState('');
    const [filter_subject, set_filter_subject] = useState('all');
    const [filter_status, set_filter_status] = useState('all');
    const [error_message, set_error_message] = useState('');

    const handle_api_get_all_exams = async () => {
        try {
            // TODO: Implement API call to get all exams
            // const result = await get_all_exams();
            console.log('Fetching exams...');
            
            // Mock data for now - replace with actual API call
            const mock_exams = [
                {
                    exam_id: 1,
                    title: 'Kỳ thi Toán học giữa kỳ',
                    subject_code: 'MATH101',
                    exam_date: '2025-08-15',
                    start_time: '09:00:00',
                    end_time: '11:00:00',
                    duration_minutes: 120,
                    max_students: 30,
                    status: 'published',
                    room_id: 1
                }
            ];
            
            set_exams(mock_exams);
        } catch (error) {
            console.error('API call error:', error);
            set_exams([]);
        } finally {
            set_loading(false);
        }
    };

    useEffect(() => {
        handle_api_get_all_exams();
        // TODO: Also fetch subjects and rooms for dropdowns
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
        set_form_data({
            title: exam.title,
            subject_code: exam.subject_code,
            description: exam.description || '',
            exam_date: exam.exam_date,
            start_time: exam.start_time,
            end_time: exam.end_time,
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
        
        try {
            if (modal_mode === 'create') {
                // TODO: Implement create exam API call
                console.log('Creating exam:', form_data);
                // const result = await create_exam(form_data);
            } else if (modal_mode === 'edit') {
                // TODO: Implement update exam API call
                console.log('Updating exam:', selected_exam.exam_id, form_data);
                // const result = await update_exam(selected_exam.exam_id, form_data);
            } else if (modal_mode === 'delete') {
                // TODO: Implement delete exam API call
                console.log('Deleting exam:', selected_exam.exam_id);
                // const result = await delete_exam(selected_exam.exam_id);
            }

            set_show_modal(false);
            handle_api_get_all_exams(); // Refresh the list
        } catch (error) {
            console.error('Form submission error:', error);
            set_error_message('Đã xảy ra lỗi khi thực hiện thao tác');
        }
    };

    const handle_input_change = (e) => {
        const { name, value } = e.target;
        set_form_data(prev => ({
            ...prev,
            [name]: value
        }));
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
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">📝 Quản lý Kỳ thi</h5>
                            <button 
                                className="btn btn-success"
                                onClick={handle_create_exam}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Tạo kỳ thi mới
                            </button>
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
                                        {/* TODO: Add subject options */}
                                        <option value="MATH101">Toán học</option>
                                        <option value="PHYS101">Vật lý</option>
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
                                                <th scope="col">Phương thức</th>
                                                <th scope="col">Trạng thái</th>
                                                <th scope="col">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered_exams.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4 text-muted">
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
                                                        <td>
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
                                                        {/* TODO: Load from subjects API */}
                                                        <option value="MATH101">MATH101 - Toán học</option>
                                                        <option value="PHYS101">PHYS101 - Vật lý</option>
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
                                                        Giờ kết thúc <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className="form-control"
                                                        name="end_time"
                                                        value={form_data.end_time}
                                                        onChange={handle_input_change}
                                                        required
                                                    />
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
                                                        {/* TODO: Load from rooms API */}
                                                        <option value="1">Phòng A1</option>
                                                        <option value="2">Phòng A2</option>
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