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
 * const all_exams = await getAllExams();
 *
 * @example
 * // Get exams for specific subject in date range
 * const filtered_exams = await getAllExams({
 *     subject_id: '1',
 *     date_from: '2024-03-01',
 *     date_to: '2024-03-31'
 * });
 */

export const getAllExams = (filters = {}) => {
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

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * Get notifications for the current user
 * 
 * Retrieves all notifications for the authenticated user with optional filtering
 * and pagination. Supports filtering by read status and notification type.
 * 
 * @param {Object} [filters={}] - Filter options
 * @param {boolean} [filters.is_read] - Filter by read status (true/false)
 * @param {string} [filters.notification_type] - Filter by notification type
 * @param {number} [filters.page=1] - Page number for pagination
 * @param {number} [filters.limit=10] - Number of notifications per page
 * @returns {Promise<Object>} Response containing notifications
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {Array<Object>} returns.notifications - Array of notification objects
 * @returns {number} returns.unread_count - Count of unread notifications
 * @returns {number} returns.total_count - Total count of notifications
 * 
 * @example
 * // Get all notifications for current user
 * const result = await getUserNotifications();
 * if (result.success) {
 *     console.log('Notifications:', result.notifications);
 *     console.log('Unread count:', result.unread_count);
 * }
 * 
 * @example
 * // Get only unread notifications
 * const unread = await getUserNotifications({ is_read: false });
 */
export const getUserNotifications = (filters = {}) => {
	const query_params = new URLSearchParams(filters).toString();
	const endpoint = `/api/notifications${query_params ? `?${query_params}` : ""}`;
	return api_call(endpoint, { method: "GET" });
};

/**
 * Mark specific notifications as read
 * 
 * Updates the read status of specified notifications to read. This helps
 * manage notification count and user experience.
 * 
 * @param {Array<number>} notification_ids - Array of notification IDs to mark as read
 * @returns {Promise<Object>} Response containing update result
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {number} returns.updated_count - Number of notifications updated
 * 
 * @example
 * // Mark specific notifications as read
 * const result = await markNotificationsAsRead([1, 2, 3]);
 * if (result.success) {
 *     console.log(`Marked ${result.updated_count} notifications as read`);
 * }
 */
export const markNotificationsAsRead = (notification_ids) =>
	api_call("/api/notifications/mark-read", {
		method: "PUT",
		body: JSON.stringify({ notification_ids }),
	}
);

/**
 * Mark all notifications as read for current user
 * 
 * Bulk operation to mark all user notifications as read. Useful for 
 * "mark all as read" functionality in notification panels.
 * 
 * @returns {Promise<Object>} Response containing update result
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {number} returns.updated_count - Number of notifications updated
 * 
 * @example
 * // Mark all notifications as read
 * const result = await markAllNotificationsAsRead();
 * if (result.success) {
 *     console.log(`Marked ${result.updated_count} notifications as read`);
 * }
 */
export const markAllNotificationsAsRead = () =>
	api_call("/api/notifications/mark-all-read", {
		method: "PUT",
	}
);

/**
 * Create a new notification (Admin only)
 * 
 * Admin-only endpoint for manually creating notifications. Useful for
 * system announcements or custom notifications.
 * 
 * @requires Admin role authentication
 * @param {Object} notification_data - Notification data
 * @param {number} [notification_data.recipient_id] - Target user ID (optional for broadcast)
 * @param {string} notification_data.title - Notification title
 * @param {string} notification_data.message - Notification message
 * @param {string} [notification_data.notification_type='info'] - Notification type
 * @param {Object} [notification_data.metadata] - Additional metadata
 * @returns {Promise<Object>} Response containing created notification
 * 
 * @example
 * // Create system announcement
 * const result = await createNotification({
 *     title: 'System Maintenance',
 *     message: 'System will be down for maintenance on Sunday',
 *     notification_type: 'system'
 * });
 */
export const createNotification = (notification_data) =>
	api_call("/api/notifications", {
		method: "POST",
		body: JSON.stringify(notification_data),
	}
);

/**
 * Delete a notification (Admin or owner only)
 * 
 * Removes a notification from the system. Only admins or notification owners
 * can delete notifications.
 * 
 * @param {number} notification_id - ID of notification to delete
 * @returns {Promise<Object>} Response containing deletion result
 * @returns {boolean} returns.success - Whether the request was successful
 * 
 * @example
 * // Delete a notification
 * const result = await deleteNotification(123);
 * if (result.success) {
 *     console.log('Notification deleted successfully');
 * }
 */
export const deleteNotification = (notification_id) =>
	api_call(`/api/notifications/${notification_id}`, {
		method: "DELETE",
	});

// ============================================================================
// ROOM MANAGEMENT (Admin Role Required)
// ============================================================================

/**
 * Get all rooms with optional filtering
 * 
 * Retrieves all exam rooms from the system with support for filtering
 * by building, status, capacity, and other criteria.
 * 
 * @param {Object} [filters={}] - Optional filter parameters
 * @param {string} [filters.building] - Filter by building name
 * @param {boolean} [filters.is_active] - Filter by active status
 * @param {number} [filters.min_capacity] - Filter by minimum capacity
 * @param {boolean} [filters.has_computers] - Filter by computer availability
 * @returns {Promise<Object>} Response containing room list
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {Array<Object>} returns.rooms - Array of room objects
 * @returns {number} returns.rooms[].room_id - Unique room identifier
 * @returns {string} returns.rooms[].room_name - Room name/number
 * @returns {string} returns.rooms[].building - Building name
 * @returns {number} returns.rooms[].floor - Floor number
 * @returns {number} returns.rooms[].capacity - Maximum capacity
 * @returns {boolean} returns.rooms[].has_computers - Computer availability
 * @returns {string} returns.rooms[].features - Room features description
 * @returns {boolean} returns.rooms[].is_active - Room status
 * 
 * @example
 * // Get all rooms
 * const result = await get_all_rooms();
 * if (result.success) {
 *     console.log('Found', result.rooms.length, 'rooms');
 * }
 * 
 * @example
 * // Get active rooms with computers in building A
 * const result = await get_all_rooms({
 *     building: 'Tòa nhà A',
 *     is_active: true,
 *     has_computers: true
 * });
 */
export const get_all_rooms = (filters = {}) => {
	const query_params = new URLSearchParams(filters).toString();
	const endpoint = `/api/rooms/get-all-rooms${query_params ? `?${query_params}` : ""}`;
	return api_call(endpoint, { method: "GET" });
};

/**
 * Create a new room
 * 
 * Admin-only endpoint for creating new exam rooms. Validates room data
 * and ensures room names are unique within the same building.
 * 
 * @requires Admin role authentication
 * @param {Object} room_data - New room data
 * @param {string} room_data.room_name - Room name/number (required)
 * @param {string} [room_data.building] - Building name
 * @param {number} room_data.floor - Floor number (default: 1)
 * @param {number} room_data.capacity - Maximum capacity (required)
 * @param {boolean} [room_data.has_computers=false] - Computer availability
 * @param {string} [room_data.features] - Room features description
 * @param {boolean} [room_data.is_active=true] - Room status
 * @returns {Promise<Object>} Response containing created room
 * @returns {boolean} returns.success - Whether creation was successful
 * @returns {Object} [returns.room] - Created room data
 * @returns {string} [returns.message] - Success/error message
 * 
 * @throws {Error} 400 Bad Request if validation fails
 * @throws {Error} 409 Conflict if room name already exists in building
 * @throws {Error} 403 Forbidden if user lacks admin privileges
 * 
 * @example
 * // Create new room
 * const result = await create_room({
 *     room_name: 'Phòng A1',
 *     building: 'Tòa nhà A',
 *     floor: 1,
 *     capacity: 40,
 *     has_computers: true,
 *     features: 'Máy chiếu, Điều hòa, Wifi'
 * });
 * 
 * if (result.success) {
 *     console.log('Room created:', result.room);
 * }
 */
export const create_room = (room_data) =>
	api_call("/api/rooms/create-room", {
		method: "POST",
		body: JSON.stringify(room_data),
	});

/**
 * Update an existing room
 * 
 * Admin-only endpoint for updating room information. Allows partial updates
 * and validates that room names remain unique within buildings.
 * 
 * @requires Admin role authentication
 * @param {number} room_id - ID of the room to update
 * @param {Object} room_data - Updated room data (partial)
 * @param {string} [room_data.room_name] - Room name/number
 * @param {string} [room_data.building] - Building name
 * @param {number} [room_data.floor] - Floor number
 * @param {number} [room_data.capacity] - Maximum capacity
 * @param {boolean} [room_data.has_computers] - Computer availability
 * @param {string} [room_data.features] - Room features description
 * @param {boolean} [room_data.is_active] - Room status
 * @returns {Promise<Object>} Response containing updated room
 * @returns {boolean} returns.success - Whether update was successful
 * @returns {Object} [returns.room] - Updated room data
 * @returns {string} [returns.message] - Success/error message
 * 
 * @throws {Error} 400 Bad Request if validation fails
 * @throws {Error} 404 Not Found if room doesn't exist
 * @throws {Error} 409 Conflict if room name conflicts
 * @throws {Error} 403 Forbidden if user lacks admin privileges
 * 
 * @example
 * // Update room capacity and features
 * const result = await update_room(1, {
 *     capacity: 45,
 *     features: 'Máy chiếu, Điều hòa, Wifi, Bảng thông minh'
 * });
 * 
 * if (result.success) {
 *     console.log('Room updated:', result.room);
 * }
 */
export const update_room = (room_id, room_data) =>
	api_call(`/api/rooms/update-room/${room_id}`, {
		method: "PUT",
		body: JSON.stringify(room_data),
	});

/**
 * Delete a room
 * 
 * Admin-only endpoint for removing rooms from the system. Performs safety
 * checks to ensure the room is not currently assigned to any active exams
 * before deletion.
 * 
 * @requires Admin role authentication
 * @param {number} room_id - ID of the room to delete
 * @returns {Promise<Object>} Response containing deletion result
 * @returns {boolean} returns.success - Whether deletion was successful
 * @returns {string} [returns.message] - Success/error message
 * 
 * @throws {Error} 400 Bad Request if room is currently in use
 * @throws {Error} 404 Not Found if room doesn't exist
 * @throws {Error} 403 Forbidden if user lacks admin privileges
 * 
 * @example
 * // Delete room
 * const result = await delete_room(5);
 * if (result.success) {
 *     console.log('Room deleted successfully');
 * } else {
 *     console.error('Failed to delete room:', result.message);
 * }
 */
export const delete_room = (room_id) =>
	api_call(`/api/rooms/delete-room/${room_id}`, {
		method: "DELETE",
	});

/**
 * Get current exam status for a room
 * 
 * Retrieves the current exam status for a specific room, including whether
 * it's currently being used for an exam, scheduled for upcoming exams, or available.
 * 
 * @requires Admin role authentication
 * @param {number} room_id - ID of the room to check status
 * @returns {Promise<Object>} Response containing room exam status
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {Object} returns.exam_status - Room exam status information
 * @returns {string} returns.exam_status.status - 'available', 'in_exam', 'scheduled'
 * @returns {string} returns.exam_status.status_text - Vietnamese status text
 * @returns {string} returns.exam_status.status_class - CSS class for Bootstrap styling
 * @returns {Object} [returns.exam_status.current_exam] - Current exam details if active
 * @returns {Array} [returns.exam_status.upcoming_exams] - Upcoming exams in next 24h
 * @returns {string} [returns.message] - Success/error message
 * 
 * @throws {Error} 404 Not Found if room doesn't exist
 * @throws {Error} 403 Forbidden if user lacks admin privileges
 * 
 * @example
 * // Get room exam status
 * const result = await get_room_exam_status(1);
 * if (result.success) {
 *     const { status, status_text, current_exam } = result.exam_status;
 *     if (status === 'in_exam') {
 *         console.log(`Room is currently in exam: ${current_exam.title}`);
 *     }
 * }
 */
export const get_room_exam_status = (room_id) =>
	api_call(`/api/rooms/exam-status/${room_id}`, {
		method: "GET",
	});
