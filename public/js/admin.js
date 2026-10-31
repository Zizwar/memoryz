// MemoryZ Dashboard - Admin Control Plane Module
window.MZ = window.MZ || {};

MZ.admin = {
  adminStats: {},
  jevEnabled: false,
  loadingJevSetting: false,
  runningCron: false,

  async loadAdminStats() {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': 'Bearer ' + this.authToken }
      });
      if (res.ok) {
        this.adminStats = await res.json();
      }
    } catch (_e) {}
  },

  async loadSystemSettings() {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
      });
      if (res.ok) {
        const d = await res.json();
        this.jevEnabled = !!d.jev_enabled;
      }
    } catch (_e) {}
  },

  async toggleJevSetting() {
    if (this.loadingJevSetting) return;
    this.loadingJevSetting = true;
    const target = !this.jevEnabled;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {})
        },
        body: JSON.stringify({ jev_enabled: target })
      });
      const d = await res.json();
      if (res.ok && d.success) {
        this.jevEnabled = !!d.jev_enabled;
        const msg = this.jevEnabled
          ? (MZ.i18n.currentLang === 'ar' ? '⚡ تم تفعيل Jev AI (استهلاك التوكنات شغال)' : '⚡ Jev AI enabled')
          : (MZ.i18n.currentLang === 'ar' ? '🛑 تم تعطيل Jev AI وإيقاف استهلاك الرصيد نهائياً' : '🛑 Jev AI disabled');
        this.showToast(msg);
      } else {
        alert(d.error || 'Failed to update Jev AI setting');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      this.loadingJevSetting = false;
    }
  },

  async triggerMaintenanceCron() {
    if (this.runningCron) return;
    this.runningCron = true;
    const waitMsg = MZ.i18n.currentLang === 'ar'
      ? 'جاري تشغيل دورة الصيانة والتدوير الذكي مع Jev AI... ⏳'
      : 'Running maintenance and compaction cycle... ⏳';
    this.showToast(waitMsg);
    try {
      const res = await fetch('/api/cron/run', {
        method: 'POST',
        headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
      });
      const d = await res.json();
      if (res.ok && d.result) {
        const r = d.result;
        const doneMsg = MZ.i18n.currentLang === 'ar'
          ? ('اكتملت الصيانة! أقفال ملغاة: ' + (r.unlockedTasks || 0) + ' | تدوير: ' + (r.decayedMemories || 0) + ' | ضغط Jev: ' + (r.compactedPairs || 0))
          : ('Maintenance complete! Released locks: ' + (r.unlockedTasks || 0) + ' | Decayed: ' + (r.decayedMemories || 0) + ' | Compacted: ' + (r.compactedPairs || 0));
        this.showToast(doneMsg);
        this.loadTasks();
        this.loadMemories();
      } else {
        this.showToast(d.error || 'Maintenance error');
      }
    } catch (err) {
      this.showToast((MZ.i18n.currentLang === 'ar' ? 'فشل تشغيل الصيانة: ' : 'Maintenance failed: ') + err.message);
    } finally {
      this.runningCron = false;
    }
  }
};
