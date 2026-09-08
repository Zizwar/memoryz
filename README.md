# 🧠 MemoryZ — Sovereign Agentic Memory Substrate

> **ذاكرة حية، سيادية، ومتحركة مع مطورها عبر بيئات العمل والتيرمنال والوكلاء الأذكياء (MCP)**

MemoryZ هو محرك ذاكرة حية متعدد المنصات (Agentic Memory Substrate) مبني بلغة **TypeScript** ومحرك **Deno**، ومربوط بسحابة **Turso (libSQL)** وتقنيات التضمين الفيكتوري **Google Gemini Embeddings (768-dim)**.

صُمم النظام ليكون بمثابة العمود الفقري المعرفي الذي يرافق المطور في:
1. **تطبيقات ومحررات الذكاء الاصطناعي** (Cursor, Claude Code, Windsurf, Codex عبر بروتوكول MCP).
2. **شاشات التيرمنال (CLI)** للاستعلام الفوري وحفظ المتغيرات وتشغيل الأوامر.
3. **لوحة تحكم تفاعلية (Web UI & Admin Dashboard)** لاستعراض الذكريات الحية، فك تشفير الخزنة، ومتابعة نشاط النظام.

---

## 🌟 المزايا والمعمارية الأساسية

### 1. تصنيفات الذاكرة الحية
- ⚡ **البيئة والبنية التحتية (`env`):** مثل أرقام المنافذ، أوامر PM2، دومينات الاختبار، ومتغيرات النظام.
- 🎯 **تفضيلات وأسلوب المطور (`preference`):** القواعد البرمجية الصارمة التي يفضلها المطور دون الحاجة لإعادة تكرارها.
- 🧠 **المهارات وأدوات الوكلاء (`skill`):** خطوات إجرائية وسياقات توجيهية (Agent Prompts) تستدعى تلقائياً عند تنفيذ المهام.
- 📝 **الملاحظات والمعارف الحرة (`note`):** حقائق وأفكار ومسودات تُفهرس دلالياً.

### 2. البحث الدلالي المعزز بوزن التضاؤل الزمني (Time-Decayed Recall)
- **768-dim Embeddings:** توليد تمثيل فيكتوري دقيق عبر Gemini (`gemini-embedding-001`).
- **فهرسة فيكتورية متقدمة على Turso:** `vector_distance_cos` لمطابقة المعنى حتى لو اختلفت المفردات.
- **معادلة التضاؤل والتعزيز (Recall Decay):**
  $$\text{decay\_factor} = \exp(-\lambda \times \text{days\_since\_last\_recall})$$
  $$\text{recall\_score} = \text{recall\_count} \times \text{decay\_factor}$$
  كل استدعاء ناجح يزيد من عداد الاستدعاء ويحدث توقيت الاسترجاع، مما يمنح الذكريات الحديثة والمكررة أولوية قصوى.

### 3. الخزنة المشفرة المعزولة (Zero-Knowledge Vault)
- عزل كامل لجدول الأسرار `vault_entries` عن جدول الذكريات.
- لا تخضع بيانات الخزنة مطلقاً للتضمين الفيكتوري أو البحث الدلالي.
- تشفير قوي بمعيار **AES-256-GCM** مع اشتقاق مفاتيح **PBKDF2** (100,000 دورة).
- فك التشفير يتم حصرياً في الذاكرة الحية (RAM) عند التزويد بكلمة المرور، دون حفظ النص الصريح على القرص أو في سجلات الخادم.

### 4. شبكة العلاقات المعرفية (Knowledge Graph)
- جدول `memory_links` لربط الذكريات مع تحديد نوع العلاقة:
  - `depends_on` (يعتمد على)
  - `context_for` (سياق لـ)
  - `related` (مرتبط بـ)
  - `supersedes` (يحل محل)

---

## 🚀 التشغيل السريع

### المتطلبات
- **Deno** (الإصدار 2.0 أو أحدث)
- حساب وقاعدة بيانات على **Turso Cloud**
- مفتاح **Gemini API** للتضمين الدلالي

### التثبيت والإعداد
```bash
# 1. استنساخ المستودع
git clone https://github.com/Zizwar/memoryz.git
cd memoryz

# 2. إعداد ملف البيئة
cp .env.example .env
# قم بتعبئة بيانات Turso و Gemini و Deno Deploy في ملف .env

# 3. تشغيل السيرفر محلياً
deno task dev
# سيعمل السيرفر على: http://localhost:8000
```

---

## 💻 استخدام واجهة التيرمنال (CLI)

يوفر ملف `cli.ts` تحكماً كاملاً من الطرفية:

```bash
# استدعاء دلالي ذكي
deno run -A cli.ts recall --query="تشغيل سيرفر تجريبي"

# تخزين ذاكرة جديدة
deno run -A cli.ts store --type=env --content="المنفذ 3333 مخصص لـ test.domain.com مع PM2" --title="ports_config"

# تخزين مفتاح سري مشفر في الخزنة
deno run -A cli.ts vault store --key="key_gemini" --secret="AIzaSy..." --pass="@MySecretPass"

# استرجاع وفك تشفير مفتاح من الخزنة
deno run -A cli.ts vault get --key="key_gemini" --pass="@MySecretPass"

# سرد المفاتيح المشفرة المخزنة
deno run -A cli.ts vault list
```

---

## 🔌 ربط بروتوكول MCP مع Cursor و Claude Code

يدعم خادم MemoryZ بروتوكول **Model Context Protocol (MCP)** مباشرة عبر HTTP / SSE و Stdio:

### إعداد Cursor (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "memoryz": {
      "url": "https://<your-deno-deploy-url>/mcp?api_key=<YOUR_API_KEY>"
    }
  }
}
```

### الأدوات المتاحة للوكلاء (MCP Tools):
1. `recall_memory`: استرجاع الذكريات بالبحث الدلالي اللحظي وفلترة الأنواع.
2. `store_memory`: إضافة ذكريات وقواعد جديدة تلقائياً من سياق المحادثة.
3. `link_memory`: ربط ذكريات ببعضها داخل الرسم المعرفي.
4. `vault_store`: تشفير وحفظ مفاتيح سرية بناءً على طلب المستخدم.
5. `vault_retrieve`: فك تشفير المفاتيح عند الحاجة باستخدام كلمة المرور.
6. `vault_list`: سرد أسماء المفاتيح المتاحة في الخزنة.

---

## ☁️ النشر على Deno Deploy

المشروع جاهز تماماً للنشر السحابي بضغطة زر:

```bash
# نشر مباشر على Deno Deploy
deno deploy --token=$DENO_DEPLOY_TOKEN --org=$DENO_ORG --app=memoryz --prod
```

---

## 🛡️ الأمان وسيادة البيانات
- **Zero-Knowledge Architecture:** لا يملك خادم التطبيق ولا قاعدة البيانات وسيلة لقراءة أسرار الخزنة دون كلمة المرور.
- **Multi-Tenant:** فصل تام للمستخدمين عبر `user_id` مع أرقام تعريفية آمنة ومفاتيح API فردية.
- **Argon2 / PBKDF2 + AES-GCM:** أحدث معايير التشفير المتوافقة مع الويب والأنظمة الحديثة.
