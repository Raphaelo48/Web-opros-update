// ============================================================
//  АВТОРИЗАЦИЯ (вход, регистрация, выход)
// ============================================================

const Auth = {
    API_URL: window.location.origin + '/api',

    login: async function(email, password) {
        const response = await fetch(`${this.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка входа');
        }
        Session.save(data.token, data.user);
        return data;
    },

    register: async function(email, password) {
        const response = await fetch(`${this.API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации');
        }
        return data;
    },

    logout: function() {
        Session.clear();
        window.location.href = '/login.html';
    },

    getCurrentUser: function() {
        return Session.getUser();
    },

    isAdmin: function() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
};

window.Auth = Auth;