const db = require('../models');
const { generate_jwt } = require('../middleware/auth');

/**
 * @typedef {Object} LoginResponse
 * @property {boolean} success - Indicates if the operation was successful
 * @property {string} message - Response message
 * @property {Object} [user] - Authenticated user data (only on success)
 * @property {number} user.id - User ID
 * @property {string} user.username - Username
 * @property {string} user.role - User role ('student', 'teacher', or 'admin')
 * @property {string} [error] - Error message (only on failure)
 */

/**
 * Handles user authentication
 * @async
 * @function login
 * @param {string} user_name - The username to authenticate
 * @param {string} password - The password to verify
 * @param {Object} res - Express response object
 * @returns {Promise<LoginResponse>} - Returns a response with authentication status
 * @throws {Error} Will throw an error if database operation fails
 * 
 * @example
 * // Example usage in an Express route
 * app.post('/login', async (req, res) => {
 *   await login(req.body.user_name, req.body.password, res);
 * });
 * 
 * @example
 * // Example successful response
 * {
 *   success: true,
 *   message: "Đăng nhập thành công",
 *   user: {
 *     id: 1,
 *     username: "testuser",
 *     role: "student"
 *   }
 * }
 * 
 * @example
 * // Example error response
 * {
 *   success: false,
 *   message: "Mật khẩu không chính xác",
 *   error: "Invalid credentials"
 * }
 */
async function login(user_name, password, res) {
	try {
		if (!user_name || !password) {
			return res.status(400).json({
				success: false,
				message: "Tên tài khoản hoặc mật khẩu không được để trống",
			});
		}

		const user = await db.models.User.findOne({
			where: { user_name },
		});

		if (!user | !(await user.checkPassword(password))) {
			return res.json({
				success: false,
				message: "Tên tài khoản hoặc mật khẩu không đúng"
			});
		}

        const payload = {
            user_id: user.user_id,
            user_name: user.user_name,
            full_name: user.full_name,
            user_role: user.user_role,
            email: user.email
        };

        const jwt_token = generate_jwt(payload, {
            expiresIn: '10d', // Token expires in 2 hours
            issuer: 'exampro-scheduler', // Optional: your app name
            audience: 'exampro-users',   // Optional: intended audience
        });

        // HTTP-Only cookie approach for JWT storage
        res.cookie('jwt_token', jwt_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // only send over HTTPS in production
            sameSite: 'strict',
            maxAge: 10 * 24 * 60 * 60 * 1000
        });

		return res.json({
			success: true,
			message: "Đăng nhập thành công",
			user: {
				id: user.user_id,
                full_name: user.full_name,
				user_name: user.user_name,
				role: user.user_role,
                email: user.email
			}
		});
	} catch (error) {
		throw error;
	}
}

async function logout(res) {
    try {
        res.clearCookie('jwt_token');
        return res.json({
            success: true,
            message: "Đăng xuất thành công"
        })
    } catch (error) {
		throw error;
	}
}

async function authorize(user_id, res) {
    try {
        const user = await db.models.User.findByPk(user_id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        return res.json({
            success: true,
            user: {
                id: user.user_id,
                full_name: user.full_name,
				user_name: user.user_name,
				role: user.user_role,
                email: user.email
            }
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Generates a temporary WebSocket authentication token
 * 
 * Creates a short-lived JWT token specifically for WebSocket authentication.
 * This maintains security by validating the HTTP-only cookie session and 
 * providing a temporary token without storing it client-side.
 * 
 * @async
 * @function get_websocket_token
 * @param {number} user_id - Authenticated user ID from middleware
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with temporary WebSocket token
 * 
 * @example
 * // Successful response
 * {
 *   success: true,
 *   websocket_token: "eyJhbGciOiJIUzI1NiIs...",
 *   expires_in: 3600
 * }
 */
async function get_websocket_token(user_id, res) {
    try {
        const user = await db.models.User.findByPk(user_id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy người dùng' 
            });
        }

        // Create temporary token for WebSocket authentication (1 hour expiry)
        const websocket_payload = {
            user_id: user.user_id,
            user_name: user.user_name,
            user_role: user.user_role,
            token_type: 'websocket'
        };

        const websocket_token = generate_jwt(websocket_payload, {
            expiresIn: '1h', // Short-lived for security
            issuer: 'exampro-scheduler-ws',
            audience: 'websocket-clients'
        });

        return res.json({
            success: true,
            websocket_token,
            expires_in: 3600 // 1 hour in seconds
        });
    } catch (error) {
        console.error('WebSocket token generation failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Không thể tạo token WebSocket' 
        });
    }
}

/**
 * Renews an expired WebSocket token
 * 
 * Validates the HTTP session and issues a new WebSocket token for 
 * continued real-time functionality without requiring full re-authentication.
 * 
 * @async
 * @function renew_websocket_token
 * @param {number} user_id - Authenticated user ID from middleware
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with new WebSocket token
 * 
 * @example
 * // Successful renewal response
 * {
 *   success: true,
 *   websocket_token: "eyJhbGciOiJIUzI1NiIs...",
 *   expires_in: 3600,
 *   renewed_at: "2025-08-04T10:30:00.000Z"
 * }
 */
async function renew_websocket_token(user_id, res) {
    try {
        const user = await db.models.User.findByPk(user_id);

        if (!user || !user.is_active) {
            return res.status(404).json({ 
                success: false, 
                message: 'Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa' 
            });
        }

        // Generate fresh WebSocket token
        const websocket_payload = {
            user_id: user.user_id,
            user_name: user.user_name,
            user_role: user.user_role,
            token_type: 'websocket',
            renewed: true // Flag to indicate this is a renewed token
        };

        const new_websocket_token = generate_jwt(websocket_payload, {
            expiresIn: '1h',
            issuer: 'exampro-scheduler-ws',
            audience: 'websocket-clients'
        });

        console.log(`🔄 WebSocket token renewed for user: ${user.user_name} (${user.user_role})`);

        return res.json({
            success: true,
            websocket_token: new_websocket_token,
            expires_in: 3600, // 1 hour in seconds
            renewed_at: new Date().toISOString(),
            user: {
                id: user.user_id,
                user_name: user.user_name,
                role: user.user_role
            }
        });
    } catch (error) {
        console.error('WebSocket token renewal failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Không thể gia hạn token WebSocket' 
        });
    }
}

module.exports = {
    userController: {
        login,
        logout,
        authorize,
        get_websocket_token,
        renew_websocket_token
    },
}