// MemoryZ v4 — Public landing page (bilingual EN/AR).
// Served at `/` and `/index.html`. The dashboard lives at `/dash`.
// No benchmark percentages are claimed here: features only, no pass-rate numbers.

export function renderLandingHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemoryZ v4 — Live Memory for AI Agents</title>
  <meta name="description" content="MemoryZ is a shared, living memory substrate for AI agents: hybrid search, bi-temporal memory, knowledge updates and honest abstention. Works with Claude, Cursor, Windsurf and ChatGPT.">

  <script>
    (function() {
      const savedLang = localStorage.getItem('mz_lang') || 'ar';
      document.documentElement.setAttribute('lang', savedLang);
      document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    })();
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Tajawal:wght@300;400;500;700;900&family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Tajawal', 'Inter', 'sans-serif'],
            mono: ['Fira Code', 'monospace'],
          }
        }
      }
    }
  </script>

  <style>
    body { font-family: 'Tajawal', 'Inter', sans-serif; }
    [dir="ltr"] body { font-family: 'Inter', system-ui, sans-serif; }
    .mono { font-family: 'Fira Code', monospace; direction: ltr; text-align: left; }
    .gradient-text {
      background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .hero-glow {
      background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139, 92, 246, 0.18), transparent 70%);
    }
  </style>
</head>

