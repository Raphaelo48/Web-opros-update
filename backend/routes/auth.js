const express = require('express');
const router = express.Router();
const auth = require('../auth');
const { verifyToken } = require('../middleware/auth');

router.post('/register', async (req, res) => {
    const pool = req.app.get('pool');
    await auth.register(req, res, pool);
});

router.post('/login', async (req, res) => {
    const pool = req.app.get('pool');
    await auth.login(req, res, pool);
});

router.get('/me', verifyToken, async (req, res) => {
    const pool = req.app.get('pool');
    await auth.getMe(req, res, pool);
});

router.post('/logout', auth.logout);

module.exports = router;