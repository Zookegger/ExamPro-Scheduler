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
exports.login = async (user_name, password, res) => {
	try {
		if (!user_name | !password) {
			res.status(400).json({
				success: false,
				message: "Tên tài khoản hoặc mật khẩu không được để trống",
			});
		}

		const user = await db.models.User.findOne({
			where: { user_name },
		});

		console.log("🔍 User lookup result:", user ? "Found" : "Not found");

		if (!user) {
			res.status(401).json({
				success: false,
				message: "Tài khoản không tồn tại",
			});
		}

		const is_password_valid = await user.checkPassword(password);

		console.log(
			"🔍 Available methods:",
			Object.getOwnPropertyNames(Object.getPrototypeOf(user))
		);

		if (!is_password_valid) {
			return res.json({
				success: false,
				message: "Mật khẩu không chính xác",
			});
		}

		res.json({
			success: true,
			message: "Đăng nhập thành công",
			user: {
				id: user.user_id,
				username: user.user_name,
				role: user.user_role,
			},
		});
	} catch (error) {
		console.error("❌ Login failed:", error);
		res.status(500).json({
			success: false,
			message: "Đã xảy ra lỗi khi đăng nhập",
			error: error.message,
		});
	}
};
