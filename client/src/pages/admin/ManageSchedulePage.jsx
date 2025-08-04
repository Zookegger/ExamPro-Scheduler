import React, { useEffect, useState, useCallback, useMemo} from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import useWebsocketConnection from '../../hooks/use_websocket_connection';

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
    const [unregistered_students, set_unregistered_students] = useState([]);
    const [unassigned_proctors, set_unassigned_proctors] = useState([]);
    
    // UI states
    const [is_loading, set_is_loading] = useState(false);
    const [show_student_list, set_show_student_list] = useState(false);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    function show_unassigned_students() {
        return (
            <ul>
                {unregistered_students.map(student => (
                    <li key={student.student_id}>{student.full_name}</li>
                ))}
            </ul>
        );
    }

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
            // Request initial stats when connected
            emit_event('request_live_stats');
        }
    }, [is_connected, emit_event]);

    // ====================================================================
    // EFFECTS - INITIAL DATA LOADING
    // ====================================================================
    useEffect(() => {
        console.log('📊 Loading initial data...');
        set_is_loading(true);

        // Mock data for development
        const mock_unregistered_students = [
            { student_id: 1, full_name: "Nguyễn Văn A", email: "nguyenvana@example.com" },
            { student_id: 2, full_name: "Trần Thị B", email: "tranthib@example.com" }
        ]; 

        const mock_unassigned_proctors = [
            { proctor_id: 1, full_name: "GV. Phạm Văn C", email: "phamvanc@example.com" },
            { proctor_id: 2, full_name: "GV. Lê Thị D", email: "lethid@example.com" }
        ];

        // Set mock data
        set_unregistered_students(mock_unregistered_students);
        set_unassigned_proctors(mock_unassigned_proctors);
        
        set_is_loading(false);
        console.log('✅ Initial data loaded');
    }, []); // Run once on component mount

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    return (
        <div className="container-fluid py-4">
            <Breadcrumb items={breadcrumb_items} />
            
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
                            <span className="ms-2">Học sinh chưa phân công</span>
                        </button>
                        
                        <button className="btn btn-info btn-sm">
                            <i className="bi bi-person-check me-2"></i>
                            <span className="badge bg-light text-dark">
                                {unassigned_proctors.length}
                            </span>
                            <span className="ms-2">Giám thị chưa phân công</span>
                        </button>
                    </div>
                </div>
                
                <div className="card-body">
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
                                        Học sinh chưa phân công ({unregistered_students.length})
                                    </h6>
                                </div>
                                <div className="card-body">
                                    {unregistered_students.length === 0 ? (
                                        <p className="text-muted mb-0">Tất cả học sinh đã được phân công</p>
                                    ) : (
                                        <div className="row">
                                            <div className="col-md-8">
                                                {show_unassigned_students()}
                                            </div>
                                            <div className="col-md-4">
                                                <button className="btn btn-success btn-sm">
                                                    <i className="bi bi-plus-circle me-2"></i>
                                                    Phân công hàng loạt
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WebSocket connection status */}
                    <div className="alert alert-info d-flex align-items-center">
                        <i className={`bi ${connection_status === 'connected' ? 'bi-wifi text-success' : 'bi-wifi-off text-danger'} me-2`}></i>
                        <span>
                            Trạng thái kết nối: 
                            <strong className={connection_status === 'connected' ? 'text-success' : 'text-danger'}>
                                {connection_status === 'connected' ? ' Đã kết nối' : ' Mất kết nối'}
                            </strong>
                        </span>
                    </div>

                    {/* Main content placeholder */}
                    <div className="text-center p-4">
                        <i className="bi bi-calendar-plus display-1 text-muted"></i>
                        <h5 className="mt-3 text-muted">Tính năng lập lịch thi đang được phát triển</h5>
                        <p className="text-muted">
                            Sử dụng các nút phía trên để quản lý học sinh và giám thị chưa được phân công
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageSchedulePage;