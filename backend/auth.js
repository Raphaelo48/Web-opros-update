const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

function generateToken(userId, email, role) {
    return jwt.sign(
        { userId, email, role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function register(req, res, pool) {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    if (password.length < 4) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 4 символа' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Некорректный email' });
    }

    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await hashPassword(password);
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, role, created_at)
             VALUES ($1, $2, $3, 'user', NOW())
             RETURNING id, email, name, role, created_at`,
            [email.toLowerCase(), hashedPassword, name || null]
        );

        const user = result.rows[0];
        const token = generateToken(user.id, user.email, user.role);

        res.status(201).json({
            message: 'Пользователь успешно создан',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('❌ Ошибка регистрации:', err.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}

async function login(req, res, pool) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    try {
        const result = await pool.query(
            `SELECT id, email, password_hash, name, role, created_at
             FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = result.rows[0];
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = generateToken(user.id, user.email, user.role);

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('❌ Ошибка входа:', err.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}

async function getMe(req, res, pool) {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            `SELECT id, email, name, role, created_at FROM users WHERE id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка получения пользователя:', err.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}

async function logout(req, res) {
    res.json({ message: 'Выход выполнен успешно' });
}

module.exports = {
    register,
    login,
    getMe,
    logout,
    hashPassword,
    comparePassword,
    generateToken,
    JWT_SECRET
};