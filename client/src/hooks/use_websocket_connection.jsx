// client/src/hooks/use_websocket_connection.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl, getAuthToken } from '../services/apiService';

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
 * @param {boolean} options.debug - Enable debug logging
 * @param {number} options.max_reconnect_attempts - Max reconnection attempts
 * @param {number} options.reconnect_delay - Base delay between reconnections
 * @returns {Object} WebSocket connection utilities
 */

// Singleton WebSocket instance for performance
let global_socket = null;
let global_connection_state = 'disconnected';
let global_reconnect_attempts = 0;
const global_event_handlers = new Map(); // Track all event handlers
let authentication_attempted = false; // Track if authentication has been attempted

const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    AUTHENTICATED: 'authenticated',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
};

function useWebsocketConnection(options = {}) {
    const { 
        events = {}, 
        namespace = '', 
        auto_connect = true,
        debug = false,
        max_reconnect_attempts = 5,
        reconnect_delay = 1000
    } = options;

    const socket_ref = useRef(null);
    const [connection_state, set_connection_state] = useState(global_connection_state);
    const [error_message, set_error_message] = useState(null);
    const component_id = useRef(`component_${Date.now()}_${Math.random()}`);
    const is_mounted = useRef(true);

    const is_connected = connection_state === CONNECTION_STATES.CONNECTED || 
                        connection_state === CONNECTION_STATES.AUTHENTICATED;
    const is_authenticated = connection_state === CONNECTION_STATES.AUTHENTICATED;

    // Store events in a ref to avoid dependency issues
    const events_ref = useRef(events);
    const debug_ref = useRef(debug);
    events_ref.current = events;
    debug_ref.current = debug;

    // Debug logging helper
    const debug_log = useCallback((message, ...args) => {
        if (debug_ref.current) {
            console.log(`🔌 [WebSocket-${component_id.current.slice(-6)}] ${message}`, ...args);
        }
    }, []);

    // Update global state and sync with all components
    const update_connection_status = useCallback((new_state) => {
        if (!is_mounted.current) return;
        
        global_connection_state = new_state;
        set_connection_state(new_state);
        debug_log('Global state updated:', new_state);
    }, [debug_log]);

    // Set error with auto-clearing
    const set_error = useCallback((message) => {
        if (!is_mounted.current) return;
        
        set_error_message(message);
        debug_log('Error:', message);
        
        setTimeout(() => {
            if (is_mounted.current) set_error_message(null);
        }, 10000);
    }, [debug_log]);

    // Authentication function
    const authenticate_socket = useCallback(async () => {
        try {
            // If already authenticated, don't try again
            if (connection_state === CONNECTION_STATES.AUTHENTICATED) {
                debug_log('Already authenticated, skipping authentication');
                return true;
            }
            
            // If authentication is in progress, don't try again
            if (authentication_attempted && connection_state === CONNECTION_STATES.CONNECTED) {
                debug_log('Authentication already in progress, skipping duplicate attempt');
                return false;
            }
            
            const token = await getAuthToken();
            if (!token || !socket_ref.current || !is_connected) {
                debug_log('Cannot authenticate: missing token, socket, or not connected');
                return false;
            }

            debug_log('Authenticating WebSocket connection...');
            authentication_attempted = true; // Mark that we've tried authentication

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    debug_log('Authentication timeout');
                    authentication_attempted = false; // Reset on timeout
                    resolve(false);
                }, 5000);

                const cleanup = () => {
                    clearTimeout(timeout);
                    socket_ref.current.off('authorization_success', success_handler);
                    socket_ref.current.off('authorization_error', error_handler);
                };

                const success_handler = (data) => {
                    cleanup();
                    update_connection_status(CONNECTION_STATES.AUTHENTICATED);
                    debug_log('Authentication successful for user:', data.user_role);
                    resolve(true);
                };

                const error_handler = (data) => {
                    cleanup();
                    update_connection_status(CONNECTION_STATES.CONNECTED);
                    debug_log('Authentication failed:', data.message);
                    authentication_attempted = false; // Reset on failure
                    resolve(false);
                };

                socket_ref.current.once('authorization_success', success_handler);
                socket_ref.current.once('authorization_error', error_handler);
                socket_ref.current.emit('authenticate', { token });
            });
        } catch (error) {
            debug_log('Authentication error:', error);
            authentication_attempted = false; // Reset on error
            return false;
        }
    }, [debug_log, is_connected, update_connection_status, connection_state]);

    // Reconnection with exponential backoff
    const attempt_reconnection = useCallback(() => {
        if (global_reconnect_attempts >= max_reconnect_attempts) {
            debug_log('Max reconnection attempts reached');
            return;
        }

        global_reconnect_attempts++;
        const delay = Math.min(
            reconnect_delay * Math.pow(2, global_reconnect_attempts - 1),
            30000 // Max 30 seconds delay
        );
        
        debug_log(`Attempting reconnection ${global_reconnect_attempts}/${max_reconnect_attempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (socket_ref.current && !socket_ref.current.connected) {
                socket_ref.current.connect();
            }
        }, delay);
    }, [debug_log, max_reconnect_attempts, reconnect_delay]);

    // Register event handlers
    const register_handlers = useCallback((socket) => {
        if (!socket) return;

        // Track this component's handlers
        const component_handlers = new Map();

        Object.entries(events_ref.current).forEach(([event_name, handler]) => {
            if (typeof handler === 'function') {
                // Only add handler if not already registered
                if (!global_event_handlers.has(event_name)) {
                    socket.on(event_name, handler);
                    global_event_handlers.set(event_name, new Set());
                }
                
                // Track this component's handler
                if (!global_event_handlers.get(event_name).has(handler)) {
                    global_event_handlers.get(event_name).add(handler);
                    component_handlers.set(event_name, handler);
                }
            }
        });

        return component_handlers;
    }, []); // Remove events dependency

    // Unregister event handlers
    const unregister_handlers = useCallback((socket, component_handlers) => {
        if (!socket || !component_handlers) return;

        component_handlers.forEach((handler, event_name) => {
            // Remove from global tracking
            const handlers = global_event_handlers.get(event_name);
            if (handlers) {
                handlers.delete(handler);
                
                // Remove from socket if no more handlers
                if (handlers.size === 0) {
                    socket.off(event_name);
                    global_event_handlers.delete(event_name);
                }
            }
        });
    }, []);

    // Connection management
    useEffect(() => {
        is_mounted.current = true;
        let component_handlers = new Map();

        const initialize_websocket = async () => {
            if (!auto_connect) return;

            // Use existing connection if available
            if (global_socket && global_socket.connected) {
                debug_log('Using existing WebSocket connection');
                socket_ref.current = global_socket;
                component_handlers = register_handlers(global_socket);
                return;
            }

            debug_log('Initializing new WebSocket connection...');
            
            try {
                const websocket_token = await getAuthToken();
                const socket_url = getSocketUrl();
                
                // Important: We should ALWAYS include auth options with null token
                // rather than omitting the auth field. This makes behavior consistent.
                const socket_options = {
                    transports: ['websocket', 'polling'],
                    timeout: 20000,
                    forceNew: false,
                    upgrade: true,
                    rememberUpgrade: true,
                    auth: { token: websocket_token || null }
                };

                const new_socket = io(socket_url + namespace, socket_options);
                global_socket = new_socket;
                socket_ref.current = new_socket;

                // Connection event handlers
                new_socket.on('connect', async () => {
                    debug_log('Connected to WebSocket server');
                    update_connection_status(CONNECTION_STATES.CONNECTED);
                    global_reconnect_attempts = 0;
                    authentication_attempted = false; // Reset authentication flag on new connection
                    
                    // If we provided a token in auth options, Socket.IO will automatically
                    // pass it to the server's authentication middleware. No need to manually
                    // authenticate again unless we receive an error.
                    if (websocket_token) {
                        debug_log('Token provided in socket options, waiting for auto-authentication');
                    }
                });

                new_socket.on('disconnect', (reason) => {
                    debug_log(`Disconnected: ${reason}`);
                    update_connection_status(CONNECTION_STATES.DISCONNECTED);
                    authentication_attempted = false; // Reset authentication flag on disconnect
                    
                    if (reason !== 'io client disconnect') {
                        attempt_reconnection();
                    }
                });

                new_socket.on('connect_error', (error) => {
                    debug_log('Connection error:', error);
                    update_connection_status(CONNECTION_STATES.ERROR);
                    attempt_reconnection();
                });

                new_socket.on('reconnect', (attempt_number) => {
                    debug_log(`Reconnected after ${attempt_number} attempts`);
                    update_connection_status(CONNECTION_STATES.CONNECTED);
                    global_reconnect_attempts = 0;
                });

                // Authentication handlers
                new_socket.on('authorization_success', () => {
                    debug_log('Authentication successful');
                    update_connection_status(CONNECTION_STATES.AUTHENTICATED);
                });

                new_socket.on('authorization_error', (data) => {
                    debug_log('Authentication failed:', data);
                    update_connection_status(CONNECTION_STATES.CONNECTED);
                });

                // Register custom event handlers
                component_handlers = register_handlers(new_socket);
            } catch (error) {
                debug_log('Initialization error:', error);
                set_error('Failed to initialize WebSocket connection');
            }
        };

        initialize_websocket();

        return () => {
            is_mounted.current = false;
            debug_log('Cleaning up WebSocket handlers');
            
            if (socket_ref.current) {
                unregister_handlers(socket_ref.current, component_handlers);
                
                // Only disconnect if no components are using the socket
                if (global_event_handlers.size === 0 && global_socket) {
                    debug_log('No more active handlers - disconnecting socket');
                    global_socket.disconnect();
                    global_socket = null;
                }
            }
        };
    }, [
        auto_connect,
        namespace,
        debug_log,
        update_connection_status,
        attempt_reconnection,
        set_error,
        register_handlers,
        unregister_handlers
    ]); // Fixed with stable function references

    // Utility functions
    const emit_event = useCallback((event_name, data) => {
        if (socket_ref.current && socket_ref.current.connected) {
            socket_ref.current.emit(event_name, data);
            return true;
        }
        debug_log(`Cannot emit '${event_name}' - WebSocket not connected`);
        return false;
    }, [debug_log]);

    const disconnect_socket = useCallback(() => {
        if (socket_ref.current) {
            socket_ref.current.disconnect();
            update_connection_status(CONNECTION_STATES.DISCONNECTED);
        }
    }, [update_connection_status]);

    const reconnect_socket = useCallback(() => {
        if (socket_ref.current) {
            socket_ref.current.connect();
        }
    }, []);

    // Room management functions
    const join_room_management = useCallback(() => {
        return emit_event('join_room_management');
    }, [emit_event]);

    const leave_room_management = useCallback(() => {
        return emit_event('leave_room_management');
    }, [emit_event]);

    const request_room_status_update = useCallback((room_id = null) => {
        return emit_event('request_room_status_update', { room_id });
    }, [emit_event]);

    return {
        socket: socket_ref.current,
        connection_status: connection_state,
        is_connected,
        is_authenticated,
        error_message,
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