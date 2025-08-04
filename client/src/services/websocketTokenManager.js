/**
 * WebSocket Token Manager - Automatic token renewal for real-time connections
 * 
 * This service manages WebSocket authentication tokens, handling automatic renewal
 * to prevent connection drops due to token expiration. It provides a seamless
 * user experience by maintaining persistent real-time connections.
 * 
 * Features:
 * - Automatic token renewal before expiration
 * - Retry logic for failed renewals
 * - Event-driven architecture for token state changes
 * - Integration with existing API service patterns
 * 
 * Following ExamPro patterns:
 * - snake_case naming convention
 * - Centralized error handling
 * - Comprehensive logging for debugging
 * - Vietnamese error messages for user-facing content
 */

import { renewAuthToken } from './apiService';

class WebSocketTokenManager {
    constructor() {
        this.current_token = null;
        this.token_expires_at = null;
        this.renewal_timer = null;
        this.renewal_in_progress = false;
        this.max_retry_attempts = 3;
        this.retry_count = 0;
        this.listeners = {
            token_renewed: [],
            token_expired: [],
            renewal_failed: []
        };

        // Renewal timing configuration
        this.renewal_buffer = 5 * 60 * 1000; // Start renewal 5 minutes before expiry
        this.retry_delay = 30 * 1000; // Wait 30 seconds between retry attempts
    }

    /**
     * Initialize the token manager with an initial token
     * 
     * @param {string} initial_token - The initial WebSocket token
     * @param {number} expires_at - Token expiration timestamp in milliseconds
     */
    initialize(initial_token, expires_at) {
        this.current_token = initial_token;
        this.token_expires_at = expires_at;
        this.retry_count = 0;
        
        console.log(`🔐 WebSocket token manager initialized, expires at: ${new Date(expires_at).toLocaleString()}`);
        
        this.schedule_renewal();
    }

    /**
     * Get the current valid token
     * 
     * @returns {string|null} Current WebSocket token or null if expired/invalid
     */
    get_current_token() {
        if (this.is_token_expired()) {
            console.warn('⚠️ Current WebSocket token has expired');
            return null;
        }
        return this.current_token;
    }

    /**
     * Check if the current token has expired
     * 
     * @returns {boolean} Whether the token has expired
     */
    is_token_expired() {
        if (!this.token_expires_at) {
            return true;
        }
        return Date.now() >= this.token_expires_at;
    }

    /**
     * Check if the token is near expiration (within renewal buffer)
     * 
     * @returns {boolean} Whether the token should be renewed
     */
    should_renew_token() {
        if (!this.token_expires_at) {
            return true;
        }
        return (this.token_expires_at - Date.now()) <= this.renewal_buffer;
    }

    /**
     * Schedule automatic token renewal
     */
    schedule_renewal() {
        // Clear any existing timer
        if (this.renewal_timer) {
            clearTimeout(this.renewal_timer);
            this.renewal_timer = null;
        }

        if (!this.token_expires_at) {
            console.warn('⚠️ Cannot schedule renewal without expiration time');
            return;
        }

        const time_until_renewal = this.token_expires_at - Date.now() - this.renewal_buffer;
        
        if (time_until_renewal <= 0) {
            // Token needs immediate renewal
            console.log('⏰ Token needs immediate renewal');
            this.renew_token();
        } else {
            // Schedule renewal for the appropriate time
            console.log(`⏰ Token renewal scheduled in ${Math.floor(time_until_renewal / 1000 / 60)} minutes`);
            this.renewal_timer = setTimeout(() => {
                this.renew_token();
            }, time_until_renewal);
        }
    }

