// ============================================================
//  ПОДСЧЁТ РЕЗУЛЬТАТОВ
// ============================================================

const Results = {
    // Категории и их максимальные баллы
    categories: {
        "Режим": { max: 16, emoji: "⏰" },
        "Фастфуд": { max: 12, emoji: "🍔" },
        "Концентрация": { max: 12, emoji: "🧠" }
    },
    
    // Вычислить результаты на основе ответов
    calculate: function(answers) {
        const scores = {
            "Режим": 0,
            "Фастфуд": 0,
            "Концентрация": 0
        };
        
        window.questions.forEach((q, i) => {
            const selected = answers[i];
            if (selected !== null && q.options[selected]) {
                scores[q.category] += q.options[selected].score;
            }
        });
        
        const totalScore = Object.values(scores).reduce((s, c) => s + c, 0);
        const ratio = totalScore / 40;
        
        let verdict, verdictKey;
        if (ratio >= 0.8) {
            verdict = '🌟 Отличный результат!';
            verdictKey = 'excellent';
        } else if (ratio >= 0.6) {
            verdict = '👍 Хороший результат';
            verdictKey = 'good';
        } else if (ratio >= 0.4) {
            verdict = '⚠️ Средний результат';
            verdictKey = 'average';
        } else {
            verdict = '🚨 Требуется внимание';
            verdictKey = 'poor';
        }
        
        return {
            scores: scores,
            totalScore: totalScore,
            ratio: ratio,
            verdict: verdict,
            verdictKey: verdictKey,
            maxScore: 40
        };
    },
    
    // Получить рекомендации на основе результатов
    getRecommendations: function(scores) {
        const recs = [];
        const regimeRatio = scores["Режим"] / this.categories["Режим"].max;
        const fastfoodRatio = scores["Фастфуд"] / this.categories["Фастфуд"].max;
        const concentrationRatio = scores["Концентрация"] / this.categories["Концентрация"].max;
        
        if (regimeRatio < 0.7) {
            recs.push("Завтракайте в течение часа после пробуждения — это запускает метаболизм и улучшает работу мозга.");
            recs.push("Ешьте 3–4 раза в день в одно и то же время для стабильного уровня энергии.");
        }
        if (fastfoodRatio < 0.7) {
            recs.push("Замените чипсы и снеки на орехи, фрукты или йогурт — они дают долгую энергию.");
            recs.push("Готовьте дома простые блюда на несколько дней вперёд, чтобы не покупать фастфуд.");
        }
        if (concentrationRatio < 0.7) {
            recs.push("Пейте достаточно воды — обезвоживание снижает концентрацию на 10–15%.");
            recs.push("Добавьте в рацион рыбу, орехи, ягоды и тёмный шоколад — они улучшают работу мозга.");
            recs.push("Избегайте тяжёлой пищи перед учёбой — выбирайте лёгкие белковые блюда.");
        }
        if (recs.length === 0) {
            recs.push("Продолжайте поддерживать свои отличные пищевые привычки!");
            recs.push("Делитесь опытом с друзьями — здоровое питание заразительно.");
        }
        return recs;
    },
    
    // Получить советы по категориям
    getCategoryTips: function(name, ratio) {
        const tips = {
            "Режим": {
                good: "Вы поддерживаете стабильный режим питания — это отличная основа для продуктивной учёбы.",
                mid: "Попробуйте установить фиксированное время для приёмов пищи — это стабилизирует уровень энергии.",
                bad: "Нерегулярное питание вызывает скачки сахара в крови и снижает концентрацию. Начните с завтрака!"
            },
            "Фастфуд": {
                good: "Вы редко употребляете фастфуд — ваш мозг получает качественные питательные вещества.",
                mid: "Сократите фастфуд до 1 раза в неделю, заменив снеки фруктами и орехами.",
                bad: "Избыток фастфуда ухудшает когнитивные функции. Постепенно заменяйте вредные перекусы полезными."
            },
            "Концентрация": {
                good: "Ваше питание положительно влияет на концентрацию и успеваемость.",
                mid: "Обратите внимание, какие продукты вызывают у вас сонливость — исключите их перед учёбой.",
                bad: "Связь между питанием и концентрацией очевидна. Пересмотрите рацион — это улучшит результаты."
            }
        };
        
        if (ratio >= 0.75) return tips[name].good;
        if (ratio >= 0.45) return tips[name].mid;
        return tips[name].bad;
    },
    
    // Получить цвет для категории
    getCategoryColor: function(ratio) {
        if (ratio >= 0.75) return '#10b981';
        if (ratio >= 0.45) return '#f59e0b';
        return '#ef4444';
    },
    
    // Получить фоновый цвет для категории
    getCategoryBg: function(ratio) {
        if (ratio >= 0.75) return '#d1fae5';
        if (ratio >= 0.45) return '#fef3c7';
        return '#fee2e2';
    }
};

window.Results = Results;