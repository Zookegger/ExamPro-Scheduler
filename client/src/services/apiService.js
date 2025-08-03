/**
 * API Service Configuration for ExamPro Scheduler
 *
 * Centralized API service for handling all HTTP requests to the Express backend.
 * Provides environment-based URL configuration for development and production environments.
 *
 * Features:
 * - Automatic credential handling (HTTP-only cookies)
 * - Consistent error handling across all API calls
 * - Environment-based configuration
 * - Vietnamese/English bilingual error support
 *
 * Architecture: MERN Stack (React frontend ↔ Express backend ↔ MySQL database)
 * Naming Convention: snake_case throughout for consistency
 *
 * @fileoverview Centralized API service for ExamPro Scheduler application
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION & UTILITIES
// ============================================================================

/**
 * Gets the appropriate API base URL based on environment configuration
 *
 * @returns {string} Base URL for API calls
 * @example
 * // Development: "http://localhost:5000"
 * // Production: process.env.REACT_APP_API_URL value
 */
const get_api_base_url = () => {
	if (process.env.REACT_APP_API_URL) {
		return process.env.REACT_APP_API_URL;
	}

	return "http://localhost:5000";
};

/**
 * Base URL for all API calls
 * @constant {string}
 */
const API_BASE_URL = get_api_base_url();

/**
 * Centralized API call function with comprehensive error handling
 *
 * Handles all HTTP requests to the backend with automatic:
 * - Cookie credentials inclusion
 * - Content-Type headers
 * - Error parsing and logging
 * - JSON response processing
 *
 * @param {string} endpoint - API endpoint path (e.g., '/api/health', '/api/users/login')
 * @param {Object} [options={}] - Fetch API options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {string} [options.body] - Request body (JSON stringified)
 * @param {Object} [options.headers] - Additional headers
 * @returns {Promise<Object>} Parsed JSON response from the server
 * @throws {Error} HTTP error with status code for failed requests
 *
 * @example
 * // GET request
 * const users = await api_call('/api/admin/accounts/get_all_users');
 *
 * @example
 * // POST request with data
 * const result = await api_call('/api/users/login', {
 *     method: 'POST',
 *     body: JSON.stringify({ user_name: 'admin', password: 'password123' })
 * });
 */
const api_call = async (endpoint, options = {}) => {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			credentials: "include", // Include HTTP-only cookies for JWT authentication
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
		console.error("API call failed: ", error);
		throw error;
	}
};

// ============================================================================
// SYSTEM HEALTH & CONFIGURATION
// ============================================================================

/**
 * Performs health check on the Express backend server
 *
 * Tests connectivity and basic functionality of the backend service.
 * Used for system monitoring and debugging connection issues.
 *
 * @returns {Promise<Object>} Health status response
 * @returns {boolean} returns.success - Whether the server is healthy
 * @returns {string} returns.message - Health status message
 * @returns {string} returns.timestamp - Server timestamp
 *
 * @example
 * const health = await check_server_health();
 * console.log(`Server status: ${health.success ? 'Online' : 'Offline'}`);
 */
export const check_server_health = () => api_call("/api/health");

/**
 * Gets the WebSocket URL for real-time features
 *
 * Returns the appropriate WebSocket URL based on environment configuration.
 * Used for Socket.io connection setup for real-time notifications and updates.
 *
 * @returns {string} WebSocket URL for Socket.io connection
 *
 * @example
 * const socket = io(get_socket_url());
 */
export const get_socket_url = () => {
	return process.env.REACT_APP_WS_URL || "http://localhost:5000";
};

// ============================================================================
// USER AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================

