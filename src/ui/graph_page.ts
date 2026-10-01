export function renderGraphHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemoryZ — شبكة المعرفة والروابط البيانية (Knowledge Graph)</title>
  
  <script>
    (function() {
      const savedTheme = localStorage.getItem('memoryz_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    })();
  </script>

  <!-- Tailwind, DaisyUI 4, FontAwesome 6, Vis-network, Alpine.js -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/vis-network@9.1.9/standalone/umd/vis-network.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Tajawal', 'sans-serif'],
            mono: ['Fira Code', 'monospace'],
          }
        }
      }
    }
  </script>

  <style>
    [x-cloak] { display: none !important; }
    body { font-family: 'Tajawal', sans-serif; overflow: hidden; }
    .mono { font-family: 'Fira Code', monospace; direction: ltr; text-align: left; }
    #graph-viewport { width: 100%; height: calc(100vh - 64px); }
  </style>
</head>

<body class="bg-base-100 text-base-content min-h-screen flex flex-col antialiased selection:bg-primary selection:text-primary-content"
      x-data="graphApp()"
      x-init="init()"
      x-cloak>

  <!-- TOP HEADER -->
  <header class="navbar bg-base-200/95 backdrop-blur border-b border-base-300 h-16 min-h-16 px-4 z-30 flex items-center justify-between gap-3">
    <!-- Left: Brand & Back link -->
    <div class="flex items-center gap-3">
      <a href="/" class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300" title="العودة للوحة الرئيسية">
        <i class="fa-solid fa-arrow-right text-xs"></i>
        <span class="text-xs font-bold hidden sm:inline">اللوحة الرئيسية</span>
      </a>

      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent text-primary-content flex items-center justify-center font-black shadow-md text-sm">
          <i class="fa-solid fa-circle-nodes"></i>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-black text-sm sm:text-base tracking-tight">Memory<span class="text-primary">Z</span></span>
            <span class="badge badge-primary badge-xs font-mono font-bold">Graph 3D</span>
          </div>
          <div class="text-[10px] text-base-content/60 font-mono">
            عقد: <span class="font-bold text-primary" x-text="stats.totalNodes">0</span> | روابط: <span class="font-bold text-secondary" x-text="stats.totalEdges">0</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Center: Search & Filter Toolbar -->
    <div class="hidden md:flex items-center gap-2">
      <!-- Search -->
      <div class="join shadow-sm">
        <input type="text"
               class="input input-xs join-item bg-base-100 border-base-300 w-44 focus:w-60 transition-all font-mono text-xs"
               placeholder="بحث بالعقدة أو المحتوى..."
               x-model="searchQuery"
               @input="filterNetwork()">
        <button class="btn btn-xs join-item btn-ghost border-base-300" @click="searchQuery = ''; filterNetwork()" x-show="searchQuery">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <!-- Type Filter -->
      <div class="join shadow-sm">
        <button class="btn btn-xs join-item" :class="filterType === 'all' ? 'btn-primary' : 'btn-ghost'" @click="setFilter('all')">الكل</button>
        <button class="btn btn-xs join-item gap-1 text-warning" :class="filterType === 'preference' ? 'btn-warning text-warning-content' : 'btn-ghost'" @click="setFilter('preference')">
          <i class="fa-solid fa-star text-[10px]"></i>
          <span>قواعد</span>
        </button>
        <button class="btn btn-xs join-item gap-1 text-secondary" :class="filterType === 'skill' ? 'btn-secondary text-secondary-content' : 'btn-ghost'" @click="setFilter('skill')">
          <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
          <span>مهارات</span>
        </button>
        <button class="btn btn-xs join-item gap-1 text-success" :class="filterType === 'note' ? 'btn-success text-success-content' : 'btn-ghost'" @click="setFilter('note')">
          <i class="fa-solid fa-note-sticky text-[10px]"></i>
          <span>ملاحظات</span>
        </button>
        <button class="btn btn-xs join-item gap-1 text-info" :class="filterType === 'env' ? 'btn-info text-info-content' : 'btn-ghost'" @click="setFilter('env')">
          <i class="fa-solid fa-server text-[10px]"></i>
          <span>بيئة</span>
        </button>
      </div>

      <!-- Namespace Filter -->
      <select class="select select-xs bg-base-100 border-base-300 font-mono text-xs" x-model="currentNamespace" @change="loadData()">
        <option value="all">كل النطاقات (All)</option>
        <option value="vibzcode">vibzcode</option>
        <option value="memoryz">memoryz</option>
        <option value="ferme">ferme</option>
        <option value="default">default</option>
      </select>
    </div>

    <!-- Right: Actions & Auth -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <!-- Create Link Modal trigger -->
      <button class="btn btn-primary btn-xs sm:btn-sm gap-1.5 rounded-xl font-bold shadow-sm" @click="modals.link = true">
        <i class="fa-solid fa-link text-xs"></i>
        <span class="hidden sm:inline">ربط ذكريات</span>
      </button>

      <!-- Center / Fit View -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="توسيط وملاءمة الشاشة" @click="fitView()">
        <i class="fa-solid fa-compress text-xs sm:text-sm"></i>
      </button>

      <!-- Physics Toggle -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom"
              :class="physicsEnabled ? 'text-primary' : 'text-base-content/40'"
              :data-tip="physicsEnabled ? 'إيقاف حركة الجاذبية' : 'تفعيل حركة الجاذبية'"
              @click="togglePhysics()">
        <i class="fa-solid fa-atom text-xs sm:text-sm"></i>
      </button>

      <!-- Theme Switcher -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom"
              :data-tip="theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'"
              @click="toggleTheme()">
        <i class="fa-solid text-xs sm:text-sm" :class="theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-primary'"></i>
      </button>

      <!-- Token / Auth Dropdown -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-xs sm:btn-sm gap-1.5 px-2 rounded-xl border border-base-300">
          <i class="fa-solid fa-key text-xs" :class="authToken ? 'text-success' : 'text-warning'"></i>
          <span class="font-mono text-xs hidden sm:inline" x-text="authToken ? (authToken.substring(0, 7) + '...') : 'المصادقة'"></span>
        </div>
        <div tabindex="0" class="dropdown-content z-50 card card-compact w-72 p-3 shadow-2xl bg-base-200 border border-base-300 text-xs mt-2">
          <div class="font-bold mb-2 flex items-center justify-between">
            <span>مفتاح الوصول (API Key)</span>
            <span class="badge badge-xs font-mono" :class="authToken ? 'badge-success' : 'badge-warning'" x-text="authToken ? 'متصل' : 'ضيف'"></span>
          </div>
          <p class="text-base-content/60 text-[11px] mb-2">لتحميل الذكريات الخاصة بحسابك، أدخل مفتاحك هنا:</p>
          <input type="text" class="input input-xs input-bordered w-full font-mono text-xs mb-2" placeholder="mz_..." x-model="tokenInput">
          <div class="flex items-center gap-2">
            <button class="btn btn-primary btn-xs flex-1 font-bold" @click="saveToken()">حفظ المفتاح</button>
            <button class="btn btn-ghost btn-xs text-error" @click="clearToken()" x-show="authToken">مسح</button>
          </div>
        </div>
      </div>

      <!-- Links menu -->
      <a href="/webhooks" class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="صفحة الويبهوك">
        <i class="fa-solid fa-satellite-dish text-xs"></i>
      </a>
      <a href="/docs" target="_blank" rel="noopener" class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="التوثيق">
        <i class="fa-solid fa-book-open text-xs"></i>
      </a>
    </div>
  </header>

  <!-- MAIN CANVAS & FLOATING PANELS -->
  <main class="relative flex-1 w-full bg-base-100 overflow-hidden">

    <!-- Loading Indicator -->
    <div class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-base-100/80 backdrop-blur-sm pointer-events-none" x-show="loading">
      <span class="loading loading-spinner loading-lg text-primary mb-3"></span>
      <p class="font-bold text-sm tracking-wide">جاري قراءة ذرات المعرفة وبناء الشبكة البيانية...</p>
    </div>

    <!-- Vis-Network Container -->
    <div id="graph-viewport"></div>

    <!-- Floating Legend (Bottom-Right) -->
    <div class="absolute bottom-4 right-4 z-10 bg-base-200/90 backdrop-blur border border-base-300 rounded-xl p-3 shadow-lg flex flex-col gap-1.5 text-xs max-w-xs">
      <div class="font-bold text-[11px] text-base-content/60 uppercase tracking-wider mb-0.5">دليل الألوان والعقد</div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
        <span class="font-medium">Preference (تفضيلات وقواعد أساسية)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-purple-500 shrink-0"></span>
        <span class="font-medium">Skill (مهارات وأدوات برمجية)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
        <span class="font-medium">Note (ملاحظات ومعارف عامة)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-cyan-500 shrink-0"></span>
        <span class="font-medium">Env (إعدادات بيئة وتشغيل)</span>
      </div>
      <div class="text-[10px] text-base-content/50 pt-1 border-t border-base-300 mt-1">
        * انقر على أي عقدة للاطلاع على التفاصيل والروابط، أو انقر نقراً مزدوجاً للتركيز عليها.
      </div>
    </div>

    <!-- Node Details Drawer / Side Panel (Left Side) -->
    <div class="absolute top-4 left-4 bottom-4 w-96 max-w-[calc(100vw-32px)] z-20 bg-base-200/95 backdrop-blur border border-base-300 rounded-2xl shadow-2xl p-4 flex flex-col justify-between overflow-y-auto"
         x-show="selectedNode"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 -translate-x-6"
         x-transition:enter-end="opacity-100 translate-x-0"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100 translate-x-0"
         x-transition:leave-end="opacity-0 -translate-x-6">
      
      <div>
        <!-- Node Header -->
        <div class="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-base-300">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-sm font-mono font-bold uppercase"
                    :class="{
                      'badge-warning': selectedNode?.type === 'preference',
                      'badge-secondary': selectedNode?.type === 'skill',
                      'badge-success': selectedNode?.type === 'note',
                      'badge-info': selectedNode?.type === 'env'
                    }"
                    x-text="selectedNode?.type"></span>
              <span class="badge badge-ghost badge-sm font-mono" x-text="selectedNode?.namespace || 'vibzcode'"></span>
            </div>
            <h3 class="font-black text-base text-base-content line-clamp-2" x-text="selectedNode?.label"></h3>
          </div>
          <button class="btn btn-ghost btn-xs btn-circle" @click="selectedNode = null">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Node Meta -->
        <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div class="bg-base-100/60 p-2 rounded-lg border border-base-300/60">
            <span class="text-base-content/60 block text-[10px]">معدل الاسترجاع:</span>
            <span class="font-mono font-bold text-primary" x-text="(selectedNode?.recall_score || 0) + ' استدعاء'"></span>
          </div>
          <div class="bg-base-100/60 p-2 rounded-lg border border-base-300/60">
            <span class="text-base-content/60 block text-[10px]">الهاش:</span>
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold truncate text-[11px]" x-text="selectedNode?.id?.substring(0, 10) + '...'"></span>
              <button class="btn btn-ghost btn-xs btn-square text-primary" @click="copyText(selectedNode?.id)" title="نسخ الهاش الكامل">
                <i class="fa-regular fa-copy text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Node Full Content -->
        <div class="mb-4">
          <div class="text-[11px] font-bold text-base-content/60 uppercase tracking-wider mb-1">محتوى الذرة المعرفية</div>
          <div class="bg-base-100 p-3 rounded-xl border border-base-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto selection:bg-primary"
               x-text="selectedNode?.content"></div>
        </div>

        <!-- Connected Edges / Relationships -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">الروابط المتصلة (<span x-text="getNodeEdges(selectedNode?.id).length"></span>)</span>
            <button class="btn btn-ghost btn-xs text-primary gap-1" @click="openLinkModal(selectedNode?.id)">
              <i class="fa-solid fa-plus text-[10px]"></i>
              <span class="text-[11px]">ربط بذاكرة</span>
            </button>
          </div>

          <div class="space-y-1.5 max-h-44 overflow-y-auto">
            <template x-for="edge in getNodeEdges(selectedNode?.id)" :key="edge.id">
              <div class="flex items-center justify-between bg-base-100/80 p-2 rounded-lg border border-base-300/80 text-xs">
                <div class="flex items-center gap-2 truncate">
                  <span class="badge badge-xs font-mono badge-outline text-primary" x-text="edge.label || 'related'"></span>
                  <span class="truncate font-medium" x-text="getNeighborTitle(edge, selectedNode?.id)"></span>
                </div>
                <button class="btn btn-ghost btn-xs text-error btn-square shrink-0" @click="deleteLink(edge.from, edge.to, edge.label)" title="حذف الرابط">
                  <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
              </div>
            </template>
            <template x-if="getNodeEdges(selectedNode?.id).length === 0">
              <div class="text-xs text-base-content/50 italic py-2 text-center bg-base-100/40 rounded-lg">لا توجد روابط مسجلة لهذه العقدة حتى الآن.</div>
            </template>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="pt-2 border-t border-base-300 flex items-center gap-2">
        <button class="btn btn-primary btn-sm flex-1 gap-1.5 font-bold" @click="focusNode(selectedNode?.id)">
          <i class="fa-solid fa-crosshairs text-xs"></i>
          <span>تركيز الكاميرا</span>
        </button>
        <a :href="'/?token=' + encodeURIComponent(authToken || '') + '#' + selectedNode?.id"
           class="btn btn-ghost btn-sm border border-base-300 gap-1.5"
           title="عرض في لوحة الذاكرة الرئيسية">
          <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
        </a>
      </div>
    </div>
  </main>

  <!-- MODAL: CREATE KNOWLEDGE LINK -->
  <dialog class="modal" :class="{ 'modal-open': modals.link }">
    <div class="modal-box max-w-lg bg-base-200 border border-base-300 text-xs">
      <h3 class="font-black text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-link text-primary"></i>
        <span>إنشاء رابط بياني بين ذرتي ذاكرة</span>
      </h3>
      
      <div class="space-y-3">
        <div>
          <label class="label py-1"><span class="label-text text-xs font-bold">الذاكرة المصدر (Source Hash):</span></label>
          <input type="text" class="input input-sm input-bordered w-full font-mono text-xs"
                 placeholder="الهاش المصدر (64 خانة)"
                 x-model="linkForm.sourceHash">
        </div>

        <div>
          <label class="label py-1"><span class="label-text text-xs font-bold">الذاكرة الهدف (Target Hash):</span></label>
          <input type="text" class="input input-sm input-bordered w-full font-mono text-xs"
                 placeholder="الهاش الهدف (64 خانة)"
                 x-model="linkForm.targetHash">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label py-1"><span class="label-text text-xs font-bold">نوع العلاقة (Relation):</span></label>
            <select class="select select-sm select-bordered w-full font-mono text-xs" x-model="linkForm.relationType">
              <option value="related">related (مرتبط)</option>
              <option value="implements">implements (ينفذ)</option>
              <option value="refines">refines (يحسن/يدقق)</option>
              <option value="depends_on">depends_on (يعتمد على)</option>
              <option value="contradicts">contradicts (يناقض)</option>
            </select>
          </div>
          <div>
            <label class="label py-1"><span class="label-text text-xs font-bold">قوة الرابط (Weight):</span></label>
            <input type="number" step="0.1" min="0.1" max="5.0" class="input input-sm input-bordered w-full font-mono text-xs" x-model.number="linkForm.weight">
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost btn-sm" @click="modals.link = false">إلغاء</button>
        <button class="btn btn-primary btn-sm font-bold gap-1" :disabled="creatingLink" @click="submitLink()">
          <span class="loading loading-spinner loading-xs" x-show="creatingLink"></span>
          <span>إنشاء الرابط</span>
        </button>
      </div>
    </div>
  </dialog>

  <!-- TOAST NOTIFICATION -->
  <div class="toast toast-end toast-bottom z-50" x-show="toast.show" x-transition>
    <div class="alert alert-info text-xs shadow-lg py-2 px-4 rounded-xl flex items-center gap-2">
      <i class="fa-solid fa-circle-check text-base"></i>
      <span x-text="toast.message"></span>
    </div>
  </div>

  <!-- APPLICATION SCRIPT -->
  <script>
    function graphApp() {
      return {
        theme: localStorage.getItem('memoryz_theme') || 'dark',
        authToken: localStorage.getItem('mz_token') || '',
        tokenInput: '',
        currentNamespace: 'all',
        filterType: 'all',
        searchQuery: '',
        physicsEnabled: true,
        loading: false,
        creatingLink: false,

        rawGraphData: { nodes: [], edges: [], stats: { totalNodes: 0, totalEdges: 0 } },
        stats: { totalNodes: 0, totalEdges: 0 },
        selectedNode: null,
        network: null,

        modals: { link: false },
        linkForm: { sourceHash: '', targetHash: '', relationType: 'related', weight: 1.0 },
        toast: { show: false, message: '' },

        showToast(msg) {
          this.toast.message = msg;
          this.toast.show = true;
          setTimeout(() => { this.toast.show = false; }, 3500);
        },

        async copyText(txt) {
          if (!txt) return;
          await navigator.clipboard.writeText(txt);
          this.showToast('تم النسخ إلى الحافظة 📋');
        },

        toggleTheme() {
          this.theme = this.theme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('memoryz_theme', this.theme);
          document.documentElement.setAttribute('data-theme', this.theme);
          this.renderNetwork();
        },

        init() {
          // Check URL param ?token=
          const params = new URLSearchParams(window.location.search);
          const qToken = params.get('token') || params.get('key') || params.get('api_key');
          if (qToken) {
            this.authToken = qToken;
            localStorage.setItem('mz_token', qToken);
          }
          this.tokenInput = this.authToken;
          this.loadData();
        },

        saveToken() {
          const key = (this.tokenInput || '').trim();
          this.authToken = key;
          if (key) {
            localStorage.setItem('mz_token', key);
            this.showToast('تم حفظ المفتاح بنجاح ✓');
          } else {
            localStorage.removeItem('mz_token');
            this.showToast('تم مسح المفتاح');
          }
          this.loadData();
        },

        clearToken() {
          this.authToken = '';
          this.tokenInput = '';
          localStorage.removeItem('mz_token');
          this.showToast('تم تسجيل الخروج');
          this.loadData();
        },

        async loadData() {
          this.loading = true;
          try {
            const nsParam = this.currentNamespace !== 'all' ? '?namespace=' + encodeURIComponent(this.currentNamespace) : '';
            const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
            const res = await fetch('/api/memories/graph' + nsParam, { headers });
            if (res.ok) {
              const data = await res.json();
              this.rawGraphData = data;
              this.stats = data.stats || { totalNodes: (data.nodes ? data.nodes.length : 0), totalEdges: (data.edges ? data.edges.length : 0) };
              this.$nextTick(() => {
                this.renderNetwork();
              });
            } else {
              this.showToast('تعذر تحميل بيانات الرسم البياني');
            }
          } catch (err) {
            console.error(err);
            this.showToast('خطأ في الاتصال بالخادم');
          } finally {
            this.loading = false;
          }
        },

        setFilter(type) {
          this.filterType = type;
          this.renderNetwork();
        },

        filterNetwork() {
          this.renderNetwork();
        },

        togglePhysics() {
          this.physicsEnabled = !this.physicsEnabled;
          if (this.network) {
            this.network.setOptions({ physics: { enabled: this.physicsEnabled } });
          }
          this.showToast(this.physicsEnabled ? 'تم تفعيل حركة الجاذبية' : 'تم تثبيت مواقع العقد');
        },

        fitView() {
          if (this.network) {
            this.network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
          }
        },

        focusNode(id) {
          if (this.network && id) {
            this.network.focus(id, { scale: 1.5, animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
          }
        },

        getNodeEdges(nodeId) {
          if (!nodeId || !this.rawGraphData.edges) return [];
          return this.rawGraphData.edges.filter(e => e.from === nodeId || e.to === nodeId);
        },

        getNeighborTitle(edge, currentNodeId) {
          const neighborId = edge.from === currentNodeId ? edge.to : edge.from;
          const found = this.rawGraphData.nodes.find(n => n.id === neighborId);
          return found ? found.label : neighborId.substring(0, 10);
        },

        openLinkModal(sourceHash) {
          this.linkForm.sourceHash = sourceHash || (this.selectedNode ? this.selectedNode.id : '');
          this.linkForm.targetHash = '';
          this.linkForm.relationType = 'related';
          this.linkForm.weight = 1.0;
          this.modals.link = true;
        },

        async submitLink() {
          if (!this.linkForm.sourceHash || !this.linkForm.targetHash) {
            alert('يرجى تحديد الهاش المصدر والهدف');
            return;
          }
          if (this.linkForm.sourceHash === this.linkForm.targetHash) {
            alert('لا يمكن ربط الذاكرة بنفسها');
            return;
          }
          this.creatingLink = true;
          try {
            const res = await fetch('/api/memories/link', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {})
              },
              body: JSON.stringify(this.linkForm)
            });
            if (res.ok) {
              this.modals.link = false;
              this.showToast('تم إنشاء الرابط البياني بنجاح 🔗');
              await this.loadData();
            } else {
              const err = await res.json();
              alert(err.error || 'فشل إنشاء الرابط');
            }
          } catch (e) {
            alert(e.message);
          } finally {
            this.creatingLink = false;
          }
        },

        async deleteLink(sourceHash, targetHash, relationType) {
          if (!confirm('هل تريد بالتأكيد حذف هذا الرابط؟')) return;
          try {
            const res = await fetch('/api/memories/link', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {})
              },
              body: JSON.stringify({ source_hash: sourceHash, target_hash: targetHash, relation_type: relationType })
            });
            if (res.ok) {
              this.showToast('تم حذف الرابط');
              await this.loadData();
            }
          } catch (e) {
            console.error(e);
          }
        },

        renderNetwork() {
          const container = document.getElementById('graph-viewport');
          if (!container || typeof vis === 'undefined') return;

          const isDark = (this.theme === 'dark');

          const colorMap = {
            note: { background: '#10b981', border: '#059669', highlight: { background: '#34d399', border: '#10b981' } },
            skill: { background: '#8b5cf6', border: '#7c3aed', highlight: { background: '#a78bfa', border: '#8b5cf6' } },
            preference: { background: '#f59e0b', border: '#d97706', highlight: { background: '#fbbf24', border: '#f59e0b' } },
            env: { background: '#06b6d4', border: '#0891b2', highlight: { background: '#22d3ee', border: '#06b6d4' } },
          };

          const rawNodes = this.rawGraphData.nodes || [];
          const rawEdges = this.rawGraphData.edges || [];

          const q = (this.searchQuery || '').toLowerCase();
          const filteredNodes = rawNodes.filter(n => {
            const matchType = this.filterType === 'all' || n.type === this.filterType;
            const matchQuery = !q ||
              n.label.toLowerCase().includes(q) ||
              n.content.toLowerCase().includes(q) ||
              n.id.toLowerCase().includes(q);
            return matchType && matchQuery;
          });

          const activeIds = new Set(filteredNodes.map(n => n.id));
          const filteredEdges = rawEdges.filter(e => activeIds.has(e.from) && activeIds.has(e.to));

          const visNodes = filteredNodes.map(n => {
            const colors = colorMap[n.type] || colorMap.note;
            const size = Math.min(38, Math.max(16, 16 + (n.recall_score || 0) * 3));
            return {
              id: n.id,
              label: n.label,
              title: '[' + n.type.toUpperCase() + '] ' + n.label + '\\n\\n' + n.content.substring(0, 150) + '...',
              shape: 'dot',
              size: size,
              color: colors,
              font: { size: 12, color: isDark ? '#f3f4f6' : '#1f2937', face: 'Tajawal' },
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
              color: isDark ? 'rgba(156, 163, 175, 0.45)' : 'rgba(107, 114, 128, 0.45)',
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
            nodes: {
              scaling: { min: 14, max: 40 }
            },
            edges: {
              selectionWidth: 2.5
            },
            physics: {
              enabled: this.physicsEnabled,
              solver: 'forceAtlas2Based',
              forceAtlas2Based: {
                gravitationalConstant: -40,
                centralGravity: 0.008,
                springLength: 95,
                springConstant: 0.06,
                damping: 0.45
              },
              stabilization: { iterations: 90 }
            },
            interaction: {
              hover: true,
              tooltipDelay: 150,
              zoomView: true,
              dragView: true
            }
          };

          if (this.network) {
            this.network.setData(data);
          } else {
            this.network = new vis.Network(container, data, options);

            this.network.on('click', (params) => {
              if (params.nodes && params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const found = this.rawGraphData.nodes.find(n => n.id === nodeId);
                if (found) {
                  this.selectedNode = found;
                }
              }
            });

            this.network.on('doubleClick', (params) => {
              if (params.nodes && params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                this.network.focus(nodeId, { scale: 1.5, animation: true });
              }
            });
          }
        }
      };
    }
  </script>
</body>
</html>`;
}
