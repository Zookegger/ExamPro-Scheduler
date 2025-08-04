import React, { useState, useEffect } from 'react';
import useWebsocketConnection from '../hooks/use_websocket_connection';

function WebSocketTokenTest() {
    const {
        socket,
        connection_status,
        is_connected,
        is_authenticated,
        error_message,
        emit_event,
        disconnect_socket,
        reconnect_socket,
        authenticate,
        join_room_management,
        request_room_status_update
    } = useWebsocketConnection({ 
        debug: true,
        events: {
            'token_status': handleTokenStatus,
            'notification_update': handleNotification,
            'permission_check': handlePermissionCheck
        }
    });

    const [test_message, set_test_message] = useState('');
    const [last_ping, set_last_ping] = useState(null);
    const [token_expiry, set_token_expiry] = useState(null);
    const [reconnect_count, set_reconnect_count] = useState(0);

    // Event handlers for WebSocket events
    function handleTokenStatus(data) {
        console.log('Token status:', data);
        if (data.expires_at) {
            set_token_expiry(new Date(data.expires_at));
        }
    }

    function handleNotification(data) {
        console.log('Notification:', data);
    }

    function handlePermissionCheck(data) {
        console.log('Permission check:', data);
    }

    /**
     * Update token information periodically
     */
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('Connected to WebSocket');
        };

        const handleDisconnect = (reason) => {
            console.log('Disconnected:', reason);
            set_reconnect_count(prev => prev + 1);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

    /**
     * Test sending a ping message - uses actual server events
     */
    const send_test_ping = () => {
        if (!is_authenticated) {
            alert('Not authenticated - please connect first');
            return;
        }

        if (emit_event('check_token_expiry')) {
            set_last_ping(new Date().toLocaleTimeString());
            console.log('🏓 Sent token expiry check request');
        } else {
            console.error('❌ Failed to send token expiry check');
        }
    };

    /**
     * Test notification system
     */
    const send_test_notification = () => {
        if (!is_authenticated) {
            alert('Not authenticated - please connect first');
            return;
        }

        if (emit_event('join_notification_room', 'admin_user_123')) {
            console.log('🔔 Sent join notification room request');
        } else {
            console.error('❌ Failed to send notification test');
        }
    };

    /**
     * Test permission check
     */
    const test_permissions = () => {
        if (!is_authenticated) {
            alert('Not authenticated - please connect first');
            return;
        }

        if (emit_event('check_permissions')) {
            console.log('🔐 Sent permission check request');
        } else {
            console.error('❌ Failed to send permission check');
        }
    };

    /**
     * Format time remaining until token expiry
     */
    const format_time_remaining = () => {
        if (!token_expiry) return 'N/A';
        
        const milliseconds = token_expiry - Date.now();
        if (milliseconds <= 0) return 'Expired';
        
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    /**
     * Get status badge color based on connection state
     */
    const get_status_badge_class = () => {
        switch (connection_status) {
            case 'authenticated': return 'bg-success';
            case 'connected': return 'bg-primary';
            case 'connecting': return 'bg-info';
            case 'reconnecting': return 'bg-warning';
            case 'error': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                🧪 WebSocket Token Renewal Test
                                <span className={`badge ms-2 ${get_status_badge_class()}`}>
                                    {connection_status?.toUpperCase() || 'UNKNOWN'}
                                </span>
                            </h5>
                        </div>
                        <div className="card-body">
                            {/* Connection Status */}
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <h6 className="card-title">📡 Connection Status</h6>
                                            <div className="mb-2">
                                                <strong>State:</strong> 
                                                <span className="ms-2">{connection_status || 'disconnected'}</span>
                                            </div>
                                            <div className="mb-2">
                                                <strong>Connected:</strong> 
                                                <span className={`ms-2 ${is_connected ? 'text-success' : 'text-danger'}`}>
                                                    {is_connected ? '✅ Yes' : '❌ No'}
                                                </span>
                                            </div>
                                            <div className="mb-2">
                                                <strong>Authenticated:</strong> 
                                                <span className={`ms-2 ${is_authenticated ? 'text-success' : 'text-warning'}`}>
                                                    {is_authenticated ? '🔐 Yes' : '🔓 No'}
                                                </span>
                                            </div>
                                            <div className="mb-0">
                                                <strong>Reconnect Count:</strong> 
                                                <span className="ms-2">{reconnect_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <h6 className="card-title">🔑 Token Information</h6>
                                            <div className="mb-2">
                                                <strong>Expires At:</strong> 
                                                <span className="ms-2">
                                                    {token_expiry ? 
                                                        token_expiry.toLocaleTimeString() : 
                                                        'N/A'
                                                    }
                                                </span>
                                            </div>
                                            <div className="mb-0">
                                                <strong>Time Remaining:</strong> 
                                                <span className={`ms-2 ${token_expiry && (token_expiry - Date.now()) < 300000 ? 'text-warning' : 'text-success'}`}>
                                                    {format_time_remaining()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Error Display */}
                            {error_message && (
                                <div className="alert alert-danger mb-4" role="alert">
                                    <strong>❌ Error:</strong> {error_message}
                                </div>
                            )}

                            {/* Connection Controls */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">🎮 Connection Controls</h6>
                                            <div className="btn-group me-3" role="group">
                                                <button 
                                                    className="btn btn-success"
                                                    onClick={reconnect_socket}
                                                    disabled={is_connected}
                                                >
                                                    🔌 Connect
                                                </button>
                                                <button 
                                                    className="btn btn-danger"
                                                    onClick={disconnect_socket}
                                                    disabled={!is_connected}
                                                >
                                                    🔌 Disconnect
                                                </button>
                                            </div>
                                            
                                            <button 
                                                className="btn btn-warning"
                                                onClick={authenticate}
                                                disabled={!is_connected || is_authenticated}
                                            >
                                                🔄 Authenticate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Test Communication */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <h6 className="card-title">📡 Test Communication</h6>
                                            
                                            {/* Token Status Test */}
                                            <div className="mb-3">
                                                <h6 className="small fw-bold text-muted mb-2">Token Status Check</h6>
                                                <button 
                                                    className="btn btn-primary me-2"
                                                    onClick={send_test_ping}
                                                    disabled={!is_authenticated}
                                                >
                                                    🏓 Check Token Expiry
                                                </button>
                                                <small className="text-muted">
                                                    Sends 'check_token_expiry' event to server
                                                </small>
                                            </div>

                                            {/* Notification Test */}
                                            <div className="mb-3">
                                                <h6 className="small fw-bold text-muted mb-2">Notification System Test</h6>
                                                <button 
                                                    className="btn btn-success me-2"
                                                    onClick={send_test_notification}
                                                    disabled={!is_authenticated}
                                                >
                                                    🔔 Test Notifications
                                                </button>
                                                <small className="text-muted">
                                                    Sends 'join_notification_room' event to server
                                                </small>
                                            </div>

                                            {/* Permission Test */}
                                            <div className="mb-3">
                                                <h6 className="small fw-bold text-muted mb-2">Permission Check Test</h6>
                                                <button 
                                                    className="btn btn-warning me-2"
                                                    onClick={test_permissions}
                                                    disabled={!is_authenticated}
                                                >
                                                    🔐 Check Permissions
                                                </button>
                                                <small className="text-muted">
                                                    Sends 'check_permissions' event to server
                                                </small>
                                            </div>

                                            {last_ping && (
                                                <div className="alert alert-info small mb-0">
                                                    <strong>Last test sent:</strong> {last_ping} - Check browser console for responses
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Information */}
                            <div className="row mt-4">
                                <div className="col-12">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <h6 className="card-title">ℹ️ Test Information</h6>
                                            <p className="mb-2">
                                                <strong>Purpose:</strong> This component tests the WebSocket connection and authentication system.
                                            </p>
                                            <p className="mb-0">
                                                <strong>What to watch:</strong> Monitor the connection status and token expiration time.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WebSocketTokenTest;