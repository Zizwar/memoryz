// MemoryZ Dashboard - Memories Module
window.MZ = window.MZ || {};

MZ.memories = {
  memories: [],
  memoryFilter: 'all',
  memoryQuery: '',
  loadingMemories: false,
  totalMemories: 0,
  formMemory: { type: 'preference', title: '', content: '', namespace: 'vibzcode' },

  async loadMemories() {
    this.loadingMemories = true;
    try {
      const nsParam = this.currentNamespace !== 'all' ? '&namespace=' + encodeURIComponent(this.currentNamespace) : '';
      const q = (this.memoryQuery || '').trim();
      let url = '/api/memories?limit=100' + nsParam;

      // Direct 64-char Hash Lookup
      const cleanHash = q.startsWith('#') ? q.slice(1) : q;
      if (cleanHash.length === 64 && /^[0-9a-fA-F]+$/.test(cleanHash)) {
        url = '/api/memories/' + cleanHash;
        const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
        const res = await fetch(url, { headers });
        if (res.ok) {
          const item = await res.json();
          this.memories = [item];
          this.totalMemories = 1;
          this.loadingMemories = false;
          return;
        }
      }

      if (q) {
        url = '/api/memories/recall?query=' + encodeURIComponent(q) + nsParam;
      }
      const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        this.memories = data.memories || [];
        this.totalMemories = this.memories.length;
      }
    } catch (_e) {}
    this.loadingMemories = false;
  },

  searchMemories() {
    this.loadMemories();
  },

  setMemoryFilter(type) {
    this.memoryFilter = type;
  },

  get filteredMemories() {
    if (this.memoryFilter === 'all') return this.memories;
    return this.memories.filter(m => m.type === this.memoryFilter);
  },

  openMemoryModal() {
    this.formMemory = {
      type: 'preference',
      title: '',
      content: '',
      namespace: this.currentNamespace !== 'all' ? this.currentNamespace : 'vibzcode'
    };
    this.modals.memory = true;
  },

  async saveMemory() {
    if (!this.authToken) return this.openAuthModal();
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify(this.formMemory)
      });
      if (res.ok) {
        this.modals.memory = false;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حفظ ذرة الذاكرة بنجاح ⚡' : 'Memory atom saved successfully ⚡');
        this.loadMemories();
        this.loadGraph();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save memory');
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async deleteMemory(hash) {
    const confirmMsg = MZ.i18n.currentLang === 'ar' ? 'هل تريد حذف هذه الذاكرة؟' : 'Are you sure you want to delete this memory?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch('/api/memories/' + hash, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + this.authToken }
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حذف الذاكرة' : 'Memory deleted');
        this.loadMemories();
        this.loadGraph();
      }
    } catch (err) {
      alert(err.message);
    }
  }
};
