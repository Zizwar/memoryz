// MemoryZ Dashboard - Context & Logs Module
window.MZ = window.MZ || {};

MZ.context = {
  contextQuery: '',
  contextFormat: 'xml',
  contextBudget: 1200,
  contextResult: '',
  contextStats: '',
  loadingContext: false,
  logsList: [],
  quickLogMessage: '',

  async generateContextPack() {
    this.loadingContext = true;
    try {
      const res = await fetch('/api/context/pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify({
          query: this.contextQuery,
          format: this.contextFormat,
          token_budget: parseInt(this.contextBudget, 10) || 1200,
          include_tasks: true,
          include_logs: true
        })
      });
      if (res.ok) {
        const d = await res.json();
        this.contextResult = d.content;
        const statsAr = 'تقدير التوكن: ~' + d.estimatedTokens + 't | ذكريات: ' + d.memoryCount + ' | مهام: ' + d.taskCount + ' | سجلات: ' + d.logCount;
        const statsEn = 'Estimated tokens: ~' + d.estimatedTokens + 't | Memories: ' + d.memoryCount + ' | Tasks: ' + d.taskCount + ' | Logs: ' + d.logCount;
        this.contextStats = MZ.i18n.currentLang === 'ar' ? statsAr : statsEn;
      }
    } catch (err) {
      this.contextResult = (MZ.i18n.currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message;
    }
    this.loadingContext = false;
  },

  async loadLogs() {
    try {
      const res = await fetch('/api/logs?limit=30', {
        headers: { 'Authorization': 'Bearer ' + this.authToken }
      });
      if (res.ok) {
        const d = await res.json();
        this.logsList = d.logs || [];
      }
    } catch (_e) {}
  },

  async appendQuickLog() {
    if (!this.quickLogMessage.trim()) return;
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify({ message: this.quickLogMessage.trim(), source: 'dashboard', level: 'info' })
      });
      if (res.ok) {
        this.quickLogMessage = '';
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حفظ السجل المؤقت' : 'Log entry saved');
        this.loadLogs();
      }
    } catch (err) {
      alert(err.message);
    }
  }
};
