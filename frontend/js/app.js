// ============================================================
//  ЗАПУСК ПРИЛОЖЕНИЯ
// ============================================================

const QuizApp = {
    currentQuestion: 0,
    answers: new Array(window.questions.length).fill(null),

    reset: function() {
        this.currentQuestion = 0;
        this.answers.fill(null);
    },

    renderQuestion: function() {
        const q = window.questions[this.currentQuestion];
        document.getElementById('q-category').textContent = q.emoji + ' ' + q.category;
        document.getElementById('q-text').textContent = q.text;

        const optionsContainer = document.getElementById('q-options');
        optionsContainer.innerHTML = '';

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option' + (this.answers[this.currentQuestion] === idx ? ' selected' : '');
            btn.innerHTML = `<span class="option-marker">${String.fromCharCode(65 + idx)}</span><span>${opt.text}</span>`;
            btn.onclick = () => this.selectOption(idx);
            optionsContainer.appendChild(btn);
        });

        const percent = Math.round((this.currentQuestion / window.questions.length) * 100);
        document.getElementById('progress-fill').style.width = percent + '%';
        document.getElementById('progress-text').textContent = `Вопрос ${this.currentQuestion + 1} из ${window.questions.length}`;
        document.getElementById('progress-percent').textContent = percent + '%';

        document.getElementById('prev-btn').style.visibility = this.currentQuestion === 0 ? 'hidden' : 'visible';
        const nextBtn = document.getElementById('next-btn');
        nextBtn.textContent = this.currentQuestion === window.questions.length - 1 ? 'Показать результаты' : 'Далее →';
        nextBtn.disabled = this.answers[this.currentQuestion] === null;
    },

    selectOption: function(idx) {
        this.answers[this.currentQuestion] = idx;
        document.querySelectorAll('.option').forEach((el, i) => {
            el.classList.toggle('selected', i === idx);
        });
        document.getElementById('next-btn').disabled = false;
    },

    nextQuestion: function() {
        if (this.answers[this.currentQuestion] === null) return;
        if (this.currentQuestion < window.questions.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
        } else {
            this.showFinalResults();
        }
    },

    prevQuestion: function() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
        }
    },

    showFinalResults: async function() {
        const result = Results.calculate(this.answers);
        const scores = result.scores;

        const gradient = result.ratio >= 0.8 ? 'linear-gradient(135deg, #10b981, #059669)' :
                         result.ratio >= 0.6 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                         result.ratio >= 0.4 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                         'linear-gradient(135deg, #ef4444, #dc2626)';

        document.getElementById('score-circle').style.background = gradient;
        document.getElementById('score-value').textContent = result.totalScore;
        document.getElementById('verdict').textContent = result.verdict;
        document.getElementById('verdict-desc').textContent =
            result.ratio >= 0.8 ? 'Ваш рацион способствует высокой успеваемости и концентрации.' :
            result.ratio >= 0.6 ? 'У вас есть здоровые привычки, но есть куда расти.' :
            result.ratio >= 0.4 ? 'Ваше питание может негативно влиять на учёбу. Пора что-то менять!' :
            'Ваши пищевые привычки серьёзно снижают продуктивность.';

        const catContainer = document.getElementById('category-results');
        catContainer.innerHTML = '';

        Object.entries(scores).forEach(([name, score]) => {
            const max = Results.categories[name].max;
            const ratio = score / max;
            const emoji = Results.categories[name].emoji;
            const color = Results.getCategoryColor(ratio);
            const bg = Results.getCategoryBg(ratio);
            const tip = Results.getCategoryTips(name, ratio);

            const div = document.createElement('div');
            div.className = 'category-result';
            div.style.borderLeftColor = color;
            div.innerHTML = `
                <div class="category-result-header">
                    <div class="category-title">${emoji} ${name}</div>
                    <div class="category-score" style="color: ${color}; background: ${bg};">${score}/${max}</div>
                </div>
                <div class="category-bar">
                    <div class="category-bar-fill" style="width: 0%; background: ${color};"></div>
                </div>
                <div class="category-tip">${tip}</div>
            `;
            catContainer.appendChild(div);
            setTimeout(() => {
                div.querySelector('.category-bar-fill').style.width = (ratio * 100) + '%';
            }, 200);
        });

        const recs = Results.getRecommendations(scores);
        document.getElementById('recommendations-list').innerHTML = recs.map(r => `<li>${r}</li>`).join('');

        const resultData = {
            date: new Date().toISOString(),
            totalScore: result.totalScore,
            regime: scores["Режим"],
            fastfood: scores["Фастфуд"],
            concentration: scores["Концентрация"],
            verdict: result.verdictKey,
            isMine: true
        };

        try {
            await Storage.saveResult(resultData);
            await UI.updateBadge();
        } catch (e) {
            console.error('❌ Ошибка сохранения:', e);
        }

        UI.showScreen('results-screen');
    }
};

// ============================================================
//  ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================================

window.startQuiz = function() {
    QuizApp.reset();
    UI.showScreen('quiz-screen');
    QuizApp.renderQuestion();
};

window.nextQuestion = function() {
    QuizApp.nextQuestion();
};

window.prevQuestion = function() {
    QuizApp.prevQuestion();
};

window.restartQuiz = function() {
    QuizApp.reset();
    UI.goHome();
};

window.logout = function() {
    Auth.logout();
};

window.clearStats = async function() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ данные (включая ваши результаты)?')) {
        try {
            await Storage.clearResults();
            await UI.updateBadge();
            if (document.getElementById('stats-screen').classList.contains('active')) {
                await Statistics.renderStats();
            }
            if (document.getElementById('myresults-screen').classList.contains('active')) {
                await Statistics.renderMyResults();
            }
        } catch (e) {
            console.error('❌ Ошибка очистки:', e);
        }
    }
};

window.QuizApp = QuizApp;

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации
    if (!Session.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Показать пользователя
    const user = Session.getUser();
    if (user) {
        const badge = document.getElementById('user-badge');
        const emailEl = document.getElementById('user-email');
        const roleEl = document.getElementById('user-role');
        if (badge) badge.style.display = 'flex';
        if (emailEl) emailEl.textContent = user.email;
        if (roleEl) {
            roleEl.textContent = user.role === 'admin' ? 'Админ' : 'Ученик';
            if (user.role === 'admin') {
                roleEl.style.background = '#ef4444';
            }
        }
    }

    UI.updateBadge();
    console.log('🚀 Приложение запущено!');
});