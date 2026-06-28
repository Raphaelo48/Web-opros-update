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

    // ============================================================
    //  ⭐ ПОКАЗАТЬ/СКРЫТЬ ЭЛЕМЕНТЫ В ЗАВИСИМОСТИ ОТ РОЛИ
    // ============================================================

    updateUIForRole: function() {
        const user = Auth.getCurrentUser();
        const isAdmin = user && user.role === 'admin';
        
        console.log('👤 updateUIForRole — пользователь:', user ? user.email : 'не авторизован');
        console.log('👑 isAdmin:', isAdmin);
        
        // 1. Бейдж "Опрос прошли" (контейнер)
        const statsBadge = document.getElementById('admin-only-stats');
        if (statsBadge) {
            statsBadge.style.display = isAdmin ? 'block' : 'none';
            console.log('📊 Бейдж статистики:', isAdmin ? 'ПОКАЗАН' : 'СКРЫТ');
        } else {
            console.warn('⚠️ Элемент #admin-only-stats не найден в HTML');
        }
        
        // 2. Кнопка "Общая статистика" на главной
        const statsBtn = document.getElementById('admin-only-stats-btn');
        if (statsBtn) {
            statsBtn.style.display = isAdmin ? 'block' : 'none';
            console.log('🔘 Кнопка статистики (главная):', isAdmin ? 'ПОКАЗАНА' : 'СКРЫТА');
        } else {
            console.warn('⚠️ Элемент #admin-only-stats-btn не найден в HTML');
        }
        
        // 3. Кнопка "Статистика" на экране результатов
        const statsBtnResults = document.getElementById('admin-only-stats-btn-results');
        if (statsBtnResults) {
            statsBtnResults.style.display = isAdmin ? 'block' : 'none';
            console.log('🔘 Кнопка статистики (результаты):', isAdmin ? 'ПОКАЗАНА' : 'СКРЫТА');
        } else {
            console.warn('⚠️ Элемент #admin-only-stats-btn-results не найден в HTML');
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