    /**
     * Renew the WebSocket token
     * 
     * @returns {Promise<boolean>} Whether renewal was successful
     */
    async renew_token() {
        if (this.renewal_in_progress) {
            console.log('🔄 Token renewal already in progress, skipping');
            return false;
        }

        this.renewal_in_progress = true;
        console.log(`🔄 Attempting to renew WebSocket token (attempt ${this.retry_count + 1}/${this.max_retry_attempts})`);

        try {
            const response = await renewAuthToken();

            if (response && response.success && response.websocket_token) {
                // Update token information
                this.current_token = response.websocket_token;
                this.token_expires_at = Date.now() + (response.expires_in * 1000);
                this.retry_count = 0;
                this.renewal_in_progress = false;

                console.log(`✅ WebSocket token renewed successfully, new expiration: ${new Date(this.token_expires_at).toLocaleString()}`);

                // Notify listeners
                this.emit_event('token_renewed', {
                    token: this.current_token,
                    expires_at: this.token_expires_at
                });

                // Schedule next renewal
                this.schedule_renewal();

                return true;
            } else {
                throw new Error(response.message || 'Token renewal failed');
            }

        } catch (error) {
            console.error(`❌ WebSocket token renewal failed:`, error);
            this.retry_count++;
            this.renewal_in_progress = false;

            if (this.retry_count < this.max_retry_attempts) {
                // Schedule retry
                console.log(`🔄 Scheduling token renewal retry in ${this.retry_delay / 1000} seconds`);
                setTimeout(() => {
                    this.renew_token();
                }, this.retry_delay);
            } else {
                // Max retries exceeded
                console.error('❌ Max token renewal attempts exceeded');
                this.emit_event('renewal_failed', {
                    error: error.message,
                    retry_count: this.retry_count
                });
                
                // Clear token to force re-authentication
                this.clear_token();
            }

            return false;
        }
    }

    /**
     * Force token renewal (e.g., when server indicates token expired)
     * 
     * @returns {Promise<boolean>} Whether renewal was successful
     */
    async force_renewal() {
        console.log('🚨 Forcing immediate token renewal');
        this.retry_count = 0; // Reset retry count for forced renewal
        return await this.renew_token();
    }

    /**
     * Clear the current token and stop renewal
     */
    clear_token() {
        this.current_token = null;
        this.token_expires_at = null;
        this.retry_count = 0;
        this.renewal_in_progress = false;

        if (this.renewal_timer) {
            clearTimeout(this.renewal_timer);
            this.renewal_timer = null;
        }

        console.log('🧹 WebSocket token cleared');
        this.emit_event('token_expired', {});
    }

    /**
     * Add event listener for token manager events
     * 
     * @param {string} event_type - Event type ('token_renewed', 'token_expired', 'renewal_failed')
     * @param {Function} callback - Callback function
     */
    add_listener(event_type, callback) {
        if (this.listeners[event_type]) {
            this.listeners[event_type].push(callback);
        }
    }

    /**
     * Remove event listener
     * 
     * @param {string} event_type - Event type
     * @param {Function} callback - Callback function to remove
     */
    remove_listener(event_type, callback) {
        if (this.listeners[event_type]) {
            const index = this.listeners[event_type].indexOf(callback);
            if (index > -1) {
                this.listeners[event_type].splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all listeners
     * 
     * @param {string} event_type - Event type
     * @param {Object} data - Event data
     */
    emit_event(event_type, data) {
        if (this.listeners[event_type]) {
            this.listeners[event_type].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in WebSocket token manager listener:`, error);
                }
            });
        }
    }

    /**
     * Get token status information
     * 
     * @returns {Object} Token status details
     */
    get_status() {
        return {
            has_token: !!this.current_token,
            is_expired: this.is_token_expired(),
            should_renew: this.should_renew_token(),
            expires_at: this.token_expires_at,
            minutes_remaining: this.token_expires_at ? Math.floor((this.token_expires_at - Date.now()) / 60000) : 0,
            renewal_in_progress: this.renewal_in_progress,
            retry_count: this.retry_count
        };
    }

    /**
     * Cleanup resources when destroying the manager
     */
    destroy() {
        if (this.renewal_timer) {
            clearTimeout(this.renewal_timer);
            this.renewal_timer = null;
        }
        
        this.listeners = {
            token_renewed: [],
            token_expired: [],
            renewal_failed: []
        };

        console.log('🗑️ WebSocket token manager destroyed');
    }
}

// Create singleton instance
const websocket_token_manager = new WebSocketTokenManager();

export default websocket_token_manager;
