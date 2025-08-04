/**
 * WebSocket Hook with Automatic Token Renewal
 * 
 * Custom React hook that provides WebSocket functionality with automatic token
 * renewal capabilities. Handles connection management, authentication, and 
 * graceful reconnection when tokens expire.
 * 
 * Features:
 * - Automatic WebSocket connection setup
 * - Token-based authentication with renewal
 * - Real-time event listening and emission
 * - Connection status monitoring
 * - Error handling and reconnection logic
 * 
 * Following ExamPro patterns:
 * - snake_case naming convention
 * - Comprehensive error handling
 * - Vietnamese error messages
 * - Event-driven architecture
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { get_socket_url, get_auth_token, renew_auth_token } from '../services/apiService';
import websocket_token_manager from '../services/websocketTokenManager';

/**
 * WebSocket connection states
 */
const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    AUTHENTICATED: 'authenticated',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
};

/**
 * Custom hook for WebSocket connection with automatic token renewal
 * 
 * @param {Object} options - Hook configuration options
 * @param {boolean} [options.auto_connect=true] - Whether to auto-connect on mount
 * @param {number} [options.reconnect_attempts=5] - Max reconnection attempts
 * @param {number} [options.reconnect_delay=1000] - Delay between reconnection attempts (ms)
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {Object} WebSocket hook interface
 * 
 * @example
 * function MyComponent() {
 *     const {
 *         socket,
 *         connection_state,
 *         is_connected,
 *         is_authenticated,
 *         connect,
 *         disconnect,
 *         emit,
 *         error_message
 *     } = useWebSocket();
 * 
 *     useEffect(() => {
 *         if (is_authenticated) {
 *             // Start listening for real-time events
 *             socket.on('subject_table_update', handleSubjectUpdate);
 *         }
 *     }, [is_authenticated]);
 * 
 *     return (
 *         <div>
 *             <div>Status: {connection_state}</div>
 *             {error_message && <div className="alert alert-danger">{error_message}</div>}
 *         </div>
 *     );
 * }
 */
