require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.set("pool", pool);

const authRoutes = require("./routes/auth");
const { verifyToken, requireAdmin, requireUser } = require("./middleware/auth");

app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ status: "ok", time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  ЗАЩИЩЁННЫЕ МАРШРУТЫ
// ============================================================

// 1. Получить все результаты (только админ) — только последние записи
app.get("/api/results", verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM results WHERE is_last = true ORDER BY date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("❌ GET /api/results:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Получить "мои" результаты (все попытки пользователя)
app.get("/api/results/mine", verifyToken, requireUser, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM results WHERE user_id = $1 ORDER BY date DESC",
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("❌ GET /api/results/mine:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Сохранить результат (с пометкой is_last)
app.post("/api/results", verifyToken, requireUser, async (req, res) => {
    const { date, totalScore, regime, fastfood, concentration, verdict, isMine } = req.body;
    const userId = req.user.userId;

    if (!date || totalScore === undefined || totalScore < 0 || totalScore > 40) {
        return res.status(400).json({ error: "Invalid data" });
    }

    try {
        // ⭐ Помечаем все старые записи пользователя как is_last = FALSE
        await pool.query(
            "UPDATE results SET is_last = FALSE WHERE user_id = $1",
            [userId]
        );

        // Сохраняем новый результат с is_last = TRUE
        const result = await pool.query(
            `INSERT INTO results 
             (user_id, date, total_score, regime, fastfood, concentration, verdict, is_mine, is_last) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) 
             RETURNING *`,
            [userId, date, totalScore, regime, fastfood, concentration, verdict, isMine !== undefined ? isMine : true]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("❌ POST /api/results:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Очистить все данные (только админ)
app.delete("/api/results", verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query("DELETE FROM results");
        res.json({ message: "All data cleared" });
    } catch (err) {
        console.error("❌ DELETE /api/results:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 5. Получить статистику (только админ)
app.get("/api/stats", verifyToken, requireAdmin, async (req, res) => {
    try {
        const totalResult = await pool.query(
            "SELECT COUNT(*) as total FROM results WHERE is_last = true"
        );
        const avgResult = await pool.query(
            "SELECT AVG(total_score) as avg FROM results WHERE is_last = true"
        );
        const bestResult = await pool.query(
            "SELECT MAX(total_score) as best FROM results WHERE is_last = true"
        );
        const todayResult = await pool.query(
            `SELECT COUNT(*) as today FROM results 
             WHERE is_last = true AND DATE(date) = CURRENT_DATE`
        );

        res.json({
            total: parseInt(totalResult.rows[0].total) || 0,
            avg: parseFloat(avgResult.rows[0].avg) || 0,
            best: parseInt(bestResult.rows[0].best) || 0,
            today: parseInt(todayResult.rows[0].today) || 0
        });
    } catch (err) {
        console.error("❌ GET /api/stats:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 6. Получить средние по категориям (только админ)
app.get("/api/category-averages", verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                AVG(regime) as regime,
                AVG(fastfood) as fastfood,
                AVG(concentration) as concentration
             FROM results
             WHERE is_last = true`
        );
        res.json({
            regime: parseFloat(result.rows[0].regime) || 0,
            fastfood: parseFloat(result.rows[0].fastfood) || 0,
            concentration: parseFloat(result.rows[0].concentration) || 0
        });
    } catch (err) {
        console.error("❌ GET /api/category-averages:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 7. Получить количество по вердиктам (только админ)
app.get("/api/verdict-counts", verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT verdict, COUNT(*) as count 
             FROM results 
             WHERE is_last = true
             GROUP BY verdict`
        );
        const counts = { excellent: 0, good: 0, average: 0, poor: 0 };
        result.rows.forEach(row => {
            counts[row.verdict] = parseInt(row.count);
        });
        res.json(counts);
    } catch (err) {
        console.error("❌ GET /api/verdict-counts:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 8. Получить ежедневную статистику (только админ)
app.get("/api/daily-counts", verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                DATE(date) as day,
                COUNT(*) as count
             FROM results
             WHERE is_last = true AND date >= CURRENT_DATE - INTERVAL '13 days'
             GROUP BY DATE(date)
             ORDER BY day ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("❌ GET /api/daily-counts:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  ГЛАВНАЯ СТРАНИЦА
// ============================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ
// ============================================================

async function initDb() {
    try {
        // Таблица users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100),
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("✅ Таблица 'users' создана");

        // Таблица results с полем is_last
        await pool.query(`
            CREATE TABLE IF NOT EXISTS results (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                date TIMESTAMP NOT NULL,
                total_score INTEGER NOT NULL,
                regime INTEGER NOT NULL,
                fastfood INTEGER NOT NULL,
                concentration INTEGER NOT NULL,
                verdict VARCHAR(50) NOT NULL,
                is_mine BOOLEAN DEFAULT TRUE,
                is_last BOOLEAN DEFAULT FALSE
            )
        `);
        console.log("✅ Таблица 'results' создана (с is_last)");

        // Создаём админа
        const adminCheck = await pool.query(
            "SELECT id FROM users WHERE email = 'admin@school.ru'"
        );
        if (adminCheck.rows.length === 0) {
            const bcrypt = require("bcrypt");
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await pool.query(
                `INSERT INTO users (email, password_hash, name, role) 
                 VALUES ($1, $2, $3, $4)`,
                ["admin@school.ru", hashedPassword, "Администратор", "admin"]
            );
            console.log("✅ Администратор создан: admin@school.ru / admin123");
        }

        // Для старых записей проставляем is_last = TRUE
        await pool.query(`
            UPDATE results r1
            SET is_last = TRUE
            WHERE r1.id = (
                SELECT r2.id
                FROM results r2
                WHERE r2.user_id = r1.user_id
                ORDER BY r2.date DESC
                LIMIT 1
            )
        `);

        const test = await pool.query("SELECT NOW()");
        console.log("✅ Подключение к БД успешно!", test.rows[0].now);
    } catch (err) {
        console.error("❌ Ошибка инициализации БД:", err.message);
    }
}

initDb().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Сервер запущен: http://localhost:${port}`);
        console.log(`🔗 API: http://localhost:${port}/api/health`);
        console.log(`🔐 Авторизация: http://localhost:${port}/api/auth/login`);
    });
});
