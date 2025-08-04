import React, { useState, useEffect, useCallback } from 'react';
import useWebsocketConnection from '../../hooks/use_websocket_connection';

/**
 * Server Health Check Component
 * 
 * Monitors and displays the health status of the backend server.
 * Uses the singleton WebSocket connection to perform health checks
 * and display real-time server status.
 */
function ServerHealthCheck({ current_user_role }) {
    const [server_status, set_server_status] = useState("Đang kiểm tra...");
    const [is_connected, set_is_connected] = useState(false);
    const [is_loading, set_is_loading] = useState(true);
    const [responses, set_responses] = useState([]);
    const [response_counter, set_response_counter] = useState(0);

    /**
     * Create standardized error response object
     * Admin gets full error details, others get limited info for security
     */
    const create_error_response = useCallback((error, user_role) => {
        const unique_id = `${Date.now()}-${response_counter}`;
        set_response_counter(prev => prev + 1);
        
        const base_response = {
            id: unique_id,
            received_at: new Date().toLocaleString('vi-VN'),
            server_status: "error",
            connection_id: "N/A"
        };

        if (user_role === "admin") {
            return {
                ...base_response,
                error_details: error.message || "Unknown error"
            };
        }

        return base_response;
    }, [response_counter]);

    /**
     * Validate server response data
     */
    const validate_server_response = (server_data) => {
        return server_data && 
               typeof server_data.timestamp === 'string' &&
               typeof server_data.server_status === 'string' &&
               typeof server_data.connection_id === 'string';
    };

    /**
     * Process valid server response
     */
    const process_server_response = useCallback((server_data) => {
        const unique_id = `${Date.now()}-${response_counter}`;
        set_response_counter(prev => prev + 1);
        
        const new_response = {
            id: unique_id,
            received_at: new Date().toLocaleString('vi-VN'),
            server_status: server_data.server_status,
            connection_id: server_data.connection_id
        };

        // Keep only last 5 responses
        set_responses((prev) => [new_response, ...prev].slice(0, 5));
    }, [response_counter]);

    // Define event handlers for the health checks
    const ws_events = {
        health_pong: (server_data) => {
            try {
                if (validate_server_response(server_data)) {
                    process_server_response(server_data);
                    set_server_status(`Máy chủ đang hoạt động (${server_data.server_status})`);
                } else {
                    console.error("❌ Invalid health response format:", server_data);
                    set_server_status("Định dạng phản hồi không hợp lệ");
                }
            } catch (error) {
                console.error("❌ Error processing health response:", error);
                const error_response = create_error_response(error, current_user_role);
                set_responses((prev) => [error_response, ...prev].slice(0, 5));
                set_server_status("Lỗi xử lý phản hồi từ máy chủ");
            }
        }
    };

    // Use the WebSocket singleton hook
    const { 
        is_connected: ws_connected, 
        emit_event
    } = useWebsocketConnection({
        events: ws_events,
        debug: true
    });
    
    // Manage ping interval for health checks
    useEffect(() => {
        console.log(`🔌 Initializing health check for role: ${current_user_role}`);
        
        // Update UI connection state when WebSocket connection changes
        set_is_connected(ws_connected);
        set_is_loading(false);
        
        let ping_interval = null;
        if (ws_connected) {
            set_server_status("Kết nối thành công! Đang kiểm tra trạng thái máy chủ...");
            
            // Start health pings every 3 seconds when connected
            ping_interval = setInterval(() => {
                console.log("📡 Sending health ping...");
                emit_event("health_ping");
            }, 3000);
        } else {
            set_server_status("Mất kết nối với máy chủ");
        }
        
        // Cleanup on unmount
        return () => {
            console.log("🧹 Cleaning up health check ping interval");
            if (ping_interval) {
                clearInterval(ping_interval);
                ping_interval = null;
            }
        };
    }, [ws_connected, emit_event, current_user_role]);

    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Trạng Thái Hệ Thống</h5>
                <span
                    className={`badge ${
                        is_connected ? "badge-success" : "badge-danger"
                    }`}
                >
                    {is_connected ? "🟢 Kết nối" : "🔴 Mất kết nối"}
                </span>
            </div>
            <div className="card-body">
                {is_loading ? (
                    <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <span>Đang kiểm tra máy chủ...</span>
                    </div>
                ) : (
                    <>
                        <p className="mb-0">{server_status}</p>
                        
                        {/* Show response history */}
                        {responses.length > 0 && (
                            <div className="mt-3" style={{ maxHeight: '20rem', overflowY: 'auto' }}>
                                <h6>Lịch sử kiểm tra gần đây:</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Thời gian</th>
                                                <th>Trạng thái</th>
                                                {current_user_role === "admin" && <th>Connection ID</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {responses.map((response) => (
                                                <tr key={response.id}>
                                                    <td>{response.received_at}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            response.server_status === "healthy" 
                                                                ? "badge-success" 
                                                                : "badge-danger"
                                                        }`}>
                                                            {response.server_status === "healthy" 
                                                                ? "✅ Hoạt động" 
                                                                : "❌ Lỗi"}
                                                        </span>
                                                    </td>
                                                    {current_user_role === "admin" && (
                                                        <td><small className="text-muted">{response.connection_id}</small></td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ServerHealthCheck;
