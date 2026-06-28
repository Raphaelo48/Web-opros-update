// ============================================================
//  УПРАВЛЕНИЕ ЭКРАНАМИ
// ============================================================

const UI = {
    showScreen: function(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) {
            target.classList.add('active');
            console.log('✅ Показан экран:', id);
        } else {
            console.error('❌ Экран не найден:', id);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateBadge: async function() {
        const badge = document.getElementById('total-passed-badge');
        if (badge) {
            try {
                // Только админ видит общее количество
                if (Auth.isAdmin()) {
                    const results = await Storage.getResults();
                    badge.textContent = results.length;
                } else {
                    // Обычным пользователям показываем только их количество
                    const myResults = await Storage.getMyResults();
                    badge.textContent = myResults.length;
                }
            } catch (e) {
                badge.textContent = '0';
            }
        }
    },

    goHome: function() {
        this.showScreen('start-screen');
        this.updateBadge();
    },

    startQuiz: function() {
        if (window.QuizApp) {
            window.QuizApp.reset();
        }
        this.showScreen('quiz-screen');
        if (window.QuizApp) {
            window.QuizApp.renderQuestion();
        }
    },

    showMyResults: async function() {
        this.showScreen('myresults-screen');
        if (window.Statistics) {
            await window.Statistics.renderMyResults();
        }
    },

    showStats: async function() {
        // ⭐ Проверка прав: только админ может смотреть статистику
        if (!Auth.isAdmin()) {
            alert('⛔ Доступ запрещён. Только для администратора.');
            return;
        }
        this.showScreen('stats-screen');
        if (window.Statistics) {
            await window.Statistics.renderStats();
        }
    },

    // ⭐ Показать/скрыть кнопки в зависимости от роли
    updateUIForRole: function() {
        const user = Auth.getCurrentUser();
        const isAdmin = user && user.role === 'admin';
        
        // Кнопка статистики (только для админа)
        const statsBtn = document.getElementById('admin-only-stats');
        if (statsBtn) {
            statsBtn.style.display = isAdmin ? 'block' : 'none';
        }

        // Бейдж с общим количеством (только для админа)
        const badge = document.getElementById('total-passed-badge');
        if (badge) {
            badge.style.display = isAdmin ? 'inline' : 'none';
        }
    }
};

window.UI = UI;

window.showMyResults = async function() {
    await UI.showMyResults();
};

window.showStats = async function() {
    await UI.showStats();
};

window.backToStart = function() {
    UI.goHome();
};
