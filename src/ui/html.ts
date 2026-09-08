export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemoryZ — Sovereign Agentic Memory Substrate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --bg-card: rgba(18, 26, 43, 0.75);
      --bg-card-hover: rgba(26, 38, 64, 0.85);
      --border: rgba(56, 189, 248, 0.15);
      --border-glow: rgba(56, 189, 248, 0.4);
      --primary: #38bdf8;
      --primary-glow: #0284c7;
      --emerald: #10b981;
      --amber: #f59e0b;
      --purple: #a855f7;
      --rose: #f43f5e;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.05) 0px, transparent 60%);
      color: var(--text-main);
      font-family: 'Tajawal', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.6;
    }

    code, pre, .mono {
      font-family: 'Fira Code', monospace;
      direction: ltr;
      text-align: left;
    }

    /* Container */
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }

    /* Navigation */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      margin-bottom: 32px;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .brand-logo {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: #040813;
      font-size: 22px;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
    }

    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #fff, #93c5fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-badge {
      font-size: 11px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid var(--border);
      font-weight: 600;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-btn {
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font-family: inherit;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #fff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #0369a1, #1d4ed8);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--primary);
    }

    /* Tabs */
    .tabs-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 12px;
      overflow-x: auto;
    }

    .tab-item {
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      font-family: inherit;
    }

    .tab-item.active {
      color: var(--primary);
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid var(--border);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-glow);
    }

    .stat-title {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
    }

    .stat-sub {
      font-size: 12px;
      color: var(--emerald);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Search & Filter Toolbar */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
      background: var(--bg-card);
      padding: 16px;
      border-radius: 16px;
      border: 1px solid var(--border);
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
    }

    .search-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border);
      padding: 12px 16px 12px 42px;
      border-radius: 12px;
      color: #fff;
      font-size: 15px;
      outline: none;
      transition: all 0.2s;
      font-family: inherit;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .type-pills {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .pill-btn {
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .pill-btn:hover {
      border-color: var(--primary);
      color: #fff;
    }
    .pill-btn.active {
      background: var(--primary);
      color: #040813;
      border-color: var(--primary);
      font-weight: 700;
    }

    /* Memory Cards */
    .memories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 18px;
    }

    .memory-card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .memory-card:hover {
      border-color: var(--border-glow);
      background: var(--bg-card-hover);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }

    .memory-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }

    .badge-env { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge-preference { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-skill { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .badge-note { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

    .memory-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }

    .memory-content {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      margin-bottom: 16px;
      flex-grow: 1;
    }

    .memory-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 12px;
      color: var(--text-muted);
    }

    .recall-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
    }

    .card-actions {
      display: flex;
      gap: 6px;
    }

    .action-icon-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .action-icon-btn:hover {
      color: #fff;
      border-color: var(--primary);
      background: rgba(56, 189, 248, 0.1);
    }

    /* Playground / Chat / Simulator */
    .playground-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      margin-top: 24px;
    }

    .terminal-window {
      background: #060911;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px;
      font-family: 'Fira Code', monospace;
      min-height: 240px;
      max-height: 380px;
      overflow-y: auto;
      margin-top: 16px;
      font-size: 13px;
      direction: ltr;
      text-align: left;
    }

    .terminal-line {
      margin-bottom: 6px;
      word-break: break-all;
    }
    .t-cyan { color: #38bdf8; }
    .t-green { color: #34d399; }
    .t-amber { color: #fbbf24; }
    .t-purple { color: #c084fc; }
    .t-muted { color: #64748b; }

    /* Modals */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 999;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-overlay.active {
      display: flex;
    }

    .modal-card {
      background: #0f172a;
      border: 1px solid var(--border-glow);
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      animation: modalIn 0.2s ease-out;
    }

    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-title {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 18px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--primary);
    }

    .form-textarea {
      resize: vertical;
      min-height: 90px;
    }

    /* Vault styling */
    .vault-banner {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(168, 85, 247, 0.1));
      border: 1px solid rgba(244, 63, 94, 0.25);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #fecdd3;
    }

    /* Admin Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 13px;
    }
    .data-table th {
      text-align: right;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-muted);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
    }

    /* Toast */
    #toast {
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: #0f172a;
      border: 1px solid var(--primary);
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 1000;
    }
    #toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Header -->
    <header>
      <a href="/" class="brand">
        <div class="brand-logo">Z</div>
        <div>
          <div class="brand-title">MemoryZ</div>
          <span class="brand-badge">Sovereign Living Memory Substrate</span>
        </div>
      </a>

      <div class="nav-actions">
        <span id="userStatus" style="font-size: 13px; color: var(--text-muted);">جاري التحقق...</span>
        <button id="authBtn" class="nav-btn btn-secondary" onclick="openAuthModal()">دخول / تسجيل</button>
        <button id="newMemoryBtn" class="nav-btn btn-primary" onclick="openNewMemoryModal()" style="display:none;">+ إضافة ذاكرة</button>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="tabs-bar">
      <button class="tab-item active" onclick="switchTab('memories')">🧠 مستودع الذاكرة الحية</button>
      <button class="tab-item" onclick="switchTab('agent')">🤖 محاكي استدعاء الوكلاء (Agent Simulator)</button>
      <button class="tab-item" onclick="switchTab('vault')">🔐 الخزنة المشفرة (Zero-Knowledge Vault)</button>
      <button class="tab-item" onclick="switchTab('connect')">⚡ ربط الـ MCP والتيرمنال</button>
      <button id="adminTabBtn" class="tab-item" onclick="switchTab('admin')" style="display: none;">👑 لوحة تحكم المدير</button>
    </div>

    <!-- Tab 1: Memories View -->
    <div id="tab-memories">
      <!-- Direct MCP Quick Bar in Dashboard -->
      <div id="mcpQuickBar" style="display:none; margin-bottom: 24px; background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.15)); border: 1px solid var(--border-glow); border-radius: 16px; padding: 16px 20px; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(56,189,248,0.2); display:flex; align-items:center; justify-content:center; font-size: 20px;">⚡</div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 15px;">رابط MCP المباشر للدردشة والموبايل (Single URL)</div>
            <div style="font-size: 12px; color: #94a3b8;">انسخ هذا الرابط وضعه في تطبيق المحادثة على الهاتف أو أي عميل MCP للربط الفوري</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex: 1; min-width: 280px; max-width: 580px;">
          <input type="text" id="dashMcpUrlField" class="form-input mono" readonly style="background: #060911; font-size: 13px;">
          <button class="nav-btn btn-primary" onclick="copyDashMcpUrl()" style="white-space: nowrap;">نسخ رابط MCP 📋</button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">إجمالي الذكريات الحية <span>📦</span></div>
          <div id="statTotalMemories" class="stat-value">0</div>
          <div class="stat-sub"><span>✓</span> مفهرسة فيكتورياً (768-dim)</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">ذاكرة البيئة والتفضيلات <span>⚙️</span></div>
          <div id="statEnvPrefs" class="stat-value">0</div>
          <div class="stat-sub"><span>⚡</span> استدعاء دائم للأوامر والبورتات</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">المهارات والقواعد (Skills) <span>🎯</span></div>
          <div id="statSkills" class="stat-value">0</div>
          <div class="stat-sub"><span>💡</span> أدوات سياقية جاهزة للوكلاء</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">الخزنة المشفرة (Vault) <span>🛡️</span></div>
          <div id="statVault" class="stat-value">0</div>
          <div class="stat-sub"><span>🔒</span> تشفير AES-256-GCM معزول</div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <input type="text" id="searchInput" class="search-input" placeholder="بحث دلالي ذكي بالمعنى أو الكلمات المفتاحية..." onkeyup="handleSearch(event)">
          <span class="search-icon">🔍</span>
        </div>
        <div class="type-pills">
          <button class="pill-btn active" onclick="filterType('all', this)">الكل</button>
          <button class="pill-btn" onclick="filterType('env', this)">بيئة العمل (Env)</button>
          <button class="pill-btn" onclick="filterType('preference', this)">التفضيلات (Preference)</button>
          <button class="pill-btn" onclick="filterType('skill', this)">المهارات (Skill)</button>
          <button class="pill-btn" onclick="filterType('note', this)">الملاحظات (Note)</button>
        </div>
      </div>

      <!-- Memory Cards Grid -->
      <div id="memoriesGrid" class="memories-grid">
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          جاري تحميل الذكريات من Turso Cloud...
        </div>
      </div>
    </div>

    <!-- Tab 2: Agent Simulator / Chat Playground -->
    <div id="tab-agent" style="display:none;">
      <div class="playground-box">
        <h3 style="font-size: 18px; color: #fff; margin-bottom: 8px;">🤖 محاكي تدفق الوكلاء التفاعلي (Live Agent Context Stream)</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">
          اكتب أي طلب كما تطلبه تماماً من Cursor أو Claude Code أو الـ Terminal (مثلاً: "شغل لي سيرفر تجريبي" أو "تفضيل PM2" أو "ما هو بورت الاختبار").
          سيقوم المحرك بالبحث الدلالي اللحظي واسترجاع الذاكرة وتعزيز أوزانها!
        </p>

        <div style="display: flex; gap: 10px;">
          <input type="text" id="agentPromptInput" class="search-input" style="flex: 1;" placeholder="اكتب استعلامك الذكي لاختبار الاستدعاء الدلالي...">
          <button class="nav-btn btn-primary" onclick="simulateAgentRecall()">استدعاء الذاكرة ⚡</button>
        </div>

        <div id="agentTerminal" class="terminal-window">
          <div class="terminal-line t-cyan">// MemoryZ Agent Substrate Initialized...</div>
          <div class="terminal-line t-muted">// Type a prompt above to simulate Cursor / Claude Code semantic recall.</div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Zero-Knowledge Vault -->
    <div id="tab-vault" style="display:none;">
      <div class="vault-banner">
        <strong>🛡️ بروتوكول الخزنة المشفرة المعزولة:</strong> المفاتيح والبيانات الحساسة تُشفر محلياً ولا تُرسل مطلقاً لنموذج التضمين (Embeddings). يتم التخزين بـ AES-256-GCM ولا تُفك الشفرة إلا في الذاكرة الحية (RAM) عند التزويد بكلمة المرور.
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-size: 18px; color: #fff;">المفاتيح والأسرار المخزنة في الخزنة</h3>
        <button class="nav-btn btn-primary" onclick="openNewVaultModal()">+ إضافة مفتاح سري جديد</button>
      </div>

      <div id="vaultGrid" class="memories-grid">
        <!-- Vault cards populated via JS -->
      </div>
    </div>

    <!-- Tab 4: Connect & MCP Settings -->
    <div id="tab-connect" style="display:none;">
      <div class="playground-box">
        <h3 style="font-size: 18px; color: #fff; margin-bottom: 8px;">⚡ الربط السريع (موبايل، MCP، تيرمنال، وديسكتوب)</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
          يمكنك ربط بيئة العمل أو تطبيق الدردشة على الهاتف مباشرة بخادم MemoryZ واستخدام الأدوات (<code>store_memory</code>, <code>recall_memory</code>, <code>vault_retrieve</code>) تلقائياً دون أي تعقيد.
        </p>

        <!-- 1. Mobile Single-URL Connector Card -->
        <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(16, 185, 129, 0.12)); border: 1px solid var(--border-glow); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <h4 style="color: #fff; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              <span>📱</span> رابط الموبايل الموحد (Direct Mobile Connector URL)
            </h4>
            <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">رابط واحد فقط</span>
          </div>
          <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 14px; line-height: 1.6;">
            اربط محرك الذاكرة بتطبيق الدردشة على هاتفك (مثل Claude Mobile / LibreChat / OpenWebUI أو أي تطبيق يدعم Remote MCP) عبر <strong>رابط واحد فقط</strong> يحمل المفتاح السري، دون الحاجة لأي ملفات JSON أو إعدادات ديسكتوب:
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <input type="text" id="mobileConnectorUrlField" class="form-input mono" readonly style="flex: 1; min-width: 260px; background: #060911;">
            <button class="nav-btn btn-primary" onclick="copyMobileUrl()">نسخ رابط الموبايل 📱📋</button>
          </div>
        </div>

        <!-- 2. OpenAPI Connector Card for ChatGPT Custom Actions -->
        <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <h4 style="color: #fff; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              <span>🤖</span> رابط موصل ChatGPT على الموبايل (OpenAPI Action URL)
            </h4>
            <span class="badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">OpenAPI 3.1</span>
          </div>
          <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 14px; line-height: 1.6;">
            إذا كنت تستخدم ChatGPT على الموبايل وتريد إضافة الذاكرة الحية إلى Custom GPT، فقط انسخ هذا الرابط وضعه في خانة <strong>Actions &rarr; Import from URL</strong>:
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <input type="text" id="openApiUrlField" class="form-input mono" readonly style="flex: 1; min-width: 260px; background: #060911;">
            <button class="nav-btn btn-secondary" onclick="copyOpenApiUrl()">نسخ رابط OpenAPI 📋</button>
          </div>
        </div>

        <!-- 3. Desktop Cursor Configuration -->
        <h4 style="color: var(--primary); margin-bottom: 8px; font-size: 14px;">3. إعداد ديسكتوب Cursor (~/.cursor/mcp.json):</h4>
        <pre id="cursorConfigCode" style="background:#060911; padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); margin-bottom: 20px;"></pre>

        <!-- 4. CLI Examples -->
        <h4 style="color: var(--emerald); margin-bottom: 8px; font-size: 14px;">4. أمر التيرمنال السريع (Deno CLI):</h4>
        <pre id="cliExampleCode" style="background:#060911; padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); margin-bottom: 20px;"></pre>

        <!-- 5. API Key -->
        <h4 style="color: var(--purple); margin-bottom: 8px; font-size: 14px;">5. مفتاح واجهة التطبيقات البرمجية الخاص بك (API Key):</h4>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="text" id="myApiKeyField" class="form-input mono" readonly style="flex:1;">
          <button class="nav-btn btn-secondary" onclick="copyApiKey()">نسخ المفتاح 📋</button>
        </div>
      </div>
    </div>

    <!-- Tab 5: Admin Dashboard -->
    <div id="tab-admin" style="display:none;">
      <div class="playground-box">
        <h3 style="font-size: 18px; color: #fff; margin-bottom: 8px;">👑 لوحة القيادة والعمليات للمدير (MemoryZ Control Plane)</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">إحصائيات النظام الشاملة، النشاط، ومراقبة مستخدمي المنصة.</p>

        <div id="adminStatsOverview" class="stats-grid" style="margin-bottom: 24px;"></div>

        <h4 style="color: #fff; font-size: 16px; margin-bottom: 12px;">قائمة الحسابات والمستخدمين النشطين:</h4>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>المعرف</th>
                <th>اسم المستخدم</th>
                <th>البريد الإلكتروني</th>
                <th>الرتبة</th>
                <th>عدد الذكريات</th>
                <th>تاريخ الانضمام</th>
              </tr>
            </thead>
            <tbody id="adminUsersTableBody"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Auth (Login / Register) -->
  <div id="authModal" class="modal-overlay">
    <div class="modal-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 id="authModalTitle" class="modal-title" style="margin-bottom: 0;">تسجيل الدخول إلى MemoryZ</h3>
        <button onclick="closeAuthModal()" style="background:none; border:none; color:var(--text-muted); font-size:20px; cursor:pointer;">&times;</button>
      </div>

      <div class="tabs-bar" style="margin-bottom: 16px;">
        <button id="authTabLogin" class="tab-item active" onclick="setAuthMode('login')">تسجيل الدخول</button>
        <button id="authTabRegister" class="tab-item" onclick="setAuthMode('register')">إنشاء حساب جديد</button>
      </div>

      <form id="authForm" onsubmit="handleAuthSubmit(event)">
        <div id="authUsernameGroup" class="form-group" style="display:none;">
          <label class="form-label">اسم المستخدم</label>
          <input type="text" id="authUsername" class="form-input" placeholder="مثال: ibrahim">
        </div>

        <div class="form-group">
          <label class="form-label">البريد الإلكتروني أو اسم الحساب</label>
          <input type="text" id="authEmail" class="form-input" placeholder="user@example.com" required>
        </div>

        <div class="form-group">
          <label class="form-label">كلمة المرور</label>
          <input type="password" id="authPassword" class="form-input" placeholder="••••••••" required>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="nav-btn btn-secondary" onclick="closeAuthModal()">إلغاء</button>
          <button type="submit" id="authSubmitBtn" class="nav-btn btn-primary">دخول</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: New Memory -->
  <div id="memoryModal" class="modal-overlay">
    <div class="modal-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 id="memoryModalTitle" class="modal-title" style="margin-bottom: 0;">إضافة ذرة ذاكرة جديدة</h3>
        <button onclick="closeMemoryModal()" style="background:none; border:none; color:var(--text-muted); font-size:20px; cursor:pointer;">&times;</button>
      </div>

      <form onsubmit="handleSaveMemory(event)">
        <input type="hidden" id="editMemoryHash">

        <div class="form-group">
          <label class="form-label">نوع الذاكرة</label>
          <select id="memoryType" class="form-select">
            <option value="env">بيئة العمل وأوامر النظام (Env / Infra)</option>
            <option value="preference">تفضيل المطور والقواعد (Preference)</option>
            <option value="skill">مهارة وأداة وكيل (Skill / Prompt)</option>
            <option value="note">ملاحظة ومعلومة حرة (Note / Fact)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">العنوان أو المعرف (اختياري)</label>
          <input type="text" id="memoryTitle" class="form-input" placeholder="مثال: dev_ports_and_pm2">
        </div>

        <div class="form-group">
          <label class="form-label">محتوى الذاكرة (سيتم توليد تمثيل دلالي 768-dim له فورياً)</label>
          <textarea id="memoryContent" class="form-textarea" placeholder="مثال: يفضل المطور استخدام PM2 بدلاً من Docker، والمنفذ 3333 محجوز لـ test.domain.com" required></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="nav-btn btn-secondary" onclick="closeMemoryModal()">إلغاء</button>
          <button type="submit" class="nav-btn btn-primary">حفظ الذاكرة</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Vault Store -->
  <div id="vaultModal" class="modal-overlay">
    <div class="modal-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 class="modal-title" style="margin-bottom: 0;">تشفير وحفظ مفتاح في الخزنة</h3>
        <button onclick="closeVaultModal()" style="background:none; border:none; color:var(--text-muted); font-size:20px; cursor:pointer;">&times;</button>
      </div>

      <form onsubmit="handleSaveVault(event)">
        <div class="form-group">
          <label class="form-label">اسم المفتاح (Key Identifier)</label>
          <input type="text" id="vaultKeyName" class="form-input mono" placeholder="مثال: key_gemini أو aws_token" required>
        </div>

        <div class="form-group">
          <label class="form-label">القيمة السرية (Secret Value)</label>
          <input type="password" id="vaultSecretValue" class="form-input mono" placeholder="القيمة السرية المراد تشفيرها" required>
        </div>

        <div class="form-group">
          <label class="form-label">كلمة مرور التشفير الخاصة بك (Passphrase)</label>
          <input type="password" id="vaultPassphrase" class="form-input" placeholder="كلمة المرور المشتق منها مفتاح AES" required>
          <small style="color: var(--text-muted); font-size: 11px;">لن يتم حفظ كلمة المرور على السيرفر أبداً.</small>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="nav-btn btn-secondary" onclick="closeVaultModal()">إلغاء</button>
          <button type="submit" class="nav-btn btn-primary">تشفير وحفظ</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Decrypt Secret Prompt -->
  <div id="decryptModal" class="modal-overlay">
    <div class="modal-card">
      <h3 class="modal-title">فك تشفير المفتاح السري</h3>
      <div id="decryptKeyLabel" style="color: var(--primary); margin-bottom: 14px; font-weight: 700;"></div>

      <form onsubmit="handleDecryptVault(event)">
        <input type="hidden" id="decryptTargetKeyName">
        <div class="form-group">
          <label class="form-label">أدخل كلمة مرور الخزنة (Passphrase)</label>
          <input type="password" id="decryptPassphraseInput" class="form-input" placeholder="كلمة المرور" required>
        </div>

        <div id="decryptedResultBox" style="display:none; background:#060911; padding:14px; border-radius:10px; border:1px solid var(--emerald); margin-bottom:14px;">
          <div style="font-size: 12px; color: var(--emerald); margin-bottom: 4px;">تم فك التشفير بنجاح (في ذاكرة المتصفح فقط):</div>
          <div id="decryptedResultText" class="mono" style="word-break:break-all; color:#fff;"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="nav-btn btn-secondary" onclick="closeDecryptModal()">إغلاق</button>
          <button type="submit" id="decryptSubmitBtn" class="nav-btn btn-primary">فك التشفير الآن</button>
        </div>
      </form>
    </div>
  </div>

  <div id="toast"></div>

  <script>
    // State
    let authToken = localStorage.getItem('mz_token') || '';
    let currentUser = null;
    let currentFilter = 'all';
    let authMode = 'login';

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Init App
    async function init() {
      if (authToken) {
        await checkCurrentUser();
      } else {
        updateAuthUI(null);
      }
      loadMemories();
    }

    async function checkCurrentUser() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (res.ok) {
          const data = await res.json();
          currentUser = data.user;
          updateAuthUI(currentUser);
        } else {
          logout();
        }
      } catch (err) {
        console.error(err);
      }
    }

    function updateAuthUI(user) {
      const userStatus = document.getElementById('userStatus');
      const authBtn = document.getElementById('authBtn');
      const newMemoryBtn = document.getElementById('newMemoryBtn');
      const adminTabBtn = document.getElementById('adminTabBtn');

      if (user) {
        userStatus.innerHTML = 'مرحباً، <strong style="color:var(--primary);">' + user.username + '</strong>' + (user.role === 'admin' ? ' 👑' : '');
        authBtn.innerText = 'خروج';
        authBtn.onclick = logout;
        newMemoryBtn.style.display = 'inline-flex';
        if (user.role === 'admin') adminTabBtn.style.display = 'inline-flex';

        // Dashboard quick bar
        const quickBar = document.getElementById('mcpQuickBar');
        if (quickBar) quickBar.style.display = 'flex';
        const dashField = document.getElementById('dashMcpUrlField');
        if (dashField) dashField.value = window.location.origin + "/mcp?token=" + user.api_key;

        // Connect tab config
        document.getElementById('myApiKeyField').value = user.api_key;
        updateConnectSnippets(user.api_key);
      } else {
        userStatus.innerText = 'وضع القراءة أو الزائر';
        authBtn.innerText = 'دخول / تسجيل';
        authBtn.onclick = openAuthModal;
        newMemoryBtn.style.display = 'none';
        adminTabBtn.style.display = 'none';

        const quickBar = document.getElementById('mcpQuickBar');
        if (quickBar) quickBar.style.display = 'none';
      }
    }

    function copyDashMcpUrl() {
      const field = document.getElementById('dashMcpUrlField');
      navigator.clipboard.writeText(field.value);
      showToast('تم نسخ رابط MCP المباشر بنجاح! الصقه في تطبيق الدردشة ⚡📱');
    }

    function updateConnectSnippets(apiKey) {
      const origin = window.location.origin;

      // 1. Mobile Direct URL
      const mobileUrl = origin + "/mcp?token=" + apiKey;
      const mobileField = document.getElementById('mobileConnectorUrlField');
      if (mobileField) mobileField.value = mobileUrl;

      // 2. OpenAPI Direct URL (for ChatGPT Custom Actions / Mobile)
      const openApiUrl = origin + "/openapi.json?token=" + apiKey;
      const openApiField = document.getElementById('openApiUrlField');
      if (openApiField) openApiField.value = openApiUrl;

      // 3. Desktop Cursor Config
      const cursorConfig = {
        "mcpServers": {
          "memoryz": {
            "url": origin + "/mcp?api_key=" + apiKey
          }
        }
      };
      document.getElementById('cursorConfigCode').innerText = JSON.stringify(cursorConfig, null, 2);
      document.getElementById('cliExampleCode').innerText = 
        "# CLI Quick Recall Query\\n" +
        "deno run -A cli.ts recall --query='test.domain.com' --key=" + apiKey + "\\n\\n" +
        "# Store a memory directly\\n" +
        "deno run -A cli.ts store --type=env --content='Next port 3000' --key=" + apiKey;
    }

    function copyMobileUrl() {
      const field = document.getElementById('mobileConnectorUrlField');
      navigator.clipboard.writeText(field.value);
      showToast('تم نسخ رابط الموبايل الموحد! ضعه في تطبيق الدردشة مباشرة 📱✨');
    }

    function copyOpenApiUrl() {
      const field = document.getElementById('openApiUrlField');
      navigator.clipboard.writeText(field.value);
      showToast('تم نسخ رابط OpenAPI! الصقه في خانة Actions في ChatGPT 🤖');
    }

    function copyApiKey() {
      const field = document.getElementById('myApiKeyField');
      navigator.clipboard.writeText(field.value);
      showToast('تم نسخ مفتاح API بنجاح! 📋');
    }

    function logout() {
      authToken = '';
      currentUser = null;
      localStorage.removeItem('mz_token');
      updateAuthUI(null);
      loadMemories();
      showToast('تم تسجيل الخروج');
    }

    // Tabs
    function switchTab(tabId) {
      const tabs = ['memories', 'agent', 'vault', 'connect', 'admin'];
      tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.style.display = (t === tabId) ? 'block' : 'none';
      });

      document.querySelectorAll('.tab-item').forEach(btn => {
        btn.classList.remove('active');
      });
      event.currentTarget.classList.add('active');

      if (tabId === 'vault') loadVaultKeys();
      if (tabId === 'admin') loadAdminStats();
    }

    // Load Memories
    async function loadMemories(query = '') {
      const grid = document.getElementById('memoriesGrid');
      if (!authToken) {
        grid.innerHTML = \`
          <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
            <div style="font-size: 40px; margin-bottom: 12px;">🔐</div>
            <h3 style="color:#fff; margin-bottom: 8px;">يرجى تسجيل الدخول أو إنشاء حساب</h3>
            <p style="color:var(--text-muted); margin-bottom: 16px;">لكي تتمكن من استعراض ذكرياتك الحية وحفظها واستدعائها عبر النماذج الذكية.</p>
            <button class="nav-btn btn-primary" onclick="openAuthModal()">دخول / تسجيل الآن</button>
          </div>
        \`;
        return;
      }

      let url = '/api/memories/recall';
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (currentFilter !== 'all') params.append('type', currentFilter);
      url += '?' + params.toString();

      try {
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const memories = data.memories || [];

        // Update stats
        document.getElementById('statTotalMemories').innerText = memories.length;
        document.getElementById('statEnvPrefs').innerText = memories.filter(m => m.type === 'env' || m.type === 'preference').length;
        document.getElementById('statSkills').innerText = memories.filter(m => m.type === 'skill').length;

        if (memories.length === 0) {
          grid.innerHTML = \`
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
              لا توجد ذكريات مطابقة حالياً. أضف ذاكرتك الأولى لتبدأ!
            </div>
          \`;
          return;
        }

        grid.innerHTML = memories.map(m => renderMemoryCard(m)).join('');
      } catch (err) {
        console.error(err);
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--rose);">حدث خطأ أثناء تحميل البيانات</div>';
      }
    }

    function renderMemoryCard(m) {
      const badgeClass = 'badge-' + m.type;
      const typeLabel = {
        'env': 'بيئة عمل (Env)',
        'preference': 'تفضيل (Preference)',
        'skill': 'مهارة (Skill)',
        'note': 'ملاحظة (Note)'
      }[m.type] || m.type;

      const dateStr = new Date(m.created_at * 1000).toLocaleDateString('ar-EG');
      const scoreStr = m.recall_score ? parseFloat(m.recall_score).toFixed(2) : '0';

      return \`
        <div class="memory-card">
          <div>
            <div class="memory-header">
              <span class="badge \${badgeClass}">\${typeLabel}</span>
              <div class="recall-badge">
                <span>🔥 \${m.recall_count || 0} استدعاء</span>
                <span>⚡ \${scoreStr}</span>
              </div>
            </div>
            \${m.title ? \`<div class="memory-title">\${escapeHtml(m.title)}</div>\` : ''}
            <div class="memory-content">\${escapeHtml(m.content)}</div>
          </div>

          <div>
            \${m.links && m.links.length > 0 ? \`
              <div style="margin-bottom: 12px; display:flex; flex-wrap:wrap; gap:4px;">
                \${m.links.map(l => \`<span style="font-size:11px; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:var(--primary);">🔗 \${l.relation_type}: \${escapeHtml(l.target_title || l.target_hash.substring(0,8))}</span>\`).join('')}
              </div>
            \` : ''}

            <div class="memory-footer">
              <span>\${dateStr}</span>
              <div class="card-actions">
                <button class="action-icon-btn" title="تعديل الذاكرة" onclick="editMemory('\${m.hash}', '\${escapeAttr(m.title || '')}', '\${escapeAttr(m.content)}', '\${m.type}')">✏️</button>
                <button class="action-icon-btn" title="حذف" onclick="deleteMemory('\${m.hash}')">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      \`;
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function escapeAttr(str) {
      if (!str) return '';
      return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Search & Filter
    let searchTimeout;
    function handleSearch(e) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadMemories(e.target.value.trim());
      }, 250);
    }

    function filterType(type, btn) {
      currentFilter = type;
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadMemories(document.getElementById('searchInput').value.trim());
    }

    // Memory Modals & Actions
    function openNewMemoryModal() {
      document.getElementById('memoryModalTitle').innerText = 'إضافة ذرة ذاكرة جديدة';
      document.getElementById('editMemoryHash').value = '';
      document.getElementById('memoryTitle').value = '';
      document.getElementById('memoryContent').value = '';
      document.getElementById('memoryModal').classList.add('active');
    }

    function editMemory(hash, title, content, type) {
      document.getElementById('memoryModalTitle').innerText = 'تعديل الذاكرة';
      document.getElementById('editMemoryHash').value = hash;
      document.getElementById('memoryTitle').value = title;
      document.getElementById('memoryContent').value = content;
      document.getElementById('memoryType').value = type;
      document.getElementById('memoryModal').classList.add('active');
    }

    function closeMemoryModal() {
      document.getElementById('memoryModal').classList.remove('active');
    }

    async function handleSaveMemory(e) {
      e.preventDefault();
      const hash = document.getElementById('editMemoryHash').value;
      const type = document.getElementById('memoryType').value;
      const title = document.getElementById('memoryTitle').value.trim();
      const content = document.getElementById('memoryContent').value.trim();

      try {
        let res;
        if (hash) {
          res = await fetch('/api/memories/' + hash, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ title, content })
          });
        } else {
          res = await fetch('/api/memories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ type, title, content })
          });
        }

        if (res.ok) {
          closeMemoryModal();
          showToast(hash ? 'تم تعديل الذاكرة بنجاح' : 'تم حفظ الذاكرة وتوليد التضمين 768-dim ✨');
          loadMemories();
        } else {
          const err = await res.json();
          alert(err.error || 'حدث خطأ');
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function deleteMemory(hash) {
      if (!confirm('هل أنت متأكد من حذف هذه الذاكرة؟')) return;
      try {
        const res = await fetch('/api/memories/' + hash, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (res.ok) {
          showToast('تم حذف الذاكرة بنجاح');
          loadMemories();
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Vault
    async function loadVaultKeys() {
      const grid = document.getElementById('vaultGrid');
      if (!authToken) return;

      try {
        const res = await fetch('/api/vault', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await res.json();
        const keys = data.keys || [];
        document.getElementById('statVault').innerText = keys.length;

        if (keys.length === 0) {
          grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:30px;">الخزنة فارغة حالياً. أضف مفاتيحك السرية لتخزينها بأمان تام.</div>';
          return;
        }

        grid.innerHTML = keys.map(k => \`
          <div class="memory-card" style="border-color: rgba(244,63,94,0.3);">
            <div>
              <div class="memory-header">
                <span class="badge" style="background:rgba(244,63,94,0.15); color:#fb7185;">🔐 سر مشفر (AES-GCM)</span>
                <span style="font-size:11px; color:var(--text-muted);">\${new Date(k.created_at * 1000).toLocaleDateString('ar-EG')}</span>
              </div>
              <div class="memory-title mono" style="color:#fda4af;">\${escapeHtml(k.key_name)}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">محتوى مشفر بمعيار Zero-Knowledge. لا يمكن قراءته إلا بكلمة المرور.</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);">
              <button class="nav-btn btn-secondary" style="font-size:12px; padding:6px 12px;" onclick="openDecryptModal('\${escapeAttr(k.key_name)}')">فك التشفير 🔓</button>
              <button class="action-icon-btn" onclick="deleteVaultKey('\${escapeAttr(k.key_name)}')">🗑️</button>
            </div>
          </div>
        \`).join('');
      } catch (err) {
        console.error(err);
      }
    }

    function openNewVaultModal() {
      document.getElementById('vaultKeyName').value = '';
      document.getElementById('vaultSecretValue').value = '';
      document.getElementById('vaultPassphrase').value = '';
      document.getElementById('vaultModal').classList.add('active');
    }

    function closeVaultModal() {
      document.getElementById('vaultModal').classList.remove('active');
    }

    async function handleSaveVault(e) {
      e.preventDefault();
      const key_name = document.getElementById('vaultKeyName').value.trim();
      const secret_value = document.getElementById('vaultSecretValue').value;
      const passphrase = document.getElementById('vaultPassphrase').value;

      try {
        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key_name, secret_value, passphrase })
        });
        const data = await res.json();
        if (res.ok) {
          closeVaultModal();
          showToast('تم تشفير المفتاح وتخزينه في الخزنة! 🔒');
          if (data.recoveryKey) {
            alert('⚠️ تنبيه هام: هذا هو مفتاح الاسترداد الخاص بك (يظهر مرة واحدة فقط):\\n\\n' + data.recoveryKey + '\\n\\nاحتفظ به في مكان آمن!');
          }
          loadVaultKeys();
        } else {
          alert(data.error || 'فشل التخزين');
        }
      } catch (err) {
        console.error(err);
      }
    }

    function openDecryptModal(keyName) {
      document.getElementById('decryptTargetKeyName').value = keyName;
      document.getElementById('decryptKeyLabel').innerText = 'المفتاح: ' + keyName;
      document.getElementById('decryptPassphraseInput').value = '';
      document.getElementById('decryptedResultBox').style.display = 'none';
      document.getElementById('decryptModal').classList.add('active');
    }

    function closeDecryptModal() {
      document.getElementById('decryptModal').classList.remove('active');
    }

    async function handleDecryptVault(e) {
      e.preventDefault();
      const key_name = document.getElementById('decryptTargetKeyName').value;
      const passphrase = document.getElementById('decryptPassphraseInput').value;

      try {
        const res = await fetch('/api/vault/retrieve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key_name, passphrase })
        });
        const data = await res.json();
        if (res.ok) {
          document.getElementById('decryptedResultBox').style.display = 'block';
          document.getElementById('decryptedResultText').innerText = data.secret_value;
          showToast('تم فك التشفير في الذاكرة الحية 🔓');
        } else {
          alert(data.error || 'فشل فك التشفير: كلمة مرور غير صحيحة');
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function deleteVaultKey(keyName) {
      if (!confirm('هل تريد حذف المفتاح ' + keyName + ' نهائياً؟')) return;
      try {
        const res = await fetch('/api/vault/' + encodeURIComponent(keyName), {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (res.ok) {
          showToast('تم حذف المفتاح من الخزنة');
          loadVaultKeys();
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Agent Simulator
    async function simulateAgentRecall() {
      const input = document.getElementById('agentPromptInput');
      const query = input.value.trim();
      if (!query) return;

      const term = document.getElementById('agentTerminal');
      term.innerHTML += \`<div class="terminal-line t-amber">&gt; Agent Request: "\${escapeHtml(query)}"</div>\`;
      term.innerHTML += \`<div class="terminal-line t-muted">&gt; Computing Gemini 768-dim query embedding & querying Turso vector space...</div>\`;

      try {
        const res = await fetch('/api/memories/recall', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ query, limit: 3 })
        });
        const data = await res.json();
        const hits = data.memories || [];

        if (hits.length === 0) {
          term.innerHTML += \`<div class="terminal-line t-rose">&gt; [MCP Recall] No matching memories found in substrate.</div>\`;
        } else {
          term.innerHTML += \`<div class="terminal-line t-green">&gt; [MCP Recall] Found \${hits.length} memory node(s):</div>\`;
          hits.forEach((h, i) => {
            term.innerHTML += \`<div class="terminal-line t-cyan">  #\${i+1} [\${h.type.toUpperCase()}] \${escapeHtml(h.title || h.hash.substring(0,8))} (Similarity: \${h.score || '1.0'}, Recall Count: \${h.recall_count})</div>\`;
            term.innerHTML += \`<div class="terminal-line" style="color:#e2e8f0; margin-left: 20px;">    "\${escapeHtml(h.content)}"</div>\`;
          });
          term.innerHTML += \`<div class="terminal-line t-purple">&gt; Automatically reinforced decay scores and bumped recall counts in Turso!</div>\`;
        }
        term.scrollTop = term.scrollHeight;
      } catch (err) {
        term.innerHTML += \`<div class="terminal-line t-rose">&gt; Error: \${err.message}</div>\`;
      }
    }

    // Admin Dashboard
    async function loadAdminStats() {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (!res.ok) return;
        const data = await res.json();

        // Overview
        document.getElementById('adminStatsOverview').innerHTML = \`
          <div class="stat-card">
            <div class="stat-title">إجمالي المستخدمين المسجلين</div>
            <div class="stat-value">\${data.totalUsers}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">إجمالي الذكريات بالنظام</div>
            <div class="stat-value">\${data.totalMemories}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">إجمالي أسرار الخزنات</div>
            <div class="stat-value">\${data.totalVaultSecrets}</div>
          </div>
        \`;

        // Users table
        const tbody = document.getElementById('adminUsersTableBody');
        tbody.innerHTML = (data.users || []).map(u => \`
          <tr>
            <td class="mono">\${u.id.substring(0,8)}...</td>
            <td><strong>\${escapeHtml(u.username)}</strong></td>
            <td>\${escapeHtml(u.email)}</td>
            <td><span class="badge" style="background:\${u.role === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(56,189,248,0.2)'}; color:#fff;">\${u.role}</span></td>
            <td>\${u.memory_count}</td>
            <td>\${new Date(u.created_at * 1000).toLocaleDateString('ar-EG')}</td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error(err);
      }
    }

    // Auth Modals & Handlers
    function openAuthModal() {
      document.getElementById('authModal').classList.add('active');
    }
    function closeAuthModal() {
      document.getElementById('authModal').classList.remove('active');
    }

    function setAuthMode(mode) {
      authMode = mode;
      document.getElementById('authTabLogin').classList.toggle('active', mode === 'login');
      document.getElementById('authTabRegister').classList.toggle('active', mode === 'register');
      document.getElementById('authUsernameGroup').style.display = (mode === 'register') ? 'block' : 'none';
      document.getElementById('authModalTitle').innerText = (mode === 'register') ? 'إنشاء حساب جديد في MemoryZ' : 'تسجيل الدخول إلى MemoryZ';
      document.getElementById('authSubmitBtn').innerText = (mode === 'register') ? 'تسجيل الحساب' : 'دخول';
    }

    async function handleAuthSubmit(e) {
      e.preventDefault();
      const emailOrUser = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const username = document.getElementById('authUsername').value.trim();

      const endpoint = (authMode === 'register') ? '/api/auth/register' : '/api/auth/login';
      const body = (authMode === 'register') 
        ? { username, email: emailOrUser, password }
        : { identifier: emailOrUser, password };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
          authToken = data.token;
          currentUser = data.user;
          localStorage.setItem('mz_token', authToken);
          closeAuthModal();
          updateAuthUI(currentUser);
          loadMemories();
          showToast('مرحباً بك يا ' + currentUser.username + '! 🚀');
        } else {
          alert(data.error || 'فشلت العملية');
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Auto-init on load
    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
