// ============================================================
//  СТАТИСТИКА И ГРАФИКИ
// ============================================================

let chartInstances = [];

const Statistics = {
    destroyCharts: function() {
        chartInstances.forEach(c => {
            if (c && c.destroy) c.destroy();
        });
        chartInstances = [];
    },

    // ============================================================
    //  МОИ РЕЗУЛЬТАТЫ (доступно всем)
    // ============================================================

    renderMyResults: async function() {
        this.destroyCharts();

        const myResults = await Storage.getMyResults();
        const allResults = await Storage.getResults();
        const stats = await Storage.getStats();
        const catAvg = await Storage.getCategoryAverages();

        const content = document.getElementById('myresults-content');

        if (!myResults || myResults.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p><strong>У вас пока нет прохождений</strong></p>
                    <p>Пройдите опрос, чтобы увидеть свои личные результаты и прогресс!</p>
                </div>
            `;
            return;
        }

        const sorted = [...myResults].sort((a, b) => new Date(a.date) - new Date(b.date));
        const total = myResults.length;

        const myAvg = total > 0 ? (myResults.reduce((s, r) => s + (r.total_score || 0), 0) / total).toFixed(1) : '0';
        const myBest = total > 0 ? Math.max(...myResults.map(r => r.total_score || 0)) : 0;
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const progress = total > 1 ? last.total_score - first.total_score : 0;

        const myAvgRegime = total > 0 ? (myResults.reduce((s, r) => s + (r.regime || 0), 0) / total) : 0;
        const myAvgFastfood = total > 0 ? (myResults.reduce((s, r) => s + (r.fastfood || 0), 0) / total) : 0;
        const myAvgConcentration = total > 0 ? (myResults.reduce((s, r) => s + (r.concentration || 0), 0) / total) : 0;

        let progressMsg;
        if (total === 1) {
            progressMsg = `Это ваше первое прохождение. Пройдите опрос ещё раз, чтобы отследить динамику изменений!`;
        } else if (progress > 0) {
            progressMsg = `🎉 Отличный прогресс! Ваш результат улучшился на <strong>+${progress}</strong> баллов. Продолжайте в том же духе!`;
        } else if (progress < 0) {
            progressMsg = `📉 Ваш результат снизился на <strong>${progress}</strong> баллов. Возможно, стоит пересмотреть свои пищевые привычки.`;
        } else {
            progressMsg = `📊 Ваш результат стабилен — ${myAvg} баллов в среднем.`;
        }

        function diffHtml(mine, avg) {
            const diff = mine - avg;
            const sign = diff > 0 ? '+' : '';
            let cls = 'neutral';
            if (diff > 0.5) cls = 'positive';
            else if (diff < -0.5) cls = 'negative';
            return `<span class="diff ${cls}">${sign}${diff.toFixed(1)}</span>`;
        }

        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Прохождений</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">${myAvg}</div>
                    <div class="stat-label">Средний балл</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-value">${myBest}</div>
                    <div class="stat-label">Лучший</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">${progress >= 0 ? '📈' : '📉'}</div>
                    <div class="stat-value" style="color: ${progress >= 0 ? '#10b981' : '#ef4444'};">${progress >= 0 ? '+' : ''}${progress}</div>
                    <div class="stat-label">Прогресс</div>
                </div>
            </div>

            <div class="progress-summary">
                <h3>📊 Ваша динамика</h3>
                <p>${progressMsg}</p>
            </div>

            <div class="comparison-card">
                <h3>⚖️ Вы vs Среднее по всем</h3>
                <div class="comparison-row">
                    <span class="label">🎯 Общий балл</span>
                    <div class="values">
                        <span class="mine">${(+myAvg).toFixed(1)}</span>
                        <span class="avg">/ ${stats.avg ? stats.avg.toFixed(1) : '0'} среднее</span>
                        ${diffHtml(+myAvg, stats.avg || 0)}
                    </div>
                </div>
                <div class="comparison-row">
                    <span class="label">⏰ Режим</span>
                    <div class="values">
                        <span class="mine">${myAvgRegime.toFixed(1)}</span>
                        <span class="avg">/ ${catAvg.regime ? catAvg.regime.toFixed(1) : '0'} среднее</span>
                        ${diffHtml(myAvgRegime, catAvg.regime || 0)}
                    </div>
                </div>
                <div class="comparison-row">
                    <span class="label">🍔 Фастфуд</span>
                    <div class="values">
                        <span class="mine">${myAvgFastfood.toFixed(1)}</span>
                        <span class="avg">/ ${catAvg.fastfood ? catAvg.fastfood.toFixed(1) : '0'} среднее</span>
                        ${diffHtml(myAvgFastfood, catAvg.fastfood || 0)}
                    </div>
                </div>
                <div class="comparison-row">
                    <span class="label">🧠 Концентрация</span>
                    <div class="values">
                        <span class="mine">${myAvgConcentration.toFixed(1)}</span>
                        <span class="avg">/ ${catAvg.concentration ? catAvg.concentration.toFixed(1) : '0'} среднее</span>
                        ${diffHtml(myAvgConcentration, catAvg.concentration || 0)}
                    </div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-title">📈 Прогресс ваших результатов</div>
                <div class="chart-wrap"><canvas id="my-chart-progress"></canvas></div>
            </div>

            <div class="charts-row">
                <div class="chart-container">
                    <div class="chart-title">🎯 Ваши категории (среднее)</div>
                    <div class="chart-wrap-small"><canvas id="my-chart-radar"></canvas></div>
                </div>
                <div class="chart-container">
                    <div class="chart-title">🏅 Распределение ваших оценок</div>
                    <div class="chart-wrap-small"><canvas id="my-chart-pie"></canvas></div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-title">📋 История ваших прохождений</div>
                <div class="recent-list" id="my-recent-list"></div>
            </div>
        `;

        // ... графики (оставляем без изменений)
        // (код графиков здесь, он слишком большой, но он не меняется)
    },

    // ============================================================
    //  ОБЩАЯ СТАТИСТИКА (ТОЛЬКО ДЛЯ АДМИНА)
    // ============================================================

    renderStats: async function() {
        // ⭐ ТОЛЬКО ДЛЯ АДМИНА
        if (!Auth.isAdmin()) {
            alert('⛔ Доступ запрещён. Только для администратора.');
            return;
        }

        this.destroyCharts();

        const results = await Storage.getResults();
        const stats = await Storage.getStats();
        const catAvg = await Storage.getCategoryAverages();
        const verdicts = await Storage.getVerdictCounts();
        const daily = await Storage.getDailyCounts(14);

        const content = document.getElementById('stats-content');

        document.getElementById('stat-total').textContent = stats.total || 0;
        document.getElementById('stat-avg').textContent = stats.avg ? stats.avg.toFixed(1) : '0';
        document.getElementById('stat-best').textContent = stats.best || 0;
        document.getElementById('stat-today').textContent = stats.today || 0;

        if (!stats || stats.total === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p><strong>Пока нет данных</strong></p>
                    <p>Пройдите опрос первым, чтобы увидеть статистику!</p>
                </div>
            `;
            document.getElementById('clear-btn').style.display = 'none';
            return;
        }
        document.getElementById('clear-btn').style.display = 'inline-block';

        content.innerHTML = `
            <div class="chart-container">
                <div class="chart-title">📈 Прохождения по дням (последние 14 дней)</div>
                <div class="chart-wrap"><canvas id="chart-timeline"></canvas></div>
            </div>

            <div class="charts-row">
                <div class="chart-container">
                    <div class="chart-title">📊 Средние баллы по категориям</div>
                    <div class="chart-wrap-small"><canvas id="chart-categories"></canvas></div>
                </div>
                <div class="chart-container">
                    <div class="chart-title">🎯 Распределение результатов</div>
                    <div class="chart-wrap-small"><canvas id="chart-verdicts"></canvas></div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-title">🏅 Все прохождения</div>
                <div class="recent-list" id="recent-list"></div>
            </div>
        `;


        // (код графиков здесь)
    }
};

window.Statistics = Statistics;

window.showMyResults = async function() {
    UI.showScreen('myresults-screen');
    await Statistics.renderMyResults();
};

window.showStats = async function() {
    UI.showScreen('stats-screen');
    await Statistics.renderStats();
};
