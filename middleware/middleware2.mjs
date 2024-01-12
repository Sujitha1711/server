import jwt from 'jsonwebtoken';
import { secretKey } from '../routes/members.mjs';
import { refreshToken } from './tokenRefresh.mjs';

export const requireAuth = (requiredRoles = []) => async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract the token without the "Bearer " prefix
  const tokenWithoutBearer = token.replace(/^Bearer\s/, '');

  try {
    const decodedToken = jwt.verify(tokenWithoutBearer, secretKey);

    console.log('Decoded token:', decodedToken);

    // Check if the user has the required role
    if (!decodedToken || !decodedToken.userId || !decodedToken.role || !decodedToken.email) {
      console.error('Invalid decoded token structure');
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    const decodedRole = decodedToken.role.toLowerCase();

    if (!requiredRoles.map((role) => role.toLowerCase()).includes(decodedRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    req.userId = decodedToken.userId;
    req.userEmail = decodedToken.email; // Store the user's email in req.userEmail
    next();
  } catch (err) {
    // If token is invalid, attempt to refresh
    try {
      const refreshedToken = await refreshToken(tokenWithoutBearer);
      req.newAccessToken = refreshedToken.accessToken;
      next();
    } catch (refreshError) {
      console.error('Error refreshing token:', refreshError);
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
};
