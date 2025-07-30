const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

function generate_jwt(payload, options = {}) {
    const default_options = {
        expiresIn: '2h', // Token expires in 2 hours
        issuer: 'exampro-scheduler',
        audience: 'exampro-users'
    };

    return jwt.sign(payload, JWT_SECRET, { ...default_options, ...options});
}

function authenticate_jwt(req, res, next) {
    const auth_header = req.header['authorization'];
    const token = auth_header && auth_header.split(' ')[1];
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
        req.user = user;
        next();
    });
}

module.exports = {
    generate_jwt,
    authenticate_jwt
}