// client/src/hooks/use_websocket_connection.js

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { get_socket_url } from '../services/apiService';

/**
 * Custom WebSocket Hook for ExamPro Real-Time Features
 * 
 * Provides a reusable WebSocket connection with automatic connection management,
 * event handling, and cleanup. Follows ExamPro's snake_case conventions and
 * integrates with the existing authentication system.
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.events - Event handlers object
 * @param {string} options.namespace - Optional Socket.io namespace
 * @param {boolean} options.auto_connect - Whether to auto-connect on mount
 * @returns {Object} WebSocket connection utilities
 * 
 * @example
 * // Basic usage in any component
 * const { socket, connection_status, emit_event } = useWebsocketConnection({
 *     events: {
 *         'subject_table_update': handle_subject_update,
 *         'assignment_notification': handle_notification
 *     }
 * });
 */
function useWebsocketConnection(options = {}) {
    const { 
        events = {}, 
        namespace = '', 
        auto_connect = true,
        reconnect_attempts = 3 
    } = options;

    // ================================================================
    // STATE MANAGEMENT
    // ================================================================
    const [socket, set_socket] = useState(null);
    const [connection_status, set_connection_status] = useState('disconnected');
    const [is_connected, set_is_connected] = useState(false);
    const socket_ref = useRef(null);

    // ================================================================
    // CONNECTION MANAGEMENT
    // ================================================================
    useEffect(() => {
        if (!auto_connect) return;

        console.log('🔌 Initializing WebSocket connection...');
        
        // Create WebSocket connection using centralized URL
        const socket_url = get_socket_url();
        const new_socket = io(socket_url + namespace, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });

        socket_ref.current = new_socket;
        set_socket(new_socket);

        // Connection event handlers
        new_socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server');
            set_connection_status('connected');
            set_is_connected(true);
        });

        new_socket.on('disconnect', (reason) => {
            console.log(`❌ Disconnected from WebSocket server: ${reason}`);
            set_connection_status('disconnected');
            set_is_connected(false);
        });

        new_socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
            set_connection_status('error');
            set_is_connected(false);
        });

        // Register custom event handlers
        Object.entries(events).forEach(([event_name, handler]) => {
            if (typeof handler === 'function') {
                new_socket.on(event_name, handler);
            }
        });

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up WebSocket connection');
            if (socket_ref.current) {
                socket_ref.current.removeAllListeners();
                socket_ref.current.disconnect();
            }
        };
    }, [auto_connect, namespace]);

    // ================================================================
    // UTILITY FUNCTIONS
    // ================================================================
    const emit_event = (event_name, data) => {
        if (socket_ref.current && is_connected) {
            socket_ref.current.emit(event_name, data);
            return true;
        } else {
            console.warn(`Cannot emit '${event_name}' - WebSocket not connected`);
            return false;
        }
    };

    const disconnect_socket = () => {
        if (socket_ref.current) {
            socket_ref.current.disconnect();
        }
    };

    const reconnect_socket = () => {
        if (socket_ref.current) {
            socket_ref.current.connect();
        }
    };

    // ================================================================
    // RETURN HOOK INTERFACE
    // ================================================================
    return {
        socket: socket_ref.current,
        connection_status,
        is_connected,
        emit_event,
        disconnect_socket,
        reconnect_socket
    };
}

export default useWebsocketConnection;