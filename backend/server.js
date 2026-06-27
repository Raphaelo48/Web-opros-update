const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// ============================================================
//  MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ============================================================
//  ПОДКЛЮЧЕНИЕ К POSTGRESQL
// ============================================================

// БЕРЁМ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ (Railway Variables)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ============================================================
//  API ENDPOINTS
// ============================================================

// 1. Получить все результаты
app.get("/api/results", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM results ORDER BY date DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("❌ GET /api/results:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Получить только "мои" результаты
app.get("/api/results/mine", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM results WHERE is_mine = true ORDER BY date DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("❌ GET /api/results/mine:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Сохранить новый результат
app.post("/api/results", async (req, res) => {
    const { date, totalScore, regime, fastfood, concentration, verdict, isMine } = req.body;

    // Валидация
    if (!date || totalScore === undefined || totalScore < 0 || totalScore > 40) {
        return res.status(400).json({ error: "Invalid data" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO results 
             (date, total_score, regime, fastfood, concentration, verdict, is_mine) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [date, totalScore, regime, fastfood, concentration, verdict, isMine !== undefined ? isMine : true]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("❌ POST /api/results:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Очистить все данные
app.delete("/api/results", async (req, res) => {
    try {
        await pool.query("DELETE FROM results");
        res.json({ message: "All data cleared" });
    } catch (err) {
        console.error("❌ DELETE /api/results:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 5. Получить статистику
app.get("/api/stats", async (req, res) => {
    try {
        const totalResult = await pool.query("SELECT COUNT(*) as total FROM results");
        const avgResult = await pool.query("SELECT AVG(total_score) as avg FROM results");
        const bestResult = await pool.query("SELECT MAX(total_score) as best FROM results");
        const todayResult = await pool.query(
            `SELECT COUNT(*) as today FROM results 
             WHERE DATE(date) = CURRENT_DATE`
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

// 6. Получить средние по категориям
app.get("/api/category-averages", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                AVG(regime) as regime,
                AVG(fastfood) as fastfood,
                AVG(concentration) as concentration
             FROM results`
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

// 7. Получить количество по вердиктам
app.get("/api/verdict-counts", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT verdict, COUNT(*) as count 
             FROM results 
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

// 8. Получить ежедневную статистику
app.get("/api/daily-counts", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                DATE(date) as day,
                COUNT(*) as count
             FROM results
             WHERE date >= CURRENT_DATE - INTERVAL '13 days'
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
//  СОЗДАНИЕ ТАБЛИЦЫ ПРИ СТАРТЕ
// ============================================================

async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS results (
                id SERIAL PRIMARY KEY,
                date TIMESTAMP NOT NULL,
                total_score INTEGER NOT NULL,
                regime INTEGER NOT NULL,
                fastfood INTEGER NOT NULL,
                concentration INTEGER NOT NULL,
                verdict VARCHAR(50) NOT NULL,
                is_mine BOOLEAN DEFAULT TRUE
            )
        `);
        console.log("✅ Таблица 'results' создана (или уже существует)");

        const test = await pool.query("SELECT NOW()");
        console.log("✅ Подключение к БД успешно!", test.rows[0].now);
    } catch (err) {
        console.error("❌ Ошибка инициализации БД:", err.message);
    }
}

// ============================================================
//  ЗАПУСК СЕРВЕРА
// ============================================================

initDb().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Сервер запущен: http://localhost:${port}`);
        console.log(`🔗 API доступен: http://localhost:${port}/api/results`);
    });
});