<body class="min-h-screen bg-base-100 text-base-content flex flex-col antialiased selection:bg-primary selection:text-primary-content">

  <!-- NAVBAR -->
  <header class="navbar bg-base-200/90 backdrop-blur border-b border-base-300 sticky top-0 z-40 px-3 sm:px-6 h-16 min-h-16">
    <div class="flex-1 flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center font-black shadow-md">
          <i class="fa-solid fa-brain"></i>
        </div>
        <span class="text-lg sm:text-xl font-black tracking-tight">Memory<span class="text-primary">Z</span></span>
        <span class="badge badge-primary badge-sm font-mono font-bold">v4</span>
      </a>
      <nav class="hidden lg:flex items-center gap-1 ms-4 text-sm font-bold">
        <a href="#features" class="btn btn-ghost btn-sm" data-i18n="navFeatures">المميزات</a>
        <a href="#how" class="btn btn-ghost btn-sm" data-i18n="navHow">كيف يعمل</a>
        <a href="#quickstart" class="btn btn-ghost btn-sm" data-i18n="navQuickstart">البدء السريع</a>
        <a href="/docs" class="btn btn-ghost btn-sm" data-i18n="navDocs">التوثيق</a>
      </nav>
    </div>
    <div class="flex-none flex items-center gap-1 sm:gap-2">
      <div class="join">
        <button class="join-item btn btn-xs sm:btn-sm" data-lang-btn="en">EN</button>
        <button class="join-item btn btn-xs sm:btn-sm" data-lang-btn="ar">عربي</button>
      </div>
      <a href="/dash" class="btn btn-primary btn-sm sm:btn-md gap-2 font-bold">
        <i class="fa-solid fa-gauge-high"></i>
        <span class="hidden sm:inline" data-i18n="navDashboard">لوحة التحكم</span>
        <span class="sm:hidden">Dash</span>
      </a>
    </div>
  </header>

  <main class="flex-1 w-full">
    <!-- HERO -->
    <section class="hero-glow">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 text-center flex flex-col items-center gap-5">
        <span class="badge badge-outline badge-primary gap-2 font-mono text-xs py-3 px-3">
          <i class="fa-solid fa-sparkles"></i>
          <span data-i18n="heroBadge">MemoryZ v4 — Hybrid Search · Bi-Temporal · LongMemEval-ready</span>
        </span>
        <h1 class="text-4xl sm:text-6xl font-black leading-tight tracking-tight">
          <span data-i18n="heroTitle1">ذاكرة حية</span>
          <span class="gradient-text" data-i18n="heroTitle2">لوكلاء الذكاء الاصطناعي</span>
        </h1>
        <p class="text-base sm:text-xl text-base-content/70 max-w-2xl leading-relaxed" data-i18n="heroSub">
          ركيزة ذاكرة مشتركة وحية عبر Claude و Cursor و Windsurf و ChatGPT: وكيلك يتذكر ما تعلمه البارحة، ويشارك ما يعرفه مع باقي الوكلاء، ولا يخترع ما لا يعرفه.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a href="/dash" class="btn btn-primary btn-lg gap-2 font-bold">
            <i class="fa-solid fa-gauge-high"></i>
            <span data-i18n="ctaDashboard">افتح لوحة التحكم</span>
          </a>
          <a href="/docs" class="btn btn-outline btn-lg gap-2 font-bold">
            <i class="fa-solid fa-book-open"></i>
            <span data-i18n="ctaDocs">اقرأ التوثيق</span>
          </a>
          <a href="/skill.md" class="btn btn-ghost btn-lg gap-2 font-bold">
            <i class="fa-solid fa-download"></i>
            <span class="mono text-sm">skill.md</span>
          </a>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-4 text-xs sm:text-sm">
          <span class="badge badge-neutral gap-1.5 py-3"><i class="fa-solid fa-plug-circle-bolt text-primary"></i><span class="mono font-bold">27</span>&nbsp;<span data-i18n="statTools">أداة MCP</span></span>
          <span class="badge badge-neutral gap-1.5 py-3"><i class="fa-solid fa-vector-square text-primary"></i><span class="mono font-bold">768</span>&nbsp;<span data-i18n="statEmbed">بُعد تضمين دلالي</span></span>
          <span class="badge badge-neutral gap-1.5 py-3"><i class="fa-solid fa-vault text-primary"></i><span data-i18n="statVault">خزنة AES-256-GCM</span></span>
          <span class="badge badge-neutral gap-1.5 py-3"><i class="fa-solid fa-layer-group text-primary"></i><span data-i18n="statNs">مجالات معزولة</span></span>
        </div>
      </div>
    </section>

    <!-- WHAT'S NEW IN V4 -->
    <section id="features" class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div class="text-center mb-8">
        <h2 class="text-2xl sm:text-4xl font-black" data-i18n="v4Title">ما الجديد في MemoryZ v4؟</h2>
        <p class="text-base-content/60 mt-2 max-w-2xl mx-auto" data-i18n="v4Sub">أربع ترقيات جوهرية تجعل الاسترجاع أدق، والذاكرة أصدق مع الزمن، والتحديث ممكنا.</p>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div class="card bg-base-200 border border-base-300 shadow-sm">
          <div class="card-body gap-2">
            <div class="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-xl"><i class="fa-solid fa-magnifying-glass-chart"></i></div>
            <h3 class="card-title" data-i18n="v4HybridT">بحث هجين Hybrid Search</h3>
            <p class="text-sm text-base-content/70 leading-relaxed" data-i18n="v4HybridD">تشابه دلالي بالمتجهات + بحث نصي FTS5 ‏(BM25)‏ يدمجهما Reciprocal Rank Fusion. يجد المعرفات الدقيقة والأسماء والأرقام، لا القريب منها فقط.</p>
          </div>
        </div>
        <div class="card bg-base-200 border border-base-300 shadow-sm">
          <div class="card-body gap-2">
            <div class="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center text-xl"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <h3 class="card-title" data-i18n="v4BiT">ذاكرة ثنائية الزمن Bi-Temporal</h3>
            <p class="text-sm text-base-content/70 leading-relaxed" data-i18n="v4BiD">يفرق بين وقت وقوع الحدث ووقت تخزينه. اسأل "ماذا كنا نعرف في مارس؟" أو "ماذا تغير بعد يونيو؟" بفلاتر زمنية حقيقية.</p>
          </div>
        </div>
        <div class="card bg-base-200 border border-base-300 shadow-sm">
          <div class="card-body gap-2">
            <div class="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center text-xl"><i class="fa-solid fa-arrows-rotate"></i></div>
            <h3 class="card-title" data-i18n="v4UpdT">تحديث المعرفة Knowledge Updates</h3>
            <p class="text-sm text-base-content/70 leading-relaxed" data-i18n="v4UpdD">حقيقة جديدة تُحيل القديمة إلى التقاعد تلقائيا (supersedes). لا مزيد من ذاكرة متناقضة تقول الشيء وعكسه في نفس الوقت.</p>
          </div>
        </div>
        <div class="card bg-base-200 border border-base-300 shadow-sm">
          <div class="card-body gap-2">
            <div class="w-11 h-11 rounded-xl bg-warning/15 text-warning flex items-center justify-center text-xl"><i class="fa-solid fa-hand"></i></div>
            <h3 class="card-title" data-i18n="v4AbsT">امتناع صادق Honest Abstention</h3>
            <p class="text-sm text-base-content/70 leading-relaxed" data-i18n="v4AbsD">عتبة تشابه تسقط النتائج الضعيفة. حين لا توجد إجابة في الذاكرة، يقول MemoryZ "لا أعرف" بدل أن يخترع إجابة واثقة.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CORE FEATURES -->
    <section class="bg-base-200/60 border-y border-base-300">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div class="text-center mb-8">
          <h2 class="text-2xl sm:text-4xl font-black" data-i18n="coreTitle">كل ما يحتاجه الوكيل ليتذكر</h2>
          <p class="text-base-content/60 mt-2" data-i18n="coreSub">ذاكرة، مهام، أسرار، وسياق، في ركيزة واحدة.</p>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="card bg-base-100 border border-base-300 shadow-sm"><div class="card-body gap-2">
            <i class="fa-solid fa-boxes-stacked text-primary text-2xl"></i>
            <h3 class="card-title text-base" data-i18n="coreAtomsT">ذرات ذاكرة مصنفة</h3>
            <p class="text-sm text-base-content/70" data-i18n="coreAtomsD">بيئة، تفضيلات، مهارات، ملاحظات. كل ذرة لها نوعها ومجالها ومصدرها.</p>
          </div></div>
          <div class="card bg-base-100 border border-base-300 shadow-sm"><div class="card-body gap-2">
            <i class="fa-solid fa-list-check text-primary text-2xl"></i>
            <h3 class="card-title text-base" data-i18n="coreTasksT">مهام هرمية متعددة الوكلاء</h3>
            <p class="text-sm text-base-content/70" data-i18n="coreTasksD">مهام ومهام فرعية بأي عمق، مع حجز ذري (claim) وتسليم نظيف بين الوكلاء.</p>
          </div></div>
          <div class="card bg-base-100 border border-base-300 shadow-sm"><div class="card-body gap-2">
            <i class="fa-solid fa-lock text-primary text-2xl"></i>
            <h3 class="card-title text-base" data-i18n="coreVaultT">خزنة أسرار بلا معرفة</h3>
            <p class="text-sm text-base-content/70" data-i18n="coreVaultD">تشفير AES-256-GCM من جهة العميل، لا تُفهرس أبدا في المتجهات، ولا تُقرأ إلا في الذاكرة العابرة.</p>
          </div></div>
          <div class="card bg-base-100 border border-base-300 shadow-sm"><div class="card-body gap-2">
            <i class="fa-solid fa-coins text-primary text-2xl"></i>
            <h3 class="card-title text-base" data-i18n="coreTokenT">اقتصاد التوكن</h3>
            <p class="text-sm text-base-content/70" data-i18n="coreTokenD">استرجاع مضغوط وحزم سياق بميزانية توكن صارمة. الذاكرة تصل إلى الموجه ولا تأكله.</p>
          </div></div>
          <div class="card bg-base-100 border border-base-300 shadow-sm"><div class="card-body gap-2">
            <i class="fa-solid fa-share-nodes text-primary text-2xl"></i>
            <h3 class="card-title text-base" data-i18n="coreGraphT">رسم بياني للمعرفة</h3>
            <p class="text-sm text-base-content/70" data-i18n="coreGraphD">روابط مكتوبة (يعتمد على، سياق لـ، مرتبط بـ، يحل محل) مع توسع بجيران الدرجة الأولى عند الاسترجاع.</p>
          </div></div>
          <div class="card bg-base-100 border border-base-300 shadow-sm"><div class="card-body gap-2">
            <i class="fa-solid fa-bolt text-primary text-2xl"></i>
            <h3 class="card-title text-base" data-i18n="coreLiveT">سجلات وويبهوك وتخزين</h3>
            <p class="text-sm text-base-content/70" data-i18n="coreLiveD">سجلات عابرة بلا تكلفة تضمين، ويبهوك فوري للأحداث، وتخزين ملفات R2، ولقطات سياق قابلة للاستعادة.</p>
          </div></div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div class="text-center mb-8">
        <h2 class="text-2xl sm:text-4xl font-black" data-i18n="howTitle">كيف يعمل؟</h2>
        <p class="text-base-content/60 mt-2" data-i18n="howSub">ثلاث خطوات، وذاكرتك تعيش بين الجلسات.</p>
      </div>
      <div class="grid sm:grid-cols-3 gap-4">
        <div class="card bg-base-200 border border-base-300 shadow-sm"><div class="card-body items-center text-center gap-2">
          <span class="badge badge-primary badge-lg font-mono font-bold">1</span>
          <h3 class="card-title" data-i18n="how1T">خزّن</h3>
          <p class="text-sm text-base-content/70" data-i18n="how1D">الوكيل يحفظ الحقائق والتفضيلات والقرارات كذرات ذاكرة، مع تضمين دلالي تلقائي.</p>
          <code class="mono text-xs bg-base-300/60 rounded px-2 py-1">memoryz store --type=preference</code>
        </div></div>
        <div class="card bg-base-200 border border-base-300 shadow-sm"><div class="card-body items-center text-center gap-2">
          <span class="badge badge-primary badge-lg font-mono font-bold">2</span>
          <h3 class="card-title" data-i18n="how2T">استدعِ</h3>
          <p class="text-sm text-base-content/70" data-i18n="how2D">استرجاع هجين دلالي ونصي، بميزانية توكن، يجد الدقيق ويمتنع عن الضعيف.</p>
          <code class="mono text-xs bg-base-300/60 rounded px-2 py-1">memoryz recall "ports" --compact</code>
        </div></div>
        <div class="card bg-base-200 border border-base-300 shadow-sm"><div class="card-body items-center text-center gap-2">
          <span class="badge badge-primary badge-lg font-mono font-bold">3</span>
          <h3 class="card-title" data-i18n="how3T">نسّق</h3>
          <p class="text-sm text-base-content/70" data-i18n="how3D">مهام هرمية يحجزها وكيل ويسلمها لآخر، والقرارات تتحول إلى ذاكرة دائمة.</p>
          <code class="mono text-xs bg-base-300/60 rounded px-2 py-1">memoryz task add "Refactor auth"</code>
        </div></div>
      </div>
    </section>

    <!-- QUICKSTART -->
    <section id="quickstart" class="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
      <div class="card bg-base-200 border border-base-300 shadow-sm">
        <div class="card-body gap-4">
          <h2 class="text-2xl sm:text-3xl font-black" data-i18n="qsTitle">البدء السريع</h2>
          <p class="text-base-content/70" data-i18n="qsSub">أمر واحد يربط MemoryZ بمحررك ويسجل خادم MCP تلقائيا.</p>
          <div class="mockup-code overflow-x-auto">
            <pre data-prefix="$"><code>npx memoryz init --token=&lt;YOUR_API_KEY&gt;</code></pre>
          </div>
          <div class="flex flex-wrap gap-3">
            <a href="/docs" class="btn btn-primary gap-2 font-bold"><i class="fa-solid fa-book-open"></i><span data-i18n="qsDocs">دليل الربط الكامل</span></a>
            <a href="https://github.com/Zizwar/memoryz" target="_blank" rel="noopener noreferrer" class="btn btn-outline gap-2 font-bold"><i class="fa-brands fa-github"></i><span>GitHub</span></a>
            <a href="https://www.npmjs.com/package/memoryz" target="_blank" rel="noopener noreferrer" class="btn btn-outline gap-2 font-bold"><i class="fa-brands fa-npm"></i><span>npm</span></a>
          </div>
          <p class="text-xs text-base-content/50" data-i18n="qsNote">يعمل مع Claude Code و Cursor و Windsurf و ChatGPT وخطوط الأنابيب المستقلة، عبر MCP أو REST أو CLI.</p>
        </div>
      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="border-t border-base-300 bg-base-200/60">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
      <div class="flex items-center gap-2 font-bold">
        <span>Memory<span class="text-primary">Z</span></span>
        <span class="badge badge-primary badge-xs font-mono">v4</span>
        <span class="text-base-content/50 font-normal" data-i18n="footerTag">ذاكرة حية سيادية للوكلاء</span>
      </div>
      <div class="flex items-center gap-4 text-base-content/60">
        <a href="/dash" class="hover:text-primary" data-i18n="footerDash">لوحة التحكم</a>
        <a href="/docs" class="hover:text-primary" data-i18n="footerDocs">التوثيق</a>
        <a href="https://github.com/Zizwar/memoryz" target="_blank" rel="noopener noreferrer" class="hover:text-primary">GitHub</a>
        <span class="mono text-xs">MIT</span>
      </div>
    </div>
  </footer>

  <script>
    const LANDING_I18N = {
      ar: {
        navFeatures: 'المميزات', navHow: 'كيف يعمل', navQuickstart: 'البدء السريع', navDocs: 'التوثيق', navDashboard: 'لوحة التحكم',
        heroBadge: 'MemoryZ v4 — Hybrid Search · Bi-Temporal · LongMemEval-ready',
        heroTitle1: 'ذاكرة حية', heroTitle2: 'لوكلاء الذكاء الاصطناعي',
        heroSub: 'ركيزة ذاكرة مشتركة وحية عبر Claude و Cursor و Windsurf و ChatGPT: وكيلك يتذكر ما تعلمه البارحة، ويشارك ما يعرفه مع باقي الوكلاء، ولا يخترع ما لا يعرفه.',
        ctaDashboard: 'افتح لوحة التحكم', ctaDocs: 'اقرأ التوثيق',
        statTools: 'أداة MCP', statEmbed: 'بُعد تضمين دلالي', statVault: 'خزنة AES-256-GCM', statNs: 'مجالات معزولة',
        v4Title: 'ما الجديد في MemoryZ v4؟', v4Sub: 'أربع ترقيات جوهرية تجعل الاسترجاع أدق، والذاكرة أصدق مع الزمن، والتحديث ممكنا.',
        v4HybridT: 'بحث هجين Hybrid Search', v4HybridD: 'تشابه دلالي بالمتجهات + بحث نصي FTS5 (BM25) يدمجهما Reciprocal Rank Fusion. يجد المعرفات الدقيقة والأسماء والأرقام، لا القريب منها فقط.',
        v4BiT: 'ذاكرة ثنائية الزمن Bi-Temporal', v4BiD: 'يفرق بين وقت وقوع الحدث ووقت تخزينه. اسأل "ماذا كنا نعرف في مارس؟" أو "ماذا تغير بعد يونيو؟" بفلاتر زمنية حقيقية.',
        v4UpdT: 'تحديث المعرفة Knowledge Updates', v4UpdD: 'حقيقة جديدة تُحيل القديمة إلى التقاعد تلقائيا (supersedes). لا مزيد من ذاكرة متناقضة تقول الشيء وعكسه في نفس الوقت.',
        v4AbsT: 'امتناع صادق Honest Abstention', v4AbsD: 'عتبة تشابه تسقط النتائج الضعيفة. حين لا توجد إجابة في الذاكرة، يقول MemoryZ "لا أعرف" بدل أن يخترع إجابة واثقة.',
        coreTitle: 'كل ما يحتاجه الوكيل ليتذكر', coreSub: 'ذاكرة، مهام، أسرار، وسياق، في ركيزة واحدة.',
        coreAtomsT: 'ذرات ذاكرة مصنفة', coreAtomsD: 'بيئة، تفضيلات، مهارات، ملاحظات. كل ذرة لها نوعها ومجالها ومصدرها.',
        coreTasksT: 'مهام هرمية متعددة الوكلاء', coreTasksD: 'مهام ومهام فرعية بأي عمق، مع حجز ذري (claim) وتسليم نظيف بين الوكلاء.',
        coreVaultT: 'خزنة أسرار بلا معرفة', coreVaultD: 'تشفير AES-256-GCM من جهة العميل، لا تُفهرس أبدا في المتجهات، ولا تُقرأ إلا في الذاكرة العابرة.',
        coreTokenT: 'اقتصاد التوكن', coreTokenD: 'استرجاع مضغوط وحزم سياق بميزانية توكن صارمة. الذاكرة تصل إلى الموجه ولا تأكله.',
        coreGraphT: 'رسم بياني للمعرفة', coreGraphD: 'روابط مكتوبة (يعتمد على، سياق لـ، مرتبط بـ، يحل محل) مع توسع بجيران الدرجة الأولى عند الاسترجاع.',
        coreLiveT: 'سجلات وويبهوك وتخزين', coreLiveD: 'سجلات عابرة بلا تكلفة تضمين، ويبهوك فوري للأحداث، وتخزين ملفات R2، ولقطات سياق قابلة للاستعادة.',
        howTitle: 'كيف يعمل؟', howSub: 'ثلاث خطوات، وذاكرتك تعيش بين الجلسات.',
        how1T: 'خزّن', how1D: 'الوكيل يحفظ الحقائق والتفضيلات والقرارات كذرات ذاكرة، مع تضمين دلالي تلقائي.',
        how2T: 'استدعِ', how2D: 'استرجاع هجين دلالي ونصي، بميزانية توكن، يجد الدقيق ويمتنع عن الضعيف.',
        how3T: 'نسّق', how3D: 'مهام هرمية يحجزها وكيل ويسلمها لآخر، والقرارات تتحول إلى ذاكرة دائمة.',
        qsTitle: 'البدء السريع', qsSub: 'أمر واحد يربط MemoryZ بمحررك ويسجل خادم MCP تلقائيا.',
        qsDocs: 'دليل الربط الكامل', qsNote: 'يعمل مع Claude Code و Cursor و Windsurf و ChatGPT وخطوط الأنابيب المستقلة، عبر MCP أو REST أو CLI.',
        footerTag: 'ذاكرة حية سيادية للوكلاء', footerDash: 'لوحة التحكم', footerDocs: 'التوثيق'
      },
      en: {
        navFeatures: 'Features', navHow: 'How it works', navQuickstart: 'Quickstart', navDocs: 'Docs', navDashboard: 'Dashboard',
        heroBadge: 'MemoryZ v4 — Hybrid Search · Bi-Temporal · LongMemEval-ready',
        heroTitle1: 'Live memory', heroTitle2: 'for AI agents',
        heroSub: 'One shared, living memory substrate across Claude, Cursor, Windsurf and ChatGPT: your agent remembers what it learned yesterday, shares what it knows with the other agents, and never invents what it does not know.',
        ctaDashboard: 'Open Dashboard', ctaDocs: 'Read the Docs',
        statTools: 'MCP tools', statEmbed: 'embedding dims', statVault: 'AES-256-GCM vault', statNs: 'isolated namespaces',
        v4Title: "What's new in MemoryZ v4?", v4Sub: 'Four core upgrades that make retrieval sharper, memory truer over time, and updates possible.',
        v4HybridT: 'Hybrid Search', v4HybridD: 'Vector similarity + FTS5 full-text search (BM25), fused with Reciprocal Rank Fusion. It finds exact identifiers, names and numbers, not just near matches.',
        v4BiT: 'Bi-Temporal Memory', v4BiD: 'It separates when an event happened from when it was stored. Ask "what did we know in March?" or "what changed after June?" with real time filters.',
        v4UpdT: 'Knowledge Updates', v4UpdD: 'A new fact retires the old one automatically (supersedes). No more memory that says a thing and its opposite at the same time.',
        v4AbsT: 'Honest Abstention', v4AbsD: 'A similarity threshold drops weak results. When the answer is not in memory, MemoryZ says it does not know instead of inventing a confident answer.',
        coreTitle: 'Everything an agent needs to remember', coreSub: 'Memory, tasks, secrets and context in one substrate.',
        coreAtomsT: 'Categorized memory atoms', coreAtomsD: 'Environment, preferences, skills, notes. Every atom has its type, namespace and provenance.',
        coreTasksT: 'Hierarchical multi-agent tasks', coreTasksD: 'Tasks and subtasks at any depth, with atomic claiming and clean handoff between agents.',
        coreVaultT: 'Zero-knowledge vault', coreVaultD: 'Client-side AES-256-GCM encryption, never indexed in vectors, only ever read in transient memory.',
        coreTokenT: 'Token economy', coreTokenD: 'Compact recall and context packs with a strict token budget. Memory reaches the prompt without eating it.',
        coreGraphT: 'Knowledge graph', coreGraphD: 'Typed links (depends on, context for, related, supersedes) with first-hop expansion at recall time.',
        coreLiveT: 'Logs, webhooks & storage', coreLiveD: 'Ephemeral logs with zero embedding cost, real-time event webhooks, R2 file storage and restorable context snapshots.',
        howTitle: 'How it works', howSub: 'Three steps, and your memory lives between sessions.',
        how1T: 'Store', how1D: 'The agent saves facts, preferences and decisions as memory atoms, with automatic semantic embeddings.',
        how2T: 'Recall', how2D: 'Hybrid semantic and text retrieval, token-budgeted, that finds the exact and abstains on the weak.',
        how3T: 'Coordinate', how3D: 'Hierarchical tasks claimed by one agent and handed to the next, and decisions become durable memory.',
        qsTitle: 'Quickstart', qsSub: 'One command connects MemoryZ to your editor and registers the MCP server automatically.',
        qsDocs: 'Full connection guide', qsNote: 'Works with Claude Code, Cursor, Windsurf, ChatGPT and standalone pipelines, over MCP, REST or CLI.',
        footerTag: 'Sovereign living memory for agents', footerDash: 'Dashboard', footerDocs: 'Docs'
      }
    };

    function applyLandingLang(lang) {
      const dict = LANDING_I18N[lang] || LANDING_I18N.ar;
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) el.textContent = dict[key];
      });
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      localStorage.setItem('mz_lang', lang);
      document.querySelectorAll('[data-lang-btn]').forEach((b) => {
        b.classList.toggle('btn-primary', b.getAttribute('data-lang-btn') === lang);
      });
    }

    document.querySelectorAll('[data-lang-btn]').forEach((b) => {
      b.addEventListener('click', () => applyLandingLang(b.getAttribute('data-lang-btn')));
    });
    applyLandingLang(localStorage.getItem('mz_lang') || 'ar');
  </script>
</body>
</html>`;
}
