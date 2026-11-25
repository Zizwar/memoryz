// MemoryZ Dashboard - Parliament & Multi-Agent Deliberations Module
window.MZ = window.MZ || {};

MZ.parliament = {
  proposals: [],
  openProposalsCount: 0,
  selectedProposal: null,
  selectedProposalId: null,
  loadingProposals: false,
  loadingDetail: false,
  submittingAction: false,
  parliamentFilter: 'all', // 'all' | 'active' | 'open' | 'revealed' | 'closed'
  parliamentViewMode: 'proposals', // 'proposals' | 'vibing' | 'agents'
  parliamentAgents: [],
  parliamentSearch: '',
  proposalsVisible: 10,
  vibingVisible: 10,
  nowSeconds: Math.floor(Date.now() / 1000),
  _parliamentTimer: null,
  _parliamentClockTimer: null,

  // New Proposal Form
  formProposal: {
    title: '',
    problem: '',
    solution: '',
    impact: '',
    kind: 'vote',
    namespace: 'default',
    majority: 'simple',
    quorum: 2,
    deadline_hours: 48,
    rounds: 2,
    devils_advocate: true,
    on_pass_task: true,
    open: true,
    invited: [],
  },

  // Cast Vote Form
  formVote: {
    choice: 'approve',
    reason: '',
  },

  // Round 2 Argument Form
  formArgument: {
    text: '',
    stance: 'comment',
    reply_to: '',
  },

  // Owner Close / Override Form
  formClose: {
    reason: 'manual_conclusion',
    enableOverride: false,
    overrideDecision: 'passed',
    overrideReason: '',
  },

  // Agent Registration Form
  formAgentRegister: {
    name: '',
    role: 'agent',
    weight: 1,
    tags: '',
  },
  newAgentSecretToken: null,

  async initParliament() {
    this.startParliamentClock();
    await this.loadProposals();
    await this.loadParliamentAgents();
  },

  startParliamentClock() {
    if (this._parliamentClockTimer) clearInterval(this._parliamentClockTimer);
    this._parliamentClockTimer = setInterval(() => {
      this.nowSeconds = Math.floor(Date.now() / 1000);
    }, 1000);
  },

  startParliamentPolling() {
    if (this._parliamentTimer) clearInterval(this._parliamentTimer);
    this._parliamentTimer = setInterval(() => {
      if (this.activeTab === 'parliament') {
        this.loadProposals(true);
      }
    }, 5000);
  },

  stopParliamentPolling() {
    if (this._parliamentTimer) {
      clearInterval(this._parliamentTimer);
      this._parliamentTimer = null;
    }
  },

  async loadProposals(silent = false) {
    if (!silent) { this.loadingProposals = true; this.proposalsVisible = 10; this.vibingVisible = 10; }
    try {
      const nsParam = this.currentNamespace !== 'all' ? '?namespace=' + encodeURIComponent(this.currentNamespace) : '';
      const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
      const res = await fetch('/api/parliament/proposals' + nsParam, { headers });
      if (res.ok) {
        const data = await res.json();
        this.proposals = data.proposals || [];
        this.openProposalsCount = this.proposals.filter(p => p.status === 'open' || p.status === 'revealed').length;
        
        // If inspecting a proposal, refresh its detail silently
        if (this.selectedProposalId) {
          await this.loadProposalDetail(this.selectedProposalId, true);
        }
      }
    } catch (_err) {
      // ignore network glitch in background
    }
    if (!silent) this.loadingProposals = false;
  },

  async loadProposalDetail(id, silent = false) {
    if (!silent) this.loadingDetail = true;
    try {
      const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
      const res = await fetch('/api/parliament/proposals/' + encodeURIComponent(id), { headers });
      if (res.ok) {
        const data = await res.json();
        this.selectedProposal = data.proposal;
        this.selectedProposalId = id;
      }
    } catch (err) {
      if (!silent) alert(err.message);
    }
    if (!silent) this.loadingDetail = false;
  },

  closeProposalDetail() {
    this.selectedProposal = null;
    this.selectedProposalId = null;
  },

  get filteredProposals() {
    let list = this.proposals;
    const filter = this.parliamentFilter;
    if (filter === 'active') {
      list = list.filter(p => p.status === 'open' || p.status === 'revealed');
    } else if (filter === 'open') {
      list = list.filter(p => p.status === 'open');
    } else if (filter === 'revealed') {
      list = list.filter(p => p.status === 'revealed');
    } else if (filter === 'closed') {
      list = list.filter(p => p.status === 'closed');
    } else if (filter === 'draft') {
      list = list.filter(p => p.status === 'draft');
    }

    if (this.parliamentSearch && this.parliamentSearch.trim()) {
      const q = this.parliamentSearch.toLowerCase();
      list = list.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.kind && p.kind.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q))
      );
    }
    return list;
  },

  get vibingProposals() {
    return this.proposals.filter(item => item.status === 'revealed' || item.status === 'closed');
  },

  get visibleProposals() {
    return this.filteredProposals.slice(0, this.proposalsVisible);
  },

  get visibleVibingProposals() {
    return this.vibingProposals.slice(0, this.vibingVisible);
  },

  showMoreProposals() {
    this.proposalsVisible += 10;
  },

  showMoreVibing() {
    this.vibingVisible += 10;
  },

  get activeSessionsCount() {
    return this.proposals.filter(p => p.status === 'open' || p.status === 'revealed').length;
  },

  get closedSessionsCount() {
    return this.proposals.filter(p => p.status === 'closed').length;
  },

  get proposalsNeedingDecision() {
    // Proposals revealed with all votes in, or deadline expired
    return this.proposals.filter(p => {
      if (p.status === 'revealed') return true;
      if (p.deadline && p.deadline < this.nowSeconds && (p.status === 'open' || p.status === 'revealed')) return true;
      return false;
    });
  },

  formatCountdown(deadlineTimestamp) {
    if (!deadlineTimestamp) return '--:--';
    const diff = deadlineTimestamp - this.nowSeconds;
    if (diff <= 0) return MZ.i18n.currentLang === 'ar' ? 'انتهت المهلة' : 'Expired';
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days}d ${remHours}h`;
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  },

  formatTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return date.toLocaleString(MZ.i18n.currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  },

  getStatusBadgeClass(status) {
    switch (status) {
      case 'open':
        return 'badge-primary font-bold';
      case 'revealed':
        return 'badge-secondary font-bold';
      case 'closed':
        return 'badge-neutral font-medium';
      case 'draft':
        return 'badge-ghost';
      default:
        return 'badge-ghost';
    }
  },

  getStatusLabel(status, round) {
    const isAr = MZ.i18n.currentLang === 'ar';
    if (status === 'open') {
      return isAr ? 'الجولة 1 (تصويت سري 🔒)' : 'Round 1 (Sealed 🔒)';
    }
    if (status === 'revealed') {
      return isAr ? 'الجولة 2 (حوار وكشف 🔓)' : 'Round 2 (Dialogue 🔓)';
    }
    if (status === 'closed') {
      return isAr ? 'مغلق ومحسوم' : 'Closed';
    }
    if (status === 'draft') {
      return isAr ? 'مسودة' : 'Draft';
    }
    return status;
  },

  getKindBadgeClass(kind) {
    switch (kind) {
      case 'project_decision':
        return 'badge-warning font-mono text-[10px]';
      case 'vote':
        return 'badge-info font-mono text-[10px]';
      case 'discussion':
        return 'badge-accent font-mono text-[10px]';
      default:
        return 'badge-ghost font-mono text-[10px]';
    }
  },

  openNewProposalModal() {
    this.formProposal = {
      title: '',
      problem: '',
      solution: '',
      impact: '',
      kind: 'vote',
      namespace: this.currentNamespace !== 'all' ? this.currentNamespace : 'default',
      majority: 'simple',
      quorum: 2,
      deadline_hours: 48,
      rounds: 2,
      devils_advocate: true,
      on_pass_task: true,
      open: true,
      invited: [],
    };
    this.loadParliamentAgents();
    this.modals.parliamentProposal = true;
  },

  async submitNewProposal() {
    if (!this.formProposal.title.trim()) {
      alert(MZ.i18n.currentLang === 'ar' ? 'يرجى كتابة عنوان المقترح أو السؤال' : 'Proposal question/title is required');
      return;
    }
    this.submittingAction = true;
    try {
      const res = await fetch('/api/parliament/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken,
        },
        body: JSON.stringify(this.formProposal),
      });
      if (res.ok) {
        const data = await res.json();
        this.modals.parliamentProposal = false;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم إنشاء المقترح بنجاح 🏛️' : 'Proposal created successfully 🏛️');
        await this.loadProposals();
        if (data.id) {
          await this.loadProposalDetail(data.id);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create proposal');
      }
    } catch (err) {
      alert(err.message);
    }
    this.submittingAction = false;
  },

  async openProposalAction(id) {
    this.submittingAction = true;
    try {
      const res = await fetch(`/api/parliament/proposals/${encodeURIComponent(id)}/open`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + this.authToken },
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم فتح التصويت السري بنجاح 🗳️' : 'Sealed voting opened 🗳️');
        await this.loadProposalDetail(id);
        await this.loadProposals(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to open proposal');
      }
    } catch (err) {
      alert(err.message);
    }
    this.submittingAction = false;
  },

  async revealProposalAction(id) {
    this.submittingAction = true;
    try {
      const res = await fetch(`/api/parliament/proposals/${encodeURIComponent(id)}/reveal`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + this.authToken },
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم كشف الأصوات وبدء الجولة الثانية 🔓' : 'Ballots revealed & Round 2 started 🔓');
        await this.loadProposalDetail(id);
        await this.loadProposals(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reveal ballots');
      }
    } catch (err) {
      alert(err.message);
    }
    this.submittingAction = false;
  },

  async closeProposalAction(id) {
    this.submittingAction = true;
    try {
      const payload = {
        reason: this.formClose.reason || 'manual_close',
      };
      if (this.formClose.enableOverride && this.formClose.overrideReason.trim()) {
        payload.override = {
          decision: this.formClose.overrideDecision,
          reason: this.formClose.overrideReason.trim(),
        };
      }
      const res = await fetch(`/api/parliament/proposals/${encodeURIComponent(id)}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم إغلاق المقترح وحسم النتيجة ⚖️' : 'Proposal closed and resolved ⚖️');
        await this.loadProposalDetail(id);
        await this.loadProposals(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to close proposal');
      }
    } catch (err) {
      alert(err.message);
    }
    this.submittingAction = false;
  },

  async castVoteAction(id) {
    this.submittingAction = true;
    try {
      const res = await fetch(`/api/parliament/proposals/${encodeURIComponent(id)}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken,
        },
        body: JSON.stringify(this.formVote),
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم تسجيل صوتك السري بنجاح 🗳️' : 'Ballot recorded successfully 🗳️');
        this.formVote.reason = '';
        await this.loadProposalDetail(id);
        await this.loadProposals(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cast ballot');
      }
    } catch (err) {
      alert(err.message);
    }
    this.submittingAction = false;
  },

  async addArgumentAction(id) {
    if (!this.formArgument.text.trim()) return;
    this.submittingAction = true;
    try {
      const res = await fetch(`/api/parliament/proposals/${encodeURIComponent(id)}/arguments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken,
        },
        body: JSON.stringify(this.formArgument),
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تمت إضافة الحجة للمداولة 💬' : 'Argument posted 💬');
        this.formArgument.text = '';
        this.formArgument.reply_to = '';
        await this.loadProposalDetail(id);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add argument');
      }
    } catch (err) {
      alert(err.message);
    }
    this.submittingAction = false;
  },

  async loadParliamentAgents() {
    try {
      const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
      const res = await fetch('/api/parliament/agents', { headers });
      if (res.ok) {
        const data = await res.json();
        this.parliamentAgents = data.agents || [];
      }
    } catch (_err) {
      // ignore
    }
  },

  async registerParliamentAgentAction() {
    if (!this.formAgentRegister.name.trim()) return;
    this.submittingAction = true;
    try {
      const tags = this.formAgentRegister.tags
        ? this.formAgentRegister.tags.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const res = await fetch('/api/parliament/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken,
        },
        body: JSON.stringify({
          name: this.formAgentRegister.name.trim().toLowerCase(),
          role: this.formAgentRegister.role,
          weight: parseFloat(this.formAgentRegister.weight) || 1,
          tags,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        this.newAgentSecretToken = data.token;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم تسجيل الوكيل بنجاح! احتفظ بالتوكن 🔑' : 'Agent registered! Keep your token secret 🔑');
        this.formAgentRegister = { name: '', role: 'agent', weight: 1, tags: '' };
        await this.loadParliamentAgents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register agent');
      }
    } catch (err) {
      alert(err.message);
    }
    this.submittingAction = false;
  },

  goToTask(taskId) {
    if (!taskId) return;
    this.switchTab('tasks');
  },
};
