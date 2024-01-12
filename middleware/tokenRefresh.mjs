import jwt from 'jsonwebtoken';
// import { secretKey } from '../routes/members.mjs';

// Function to generate a new JWT token
const generateAccessToken = (userId, email, role) => {
    return jwt.sign({ userId, email, role }, secretKey, { expiresIn: '2m' });
};

const secretKey = "my-32-character-ultra-secure-and-ultra-long-secret";
// Token refresh logic
export const refreshToken = (refreshToken, userRole) => {
    try {
        const decoded = jwt.verify(refreshToken, secretKey);

        // You can handle different roles here
        // For example, generate a new access token based on the user's role
        const newAccessToken = generateAccessToken(decoded.userId, decoded.email, userRole);
        return { accessToken: newAccessToken };
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Invalid refresh token');
    }
};