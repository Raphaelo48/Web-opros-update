// ============================================================
//  УПРАВЛЕНИЕ ЭКРАНАМИ
// ============================================================

const UI = {
    // Переключить экран по ID
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
    
    // ============================================================
    //  ⭐ ИСПРАВЛЕНО: Обновить счётчик на главной (async/await)
    // ============================================================
    
    updateBadge: async function() {  // ← добавили async
        const badge = document.getElementById('total-passed-badge');
        if (badge) {
            try {
                const results = await Storage.getResults();  // ← добавили await
                badge.textContent = results.length;
            } catch (e) {
                console.error('❌ Ошибка обновления бейджа:', e);
                badge.textContent = '0';
            }
        }
    },
    
    // ============================================================
    //  ⭐ ИСПРАВЛЕНО: Перейти на главную (с await)
    // ============================================================
    
    goHome: async function() {  // ← добавили async
        this.showScreen('start-screen');
        await this.updateBadge();  // ← добавили await
    },
    
    // Начать опрос
    startQuiz: function() {
        if (window.QuizApp) {
            window.QuizApp.reset();
        }
        this.showScreen('quiz-screen');
        if (window.QuizApp) {
            window.QuizApp.renderQuestion();
        }
    },
    
    // ============================================================
    //  ⭐ ИСПРАВЛЕНО: Показать мои результаты (с await)
    // ============================================================
    
    showMyResults: async function() {  // ← добавили async
        this.showScreen('myresults-screen');
        if (window.Statistics) {
            await window.Statistics.renderMyResults();  // ← добавили await
        } else {
            console.error('❌ Statistics не загружен!');
        }
    },
    
    // ============================================================
    //  ⭐ ИСПРАВЛЕНО: Показать статистику (с await)
    // ============================================================
    
    showStats: async function() {  // ← добавили async
        this.showScreen('stats-screen');
        if (window.Statistics) {
            await window.Statistics.renderStats();  // ← добавили await
        } else {
            console.error('❌ Statistics не загружен!');
        }
    }
};

// ============================================================
//  ⭐ ИСПРАВЛЕНО: ГЛОБАЛЬНЫЕ ФУНКЦИИ (с async/await)
// ============================================================

// Основные навигационные функции
window.showScreen = function(id) { UI.showScreen(id); };

// ⭐ Обновлённый updateBadge (асинхронный)
window.updateBadge = async function() { 
    await UI.updateBadge(); 
};

// ⭐ Обновлённый backToStart (асинхронный)
window.backToStart = async function() { 
    await UI.goHome(); 
};

window.startQuiz = function() { 
    UI.startQuiz(); 
};

// ============================================================
//  ⭐ ИСПРАВЛЕНО: Функции для статистики (с async/await)
// ============================================================

window.showMyResults = async function() {
    UI.showScreen('myresults-screen');
    if (window.Statistics) {
        await window.Statistics.renderMyResults();
    } else {
        console.error('❌ Statistics не загружен!');
    }
};

window.showStats = async function() {
    UI.showScreen('stats-screen');
    if (window.Statistics) {
        await window.Statistics.renderStats();
    } else {
        console.error('❌ Statistics не загружен!');
    }
};

// Делаем UI глобальным
window.UI = UI;

console.log('🖥️ UI module loaded!');
