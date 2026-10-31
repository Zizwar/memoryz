// MemoryZ Dashboard - Zero-Knowledge Vault Module
window.MZ = window.MZ || {};

MZ.vault = {
  vaultKeys: [],
  loadingVault: false,
  decryptKeyName: '',
  decryptPassphrase: '',
  decryptedResult: '',
  formVault: { key_name: '', secret_value: '', passphrase: '' },

  async loadVaultKeys() {
    this.loadingVault = true;
    try {
      const res = await fetch('/api/vault', {
        headers: { 'Authorization': 'Bearer ' + this.authToken }
      });
      if (res.ok) {
        const d = await res.json();
        this.vaultKeys = d.keys || [];
      }
    } catch (_e) {}
    this.loadingVault = false;
  },

  openVaultModal() {
    this.formVault = { key_name: '', secret_value: '', passphrase: '' };
    this.modals.vault = true;
  },

  async saveVaultSecret() {
    if (!this.authToken) return this.openAuthModal();
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify(this.formVault)
      });
      if (res.ok) {
        this.modals.vault = false;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم تشفير السر في الخزنة 🔐' : 'Secret safely encrypted in vault 🔐');
        this.loadVaultKeys();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to store secret');
      }
    } catch (err) {
      alert(err.message);
    }
  },

  openDecryptModal(keyName) {
    this.decryptKeyName = keyName;
    this.decryptPassphrase = '';
    this.decryptedResult = '';
    this.modals.decrypt = true;
  },

  async retrieveVaultSecret() {
    try {
      const res = await fetch('/api/vault/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify({ key_name: this.decryptKeyName, passphrase: this.decryptPassphrase })
      });
      const d = await res.json();
      if (res.ok) {
        this.decryptedResult = d.secret_value;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم فك التشفير بنجاح 🔓' : 'Secret decrypted successfully 🔓');
      } else {
        alert(d.error || (MZ.i18n.currentLang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect passphrase'));
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async deleteVaultKey(keyName) {
    const confirmMsg = MZ.i18n.currentLang === 'ar' ? 'هل تريد حذف المفتاح المشفر: ' + keyName + '؟' : 'Are you sure you want to delete secret key: ' + keyName + '?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch('/api/vault/' + encodeURIComponent(keyName), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + this.authToken }
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حذف المفتاح من الخزنة' : 'Secret key removed from vault');
        this.loadVaultKeys();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete vault key');
      }
    } catch (err) {
      alert(err.message);
    }
  }
};
