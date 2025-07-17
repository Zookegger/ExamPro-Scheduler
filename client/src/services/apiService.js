const API_BASE_URL = "http://localhost:5000/api";

// Helper function to make API calls
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
export const check_server_health = () => api_call(`/health`);
export const get_all_users = () => api_call(`/users`);
export const create_user = (user_data) => api_call('/users', {
    method: 'POST',
    body: JSON.stringify(user_data),
});