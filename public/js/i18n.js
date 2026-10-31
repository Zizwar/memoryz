// MemoryZ Dashboard - Internationalization Module (AR/EN + RTL/LTR)
window.MZ = window.MZ || {};

MZ.i18n = {
  currentLang: localStorage.getItem('mz_lang') || 'ar',

  translations: {
    ar: {
      // Brand & Navigation
      appName: 'MemoryZ',
      appTagline: 'الركيزة السيادية للذاكرة الحية وتنسيق المهام',
      tokenEconomy: 'حالة استهلاك التوكن في الذاكرة الحية',
      themeLight: 'الوضع النهاري',
      themeDark: 'الوضع الليلي',
      langSwitch: 'English',
      langName: 'العربية',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      mainMenu: 'القائمة الرئيسية',
      activeAccount: 'حساب نشط',
      loginOrRegister: 'تسجيل الدخول / إنشاء حساب',
      apiKeyAndConnect: 'مفتاح API والربط',
      adminPanel: 'لوحة تحكم المدير',
      standalonePages: 'صفحات مستقلة ومصادر',
      graphStandalone: 'شبكة المعرفة (Graph مستقل)',
      webhooksStandalone: 'إدارة الويبهوك (صفحة مستقلة)',
      docsPortal: 'دليل التوثيق (Docs)',
      copySkillUrl: 'نسخ رابط skill.md',
      copyDirectMcpUrl: 'نسخ رابط MCP المباشر',
      packagesAndRepos: 'المستودعات والحزم',
      githubRepo: 'مستودع GitHub',
      npmPackage: 'حزمة NPM (v2.0.1)',
      guestAlert: 'أنت تتصفح كزائر غير مسجل الدخول على هذا النطاق. لعرض واسترجاع الذكريات والمهام المحمية، يرجى تسجيل الدخول بحسابك أو مفتاح API.',
      loginNow: 'تسجيل الدخول الآن',
      allNamespaces: 'كل المجالات (All)',
      namespace: 'المجال (Namespace)',

      // Tabs
      tabMemories: 'الذاكرة الحية',
      tabMemoriesSub: 'فيكتور واسترجاع',
      tabGraph: 'شبكة المعرفة',
      tabGraphSub: 'Graph بياني تفاعلي',
      tabTasks: 'المهام و TODO',
      tabTasksSub: 'شجرة مهام مقتصدة',
      tabContext: 'السياق والسجلات',
      tabContextSub: 'Logs وحزم السياق',
      tabAgent: 'محاكي الوكلاء',
      tabAgentSub: 'اختبار الذاكرة الحية',
      tabVault: 'الخزنة المشفرة',
      tabVaultSub: 'AES-256-GCM',
      tabConnect: 'الربط و MCP',
      tabConnectSub: 'Cursor و Claude',
      tabWebhooks: 'الويبهوك',
      tabWebhooksSub: 'بث الأحداث الحية',
      tabR2: 'تخزين R2',
      tabR2Sub: 'ملفات وحزم سحابية',
      tabAdmin: 'لوحة المدير',
      tabAdminSub: 'إعدادات النظام',

      // Common Actions
      save: 'حفظ',
      cancel: 'إلغاء',
      close: 'إغلاق',
      delete: 'حذف',
      edit: 'تعديل',
      create: 'إنشاء',
      update: 'تحديث',
      refresh: 'تحديث',
      search: 'بحث...',
      filter: 'تصفية',
      all: 'الكل',
      loading: 'جاري التحميل...',
      copied: 'تم النسخ إلى الحافظة 📋',
      confirmDelete: 'هل أنت متأكد من الحذف؟',
      actions: 'الإجراءات',
      status: 'الحالة',
      priority: 'الأولوية',
      assignee: 'المكلف',
      title: 'العنوان',
      content: 'المحتوى',
      type: 'النوع',
      date: 'التاريخ',
      time: 'الوقت',
      submit: 'تأكيد',
      copy: 'نسخ',

      // Memories Tab
      searchMemories: 'ابحث في الذاكرة بالمعنى، الكلمات، أو هاش الذرة #...',
      addMemory: 'إضافة ذاكرة',
      preference: 'تفضيل',
      decision: 'قرار',
      system_prompt: 'موجه نظام',
      pattern: 'نمط / كود',
      credential: 'بيانات اعتماد',
      snippet: 'مقتطف كود',
      noMemories: 'لا توجد ذكريات بعد في هذا النطاق',
      noMemoriesSub: 'احفظ التفضيلات أو القرارات لاسترجاعها في أي وقت',
      relevance: 'نسبة التطابق',
      provenance: 'المصدر والوكيل',
      decay: 'عمر الذرة والتدوير',
      newMemoryModal: 'إضافة ذرة ذاكرة جديدة',
      editMemoryModal: 'تعديل ذرة الذاكرة',

      // Knowledge Graph
      graphTitle: 'الشبكة المعرفية التفاعلية',
      searchNodes: 'بحث في العقد المعرفية...',
      allRelations: 'كل العلاقات',
      physics: 'حركة فيزيائية',
      reset: 'إعادة ضبط العرض',
      addLink: 'ربط علاقة جديدة',
      selectedNode: 'تفاصيل العقدة المختارة',
      noSelectedNode: 'اضغط على أي عقدة في الرسم البياني لعرض خصائصها',
      relationType: 'نوع العلاقة',
      weight: 'الوزن',
      sourceNode: 'العقدة المصدر',
      targetNode: 'العقدة الهدف',
      searchFromNode: 'بحث بالذاكرة من هذه العقدة',

      // Tasks Tab
      addTask: 'مهمة جديدة',
      taskTree: 'شجرة المهام الهرمية',
      asciiView: 'معاينة شجرة ASCII',
      allTasks: 'كل المهام',
      todo: 'قيد الانتظار',
      in_progress: 'قيد التنفيذ',
      done: 'مكتملة',
      blocked: 'معلقة',
      claimTask: 'حجز القفل',
      releaseLock: 'فك القفل',
      lockedBy: 'مقفول بواسطة',
      subtasks: 'مهام فرعية',
      noTasks: 'لا توجد مهام مسجلة حالياً',
      parentTask: 'المهمة الأب (اختياري)',
      taskDesc: 'وصف المهمة أو خطوات التنفيذ',

      // Webhooks Tab
      addWebhook: 'تسجيل ويبهوك جديد',
      webhookUrl: 'رابط الويبهوك (URL)',
      webhookSecret: 'مفتاح التوقيع (Secret)',
      events: 'الأحداث المشترك بها',
      noWebhooks: 'لا توجد نقاط ويبهوك مسجلة',
      webhookHelp: 'سيتم إرسال POST عند حدوث أحداث الذاكرة والمهام مع ترويسة التوقيع X-MemoryZ-Signature.',

      // Context & Logs Tab
      contextPacker: 'تجميع وتعبئة حزمة السياق',
      packerDesc: 'توليد حزمة سياق مدمجة من الذكريات والمهام والسجلات مهيأة للإدخال المباشر للوكلاء.',
      contextQuery: 'الهدف أو الأمر المطلوب للوكيل',
      contextFormat: 'صيغة المخرجات',
      tokenBudget: 'ميزانية التوكن (Token Budget)',
      generatePack: 'تجميع الحزمة الآن',
      copyPack: 'نسخ الحزمة',
      ephemeralLogs: 'سجلات الوكلاء المؤقتة (Logs)',
      addLog: 'تسجيل سريع',
      logPlaceholder: 'أدخل رسالة السجل المؤقت...',

      // Agent Simulator
      simTitle: 'محاكي الاسترجاع للوكلاء',
      simDesc: 'اختبار استرجاع الذاكرة الهجين (كلاسيكي + فيكتور) كما يراه الوكلاء تماماً.',
      simPrompt: 'نص أمر الوكيل للتجربة',
      simRun: 'تشغيل المحاكاة واسترجاع الذاكرة',
      simResults: 'مخرجات الاسترجاع',

      // Vault Tab
      vaultTitle: 'الخزنة المشفرة (Zero-Knowledge Vault)',
      vaultDesc: 'حفظ الأسرار ومفاتيح الـ API مشفرة بأعلى معايير الأمان AES-256-GCM.',
      storeSecret: 'حفظ سر جديد',
      decryptSecret: 'فك تشفير السر',
      keyName: 'اسم المفتاح (Key)',
      secretValue: 'القيمة السرية',
      passphrase: 'كلمة المرور الرئيسية',
      noSecrets: 'لا توجد أسرار محفوظة في الخزنة',

      // R2 Tab
      r2Title: 'مستودع كائنات Cloudflare R2',
      uploadToR2: 'رفع ملف إلى R2',
      bucket: 'الحاوية (Bucket)',
      prefix: 'المسار أو البادئة',
      noFiles: 'لا توجد ملفات في هذا المستودع',
      uploadModeFile: 'ملف من الجهاز',
      uploadModeText: 'نص مباشر',
      fileName: 'اسم الملف / المسار',
      fileContent: 'محتوى الملف النصي',

      // Admin Tab
      adminTitle: 'لوحة إدارة النظام والبيئة',
      runCron: 'تشغيل دورة الصيانة والتدوير',
      jevAiTitle: 'محرك Jev AI الذكي لضغط وتلخيص الذاكرة',
      jevEnabled: 'Jev AI مفعل وشغال (استهلاك التوكنات نشط)',
      jevDisabled: 'Jev AI معطل وموقوف نهائياً',
      toggleJev: 'تبديل حالة Jev AI',
      systemMetrics: 'إحصائيات النظام والموارد',

      // Auth Modal
      authLoginTitle: 'تسجيل الدخول إلى MemoryZ',
      authRegisterTitle: 'إنشاء حساب جديد',
      authApiKeyTitle: 'الدخول بمفتاح API مباشر',
      username: 'اسم المستخدم',
      emailOrUsername: 'البريد الإلكتروني أو اسم المستخدم',
      password: 'كلمة المرور',
      apiKeyPlaceholder: 'أدخل مفتاحك mz_...',
      orLoginWithKey: 'أو الدخول بمفتاح API',
      orLoginWithPassword: 'العودة لتسجيل الدخول بكلمة المرور',
      dontHaveAccount: 'ليس لديك حساب؟ أنشئ واحداً الآن',
      alreadyHaveAccount: 'لديك حساب بالفعل؟ سجل الدخول',
    },

    en: {
      // Brand & Navigation
      appName: 'MemoryZ',
      appTagline: 'Sovereign Living Memory & Task Substrate',
      tokenEconomy: 'Live Memory Token Usage',
      themeLight: 'Light Mode',
      themeDark: 'Dark Mode',
      langSwitch: 'العربية',
      langName: 'English',
      login: 'Log In',
      register: 'Register',
      logout: 'Log Out',
      mainMenu: 'Main Menu',
      activeAccount: 'Active Account',
      loginOrRegister: 'Log In / Register',
      apiKeyAndConnect: 'API Key & Connect',
      adminPanel: 'Admin Control Plane',
      standalonePages: 'Standalone Pages & Resources',
      graphStandalone: 'Knowledge Graph (Standalone)',
      webhooksStandalone: 'Webhooks (Standalone)',
      docsPortal: 'Documentation (Docs)',
      copySkillUrl: 'Copy skill.md URL',
      copyDirectMcpUrl: 'Copy Direct MCP URL',
      packagesAndRepos: 'Repositories & Packages',
      githubRepo: 'GitHub Repository',
      npmPackage: 'NPM Package (v2.0.1)',
      guestAlert: 'You are browsing as an unauthenticated guest. To view and recall protected memories and tasks, please sign in with your account or API key.',
      loginNow: 'Log In Now',
      allNamespaces: 'All Namespaces',
      namespace: 'Namespace',

      // Tabs
      tabMemories: 'Live Memory',
      tabMemoriesSub: 'Vector & Recall',
      tabGraph: 'Knowledge Graph',
      tabGraphSub: 'Interactive Network',
      tabTasks: 'Tasks & TODO',
      tabTasksSub: 'Thrifty Task Tree',
      tabContext: 'Context & Logs',
      tabContextSub: 'Packs & Ephemeral Logs',
      tabAgent: 'Agent Simulator',
      tabAgentSub: 'Live Memory Testing',
      tabVault: 'Encrypted Vault',
      tabVaultSub: 'AES-256-GCM',
      tabConnect: 'Connect & MCP',
      tabConnectSub: 'Cursor & Claude',
      tabWebhooks: 'Webhooks',
      tabWebhooksSub: 'Live Event Stream',
      tabR2: 'R2 Storage',
      tabR2Sub: 'Cloud Files & Packs',
      tabAdmin: 'Admin Plane',
      tabAdminSub: 'System Settings',

      // Common Actions
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      refresh: 'Refresh',
      search: 'Search...',
      filter: 'Filter',
      all: 'All',
      loading: 'Loading...',
      copied: 'Copied to clipboard! 📋',
      confirmDelete: 'Are you sure you want to delete this?',
      actions: 'Actions',
      status: 'Status',
      priority: 'Priority',
      assignee: 'Assignee',
      title: 'Title',
      content: 'Content',
      type: 'Type',
      date: 'Date',
      time: 'Time',
      submit: 'Submit',
      copy: 'Copy',

      // Memories Tab
      searchMemories: 'Search memories by meaning, keywords, or hash #...',
      addMemory: 'Add Memory',
      preference: 'Preference',
      decision: 'Decision',
      system_prompt: 'System Prompt',
      pattern: 'Pattern / Code',
      credential: 'Credential',
      snippet: 'Code Snippet',
      noMemories: 'No memories found in this namespace',
      noMemoriesSub: 'Store preferences, decisions, or code patterns to recall anytime',
      relevance: 'Match Relevance',
      provenance: 'Source & Agent',
      decay: 'Retention & Decay',
      newMemoryModal: 'Add New Memory Atom',
      editMemoryModal: 'Edit Memory Atom',

      // Knowledge Graph
      graphTitle: 'Interactive Knowledge Substrate',
      searchNodes: 'Search knowledge nodes...',
      allRelations: 'All Relations',
      physics: 'Physics',
      reset: 'Reset View',
      addLink: 'Add Relation Link',
      selectedNode: 'Selected Node Details',
      noSelectedNode: 'Click any node on the graph to inspect its properties',
      relationType: 'Relation Type',
      weight: 'Weight',
      sourceNode: 'Source Node',
      targetNode: 'Target Node',
      searchFromNode: 'Recall from this Node',

      // Tasks Tab
      addTask: 'New Task',
      taskTree: 'Hierarchical Task Tree',
      asciiView: 'ASCII Tree Preview',
      allTasks: 'All Tasks',
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Completed',
      blocked: 'Blocked',
      claimTask: 'Claim Lock',
      releaseLock: 'Release Lock',
      lockedBy: 'Locked by',
      subtasks: 'Subtasks',
      noTasks: 'No tasks registered yet',
      parentTask: 'Parent Task (Optional)',
      taskDesc: 'Task description and execution steps',

      // Webhooks Tab
      addWebhook: 'Register Webhook',
      webhookUrl: 'Target URL',
      webhookSecret: 'Signing Secret',
      events: 'Subscribed Events',
      noWebhooks: 'No webhooks registered',
      webhookHelp: 'A POST request with X-MemoryZ-Signature header will be dispatched upon memory and task events.',

      // Context & Logs Tab
      contextPacker: 'Context Pack Assembly',
      packerDesc: 'Synthesizes active memories, tasks, and logs into a single context pack formatted for LLM consumption.',
      contextQuery: 'Goal or Instruction for Agent',
      contextFormat: 'Output Format',
      tokenBudget: 'Token Budget',
      generatePack: 'Assemble Pack',
      copyPack: 'Copy Pack',
      ephemeralLogs: 'Ephemeral Agent Logs',
      addLog: 'Quick Log',
      logPlaceholder: 'Type ephemeral log entry...',

      // Agent Simulator
      simTitle: 'Memory Recall Simulator',
      simDesc: 'Test real-time hybrid search and dynamic memory recall exactly as agents see it.',
      simPrompt: 'Simulated Agent Prompt',
      simRun: 'Run Simulator',
      simResults: 'Recall Output',

      // Vault Tab
      vaultTitle: 'Zero-Knowledge Encrypted Vault',
      vaultDesc: 'Securely store API keys and secrets encrypted with AES-256-GCM.',
      storeSecret: 'Store Secret',
      decryptSecret: 'Decrypt Secret',
      keyName: 'Key Name',
      secretValue: 'Secret Value',
      passphrase: 'Master Passphrase',
      noSecrets: 'No secrets saved in vault',

      // R2 Tab
      r2Title: 'Cloudflare R2 Object Storage',
      uploadToR2: 'Upload to R2',
      bucket: 'Active Bucket',
      prefix: 'Prefix / Path Filter',
      noFiles: 'No files in this bucket',
      uploadModeFile: 'File Upload',
      uploadModeText: 'Direct Text',
      fileName: 'File Name / Key',
      fileContent: 'Text Content',

      // Admin Tab
      adminTitle: 'Platform Control Plane',
      runCron: 'Run Maintenance Cycle',
      jevAiTitle: 'Jev AI Smart Compaction Subsystem',
      jevEnabled: 'Jev AI is Active (Token consumption enabled)',
      jevDisabled: 'Jev AI is Disabled',
      toggleJev: 'Toggle Jev AI',
      systemMetrics: 'System Metrics',

      // Auth Modal
      authLoginTitle: 'Sign In to MemoryZ',
      authRegisterTitle: 'Create New Account',
      authApiKeyTitle: 'Direct API Key Sign In',
      username: 'Username',
      emailOrUsername: 'Email or Username',
      password: 'Password',
      apiKeyPlaceholder: 'Enter your mz_... key',
      orLoginWithKey: 'Or Sign In with API Key',
      orLoginWithPassword: 'Back to Password Sign In',
      dontHaveAccount: "Don't have an account? Sign up now",
      alreadyHaveAccount: 'Already have an account? Sign in',
    }
  },

  t(key) {
    const lang = this.currentLang || 'ar';
    const dict = this.translations[lang] || this.translations.ar;
    if (dict && dict[key] !== undefined) return dict[key];
    const fallback = this.translations.en || {};
    return fallback[key] !== undefined ? fallback[key] : key;
  },

  setLang(lang) {
    if (lang !== 'ar' && lang !== 'en') lang = 'ar';
    this.currentLang = lang;
    localStorage.setItem('mz_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' ? 'rtl' : 'ltr');
    document.dispatchEvent(new CustomEvent('mz-lang-changed', { detail: lang }));
  },

  toggleLang() {
    const next = this.currentLang === 'ar' ? 'en' : 'ar';
    this.setLang(next);
  },

  init() {
    this.setLang(this.currentLang);
  }
};

// Initialize language on script evaluation
MZ.i18n.init();
