/**
 * ManageSubjectPage.jsx - Subject Management Interface
 * 
 * Admin-only CRUD interface for managing academic subjects in the ExamPro system.
 * Provides comprehensive subject management with Bootstrap 5 modal-based forms.
 * 
 * Features:
 * - Subject listing with search and filter capabilities
 * - Create new subjects with validation
 * - Edit existing subject information
 * - Delete subjects with confirmation
 * - Active/inactive status management
 * - Vietnamese educational context integration
 * 
 * Following ExamPro patterns:
 * - snake_case naming convention
 * - Bootstrap 5 card-based layout
 * - Modal-based CRUD operations
 * - Role-based access control
 * 
 * @fileoverview Subject management interface for ExamPro Scheduler
 */

import React, { useState, useEffect } from 'react';
// TODO: Import API functions when ready
// import { get_all_subjects, create_subject, update_subject, delete_subject } from '../../services/apiService';

function ManageSubjectPage({ current_user_role }) {
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    const [subjects, set_subjects] = useState([]);
    const [loading, set_loading] = useState(true);
    const [show_modal, set_show_modal] = useState(false);
    const [modal_mode, set_modal_mode] = useState('create'); // 'create', 'edit', 'delete'
    const [selected_subject, set_selected_subject] = useState(null);
    
    const [form_data, set_form_data] = useState({
        subject_name: '',
        subject_code: '',
        department: '',
        description: '',
        credit: 3,
        is_active: true
    });
    
    // Filter and search states
    const [search_term, set_search_term] = useState('');
    const [filter_status, set_filter_status] = useState('all'); // 'all', 'active', 'inactive'
    const [filter_credit, set_filter_credit] = useState('all'); // 'all', '1', '2', '3', '4', '5'

    // ========================================================================
    // MOCK DATA FOR UI DESIGN
    // ========================================================================
    
    useEffect(() => {
        // TODO: Replace with actual API call
        const mock_subjects = [
            {
                subject_id: 1,
                subject_name: 'Toán học',
                subject_code: 'MATH001',
                department: 'Khoa Toán',
                description: 'Toán học cơ bản và nâng cao',
                credit: 4,
                is_active: true,
                created_at: '2024-01-15T10:30:00Z',
                updated_at: '2024-01-15T10:30:00Z'
            },
            {
                subject_id: 2,
                subject_name: 'Vật lý',
                subject_code: 'PHYS001',
                department: 'Khoa Vật lý',
                description: 'Vật lý đại cương',
                credit: 3,
                is_active: true,
                created_at: '2024-01-16T09:15:00Z',
                updated_at: '2024-01-16T09:15:00Z'
            },
            {
                subject_id: 3,
                subject_name: 'Hóa học',
                subject_code: 'CHEM001',
                department: 'Khoa Hóa học',
                description: 'Hóa học đại cương và hữu cơ',
                credit: 3,
                is_active: true,
                created_at: '2024-01-17T14:20:00Z',
                updated_at: '2024-01-17T14:20:00Z'
            },
            {
                subject_id: 4,
                subject_name: 'Sinh học',
                subject_code: 'BIOL001',
                department: 'Khoa Sinh học',
                description: 'Sinh học tổng quát',
                credit: 2,
                is_active: false,
                created_at: '2024-01-18T11:45:00Z',
                updated_at: '2024-01-20T16:30:00Z'
            },
            {
                subject_id: 5,
                subject_name: 'Tin học',
                subject_code: 'COMP001',
                department: 'Khoa Công nghệ thông tin',
                description: 'Tin học cơ bản và lập trình',
                credit: 4,
                is_active: true,
                created_at: '2024-01-19T08:30:00Z',
                updated_at: '2024-01-19T08:30:00Z'
            }
        ];
        
        setTimeout(() => {
            set_subjects(mock_subjects);
            set_loading(false);
        }, 500);
    }, []);

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    const get_status_badge_class = (is_active) => {
        return is_active ? 'badge bg-success' : 'badge bg-secondary';
    };
    
    const get_status_text = (is_active) => {
        return is_active ? 'Hoạt động' : 'Tạm dừng';
    };
    
    const get_credit_badge_class = (credit) => {
        const classes = {
            1: 'badge bg-info',
            2: 'badge bg-primary', 
            3: 'badge bg-success',
            4: 'badge bg-warning text-dark',
            5: 'badge bg-danger'
        };
        return classes[credit] || 'badge bg-secondary';
    };

    // ========================================================================
    // MODAL HANDLERS
    // ========================================================================
    
    const handle_modal_open = (mode, subject = null) => {
        set_modal_mode(mode);
        set_selected_subject(subject);
        
        if (mode === 'create') {
            set_form_data({
                subject_name: '',
                subject_code: '',
                department: '',
                description: '',
                credit: 3,
                is_active: true
            });
        } else if (mode === 'edit' && subject) {
            set_form_data({
                subject_name: subject.subject_name,
                subject_code: subject.subject_code,
                department: subject.department || '',
                description: subject.description || '',
                credit: subject.credit,
                is_active: subject.is_active
            });
        }
        
        set_show_modal(true);
    };
    
    const handle_modal_close = () => {
        set_show_modal(false);
        set_selected_subject(null);
        set_form_data({
            subject_name: '',
            subject_code: '',
            department: '',
            description: '',
            credit: 3,
            is_active: true
        });
    };

    // ========================================================================
    // FORM HANDLERS
    // ========================================================================
    
    const handle_form_submit = async (e) => {
        e.preventDefault();
        
        try {
            if (modal_mode === 'create') {
                // TODO: Replace with actual API call
                console.log('Creating subject:', form_data);
                
                // Mock response
                const new_subject = {
                    subject_id: Date.now(),
                    ...form_data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                set_subjects(prev => [...prev, new_subject]);
                handle_modal_close();
                alert('Môn học đã được tạo thành công!'); // TODO: Replace with proper notification
                
            } else if (modal_mode === 'edit') {
                // TODO: Replace with actual API call
                console.log('Updating subject:', selected_subject.subject_id, form_data);
                
                set_subjects(prev => prev.map(subject => 
                    subject.subject_id === selected_subject.subject_id 
                        ? { ...subject, ...form_data, updated_at: new Date().toISOString() }
                        : subject
                ));
                handle_modal_close();
                alert('Môn học đã được cập nhật thành công!'); // TODO: Replace with proper notification
            }
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Lỗi hệ thống. Vui lòng thử lại.'); // TODO: Replace with proper notification
        }
    };
    
    const handle_delete_subject = async () => {
        try {
            // TODO: Replace with actual API call
            console.log('Deleting subject:', selected_subject.subject_id);
            
            set_subjects(prev => prev.filter(subject => subject.subject_id !== selected_subject.subject_id));
            handle_modal_close();
            alert('Môn học đã được xóa thành công!'); // TODO: Replace with proper notification
        } catch (error) {
            console.error('Delete error:', error);
            alert('Lỗi khi xóa môn học. Vui lòng thử lại.'); // TODO: Replace with proper notification
        }
    };
    
    const handle_input_change = (e) => {
        const { name, value, type, checked } = e.target;
        set_form_data(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // ========================================================================
    // FILTERING LOGIC
    // ========================================================================
    
    const filtered_subjects = subjects.filter(subject => {
        // Search filter
        const matches_search = search_term === '' || 
            subject.subject_name.toLowerCase().includes(search_term.toLowerCase()) ||
            subject.subject_code.toLowerCase().includes(search_term.toLowerCase()) ||
            (subject.description && subject.description.toLowerCase().includes(search_term.toLowerCase()));
        
        // Status filter
        const matches_status = filter_status === 'all' || 
            (filter_status === 'active' && subject.is_active) ||
            (filter_status === 'inactive' && !subject.is_active);
        
        // Credit filter
        const matches_credit = filter_credit === 'all' || 
            subject.credit.toString() === filter_credit;
        
        return matches_search && matches_status && matches_credit;
    });

    // ========================================================================
    // ACCESS CONTROL
    // ========================================================================
    
    if (current_user_role !== 'admin') {
        return (
            <div className="container-fluid py-4">
                <div className="card">
                    <div className="card-body text-center">
                        <h5 className="card-title text-danger">Truy cập bị từ chối</h5>
                        <p className="card-text">Bạn không có quyền truy cập trang quản lý môn học.</p>
                        <p className="text-muted">Chỉ quản trị viên mới có thể truy cập trang này.</p>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER UI
    // ========================================================================
    
    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="card mb-4">
                <div className="card-header">
                    <div className="row align-items-center">
                        <div className="col">
                            <h4 className="mb-0">
                                <i className="fas fa-book me-2"></i>
                                Quản lý Môn học
                            </h4>
                            <small className="text-muted">Quản lý danh sách môn học trong hệ thống</small>
                        </div>
                        <div className="col-auto">
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={() => handle_modal_open('create')}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Thêm môn học
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="search" className="form-label">Tìm kiếm</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="search"
                                    placeholder="Tên môn học, mã môn học..."
                                    value={search_term}
                                    onChange={(e) => set_search_term(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="col-md-3">
                            <label htmlFor="filter_status" className="form-label">Trạng thái</label>
                            <select
                                className="form-select"
                                id="filter_status"
                                value={filter_status}
                                onChange={(e) => set_filter_status(e.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Tạm dừng</option>
                            </select>
                        </div>
                        
                        <div className="col-md-3">
                            <label htmlFor="filter_credit" className="form-label">Số tín chỉ</label>
                            <select
                                className="form-select"
                                id="filter_credit"
                                value={filter_credit}
                                onChange={(e) => set_filter_credit(e.target.value)}
                            >
                                <option value="all">Tất cả tín chỉ</option>
                                <option value="1">1 tín chỉ</option>
                                <option value="2">2 tín chỉ</option>
                                <option value="3">3 tín chỉ</option>
                                <option value="4">4 tín chỉ</option>
                                <option value="5">5 tín chỉ</option>
                            </select>
                        </div>
                        
                        <div className="col-md-2 d-flex align-items-end">
                            <button 
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={() => {
                                    set_search_term('');
                                    set_filter_status('all');
                                    set_filter_credit('all');
                                }}
                            >
                                <i className="fas fa-times me-2"></i>
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4 className="mb-0">{subjects.length}</h4>
                                    <p className="mb-0">Tổng số môn học</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-book fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4 className="mb-0">{subjects.filter(s => s.is_active).length}</h4>
                                    <p className="mb-0">Đang hoạt động</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-check-circle fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-warning text-dark">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4 className="mb-0">{subjects.filter(s => !s.is_active).length}</h4>
                                    <p className="mb-0">Tạm dừng</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-pause-circle fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4 className="mb-0">{filtered_subjects.length}</h4>
                                    <p className="mb-0">Kết quả hiển thị</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-filter fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subjects Table */}
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">Danh sách môn học</h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-2 text-muted">Đang tải danh sách môn học...</p>
                        </div>
                    ) : filtered_subjects.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="fas fa-book fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">Không tìm thấy môn học</h5>
                            <p className="text-muted">
                                {search_term || filter_status !== 'all' || filter_credit !== 'all' 
                                    ? 'Không có môn học nào phù hợp với bộ lọc hiện tại.'
                                    : 'Chưa có môn học nào được tạo.'
                                }
                            </p>
                            {search_term || filter_status !== 'all' || filter_credit !== 'all' ? (
                                <button 
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                        set_search_term('');
                                        set_filter_status('all');
                                        set_filter_credit('all');
                                    }}
                                >
                                    Xóa bộ lọc
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => handle_modal_open('create')}
                                >
                                    <i className="fas fa-plus me-2"></i>
                                    Tạo môn học đầu tiên
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Mã môn học</th>
                                        <th>Tên môn học</th>
                                        <th>Khoa</th>
                                        <th>Mô tả</th>
                                        <th>Tín chỉ</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered_subjects.map(subject => (
                                        <tr key={subject.subject_id}>
                                            <td>
                                                <code className="text-primary">{subject.subject_code}</code>
                                            </td>
                                            <td>
                                                <strong>{subject.subject_name}</strong>
                                            </td>
                                            <td>
                                                <span className="text-muted">
                                                    {subject.department || 'Chưa phân khoa'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-muted">
                                                    {subject.description || 'Chưa có mô tả'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={get_credit_badge_class(subject.credit)}>
                                                    {subject.credit} tín chỉ
                                                </span>
                                            </td>
                                            <td>
                                                <span className={get_status_badge_class(subject.is_active)}>
                                                    {get_status_text(subject.is_active)}
                                                </span>
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {new Date(subject.created_at).toLocaleDateString('vi-VN')}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm" role="group">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary"
                                                        onClick={() => handle_modal_open('edit', subject)}
                                                        title="Chỉnh sửa môn học"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handle_modal_open('delete', subject)}
                                                        title="Xóa môn học"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Create/Edit/Delete */}
            <div className={`modal fade ${show_modal ? 'show' : ''}`} 
                 style={{ display: show_modal ? 'block' : 'none' }}
                 tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {modal_mode === 'create' && (
                                    <>
                                        <i className="fas fa-plus me-2"></i>
                                        Thêm môn học mới
                                    </>
                                )}
                                {modal_mode === 'edit' && (
                                    <>
                                        <i className="fas fa-edit me-2"></i>
                                        Chỉnh sửa môn học
                                    </>
                                )}
                                {modal_mode === 'delete' && (
                                    <>
                                        <i className="fas fa-trash me-2"></i>
                                        Xác nhận xóa môn học
                                    </>
                                )}
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close"
                                onClick={handle_modal_close}
                            ></button>
                        </div>
                        
                        {modal_mode === 'delete' ? (
                            <>
                                <div className="modal-body">
                                    <div className="alert alert-warning">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        <strong>Cảnh báo!</strong> Thao tác này không thể hoàn tác.
                                    </div>
                                    <p>Bạn có chắc chắn muốn xóa môn học này không?</p>
                                    {selected_subject && (
                                        <div className="bg-light p-3 rounded">
                                            <strong>Mã môn học:</strong> {selected_subject.subject_code}<br />
                                            <strong>Tên môn học:</strong> {selected_subject.subject_name}<br />
                                            <strong>Khoa:</strong> {selected_subject.department || 'Chưa phân khoa'}<br />
                                            <strong>Số tín chỉ:</strong> {selected_subject.credit}
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={handle_modal_close}
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-danger"
                                        onClick={handle_delete_subject}
                                    >
                                        <i className="fas fa-trash me-2"></i>
                                        Xóa môn học
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handle_form_submit}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label htmlFor="subject_code" className="form-label">
                                                Mã môn học <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="subject_code"
                                                name="subject_code"
                                                value={form_data.subject_code}
                                                onChange={handle_input_change}
                                                placeholder="VD: MATH001"
                                                required
                                                maxLength="20"
                                            />
                                            <div className="form-text">
                                                Mã môn học duy nhất (tối đa 20 ký tự)
                                            </div>
                                        </div>
                                        
                                        <div className="col-md-6">
                                            <label htmlFor="credit" className="form-label">
                                                Số tín chỉ <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                id="credit"
                                                name="credit"
                                                value={form_data.credit}
                                                onChange={handle_input_change}
                                                required
                                            >
                                                <option value={1}>1 tín chỉ</option>
                                                <option value={2}>2 tín chỉ</option>
                                                <option value={3}>3 tín chỉ</option>
                                                <option value={4}>4 tín chỉ</option>
                                                <option value={5}>5 tín chỉ</option>
                                            </select>
                                        </div>
                                        
                                        <div className="col-12">
                                            <label htmlFor="subject_name" className="form-label">
                                                Tên môn học <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="subject_name"
                                                name="subject_name"
                                                value={form_data.subject_name}
                                                onChange={handle_input_change}
                                                placeholder="VD: Toán học"
                                                required
                                                maxLength="150"
                                            />
                                        </div>
                                        
                                        <div className="col-12">
                                            <label htmlFor="department" className="form-label">
                                                Khoa
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="department"
                                                name="department"
                                                value={form_data.department}
                                                onChange={handle_input_change}
                                                placeholder="VD: Khoa Toán"
                                                maxLength="255"
                                            />
                                            <div className="form-text">
                                                Tùy chọn - Khoa phụ trách môn học này
                                            </div>
                                        </div>
                                        
                                        <div className="col-12">
                                            <label htmlFor="description" className="form-label">
                                                Mô tả môn học
                                            </label>
                                            <textarea
                                                className="form-control"
                                                id="description"
                                                name="description"
                                                value={form_data.description}
                                                onChange={handle_input_change}
                                                placeholder="Mô tả ngắn về môn học..."
                                                rows="3"
                                                maxLength="500"
                                            ></textarea>
                                            <div className="form-text">
                                                Tùy chọn - Mô tả chi tiết về môn học (tối đa 500 ký tự)
                                            </div>
                                        </div>
                                        
                                        <div className="col-12">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="is_active"
                                                    name="is_active"
                                                    checked={form_data.is_active}
                                                    onChange={handle_input_change}
                                                />
                                                <label className="form-check-label" htmlFor="is_active">
                                                    Môn học đang hoạt động
                                                </label>
                                                <div className="form-text">
                                                    Chỉ những môn học hoạt động mới có thể được sử dụng để tạo kỳ thi
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={handle_modal_close}
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                    >
                                        {modal_mode === 'create' ? (
                                            <>
                                                <i className="fas fa-plus me-2"></i>
                                                Tạo môn học
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-2"></i>
                                                Cập nhật
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modal Backdrop */}
            {show_modal && (
                <div 
                    className="modal-backdrop fade show"
                    onClick={handle_modal_close}
                ></div>
            )}
        </div>
    );
}

export default ManageSubjectPage;