/**
 * API Service Configuration for Separate Services Architecture
 * 
 * Handles API calls to the Express backend service with proper
 * environment-based URL configuration for development and production.
 * 
 * Following snake_case naming convention throughout.
 */
// Environment-based API URL configuration
const get_api_base_url = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    return "http://localhost:5000/api";
}

const API_BASE_URL = get_api_base_url();

/**
 * Centralized API call function with error handling
 * 
 * @param {string} endpoint - API endpoint (e.g., '/api/health')
 * @param {Object} options - Fetch options
 * @returns {Promise} API response data
 */
const api_call = async (endpoints, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoints}`, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed: ', error);
        throw error;
    }
}

// Export functions for different API calls
/**
 * Health check API call
 * Tests connection to the Express backend service
 */
export const check_server_health = () => api_call(`/health`);
export const get_all_users = () => api_call(`/users`);
export const create_user = (user_data) => api_call('/users', {
    method: 'POST',
    body: JSON.stringify(user_data),
});

/**
 * Get all exams with optional filtering
 */
export const get_all_exams = (filters = {}) => {
    const query_params = new URLSearchParams(filters).toString();
    const endpoint = `/api/exams${query_params ? `?${query_params}` : ''}`;
    return api_call(endpoint);
};

// Export API base URL for Socket.io connection
export const get_socket_url = () => {
    return process.env.REACT_APP_WS_URL || 'http://localhost:5000';
};