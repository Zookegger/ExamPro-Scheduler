// client/src/hooks/use_websocket_connection.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { get_socket_url, get_auth_token } from '../services/apiService';

/**
 * Custom WebSocket Hook for ExamPro Real-Time Features
 * 
 * Provides a reusable WebSocket connection with automatic connection management,
 * event handling, and cleanup. Follows ExamPro's snake_case conventions and
 * integrates with the existing authentication system.
 * 
 * Features:
 * - Singleton pattern for performance (shared connection across components)
 * - Advanced reconnection with exponential backoff
 * - JWT authentication support
 * - Room management integration
 * - Memory-efficient event handling
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.events - Event handlers object
 * @param {string} options.namespace - Optional Socket.io namespace
 * @param {boolean} options.auto_connect - Whether to auto-connect on mount
 * @param {boolean} options.use_singleton - Use shared connection (default: true)
 * @returns {Object} WebSocket connection utilities
 * 
 * @example
 * // Basic usage in any component
 * const { socket, connection_status, emit_event } = useWebsocketConnection({
 *     events: {
 *         'room_table_update': handle_room_update,
 *         'assignment_notification': handle_notification
 *     }
 * });
 */
// Singleton WebSocket instance for performance
let global_socket = null;
let global_connection_status = 'disconnected';
let global_is_connected = false;
let global_is_authenticated = false;
let global_reconnect_attempts = 0;

