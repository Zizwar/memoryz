export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemoryZ v2 — Living Agentic Memory & Task Substrate</title>
  <script>
    (function() {
      const savedTheme = localStorage.getItem('memoryz_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    })();
  </script>
  
  <!-- Fonts & Core UI Libraries: Tailwind, DaisyUI 4, FontAwesome 6, Alpine.js -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
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
    body { font-family: 'Tajawal', sans-serif; }
    .mono { font-family: 'Fira Code', monospace; direction: ltr; text-align: left; }
    .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: oklch(var(--bc) / 0.18); border-radius: 4px; }
  </style>
</head>

<body class="min-h-screen bg-base-100 text-base-content flex flex-col antialiased selection:bg-primary selection:text-primary-content"
      x-data="memoryzApp()"
      x-init="initApp()"
      x-cloak>

  <!-- TOP NAVBAR -->
  <header class="navbar bg-base-200/90 backdrop-blur border-b border-base-300 sticky top-0 z-40 px-3 sm:px-6 h-14 min-h-14">
    <!-- Brand -->
    <div class="flex-1 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center font-black shadow-md shadow-primary/20 text-sm">
        <i class="fa-solid fa-brain"></i>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-base sm:text-lg font-black tracking-tight">Memory<span class="text-primary">Z</span></span>
        <span class="badge badge-primary badge-xs font-mono font-bold tracking-wider">v2</span>
      </div>
    </div>

    <!-- Right Actions / Status Bar (Clean: Icon-only indicators to prevent breaking layout) -->
    <div class="flex-none flex items-center gap-0.5 sm:gap-1.5">
      <!-- Direct MCP Single URL Copier -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="نسخ رابط MCP المباشر"
              @click="copyDirectMcpUrl()">
        <i class="fa-solid fa-bolt text-warning text-xs sm:text-sm"></i>
      </button>

      <!-- Direct Skill File Link Copier (Token-free) -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="نسخ رابط Skill (skill.md للوكلاء)"
              @click="copySkillUrl()">
        <i class="fa-solid fa-scroll text-accent text-xs sm:text-sm"></i>
      </button>

      <!-- Documentation Portal (Opens in New Tab) -->
      <a href="/docs" target="_blank" rel="noopener"
         class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="دليل التوثيق والربط (Docs)">
        <i class="fa-solid fa-book-open text-info text-xs sm:text-sm"></i>
      </a>

      <!-- GitHub Repo Link -->
      <a href="https://github.com/Zizwar/memoryz" target="_blank" rel="noopener noreferrer"
         class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="مستودع GitHub">
        <i class="fa-brands fa-github text-xs sm:text-sm"></i>
      </a>

      <!-- NPM Package Link -->
      <a href="https://www.npmjs.com/package/memoryz" target="_blank" rel="noopener noreferrer"
         class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="حزمة NPM (memoryz)">
        <i class="fa-brands fa-npm text-sm sm:text-base text-error"></i>
      </a>

      <!-- Token Economy Indicator (Compact) -->
      <div class="badge badge-outline badge-xs sm:badge-sm font-mono gap-1 tooltip tooltip-bottom" data-tip="حالة استهلاك التوكن في الذاكرة الحية">
        <i class="fa-solid fa-microchip text-[10px] text-info"></i>
        <span x-text="'~' + (totalMemories * 18) + 't'"></span>
      </div>

      <!-- Theme Switcher (Dark / Light Mode) -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom"
              :data-tip="theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'"
              @click="toggleTheme()">
        <i class="fa-solid text-xs sm:text-sm" :class="theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-primary'"></i>
      </button>

      <!-- User Avatar / Auth Indicator (Minimalist: Icon only, no long text) -->
      <template x-if="currentUser">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-xs sm:btn-sm btn-circle avatar tooltip tooltip-bottom" :data-tip="currentUser.username">
            <div class="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-xs uppercase">
              <span x-text="currentUser.username.substring(0, 2)"></span>
            </div>
          </div>
          <ul tabindex="0" class="dropdown-content z-50 menu p-2 shadow-2xl bg-base-200 border border-base-300 rounded-box w-56 text-xs mt-2">
            <li class="menu-title flex items-center justify-between">
              <span class="truncate font-semibold" x-text="currentUser.username"></span>
              <span class="badge badge-primary badge-xs" x-text="currentUser.role"></span>
            </li>
            <li><a @click="switchTab('connect')"><i class="fa-solid fa-key"></i> مفتاح API</a></li>
            <template x-if="currentUser.role === 'admin'">
              <li><a @click="switchTab('admin')"><i class="fa-solid fa-crown text-warning"></i> لوحة المدير</a></li>
            </template>
            <li class="border-t border-base-300 mt-1 pt-1">
              <a @click="logout()" class="text-error"><i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج</a>
            </li>
          </ul>
        </div>
      </template>

      <template x-if="!currentUser">
        <button class="btn btn-primary btn-xs sm:btn-sm gap-1.5" @click="openAuthModal('login')">
          <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
          <span class="hidden sm:inline">دخول</span>
        </button>
      </template>
    </div>
  </header>

  <!-- MAIN WRAPPER -->
  <main class="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">

    <!-- NAVIGATION CARDS (Responsive Grid, Mobile-Friendly, No Horizontal Overflow) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      <!-- 1. الذاكرة الحية -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'memories' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('memories')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'memories' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-brain"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'memories' ? 'badge-primary' : 'badge-ghost'"
                x-text="totalMemories"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">الذاكرة الحية</div>
          <div class="text-[10px] text-base-content/60 truncate">فيكتور واسترجاع</div>
        </div>
      </button>

      <!-- 2. المهام والـ TODO -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'tasks' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('tasks')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'tasks' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'tasks' ? 'badge-primary' : 'badge-ghost'"
                x-text="tasksCount"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">المهام و TODO</div>
          <div class="text-[10px] text-base-content/60 truncate">شجرة مهام مقتصدة</div>
        </div>
      </button>

      <!-- 3. السياق والسجلات -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'context' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('context')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'context' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">Pack</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">السياق والسجلات</div>
          <div class="text-[10px] text-base-content/60 truncate">Logs وحزم السياق</div>
        </div>
      </button>

      <!-- 4. المحاكي -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'agent' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('agent')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'agent' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-robot"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">Sim</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">محاكي الوكلاء</div>
          <div class="text-[10px] text-base-content/60 truncate">اختبار الذاكرة الحية</div>
        </div>
      </button>

      <!-- 5. الخزنة -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'vault' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('vault')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'vault' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">ZK</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">الخزنة المشفرة</div>
          <div class="text-[10px] text-base-content/60 truncate">AES-256-GCM</div>
        </div>
      </button>

      <!-- 6. الربط و MCP -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'connect' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('connect')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'connect' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-terminal"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">CLI</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">الربط و MCP</div>
          <div class="text-[10px] text-base-content/60 truncate">Cursor و Claude</div>
        </div>
      </button>

      <!-- 7. لوحة المدير (مشروطة) -->
      <template x-if="currentUser && currentUser.role === 'admin'">
        <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98] col-span-2 sm:col-span-1"
                :class="activeTab === 'admin' ? 'border-warning bg-warning/10 ring-1 ring-warning' : 'border-base-300 hover:border-warning/40'"
                @click="switchTab('admin')">
          <div class="flex items-center justify-between w-full">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                 :class="activeTab === 'admin' ? 'bg-warning text-warning-content' : 'bg-base-300 text-warning'">
              <i class="fa-solid fa-crown"></i>
            </div>
            <span class="badge badge-xs badge-warning font-mono">Root</span>
          </div>
          <div>
            <div class="font-bold text-xs sm:text-sm tracking-tight text-warning">لوحة المدير</div>
            <div class="text-[10px] text-base-content/60 truncate">إدارة النظام</div>
          </div>
        </button>
      </template>
    </div>

    <!-- Active Section Action Header (Compact & Responsive) -->
    <div class="flex items-center justify-between gap-2 bg-base-200/60 border border-base-300 px-3.5 py-2.5 rounded-xl">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs sm:text-sm font-bold text-base-content/90 truncate" x-text="
          activeTab === 'memories' ? 'الذاكرة الحية والمتجهات (Vector Memories)' :
          activeTab === 'tasks' ? 'شجرة المهام وتنسيق الوكلاء (Tasks & Multi-Agent TODOs)' :
          activeTab === 'context' ? 'حزم السياق والسجلات اللحظية (Context Packs & Logs)' :
          activeTab === 'agent' ? 'محاكي الاسترجاع واستجابة الوكلاء (Agent Simulator)' :
          activeTab === 'vault' ? 'الخزنة السرية المشفرة (Zero-Knowledge Secret Vault)' :
          activeTab === 'connect' ? 'تهيئة بروتوكول MCP وأدوات CLI' : 'لوحة إدارة النظام'
        "></span>
      </div>

      <div class="flex items-center gap-1.5 flex-none">
        <template x-if="activeTab === 'memories'">
          <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openMemoryModal()">
            <i class="fa-solid fa-plus text-xs"></i> <span>ذاكرة جديدة</span>
          </button>
        </template>

        <template x-if="activeTab === 'tasks'">
          <button class="btn btn-success btn-xs sm:btn-sm text-success-content gap-1 shadow-sm" @click="openTaskModal()">
            <i class="fa-solid fa-plus text-xs"></i> <span>مهمة جديدة</span>
          </button>
        </template>

        <template x-if="activeTab === 'vault'">
          <button class="btn btn-secondary btn-xs sm:btn-sm gap-1" @click="openVaultModal()">
            <i class="fa-solid fa-lock text-xs"></i> <span>مفتاح سري</span>
          </button>
        </template>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 1: MEMORIES VIEW -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'memories'" class="space-y-4">
      <!-- Search & Filter Controls -->
      <div class="card bg-base-200 border border-base-300 p-3 sm:p-4 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div class="join flex-1">
            <span class="join-item bg-base-300 border border-base-300 px-3 flex items-center text-base-content/50">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input type="text" class="input input-sm sm:input-md input-bordered join-item flex-1 focus:outline-none"
                   placeholder="بحث دلالي بالذكاء الاصطناعي (Gemini 768-dim)..."
                   x-model="memoryQuery"
                   @keyup.enter="searchMemories()">
            <button class="btn btn-sm sm:btn-md btn-primary join-item gap-1" @click="searchMemories()">
              <span x-show="!loadingMemories">بحث</span>
              <span class="loading loading-spinner loading-xs" x-show="loadingMemories"></span>
            </button>
          </div>

          <!-- Type filter pills -->
          <div class="join join-horizontal overflow-x-auto scrollbar-thin">
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('all')">الكل</button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'env' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('env')">بيئة (env)</button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'preference' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('preference')">تفضيل</button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'skill' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('skill')">مهارة</button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'note' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('note')">ملاحظة</button>
          </div>
        </div>
      </div>

      <!-- Memories Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <template x-for="m in filteredMemories" :key="m.hash">
          <div class="card bg-base-200 border border-base-300 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
            <div class="card-body p-4 flex flex-col justify-between gap-2.5">
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="badge badge-sm font-semibold uppercase tracking-wider"
                        :class="{
                          'badge-info text-info-content': m.type === 'env',
                          'badge-accent text-accent-content': m.type === 'preference',
                          'badge-primary text-primary-content': m.type === 'skill',
                          'badge-secondary text-secondary-content': m.type === 'note'
                        }"
                        x-text="m.type"></span>
                  <span class="font-bold text-sm text-base-content truncate max-w-[200px]" x-text="m.title || m.hash.substring(0, 8)"></span>
                </div>
                <div class="flex items-center gap-1 opacity-80">
                  <span class="badge badge-ghost badge-xs font-mono gap-1" title="مرات الاستدعاء">
                    <i class="fa-solid fa-fire text-amber-500 text-[10px]"></i>
                    <span x-text="m.recall_count"></span>
                  </span>
                  <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteMemory(m.hash)" title="حذف">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>

              <!-- Content -->
              <p class="text-xs sm:text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed" x-text="m.content"></p>

              <!-- Footer Meta -->
              <div class="flex items-center justify-between pt-2 border-t border-base-300/60 text-[11px] text-base-content/50 font-mono">
                <span x-text="'#' + m.hash.substring(0, 8)"></span>
                <span x-text="formatDate(m.created_at)"></span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div x-show="filteredMemories.length === 0 && !loadingMemories" class="card bg-base-200 border border-base-300 p-8 text-center text-base-content/60">
        <i class="fa-solid fa-box-open text-3xl mb-2 text-base-content/30"></i>
        <span>لا توجد ذكريات تطابق هذا البحث أو التصنيف.</span>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 2: HIERARCHICAL TASKS & MULTI-AGENT TODOS -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'tasks'" class="space-y-4">
      <!-- Status Filter Bar -->
      <div class="card bg-base-200 border border-base-300 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-success/20 text-success flex items-center justify-center font-bold">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div>
            <div class="font-bold text-sm">شجرة المهام وتنسيق الوكلاء</div>
            <div class="text-[11px] text-base-content/60">بنية هرمية تدعم التفريع لأي عمق مع استهلاك توكن ضئيل جداً</div>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select class="select select-sm select-bordered w-full sm:w-auto text-xs" x-model="taskStatusFilter" @change="loadTasks()">
            <option value="">جميع الحالات</option>
            <option value="active">النشطة (Active)</option>
            <option value="todo">في الانتظار (todo)</option>
            <option value="in_progress">قيد التنفيذ (in_progress)</option>
            <option value="done">المكتملة (done)</option>
            <option value="blocked">المعلقة (blocked)</option>
          </select>
        </div>
      </div>

      <!-- Task Hierarchy List -->
      <div class="card bg-base-200 border border-base-300 p-4 shadow-sm space-y-2.5">
        <template x-for="t in taskTree" :key="t.id">
          <div class="space-y-2">
            <!-- Root Task Card -->
            <div class="p-3 rounded-xl border border-base-300 bg-base-100/60 hover:bg-base-100 transition-colors flex items-start justify-between gap-3"
                 :class="{ 'opacity-60': isTaskDone(t.status) }">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5"
                       :checked="isTaskDone(t.status)"
                       @change="toggleTaskStatus(t)">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-bold text-sm text-base-content truncate"
                          :class="{ 'line-through text-base-content/50': isTaskDone(t.status) }"
                          x-text="t.title"></span>
                    <span class="badge badge-xs font-mono" :class="getTaskBadgeClass(t.status)" x-text="t.status"></span>
                    <span class="badge badge-outline badge-xs font-mono" x-text="t.priority"></span>
                    <template x-if="t.assignee">
                      <span class="badge badge-ghost badge-xs gap-1 font-mono">
                        <i class="fa-solid fa-robot text-[9px] text-primary"></i>
                        <span x-text="'@' + t.assignee"></span>
                      </span>
                    </template>
                  </div>
                  <template x-if="t.description">
                    <p class="text-xs text-base-content/70 mt-1 leading-relaxed" x-text="t.description"></p>
                  </template>
                </div>
              </div>

              <!-- Task Actions -->
              <div class="flex items-center gap-1 flex-none">
                <button class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" data-tip="إضافة مهمة فرعية" @click="openTaskModal(t.id)">
                  <i class="fa-solid fa-folder-plus text-xs text-primary"></i>
                </button>
                <button class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom text-error" data-tip="حذف المهمة" @click="deleteTask(t.id)">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Subtasks (Children) -->
            <template x-if="t.children && t.children.length > 0">
              <div class="mr-6 pr-3 border-r-2 border-primary/30 space-y-2">
                <template x-for="sub in t.children" :key="sub.id">
                  <div class="p-2.5 rounded-lg border border-base-300 bg-base-100/40 hover:bg-base-100 transition-colors flex items-start justify-between gap-2"
                       :class="{ 'opacity-60': isTaskDone(sub.status) }">
                    <div class="flex items-start gap-2.5 flex-1 min-w-0">
                      <input type="checkbox" class="checkbox checkbox-xs checkbox-primary mt-0.5"
                             :checked="isTaskDone(sub.status)"
                             @change="toggleTaskStatus(sub)">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="text-xs font-semibold" :class="{ 'line-through text-base-content/50': isTaskDone(sub.status) }" x-text="sub.title"></span>
                          <span class="badge badge-xs font-mono" :class="getTaskBadgeClass(sub.status)" x-text="sub.status"></span>
                          <template x-if="sub.assignee">
                            <span class="badge badge-ghost badge-xs gap-1 font-mono">
                              <i class="fa-solid fa-robot text-[9px] text-primary"></i>
                              <span x-text="'@' + sub.assignee"></span>
                            </span>
                          </template>
                        </div>
                      </div>
                    </div>
                    <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteTask(sub.id)">
                      <i class="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>

        <div x-show="taskTree.length === 0 && !loadingTasks" class="p-8 text-center text-base-content/60">
          <i class="fa-solid fa-clipboard-check text-3xl mb-2 text-base-content/30"></i>
          <div>لا توجد مهام مسجلة بعد. أنشئ مهمة جديدة لتوجيه الوكلاء!</div>
        </div>
      </div>

      <!-- AI Token-Optimized Tree Preview (Visual proof of token economy) -->
      <div class="card bg-base-200 border border-base-300 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 text-xs font-bold text-primary">
            <i class="fa-solid fa-code"></i>
            <span>الصيغة الشجرية فائقة الضغط لاستدعاء النماذج (ASCII Tree Format)</span>
          </div>
          <button class="btn btn-ghost btn-xs gap-1" @click="copyText(taskAsciiPreview)">
            <i class="fa-solid fa-copy text-xs"></i> <span>نسخ</span>
          </button>
        </div>
        <pre class="bg-base-300 p-3 rounded-lg text-xs mono text-base-content/80 overflow-x-auto max-h-44" x-text="taskAsciiPreview || '(لا توجد مهام)'"></pre>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 3: CONTEXT PACKS & EPHEMERAL LOGS -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'context'" class="space-y-4">
      <!-- 1. Context Pack Generator -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-info/20 text-info flex items-center justify-center font-bold">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <div>
            <div class="font-bold text-sm">مولّد حزم السياق المضغوطة (Token-Budgeted Context Pack)</div>
            <div class="text-[11px] text-base-content/60">يدمج المهام المتبقية والذكريات المطابقة بدقة دون كسر نافذة السياق</div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input type="text" class="input input-sm input-bordered sm:col-span-6"
                 placeholder="موضوع أو مهمة الوكيل (مثلاً: مصادقة المستخدم)..."
                 x-model="contextQuery"
                 @keyup.enter="generateContextPack()">

          <select class="select select-sm select-bordered sm:col-span-3 text-xs" x-model="contextFormat">
            <option value="xml">صيغة XML (للنصوص والبرومبت)</option>
            <option value="markdown">صيغة Markdown</option>
            <option value="compact">نص فائق الضغط (Compact)</option>
          </select>

          <input type="number" class="input input-sm input-bordered sm:col-span-2 font-mono text-center"
                 placeholder="ميزانية التوكن"
                 x-model="contextBudget">

          <button class="btn btn-sm btn-primary sm:col-span-1 gap-1" @click="generateContextPack()">
            <span x-show="!loadingContext">توليد</span>
            <span class="loading loading-spinner loading-xs" x-show="loadingContext"></span>
          </button>
        </div>

        <!-- Result Box -->
        <div x-show="contextResult" class="space-y-2 pt-2">
          <div class="flex items-center justify-between text-xs font-mono text-base-content/70">
            <span x-text="contextStats"></span>
            <button class="btn btn-ghost btn-xs gap-1" @click="copyText(contextResult)">
              <i class="fa-solid fa-copy text-xs"></i> <span>نسخ الحزمة</span>
            </button>
          </div>
          <pre class="bg-base-300 p-3 rounded-lg text-xs mono text-base-content/90 overflow-x-auto max-h-60" x-text="contextResult"></pre>
        </div>
      </div>

      <!-- 2. Ephemeral Logs & Scratchpad -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center font-bold">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <div class="font-bold text-sm">السجلات المؤقتة وتتبعات الوكلاء (Ephemeral Logs)</div>
              <div class="text-[11px] text-base-content/60">بيانات وتتبعات سريعة بدون تكلفة فيكتور وبدون استهلاك لكوتة التضمين</div>
            </div>
          </div>

          <div class="join">
            <input type="text" class="input input-sm input-bordered join-item w-48 sm:w-64 text-xs"
                   placeholder="تسجيل لوغ أو ملاحظة سريعة..."
                   x-model="quickLogMessage"
                   @keyup.enter="appendQuickLog()">
            <button class="btn btn-sm btn-secondary join-item gap-1" @click="appendQuickLog()">
              <i class="fa-solid fa-plus text-xs"></i> <span>تسجيل</span>
            </button>
          </div>
        </div>

        <!-- Logs stream -->
        <div class="bg-base-300/80 rounded-xl p-3 border border-base-300 font-mono text-xs max-h-56 overflow-y-auto scrollbar-thin space-y-1.5">
          <template x-for="log in logsList" :key="log.id">
            <div class="flex items-start gap-2 leading-relaxed">
              <span class="text-base-content/40 text-[10px]" x-text="formatTime(log.created_at)"></span>
              <span class="badge badge-xs uppercase font-bold"
                    :class="{
                      'badge-error': log.level === 'error',
                      'badge-warning': log.level === 'warn',
                      'badge-info': log.level === 'info',
                      'badge-ghost': log.level === 'debug'
                    }"
                    x-text="log.level"></span>
              <span class="text-primary text-xs" x-text="'[' + log.source + ']'"></span>
              <span class="text-base-content/90 flex-1 truncate" x-text="log.message"></span>
            </div>
          </template>
          <div x-show="logsList.length === 0" class="text-center py-4 text-base-content/40">
            (لا توجد سجلات مؤقتة مسجلة)
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 4: AGENT SIMULATOR -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'agent'" class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <div class="font-bold text-sm">محاكي استدعاء الوكلاء الذكية (Agent Recall Stream)</div>
          <div class="text-[11px] text-base-content/60">محاكاة حية لكيفية استرجاع Cursor وClaude Code للذاكرة وتعزيز أوزانها اللحظية</div>
        </div>
      </div>

      <div class="join w-full">
        <input type="text" class="input input-sm sm:input-md input-bordered join-item flex-1 focus:outline-none"
               placeholder="جرب كتابة: ما هو بورت الاختبار أو تفضيل تنسيق الكود..."
               x-model="simulatorQuery"
               @keyup.enter="runSimulator()">
        <button class="btn btn-sm sm:btn-md btn-primary join-item gap-1" @click="runSimulator()">
          <span x-show="!loadingSimulator">استدعاء ⚡</span>
          <span class="loading loading-spinner loading-xs" x-show="loadingSimulator"></span>
        </button>
      </div>

      <!-- Simulator Recall Results -->
      <div x-show="simulatorResults.length > 0" class="space-y-3 pt-2">
        <div class="text-xs font-bold text-base-content/70">الذكريات المسترجعة والمعززة:</div>
        <div class="grid grid-cols-1 gap-2.5">
          <template x-for="r in simulatorResults" :key="r.hash">
            <div class="p-3 bg-base-100 rounded-lg border border-primary/30 flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-primary" x-text="r.title || r.hash.substring(0, 8)"></span>
                <span class="badge badge-sm badge-success font-mono gap-1">
                  <i class="fa-solid fa-bolt text-[10px]"></i>
                  <span x-text="'Score: ' + (r.recall_score || 0)"></span>
                </span>
              </div>
              <p class="text-xs text-base-content/80" x-text="r.content"></p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 5: ZERO-KNOWLEDGE VAULT -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'vault'" class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-error/20 text-error flex items-center justify-center font-bold">
            <i class="fa-solid fa-vault"></i>
          </div>
          <div>
            <div class="font-bold text-sm">الخزنة المشفرة بانعدام المعرفة (Zero-Knowledge Secret Vault)</div>
            <div class="text-[11px] text-base-content/60">تشفير AES-256-GCM للبيانات الحساسة والمفاتيح السرية مع عزل تام عن الفيكتور</div>
          </div>
        </div>

        <button class="btn btn-sm btn-error text-error-content gap-1 shadow-sm" @click="openVaultModal()">
          <i class="fa-solid fa-plus text-xs"></i> <span>تشفير سر جديد</span>
        </button>
      </div>

      <!-- Vault Keys List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <template x-for="k in vaultKeys" :key="k.key_name">
          <div class="card bg-base-100 border border-base-300 p-3.5 flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-sm text-base-content truncate" x-text="k.key_name"></span>
              <span class="badge badge-outline badge-xs font-mono">AES-GCM</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-base-300 text-xs">
              <button class="btn btn-primary btn-xs gap-1" @click="openDecryptModal(k.key_name)">
                <i class="fa-solid fa-unlock-keyhole text-[11px]"></i> <span>فك التشفير</span>
              </button>
              <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteVaultKey(k.key_name)">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div x-show="vaultKeys.length === 0 && !loadingVault" class="p-8 text-center text-base-content/60">
        <i class="fa-solid fa-lock text-3xl mb-2 text-base-content/30"></i>
        <div>لا توجد مفاتيح مشفرة مخزنة حالياً في الخزنة.</div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 6: CONNECT & MCP SETTINGS -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'connect'" class="space-y-4">
      <!-- 1. Direct Single-URL Remote MCP Connector (Perfect for Mobile / Web LLMs) -->
      <div class="card bg-gradient-to-br from-primary/10 via-base-200 to-base-200 border border-primary/30 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold">
              <i class="fa-solid fa-mobile-screen"></i>
            </div>
            <div>
              <div class="font-bold text-sm">رابط MCP المباشر للموبايل والويب (Single URL Remote MCP)</div>
              <div class="text-[11px] text-base-content/60">رابط واحد متكامل يدعم Claude Mobile وChatGPT وLibreChat دون الحاجة لملفات محلية</div>
            </div>
          </div>
          <span class="badge badge-primary badge-sm font-mono">Streamable HTTP</span>
        </div>

        <div class="join w-full">
          <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                 readonly :value="getDirectMcpUrl()">
          <button class="btn btn-sm btn-primary join-item gap-1" @click="copyText(getDirectMcpUrl())">
            <i class="fa-solid fa-copy text-xs"></i> <span>نسخ</span>
          </button>
        </div>
      </div>

      <!-- 2. OpenAPI 3.1 Connector for ChatGPT Mobile Custom Actions -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center font-bold">
              <i class="fa-solid fa-plug"></i>
            </div>
            <div>
              <div class="font-bold text-sm">رابط موصل ChatGPT Actions (OpenAPI 3.1)</div>
              <div class="text-[11px] text-base-content/60">الصقه في Actions &rarr; Import from URL في Custom GPT</div>
            </div>
          </div>
        </div>

        <div class="join w-full">
          <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                 readonly :value="getOpenApiUrl()">
          <button class="btn btn-sm btn-secondary join-item gap-1" @click="copyText(getOpenApiUrl())">
            <i class="fa-solid fa-copy text-xs"></i> <span>نسخ</span>
          </button>
        </div>
      </div>

      <!-- 3. Desktop Cursor & Terminal Configuration -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center font-bold">
            <i class="fa-solid fa-terminal"></i>
          </div>
          <div>
            <div class="font-bold text-sm">إعداد أجهزة الديسكتوب (Cursor / Claude Code / CLI)</div>
            <div class="text-[11px] text-base-content/60">أمر التثبيت التلقائي والتكوين عبر الطرفية</div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-xs font-semibold">تثبيت وإعداد تلقائي فوري:</div>
          <div class="join w-full">
            <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                   readonly :value="'npx memoryz init --token=' + (currentUser?.api_key || 'YOUR_TOKEN')">
            <button class="btn btn-sm btn-ghost join-item" @click="copyText('npx memoryz init --token=' + (currentUser?.api_key || 'YOUR_TOKEN'))">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Token-Free Skill File for Autonomous Agents (skill.md) -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center font-bold">
              <i class="fa-solid fa-scroll"></i>
            </div>
            <div>
              <div class="font-bold text-sm">ملف المهارة لوكلاء الذكاء الاصطناعي (skill.md)</div>
              <div class="text-[11px] text-base-content/60">ملف توجيهي عام خالٍ تماماً من المفاتيح السرية والـ Tokens لتثبيته في بيئات الوكلاء</div>
            </div>
          </div>
          <span class="badge badge-accent badge-sm font-mono">Agent Skill</span>
        </div>

        <div class="join w-full">
          <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                 readonly :value="window.location.origin + '/skill.md'">
          <a :href="'/skill.md?download=true'" class="btn btn-sm btn-accent join-item gap-1">
            <i class="fa-solid fa-download text-xs"></i> <span>تحميل</span>
          </a>
          <button class="btn btn-sm btn-ghost join-item" @click="copySkillUrl()">
            <i class="fa-solid fa-copy text-xs"></i>
          </button>
        </div>

        <div class="space-y-1.5 pt-1">
          <div class="text-xs font-semibold">تثبيت سريع في مجلد مهارات الوكيل:</div>
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre data-prefix="$"><code>mkdir -p .agents/skills/memoryz && curl -sSL https://memoryz.wino.deno.net/skill.md > .agents/skills/memoryz/SKILL.md</code></pre>
            <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText('mkdir -p .agents/skills/memoryz && curl -sSL https://memoryz.wino.deno.net/skill.md > .agents/skills/memoryz/SKILL.md')">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-base-300 flex-wrap gap-2">
          <span class="text-xs text-base-content/60">تريد تفاصيل أكثر حول الربط بالوكلاء أو الكود؟</span>
          <a href="/docs" target="_blank" class="btn btn-outline btn-xs sm:btn-sm gap-1.5">
            <i class="fa-solid fa-book-open text-xs"></i> <span>فتح دليل التوثيق الشامل (Docs)</span>
          </a>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- TAB 7: ADMIN CONTROL PLANE -->
    <!-- ============================================================= -->
    <template x-if="currentUser && currentUser.role === 'admin'">
      <div x-show="activeTab === 'admin'" class="space-y-4">
        <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center font-bold">
              <i class="fa-solid fa-crown"></i>
            </div>
            <div>
              <div class="font-bold text-sm">لوحة تحكم المدير (MemoryZ Control Plane)</div>
              <div class="text-[11px] text-base-content/60">إحصائيات المنصة، مستخدمي النظام، ومراقبة النشاط</div>
            </div>
          </div>

          <!-- Quick Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs">إجمالي المستخدمين</div>
              <div class="stat-value text-lg text-primary" x-text="adminStats.total_users || 0"></div>
            </div>
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs">إجمالي الذكريات</div>
              <div class="stat-value text-lg text-secondary" x-text="adminStats.total_memories || 0"></div>
            </div>
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs">أسرار الخزنة</div>
              <div class="stat-value text-lg text-accent" x-text="adminStats.total_vault_entries || 0"></div>
            </div>
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs">حجم الفهارس</div>
              <div class="stat-value text-lg text-info">768d</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </main>

  <!-- ============================================================= -->
  <!-- MODALS (DaisyUI standard modal dialogs) -->
  <!-- ============================================================= -->

  <!-- Modal: Memory Form (New / Edit) -->
  <dialog class="modal" :class="{ 'modal-open': modals.memory }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-lg">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-brain text-primary"></i>
        <span>إضافة ذرة ذاكرة جديدة</span>
      </h3>
      <form @submit.prevent="saveMemory()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text">نوع الذاكرة</span></label>
          <select class="select select-sm select-bordered" x-model="formMemory.type">
            <option value="env">بيئة العمل وأوامر النظام (env)</option>
            <option value="preference">تفضيل المطور والقواعد (preference)</option>
            <option value="skill">مهارة وأداة وكيل (skill)</option>
            <option value="note">ملاحظة ومعلومة حرة (note)</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">العنوان (اختياري)</span></label>
          <input type="text" class="input input-sm input-bordered" placeholder="مثلاً: staging_database_port" x-model="formMemory.title">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">محتوى الذاكرة (سيتم توليد تمثيل فيكتور 768-dim)</span></label>
          <textarea class="textarea textarea-sm textarea-bordered h-24" placeholder="المعرفة أو القاعدة التي تريد للوكلاء تذكرها دائماً..." required x-model="formMemory.content"></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.memory = false">إلغاء</button>
          <button type="submit" class="btn btn-primary btn-sm">حفظ الذاكرة</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.memory = false"><button>إغلاق</button></form>
  </dialog>

  <!-- Modal: Task Form (New / Subtask) -->
  <dialog class="modal" :class="{ 'modal-open': modals.task }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-lg">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-list-check text-success"></i>
        <span x-text="formTask.parent_id ? 'إضافة مهمة فرعية (Subtask)' : 'إضافة مهمة جديدة'"></span>
      </h3>
      <form @submit.prevent="saveTask()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text">عنوان المهمة</span></label>
          <input type="text" class="input input-sm input-bordered" placeholder="مثلاً: كتابة وتجهيز اختبارات الوحدة..." required x-model="formTask.title">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="form-control">
            <label class="label"><span class="label-text">الحالة</span></label>
            <select class="select select-sm select-bordered" x-model="formTask.status">
              <option value="todo">في الانتظار (todo)</option>
              <option value="in_progress">قيد التنفيذ (in_progress)</option>
              <option value="done">مكتملة (done)</option>
              <option value="blocked">معلقة (blocked)</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">الأولوية</span></label>
            <select class="select select-sm select-bordered" x-model="formTask.priority">
              <option value="medium">متوسطة</option>
              <option value="high">مرتفعة</option>
              <option value="urgent">عاجلة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">الوكيل المسند إليه (Assignee)</span></label>
          <input type="text" class="input input-sm input-bordered font-mono" placeholder="مثلاً: cursor, claude, architect" x-model="formTask.assignee">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">تفاصيل / متطلبات المهمة</span></label>
          <textarea class="textarea textarea-sm textarea-bordered h-20" placeholder="خطوات الإنجاز، شروط القبول، أو روابط مرجعية..." x-model="formTask.description"></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.task = false">إلغاء</button>
          <button type="submit" class="btn btn-success btn-sm text-success-content">حفظ المهمة</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.task = false"><button>إغلاق</button></form>
  </dialog>

  <!-- Modal: Vault Store Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.vault }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-lock text-error"></i>
        <span>تشفير سر في الخزنة (Zero-Knowledge)</span>
      </h3>
      <form @submit.prevent="saveVaultSecret()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text">اسم المفتاح (Identifier)</span></label>
          <input type="text" class="input input-sm input-bordered font-mono" placeholder="مثلاً: key_gemini أو db_password" required x-model="formVault.key_name">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">القيمة السرية المراد تشفيرها</span></label>
          <textarea class="textarea textarea-sm textarea-bordered font-mono h-20" placeholder="sk_live_... أو السر الخاص بك" required x-model="formVault.secret_value"></textarea>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">كلمة مرور التشفير (Client Passphrase)</span></label>
          <input type="password" class="input input-sm input-bordered" placeholder="لا يتم حفظها في الخادم مطلقاً" required x-model="formVault.passphrase">
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.vault = false">إلغاء</button>
          <button type="submit" class="btn btn-error btn-sm text-error-content">تشفير وحفظ</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.vault = false"><button>إغلاق</button></form>
  </dialog>

  <!-- Modal: Decrypt Secret Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.decrypt }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-unlock-keyhole text-primary"></i>
        <span x-text="'فك تشفير: ' + decryptKeyName"></span>
      </h3>
      <form @submit.prevent="retrieveVaultSecret()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text">أدخل كلمة مرور التشفير (Passphrase)</span></label>
          <input type="password" class="input input-sm input-bordered" required x-model="decryptPassphrase">
        </div>

        <div x-show="decryptedResult" class="space-y-1.5 pt-2">
          <div class="label"><span class="label-text text-success font-bold">القيمة المفكوكة في الذاكرة الحية (RAM):</span></div>
          <div class="join w-full">
            <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs" readonly :value="decryptedResult">
            <button type="button" class="btn btn-sm btn-ghost join-item" @click="copyText(decryptedResult)">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.decrypt = false">إغلاق</button>
          <button type="submit" class="btn btn-primary btn-sm">فك التشفير 🔓</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.decrypt = false"><button>إغلاق</button></form>
  </dialog>

  <!-- Modal: Auth (Login / Register) -->
  <dialog class="modal" :class="{ 'modal-open': modals.auth }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-sm">
      <div class="tabs tabs-boxed mb-3 p-1">
        <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': authMode === 'login' }" @click="authMode = 'login'">دخول</a>
        <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': authMode === 'register' }" @click="authMode = 'register'">حساب جديد</a>
      </div>

      <form @submit.prevent="submitAuth()" class="space-y-3 text-xs">
        <template x-if="authMode === 'register'">
          <div class="form-control">
            <label class="label"><span class="label-text">اسم المستخدم</span></label>
            <input type="text" class="input input-sm input-bordered" required x-model="authForm.username">
          </div>
        </template>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="authMode === 'register' ? 'البريد الإلكتروني' : 'اسم المستخدم أو البريد'"></span></label>
          <input type="text" class="input input-sm input-bordered" required x-model="authForm.identifier">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">كلمة المرور</span></label>
          <input type="password" class="input input-sm input-bordered" required x-model="authForm.password">
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.auth = false">إلغاء</button>
          <button type="submit" class="btn btn-primary btn-sm" x-text="authMode === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول'"></button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.auth = false"><button>إغلاق</button></form>
  </dialog>

  <!-- Toast Notification (Minimalist) -->
  <div class="toast toast-end toast-bottom z-50 pointer-events-none" x-show="toast.show" x-transition>
    <div class="alert alert-info py-2 px-4 shadow-lg text-xs font-semibold gap-2">
      <i class="fa-solid fa-circle-check text-success"></i>
      <span x-text="toast.message"></span>
    </div>
  </div>

  <!-- ALPINE.JS COMPONENT APPLICATION LOGIC -->
  <script>
    function memoryzApp() {
      return {
        // State
        activeTab: 'memories',
        theme: localStorage.getItem('memoryz_theme') || 'dark',
        authToken: localStorage.getItem('mz_token') || '',
        currentUser: null,
        
        // Memories
        memories: [],
        memoryFilter: 'all',
        memoryQuery: '',
        loadingMemories: false,
        totalMemories: 0,
        
        // Tasks
        tasks: [],
        taskTree: [],
        tasksCount: 0,
        taskAsciiPreview: '',
        taskStatusFilter: '',
        loadingTasks: false,
        
        // Context & Logs
        contextQuery: '',
        contextFormat: 'xml',
        contextBudget: 1200,
        contextResult: '',
        contextStats: '',
        loadingContext: false,
        logsList: [],
        quickLogMessage: '',
        
        // Simulator
        simulatorQuery: '',
        simulatorResults: [],
        loadingSimulator: false,
        
        // Vault
        vaultKeys: [],
        loadingVault: false,
        decryptKeyName: '',
        decryptPassphrase: '',
        decryptedResult: '',
        
        // Admin
        adminStats: {},

        // Modals
        modals: {
          memory: false,
          task: false,
          vault: false,
          decrypt: false,
          auth: false,
        },
        
        // Forms
        formMemory: { type: 'preference', title: '', content: '' },
        formTask: { parent_id: '', title: '', status: 'todo', priority: 'medium', assignee: '', description: '' },
        formVault: { key_name: '', secret_value: '', passphrase: '' },
        authMode: 'login',
        authForm: { username: '', identifier: '', password: '' },

        // Toast
        toast: { show: false, message: '' },

        showToast(msg) {
          this.toast.message = msg;
          this.toast.show = true;
          setTimeout(() => { this.toast.show = false; }, 3000);
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
        },

        async initApp() {
          this.theme = localStorage.getItem('memoryz_theme') || 'dark';
          document.documentElement.setAttribute('data-theme', this.theme);
          if (this.authToken) {
            await this.fetchMe();
          }
          await this.loadMemories();
          await this.loadTasks();
        },

        switchTab(tab) {
          this.activeTab = tab;
          if (tab === 'memories') this.loadMemories();
          if (tab === 'tasks') this.loadTasks();
          if (tab === 'context') this.loadLogs();
          if (tab === 'vault') this.loadVaultKeys();
          if (tab === 'admin') this.loadAdminStats();
        },

        // --- AUTH ---
        async fetchMe() {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { 'Authorization': 'Bearer ' + this.authToken }
            });
            if (res.ok) {
              const data = await res.json();
              this.currentUser = data.user;
            } else {
              this.logout();
            }
          } catch (_e) {}
        },

        openAuthModal(mode = 'login') {
          this.authMode = mode;
          this.modals.auth = true;
        },

        async submitAuth() {
          const endpoint = this.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
          const payload = this.authMode === 'register'
            ? { username: this.authForm.username, email: this.authForm.identifier, password: this.authForm.password }
            : { identifier: this.authForm.identifier, password: this.authForm.password };

          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
              this.authToken = data.token;
              this.currentUser = data.user;
              localStorage.setItem('mz_token', this.authToken);
              this.modals.auth = false;
              this.showToast('مرحباً بك ' + this.currentUser.username + ' 👋');
              this.loadMemories();
              this.loadTasks();
            } else {
              alert(data.error || 'فشلت عملية المصادقة');
            }
          } catch (err) {
            alert(err.message);
          }
        },

        logout() {
          this.authToken = '';
          this.currentUser = null;
          localStorage.removeItem('mz_token');
          this.showToast('تم تسجيل الخروج');
        },

        // --- MEMORIES ---
        async loadMemories() {
          this.loadingMemories = true;
          try {
            const url = this.memoryQuery
              ? '/api/memories/recall?query=' + encodeURIComponent(this.memoryQuery)
              : '/api/memories';
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
          this.formMemory = { type: 'preference', title: '', content: '' };
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
              this.showToast('تم حفظ ذرة الذاكرة بنجاح ⚡');
              this.loadMemories();
            } else {
              const d = await res.json();
              alert(d.error);
            }
          } catch (err) {
            alert(err.message);
          }
        },

        async deleteMemory(hash) {
          if (!confirm('هل تريد حذف هذه الذاكرة؟')) return;
          try {
            const res = await fetch('/api/memories/' + hash, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + this.authToken }
            });
            if (res.ok) {
              this.showToast('تم حذف الذاكرة');
              this.loadMemories();
            }
          } catch (err) {
            alert(err.message);
          }
        },

        // --- TASKS ---
        async loadTasks() {
          this.loadingTasks = true;
          try {
            const url = '/api/tasks?format=tree' + (this.taskStatusFilter ? '&status=' + this.taskStatusFilter : '');
            const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
            const res = await fetch(url, { headers });
            if (res.ok) {
              const data = await res.json();
              this.taskTree = data.tree || [];
              this.taskAsciiPreview = data.ascii || '';
              
              // Count total tasks
              const flatRes = await fetch('/api/tasks', { headers });
              const flatData = await flatRes.json();
              this.tasks = flatData.tasks || [];
              this.tasksCount = this.tasks.filter(t => !this.isTaskDone(t.status)).length;
            }
          } catch (_e) {}
          this.loadingTasks = false;
        },

        isTaskDone(status) {
          return status && (status.toLowerCase() === 'done' || status.toLowerCase() === 'completed');
        },

        getTaskBadgeClass(status) {
          if (this.isTaskDone(status)) return 'badge-success text-success-content';
          if (status === 'in_progress') return 'badge-info text-info-content';
          if (status === 'blocked') return 'badge-error text-error-content';
          return 'badge-ghost';
        },

        openTaskModal(parentId = '') {
          this.formTask = { parent_id: parentId, title: '', status: 'todo', priority: 'medium', assignee: '', description: '' };
          this.modals.task = true;
        },

        async saveTask() {
          if (!this.authToken) return this.openAuthModal();
          try {
            const res = await fetch('/api/tasks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.authToken
              },
              body: JSON.stringify(this.formTask)
            });
            if (res.ok) {
              this.modals.task = false;
              this.showToast('تمت إضافة المهمة بنجاح 📋');
              this.loadTasks();
            } else {
              const d = await res.json();
              alert(d.error);
            }
          } catch (err) {
            alert(err.message);
          }
        },

        async toggleTaskStatus(task) {
          const next = this.isTaskDone(task.status) ? 'todo' : 'done';
          try {
            const res = await fetch('/api/tasks/' + task.id, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.authToken
              },
              body: JSON.stringify({ status: next })
            });
            if (res.ok) {
              this.showToast(next === 'done' ? 'أحسنت! تم إكمال المهمة ✓' : 'تمت إعادة فتح المهمة ⏳');
              this.loadTasks();
            }
          } catch (err) {
            console.error(err);
          }
        },

        async deleteTask(id) {
          if (!confirm('هل تريد حذف هذه المهمة وفروعها؟')) return;
          try {
            const res = await fetch('/api/tasks/' + id + '?cascade=true', {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + this.authToken }
            });
            if (res.ok) {
              this.showToast('تم حذف المهمة');
              this.loadTasks();
            }
          } catch (err) {
            alert(err.message);
          }
        },

        // --- CONTEXT PACK & LOGS ---
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
              this.contextStats = 'تقدير التوكن: ~' + d.estimatedTokens + 't | ذكريات: ' + d.memoryCount + ' | مهام: ' + d.taskCount + ' | سجلات: ' + d.logCount;
            }
          } catch (err) {
            this.contextResult = 'خطأ: ' + err.message;
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
              this.showToast('تم حفظ السجل المؤقت');
              this.loadLogs();
            }
          } catch (err) {
            alert(err.message);
          }
        },

        // --- SIMULATOR ---
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
            }
          } catch (err) {
            alert(err.message);
          }
          this.loadingSimulator = false;
        },

        // --- VAULT ---
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
              this.showToast('تم تشفير السر في الخزنة 🔐');
              this.loadVaultKeys();
            } else {
              const d = await res.json();
              alert(d.error);
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
              this.showToast('تم فك التشفير بنجاح 🔓');
            } else {
              alert(d.error || 'كلمة المرور غير صحيحة');
            }
          } catch (err) {
            alert(err.message);
          }
        },

        async deleteVaultKey(keyName) {
          if (!confirm('هل تريد حذف المفتاح المشفر: ' + keyName + '؟')) return;
          try {
            const res = await fetch('/api/vault/' + encodeURIComponent(keyName), {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + this.authToken }
            });
            if (res.ok) {
              this.showToast('تم حذف المفتاح من الخزنة');
              this.loadVaultKeys();
            }
          } catch (err) {
            alert(err.message);
          }
        },

        // --- CONNECT URLS ---
        getDirectMcpUrl() {
          const origin = window.location.origin;
          const key = this.currentUser?.api_key || 'YOUR_TOKEN';
          return origin + '/mcp?token=' + key;
        },

        getOpenApiUrl() {
          const origin = window.location.origin;
          const key = this.currentUser?.api_key || 'YOUR_TOKEN';
          return origin + '/openapi.json?token=' + key;
        },

        copyDirectMcpUrl() {
          this.copyText(this.getDirectMcpUrl());
        },

        copySkillUrl() {
          const origin = window.location.origin;
          this.copyText(origin + '/skill.md');
          this.showToast('تم نسخ رابط ملف skill.md المباشر للوكلاء 📜');
        },

        // --- ADMIN ---
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

        // Utilities
        formatDate(ts) {
          if (!ts) return '';
          return new Date(ts * 1000).toLocaleDateString('ar-EG');
        },

        formatTime(ts) {
          if (!ts) return '';
          return new Date(ts * 1000).toLocaleTimeString();
        }
      }
    }
  </script>
</body>
</html>`;
}
