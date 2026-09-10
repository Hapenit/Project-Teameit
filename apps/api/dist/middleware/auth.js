"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' } });
    }
    const token = authHeader.split(' ')[1];
    try {
        // We would normally verify against the Supabase JWT secret
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is not configured' } });
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
};
exports.requireAuth = requireAuth;
