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
        <span class="badge badge-primary badge-xs font-mono font-bold tracking-wider">v3</span>
      </div>
    </div>

    <!-- Right Actions / Status Bar (Clean & Minimalist: Token + Theme + BigMac Menu) -->
    <div class="flex-none flex items-center gap-1 sm:gap-2">
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

      <!-- Prominent Login Button when unauthenticated -->
      <template x-if="!currentUser">
        <button class="btn btn-primary btn-xs sm:btn-sm gap-1 px-2.5 rounded-xl font-bold shadow-sm" @click="openAuthModal('login')">
          <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
          <span class="hidden sm:inline">تسجيل الدخول</span>
        </button>
      </template>

      <!-- BigMac Dropdown Menu (Unified Profile, Quick Actions, Docs & Links) -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button"
             class="btn btn-ghost btn-xs sm:btn-sm gap-1.5 px-2 rounded-xl border border-base-300/80 bg-base-100/40 hover:bg-base-300/60 transition-all"
             title="القائمة الرئيسية">
          <i class="fa-solid fa-bars text-xs sm:text-sm"></i>
          <template x-if="currentUser">
            <div class="w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-[10px] uppercase">
              <span x-text="currentUser.username.substring(0, 2)"></span>
            </div>
          </template>
        </div>

        <ul tabindex="0" class="dropdown-content z-50 menu p-2.5 shadow-2xl bg-base-200 border border-base-300 rounded-2xl w-64 text-xs mt-2 space-y-1">
          <!-- User Profile / Auth Header -->
          <template x-if="currentUser">
            <li class="bg-base-300/60 rounded-xl p-2.5 mb-1">
              <div class="flex items-center justify-between w-full p-0">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-xs uppercase flex-none">
                    <span x-text="currentUser.username.substring(0, 2)"></span>
                  </div>
                  <div class="truncate">
                    <div class="font-bold text-sm truncate" x-text="currentUser.username"></div>
                    <div class="text-[10px] text-base-content/60 truncate" x-text="currentUser.email || 'حساب نشط'"></div>
                  </div>
                </div>
                <span class="badge badge-primary badge-xs font-mono font-bold uppercase" x-text="currentUser.role"></span>
              </div>
            </li>
          </template>

          <template x-if="!currentUser">
            <li class="mb-1">
              <button class="btn btn-primary btn-sm w-full gap-2 justify-center text-xs" @click="openAuthModal('login')">
                <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                <span>تسجيل الدخول / إنشاء حساب</span>
              </button>
            </li>
          </template>

          <!-- System & Account Links -->
          <template x-if="currentUser">
            <li>
              <a @click="switchTab('connect')" class="flex items-center gap-2.5 py-2 rounded-lg">
                <i class="fa-solid fa-key text-primary text-xs w-4 text-center"></i>
                <span class="font-medium">مفتاح API والربط</span>
              </a>
            </li>
          </template>

          <template x-if="currentUser && currentUser.role === 'admin'">
            <li>
              <a @click="switchTab('admin')" class="flex items-center gap-2.5 py-2 text-warning font-bold rounded-lg">
                <i class="fa-solid fa-crown text-xs w-4 text-center"></i>
                <span>لوحة تحكم المدير</span>
              </a>
            </li>
          </template>

          <li class="menu-title text-[10px] text-base-content/50 uppercase tracking-wider pt-1">المصادر والتوثيق</li>

          <!-- Docs -->
          <li>
            <a href="/docs" target="_blank" rel="noopener" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-book-open text-info text-xs w-4 text-center"></i>
                <span class="font-medium">دليل التوثيق (Docs)</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- Skill URL Copier -->
          <li>
            <a @click="copySkillUrl()" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-scroll text-accent text-xs w-4 text-center"></i>
                <span>نسخ رابط skill.md</span>
              </div>
              <span class="badge badge-ghost badge-xs font-mono">Skill</span>
            </a>
          </li>

          <!-- Direct MCP Copier -->
          <li>
            <a @click="copyDirectMcpUrl()" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-bolt text-warning text-xs w-4 text-center"></i>
                <span>نسخ رابط MCP المباشر</span>
              </div>
              <span class="badge badge-ghost badge-xs font-mono">SSE</span>
            </a>
          </li>

          <li class="menu-title text-[10px] text-base-content/50 uppercase tracking-wider pt-1">المستودعات والحزم</li>

          <!-- GitHub Repo -->
          <li>
            <a href="https://github.com/Zizwar/memoryz" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-brands fa-github text-xs w-4 text-center"></i>
                <span>مستودع GitHub</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- NPM Package -->
          <li>
            <a href="https://www.npmjs.com/package/memoryz" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-brands fa-npm text-error text-sm w-4 text-center"></i>
                <span>حزمة NPM (v2.0.0)</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- Logout -->
          <template x-if="currentUser">
            <li class="border-t border-base-300 mt-1 pt-1">
              <a @click="logout()" class="text-error flex items-center gap-2.5 py-2 rounded-lg">
                <i class="fa-solid fa-right-from-bracket text-xs w-4 text-center"></i>
                <span>تسجيل الخروج</span>
              </a>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </header>

  <!-- MAIN WRAPPER -->
  <main class="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">

    <!-- Unauthenticated Banner Alert (Shows when visiting from a new domain or without token) -->
    <template x-if="!currentUser && !authToken">
      <div class="alert bg-warning/10 border border-warning/30 text-warning text-xs p-3 rounded-xl flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2.5">
          <i class="fa-solid fa-triangle-exclamation text-base"></i>
          <span>أنت تتصفح كزائر غير مسجل الدخول على هذا النطاق. لعرض واسترجاع الذكريات والمهام المحمية، يرجى تسجيل الدخول بحسابك أو مفتاح API.</span>
        </div>
        <button class="btn btn-warning btn-xs font-bold gap-1 shrink-0" @click="openAuthModal('login')">
          <i class="fa-solid fa-arrow-right-to-bracket text-[10px]"></i>
          <span>تسجيل الدخول الآن</span>
        </button>
      </div>
    </template>

    <!-- NAVIGATION CARDS (Responsive Grid, Mobile-Friendly, No Horizontal Overflow) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
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

      <!-- 7. الويبهوك والأحداث -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'webhooks' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('webhooks')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'webhooks' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-satellite-dish"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'webhooks' ? 'badge-primary' : 'badge-ghost'"
                x-text="webhooksCount"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">الويبهوك</div>
          <div class="text-[10px] text-base-content/60 truncate">بث الأحداث الحية</div>
        </div>
      </button>

      <!-- 8. ملفات وتخزين R2 -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-right flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'r2' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('r2')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'r2' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'r2' ? 'badge-primary' : 'badge-ghost'"
                x-text="r2FilesCount"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight">تخزين R2</div>
          <div class="text-[10px] text-base-content/60 truncate">ملفات وحزم سحابية</div>
        </div>
      </button>

      <!-- 9. لوحة المدير (مشروطة) -->
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

    <!-- NAMESPACE FILTER TOOLBAR (v3 Substrate Scope + Jev AI Cron) -->
    <div class="bg-base-200/60 border border-base-300 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-base-content/70 font-bold text-[11px] flex items-center gap-1.5">
          <i class="fa-solid fa-layer-group text-primary"></i>
          <span>نطاق العزل (Namespace):</span>
        </span>
        <div class="join shadow-sm">
          <button class="btn btn-xs join-item" :class="currentNamespace === 'all' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('all')">الكل</button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'vibzcode' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('vibzcode')">vibzcode</button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'memoryz' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('memoryz')">memoryz</button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'ferme' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('ferme')">ferme</button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'default' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('default')">default</button>
        </div>
      </div>

      <!-- Quick Maintenance Cron Button -->
      <button class="btn btn-xs btn-outline btn-secondary gap-1.5 rounded-lg"
              :class="{ 'loading': runningCron }"
              @click="triggerMaintenanceCron()"
              title="تشغيل تنظيف أقفال المهام العالقة وتدوير الذاكرة مع Jev AI">
        <i class="fa-solid fa-broom" x-show="!runningCron"></i>
        <span>صيانة وتدوير الذاكرة (Cron + Jev AI)</span>
      </button>
    </div>

    <!-- Active Section Action Header (Compact & Responsive) -->
    <div class="flex items-center justify-between gap-2 bg-base-200/60 border border-base-300 px-3.5 py-2.5 rounded-xl">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs sm:text-sm font-bold text-base-content/90 truncate" x-text="
          activeTab === 'memories' ? 'الذاكرة الحية والمتجهات (Vector Memories)' :
          activeTab === 'tasks' ? 'شجرة المهام وتنسيق الوكلاء (Tasks & Multi-Agent TODOs)' :
          activeTab === 'webhooks' ? 'الاشتراكات الفورية في الأحداث (Multi-Agent Webhooks)' :
          activeTab === 'context' ? 'حزم السياق والسجلات اللحظية (Context Packs & Logs)' :
          activeTab === 'agent' ? 'محاكي الاسترجاع واستجابة الوكلاء (Agent Simulator)' :
          activeTab === 'vault' ? 'الخزنة السرية المشفرة (Zero-Knowledge Secret Vault)' :
          activeTab === 'r2' ? 'مستودع الكائنات والملفات السحابية (Cloudflare R2 Storage)' :
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

        <template x-if="activeTab === 'webhooks'">
          <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openWebhookModal()">
            <i class="fa-solid fa-plus text-xs"></i> <span>اشتراك ويبهوك جديد</span>
          </button>
        </template>

        <template x-if="activeTab === 'r2'">
          <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openR2UploadModal()">
            <i class="fa-solid fa-cloud-arrow-up text-xs"></i> <span>رفع ملف</span>
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
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="badge badge-sm font-semibold uppercase tracking-wider"
                        :class="{
                          'badge-info text-info-content': m.type === 'env',
                          'badge-accent text-accent-content': m.type === 'preference',
                          'badge-primary text-primary-content': m.type === 'skill',
                          'badge-secondary text-secondary-content': m.type === 'note'
                        }"
                        x-text="m.type"></span>
                  <span class="font-bold text-sm text-base-content truncate max-w-[200px]" x-text="m.title || m.hash.substring(0, 8)"></span>
                  <template x-if="m.namespace">
                    <span class="badge badge-outline badge-xs font-mono" x-text="m.namespace"></span>
                  </template>
                  <template x-if="m.agent_id || m.source">
                    <span class="badge badge-ghost badge-xs font-mono gap-1 text-base-content/60" :title="'مصدر الذاكرة: ' + (m.agent_id || m.source)">
                      <i class="fa-solid fa-microchip text-[9px]"></i>
                      <span x-text="m.agent_id || m.source"></span>
                    </span>
                  </template>
                  <template x-if="m.time_decay">
                    <span class="badge badge-ghost badge-xs font-mono text-base-content/50" :title="'معامل الحيوية الزمني: ' + m.time_decay">
                      <i class="fa-solid fa-clock-rotate-left text-[9px]"></i>
                      <span x-text="Number(m.time_decay).toFixed(2)"></span>
                    </span>
                  </template>
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
                <div class="flex items-center gap-1">
                  <span class="hover:text-primary cursor-pointer" @click="copyText(m.hash)" :title="'نسخ الهاش الكامل: ' + m.hash" x-text="'#' + m.hash.substring(0, 8)"></span>
                  <button class="btn btn-ghost btn-xs p-0.5 h-auto min-h-0 text-base-content/40 hover:text-base-content" @click="copyText(m.hash)" title="نسخ الهاش">
                    <i class="fa-solid fa-copy text-[10px]"></i>
                  </button>
                </div>
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
                    <template x-if="t.namespace">
                      <span class="badge badge-outline badge-xs font-mono" x-text="t.namespace"></span>
                    </template>
                    <template x-if="t.assignee">
                      <span class="badge badge-ghost badge-xs gap-1 font-mono">
                        <i class="fa-solid fa-robot text-[9px] text-primary"></i>
                        <span x-text="'@' + t.assignee"></span>
                      </span>
                    </template>
                    <template x-if="t.locked_by">
                      <span class="inline-flex items-center gap-1">
                        <span class="badge badge-warning badge-xs font-mono gap-1 text-[10px]" :title="'قفل بواسطة: ' + t.locked_by">
                          <i class="fa-solid fa-lock text-[9px]"></i>
                          <span x-text="t.locked_by"></span>
                        </span>
                        <button class="btn btn-ghost btn-xs text-warning p-0.5 h-auto min-h-0" @click="releaseTaskLock(t.id, t.locked_by)" title="فك قفل المهمة يدوياً">
                          <i class="fa-solid fa-lock-open text-[10px]"></i>
                        </button>
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
                          <template x-if="sub.namespace">
                            <span class="badge badge-outline badge-xs font-mono" x-text="sub.namespace"></span>
                          </template>
                          <template x-if="sub.assignee">
                            <span class="badge badge-ghost badge-xs gap-1 font-mono">
                              <i class="fa-solid fa-robot text-[9px] text-primary"></i>
                              <span x-text="'@' + sub.assignee"></span>
                            </span>
                          </template>
                          <template x-if="sub.locked_by">
                            <span class="inline-flex items-center gap-1">
                              <span class="badge badge-warning badge-xs font-mono gap-1 text-[9px]" :title="'قفل بواسطة: ' + sub.locked_by">
                                <i class="fa-solid fa-lock text-[8px]"></i>
                                <span x-text="sub.locked_by"></span>
                              </span>
                              <button class="btn btn-ghost btn-xs text-warning p-0.5 h-auto min-h-0" @click="releaseTaskLock(sub.id, sub.locked_by)" title="فك قفل المهمة">
                                <i class="fa-solid fa-lock-open text-[9px]"></i>
                              </button>
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
    <!-- TAB: WEBHOOKS & MULTI-AGENT EVENT STREAM -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'webhooks'" class="space-y-4">
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
              <i class="fa-solid fa-satellite-dish"></i>
            </div>
            <div>
              <div class="font-bold text-sm">بث الأحداث واشتراكات الويبهوك (Multi-Agent Webhooks)</div>
              <div class="text-[11px] text-base-content/60">إشعار الوكلاء الخارجية (VibzCode, Cursor, Claude Code) فورياً عند تغيير المهام أو إضافة ذكريات</div>
            </div>
          </div>

          <button class="btn btn-sm btn-primary gap-1 shadow-sm" @click="openWebhookModal()">
            <i class="fa-solid fa-plus text-xs"></i> <span>تسجيل ويبهوك جديد</span>
          </button>
        </div>

        <div class="alert bg-base-100 border border-base-300 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-info text-sm"></i>
          <span>يتم إرسال الأحداث مع ترويسة <code class="text-primary font-mono font-bold">X-MemoryZ-Signature: sha256=...</code> للتحقق التام عبر HMAC-SHA256 والتأكد من موثوقية البث.</span>
        </div>

        <!-- Webhooks List -->
        <div class="space-y-2.5">
          <template x-for="wh in webhooks" :key="wh.id">
            <div class="p-3.5 rounded-xl border border-base-300 bg-base-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div class="space-y-1.5 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono font-bold text-xs sm:text-sm text-primary break-all" x-text="wh.url"></span>
                  <span class="badge badge-xs font-mono" :class="wh.active ? 'badge-success' : 'badge-ghost'" x-text="wh.active ? 'نشط (Active)' : 'معطل'"></span>
                  <template x-if="wh.namespace">
                    <span class="badge badge-outline badge-xs font-mono" x-text="'ns: ' + wh.namespace"></span>
                  </template>
                  <template x-if="wh.secret">
                    <span class="badge badge-ghost badge-xs font-mono gap-1 text-base-content/60">
                      <i class="fa-solid fa-key text-[9px] text-warning"></i>
                      <span>HMAC-SHA256</span>
                    </span>
                  </template>
                </div>

                <div class="flex items-center gap-2 flex-wrap text-xs text-base-content/70">
                  <span class="font-semibold text-[11px]">الأحداث المشترك بها:</span>
                  <template x-for="ev in (wh.events || '').split(',')" :key="ev">
                    <span class="badge badge-secondary badge-xs font-mono" x-text="ev.trim()"></span>
                  </template>
                  <span class="text-base-content/40 text-[10px] mr-auto" x-text="formatDate(wh.created_at)"></span>
                </div>
              </div>

              <div class="flex items-center gap-1.5 flex-none self-end sm:self-center">
                <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteWebhook(wh.id)" title="حذف الويبهوك">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>
          </template>

          <div x-show="webhooks.length === 0 && !loadingWebhooks" class="p-8 text-center text-base-content/60 border border-dashed border-base-300 rounded-xl">
            <i class="fa-solid fa-tower-broadcast text-3xl mb-2 text-base-content/30"></i>
            <div>لا توجد اشتراكات ويبهوك مسجلة حالياً.</div>
            <div class="text-[11px] text-base-content/50 mt-1">سجل عنوان الويبهوك الخاص بـ VibzCode لتلقي تنبيهات المهام والذكريات فوراً.</div>
          </div>
        </div>
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
          <div class="text-xs font-semibold">تثبيت سريع عبر نظام المهارات المفتوح:</div>
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre data-prefix="$"><code>npx skills add https://memoryz.wino.deno.net</code></pre>
            <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText('npx skills add https://memoryz.wino.deno.net')">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
          <div class="text-xs font-semibold pt-1">أو نسخ مباشر إلى مجلد مهارات الوكيل:</div>
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
    <!-- TAB 8: CLOUDFLARE R2 OBJECT STORAGE -->
    <!-- ============================================================= -->
    <div x-show="activeTab === 'r2'" class="space-y-4">
      <!-- R2 Header & Toolbar -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
              <i class="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div>
              <div class="font-bold text-sm">مستودع الكائنات السحابي (Cloudflare R2 Storage)</div>
              <div class="text-[11px] text-base-content/60">رفع واستضافة وحفظ مخرجات الوكلاء والملفات الثنائية بلا كلفة خروج (Zero Egress Fees)</div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Bucket Selector -->
            <div class="flex items-center gap-1.5 bg-base-100 px-2.5 py-1 rounded-lg border border-base-300 text-xs">
              <i class="fa-solid fa-bucket text-primary text-xs"></i>
              <span class="text-base-content/60">الحاوية:</span>
              <select class="select select-ghost select-xs font-mono font-bold focus:outline-none"
                      x-model="selectedR2Bucket"
                      @change="loadR2Files()">
                <template x-for="b in r2Buckets" :key="b.name || b">
                  <option :value="b.name || b" x-text="b.name || b"></option>
                </template>
              </select>
            </div>

            <!-- Upload File Button -->
            <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openR2UploadModal()">
              <i class="fa-solid fa-plus text-xs"></i> <span>رفع ملف</span>
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="flex items-center gap-2 flex-wrap pt-2 border-t border-base-300/80">
          <div class="join flex-1 min-w-[200px]">
            <span class="join-item btn btn-xs btn-ghost border border-base-300 bg-base-100 pointer-events-none">
              <i class="fa-solid fa-filter text-[10px] text-base-content/60"></i>
            </span>
            <input type="text" class="input input-xs input-bordered join-item flex-1 focus:outline-none font-mono"
                   placeholder="تصفية حسب المسار أو الاسم (Prefix)..."
                   x-model="r2PrefixFilter"
                   @input.debounce.300ms="loadR2Files()">
          </div>

          <button class="btn btn-xs btn-outline gap-1" @click="loadR2Files()">
            <i class="fa-solid fa-rotate-right text-[10px]" :class="{ 'fa-spin': loadingR2 }"></i>
            <span>تحديث</span>
          </button>
        </div>
      </div>

      <!-- Files List / Grid -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between text-xs text-base-content/70 pb-1 border-b border-base-300">
          <div class="flex items-center gap-2 font-bold">
            <i class="fa-solid fa-folder-tree text-primary"></i>
            <span>الملفات المرفوعة (<span x-text="r2Files.length"></span>)</span>
          </div>
          <span class="text-[11px] text-base-content/50 font-mono" x-text="'Bucket: ' + selectedR2Bucket"></span>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-xs sm:table-sm w-full">
            <thead>
              <tr class="text-base-content/60 border-base-300">
                <th>الملف / المسار</th>
                <th>النوع</th>
                <th>الحجم</th>
                <th>تاريخ التحديث</th>
                <th class="text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <template x-for="f in r2Files" :key="f.key">
                <tr class="hover:bg-base-300/40 border-base-300/60 transition-colors">
                  <td class="font-mono text-xs font-semibold">
                    <div class="flex items-center gap-2">
                      <i class="fa-solid" :class="getFileIcon(f.key, f.content_type)"></i>
                      <span class="truncate max-w-xs sm:max-w-md" :title="f.key" x-text="f.key"></span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-ghost badge-xs font-mono" x-text="f.content_type || 'binary'"></span>
                  </td>
                  <td class="font-mono text-xs" x-text="formatBytes(f.size)"></td>
                  <td class="text-[11px] text-base-content/60 font-mono" x-text="f.last_modified ? new Date(f.last_modified).toLocaleString('ar-EG') : '-'"></td>
                  <td>
                    <div class="flex items-center justify-end gap-1">
                      <!-- Open / View Link -->
                      <a :href="f.url" target="_blank" class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" data-tip="عرض الرابط المباشر">
                        <i class="fa-solid fa-arrow-up-right-from-square text-xs text-info"></i>
                      </a>
                      <!-- Download Link -->
                      <a :href="f.download_url" download class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" data-tip="تحميل الملف">
                        <i class="fa-solid fa-download text-xs text-primary"></i>
                      </a>
                      <!-- Copy URL -->
                      <button class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" data-tip="نسخ رابط التحميل" @click="copyText(window.location.origin + f.download_url)">
                        <i class="fa-solid fa-copy text-xs"></i>
                      </button>
                      <!-- Delete File -->
                      <button class="btn btn-ghost btn-xs btn-square text-error tooltip tooltip-bottom" data-tip="حذف الملف" @click="deleteR2File(f.key)">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div x-show="r2Files.length === 0 && !loadingR2" class="p-8 text-center text-base-content/60 border border-dashed border-base-300 rounded-xl">
          <i class="fa-solid fa-cloud-arrow-up text-3xl mb-2 text-base-content/30"></i>
          <div>لا توجد ملفات في هذه الحاوية حالياً.</div>
          <div class="text-[11px] text-base-content/50 mt-1">انقر على "رفع ملف" أو استخدم أداة MCP r2_upload من قبل الوكلاء الذكية.</div>
        </div>

        <div x-show="loadingR2" class="p-8 text-center">
          <span class="loading loading-spinner loading-md text-primary"></span>
          <div class="text-xs text-base-content/60 mt-2">جاري قراءة كائنات Cloudflare R2...</div>
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

          <!-- Jev AI Subsystem Control Card -->
          <div class="card bg-base-100 border p-4 sm:p-5 rounded-2xl shadow-sm space-y-3 transition-colors"
               :class="jevEnabled ? 'border-amber-500/40 bg-amber-500/5' : 'border-base-300'">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                     :class="jevEnabled ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : 'bg-base-200 text-base-content/50 border border-base-300'">
                  <i class="fa-solid fa-bolt-lightning"></i>
                </div>
                <div>
                  <div class="font-bold text-sm flex items-center gap-2">
                    <span>محرك اتخاذ القرار والفرز الذكي (TypeSafe Jev AI)</span>
                    <span class="badge badge-xs font-mono font-bold"
                          :class="jevEnabled ? 'badge-warning text-black' : 'badge-ghost text-base-content/60'"
                          x-text="jevEnabled ? 'مفعّل (يستهلك توكنات)' : 'معطّل (حفظ الرصيد 100%)'"></span>
                  </div>
                  <div class="text-[11px] text-base-content/60 mt-0.5">
                    يقوم Jev AI بتكثيف الذاكرة واكتشاف التكرارات عبر نموذج System One. عند التعطيل، تتوقف جميع الاتصالات الخارجية وتعمل دورات الصيانة (Cron) بصمت محلياً دون أي استهلاك للرصيد.
                  </div>
                </div>
              </div>

              <button class="btn btn-sm px-4 gap-1.5 font-bold shrink-0"
                      :class="jevEnabled ? 'btn-error btn-outline hover:bg-error hover:text-white' : 'btn-warning'"
                      :disabled="loadingJevSetting"
                      @click="toggleJevSetting()">
                <span x-show="!loadingJevSetting" x-text="jevEnabled ? '🛑 إيقاف وتعطيل Jev AI' : '⚡ تفعيل Jev AI'"></span>
                <span x-show="loadingJevSetting" class="loading loading-spinner loading-xs"></span>
              </button>
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

  <!-- Modal: Webhook Registration Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.webhook }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-satellite-dish text-primary"></i>
        <span>تسجيل اشتراك ويبهوك جديد (Webhook)</span>
      </h3>
      <form @submit.prevent="saveWebhook()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text">رابط استقبال الويبهوك (Endpoint URL)</span></label>
          <input type="url" class="input input-sm input-bordered font-mono" placeholder="http://127.0.0.1:3000/api/orchestrator/webhook-receiver" required x-model="formWebhook.url">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">المفتاح السري للتوقيع (Secret Key - اختياري)</span></label>
          <input type="text" class="input input-sm input-bordered font-mono" placeholder="سلسلة سرية للتحقق من HMAC-SHA256" x-model="formWebhook.secret">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="form-control">
            <label class="label"><span class="label-text">نطاق العزل (Namespace)</span></label>
            <input type="text" class="input input-sm input-bordered font-mono" placeholder="vibzcode, default..." x-model="formWebhook.namespace">
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">الأحداث المشترك بها</span></label>
            <input type="text" class="input input-sm input-bordered font-mono" placeholder="task.*,memory.*" required x-model="formWebhook.events">
          </div>
        </div>

        <div class="text-[10px] text-base-content/60 leading-normal">
          الأحداث المدعومة: <code class="text-primary font-mono font-bold">task.status_changed</code>, <code class="text-primary font-mono font-bold">task.done</code>, <code class="text-primary font-mono font-bold">task.claimed</code>, <code class="text-primary font-mono font-bold">memory.created</code> أو <code class="text-primary font-mono font-bold">*</code>.
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.webhook = false">إلغاء</button>
          <button type="submit" class="btn btn-primary btn-sm">حفظ وتفعيل الويبهوك</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.webhook = false"><button>إغلاق</button></form>
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

  <!-- Modal: R2 Upload Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.r2Upload }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-cloud-arrow-up text-primary"></i>
        <span>رفع ملف إلى Cloudflare R2</span>
      </h3>
      <form @submit.prevent="submitR2Upload()" class="space-y-3 text-xs">
        <div class="tabs tabs-boxed mb-2 p-1">
          <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': formR2Upload.mode === 'file' }" @click="formR2Upload.mode = 'file'">ملف محلي</a>
          <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': formR2Upload.mode === 'text' }" @click="formR2Upload.mode = 'text'">نص / كود</a>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">الحاوية (Bucket)</span></label>
          <select class="select select-sm select-bordered font-mono" x-model="formR2Upload.bucket">
            <template x-for="b in r2Buckets" :key="b.name || b">
              <option :value="b.name || b" x-text="b.name || b"></option>
            </template>
          </select>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">مسار أو اسم الملف في R2 (Key)</span></label>
          <input type="text" class="input input-sm input-bordered font-mono"
                 placeholder="مثلاً: bundles/app.zip أو code/script.py"
                 required x-model="formR2Upload.key">
        </div>

        <template x-if="formR2Upload.mode === 'file'">
          <div class="form-control">
            <label class="label"><span class="label-text">اختر الملف</span></label>
            <input type="file" class="file-input file-input-sm file-input-bordered w-full"
                   @change="handleR2FileSelect($event)">
          </div>
        </template>

        <template x-if="formR2Upload.mode === 'text'">
          <div class="form-control">
            <label class="label"><span class="label-text">محتوى النص أو الكود</span></label>
            <textarea class="textarea textarea-sm textarea-bordered font-mono h-28"
                      placeholder="الصق محتوى الملف هنا..."
                      x-model="formR2Upload.textContent"></textarea>
          </div>
        </template>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.r2Upload = false">إلغاء</button>
          <button type="submit" class="btn btn-primary btn-sm gap-1" :disabled="uploadingR2">
            <span class="loading loading-spinner loading-xs" x-show="uploadingR2"></span>
            <span>بدء الرفع 🚀</span>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.r2Upload = false"><button>إغلاق</button></form>
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
        currentNamespace: 'all',
        theme: localStorage.getItem('memoryz_theme') || 'dark',
        authToken: localStorage.getItem('mz_token') || '',
        currentUser: null,
        runningCron: false,
        
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

        // Webhooks
        webhooks: [],
        webhooksCount: 0,
        loadingWebhooks: false,
        
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

        // R2 Storage Substrate
        r2Files: [],
        r2FilesCount: 0,
        r2Buckets: [{ name: 'memoryz' }, { name: 'vibenote' }],
        selectedR2Bucket: 'memoryz',
        r2PrefixFilter: '',
        loadingR2: false,
        uploadingR2: false,
        
        // Admin & Settings
        adminStats: {},
        jevEnabled: false,
        loadingJevSetting: false,

        // Modals
        modals: {
          memory: false,
          task: false,
          webhook: false,
          r2Upload: false,
          vault: false,
          decrypt: false,
          auth: false,
        },
        
        // Forms
        formMemory: { type: 'preference', title: '', content: '', namespace: 'vibzcode' },
        formTask: { parent_id: '', title: '', status: 'todo', priority: 'medium', assignee: '', description: '', namespace: 'vibzcode' },
        formWebhook: { url: '', secret: '', events: 'task.*,memory.*', namespace: 'vibzcode' },
        formVault: { key_name: '', secret_value: '', passphrase: '' },
        formR2Upload: { mode: 'file', key: '', bucket: 'memoryz', file: null, textContent: '' },
        authMode: 'login',
        authForm: { username: '', identifier: '', password: '' },

        // Toast
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
        },

        setNamespace(ns) {
          this.currentNamespace = ns;
          this.loadMemories();
          this.loadTasks();
          if (this.activeTab === 'webhooks') this.loadWebhooks();
          if (this.activeTab === 'r2') this.loadR2Files();
        },

        async triggerMaintenanceCron() {
          if (this.runningCron) return;
          this.runningCron = true;
          this.showToast('جاري تشغيل دورة الصيانة والتدوير الذكي مع Jev AI... ⏳');
          try {
            const res = await fetch('/api/cron/run', {
              method: 'POST',
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            const d = await res.json();
            if (res.ok && d.result) {
              const r = d.result;
              this.showToast('اكتملت الصيانة! أقفال ملغاة: ' + (r.unlockedTasks || 0) + ' | تدوير: ' + (r.decayedMemories || 0) + ' | ضغط Jev: ' + (r.compactedPairs || 0));
              this.loadTasks();
              this.loadMemories();
            } else {
              this.showToast(d.error || 'حدث خطأ أثناء الصيانة');
            }
          } catch (err) {
            this.showToast('فشل تشغيل الصيانة: ' + err.message);
          } finally {
            this.runningCron = false;
          }
        },

        async releaseTaskLock(taskId, lockedBy) {
          try {
            const res = await fetch('/api/tasks/' + taskId + '/release', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {})
              },
              body: JSON.stringify({ agent_id: lockedBy || 'admin' })
            });
            if (res.ok) {
              this.showToast('تم فك قفل المهمة بنجاح 🔓');
              this.loadTasks();
            } else {
              const d = await res.json();
              alert(d.error || 'فشل فك قفل المهمة');
            }
          } catch (err) {
            alert(err.message);
          }
        },

        async initApp() {
          this.theme = localStorage.getItem('memoryz_theme') || 'dark';
          document.documentElement.setAttribute('data-theme', this.theme);

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
        },

        switchTab(tab) {
          this.activeTab = tab;
          if (tab === 'memories') this.loadMemories();
          if (tab === 'tasks') this.loadTasks();
          if (tab === 'webhooks') this.loadWebhooks();
          if (tab === 'r2') this.loadR2Files();
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
            const nsParam = this.currentNamespace !== 'all' ? '&namespace=' + encodeURIComponent(this.currentNamespace) : '';
            const url = '/api/tasks?format=tree' + (this.taskStatusFilter ? '&status=' + this.taskStatusFilter : '') + nsParam;
            const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
            const res = await fetch(url, { headers });
            if (res.ok) {
              const data = await res.json();
              this.taskTree = data.tree || [];
              this.taskAsciiPreview = data.ascii || '';
              
              const flatRes = await fetch('/api/tasks' + (nsParam ? '?' + nsParam.slice(1) : ''), { headers });
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
          this.formTask = {
            parent_id: parentId,
            title: '',
            status: 'todo',
            priority: 'medium',
            assignee: '',
            description: '',
            namespace: this.currentNamespace !== 'all' ? this.currentNamespace : 'vibzcode'
          };
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

        // --- WEBHOOKS ---
        async loadWebhooks() {
          this.loadingWebhooks = true;
          try {
            const nsParam = this.currentNamespace !== 'all' ? '?namespace=' + encodeURIComponent(this.currentNamespace) : '';
            const res = await fetch('/api/webhooks' + nsParam, {
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              const data = await res.json();
              this.webhooks = data.webhooks || [];
              this.webhooksCount = this.webhooks.length;
            }
          } catch (_e) {}
          this.loadingWebhooks = false;
        },

        openWebhookModal() {
          this.formWebhook = {
            url: '',
            secret: '',
            events: 'task.*,memory.*',
            namespace: this.currentNamespace !== 'all' ? this.currentNamespace : 'vibzcode'
          };
          this.modals.webhook = true;
        },

        async saveWebhook() {
          if (!this.authToken) return this.openAuthModal();
          try {
            const res = await fetch('/api/webhooks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.authToken
              },
              body: JSON.stringify(this.formWebhook)
            });
            if (res.ok) {
              this.modals.webhook = false;
              this.showToast('تم تسجيل الويبهوك بنجاح 📡');
              this.loadWebhooks();
            } else {
              const d = await res.json();
              alert(d.error || 'فشل حفظ الويبهوك');
            }
          } catch (err) {
            alert(err.message);
          }
        },

        async deleteWebhook(id) {
          if (!confirm('هل تريد إلغاء اشتراك هذا الويبهوك؟')) return;
          try {
            const res = await fetch('/api/webhooks/' + id, {
              method: 'DELETE',
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              this.showToast('تم حذف الويبهوك');
              this.loadWebhooks();
            }
          } catch (err) {
            alert(err.message);
          }
        },

        // --- CLOUDFLARE R2 OBJECT STORAGE ---
        getFileIcon(key, contentType) {
          const k = (key || '').toLowerCase();
          const ct = (contentType || '').toLowerCase();
          if (ct.startsWith('image/') || k.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'fa-file-image text-warning';
          if (ct.includes('zip') || ct.includes('tar') || ct.includes('gzip') || k.match(/\.(zip|tar|gz|7z|rar)$/)) return 'fa-file-zipper text-accent';
          if (ct.includes('json') || ct.includes('javascript') || ct.includes('typescript') || ct.includes('python') || k.match(/\.(ts|js|json|py|sh|html|css)$/)) return 'fa-file-code text-info';
          if (ct.startsWith('text/') || k.match(/\.(txt|md|log|csv)$/)) return 'fa-file-lines text-primary';
          return 'fa-file text-base-content/60';
        },

        formatBytes(bytes) {
          if (!bytes || bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        async loadR2Buckets() {
          try {
            const res = await fetch('/api/r2/buckets', {
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              const d = await res.json();
              if (d.buckets && d.buckets.length > 0) {
                this.r2Buckets = d.buckets;
              }
            }
          } catch (_e) {}
        },

        async loadR2Files() {
          this.loadingR2 = true;
          try {
            const params = new URLSearchParams();
            if (this.selectedR2Bucket) params.set('bucket', this.selectedR2Bucket);
            if (this.r2PrefixFilter) params.set('prefix', this.r2PrefixFilter.trim());
            if (this.currentNamespace !== 'all' && this.currentNamespace !== 'default' && !this.r2PrefixFilter) {
              params.set('namespace', this.currentNamespace);
            }
            const res = await fetch('/api/r2/objects?' + params.toString(), {
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              const d = await res.json();
              this.r2Files = d.objects || [];
              this.r2FilesCount = this.r2Files.length;
            }
          } catch (_e) {}
          this.loadingR2 = false;
        },

        openR2UploadModal() {
          this.formR2Upload = {
            mode: 'file',
            key: this.currentNamespace !== 'all' && this.currentNamespace !== 'default' ? this.currentNamespace + '/' : '',
            bucket: this.selectedR2Bucket || 'memoryz',
            file: null,
            textContent: '',
          };
          this.modals.r2Upload = true;
        },

        handleR2FileSelect(event) {
          const file = event.target.files && event.target.files[0];
          if (file) {
            this.formR2Upload.file = file;
            if (!this.formR2Upload.key || this.formR2Upload.key.endsWith('/')) {
              const prefix = this.formR2Upload.key || '';
              this.formR2Upload.key = prefix + file.name;
            }
          }
        },

        async submitR2Upload() {
          if (!this.formR2Upload.key.trim()) {
            alert('يرجى كتابة مسار/اسم الملف');
            return;
          }
          this.uploadingR2 = true;
          try {
            let res;
            if (this.formR2Upload.mode === 'file') {
              if (!this.formR2Upload.file) {
                alert('يرجى اختيار ملف');
                this.uploadingR2 = false;
                return;
              }
              const formData = new FormData();
              formData.append('file', this.formR2Upload.file);
              formData.append('key', this.formR2Upload.key);
              formData.append('bucket', this.formR2Upload.bucket);
              if (this.currentNamespace !== 'all') {
                formData.append('namespace', this.currentNamespace);
              }

              res = await fetch('/api/r2/upload', {
                method: 'POST',
                headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {},
                body: formData,
              });
            } else {
              res = await fetch('/api/r2/upload', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}),
                },
                body: JSON.stringify({
                  key: this.formR2Upload.key,
                  bucket: this.formR2Upload.bucket,
                  content: this.formR2Upload.textContent,
                  namespace: this.currentNamespace !== 'all' ? this.currentNamespace : undefined,
                }),
              });
            }

            if (res.ok) {
              this.modals.r2Upload = false;
              this.showToast('تم رفع الملف إلى Cloudflare R2 بنجاح ☁️');
              await this.loadR2Files();
            } else {
              const d = await res.json();
              alert(d.error || 'فشل رفع الملف');
            }
          } catch (err) {
            alert(err.message);
          } finally {
            this.uploadingR2 = false;
          }
        },

        async deleteR2File(key) {
          if (!confirm('هل تريد بالتأكيد حذف الملف ' + key + ' من Cloudflare R2؟')) return;
          try {
            const res = await fetch('/api/r2/objects/' + encodeURIComponent(key) + '?bucket=' + encodeURIComponent(this.selectedR2Bucket), {
              method: 'DELETE',
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              this.showToast('تم حذف الملف من R2 بنجاح 🗑️');
              await this.loadR2Files();
            } else {
              const d = await res.json();
              alert(d.error || 'فشل حذف الملف');
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

        async loadSystemSettings() {
          try {
            const res = await fetch('/api/admin/settings', {
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              const d = await res.json();
              this.jevEnabled = !!d.jev_enabled;
            }
          } catch (_e) {}
        },

        async toggleJevSetting() {
          if (this.loadingJevSetting) return;
          this.loadingJevSetting = true;
          const target = !this.jevEnabled;
          try {
            const res = await fetch('/api/admin/settings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {})
              },
              body: JSON.stringify({ jev_enabled: target })
            });
            const d = await res.json();
            if (res.ok && d.success) {
              this.jevEnabled = !!d.jev_enabled;
              this.showToast(this.jevEnabled ? '⚡ تم تفعيل Jev AI (استهلاك التوكنات شغال)' : '🛑 تم تعطيل Jev AI وإيقاف استهلاك الرصيد نهائياً');
            } else {
              alert(d.error || 'فشل تحديث إعداد Jev AI');
            }
          } catch (err) {
            alert(err.message);
          } finally {
            this.loadingJevSetting = false;
          }
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
