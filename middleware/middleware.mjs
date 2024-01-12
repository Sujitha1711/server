import jwt from 'jsonwebtoken';
import { secretKey } from '../routes/members.mjs';

export const requireAuth = (requiredRoles) => (req, res, next) => {
    const token = req.headers.authorization;

    if (token) {
        // Extract the token without the "Bearer " prefix
        const tokenWithoutBearer = token.replace(/^Bearer\s/, '');

        jwt.verify(tokenWithoutBearer, secretKey, (err, decodedToken) => {
            if (err) {
                console.error("Error verifying token:", err);
                return res.status(401).json({ message: 'Invalid token' });
            } else {
                console.log("Decoded token:", decodedToken);

                // Check if the user has the required role
                if (!decodedToken || !decodedToken.adminId || !decodedToken.role) {
                    console.error("Invalid decoded token structure");
                    return res.status(401).json({ message: 'Invalid token structure' });
                }

                const decodedRole = decodedToken.role.toLowerCase();

                if (!requiredRoles.map(role => role.toLowerCase()).includes(decodedRole)) {
                    return res.status(403).json({ message: 'Insufficient permissions' });
                }
                req.adminId = decodedToken.adminId;
                next();
            }
        });
    } else {
        res.status(401).json({ message: 'No token provided' });
    }
};
