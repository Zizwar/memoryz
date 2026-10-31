// MemoryZ Dashboard - Agent Simulator Module
window.MZ = window.MZ || {};

MZ.agent = {
  simulatorQuery: '',
  simulatorResults: [],
  loadingSimulator: false,

  async runSimulator() {
    if (!this.simulatorQuery.trim()) return;
    this.loadingSimulator = true;
    try {
      const res = await fetch('/api/memories/recall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify({ query: this.simulatorQuery, limit: 4 })
      });
      if (res.ok) {
        const d = await res.json();
        this.simulatorResults = d.memories || [];
      } else {
        const d = await res.json();
        alert(d.error || 'Recall failed');
      }
    } catch (err) {
      alert(err.message);
    }
    this.loadingSimulator = false;
  }
};
