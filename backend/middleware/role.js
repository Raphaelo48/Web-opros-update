function checkRole(roles) {
    return function(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Доступ запрещён. Требуются роли: ${roles.join(', ')}`
            });
        }
        next();
    };
}

module.exports = { checkRole };