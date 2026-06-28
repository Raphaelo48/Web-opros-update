// ============================================================
//  УПРАВЛЕНИЕ СЕССИЕЙ (токен в localStorage)
// ============================================================

const Session = {
    getToken: function() {
        return localStorage.getItem('token');
    },

    getUser: function() {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            return null;
        }
    },

    isAuthenticated: function() {
        return !!this.getToken();
    },

    save: function(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    clear: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getAuthHeader: function() {
        const token = this.getToken();
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }
};

window.Session = Session;