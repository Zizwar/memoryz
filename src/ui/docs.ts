export const DEFAULT_SKILL_MD = `---
name: memoryz
description: Sovereign Agentic Memory & Hierarchical Task Substrate. Use to recall developer preferences with token-saving formats, manage hierarchical multi-agent tasks, log ephemeral traces, and store persistent instructions.
---

# MemoryZ v2 — Sovereign Agentic Memory & Task Substrate

MemoryZ v2 gives you a persistent, living cross-session memory substrate and hierarchical task coordinator.

## 1. Token-Saving Memory Recall
- Before starting a task, check developer rules or environment specs:
  \`memoryz recall "<task topic>" --compact\`
  OR dense prompt bundle (tasks + memories):
  \`memoryz context "<task topic>"\`

## 2. Hierarchical Tasks & Multi-Agent TODOs
- View current tasks as an ultra-compact ASCII tree:
  \`memoryz task list --tree\`
- Create a root task or nested child subtask:
  \`memoryz task add "<title>" [--parent=<id>] [--priority=high] [--assignee=<agent>]\`
- Mark a task done:
  \`memoryz task done <id>\`
- Update task status:
  \`memoryz task update <id> --status=in_progress\`

## 3. Ephemeral Logs & Scratchpad
- For temporary execution notes, run traces, or low-importance logs (skips vector embedding):
  \`memoryz log "<message>" [--level=info] [--source=agent]\`
  \`memoryz logs --limit=20\`

## 4. When to Store Persistent Memory
- When the developer gives durable instructions or preferences:
  \`memoryz store --type=preference --content="<rule text>"\`
  Types:
  - \`env\`: Ports, infrastructure, domains, CLI tool choices.
  - \`preference\`: Coding habits, architectural patterns, styles.
  - \`skill\`: Multi-step procedure prompts or custom agent workflows.
  - \`note\`: Reference facts, URLs, documentation pointers.

## 5. Secret Vault
- For credentials and API keys:
  \`memoryz vault store --key="<name>" --secret="<val>" --pass="<passphrase>"\`
  \`memoryz vault get --key="<name>" --pass="<passphrase>"\`
`;

