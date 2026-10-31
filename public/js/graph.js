// MemoryZ Dashboard - Knowledge Graph Module
window.MZ = window.MZ || {};

MZ.graph = {
  graphData: { nodes: [], edges: [], stats: { totalNodes: 0, totalEdges: 0 } },
  graphStats: { totalNodes: 0, totalEdges: 0 },
  loadingGraph: false,
  selectedGraphNode: null,
  graphFilterType: 'all',
  graphSearchQuery: '',
  graphPhysicsEnabled: true,
  networkInstance: null,
  creatingLink: false,
  linkModalData: { sourceHash: '', targetHash: '', relationType: 'related', weight: 1.0 },

  loadVisScript() {
    if (typeof vis !== 'undefined') return Promise.resolve(true);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/vis-network@9.1.9/standalone/umd/vis-network.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        const fallback = document.createElement('script');
        fallback.src = 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js';
        fallback.onload = () => resolve(true);
        fallback.onerror = () => resolve(false);
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
  },

  async loadGraph() {
    if (this.activeTab !== 'graph') return;
    this.loadingGraph = true;
    try {
      await this.loadVisScript();
      const nsParam = this.currentNamespace !== 'all' ? '?namespace=' + encodeURIComponent(this.currentNamespace) : '';
      const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
      const res = await fetch('/api/memories/graph' + nsParam, { headers });
      if (res.ok) {
        const data = await res.json();
        this.graphData = data;
        this.graphStats = data.stats || { totalNodes: (data.nodes ? data.nodes.length : 0), totalEdges: (data.edges ? data.edges.length : 0) };
        setTimeout(() => {
          this.initOrUpdateNetwork();
        }, 120);
      }
    } catch (e) {
      console.error('Error loading graph:', e);
    } finally {
      this.loadingGraph = false;
    }
  },

  initOrUpdateNetwork() {
    if (this.activeTab !== 'graph') return;
    const container = document.getElementById('memory-network-canvas');
    if (!container || typeof vis === 'undefined') return;

    try {
      const colorMap = {
        note: { background: '#10b981', border: '#059669', highlight: { background: '#34d399', border: '#10b981' } },
        skill: { background: '#8b5cf6', border: '#7c3aed', highlight: { background: '#a78bfa', border: '#8b5cf6' } },
        preference: { background: '#f59e0b', border: '#d97706', highlight: { background: '#fbbf24', border: '#f59e0b' } },
        env: { background: '#06b6d4', border: '#0891b2', highlight: { background: '#22d3ee', border: '#06b6d4' } },
      };

      const rawNodes = this.graphData.nodes || [];
      const rawEdges = this.graphData.edges || [];

      const q = (this.graphSearchQuery || '').toLowerCase();
      const filteredNodes = rawNodes.filter(n => {
        const matchType = this.graphFilterType === 'all' || n.type === this.graphFilterType;
        const matchQuery = !q ||
          (n.label && n.label.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q));
        return matchType && matchQuery;
      });

      const activeNodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = rawEdges.filter(e => activeNodeIds.has(e.from) && activeNodeIds.has(e.to));

      const isDark = this.theme === 'dark';
      const visNodes = filteredNodes.map(n => {
        const colors = colorMap[n.type] || colorMap.note;
        const size = Math.min(38, Math.max(16, 16 + (n.recall_score || 0) * 3));
        return {
          id: n.id,
          label: n.label,
          title: '[' + n.type.toUpperCase() + '] ' + n.label + '\n\n' + n.content.substring(0, 150) + '...',
          shape: 'dot',
          size: size,
          color: colors,
          font: { size: 12, color: isDark ? '#f3f4f6' : '#1f2937', face: 'Tajawal, sans-serif' },
          borderWidth: 2,
          shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 4, x: 2, y: 2 }
        };
      });

      const visEdges = filteredEdges.map(e => ({
        id: e.id,
        from: e.from,
        to: e.to,
        label: e.label,
        arrows: { to: { enabled: true, scaleFactor: 0.7 } },
        color: {
          color: isDark ? 'rgba(156, 163, 175, 0.4)' : 'rgba(107, 114, 128, 0.4)',
          highlight: '#3b82f6',
          hover: '#60a5fa'
        },
        font: { size: 10, color: isDark ? '#9ca3af' : '#4b5563', align: 'middle', background: isDark ? '#1f2937' : '#f3f4f6' },
        width: Math.min(4, Math.max(1, (e.weight || 1) * 1.5)),
        smooth: { type: 'continuous' }
      }));

      const data = {
        nodes: new vis.DataSet(visNodes),
        edges: new vis.DataSet(visEdges)
      };

      const options = {
        nodes: { scaling: { min: 14, max: 45 } },
        physics: {
          enabled: this.graphPhysicsEnabled,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -40,
            centralGravity: 0.008,
            springLength: 90,
            springConstant: 0.06,
            damping: 0.45
          },
          stabilization: { iterations: 80 }
        },
        interaction: {
          hover: true,
          tooltipDelay: 150,
          zoomView: true,
          dragView: true
        }
      };

      if (this.networkInstance) {
        this.networkInstance.setData(data);
      } else {
        this.networkInstance = new vis.Network(container, data, options);

        this.networkInstance.on('click', (params) => {
          if (params.nodes && params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const found = this.graphData.nodes.find(n => n.id === nodeId);
            if (found) {
              this.selectedGraphNode = found;
            }
          }
        });

        this.networkInstance.on('doubleClick', (params) => {
          if (params.nodes && params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            this.networkInstance.focus(nodeId, { scale: 1.4, animation: true });
          }
        });
      }
    } catch (err) {
      console.error('Failed to initialize vis network:', err);
    }
  },

  filterGraph() {
    this.initOrUpdateNetwork();
  },

  setGraphFilter(type) {
    this.graphFilterType = type;
    this.initOrUpdateNetwork();
  },

  fitGraph() {
    if (this.networkInstance) {
      this.networkInstance.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }
  },

  toggleGraphPhysics() {
    this.graphPhysicsEnabled = !this.graphPhysicsEnabled;
    if (this.networkInstance) {
      this.networkInstance.setOptions({ physics: { enabled: this.graphPhysicsEnabled } });
    }
  },

  getNodeEdges(nodeId) {
    if (!nodeId || !this.graphData.edges) return [];
    return this.graphData.edges.filter(e => e.from === nodeId || e.to === nodeId);
  },

  getNeighborTitle(edge, currentNodeId) {
    const neighborId = edge.from === currentNodeId ? edge.to : edge.from;
    const found = this.graphData.nodes.find(n => n.id === neighborId);
    return found ? found.label : neighborId.substring(0, 8);
  },

  openCreateLinkModal(sourceHash) {
    this.linkModalData.sourceHash = sourceHash || (this.selectedGraphNode ? this.selectedGraphNode.id : '');
    this.linkModalData.targetHash = '';
    this.linkModalData.relationType = 'related';
    this.linkModalData.weight = 1.0;
    this.modals.link = true;
  },

  async submitCreateLink() {
    if (!this.linkModalData.sourceHash || !this.linkModalData.targetHash) return;
    if (this.linkModalData.sourceHash === this.linkModalData.targetHash) {
      alert(MZ.i18n.currentLang === 'ar' ? 'لا يمكن ربط الذاكرة بنفسها' : 'Cannot link a memory to itself');
      return;
    }
    this.creatingLink = true;
    try {
      const res = await fetch('/api/memories/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify(this.linkModalData)
      });
      if (res.ok) {
        this.modals.link = false;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم إنشاء الرابط البياني بنجاح 🔗' : 'Graph link created successfully 🔗');
        await this.loadGraph();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create link');
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.creatingLink = false;
    }
  },

  async deleteGraphLink(sourceHash, targetHash, relationType) {
    const confirmMsg = MZ.i18n.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا الرابط البياني؟' : 'Are you sure you want to delete this link?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch('/api/memories/link', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify({ source_hash: sourceHash, target_hash: targetHash, relation_type: relationType })
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حذف الرابط' : 'Link deleted');
        await this.loadGraph();
      }
    } catch (e) {
      console.error(e);
    }
  },

  searchFromNode(content) {
    this.activeTab = 'memories';
    this.memoryQuery = (content || '').substring(0, 60);
    this.searchMemories();
  }
};