function useWebsocketConnection(options = {}) {
    const { 
        events = {}, 
        namespace = '', 
        auto_connect = true,
        max_reconnect_attempts = 5,
        reconnect_delay = 1000
    } = options;

    // ================================================================
    // STATE MANAGEMENT
    // ================================================================
    const [connection_status, set_connection_status] = useState(global_connection_status);
    const [is_connected, set_is_connected] = useState(global_is_connected);
    const [is_authenticated, set_is_authenticated] = useState(global_is_authenticated);
    const socket_ref = useRef(null);

    // Update global state handlers
    const update_connection_status = useCallback((status) => {
        global_connection_status = status;
        set_connection_status(status);
    }, []);

    const update_is_connected = useCallback((connected) => {
        global_is_connected = connected;
        set_is_connected(connected);
    }, []);

    const update_is_authenticated = useCallback((authenticated) => {
        global_is_authenticated = authenticated;
        set_is_authenticated(authenticated);
    }, []);

    // ================================================================
    // AUTHENTICATION FUNCTIONS
    // ================================================================
    const authenticate_socket = useCallback(async () => {
        try {
            const token = await get_auth_token();
            if (!token || !global_socket || !global_is_connected) {
                return false;
            }

            console.log('🔐 Authenticating WebSocket connection...');

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.error('❌ WebSocket authentication timeout');
                    resolve(false);
                }, 5000);

                const cleanup = () => {
                    clearTimeout(timeout);
                    global_socket.off('authorization_success', success_handler);
                    global_socket.off('authorization_error', error_handler);
                };

                const success_handler = (data) => {
                    cleanup();
                    update_is_authenticated(true);
                    console.log('✅ WebSocket authenticated for user:', data.user_role);
                    resolve(true);
                };

                const error_handler = (data) => {
                    cleanup();
                    update_is_authenticated(false);
                    console.error('❌ WebSocket authentication failed:', data.message);
                    resolve(false);
                };

                global_socket.once('authorization_success', success_handler);
                global_socket.once('authorization_error', error_handler);

                global_socket.emit('authenticate', { token });
            });
        } catch (error) {
            console.error('❌ WebSocket authentication error:', error);
            return false;
        }
    }, [update_is_authenticated]);

    // ================================================================
    // RECONNECTION WITH EXPONENTIAL BACKOFF
    // ================================================================
    const attempt_reconnection = useCallback(() => {
        if (global_reconnect_attempts >= max_reconnect_attempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        global_reconnect_attempts++;
        const delay = reconnect_delay * Math.pow(2, global_reconnect_attempts - 1);
        
        console.log(`🔄 Attempting reconnection ${global_reconnect_attempts}/${max_reconnect_attempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (global_socket && !global_is_connected) {
                global_socket.connect();
            }
        }, delay);
    }, [max_reconnect_attempts, reconnect_delay]);

    // ================================================================
    // CONNECTION MANAGEMENT
    // ================================================================
    useEffect(() => {
        if (!auto_connect) return;

        // Use singleton pattern for better performance
        if (global_socket && global_is_connected) {
            console.log('🔌 Using existing WebSocket connection');
            socket_ref.current = global_socket;
            
            // Register this component's event handlers
            Object.entries(events).forEach(([event_name, handler]) => {
                if (typeof handler === 'function') {
                    global_socket.on(event_name, handler);
                }
            });
            
            return;
        }

        const initialize_websocket = async () => {
            console.log('🔌 Initializing new WebSocket connection...');
            
            // Get WebSocket token for Sec-WebSocket-Protocol header
            const websocket_token = await get_auth_token();
            
            // Create WebSocket connection using centralized URL
            const socket_url = get_socket_url();
            const socket_options = {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: false,
                upgrade: true,
                rememberUpgrade: true
            };

            // Add JWT token via Sec-WebSocket-Protocol header if available
            if (websocket_token) {
                socket_options.auth = {
                    token: websocket_token
                };
                console.log('🔐 WebSocket token added to connection options');
            }

            const new_socket = io(socket_url + namespace, socket_options);

            global_socket = new_socket;
            socket_ref.current = new_socket;

            // Enhanced connection event handlers
            new_socket.on('connect', () => {
                console.log('✅ Connected to WebSocket server');
                update_connection_status('connected');
                update_is_connected(true);
                global_reconnect_attempts = 0;
                
                // Authentication is handled automatically via Sec-WebSocket-Protocol header
                // The server will emit authorization_success if pre-authenticated
            });

            new_socket.on('disconnect', (reason) => {
                console.log(`❌ Disconnected from WebSocket server: ${reason}`);
                update_connection_status('disconnected');
                update_is_connected(false);
                update_is_authenticated(false);
                
                // Attempt reconnection for network issues
                if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
                    attempt_reconnection();
                }
            });

            new_socket.on('connect_error', (error) => {
                console.error('❌ WebSocket connection error:', error);
                update_connection_status('error');
                update_is_connected(false);
                
                // Attempt reconnection on connection errors
                attempt_reconnection();
            });

            new_socket.on('reconnect', (attempt_number) => {
                console.log(`🔌 WebSocket reconnected after ${attempt_number} attempts`);
                update_connection_status('connected');
                update_is_connected(true);
                global_reconnect_attempts = 0;
                
                // Authentication will be handled automatically on reconnection via token
            });

            // Authentication handlers
            new_socket.on('authorization_success', (data) => {
                console.log('✅ WebSocket authentication successful');
                update_is_authenticated(true);
            });

            new_socket.on('authorization_error', (data) => {
                console.error('❌ WebSocket authentication failed:', data);
                update_is_authenticated(false);
            });

            // Register custom event handlers
            Object.entries(events).forEach(([event_name, handler]) => {
                if (typeof handler === 'function') {
                    new_socket.on(event_name, handler);
                }
            });
        };

        initialize_websocket();

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up WebSocket event handlers for component');
            if (socket_ref.current) {
                // Remove only this component's event handlers
                Object.entries(events).forEach(([event_name, handler]) => {
                    if (typeof handler === 'function') {
                        socket_ref.current.off(event_name, handler);
                    }
                });
            }
        };
    }, [auto_connect, namespace, events, authenticate_socket, attempt_reconnection, update_connection_status, update_is_connected, update_is_authenticated]);

    // ================================================================
    // UTILITY FUNCTIONS
    // ================================================================
    const emit_event = useCallback((event_name, data) => {
        if (socket_ref.current && is_connected) {
            socket_ref.current.emit(event_name, data);
            return true;
        } else {
            console.warn(`Cannot emit '${event_name}' - WebSocket not connected`);
            return false;
        }
    }, [is_connected]);

    const disconnect_socket = useCallback(() => {
        if (socket_ref.current) {
            socket_ref.current.disconnect();
            global_socket = null;
            update_connection_status('disconnected');
            update_is_connected(false);
            update_is_authenticated(false);
        }
    }, [update_connection_status, update_is_connected, update_is_authenticated]);

    const reconnect_socket = useCallback(() => {
        if (socket_ref.current) {
            socket_ref.current.connect();
        }
    }, []);

    // ================================================================
    // ROOM MANAGEMENT FUNCTIONS
    // ================================================================
    const join_room_management = useCallback(() => {
        if (!socket_ref.current || !is_connected) {
            console.error('❌ Cannot join room management: WebSocket not connected');
            return false;
        }

        console.log('🏢 Joining room management channel...');
        emit_event('join_room_management');
        return true;
    }, [is_connected, emit_event]);

    const leave_room_management = useCallback(() => {
        if (!socket_ref.current || !is_connected) {
            return false;
        }

        console.log('👋 Leaving room management channel...');
        emit_event('leave_room_management');
        return true;
    }, [is_connected, emit_event]);

    const request_room_status_update = useCallback((room_id = null) => {
        if (!socket_ref.current || !is_connected) {
            console.error('❌ Cannot request room status: WebSocket not connected');
            return false;
        }

        emit_event('request_room_status_update', { room_id });
        return true;
    }, [is_connected, emit_event]);

    // ================================================================
    // RETURN HOOK INTERFACE
    // ================================================================
    return {
        socket: socket_ref.current,
        connection_status,
        is_connected,
        is_authenticated,
        emit_event,
        disconnect_socket,
        reconnect_socket,
        authenticate: authenticate_socket,
        join_room_management,
        leave_room_management,
        request_room_status_update
    };
}

export default useWebsocketConnection;