export function renderDocsHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemoryZ v2 Docs — دليل الربط والتكامل الشامل</title>

  <!-- Theme init before render -->
  <script>
    (function() {
      const savedTheme = localStorage.getItem('memoryz_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    })();
  </script>

  <!-- Fonts & Styles -->
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
    .code-block { direction: ltr; text-align: left; font-family: 'Fira Code', monospace; }
  </style>
</head>

<body class="min-h-screen bg-base-100 text-base-content flex flex-col antialiased selection:bg-primary selection:text-primary-content"
      x-data="docsApp()"
      x-cloak>

  <!-- NAVBAR -->
  <header class="navbar bg-base-200/90 backdrop-blur border-b border-base-300 sticky top-0 z-40 px-3 sm:px-6 h-14 min-h-14">
    <div class="flex-1 flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center font-black shadow-md text-sm">
          <i class="fa-solid fa-brain"></i>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-base sm:text-lg font-black tracking-tight">Memory<span class="text-primary">Z</span></span>
          <span class="badge badge-primary badge-xs font-mono font-bold tracking-wider">DOCS</span>
        </div>
      </a>
      <span class="text-xs text-base-content/50 hidden md:inline">| دليل الربط والتكامل الشامل</span>
    </div>

    <div class="flex-none flex items-center gap-1 sm:gap-2">
      <!-- Return to App -->
      <a href="/" class="btn btn-ghost btn-xs sm:btn-sm gap-1">
        <i class="fa-solid fa-arrow-left text-xs"></i>
        <span class="hidden sm:inline">العودة للتطبيق</span>
      </a>

      <!-- GitHub Link -->
      <a href="https://github.com/Zizwar/memoryz" target="_blank" rel="noopener noreferrer"
         class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="مستودع GitHub">
        <i class="fa-brands fa-github text-sm sm:text-base"></i>
      </a>

      <!-- NPM Link -->
      <a href="https://www.npmjs.com/package/memoryz" target="_blank" rel="noopener noreferrer"
         class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" data-tip="حزمة NPM (memoryz)">
        <i class="fa-brands fa-npm text-sm sm:text-lg text-error"></i>
      </a>

      <!-- Theme Switcher -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom"
              :data-tip="theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'"
              @click="toggleTheme()">
        <i class="fa-solid text-xs sm:text-sm" :class="theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-primary'"></i>
      </button>
    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6">

    <!-- HERO HEADER -->
    <div class="card bg-base-200/60 border border-base-300 p-5 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
      <div class="max-w-2xl relative z-10">
        <div class="flex items-center gap-2 mb-2">
          <span class="badge badge-primary font-bold">MemoryZ v2 Architecture</span>
          <span class="badge badge-outline text-xs font-mono">Living Substrate</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mb-3">دليل التكامل وطرق الارتباط الشاملة</h1>
        <p class="text-sm sm:text-base text-base-content/80 leading-relaxed">
          يوفر MemoryZ v2 أرضية ذاكرة حيّة وتنسيق مهام فائق الاقتصاد في التوكن لوكلاء الذكاء الاصطناعي والمطورين. يمكنك ربطه بأربع طرق مرنة وقوية:
        </p>
      </div>
      <div class="absolute -left-6 -bottom-6 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <!-- QUICK NAV CARDS -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <a href="#mcp" class="card bg-base-200/80 hover:bg-base-200 border border-base-300 hover:border-primary/50 p-3 sm:p-4 rounded-xl transition-all group">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center text-sm font-bold">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <div class="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors">1. بروتوكول MCP</div>
            <div class="text-[11px] text-base-content/60">Cursor & Claude Desktop</div>
          </div>
        </div>
      </a>

      <a href="#code" class="card bg-base-200/80 hover:bg-base-200 border border-base-300 hover:border-primary/50 p-3 sm:p-4 rounded-xl transition-all group">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-info/20 text-info flex items-center justify-center text-sm font-bold">
            <i class="fa-solid fa-code"></i>
          </div>
          <div>
            <div class="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors">2. الكود والـ SDK</div>
            <div class="text-[11px] text-base-content/60">NPM & Node & Python</div>
          </div>
        </div>
      </a>

      <a href="#agent" class="card bg-base-200/80 hover:bg-base-200 border border-base-300 hover:border-primary/50 p-3 sm:p-4 rounded-xl transition-all group">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center text-sm font-bold">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div>
            <div class="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors">3. عبر الوكيل (Agent)</div>
            <div class="text-[11px] text-base-content/60">AGENTS.md وقواعد السياق</div>
          </div>
        </div>
      </a>

      <a href="#skill" class="card bg-base-200/80 hover:bg-base-200 border border-base-300 hover:border-primary/50 p-3 sm:p-4 rounded-xl transition-all group">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">
            <i class="fa-solid fa-scroll"></i>
          </div>
          <div>
            <div class="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors">4. عبر المهارة (Skill)</div>
            <div class="text-[11px] text-base-content/60">skill.md لوكلاء الذكاء</div>
          </div>
        </div>
      </a>
    </div>

    <!-- ============================================================= -->
    <!-- SECTION 1: MCP PROTOCOL -->
    <!-- ============================================================= -->
    <section id="mcp" class="card bg-base-200/70 border border-base-300 p-5 sm:p-7 rounded-2xl shadow-sm flex flex-col gap-4">
      <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-base-300">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-warning/20 text-warning flex items-center justify-center font-black">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-black">1. الارتباط عبر بروتوكول MCP (Model Context Protocol)</h2>
            <p class="text-xs text-base-content/70">توصيل MemoryZ مباشرة مع بيئات التطوير الذكية مثل Cursor و Claude Code و Windsurf و Claude Desktop.</p>
          </div>
        </div>
        <span class="badge badge-warning badge-sm font-mono">stdio & SSE Stream</span>
      </div>

      <div class="space-y-4 text-sm leading-relaxed">
        <div>
          <h3 class="font-bold text-base mb-1.5 flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles text-warning text-xs"></i>
            أ. التثبيت والتسجيل التلقائي بنقرة واحدة (موصى به)
          </h3>
          <p class="text-xs text-base-content/80 mb-2">
            يقوم أمر <code class="mono text-xs bg-base-300 px-1 py-0.5 rounded">npx memoryz init</code> باكتشاف محرراتك تلقائياً وإضافتها لملفات الإعدادات:
          </p>
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre data-prefix="$"><code>npx memoryz init --token=YOUR_API_TOKEN</code></pre>
            <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText('npx memoryz init --token=YOUR_API_TOKEN')">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-base mb-1.5 flex items-center gap-2">
            <i class="fa-solid fa-sliders text-warning text-xs"></i>
            ب. التكوين اليدوي عبر ملفات JSON (Cursor / Claude Desktop / Windsurf)
          </h3>
          <p class="text-xs text-base-content/80 mb-2">
            في ملف <code class="mono text-xs bg-base-300 px-1 py-0.5 rounded">.cursor/mcp.json</code> أو <code class="mono text-xs bg-base-300 px-1 py-0.5 rounded">claude_desktop_config.json</code>:
          </p>
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre><code>{
  "mcpServers": {
    "memoryz": {
      "command": "npx",
      "args": ["-y", "memoryz", "mcp"],
      "env": {
        "MEMORYZ_URL": "https://memoryz.wino.deno.net",
        "MEMORYZ_TOKEN": "YOUR_API_KEY_HERE"
      }
    }
  }
}</code></pre>
            <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText(mcpJsonConfig)">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-base mb-1.5 flex items-center gap-2">
            <i class="fa-solid fa-network-wired text-warning text-xs"></i>
            ج. رابط MCP Remote المباشر (SSE Transport)
          </h3>
          <p class="text-xs text-base-content/80 mb-2">
            يدعم السيرفر بروتوكول SSE مباشر بدون تثبيت Node.js محلياً:
          </p>
          <div class="flex items-center gap-2 flex-wrap">
            <div class="bg-base-300/80 border border-base-300 px-3 py-2 rounded-xl mono text-xs flex-1 break-all select-all">
              https://memoryz.wino.deno.net/sse
            </div>
            <button class="btn btn-warning btn-sm gap-1" @click="copyText('https://memoryz.wino.deno.net/sse')">
              <i class="fa-solid fa-copy text-xs"></i> <span>نسخ رابط SSE</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================= -->
    <!-- SECTION 2: CODE & SDK INTEGRATION -->
    <!-- ============================================================= -->
    <section id="code" class="card bg-base-200/70 border border-base-300 p-5 sm:p-7 rounded-2xl shadow-sm flex flex-col gap-4">
      <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-base-300">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-info/20 text-info flex items-center justify-center font-black">
            <i class="fa-solid fa-code"></i>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-black">2. الارتباط عبر الكود والـ SDK (Node.js & Python & Shell)</h2>
            <p class="text-xs text-base-content/70">استدعاء الذاكرة والمهام والخزنة برمجياً من تطبيقاتك وسكربتاتك المستقلة.</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <span class="badge badge-info badge-sm font-mono">npm i memoryz</span>
          <span class="badge badge-ghost badge-sm font-mono">Python SDK</span>
        </div>
      </div>

      <div class="space-y-4 text-sm leading-relaxed">
        <div>
          <h3 class="font-bold text-base mb-1.5 flex items-center gap-2">
            <i class="fa-brands fa-npm text-error text-sm"></i>
            حزمة Node.js / TypeScript:
          </h3>
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre data-prefix="$"><code>npm install memoryz</code></pre>
            <pre data-prefix=">"><code>// كود الاستدعاء داخل تطبيقك:</code></pre>
            <pre><code>import { MemoryzClient } from 'memoryz';

const mz = new MemoryzClient({
  url: 'https://memoryz.wino.deno.net',
  token: process.env.MEMORYZ_TOKEN
});

// 1. استرجاع دلالي مقتصد للتوكن
const memories = await mz.recall('Database schema and rules', { compact: true });

// 2. إدارة المهام الشجرية
const task = await mz.createTask({
  title: 'Optimize Vector Query',
  priority: 'high'
});

// 3. تخزين لوغ لحظي سريع بدون أعباء الفيكتور
await mz.log('Worker executed synchronization in 24ms');</code></pre>
            <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText(nodeCodeSnippet)">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-base mb-1.5 flex items-center gap-2">
            <i class="fa-brands fa-python text-warning text-sm"></i>
            عميل Python الخفيف (Single-File SDK):
          </h3>
          <p class="text-xs text-base-content/80 mb-2">
            يمكنك تحميل <code class="mono text-xs bg-base-300 px-1 py-0.5 rounded">memoryz.py</code> مباشرة بدون أي اعتماديات خارجية (Zero-Dependency):
          </p>
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre data-prefix="$"><code>curl -sO https://memoryz.wino.deno.net/memoryz.py</code></pre>
            <pre data-prefix=">"><code>from memoryz import MemoryzClient</code></pre>
            <pre><code>client = MemoryzClient(token="YOUR_TOKEN")
print(client.recall("project guidelines", compact=True))</code></pre>
            <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText('curl -sO https://memoryz.wino.deno.net/memoryz.py')">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================= -->
    <!-- SECTION 3: AGENT SUBSTRATE (AGENTS.MD) -->
    <!-- ============================================================= -->
    <section id="agent" class="card bg-base-200/70 border border-base-300 p-5 sm:p-7 rounded-2xl shadow-sm flex flex-col gap-4">
      <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-base-300">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center font-black">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-black">3. الارتباط من خلال الوكيل الذكي (Autonomous AI Agent Substrate)</h2>
            <p class="text-xs text-base-content/70">إدراج قواعد الذاكرة والمهام في ملفات التوجيه الذاتي للوكيل (AGENTS.md أو CLAUDE.md).</p>
          </div>
        </div>
        <span class="badge badge-secondary badge-sm font-mono">Zero Context Bloat</span>
      </div>

      <div class="space-y-4 text-sm leading-relaxed">
        <p class="text-xs sm:text-sm text-base-content/80">
          ضع التوجيهات التالية في ملف <code class="mono text-xs bg-base-300 px-1 py-0.5 rounded">AGENTS.md</code> في جذر مشروعك ليقوم أي وكيل (Claude Code, Antigravity, Cursor Agent) بالرجوع تلقائياً لذاكرة المشروع وتحديث المهام دون استهلاك سياق المحادثة:
        </p>

        <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
          <pre><code># Project Agent Rules — MemoryZ Substrate
This project connects to MemoryZ v2 (memoryz.wino.deno.net):
- Token-Saving Recall: Use \`memoryz recall "<query>" --compact\`
- Prompt Context Pack: Use \`memoryz context "<query>"\` to get active tasks & rules
- Hierarchical Tasks / TODOs:
  - View task tree: \`memoryz task list --tree\`
  - Add task or subtask: \`memoryz task add "<title>" [--parent=<id>]\`
  - Mark completed: \`memoryz task done <id>\`
  - Update status: \`memoryz task update <id> --status=<todo|in_progress|done>\`
- Ephemeral Logs: Use \`memoryz log "<message>"\` for fast execution traces
- Persistent Rules: Use \`memoryz store --type=preference|env|skill|note --content="..."\`</code></pre>
          <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                  @click="copyText(agentsMdSnippet)">
            <i class="fa-solid fa-copy"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- ============================================================= -->
    <!-- SECTION 4: SKILL FILE INTEGRATION (SKILL.MD) -->
    <!-- ============================================================= -->
    <section id="skill" class="card bg-base-200/70 border border-base-300 p-5 sm:p-7 rounded-2xl shadow-sm flex flex-col gap-4">
      <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-base-300">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-black">
            <i class="fa-solid fa-scroll"></i>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl font-black">4. الارتباط عبر ملف المهارة (Skill File — skill.md)</h2>
            <p class="text-xs text-base-content/70">تزويد الوكلاء كمهارة مستقلة قابلة للتحميل والاستدعاء المباشر.</p>
          </div>
        </div>
        <span class="badge badge-accent badge-sm font-mono">No Token Leakage</span>
      </div>

      <div class="space-y-4 text-sm leading-relaxed">
        <div class="alert alert-warning/15 border border-warning/30 text-xs py-2.5 px-4 rounded-xl flex items-center gap-2.5">
          <i class="fa-solid fa-shield-halved text-warning text-sm flex-none"></i>
          <span>
            <strong>تأكيد الأمان والخصوصية:</strong> ملف <code class="mono bg-base-300 px-1 py-0.5 rounded">skill.md</code> عام وخالٍ تماماً من أي مفاتيح سرية أو Auth Tokens، ويعتمد على أوامر الـ CLI وبيئة الوكيل لحماية بياناتك.
          </span>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-base-300/60 p-4 rounded-xl border border-base-300">
          <div class="flex-1 min-w-0">
            <div class="font-bold text-xs sm:text-sm">رابط تحميل ملف المهارة المباشر:</div>
            <div class="mono text-xs text-primary truncate">https://memoryz.wino.deno.net/skill.md</div>
          </div>
          <div class="flex items-center gap-2 flex-none">
            <a href="/skill.md?download=true" class="btn btn-accent btn-sm gap-1">
              <i class="fa-solid fa-download text-xs"></i> <span>تحميل skill.md</span>
            </a>
            <button class="btn btn-outline btn-sm gap-1" @click="copyText('https://memoryz.wino.deno.net/skill.md')">
              <i class="fa-solid fa-copy text-xs"></i> <span>نسخ الرابط</span>
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-base mb-1.5 flex items-center gap-2">
            <i class="fa-solid fa-folder-tree text-accent text-xs"></i>
            كيفية تثبيت المهارة في مشروعك:
          </h3>
          <p class="text-xs text-base-content/80 mb-2">
            قم بتنزيل الملف مباشرة إلى مجلد مهارات الوكيل (Skills Directory) بأمر واحد في الطرفية:
          </p>
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre data-prefix="$"><code>mkdir -p .agents/skills/memoryz && curl -sSL https://memoryz.wino.deno.net/skill.md > .agents/skills/memoryz/SKILL.md</code></pre>
            <button class="btn btn-ghost btn-xs absolute left-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText('mkdir -p .agents/skills/memoryz && curl -sSL https://memoryz.wino.deno.net/skill.md > .agents/skills/memoryz/SKILL.md')">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-base mb-1.5 flex items-center gap-2">
            <i class="fa-solid fa-file-lines text-accent text-xs"></i>
            معاينة محتوى ملف المهارة (SKILL.md):
          </h3>
          <div class="bg-base-300 p-3.5 rounded-xl border border-base-content/10 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto scrollbar-thin">
` + DEFAULT_SKILL_MD.replace(/</g, "&lt;").replace(/>/g, "&gt;") + `
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- FOOTER -->
  <footer class="footer footer-center p-6 bg-base-200 text-base-content border-t border-base-300 mt-10">
    <aside class="flex flex-col items-center gap-2">
      <div class="flex items-center gap-2 font-black text-base">
        <div class="w-6 h-6 rounded bg-primary text-primary-content flex items-center justify-center text-xs">
          <i class="fa-solid fa-brain"></i>
        </div>
        <span>MemoryZ v2 Documentation</span>
      </div>
      <p class="text-xs text-base-content/70">
        Sovereign Living Memory & Hierarchical Task Substrate for Next-Gen Autonomous AI Agents.
      </p>
      <div class="flex items-center gap-4 mt-2">
        <a href="https://github.com/Zizwar/memoryz" target="_blank" rel="noopener noreferrer" class="link link-hover text-xs flex items-center gap-1">
          <i class="fa-brands fa-github"></i> GitHub
        </a>
        <a href="https://www.npmjs.com/package/memoryz" target="_blank" rel="noopener noreferrer" class="link link-hover text-xs flex items-center gap-1 text-error">
          <i class="fa-brands fa-npm"></i> NPM Package
        </a>
        <a href="/skill.md" class="link link-hover text-xs flex items-center gap-1 text-accent">
          <i class="fa-solid fa-scroll"></i> skill.md
        </a>
      </div>
    </aside>
  </footer>

  <!-- Toast Notification -->
  <div class="toast toast-end toast-bottom z-50 pointer-events-none" x-show="toast.show" x-transition>
    <div class="alert alert-info py-2 px-4 shadow-lg text-xs font-semibold gap-2">
      <i class="fa-solid fa-circle-check text-success"></i>
      <span x-text="toast.message"></span>
    </div>
  </div>

  <script>
    function docsApp() {
      return {
        theme: localStorage.getItem('memoryz_theme') || 'dark',
        toast: { show: false, message: '' },
        
        mcpJsonConfig: JSON.stringify({
          mcpServers: {
            memoryz: {
              command: "npx",
              args: ["-y", "memoryz", "mcp"],
              env: {
                MEMORYZ_URL: "https://memoryz.wino.deno.net",
                MEMORYZ_TOKEN: "YOUR_API_KEY_HERE"
              }
            }
          }
        }, null, 2),

        nodeCodeSnippet: \`import { MemoryzClient } from 'memoryz';

const mz = new MemoryzClient({
  url: 'https://memoryz.wino.deno.net',
  token: process.env.MEMORYZ_TOKEN
});

// 1. استرجاع دلالي مقتصد للتوكن
const memories = await mz.recall('Database schema and rules', { compact: true });

// 2. إدارة المهام الشجرية
const task = await mz.createTask({
  title: 'Optimize Vector Query',
  priority: 'high'
});

// 3. تخزين لوغ لحظي سريع بدون أعباء الفيكتور
await mz.log('Worker executed synchronization in 24ms');\`,

        agentsMdSnippet: \`# Project Agent Rules — MemoryZ Substrate
This project connects to MemoryZ v2 (memoryz.wino.deno.net):
- Token-Saving Recall: Use \` + "\`memoryz recall \\\"<query>\\\" --compact\`" + \`
- Prompt Context Pack: Use \` + "\`memoryz context \\\"<query>\\\"\`" + \` to get active tasks & rules
- Hierarchical Tasks / TODOs:
  - View task tree: \` + "\`memoryz task list --tree\`" + \`
  - Add task or subtask: \` + "\`memoryz task add \\\"<title>\\\" [--parent=<id>]\`" + \`
  - Mark completed: \` + "\`memoryz task done <id>\`" + \`
  - Update status: \` + "\`memoryz task update <id> --status=<todo|in_progress|done>\`" + \`
- Ephemeral Logs: Use \` + "\`memoryz log \\\"<message>\\\"\`" + \` for fast execution traces
- Persistent Rules: Use \` + "\`memoryz store --type=preference|env|skill|note --content=\\\"...\\\"\`",

        toggleTheme() {
          this.theme = this.theme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('memoryz_theme', this.theme);
          document.documentElement.setAttribute('data-theme', this.theme);
        },

        async copyText(txt) {
          if (!txt) return;
          await navigator.clipboard.writeText(txt);
          this.toast.message = 'تم النسخ إلى الحافظة بنجاح 📋';
          this.toast.show = true;
          setTimeout(() => { this.toast.show = false; }, 3000);
        }
      }
    }
  </script>
</body>
</html>`;
}
