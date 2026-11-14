# تقرير ترقية MemoryZ (v4) — جاهز لاجتياز معايير الذاكرة العالمية

## 1. ملخص الترقيات المنفذة
تمت ترقية مشروع **MemoryZ** ليجمع بين سرعة الاسترجاع، الدقة في المعرفات الدقيقة، دعم البعد الزمني، وتحديث المعرفة تلقائياً، مما يؤهله لاجتياز اختبارات مثل **LoCoMo** و**LongMemEval** و**BEAM**.

## 2. التعديلات البرمجية حسب الملف

### أ. مخطط قاعدة البيانات (`src/db/schema.ts`)
- **دعم ثنائي الزمن (Bi-Temporal):** إضافة عمود `event_time` لتمييز وقت وقوع الحدث الفعلي عن `created_at` (وقت التخزين)، مع فهرس `idx_memories_event_time`.
- **تتبع النسخ المنسوخة (`is_superseded`):** إضافة عمود `is_superseded` وفهرس `idx_memories_active` لاستبعاد الذكريات القديمة المحدّثة افتراضياً.
- **جدول البحث النصي السريع (SQLite FTS5):** إنشاء جدول افتراضي `memories_fts` باستخدام `porter unicode61` للبحث بالكلمات المفتاحية (BM25) جنباً إلى جنب مع البحث الدلالي.

### ب. خدمة الذاكرة والاسترجاع (`src/services/memory.ts`)
- **البحث الهجين (Hybrid Vector + FTS5 BM25 + RRF):** دمج نتائج التشابه الدلالي (`vector_distance_cos`) مع نتائج BM25 عبر خوارزمية **Reciprocal Rank Fusion (RRF)** مع تعزيز بسيط من `recall_score`.
- **تفعيل عتبة الامتناع (`threshold`):** تفعيل معامل `threshold` (الافتراضي `0.32` عند وجود استعلام) لإسقاط النتائج الضعيفة في الأسئلة خارج السياق (Abstention) بدلاً من إرجاع نتائج عشوائية.
- **حل مشكلة N+1 Queries:** تجميع تحديثات `recall_count` وجلب روابط `memory_links` في استعلامين مجمّعين (`WHERE hash IN (...)`) بدلاً من استعلامين لكل سطر.
- **تحديث المعرفة (`supersedes` و`auto_supersede`):** دعم `supersedesHash` و`autoSupersede` لتحديد الذكريات القديمة كـ `is_superseded = 1` وإخفائها من النتائج الافتراضية.
- **توسيع الرسم البياني (1-Hop Graph Expansion):** جلب الجيران المرتبطين بعلاقات `depends_on` و`context_for` و`related` عند توفر مساحة ضمن `limit`.
- **منع التكرار (Deduplication):** حساب `computeHash` على `(userId, namespace, type, normalizedContent)` بدون `createdAt` مع `ON CONFLICT(hash) DO UPDATE`.
- **تصفية زمنية:** دعم `after` و`before` في `recall()` مع `parseEventTime()` التي تقبل ISO strings أو Unix timestamps.

### ج. خدمة التضمين (`src/services/embedding.ts`)
- إضافة `embedWithMeta()` التي ترجع `isFallback` حتى لا يتم تلويث عمود المتجهات الحقيقية بمتجهات عشوائية عند تعطل Gemini API مؤقتاً.

### د. تجميع السياق (`src/services/context.ts`)
- تمرير `namespace` و`threshold` إلى `MemoryService.recall()` و`TaskService`.
- تعبئة الذكريات تدريجياً حسب `tokenBudget` بدلاً من قص النص بـ `substring()` الذي كان قد يقطع وسوم XML.

### هـ. واجهة MCP وREST API (`src/mcp/server.ts`, `src/routes/api.ts`)
- إضافة المعاملات الجديدة (`event_time`, `auto_supersede`, `supersedes_hash`, `threshold`, `after`, `before`, `include_superseded`, `hybrid`, `namespace`) في أدوات MCP ومسارات `/api/memories` و`/api/memories/recall`.

### و. ترقية البنشمارك (`benchmarks/runner.ts`, `benchmarks/types.ts`, `benchmarks/data/longmem_eval_cases.json`)
- إصلاح اختبار `Negative / Out-of-Domain Resistance` في المستوى 3 ليتحقق فعلياً من `negativeCount === 0 || maxNegativeSim < 0.60` بدلاً من تمرير `PASS` ثابت.
- إضافة **المستوى 5 (LongMemEval Capabilities)** لاختبار:
  1. تحديث المعرفة (`knowledge_updates` عبر `supersedes`).
  2. الاستعلامات الزمنية (`temporal_queries` عبر `after`/`before` و`event_time`).
  3. المعرفات الدقيقة (`exact_identifier_queries` عبر Hybrid BM25).
  4. الامتناع عن الهلوسة (`abstention_queries` عبر `threshold`).

## 3. خطوات التشغيل بعد النشر
1. شغّل الخادم كالمعتاد (`deno task start` أو عبر `deployctl` على Deno Deploy) — الترقية تنفّذ `ALTER TABLE` و`CREATE VIRTUAL TABLE` تلقائياً عند التشغيل الأول.
2. شغّل البنشمارك المحدث:
   ```bash
   deno run -A benchmarks/runner.ts https://your-memoryz-url.deno.net
   ```
