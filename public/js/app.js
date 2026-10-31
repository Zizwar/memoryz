// MemoryZ Dashboard - Main Alpine.js Application Orchestrator
window.MZ = window.MZ || {};

document.addEventListener('alpine:init', () => {
  Alpine.data('memoryzApp', () => ({
    // Spread all specialized modules
    ...MZ.utils,
    ...MZ.auth,
    ...MZ.memories,
    ...MZ.graph,
    ...MZ.tasks,
    ...MZ.webhooks,
    ...MZ.context,
    ...MZ.agent,
    ...MZ.vault,
    ...MZ.r2,
    ...MZ.connect,
    ...MZ.admin,

    // Global Core State
    activeTab: 'memories',
    currentNamespace: 'all',
    theme: localStorage.getItem('memoryz_theme') || 'dark',
    currentLang: (MZ.i18n && MZ.i18n.currentLang) || 'ar',
    langKey: 0,

    // Dialog Modals State
    modals: {
      memory: false,
      link: false,
      task: false,
      webhook: false,
      r2Upload: false,
      vault: false,
      decrypt: false,
      auth: false,
    },

    // Global Toast Notification
    toast: { show: false, message: '' },

    // Reactive i18n Translation Helper
    t(key) {
      // Depend on reactive langKey so switching language automatically updates UI
      void this.langKey;
      return MZ.i18n ? MZ.i18n.t(key) : key;
    },

    toggleLang() {
      if (MZ.i18n) {
        MZ.i18n.toggleLang();
        this.currentLang = MZ.i18n.currentLang;
        this.langKey++;
      }
    },

    setLang(lang) {
      if (MZ.i18n) {
        MZ.i18n.setLang(lang);
        this.currentLang = MZ.i18n.currentLang;
        this.langKey++;
      }
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('memoryz_theme', this.theme);
      document.documentElement.setAttribute('data-theme', this.theme);
    },

    setNamespace(ns) {
      this.currentNamespace = ns;
      this.loadMemories();
      this.loadGraph();
      this.loadTasks();
      if (this.activeTab === 'webhooks') this.loadWebhooks();
      if (this.activeTab === 'r2') this.loadR2Files();
    },

    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'memories') this.loadMemories();
      if (tab === 'graph') {
        this.$nextTick(() => {
          this.loadGraph();
        });
      }
      if (tab === 'tasks') this.loadTasks();
      if (tab === 'webhooks') this.loadWebhooks();
      if (tab === 'r2') this.loadR2Files();
      if (tab === 'context') this.loadLogs();
      if (tab === 'vault') this.loadVaultKeys();
      if (tab === 'admin') this.loadAdminStats();
    },

    async initApp() {
      window._mzAppInstance = this;

      // Initialize theme & direction
      this.theme = localStorage.getItem('memoryz_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
      if (MZ.i18n) {
        MZ.i18n.init();
        this.currentLang = MZ.i18n.currentLang;
      }

      // Listen for language change events
      document.addEventListener('mz-lang-changed', (e) => {
        this.currentLang = e.detail;
        this.langKey++;
      });

      // Support URL query parameter for seamless login on custom domains (e.g. ?token=mz_... or ?key=...)
      const urlParams = new URLSearchParams(window.location.search);
      const qToken = urlParams.get('token') || urlParams.get('key') || urlParams.get('api_key');
      if (qToken) {
        this.authToken = qToken;
        localStorage.setItem('mz_token', qToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (this.authToken) {
        await this.fetchMe();
      }
      await this.loadSystemSettings();
      await this.loadMemories();
      await this.loadTasks();
      await this.loadWebhooks();
      await this.loadR2Files();
      await this.loadR2Buckets();
    }
  }));
});
