const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Неверный формат токена. Используйте: Bearer <token>' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Срок действия токена истёк' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Неверный токен' });
        }
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
    }
    next();
}

function requireUser(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
}

module.exports = { verifyToken, requireAdmin, requireUser };