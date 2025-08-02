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

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Tài khoản không tồn tại",
			});
		}

		const is_password_valid = await user.checkPassword(password);

		if (!is_password_valid) {
			return res.json({
				success: false,
				message: "Mật khẩu không chính xác",
			});
		}

        console.log(user.user_name);

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
			},
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

module.exports = {
    userController: {
        login,
        logout,
        authorize
    },
}