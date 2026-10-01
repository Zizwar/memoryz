export function renderWebhooksHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemoryZ — إدارة الويبهوك والأحداث الحية (Webhooks)</title>
  
  <script>
    (function() {
      const savedTheme = localStorage.getItem('memoryz_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    })();
  </script>

  <!-- Tailwind, DaisyUI 4, FontAwesome 6, Alpine.js -->
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
  </style>
</head>

<body class="bg-base-100 text-base-content min-h-screen flex flex-col antialiased selection:bg-primary selection:text-primary-content"
      x-data="webhooksApp()"
      x-init="init()"
      x-cloak>

  <!-- TOP HEADER -->
  <header class="navbar bg-base-200/90 backdrop-blur border-b border-base-300 h-16 min-h-16 px-4 z-30 flex items-center justify-between gap-3 sticky top-0">
    <div class="flex items-center gap-3">
      <a href="/" class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300" title="العودة للوحة الرئيسية">
        <i class="fa-solid fa-arrow-right text-xs"></i>
        <span class="text-xs font-bold hidden sm:inline">اللوحة الرئيسية</span>
      </a>

      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center font-black shadow-md text-sm">
          <i class="fa-solid fa-satellite-dish"></i>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-black text-sm sm:text-base tracking-tight">Memory<span class="text-primary">Z</span></span>
            <span class="badge badge-primary badge-xs font-mono font-bold">Webhooks</span>
          </div>
          <div class="text-[10px] text-base-content/60 font-mono">
            المشتركون النشطون: <span class="font-bold text-primary" x-text="webhooks.length">0</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-2">
      <a href="/graph" class="btn btn-ghost btn-xs sm:btn-sm gap-1.5 rounded-xl border border-base-300">
        <i class="fa-solid fa-circle-nodes text-xs text-primary"></i>
        <span class="text-xs hidden sm:inline">شبكة الـ Graph</span>
      </a>

      <button class="btn btn-primary btn-xs sm:btn-sm gap-1.5 rounded-xl font-bold shadow-sm" @click="modals.create = true">
        <i class="fa-solid fa-plus text-xs"></i>
        <span>تسجيل ويبهوك جديد</span>
      </button>

      <!-- Theme Switcher -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle" @click="toggleTheme()">
        <i class="fa-solid text-xs sm:text-sm" :class="theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-primary'"></i>
      </button>

      <!-- API Key Auth Dropdown -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-xs sm:btn-sm gap-1 px-2 rounded-xl border border-base-300 font-mono text-xs">
          <i class="fa-solid fa-key text-xs" :class="authToken ? 'text-success' : 'text-warning'"></i>
          <span x-text="authToken ? (authToken.substring(0, 6) + '...') : 'المفتاح'"></span>
        </div>
        <div tabindex="0" class="dropdown-content z-50 card card-compact w-72 p-3 shadow-2xl bg-base-200 border border-base-300 text-xs mt-2">
          <div class="font-bold mb-2">مفتاح API للتحكم بالويبهوك</div>
          <input type="text" class="input input-xs input-bordered w-full font-mono text-xs mb-2" placeholder="mz_..." x-model="tokenInput">
          <div class="flex gap-2">
            <button class="btn btn-primary btn-xs flex-1 font-bold" @click="saveToken()">حفظ</button>
            <button class="btn btn-ghost btn-xs text-error" @click="clearToken()" x-show="authToken">مسح</button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- MAIN CONTENT -->
  <main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">

    <!-- HERO BANNER -->
    <div class="card bg-base-200/80 border border-base-300 p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div class="max-w-2xl relative z-10">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="badge badge-primary font-bold text-xs">Real-Time Event Dispatcher</span>
          <span class="badge badge-outline text-xs font-mono">HMAC-SHA256 Signed</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black tracking-tight mb-2">بث أحداث الذواكر والمهام الحية (Webhooks)</h1>
        <p class="text-xs sm:text-sm text-base-content/80 leading-relaxed">
          استمع لحظياً للتغييرات التي تحدث في الذاكرة (إضافة ذرة، تعديل، حذف) أو شجرة المهام (إنشاء مهمة، قفل، إكمال). ترسل التنبيهات عبر طلبات HTTP POST مشفرة بتوقيع HMAC لضمان الموثوقية.
        </p>
      </div>
      <div class="absolute -left-6 -bottom-6 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
    </div>

    <!-- WEBHOOKS LIST -->
    <div class="card bg-base-200/70 border border-base-300 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-base-300">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-satellite-dish text-primary text-base"></i>
          <h2 class="font-bold text-sm sm:text-base">نقاط النهاية المسجلة (Endpoints)</h2>
          <span class="badge badge-sm badge-ghost font-mono" x-text="webhooks.length"></span>
        </div>
        <button class="btn btn-ghost btn-xs gap-1" @click="loadWebhooks()">
          <i class="fa-solid fa-rotate-right text-xs" :class="{ 'fa-spin': loading }"></i>
          <span>تحديث</span>
        </button>
      </div>

      <!-- Loading State -->
      <div class="py-12 text-center" x-show="loading">
        <span class="loading loading-spinner loading-md text-primary"></span>
        <p class="text-xs text-base-content/60 mt-2">جاري جلب نقاط النهاية المسجلة...</p>
      </div>

      <!-- Empty State -->
      <div class="py-12 text-center" x-show="!loading && webhooks.length === 0">
        <div class="w-12 h-12 rounded-2xl bg-base-300/50 flex items-center justify-center mx-auto mb-3 text-base-content/40 text-xl">
          <i class="fa-solid fa-satellite-dish"></i>
        </div>
        <h3 class="font-bold text-sm mb-1">لا توجد نقاط نهاية ويبهوك مسجلة</h3>
        <p class="text-xs text-base-content/60 mb-4 max-w-sm mx-auto">سجل رابط URL لخادمك أو للبوت الخاص بك لتلقي إشعارات فورية بكل عملية جديدة في ميموريز.</p>
        <button class="btn btn-primary btn-sm rounded-xl font-bold gap-1.5" @click="modals.create = true">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>تسجيل ويبهوك جديد الآن</span>
        </button>
      </div>

      <!-- Webhooks Grid -->
      <div class="grid grid-cols-1 gap-3" x-show="!loading && webhooks.length > 0">
        <template x-for="wh in webhooks" :key="wh.id">
          <div class="card bg-base-100 border border-base-300/80 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-primary/40 transition-colors">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge badge-success badge-xs font-mono font-bold">نشط (Active)</span>
                  <span class="badge badge-ghost badge-xs font-mono" x-text="wh.namespace || 'vibzcode'"></span>
                  <span class="text-[10px] text-base-content/50 font-mono" x-text="'ID: ' + wh.id.substring(0, 8)"></span>
                </div>
                <div class="font-mono text-xs font-bold text-primary truncate select-all" x-text="wh.url"></div>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-1.5">
                <button class="btn btn-outline btn-xs gap-1 rounded-lg"
                        :disabled="testingId === wh.id"
                        @click="testWebhook(wh)">
                  <span class="loading loading-spinner loading-xs" x-show="testingId === wh.id"></span>
                  <i class="fa-solid fa-paper-plane text-[10px]" x-show="testingId !== wh.id"></i>
                  <span>اختبار Ping</span>
                </button>

                <button class="btn btn-ghost btn-xs text-error btn-square rounded-lg"
                        @click="deleteWebhook(wh.id)"
                        title="حذف الويبهوك">
                  <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Events filter & details -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-base-200 text-xs">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-base-content/60 text-[11px]">الأحداث المراقبة:</span>
                <template x-for="ev in (wh.events || '').split(',')" :key="ev">
                  <span class="badge badge-xs font-mono bg-base-200 border-base-300" x-text="ev.trim()"></span>
                </template>
              </div>

              <div class="text-[10px] text-base-content/50 font-mono">
                تاريخ التسجيل: <span x-text="formatDate(wh.created_at)"></span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- EVENT PAYLOAD REFERENCE -->
    <div class="card bg-base-200/50 border border-base-300 rounded-2xl p-4 sm:p-5">
      <h3 class="font-bold text-sm mb-2 flex items-center gap-2">
        <i class="fa-solid fa-code text-primary"></i>
        <span>نموذج الـ Payload المرسل (Webhook Event Spec)</span>
      </h3>
      <p class="text-xs text-base-content/70 mb-3">
        كل استدعاء ويبهوك يصل مع ترويسة <code class="bg-base-300 px-1 py-0.5 rounded text-[11px] font-mono">X-MemoryZ-Signature: sha256=...</code> للتحقق من هوية المرسل.
      </p>
      <pre class="bg-base-100 p-3 rounded-xl border border-base-300 text-xs font-mono leading-relaxed overflow-x-auto text-primary"><code>{
  "event": "task.created",
  "timestamp": 1727802000000,
  "namespace": "vibzcode",
  "data": {
    "id": "tsk_01j8...",
    "title": "Build Autonomous Memory Graph",
    "status": "todo",
    "priority": "high",
    "assignee": "orchestrator"
  }
}</code></pre>
    </div>
  </main>

  <!-- MODAL: REGISTER WEBHOOK -->
  <dialog class="modal" :class="{ 'modal-open': modals.create }">
    <div class="modal-box max-w-md bg-base-200 border border-base-300 text-xs">
      <h3 class="font-black text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-satellite-dish text-primary"></i>
        <span>تسجيل نقطة نهاية ويبهوك جديدة</span>
      </h3>
      
      <div class="space-y-3">
        <div>
          <label class="label py-1"><span class="label-text text-xs font-bold">رابط الاستقبال (Target URL):</span></label>
          <input type="url" class="input input-sm input-bordered w-full font-mono text-xs"
                 placeholder="https://your-bot.example.com/api/memoryz-events"
                 x-model="form.url">
        </div>

        <div>
          <label class="label py-1"><span class="label-text text-xs font-bold">المفتاح السري للتوقيع (Secret HMAC Key):</span></label>
          <input type="text" class="input input-sm input-bordered w-full font-mono text-xs"
                 placeholder="اختياري - لتأكيد مصدر البيانات"
                 x-model="form.secret">
        </div>

        <div>
          <label class="label py-1"><span class="label-text text-xs font-bold">الأحداث المشترك بها (Events):</span></label>
          <input type="text" class="input input-sm input-bordered w-full font-mono text-xs"
                 placeholder="task.*,memory.*,vault.*"
                 x-model="form.events">
          <span class="text-[10px] text-base-content/50 block mt-1">افصل بين الأحداث بفاصلة. استخدم * للاشتراك بالكل.</span>
        </div>

        <div>
          <label class="label py-1"><span class="label-text text-xs font-bold">نطاق العزل (Namespace):</span></label>
          <select class="select select-sm select-bordered w-full font-mono text-xs" x-model="form.namespace">
            <option value="vibzcode">vibzcode</option>
            <option value="memoryz">memoryz</option>
            <option value="ferme">ferme</option>
            <option value="default">default</option>
          </select>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost btn-sm" @click="modals.create = false">إلغاء</button>
        <button class="btn btn-primary btn-sm font-bold gap-1" :disabled="submitting" @click="createWebhook()">
          <span class="loading loading-spinner loading-xs" x-show="submitting"></span>
          <span>تسجيل وحفظ</span>
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

  <script>
    function webhooksApp() {
      return {
        theme: localStorage.getItem('memoryz_theme') || 'dark',
        authToken: localStorage.getItem('mz_token') || '',
        tokenInput: '',
        webhooks: [],
        loading: false,
        submitting: false,
        testingId: null,

        modals: { create: false },
        form: { url: '', secret: '', events: 'task.*,memory.*', namespace: 'vibzcode' },
        toast: { show: false, message: '' },

        showToast(msg) {
          this.toast.message = msg;
          this.toast.show = true;
          setTimeout(() => { this.toast.show = false; }, 3500);
        },

        toggleTheme() {
          this.theme = this.theme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('memoryz_theme', this.theme);
          document.documentElement.setAttribute('data-theme', this.theme);
        },

        init() {
          const params = new URLSearchParams(window.location.search);
          const qToken = params.get('token') || params.get('key') || params.get('api_key');
          if (qToken) {
            this.authToken = qToken;
            localStorage.setItem('mz_token', qToken);
          }
          this.tokenInput = this.authToken;
          this.loadWebhooks();
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
          this.loadWebhooks();
        },

        clearToken() {
          this.authToken = '';
          this.tokenInput = '';
          localStorage.removeItem('mz_token');
          this.showToast('تم تسجيل الخروج');
          this.loadWebhooks();
        },

        formatDate(ts) {
          if (!ts) return 'الآن';
          try {
            return new Date(ts).toLocaleString('ar-SA');
          } catch (_e) {
            return ts;
          }
        },

        async loadWebhooks() {
          this.loading = true;
          try {
            const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
            const res = await fetch('/api/webhooks', { headers });
            if (res.ok) {
              const data = await res.json();
              this.webhooks = data.webhooks || [];
            } else {
              this.showToast('يرجى تسجيل الدخول لعرض الويبهوك');
            }
          } catch (err) {
            console.error(err);
          } finally {
            this.loading = false;
          }
        },

        async createWebhook() {
          if (!this.form.url) {
            alert('يرجى كتابة رابط الـ URL');
            return;
          }
          this.submitting = true;
          try {
            const headers = {
              'Content-Type': 'application/json',
              ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {})
            };
            const res = await fetch('/api/webhooks', {
              method: 'POST',
              headers,
              body: JSON.stringify(this.form)
            });
            if (res.ok) {
              this.modals.create = false;
              this.form.url = '';
              this.form.secret = '';
              this.showToast('تم تسجيل الويبهوك بنجاح 📡');
              await this.loadWebhooks();
            } else {
              const err = await res.json();
              alert(err.error || 'فشل تسجيل الويبهوك');
            }
          } catch (err) {
            alert(err.message);
          } finally {
            this.submitting = false;
          }
        },

        async deleteWebhook(id) {
          if (!confirm('هل تريد بالتأكيد حذف هذا الويبهوك؟')) return;
          try {
            const res = await fetch('/api/webhooks/' + id, {
              method: 'DELETE',
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              this.showToast('تم حذف الويبهوك بنجاح');
              await this.loadWebhooks();
            }
          } catch (e) {
            console.error(e);
          }
        },

        async testWebhook(wh) {
          this.testingId = wh.id;
          try {
            const res = await fetch('/api/webhooks/' + wh.id + '/test', {
              method: 'POST',
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            if (res.ok) {
              this.showToast('تم إرسال حدث تجريبي (Ping) بنجاح 🚀');
            } else {
              this.showToast('وصل الخادم ولكن أرجع رمز خطأ');
            }
          } catch (e) {
            this.showToast('فشل اختبار الاتصال: ' + e.message);
          } finally {
            this.testingId = null;
          }
        }
      };
    }
  </script>
</body>
</html>`;
}
