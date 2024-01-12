// authMiddleware.mjs
import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing.' });
    }

    try {
        const decoded = jwt.verify(token, 'my-32-character-ultra-secure-and-ultra-long-secret');
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (error) {
        console.error('Error decoding token:', error);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.role)) {
            return res.status(403).json({ message: 'Insufficient permissions.' });
        }
        next();
    };
};

export { authenticate, checkRole };
