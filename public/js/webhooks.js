// MemoryZ Dashboard - Webhooks Module
window.MZ = window.MZ || {};

MZ.webhooks = {
  webhooks: [],
  webhooksCount: 0,
  loadingWebhooks: false,
  formWebhook: { url: '', secret: '', events: 'task.*,memory.*', namespace: 'vibzcode' },

  async loadWebhooks() {
    this.loadingWebhooks = true;
    try {
      const nsParam = this.currentNamespace !== 'all' ? '?namespace=' + encodeURIComponent(this.currentNamespace) : '';
      const res = await fetch('/api/webhooks' + nsParam, {
        headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
      });
      if (res.ok) {
        const data = await res.json();
        this.webhooks = data.webhooks || [];
        this.webhooksCount = this.webhooks.length;
      }
    } catch (_e) {}
    this.loadingWebhooks = false;
  },

  openWebhookModal() {
    this.formWebhook = {
      url: '',
      secret: '',
      events: 'task.*,memory.*',
      namespace: this.currentNamespace !== 'all' ? this.currentNamespace : 'vibzcode'
    };
    this.modals.webhook = true;
  },

  async saveWebhook() {
    if (!this.authToken) return this.openAuthModal();
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify(this.formWebhook)
      });
      if (res.ok) {
        this.modals.webhook = false;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم تسجيل الويبهوك بنجاح 📡' : 'Webhook registered successfully 📡');
        this.loadWebhooks();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save webhook');
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async deleteWebhook(id) {
    const confirmMsg = MZ.i18n.currentLang === 'ar' ? 'هل تريد إلغاء اشتراك هذا الويبهوك؟' : 'Are you sure you want to delete this webhook?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch('/api/webhooks/' + id, {
        method: 'DELETE',
        headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حذف الويبهوك' : 'Webhook deleted');
        this.loadWebhooks();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete webhook');
      }
    } catch (err) {
      alert(err.message);
    }
  }
};