/**
 * Authenticates user with username/email and password
 *
 * Performs user login with automatic JWT token handling via HTTP-only cookies.
 * Supports both username and email-based authentication.
 *
 * @param {Object} user_data - Login credentials
 * @param {string} user_data.user_name - Username or email address
 * @param {string} user_data.password - User password
 * @returns {Promise<Object>} Authentication response
 * @returns {boolean} returns.success - Whether login was successful
 * @returns {Object} [returns.user] - User data if login successful
 * @returns {string} [returns.message] - Error message if login failed
 *
 * @example
 * const result = await login({
 *     user_name: 'admin',
 *     password: 'password123'
 * });
 *
 * if (result.success) {
 *     console.log('Login successful:', result.user);
 * } else {
 *     console.error('Login failed:', result.message);
 * }
 */
export const login = (user_data) =>
	api_call("/api/users/login", {
		method: "POST",
		body: JSON.stringify(user_data),
		credentials: "include",
	}
);

/**
 * Logs out the current user
 *
 * Invalidates the current session and clears authentication cookies.
 * Should be called when user explicitly logs out or session expires.
 *
 * @returns {Promise<Object>} Logout response
 * @returns {boolean} returns.success - Whether logout was successful
 * @returns {string} returns.message - Logout status message
 *
 * @example
 * const result = await logout();
 * if (result.success) {
 *     // Redirect to login page
 *     navigate('/login');
 * }
 */
export const logout = () =>
	api_call("/api/users/logout", {
		method: "POST",
	}
);

/**
 * Checks current authentication status
 *
 * Validates the current session and retrieves user information.
 * Used for:
 * - App initialization to restore user session
 * - Protected route access validation
 * - User data refresh
 *
 * @returns {Promise<Object|null>} User data if authenticated, null if not
 * @returns {number} returns.id - User ID
 * @returns {string} returns.user_name - Username
 * @returns {string} returns.full_name - Full display name
 * @returns {string} returns.email - User email address
 * @returns {string} returns.user_role - User role (student/teacher/admin)
 * @returns {boolean} returns.is_active - Whether user account is active
 *
 * @example
 * const user = await checkAuth();
 * if (user) {
 *     console.log(`Welcome back, ${user.full_name}!`);
 *     setCurrentUser(user);
 * } else {
 *     console.log('Please log in');
 *     navigate('/login');
 * }
 */
export const checkAuth = async () => {
	try {
		const response = await api_call("/api/users/me", {
			method: "POST",
			credentials: "include",
		});
		return response.user;
	} catch (error) {
		console.error("Not authenticated: ", error);
		return null;
	}
};

// ============================================================================
// ADMIN USER MANAGEMENT (Admin Role Required)
// ============================================================================

/**
 * Retrieves all user accounts from the system
 *
 * Admin-only endpoint that returns a complete list of all registered users.
 * Includes all user data including sensitive fields like email and role.
 *
 * @requires Admin role authentication
 * @returns {Promise<Object>} Response containing user list
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {Array<Object>} returns.users - Array of user objects
 * @returns {number} returns.users[].user_id - Unique user identifier
 * @returns {string} returns.users[].user_name - Username
 * @returns {string} returns.users[].full_name - Full display name
 * @returns {string} returns.users[].email - Email address
 * @returns {string} returns.users[].user_role - Role (student/teacher/admin)
 * @returns {boolean} returns.users[].is_active - Account status
 * @returns {string} returns.users[].created_at - Account creation timestamp
 * @returns {string} returns.users[].updated_at - Last modification timestamp
 *
 * @throws {Error} 403 Forbidden if user lacks admin privileges
 * @throws {Error} 401 Unauthorized if not authenticated
 *
 * @example
 * // In ManageUserPage.jsx
 * const load_users = async () => {
 *     try {
 *         const response = await get_all_users();
 *         if (response.success) {
 *             setUsers(response.users);
 *         }
 *     } catch (error) {
 *         console.error('Failed to load users:', error);
 *     }
 * };
 */
export const get_all_users = () =>
	api_call("/api/admin/accounts/get_all_users");

