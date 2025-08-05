import React, { useState, useEffect, useCallback, useMemo } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
import { getAllRooms, createRoom, updateRoom, deleteRoom } from "../../services/apiService";
import useWebsocketConnection from "../../hooks/use_websocket_connection";

function ManageRoomPage({ current_user, current_user_role }) {
    const [rooms, set_rooms] = useState([]);
    const [loading, set_loading] = useState(true);
    const [show_modal, set_show_modal] = useState(false);
    const [modal_mode, set_modal_mode] = useState('create'); // 'create', 'edit', 'delete'
    const [selected_room, set_selected_room] = useState(null);
    const [form_data, set_form_data] = useState({
        room_name: '',
        building: '',
        floor: 1,
        capacity: 30,
        has_computers: false,
        features: '',
        is_active: true
    });
    const [search_term, set_search_term] = useState('');
    const [filter_building, set_filter_building] = useState('all');
    const [filter_status, set_filter_status] = useState('all');
    const [error_message, set_error_message] = useState('');

    // ====================================================================
    // WEBSOCKET EVENT HANDLER FUNCTIONS
    // ====================================================================
    const handle_room_table_update = useCallback((data) => {
        console.log('🏢 Room table update received:', data);
        const { action, room, admin_info } = data;

        switch (action) {
            case 'create':
                set_rooms(prev => [...prev, room]);
                show_success_toast(`Phòng "${room.room_name}" đã được tạo bởi ${admin_info?.full_name || 'Admin'}`);
                break;
            case 'update':
                set_rooms(prev => prev.map(r => r.room_id === room.room_id ? room : r));
                show_success_toast(`Phòng "${room.room_name}" đã được cập nhật bởi ${admin_info?.full_name || 'Admin'}`);
                break;
            case 'delete':
                set_rooms(prev => prev.filter(r => r.room_id !== room.room_id));
                show_warning_toast(`Phòng "${room.room_name}" đã được xóa bởi ${admin_info?.full_name || 'Admin'}`);
                break;
            default:
                console.warn('Unknown room table update action:', action);
        }
    }, []);

    const handle_room_status_change = useCallback((data) => {
        console.log('📊 Room status change received:', data);
        const { room_id, status, exam_info } = data;

        set_rooms(prev => prev.map(room => {
            if (room.room_id === room_id) {
                return {
                    ...room,
                    exam_status: {
                        status: status,
                        status_text: get_exam_status_text(status),
                        status_class: get_exam_status_class(status),
                        current_exam: exam_info,
                        timestamp: data.timestamp
                    }
                };
            }
            return room;
        }));
    }, []);

    const handle_room_status_update = useCallback((data) => {
        console.log('🔄 Room status update received:', data);
        if (data.success && data.room_statuses) {
            // Update multiple room statuses
            set_rooms(prev => prev.map(room => {
                const status_info = data.room_statuses.find(s => s.room_id === room.room_id);
                if (status_info) {
                    return {
                        ...room,
                        exam_status: status_info.exam_status
                    };
                }
                return room;
            }));
        }
    }, []);

    const handle_room_notification = useCallback((data) => {
        console.log('📢 Room notification received:', data);
        if (data.success) {
            show_success_toast(data.message);
        } else {
            show_error_toast(data.message);
        }
    }, []);

    const handle_room_error = useCallback((data) => {
        console.error('❌ Room error received:', data);
        show_error_toast(data.message || 'Lỗi hệ thống');
    }, []);

    // WebSocket event handlers for real-time room management
    const room_websocket_events = useMemo(() => ({
        'room_table_update': handle_room_table_update,
        'room_exam_status_change': handle_room_status_change,
        'room_status_update': handle_room_status_update,
        'room_notification': handle_room_notification,
        'room_error': handle_room_error
    }), [handle_room_table_update, handle_room_status_change, handle_room_status_update, handle_room_notification, handle_room_error]);

    // Initialize WebSocket connection
    const { is_connected, emit_event } = useWebsocketConnection({
        events: room_websocket_events
    });

    // Helper functions for exam status display
    function get_exam_status_text(status) {
        switch (status) {
            case 'in_exam': return 'Đang thi';
            case 'scheduled': return 'Có lịch thi';
            case 'available': return 'Sẵn sàng';
            default: return 'Không xác định';
        }
    }

    function get_exam_status_class(status) {
        switch (status) {
            case 'in_exam': return 'bg-warning';
            case 'scheduled': return 'bg-info';
            case 'available': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    // Toast notification functions
    function show_success_toast(message) {
        // You can integrate with react-toastify or similar library
        console.log('✅ Success:', message);
        // For now, just update error message with success styling
        set_error_message('');
    }

    function show_warning_toast(message) {
        console.log('⚠️ Warning:', message);
    }

    function show_error_toast(message) {
        console.log('❌ Error:', message);
        set_error_message(message);
    }

    const handle_api_get_all_rooms = async () => {
        try {
            set_loading(true);
            console.log('Fetching rooms from API...');
            
            const result = await getAllRooms();
            
            if (result.success) {
                set_rooms(result.rooms || []);
                console.log('Successfully loaded', result.rooms?.length || 0, 'rooms');
            } else {
                console.error('Failed to fetch rooms:', result.message);
                set_error_message(result.message || 'Không thể tải danh sách phòng');
                set_rooms([]);
            }
        } catch (error) {
            console.error('API call error:', error);
            set_error_message('Lỗi kết nối đến máy chủ');
            set_rooms([]);
        } finally {
            set_loading(false);
        }
    };

    // WebSocket connection setup (already defined above with event handlers)

    useEffect(() => {
        handle_api_get_all_rooms();
    }, []);

    // Check if user has admin access
    if (current_user_role !== 'admin') {
        return <AccessDeniedPage />;
    }

    const get_status_text = (is_active) => {
        return is_active ? 'Hoạt động' : 'Ngừng hoạt động';
    };

    const get_status_badge_class = (is_active) => {
        return is_active ? 'bg-success' : 'bg-danger';
    };

    const get_computer_status_text = (has_computers) => {
        return has_computers ? 'Có máy tính' : 'Không có máy tính';
    };

    const get_unique_buildings = () => {
        const buildings = [...new Set(rooms.map(room => room.building).filter(building => building))];
        return buildings.sort();
    };

    const handle_modal_open = (mode, room = null) => {
        set_modal_mode(mode);
        set_selected_room(room);
        
        if (mode === 'create') {
            set_form_data({
                room_name: '',
                building: '',
                floor: 1,
                capacity: 30,
                has_computers: false,
                features: '',
                is_active: true
            });
        } else if (mode === 'edit' && room) {
            set_form_data({
                room_name: room.room_name,
                building: room.building || '',
                floor: room.floor,
                capacity: room.capacity,
                has_computers: room.has_computers,
                features: room.features || '',
                is_active: room.is_active
            });
        }
        
        set_error_message('');
        set_show_modal(true);
    };

    const handle_modal_close = () => {
        set_show_modal(false);
        set_selected_room(null);
        set_form_data({
            room_name: '',
            building: '',
            floor: 1,
            capacity: 30,
            has_computers: false,
            features: '',
            is_active: true
        });
        set_error_message('');
    };

    const handle_form_submit = async (e) => {
        e.preventDefault();
        
        try {
            set_error_message('');
            
            if (modal_mode === 'create') {
                console.log('Creating room:', form_data);
                const result = await createRoom(form_data);
                
                if (result.success) {
                    console.log('Room created successfully:', result.room);
                
                    emit_event('room_created', {
                        room_data: result.data,
                        admin_info: current_user
                    })

                    // Update local state
                    set_rooms(prev => [...prev, result.data]);

                    handle_modal_close();
                } else {
                    set_error_message(result.message || 'Không thể tạo phòng mới');
                    return;
                }
            } else if (modal_mode === 'edit') {
                console.log('Updating room:', selected_room.room_id, form_data);
                const result = await updateRoom(selected_room.room_id, form_data);
                
                if (result.success) {
                    console.log('Room updated successfully:', result.room);

                    emit_event('room_updated', {
                        room_data: result.data,
                        admin_info: current_user
                    })

                    // Update local state
                    set_rooms(prev => prev.map(r => 
                        r.room_id === result.room.room_id ? result.data : r
                    ));

                    handle_modal_close();

                } else {
                    set_error_message(result.message || 'Không thể cập nhật phòng');
                    return;
                }
            } else if (modal_mode === 'delete') {
                console.log('Deleting room:', selected_room.room_id);
                const result = await deleteRoom(selected_room.room_id);
                
                if (result.success) {
                    emit_event('room_deleted', {
                        room_data: result.data,
                        admin_info: current_user
                    });
                    
                    // Update local state - remove the deleted room
                    set_rooms(prev => prev.filter(r => 
                        r.room_id !== result.data.room_id ? result.data : r
                    ));
                
                    handle_modal_close();
                } else {
                    set_error_message(result.message || 'Không thể xóa phòng');
                    return;
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            set_error_message('Đã xảy ra lỗi khi thực hiện thao tác');
        }
    };

    const handle_input_change = (e) => {
        const { name, value, type, checked } = e.target;
        set_form_data(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Filter rooms based on search and filter criteria
    const filtered_rooms = rooms.filter(room => {
        // Add safety check for undefined/null rooms
        if (!room || !room.room_name) return false;
        
        const matches_search = room.room_name.toLowerCase().includes(search_term.toLowerCase()) ||
                             (room.building && room.building.toLowerCase().includes(search_term.toLowerCase()));
        const matches_building = filter_building === 'all' || room.building === filter_building;
        const matches_status = filter_status === 'all' || 
                              (filter_status === 'active' && room.is_active) ||
                              (filter_status === 'inactive' && !room.is_active);
        
        return matches_search && matches_building && matches_status;
    });

    return (
        <div className="container-fluid">
            {/* Breadcrumb Navigation */}
            <Breadcrumb items={[
                { label: 'Quản lý Thi', path: '/', icon: 'bi-journal-check' },
                { label: 'Phòng Thi', icon: 'bi-door-closed' }
            ]} />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <button 
                                className="btn btn-success"
                                onClick={() => handle_modal_open('create')}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Thêm phòng mới
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
                                            placeholder="Tìm kiếm phòng..."
                                            value={search_term}
                                            onChange={(e) => set_search_term(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filter_building}
                                        onChange={(e) => set_filter_building(e.target.value)}
                                    >
                                        <option value="all">Tất cả tòa nhà</option>
                                        {get_unique_buildings().map(building => (
                                            <option key={building} value={building}>{building}</option>
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
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Ngừng hoạt động</option>
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <span className="text-muted">
                                        {filtered_rooms.length} phòng
                                    </span>
                                </div>
                            </div>

                            {/* Loading State */}
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Đang tải danh sách phòng...</p>
                                </div>
                            ) : (
                                /* Room Table */
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th scope="col">Mã</th>
                                                <th scope="col">Tên phòng</th>
                                                <th scope="col">Tòa nhà / Tầng</th>
                                                <th scope="col">Sức chứa</th>
                                                <th scope="col">Máy tính</th>
                                                <th scope="col">Tính năng</th>
                                                <th scope="col">Trạng thái thi</th>
                                                <th scope="col">Trạng thái</th>
                                                <th scope="col">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered_rooms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9" className="text-center py-4 text-muted">
                                                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                        Không có phòng nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                filtered_rooms.map(room => (
                                                    <tr key={room.room_id}>
                                                        <td>
                                                            <code className="text-muted">#{room.room_id}</code>
                                                        </td>
                                                        <td>
                                                            <strong>{room.room_name}</strong>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <span className="badge bg-info text-dark me-1">
                                                                    {room.building || 'Chưa xác định'}
                                                                </span>
                                                                <small className="text-muted">Tầng {room.floor}</small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-primary">
                                                                {room.capacity} người
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${room.has_computers ? 'bg-success' : 'bg-secondary'}`}>
                                                                {get_computer_status_text(room.has_computers)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="small text-muted" style={{ maxWidth: '200px' }}>
                                                                {room.features ? (
                                                                    room.features.length > 50 
                                                                        ? room.features.substring(0, 50) + '...' 
                                                                        : room.features
                                                                ) : (
                                                                    <em>Chưa có thông tin</em>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {room.exam_status ? (
                                                                <div>
                                                                    <span className={`badge ${room.exam_status.status_class}`}>
                                                                        {room.exam_status.status_text}
                                                                    </span>
                                                                    {room.exam_status.current_exam && (
                                                                        <div className="small text-muted mt-1">
                                                                            {room.exam_status.current_exam.title}
                                                                        </div>
                                                                    )}
                                                                    {room.exam_status.upcoming_exams && room.exam_status.upcoming_exams.length > 0 && (
                                                                        <div className="small text-muted mt-1">
                                                                            Kế tiếp: {room.exam_status.upcoming_exams[0].title}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="badge bg-secondary">Đang tải...</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${get_status_badge_class(room.is_active)}`}>
                                                                {get_status_text(room.is_active)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group btn-group-sm" role="group">
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => handle_modal_open('edit', room)}
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => handle_modal_open('delete', room)}
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
                                    {modal_mode === 'create' && '✨ Thêm phòng mới'}
                                    {modal_mode === 'edit' && '✏️ Chỉnh sửa phòng'}
                                    {modal_mode === 'delete' && '🗑️ Xóa phòng'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={handle_modal_close}
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
                                            <h5 className="mt-3">Bạn có chắc chắn muốn xóa phòng này?</h5>
                                            <p className="text-muted">
                                                <strong>{selected_room?.room_name}</strong> - {selected_room?.building}<br />
                                                Hành động này không thể hoàn tác.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Tên phòng <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="room_name"
                                                        value={form_data.room_name}
                                                        onChange={handle_input_change}
                                                        placeholder="Ví dụ: Phòng A1"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Tòa nhà</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="building"
                                                        value={form_data.building}
                                                        onChange={handle_input_change}
                                                        placeholder="Ví dụ: Tòa nhà A"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Tầng <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        name="floor"
                                                        value={form_data.floor}
                                                        onChange={handle_input_change}
                                                        required
                                                    >
                                                        <option value={0}>Tầng trệt</option>
                                                        <option value={1}>Tầng 1</option>
                                                        <option value={2}>Tầng 2</option>
                                                        <option value={3}>Tầng 3</option>
                                                        <option value={4}>Tầng 4</option>
                                                        <option value={5}>Tầng 5</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Sức chứa <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        name="capacity"
                                                        value={form_data.capacity}
                                                        onChange={handle_input_change}
                                                        min="1"
                                                        max="200"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">Trạng thái</label>
                                                    <select
                                                        className="form-select"
                                                        name="is_active"
                                                        value={form_data.is_active}
                                                        onChange={handle_input_change}
                                                    >
                                                        <option value={true}>Hoạt động</option>
                                                        <option value={false}>Ngừng hoạt động</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            name="has_computers"
                                                            id="has_computers"
                                                            checked={form_data.has_computers}
                                                            onChange={handle_input_change}
                                                        />
                                                        <label className="form-check-label" htmlFor="has_computers">
                                                            Phòng có máy tính
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label">Tính năng đặc biệt</label>
                                                    <textarea
                                                        className="form-control"
                                                        name="features"
                                                        rows="3"
                                                        value={form_data.features}
                                                        onChange={handle_input_change}
                                                        placeholder="Ví dụ: Máy chiếu, Điều hòa, Wifi, Bảng thông minh..."
                                                    />
                                                    <div className="form-text">
                                                        Mô tả các trang thiết bị và tính năng đặc biệt của phòng
                                                    </div>
                                                </div>
                                            </div>
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
                                        type="submit" 
                                        className={`btn ${modal_mode === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                                    >
                                        {modal_mode === 'create' && 'Thêm phòng'}
                                        {modal_mode === 'edit' && 'Lưu thay đổi'}
                                        {modal_mode === 'delete' && 'Xóa phòng'}
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

export default ManageRoomPage;