export function useWebSocket(options = {}) {
    const {
        auto_connect = true,
        reconnect_attempts = 5,
        reconnect_delay = 1000,
        debug = false
    } = options;

    // State management
    const [connection_state, set_connection_state] = useState(CONNECTION_STATES.DISCONNECTED);
    const [error_message, set_error_message] = useState(null);
    const [reconnect_count, set_reconnect_count] = useState(0);

    // Refs for persistent values
    const socket_ref = useRef(null);
    const reconnect_timer_ref = useRef(null);
    const is_manual_disconnect_ref = useRef(false);

    // Derived state
    const is_connected = connection_state === CONNECTION_STATES.CONNECTED || connection_state === CONNECTION_STATES.AUTHENTICATED;
    const is_authenticated = connection_state === CONNECTION_STATES.AUTHENTICATED;

    /**
     * Debug logging helper
     */
    const debug_log = useCallback((message, ...args) => {
        if (debug) {
            console.log(`[WebSocket Hook] ${message}`, ...args);
        }
    }, [debug]);

    /**
     * Set error state with automatic clearing
     */
    const set_error = useCallback((message) => {
        set_error_message(message);
        // Auto-clear error after 10 seconds
        setTimeout(() => set_error_message(null), 10000);
    }, []);

    /**
     * Setup WebSocket event listeners
     */
    const setup_socket_listeners = useCallback((socket) => {
        debug_log('Setting up socket listeners');

        // Connection events
        socket.on('connect', () => {
            debug_log('Socket connected');
            set_connection_state(CONNECTION_STATES.CONNECTED);
            set_reconnect_count(0);
            set_error_message(null);
        });

        socket.on('disconnect', (reason) => {
            debug_log('Socket disconnected:', reason);
            
            if (!is_manual_disconnect_ref.current) {
                set_connection_state(CONNECTION_STATES.DISCONNECTED);
                
                if (reason === 'io server disconnect') {
                    // Server forced disconnect, don't auto-reconnect
                    set_error('Máy chủ đã ngắt kết nối');
                } else {
                    // Network issues, attempt reconnection
                    if (reconnect_count < reconnect_attempts) {
                        const delay = reconnect_delay * Math.pow(2, reconnect_count);
                        debug_log(`Attempting reconnection in ${delay}ms (attempt ${reconnect_count + 1})`);
                        
                        set_connection_state(CONNECTION_STATES.RECONNECTING);
                        
                        setTimeout(() => {
                            set_reconnect_count(prev => prev + 1);
                            // We'll handle reconnection in the connect function
                        }, delay);
                    }
                }
            }
        });

        socket.on('connect_error', (error) => {
            debug_log('Connection error:', error);
            set_connection_state(CONNECTION_STATES.ERROR);
            set_error(`Lỗi kết nối: ${error.message}`);
        });

        // Authentication events
        socket.on('authorization_success', (data) => {
            debug_log('Authentication successful:', data);
            set_connection_state(CONNECTION_STATES.AUTHENTICATED);
            set_error_message(null);
        });

        socket.on('authorization_error', (data) => {
            debug_log('Authentication error:', data);
            set_error(`Lỗi xác thực: ${data.message}`);
            
            if (data.error_type === 'token_expired') {
                // Handle token expiration
                renew_auth_token().then(renewal_response => {
                    if (renewal_response && renewal_response.websocket_token) {
                        websocket_token_manager.initialize(
                            renewal_response.websocket_token,
                            Date.now() + (renewal_response.expires_in * 1000)
                        );
                        
                        if (socket.connected) {
                            socket.emit('renew_token', {
                                new_token: renewal_response.websocket_token
                            });
                        }
                    }
                }).catch(() => {
                    set_error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                });
            }
        });

        // Token management events
        socket.on('token_expired', (data) => {
            debug_log('Token expired:', data);
            renew_auth_token().then(renewal_response => {
                if (renewal_response && renewal_response.websocket_token) {
                    websocket_token_manager.initialize(
                        renewal_response.websocket_token,
                        Date.now() + (renewal_response.expires_in * 1000)
                    );
                    
                    if (socket.connected) {
                        socket.emit('renew_token', {
                            new_token: renewal_response.websocket_token
                        });
                    }
                }
            }).catch(() => {
                set_error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            });
        });

        socket.on('token_near_expiry', (data) => {
            debug_log('Token near expiry:', data);
            // Proactively renew token when it's about to expire
            websocket_token_manager.force_renewal();
        });

        socket.on('token_renewed', (data) => {
            debug_log('Token renewed successfully:', data);
            set_connection_state(CONNECTION_STATES.AUTHENTICATED);
            set_error_message(null);
        });

        socket.on('token_renewal_failed', (data) => {
            debug_log('Token renewal failed:', data);
            set_error('Không thể gia hạn phiên đăng nhập, vui lòng đăng nhập lại');
        });

    }, [debug_log, set_error, reconnect_count, reconnect_attempts, reconnect_delay]);

    /**
     * Renew token proactively
     */
    const renew_token = useCallback(async () => {
        try {
            await websocket_token_manager.force_renewal();
        } catch (error) {
            debug_log('Failed to renew token:', error);
        }
    }, [debug_log]);

    /**
     * Disconnect from WebSocket server
     */
    const disconnect = useCallback(() => {
        debug_log('Disconnecting from WebSocket...');
        is_manual_disconnect_ref.current = true;
        
        if (reconnect_timer_ref.current) {
            clearTimeout(reconnect_timer_ref.current);
            reconnect_timer_ref.current = null;
        }

        if (socket_ref.current) {
            socket_ref.current.disconnect();
            socket_ref.current = null;
        }

        websocket_token_manager.clear_token();
        set_connection_state(CONNECTION_STATES.DISCONNECTED);
        set_reconnect_count(0);
        set_error_message(null);
    }, [debug_log]);

    /**
     * Connect to WebSocket server
     */
    const connect = useCallback(async () => {
        if (socket_ref.current?.connected) {
            debug_log('Already connected');
            return;
        }

        debug_log('Connecting to WebSocket...');
        set_connection_state(CONNECTION_STATES.CONNECTING);
        is_manual_disconnect_ref.current = false;

        try {
            // Get fresh token
            const token = await get_auth_token();
            
            if (!token) {
                throw new Error('No authentication token available');
            }

            // Initialize token manager
            const token_data = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
            websocket_token_manager.initialize(token, token_data.exp * 1000);

            // Create socket connection
            const socket = io(get_socket_url(), {
                auth: { token },
                transports: ['websocket'],
                upgrade: false,
                rememberUpgrade: false
            });

            socket_ref.current = socket;
            setup_socket_listeners(socket);

            // Setup token manager listeners
            websocket_token_manager.add_listener('token_renewed', (data) => {
                if (socket_ref.current?.connected) {
                    socket_ref.current.emit('renew_token', {
                        new_token: data.token
                    });
                }
            });

            websocket_token_manager.add_listener('renewal_failed', () => {
                set_error('Không thể gia hạn phiên đăng nhập');
            });

        } catch (error) {
            debug_log('Connection failed:', error);
            set_connection_state(CONNECTION_STATES.ERROR);
            set_error(`Lỗi kết nối: ${error.message}`);
        }
    }, [debug_log, setup_socket_listeners, set_error]);

    /**
     * Emit event to server
     */
    const emit = useCallback((event_name, data) => {
        if (!socket_ref.current?.connected) {
            debug_log('Cannot emit - not connected');
            return false;
        }

        if (!is_authenticated) {
            debug_log('Cannot emit - not authenticated');
            return false;
        }

        debug_log('Emitting event:', event_name, data);
        socket_ref.current.emit(event_name, data);
        return true;
    }, [is_authenticated, debug_log]);

    /**
     * Setup auto-connection on mount
     */
    useEffect(() => {
        if (auto_connect) {
            connect();
        }

        // Cleanup on unmount
        return () => {
            disconnect();
            websocket_token_manager.destroy();
        };
    }, [auto_connect, connect, disconnect]);

    /**
     * Cleanup timers on unmount
     */
    useEffect(() => {
        return () => {
            if (reconnect_timer_ref.current) {
                clearTimeout(reconnect_timer_ref.current);
            }
        };
    }, []);

    return {
        // Socket instance (for direct event listening)
        socket: socket_ref.current,
        
        // Connection state
        connection_state,
        is_connected,
        is_authenticated,
        error_message,
        reconnect_count,
        
        // Actions
        connect,
        disconnect,
        emit,
        renew_token,
        
        // Token manager access
        token_manager: websocket_token_manager
    };
}

export default useWebSocket;
