// MemoryZ Dashboard - Utilities & Helper Functions
window.MZ = window.MZ || {};

MZ.utils = {
  // Toast state is managed reactively in Alpine, helper function:
  showToast(msg, duration = 3500) {
    if (window.Alpine && window._mzAppInstance) {
      window._mzAppInstance.toast.message = msg;
      window._mzAppInstance.toast.show = true;
      clearTimeout(window._mzToastTimer);
      window._mzToastTimer = setTimeout(() => {
        window._mzAppInstance.toast.show = false;
      }, duration);
    } else {
      console.log('[MemoryZ Toast]:', msg);
    }
  },

  async copyText(txt) {
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      const msg = (MZ.i18n && MZ.i18n.t('copied')) || 'Copied to clipboard 📋';
      MZ.utils.showToast(msg);
    } catch (_e) {
      const textarea = document.createElement('textarea');
      textarea.value = txt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      const msg = (MZ.i18n && MZ.i18n.t('copied')) || 'Copied to clipboard 📋';
      MZ.utils.showToast(msg);
    }
  },

  formatDate(ts) {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const lang = (MZ.i18n && MZ.i18n.currentLang) || 'ar';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  },

  formatTime(ts) {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const lang = (MZ.i18n && MZ.i18n.currentLang) || 'ar';
    return date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US');
  },

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileIcon(key, contentType) {
    const k = (key || '').toLowerCase();
    const ct = (contentType || '').toLowerCase();
    if (ct.startsWith('image/') || k.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'fa-file-image text-warning';
    if (ct.includes('zip') || ct.includes('tar') || ct.includes('gzip') || k.match(/\.(zip|tar|gz|7z|rar)$/)) return 'fa-file-zipper text-accent';
    if (ct.includes('json') || ct.includes('javascript') || ct.includes('typescript') || ct.includes('python') || k.match(/\.(ts|js|json|py|sh|html|css)$/)) return 'fa-file-code text-info';
    if (ct.startsWith('text/') || k.match(/\.(txt|md|log|csv)$/)) return 'fa-file-lines text-primary';
    return 'fa-file text-base-content/60';
  }
};
