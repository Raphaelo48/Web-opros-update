// ============================================================
//  ХРАНИЛИЩЕ ДАННЫХ (API → PostgreSQL)
// ============================================================

const API_URL = window.location.origin + '/api';

const Storage = {
    getResults: async function() {
        try {
            const headers = Session.getAuthHeader();
            const response = await fetch(`${API_URL}/results`, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('❌ Ошибка чтения из БД:', e.message);
            return [];
        }
    },

    getMyResults: async function() {
        try {
            const headers = Session.getAuthHeader();
            const response = await fetch(`${API_URL}/results/mine`, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('❌ Ошибка чтения:', e.message);
            return [];
        }
    },

    saveResult: async function(result) {
        try {
            console.log('📤 Отправка результата в БД:', result);
            const headers = {
                'Content-Type': 'application/json',
                ...Session.getAuthHeader()
            };
            const response = await fetch(`${API_URL}/results`, {
                method: 'POST',
                headers,
                body: JSON.stringify(result)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            console.log('✅ Сохранено в БД:', data);
            return data;
        } catch (e) {
            console.error('❌ Ошибка сохранения в БД:', e.message);
            throw e;
        }
    },

    clearResults: async function() {
        try {
            const headers = Session.getAuthHeader();
            await fetch(`${API_URL}/results`, { method: 'DELETE', headers });
            console.log('🗑 Данные в БД очищены');
        } catch (e) {
            console.error('❌ Ошибка очистки БД:', e.message);
        }
    },

    getStats: async function() {
        try {
            const headers = Session.getAuthHeader();
            const response = await fetch(`${API_URL}/stats`, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('❌ Ошибка получения статистики:', e.message);
            return { total: 0, avg: 0, best: 0, today: 0 };
        }
    },

    getCategoryAverages: async function() {
        try {
            const headers = Session.getAuthHeader();
            const response = await fetch(`${API_URL}/category-averages`, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('❌ Ошибка:', e.message);
            return { regime: 0, fastfood: 0, concentration: 0 };
        }
    },

    getVerdictCounts: async function() {
        try {
            const headers = Session.getAuthHeader();
            const response = await fetch(`${API_URL}/verdict-counts`, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('❌ Ошибка:', e.message);
            return { excellent: 0, good: 0, average: 0, poor: 0 };
        }
    },

    getDailyCounts: async function(days = 14) {
        try {
            const headers = Session.getAuthHeader();
            const response = await fetch(`${API_URL}/daily-counts`, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            const now = new Date();
            const dates = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                dates.push(d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
            }

            const counts = data.map(d => ({
                date: new Date(d.day).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                count: parseInt(d.count)
            }));

            return dates.map(date => {
                const found = counts.find(c => c.date === date);
                return { date, count: found ? found.count : 0 };
            });
        } catch (e) {
            console.error('❌ Ошибка:', e.message);
            return [];
        }
    }
};

window.Storage = Storage;