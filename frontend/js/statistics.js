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

        const labels = sorted.map((r, i) => `#${i + 1}`);
        const data = sorted.map(r => r.total_score || 0);
        const ctx1 = document.getElementById('my-chart-progress').getContext('2d');
        const gradient1 = ctx1.createLinearGradient(0, 0, 0, 260);
        gradient1.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        gradient1.addColorStop(1, 'rgba(245, 158, 11, 0)');

        chartInstances.push(new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ваш балл',
                        data: data,
                        borderColor: '#f59e0b',
                        backgroundColor: gradient1,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Среднее по всем',
                        data: new Array(sorted.length).fill(stats.avg || 0),
                        borderColor: '#94a3b8',
                        borderDash: [6, 4],
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
                scales: {
                    y: { beginAtZero: true, max: 40, ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
                    x: { ticks: { color: '#64748b' }, grid: { display: false } }
                }
            }
        }));

        const ctx2 = document.getElementById('my-chart-radar').getContext('2d');
        chartInstances.push(new Chart(ctx2, {
            type: 'radar',
            data: {
                labels: ['⏰ Режим', '🍔 Фастфуд', '🧠 Концентрация'],
                datasets: [
                    {
                        label: 'Вы',
                        data: [
                            (myAvgRegime / 16) * 100,
                            (myAvgFastfood / 12) * 100,
                            (myAvgConcentration / 12) * 100
                        ],
                        backgroundColor: 'rgba(245, 158, 11, 0.25)',
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        pointBackgroundColor: '#f59e0b',
                        pointRadius: 4
                    },
                    {
                        label: 'Среднее',
                        data: [
                            (catAvg.regime || 0) / 16 * 100,
                            (catAvg.fastfood || 0) / 12 * 100,
                            (catAvg.concentration || 0) / 12 * 100
                        ],
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointBackgroundColor: '#6366f1',
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { display: false, stepSize: 25 },
                        grid: { color: '#e2e8f0' },
                        pointLabels: { font: { size: 12, weight: '600' }, color: '#1e293b' }
                    }
                }
            }
        }));

        const myVerdicts = {
            excellent: myResults.filter(r => r.verdict === 'excellent').length,
            good: myResults.filter(r => r.verdict === 'good').length,
            average: myResults.filter(r => r.verdict === 'average').length,
            poor: myResults.filter(r => r.verdict === 'poor').length
        };

        const ctx3 = document.getElementById('my-chart-pie').getContext('2d');
        chartInstances.push(new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['🌟 Отлично', '👍 Хорошо', '⚠️ Средне', '🚨 Плохо'],
                datasets: [{
                    data: [myVerdicts.excellent, myVerdicts.good, myVerdicts.average, myVerdicts.poor],
                    backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444'],
                    borderColor: '#fff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } },
                cutout: '60%'
            }
        }));

        const list = document.getElementById('my-recent-list');
        const reversedSorted = [...myResults].sort((a, b) => new Date(b.date) - new Date(a.date));
        list.innerHTML = reversedSorted.map((r, idx) => {
            const d = new Date(r.date);
            const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const ratio = (r.total_score || 0) / 40;
            let color, bg;
            if (ratio >= 0.8) { color = '#059669'; bg = '#d1fae5'; }
            else if (ratio >= 0.6) { color = '#4f46e5'; bg = '#e0e7ff'; }
            else if (ratio >= 0.4) { color = '#d97706'; bg = '#fef3c7'; }
            else { color = '#dc2626'; bg = '#fee2e2'; }
            return `
                <div class="recent-item">
                    <div class="ri-left">
                        <span class="ri-date">📅 ${dateStr}</span>
                        <span class="ri-cats">⏰${r.regime || 0} · 🍔${r.fastfood || 0} · 🧠${r.concentration || 0}</span>
                    </div>
                    <span class="ri-score" style="color: ${color}; background: ${bg};">Попытка #${reversedSorted.length - idx} · ${r.total_score || 0}/40</span>
                </div>
            `;
        }).join('');
    },

    renderStats: async function() {
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

        const ctx1 = document.getElementById('chart-timeline').getContext('2d');
        const gradient1 = ctx1.createLinearGradient(0, 0, 0, 260);
        gradient1.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient1.addColorStop(1, 'rgba(99, 102, 241, 0)');

        chartInstances.push(new Chart(ctx1, {
            type: 'line',
            data: {
                labels: daily.map(d => d.date || ''),
                datasets: [{
                    label: 'Прохождений',
                    data: daily.map(d => d.count || 0),
                    borderColor: '#6366f1',
                    backgroundColor: gradient1,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: '#64748b' }, grid: { color: '#e2e8f0' } },
                    x: { ticks: { color: '#64748b', maxRotation: 45 }, grid: { display: false } }
                }
            }
        }));

        const ctx2 = document.getElementById('chart-categories').getContext('2d');
        chartInstances.push(new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['⏰ Режим', '🍔 Фастфуд', '🧠 Концентрация'],
                datasets: [{
                    label: 'Средний балл',
                    data: [catAvg.regime || 0, catAvg.fastfood || 0, catAvg.concentration || 0],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ],
                    borderColor: ['#6366f1', '#f59e0b', '#10b981'],
                    borderWidth: 2,
                    borderRadius: 8
                }, {
                    label: 'Максимум',
                    data: [16, 12, 12],
                    backgroundColor: 'rgba(226, 232, 240, 0.5)',
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#64748b' }, grid: { color: '#e2e8f0' } },
                    x: { ticks: { color: '#64748b' }, grid: { display: false } }
                }
            }
        }));

        const ctx3 = document.getElementById('chart-verdicts').getContext('2d');
        chartInstances.push(new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['🌟 Отлично', '👍 Хорошо', '⚠️ Средне', '🚨 Плохо'],
                datasets: [{
                    data: [verdicts.excellent || 0, verdicts.good || 0, verdicts.average || 0, verdicts.poor || 0],
                    backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444'],
                    borderColor: '#fff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } },
                cutout: '60%'
            }
        }));

        const list = document.getElementById('recent-list');
        const sorted = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
        list.innerHTML = sorted.map(r => {
            const d = new Date(r.date);
            const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) + ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const ratio = (r.total_score || 0) / 40;
            let color, bg;
            if (ratio >= 0.8) { color = '#059669'; bg = '#d1fae5'; }
            else if (ratio >= 0.6) { color = '#4f46e5'; bg = '#e0e7ff'; }
            else if (ratio >= 0.4) { color = '#d97706'; bg = '#fef3c7'; }
            else { color = '#dc2626'; bg = '#fee2e2'; }
            const mineBadge = r.is_mine ? '<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-left:6px;">ВЫ</span>' : '';
            return `
                <div class="recent-item">
                    <div class="ri-left">
                        <span class="ri-date">📅 ${dateStr}${mineBadge}</span>
                        <span class="ri-cats">⏰${r.regime || 0} · 🍔${r.fastfood || 0} · 🧠${r.concentration || 0}</span>
                    </div>
                    <span class="ri-score" style="color: ${color}; background: ${bg};">${r.total_score || 0}/40</span>
                </div>
            `;
        }).join('');
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