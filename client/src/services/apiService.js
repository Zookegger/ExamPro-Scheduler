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
const getApiBaseUrl = () => {
	if (process.env.REACT_APP_API_URL) {
		return process.env.REACT_APP_API_URL;
	}

	return "http://localhost:5000";
};

/**
 * Base URL for all API calls
 * @constant {string}
 */
const API_BASE_URL = getApiBaseUrl();

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
 * const users = await apiCall('/api/admin/accounts/get_all_users');
 *
 * @example
 * // POST request with data
 * const result = await apiCall('/api/users/login', {
 *     method: 'POST',
 *     body: JSON.stringify({ user_name: 'admin', password: 'password123' })
 * });
 */
const apiCall = async (endpoint, options = {}) => {
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
export const checkServerHealth = () => apiCall("/api/health");

/**
 * Gets the WebSocket URL for real-time features
 *
 * Returns the appropriate WebSocket URL based on environment configuration.
 * Used for Socket.io connection setup for real-time notifications and updates.
 *
 * @returns {string} WebSocket URL for Socket.io connection
 *
 * @example
 * const socket = io(getSocketUrl());
 */
export const getSocketUrl = () => {
	return process.env.REACT_APP_WS_URL || "http://localhost:5000";
};

/**
 * Gets a temporary WebSocket authentication token
 *
 * Securely retrieves a temporary token for WebSocket authentication by validating
 * the HTTP-only cookie session. This approach maintains security by not storing
 * JWT tokens in browser storage while enabling WebSocket authentication.
 *
 * @returns {Promise<string|null>} Temporary WebSocket token if authenticated, null otherwise
 *
 * @example
 * // Get secure token for WebSocket authentication
 * const token = await getAuthToken();
 * if (token) {
 *     socket.emit('authenticate', { token });
 * }
 */
export const getAuthToken = async () => {
	try {
		const response = await apiCall("/api/users/websocket-token", {
			method: "POST",
			credentials: "include",
		});
		
		if (response.success && response.websocket_token) {
			return response.websocket_token;
		}
		
		return null;
	} catch (error) {
		console.error('Failed to get WebSocket token:', error);
		return null;
	}
};

/**
 * Renews an expired WebSocket token
 *
 * Requests a fresh WebSocket token when the current one has expired or is about
 * to expire. This prevents WebSocket disconnections due to token expiration.
 *
 * @returns {Promise<Object|null>} Token renewal response or null if failed
 * @returns {string} returns.websocket_token - New WebSocket token
 * @returns {number} returns.expires_in - Token lifetime in seconds
 * @returns {string} returns.renewed_at - Renewal timestamp
 *
 * @example
 * // Renew WebSocket token
 * const renewal = await renewAuthToken();
 * if (renewal && renewal.websocket_token) {
 *     // Update WebSocket connection with new token
 *     socket.emit('renew_token', { new_token: renewal.websocket_token });
 * }
 */
export const renewAuthToken = async () => {
	try {
		const response = await apiCall("/api/users/renew-websocket-token", {
			method: "POST",
			credentials: "include",
		});
		
		if (response.success && response.websocket_token) {
			return response;
		}
		
		return null;
	} catch (error) {
		console.error('Failed to renew WebSocket token:', error);
		return null;
	}
};

// ============================================================================
// USER AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================

/**
 * Authenticates user with username/email and password
 *
 * Performs user login with automatic JWT token handling via HTTP-only cookies.
 * Supports both username and email-based authentication.
 * Also stores token locally for WebSocket authentication needs.
 *
 * @param {Object} user_data - Login credentials
 * @param {string} user_data.user_name - Username or email address
 * @param {string} user_data.password - User password
 * @returns {Promise<Object>} Authentication response
 * @returns {boolean} returns.success - Whether login was successful
 * @returns {Object} [returns.user] - User data if login successful
 * @returns {string} [returns.token] - JWT token for WebSocket authentication
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
export const login = async (user_data) => {
	try {
		const response = await apiCall("/api/users/login", {
			method: "POST",
			body: JSON.stringify(user_data),
			credentials: "include",
		});

		return response;
	} catch (error) {
		console.error('Login failed:', error);
		throw error;
	}
};

/**
 * Logs out the current user
 *
 * Invalidates the current session and clears authentication cookies.
 * Also removes locally stored JWT token for WebSocket authentication.
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
export const logout = async () => {
	try {
		const response = await apiCall("/api/users/logout", {
			method: "POST",
		});

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		throw error;
	}
};

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
		const response = await apiCall("/api/users/me", {
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
 *         const response = await getAllUsers();
 *         if (response.success) {
 *             setUsers(response.users);
 *         }
 *     } catch (error) {
 *         console.error('Failed to load users:', error);
 *     }
 * };
 */
export const getAllUsers = () =>
	apiCall("/api/admin/accounts/get_all_users");

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
 * const result = await createUser({
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
export const createUser = (user_data) =>
	apiCall("/api/admin/accounts/create-new-account", {
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
	return apiCall(endpoint);
};

/**
 * Get a single exam by ID
 *
 * Retrieves detailed information about a specific exam including
 * room and subject details.
 *
 * @param {number|string} exam_id - The exam ID to retrieve
 * @returns {Promise<Object>} Exam details response
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {Object} returns.data - Exam object with full details
 *
 * @example
 * const exam = await getExamById(123);
 * if (exam.success) {
 *     console.log('Exam details:', exam.data);
 * }
 */
export const getExamById = (exam_id) => {
	return apiCall(`/api/exams/${exam_id}`);
};

/**
 * Create a new exam
 *
 * Creates a new exam with the provided data. Requires admin privileges.
 * Validates room availability and time conflicts automatically.
 *
 * @param {Object} exam_data - Exam data object
 * @param {string} exam_data.title - Exam title
 * @param {string} exam_data.subject_code - Subject code
 * @param {string} exam_data.exam_date - Exam date (YYYY-MM-DD format)
 * @param {string} exam_data.start_time - Start time (HH:MM format)
 * @param {string} exam_data.end_time - End time (HH:MM format)
 * @param {number} exam_data.duration_minutes - Duration in minutes
 * @param {string} exam_data.method - Exam method (online, offline, hybrid)
 * @param {string} [exam_data.description] - Optional exam description
 * @param {number} [exam_data.max_students] - Maximum number of students
 * @param {number} [exam_data.room_id] - Room ID for offline/hybrid exams
 * @param {string} [exam_data.status] - Exam status (default: draft)
 * @param {string} [exam_data.grade_level] - Grade level
 * @param {number} [exam_data.class_id] - Class ID if exam is for specific class
 * @returns {Promise<Object>} Creation response
 * @returns {boolean} returns.success - Whether the creation was successful
 * @returns {Object} returns.data - Created exam object
 * @returns {string} returns.message - Success or error message
 *
 * @example
 * const new_exam = await createExam({
 *     title: 'Kiểm tra Toán học Kỳ 1',
 *     subject_code: 'MATH',
 *     exam_date: '2024-03-15',
 *     start_time: '08:00',
 *     end_time: '10:00',
 *     duration_minutes: 120,
 *     method: 'offline',
 *     room_id: 1,
 *     max_students: 30
 * });
 */
export const createExam = (exam_data) => {
	return apiCall('/api/exams', {
		method: 'POST',
		body: JSON.stringify(exam_data),
	});
};

/**
 * Update an existing exam
 *
 * Updates exam data with the provided fields. Only provided fields
 * will be updated. Requires admin privileges.
 *
 * @param {number|string} exam_id - The exam ID to update
 * @param {Object} exam_data - Exam data object with fields to update
 * @returns {Promise<Object>} Update response
 * @returns {boolean} returns.success - Whether the update was successful
 * @returns {Object} returns.data - Updated exam object
 * @returns {string} returns.message - Success or error message
 *
 * @example
 * const updated_exam = await updateExam(123, {
 *     title: 'Updated Exam Title',
 *     room_id: 2,
 *     max_students: 25
 * });
 */
export const updateExam = (exam_id, exam_data) => {
	return apiCall(`/api/exams/${exam_id}`, {
		method: 'PUT',
		body: JSON.stringify(exam_data),
	});
};

/**
 * Delete an exam
 *
 * Deletes an exam permanently. Cannot delete exams that have
 * student registrations. Requires admin privileges.
 *
 * @param {number|string} exam_id - The exam ID to delete
 * @returns {Promise<Object>} Deletion response
 * @returns {boolean} returns.success - Whether the deletion was successful
 * @returns {string} returns.message - Success or error message
 *
 * @example
 * const result = await deleteExam(123);
 * if (result.success) {
 *     console.log('Exam deleted successfully');
 * }
 */
export const deleteExam = (exam_id) => {
	return apiCall(`/api/exams/${exam_id}`, {
		method: 'DELETE',
	});
};

// ============================================================================
// SUBJECT MANAGEMENT (Admin Role Partially Required)
// ============================================================================

export const getAllSubjects = (filters = {}) => {
	const query_params = new URLSearchParams(filters).toString();
	const endpoint = `/api/subjects${query_params ? `?${query_params}` : ""}`;
	return apiCall(endpoint, { method: "GET" });
};

export const addNewSubject = (subject_data) =>
	apiCall("/api/subjects", {
		method: "POST",
		body: JSON.stringify(subject_data),
	}
);

export const updateSubject = (subject_id, subject_data) =>
	apiCall(`/api/subjects/${subject_id}`, {
		method: "PUT",
		body: JSON.stringify(subject_data),
	}
);

export const deleteSubject = (subject_id) =>
	apiCall(`/api/subjects/${subject_id}`, {
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
	return apiCall(endpoint, { method: "GET" });
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
	apiCall("/api/notifications/mark-read", {
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
	apiCall("/api/notifications/mark-all-read", {
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
	apiCall("/api/notifications", {
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
	apiCall(`/api/notifications/${notification_id}`, {
		method: "DELETE",
	});

// ============================================================================
// TEACHER-SPECIFIC ENDPOINTS
// ============================================================================

/**
 * Get exams where the current teacher is assigned as a proctor
 *
 * Retrieves all exams where the authenticated teacher is assigned
 * as either main proctor or assistant proctor.
 *
 * @param {Object} [filters={}] - Optional filters
 * @param {string} [filters.status] - Filter by exam status
 * @param {string} [filters.start_date] - Filter exams from date (YYYY-MM-DD)
 * @param {string} [filters.end_date] - Filter exams to date (YYYY-MM-DD)
 * @returns {Promise<Object>} Teacher's proctor exams response
 * @returns {boolean} returns.success - Whether the request was successful
 * @returns {Array} returns.data - Array of exam objects with proctor details
 * 
 * @example
 * // Get all proctor exams for current teacher
 * const proctor_exams = await getTeacherProctorExams();
 * 
 * @example
 * // Get only upcoming proctor exams
 * const upcoming_exams = await getTeacherProctorExams({
 *     status: 'upcoming',
 *     start_date: '2025-08-01'
 * });
 */
export const getTeacherProctorExams = (filters = {}) => {
	const query_params = new URLSearchParams(filters).toString();
	const endpoint = `/api/schedule/teacher-proctor-exams${query_params ? `?${query_params}` : ""}`;
	return apiCall(endpoint);
};

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
 * const result = await getAllRooms();
 * if (result.success) {
 *     console.log('Found', result.rooms.length, 'rooms');
 * }
 * 
 * @example
 * // Get active rooms with computers in building A
 * const result = await getAllRooms({
 *     building: 'Tòa nhà A',
 *     is_active: true,
 *     has_computers: true
 * });
 */
export const getAllRooms = (filters = {}) => {
	const query_params = new URLSearchParams(filters).toString();
	const endpoint = `/api/rooms/get-all-rooms${query_params ? `?${query_params}` : ""}`;
	return apiCall(endpoint, { method: "GET" });
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
 * const result = await createRoom({
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
export const createRoom = (room_data) =>
	apiCall("/api/rooms/create-room", {
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
 * const result = await updateRoom(1, {
 *     capacity: 45,
 *     features: 'Máy chiếu, Điều hòa, Wifi, Bảng thông minh'
 * });
 * 
 * if (result.success) {
 *     console.log('Room updated:', result.room);
 * }
 */
export const updateRoom = (room_id, room_data) =>
	apiCall(`/api/rooms/update-room/${room_id}`, {
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
 * const result = await deleteRoom(5);
 * if (result.success) {
 *     console.log('Room deleted successfully');
 * } else {
 *     console.error('Failed to delete room:', result.message);
 * }
 */
export const deleteRoom = (room_id) =>
	apiCall(`/api/rooms/delete-room/${room_id}`, {
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
 * const result = await getRoomExamStatus(1);
 * if (result.success) {
 *     const { status, status_text, current_exam } = result.exam_status;
 *     if (status === 'in_exam') {
 *         console.log(`Room is currently in exam: ${current_exam.title}`);
 *     }
 * }
 */
export const getRoomExamStatus = (room_id) =>
	apiCall(`/api/rooms/exam-status/${room_id}`, {
		method: "GET",
	});

// ============================================================================
// SCHEDULE API FUNCTIONS
// ============================================================================

/**
 * Get comprehensive schedule overview with statistics
 * 
 * @param {Object} filters - Optional filters for the schedule
 * @param {string} [filters.start_date] - Start date filter (YYYY-MM-DD)
 * @param {string} [filters.end_date] - End date filter (YYYY-MM-DD)
 * @param {number} [filters.room_id] - Filter by room ID
 * @param {string} [filters.subject_code] - Filter by subject code
 * @param {boolean} [filters.include_stats=true] - Include statistics
 * @returns {Promise<Object>} Response with schedule data and statistics
 */
export const getScheduleOverview = (filters = {}) => {
	const params = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== '' && value !== 'all') {
			params.append(key, value);
		}
	});
	
	const endpoint = `/api/schedule/overview${params.toString() ? `?${params.toString()}` : ''}`;
	return apiCall(endpoint, { method: "GET" });
};

/**
 * Get students and proctors not assigned to any published exams
 * 
 * @returns {Promise<Object>} Response with unassigned data
 */
export const getUnassignedData = () =>
	apiCall("/api/schedule/unassigned", {
		method: "GET",
	});

/**
 * Analyze schedule conflicts and optimization opportunities
 * 
 * @param {Object} filters - Analysis filters
 * @param {string} [filters.start_date] - Start date (YYYY-MM-DD format)
 * @param {string} [filters.end_date] - End date (YYYY-MM-DD format)
 * @param {string} [filters.severity='all'] - Severity filter ('critical', 'warning', 'info', 'all')
 * @returns {Promise<Object>} Response with conflict analysis
 */
export const getScheduleConflicts = (filters = {}) => {
	const params = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== '' && value !== null) {
			params.append(key, value);
		}
	});
	
	const endpoint = `/api/schedule/conflicts${params.toString() ? `?${params.toString()}` : ''}`;
	return apiCall(endpoint, { method: "GET" });
};

/**
 * Assign multiple students to an exam
 * 
 * @param {number} exam_id - ID of the exam
 * @param {Array<number>} student_ids - Array of student IDs to assign
 * @param {string} [registration_status='approved'] - Status for the registrations
 * @returns {Promise<Object>} Response with assignment results
 */
export const assignStudentsToExam = (exam_id, student_ids, registration_status = 'approved') =>
	apiCall("/api/schedule/assign-students", {
		method: "POST",
		body: JSON.stringify({
			exam_id,
			student_ids,
			registration_status
		})
	});

/**
 * Assign multiple proctors to an exam
 * 
 * @param {number} exam_id - ID of the exam
 * @param {Array<Object>} proctor_assignments - Array of proctor assignment objects
 * @param {number} proctor_assignments[].proctor_id - ID of the proctor
 * @param {string} [proctor_assignments[].role='assistant'] - Role of proctor
 * @param {string} [proctor_assignments[].notes] - Optional notes
 * @returns {Promise<Object>} Response with assignment results
 */
export const assignProctorsToExam = (exam_id, proctor_assignments) =>
	apiCall("/api/schedule/assign-proctors", {
		method: "POST",
		body: JSON.stringify({
			exam_id,
			proctor_assignments
		})
	});

/**
 * Remove a student from an exam
 * 
 * @param {number} exam_id - ID of the exam
 * @param {number} student_id - ID of the student to remove
 * @returns {Promise<Object>} Response confirming removal
 */
export const removeStudentFromExam = (exam_id, student_id) =>
	apiCall(`/api/schedule/remove-student/${exam_id}/${student_id}`, {
		method: "DELETE",
	});

/**
 * Remove a proctor from an exam
 * 
 * @param {number} exam_id - ID of the exam
 * @param {number} proctor_id - ID of the proctor to remove
 * @returns {Promise<Object>} Response confirming removal
 */
export const removeProctorFromExam = (exam_id, proctor_id) =>
	apiCall(`/api/schedule/remove-proctor/${exam_id}/${proctor_id}`, {
		method: "DELETE",
	});
