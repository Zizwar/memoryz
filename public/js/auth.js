// MemoryZ Dashboard - Auth Module
window.MZ = window.MZ || {};

MZ.auth = {
  authToken: localStorage.getItem('mz_token') || '',
  currentUser: null,
  authMode: 'login',
  authForm: { username: '', identifier: '', password: '', apiKey: '' },

  openAuthModal(mode = 'login') {
    this.authMode = mode;
    this.modals.auth = true;
  },

  async fetchMe() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + this.authToken }
      });
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
      } else {
        this.logout();
      }
    } catch (_e) {}
  },

  async submitAuth() {
    if (this.authMode === 'key') {
      const key = (this.authForm.apiKey || '').trim();
      if (!key) return;
      this.authToken = key;
      await this.fetchMe();
      if (this.currentUser) {
        localStorage.setItem('mz_token', key);
        this.modals.auth = false;
        this.showToast((MZ.i18n.t('welcome') || 'مرحباً بك ') + this.currentUser.username + ' 👋');
        this.loadMemories();
        this.loadTasks();
        this.loadVaultKeys();
      } else {
        this.authToken = '';
        localStorage.removeItem('mz_token');
        alert(MZ.i18n.currentLang === 'ar' ? 'مفتاح API غير صالح أو غير موجود' : 'Invalid or missing API key');
      }
      return;
    }

    const endpoint = this.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = this.authMode === 'register'
      ? { username: this.authForm.username, email: this.authForm.identifier, password: this.authForm.password }
      : { identifier: this.authForm.identifier, password: this.authForm.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        this.authToken = data.token;
        this.currentUser = data.user;
        localStorage.setItem('mz_token', this.authToken);
        this.modals.auth = false;
        this.showToast((MZ.i18n.t('welcome') || 'مرحباً بك ') + this.currentUser.username + ' 👋');
        this.loadMemories();
        this.loadTasks();
      } else {
        alert(data.error || (MZ.i18n.currentLang === 'ar' ? 'فشلت عملية المصادقة' : 'Authentication failed'));
      }
    } catch (err) {
      alert(err.message);
    }
  },

  logout() {
    this.authToken = '';
    this.currentUser = null;
    localStorage.removeItem('mz_token');
    this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم تسجيل الخروج' : 'Signed out successfully');
  }
};
