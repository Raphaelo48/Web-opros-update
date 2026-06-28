const jwt = require('jsonwebtoken');

// Секретный ключ для JWT (должен совпадать с тем, что в auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

// ============================================================
//  MIDDLEWARE: ПРОВЕРКА ТОКЕНА
// ============================================================

function verifyToken(req, res, next) {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Ожидаем формат: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Неверный формат токена. Используйте: Bearer <token>' });
    }

    const token = parts[1];

    try {
        // Проверяем и расшифровываем токен
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, email, role, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Срок действия токена истёк' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Неверный токен' });
        }
        console.error('❌ Ошибка проверки токена:', err.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}

// ============================================================
//  MIDDLEWARE: ПРОВЕРКА РОЛИ (ADMIN)
// ============================================================

function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
    }

    next();
}

// ============================================================
//  MIDDLEWARE: ПРОВЕРКА РОЛИ (USER или ADMIN)
// ============================================================

function requireUser(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Проверяем, что роль пользователя — 'user' или 'admin'
    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }

    next();
}

// ============================================================
//  ЭКСПОРТ
// ============================================================

module.exports = {
    verifyToken,
    requireAdmin,
    requireUser
};