import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { create_user, get_all_users } from "../../services/apiService";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";

function ManageUserPage({current_user_role}) {
    const [users, set_users] = useState([]);
    const [loading, set_loading] = useState(true);
    const [show_modal, set_show_modal] = useState(false);
    const [modal_mode, set_modal_mode] = useState('create'); // 'create', 'edit', 'delete'
    const [selected_user, set_selected_user] = useState(null);
    const [form_data, set_form_data] = useState({
        user_name: '',
        email: '',
        full_name: '',
        user_role: 'student',
        password: '',
        is_active: true
    });
    const [search_term, set_search_term] = useState('');
    const [filter_role, set_filter_role] = useState('all');
    const [filter_status, set_filter_status] = useState('all');

    const handle_api_get_all_user = async () => {
        try {
            const result = await get_all_users();
            console.log('API Result:', result); // Debug log
            if (result.success) {
                set_users(result.users || []); // Ensure users is always an array
            } else {
                console.error('API returned unsuccessful result:', result);
                set_users([]); // Set empty array on failure
            }
        } catch (error) {
            console.error('API call error:', error);
            set_users([]); // Set empty array on error
        } finally {
            set_loading(false);
        }
    }

    useEffect(() => {
        handle_api_get_all_user();
    }, []);

    const get_role_text = (role) => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'teacher': return 'Giáo viên';
            case 'student': return 'Học sinh';
            default: return 'Không xác định';
        }
    };

    const get_role_badge_class = (role) => {
        switch (role) {
            case 'admin': return 'bg-danger';
            case 'teacher': return 'bg-warning';
            case 'student': return 'bg-primary';
            default: return 'bg-secondary';
        }
    };

    const handle_modal_open = (mode, user = null) => {
        set_modal_mode(mode);
        set_selected_user(user);
        
        if (mode === 'create') {
            set_form_data({
                user_name: '',
                email: '',
                full_name: '',
                user_role: 'student',
                password: '',
                is_active: true
            });
        } else if (mode === 'edit' && user) {
            set_form_data({
                user_name: user.user_name,
                email: user.email,
                full_name: user.full_name,
                user_role: user.user_role,
                password: '',
                is_active: user.is_active !== undefined ? user.is_active : true
            });
        }
        
        set_show_modal(true);
    };

    const handle_modal_close = () => {
        set_show_modal(false);
        set_selected_user(null);
        set_form_data({
            user_name: '',
            email: '',
            full_name: '',
            user_role: 'student',
            password: '',
            is_active: true
        });
    };

    const handle_form_submit = async (e) => {
        e.preventDefault();
        
        try {
            if (modal_mode === 'create') {
                const result = await create_user(form_data);
                console.log('Create user result:', result);
                
                if (result.success) {
                    set_users(prev => [...prev, result.user]);
                    handle_modal_close();
                    // TODO: Show success notification
                } else {
                    // Handle error from backend
                    console.error('Failed to create user:', result.message);
                    alert(`Lỗi: ${result.message}`); // TODO: Replace with proper notification
                }
            } else if (modal_mode === 'edit') {
                // TODO: Implement edit API call
                set_users(prev => prev.map(user => 
                    user.user_id === selected_user.user_id 
                        ? { ...user, ...form_data }
                        : user
                ));
                handle_modal_close();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Lỗi hệ thống. Vui lòng thử lại.'); // TODO: Replace with proper notification
        }
    };

    const handle_delete_user = async () => {
        // TODO: Replace with actual API call
        set_users(prev => prev.filter(user => user.id !== selected_user.id));
        handle_modal_close();
    };

    const handle_input_change = (e) => {
        const { name, value } = e.target;
        set_form_data(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filtered_users = users.filter(user => {
        // Safety check to ensure user object exists
        if (!user) return false;
        
        const matches_search = (user.full_name || '').toLowerCase().includes(search_term.toLowerCase()) ||
                              (user.user_name || '').toLowerCase().includes(search_term.toLowerCase()) ||
                              (user.email || '').toLowerCase().includes(search_term.toLowerCase());
        const matches_role = filter_role === 'all' || user.user_role === filter_role;
        const matches_status = filter_status === 'all' || 
                              (filter_status === 'active' && user.is_active) ||
                              (filter_status === 'inactive' && !user.is_active);
        return matches_search && matches_role && matches_status;
    });

    if (current_user_role !== 'admin') {
        return <AccessDeniedPage></AccessDeniedPage>;
    }

    const breadcrumb_items = [
        { label: "Dashboard", link: "/main" },
        { label: "Quản lý Thi", link: "/management" },
        { label: "Quản lý Người dùng", icon: "bi-people-fill" }
    ];

    return (
        <div className="container-fluid mt-4">
            <Breadcrumb items={breadcrumb_items} />
            
            <div className="row">
                <div className="col-12">
                    {/* Page Header */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-0">
                                        <i className="bi bi-people me-2"></i>
                                        Quản lý Người dùng
                                    </h4>
                                    <small className="text-muted">Tạo, sửa, xóa và quản lý thông tin người dùng</small>
                                </div>
                                <button 
                                    className="btn btn-success"
                                    onClick={() => handle_modal_open('create')}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Thêm người dùng
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">Tìm kiếm</label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm theo tên, username hoặc email..."
                                            value={search_term}
                                            onChange={(e) => set_search_term(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Lọc theo vai trò</label>
                                    <select 
                                        className="form-select"
                                        value={filter_role}
                                        onChange={(e) => set_filter_role(e.target.value)}
                                    >
                                        <option value="all">Tất cả vai trò</option>
                                        <option value="admin">Quản trị viên</option>
                                        <option value="teacher">Giáo viên</option>
                                        <option value="student">Học sinh</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Lọc theo trạng thái</label>
                                    <select 
                                        className="form-select"
                                        value={filter_status}
                                        onChange={(e) => set_filter_status(e.target.value)}
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Vô hiệu</option>
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button 
                                        className="btn btn-outline-secondary w-100"
                                        onClick={() => {
                                            set_search_term('');
                                            set_filter_role('all');
                                            set_filter_status('all');
                                        }}
                                    >
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        Đặt lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                Danh sách người dùng 
                                <span className="badge bg-primary ms-2">{filtered_users.length}</span>
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                    <p className="mt-2">Đang tải dữ liệu...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Tên đăng nhập</th>
                                                <th>Họ và tên</th>
                                                <th>Email</th>
                                                <th>Vai trò</th>
                                                <th>Trạng thái</th>
                                                <th>Ngày tạo</th>
                                                <th className="text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered_users.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">
                                                        <i className="bi bi-inbox display-4 text-muted d-block mb-2"></i>
                                                        <span className="text-muted">Không tìm thấy người dùng nào</span>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filtered_users.map(user => (
                                                    <tr key={user.user_id || user.id}>
                                                        <td>
                                                            <span className="fw-bold text-primary">#{user.user_id || user.id}</span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-person-circle me-2 text-muted"></i>
                                                                <span className="fw-semibold">{user.user_name || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td>{user.full_name || 'N/A'}</td>
                                                        <td>
                                                            <a href={`mailto:${user.email || ''}`} className="text-decoration-none">
                                                                {user.email || 'N/A'}
                                                            </a>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${get_role_badge_class(user.user_role)}`}>
                                                                {get_role_text(user.user_role)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                                <i className={`bi ${user.is_active ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                                                                {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                <i className="bi bi-calendar3 me-1"></i>
                                                                {user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'N/A'}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group btn-group-sm" role="group">
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => handle_modal_open('edit', user)}
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => handle_modal_open('delete', user)}
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
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modal_mode === 'create' && (
                                        <>
                                            <i className="bi bi-plus-circle me-2"></i>
                                            Thêm người dùng mới
                                        </>
                                    )}
                                    {modal_mode === 'edit' && (
                                        <>
                                            <i className="bi bi-pencil me-2"></i>
                                            Chỉnh sửa người dùng
                                        </>
                                    )}
                                    {modal_mode === 'delete' && (
                                        <>
                                            <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                                            Xác nhận xóa
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
                                /* Delete Confirmation */
                                <div className="modal-body">
                                    <div className="text-center">
                                        <i className="bi bi-exclamation-triangle display-1 text-danger mb-3"></i>
                                        <h4>Bạn có chắc chắn muốn xóa?</h4>
                                        <p className="text-muted">
                                            Người dùng <strong>{selected_user?.full_name}</strong> sẽ bị xóa vĩnh viễn.
                                            Hành động này không thể hoàn tác.
                                        </p>
                                        <div className="alert alert-warning mt-3">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Tất cả dữ liệu liên quan đến người dùng này cũng sẽ bị xóa.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Create/Edit Form */
                                <form onSubmit={handle_form_submit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">
                                                    Tên đăng nhập <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="user_name"
                                                    value={form_data.user_name}
                                                    onChange={handle_input_change}
                                                    required
                                                    placeholder="Nhập tên đăng nhập"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">
                                                    Email <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    name="email"
                                                    value={form_data.email}
                                                    onChange={handle_input_change}
                                                    required
                                                    placeholder="Nhập địa chỉ email"
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">
                                                    Họ và tên <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="full_name"
                                                    value={form_data.full_name}
                                                    onChange={handle_input_change}
                                                    required
                                                    placeholder="Nhập họ và tên đầy đủ"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">
                                                    Vai trò <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="user_role"
                                                    value={form_data.user_role}
                                                    onChange={handle_input_change}
                                                    required
                                                >
                                                    <option value="student">Học sinh</option>
                                                    <option value="teacher">Giáo viên</option>
                                                    <option value="admin">Quản trị viên</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">
                                                    {modal_mode === 'create' ? 'Mật khẩu' : 'Mật khẩu mới (để trống nếu không đổi)'}
                                                    {modal_mode === 'create' && <span className="text-danger"> *</span>}
                                                </label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="password"
                                                    value={form_data.password}
                                                    onChange={handle_input_change}
                                                    required={modal_mode === 'create'}
                                                    placeholder={modal_mode === 'create' ? 'Nhập mật khẩu' : 'Để trống nếu không thay đổi'}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="is_active_switch"
                                                        name="is_active"
                                                        checked={form_data.is_active}
                                                        onChange={(e) => handle_input_change({
                                                            target: {
                                                                name: 'is_active',
                                                                value: e.target.checked
                                                            }
                                                        })}
                                                    />
                                                    <label className="form-check-label" htmlFor="is_active_switch">
                                                        <strong>Tài khoản hoạt động</strong>
                                                        <div className="text-muted small">
                                                            {form_data.is_active 
                                                                ? 'Người dùng có thể đăng nhập và sử dụng hệ thống' 
                                                                : 'Người dùng bị vô hiệu hóa và không thể đăng nhập'
                                                            }
                                                        </div>
                                                    </label>
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
                                            <i className="bi bi-x-circle me-2"></i>
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            <i className="bi bi-check-circle me-2"></i>
                                            {modal_mode === 'create' ? 'Tạo người dùng' : 'Cập nhật'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {modal_mode === 'delete' && (
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handle_modal_close}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handle_delete_user}
                                    >
                                        <i className="bi bi-trash me-2"></i>
                                        Xóa vĩnh viễn
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageUserPage;