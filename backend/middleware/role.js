// ============================================================
//  MIDDLEWARE: ПРОВЕРКА РОЛИ (альтернативный вариант)
// ============================================================

function checkRole(roles) {
    return function(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        // Проверяем, есть ли роль пользователя в разрешённых
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Доступ запрещён. Требуются роли: ${roles.join(', ')}`
            });
        }

        next();
    };
}

// Использование:
// app.get('/api/admin', verifyToken, checkRole(['admin']), adminHandler);
// app.get('/api/user', verifyToken, checkRole(['user', 'admin']), userHandler);

module.exports = { checkRole };