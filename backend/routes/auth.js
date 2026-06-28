const express = require('express');
const router = express.Router();
const auth = require('../auth');
const { verifyToken } = require('../middleware/auth');

// ============================================================
//  МАРШРУТЫ АВТОРИЗАЦИИ
// ============================================================

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 * Body: { email, password, name? }
 */
router.post('/register', async (req, res) => {
    // req.pool передаётся из server.js
    const pool = req.app.get('pool');
    await auth.register(req, res, pool);
});

/**
 * POST /api/auth/login
 * Вход пользователя
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
    const pool = req.app.get('pool');
    await auth.login(req, res, pool);
});

/**
 * GET /api/auth/me
 * Получить данные текущего пользователя (требуется токен)
 */
router.get('/me', verifyToken, async (req, res) => {
    const pool = req.app.get('pool');
    await auth.getMe(req, res, pool);
});

/**
 * POST /api/auth/logout
 * Выход (удаление токена на клиенте)
 */
router.post('/logout', auth.logout);

module.exports = router;