/**
 * Creates a new user account in the system
 *
 * Admin-only endpoint for creating new user accounts with role assignment.
 * Automatically handles password hashing and account validation.
 *
 * @requires Admin role authentication
 * @param {Object} user_data - New user account data
 * @param {string} user_data.user_name - Unique username (3-50 characters)
 * @param {string} user_data.email - Valid email address (must be unique)
 * @param {string} user_data.full_name - Full display name (2-100 characters)
 * @param {string} user_data.password - Password (minimum 6 characters)
 * @param {string} [user_data.user_role='student'] - User role (student/teacher/admin)
 * @param {boolean} [user_data.is_active=true] - Initial account status
 * @returns {Promise<Object>} Account creation response
 * @returns {boolean} returns.success - Whether account was created successfully
 * @returns {Object} [returns.user] - Created user data (if successful)
 * @returns {string} [returns.message] - Error message (if failed)
 *
 * @throws {Error} 409 Conflict if username or email already exists
 * @throws {Error} 400 Bad Request if validation fails
 * @throws {Error} 403 Forbidden if user lacks admin privileges
 *
 * @example
 * // Create new student account
 * const result = await create_user({
 *     user_name: 'student123',
 *     email: 'student@example.com',
 *     full_name: 'Nguyễn Văn A',
 *     password: 'secure123',
 *     user_role: 'student',
 *     is_active: true
 * });
 *
 * if (result.success) {
 *     console.log('Account created:', result.user);
 * } else if (result.message.includes('username')) {
 *     alert('Tên đăng nhập đã tồn tại!');
 * } else if (result.message.includes('email')) {
 *     alert('Email đã được sử dụng!');
 * }
 */
export const create_user = (user_data) =>
	api_call("/api/admin/accounts/create-new-account", {
		method: "POST",
		body: JSON.stringify(user_data),
	}
);

// ============================================================================
// EXAM MANAGEMENT
// ============================================================================

/**
 * Retrieves all exams with optional filtering
 *
 * Fetches exam data with support for query parameter filtering.
 * Can filter by subject, date range, status, or other criteria.
 *
 * @param {Object} [filters={}] - Optional filter parameters
 * @param {string} [filters.subject_id] - Filter by subject ID
 * @param {string} [filters.date_from] - Filter exams from date (YYYY-MM-DD)
 * @param {string} [filters.date_to] - Filter exams to date (YYYY-MM-DD)
 * @param {string} [filters.status] - Filter by exam status
 * @param {string} [filters.room_id] - Filter by room ID
 * @returns {Promise<Object>} Exam list response
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {Array<Object>} returns.exams - Array of exam objects
 *
 * @example
 * // Get all exams
 * const all_exams = await get_all_exams();
 *
 * @example
 * // Get exams for specific subject in date range
 * const filtered_exams = await get_all_exams({
 *     subject_id: '1',
 *     date_from: '2024-03-01',
 *     date_to: '2024-03-31'
 * });
 */

export const get_all_exams = (filters = {}) => {
	const query_params = new URLSearchParams(filters).toString();
	const endpoint = `/api/exams${query_params ? `?${query_params}` : ""}`;
	return api_call(endpoint);
};

// ============================================================================
// SUBJECT MANAGEMENT (Admin Role Partially Required)
// ============================================================================

export const get_all_subjects = (filters = {}) => {
	const query_params = new URLSearchParams(filters).toString();
	const endpoint = `/api/subjects${query_params ? `?${query_params}` : ""}`;
	return api_call(endpoint, { method: "GET" });
};

export const add_new_subject = (subject_data) =>
	api_call("/api/subjects", {
		method: "POST",
		body: JSON.stringify(subject_data),
	}
);

export const update_subject = (subject_id, subject_data) =>
	api_call(`/api/subjects/${subject_id}`, {
		method: "PUT",
		body: JSON.stringify(subject_data),
	}
);

export const delete_subject = (subject_id) =>
	api_call(`/api/subjects/${subject_id}`, {
		method: "DELETE",
	}
);
