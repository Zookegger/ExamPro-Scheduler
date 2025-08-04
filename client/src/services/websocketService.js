/**
 * WebSocket Service - Real-time communication with ExamPro server
 * 
 * Provides a centralized WebSocket connection manager for real-time features
 * including room management updates, exam status changes, and notifications.
 * 
 * Features:
 * - Automatic connection management with reconnection
 * - Authentication with JWT tokens
 * - Event subscription and unsubscription
 * - Room management real-time updates
 * - Connection status monitoring
 * 
 * @fileoverview WebSocket service for ExamPro client-server communication
 */

import { io } from 'socket.io-client';
import { getAuthToken } from './apiService';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.is_connected = false;
        this.is_authenticated = false;
        this.connection_listeners = new Set();
        this.room_management_listeners = new Set();
        this.auto_reconnect = true;
        this.reconnect_attempts = 0;
        this.max_reconnect_attempts = 5;
        this.reconnect_delay = 1000; // Start with 1 second
    }

    /**
     * Initialize WebSocket connection
     * @param {string} server_url - WebSocket server URL (default: from API config)
     * @returns {Promise<boolean>} Connection success status
     */
    async connect(server_url = process.env.REACT_APP_API_URL || 'http://localhost:5000') {
        try {
            if (this.socket && this.is_connected) {
                console.log('🔌 WebSocket already connected');
                return true;
            }

            console.log('🔌 Connecting to WebSocket server:', server_url);

            this.socket = io(server_url, {
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true,
                timeout: 20000,
                forceNew: false
            });

            // Set up connection event handlers
            this.setup_connection_handlers();

            // Wait for connection
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.error('❌ WebSocket connection timeout');
                    resolve(false);
                }, 10000);

                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    this.is_connected = true;
                    this.reconnect_attempts = 0;
                    console.log('✅ WebSocket connected successfully');
                    this.notify_connection_listeners('connected');
                    resolve(true);
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error('❌ WebSocket connection error:', error);
                    this.notify_connection_listeners('error', error);
                    resolve(false);
                });
            });

        } catch (error) {
            console.error('❌ Failed to initialize WebSocket:', error);
            return false;
        }
    }

    /**
     * Set up connection event handlers
     */
    setup_connection_handlers() {
        if (!this.socket) return;

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
            this.is_connected = false;
            this.is_authenticated = false;
            this.notify_connection_listeners('disconnected', reason);

            // Attempt reconnection if enabled
            if (this.auto_reconnect && this.reconnect_attempts < this.max_reconnect_attempts) {
                this.attempt_reconnection();
            }
        });

        this.socket.on('reconnect', (attempt_number) => {
            console.log(`🔌 WebSocket reconnected after ${attempt_number} attempts`);
            this.is_connected = true;
            this.reconnect_attempts = 0;
            this.notify_connection_listeners('reconnected');
            
            // Re-authenticate if we have a token
            this.authenticate_if_possible();
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ WebSocket reconnection error:', error);
            this.notify_connection_listeners('reconnect_error', error);
        });

        // Handle authentication responses
        this.socket.on('authorization_success', (data) => {
            console.log('✅ WebSocket authentication successful');
            this.is_authenticated = true;
            this.notify_connection_listeners('authenticated', data);
        });

        this.socket.on('authorization_error', (data) => {
            console.error('❌ WebSocket authentication failed:', data);
            this.is_authenticated = false;
            this.notify_connection_listeners('auth_error', data);
        });
    }

    /**
     * Attempt reconnection with exponential backoff
     */
    attempt_reconnection() {
        this.reconnect_attempts++;
        const delay = this.reconnect_delay * Math.pow(2, this.reconnect_attempts - 1);
        
        console.log(`🔄 Attempting reconnection ${this.reconnect_attempts}/${this.max_reconnect_attempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (this.socket && !this.is_connected) {
                this.socket.connect();
            }
        }, delay);
    }

    /**
     * Authenticate with the server using stored JWT token
     * @returns {Promise<boolean>} Authentication success status
     */
    async authenticate() {
        try {
            const token = getAuthToken();
            if (!token) {
                console.warn('⚠️ No auth token available for WebSocket authentication');
                return false;
            }

            if (!this.socket || !this.is_connected) {
                console.error('❌ Cannot authenticate: WebSocket not connected');
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
                    this.socket.off('authorization_success', success_handler);
                    this.socket.off('authorization_error', error_handler);
                };

                const success_handler = (data) => {
                    cleanup();
                    this.is_authenticated = true;
                    console.log('✅ WebSocket authenticated for user:', data.user_role);
                    resolve(true);
                };

                const error_handler = (data) => {
                    cleanup();
                    this.is_authenticated = false;
                    console.error('❌ WebSocket authentication failed:', data.message);
                    resolve(false);
                };

                this.socket.once('authorization_success', success_handler);
                this.socket.once('authorization_error', error_handler);

                // Send authentication request
                this.socket.emit('authenticate', { token });
            });

        } catch (error) {
            console.error('❌ WebSocket authentication error:', error);
            return false;
        }
    }

    /**
     * Try to authenticate if token is available
     */
    async authenticate_if_possible() {
        const token = getAuthToken();
        if (token && this.is_connected && !this.is_authenticated) {
            await this.authenticate();
        }
    }

    /**
     * Join room management channel for real-time updates
     * @returns {Promise<boolean>} Join success status
     */
    async join_room_management() {
        if (!this.ensure_connection()) return false;

        if (!this.is_authenticated) {
            console.error('❌ Must be authenticated to join room management');
            return false;
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.error('❌ Room management join timeout');
                resolve(false);
            }, 5000);

            this.socket.once('room_management_joined', (data) => {
                clearTimeout(timeout);
                if (data.success) {
                    console.log('✅ Joined room management channel');
                    this.setup_room_management_handlers();
                    resolve(true);
                } else {
                    console.error('❌ Failed to join room management:', data.message);
                    resolve(false);
                }
            });

            this.socket.emit('join_room_management');
        });
    }

    /**
     * Leave room management channel
     */
    leave_room_management() {
        if (!this.ensure_connection()) return;

        this.socket.emit('leave_room_management');
        this.cleanup_room_management_handlers();
        console.log('👋 Left room management channel');
    }

    /**
     * Set up room management event handlers
     */
    setup_room_management_handlers() {
        if (!this.socket) return;

        // Room table updates (create, update, delete)
        this.socket.on('room_table_update', (data) => {
            console.log('🏢 Room table update:', data.action, data.room.room_name);
            this.notify_room_management_listeners('table_update', data);
        });

        // Room exam status changes
        this.socket.on('room_exam_status_change', (data) => {
            console.log('📊 Room exam status change:', data.room_id, data.status);
            this.notify_room_management_listeners('status_change', data);
        });

        // Room status updates
        this.socket.on('room_status_update', (data) => {
            console.log('🔄 Room status update received');
            this.notify_room_management_listeners('status_update', data);
        });

        // Room notifications
        this.socket.on('room_notification', (data) => {
            console.log('📢 Room notification:', data.message);
            this.notify_room_management_listeners('notification', data);
        });

        // Room errors
        this.socket.on('room_error', (data) => {
            console.error('❌ Room error:', data.message);
            this.notify_room_management_listeners('error', data);
        });
    }

    /**
     * Clean up room management event handlers
     */
    cleanup_room_management_handlers() {
        if (!this.socket) return;

        this.socket.off('room_table_update');
        this.socket.off('room_exam_status_change');
        this.socket.off('room_status_update');
        this.socket.off('room_notification');
        this.socket.off('room_error');
    }

    /**
     * Request room status update
     * @param {number} [room_id] - Specific room ID or null for all rooms
     */
    request_room_status_update(room_id = null) {
        if (!this.ensure_connection()) return;

        this.socket.emit('request_room_status_update', { room_id });
    }

    /**
     * Ensure WebSocket connection is established
     * @returns {boolean} Connection status
     */
    ensure_connection() {
        if (!this.socket || !this.is_connected) {
            console.error('❌ WebSocket not connected');
            return false;
        }
        return true;
    }

    /**
     * Add connection status listener
     * @param {Function} listener - Callback function for connection events
     */
    add_connection_listener(listener) {
        this.connection_listeners.add(listener);
    }

    /**
     * Remove connection status listener
     * @param {Function} listener - Callback function to remove
     */
    remove_connection_listener(listener) {
        this.connection_listeners.delete(listener);
    }

    /**
     * Add room management event listener
     * @param {Function} listener - Callback function for room management events
     */
    add_room_management_listener(listener) {
        this.room_management_listeners.add(listener);
    }

    /**
     * Remove room management event listener
     * @param {Function} listener - Callback function to remove
     */
    remove_room_management_listener(listener) {
        this.room_management_listeners.delete(listener);
    }

    /**
     * Notify connection listeners of status changes
     * @param {string} event - Event type
     * @param {any} data - Event data
     */
    notify_connection_listeners(event, data = null) {
        this.connection_listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ Error in connection listener:', error);
            }
        });
    }

    /**
     * Notify room management listeners of events
     * @param {string} event - Event type
     * @param {any} data - Event data
     */
    notify_room_management_listeners(event, data = null) {
        this.room_management_listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ Error in room management listener:', error);
            }
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        this.auto_reconnect = false;
        
        if (this.socket) {
            this.leave_room_management();
            this.socket.disconnect();
            this.socket = null;
        }

        this.is_connected = false;
        this.is_authenticated = false;
        this.reconnect_attempts = 0;
        
        console.log('👋 WebSocket disconnected');
    }

    /**
     * Get current connection status
     * @returns {Object} Connection status information
     */
    get_status() {
        return {
            is_connected: this.is_connected,
            is_authenticated: this.is_authenticated,
            socket_id: this.socket?.id || null,
            reconnect_attempts: this.reconnect_attempts
        };
    }
}

// Create singleton instance
const websocket_service = new WebSocketService();

export default websocket_service;

// Named exports for convenience
export {
    websocket_service,
    WebSocketService
};
