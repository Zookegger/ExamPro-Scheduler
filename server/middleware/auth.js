const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

/**
 * Generates a JWT token for user authentication
 * 
 * @function generate_jwt
 * @param {Object} payload - Data to encode in the JWT (e.g., user_id, user_role)
 * @param {Object} [options] - Optional JWT signing options (expiresIn, issuer, audience, etc.)
 * @returns {string} JWT token string
 * @example
 * const token = generate_jwt({ user_id: 1, user_role: 'admin' }, { expiresIn: '2h' });
 */
function generate_jwt(payload, options = {}) {
    const default_options = {
        expiresIn: '2h', // Token expires in 2 hours
        issuer: 'exampro-scheduler',
        audience: 'exampro-users'
    };

    return jwt.sign(payload, JWT_SECRET, { ...default_options, ...options});
}

/**
 * Express middleware to authenticate requests using JWT
 *
 * Checks for a JWT token in the Authorization header (Bearer scheme), verifies it,
 * and attaches the decoded payload to req.user. Responds with 401/403 on failure.
 *
 * @function authenticate_jwt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @example
 * app.get('/protected', authenticate_jwt, (req, res) => {
 *   // req.user contains decoded JWT payload
 * });
 */
function authenticate_jwt(req, res, next) {
    // Get JWT from cookie or Authorization header
    const token = req.cookies?.jwt_token || (req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : null);
    console.log("[ JWT TOKEN ]: ", token);
    
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Bạn chưa đăng nhập'
        })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token không hợp lệ'
            })
        }
        req.user = user; // Attach decoded payload to request
        next();
    });
}

module.exports = {
    generate_jwt,
    authenticate_jwt
}