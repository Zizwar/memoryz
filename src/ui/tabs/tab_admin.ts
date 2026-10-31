// MemoryZ Dashboard Tab - Admin View
export function renderAdminTab(): string {
  return `
    <!-- TAB 7: ADMIN CONTROL PLANE -->
    <template x-if="currentUser && currentUser.role === 'admin'">
      <div x-show="activeTab === 'admin'" class="space-y-4">
        <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center font-bold">
              <i class="fa-solid fa-crown"></i>
            </div>
            <div>
              <div class="font-bold text-sm" x-text="t('adminTitle')"></div>
              <div class="text-[11px] text-base-content/60" x-text="t('tabAdminSub')"></div>
            </div>
          </div>

          <!-- Quick Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs" x-text="currentLang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'"></div>
              <div class="stat-value text-lg text-primary" x-text="adminStats.total_users || 0"></div>
            </div>
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs" x-text="currentLang === 'ar' ? 'إجمالي الذكريات' : 'Total Memories'"></div>
              <div class="stat-value text-lg text-secondary" x-text="adminStats.total_memories || 0"></div>
            </div>
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs" x-text="currentLang === 'ar' ? 'أسرار الخزنة' : 'Vault Secrets'"></div>
              <div class="stat-value text-lg text-accent" x-text="adminStats.total_vault_entries || 0"></div>
            </div>
            <div class="stat bg-base-100 rounded-xl border border-base-300 p-3">
              <div class="stat-title text-xs" x-text="currentLang === 'ar' ? 'حجم الفهارس' : 'Index Dims'"></div>
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
                    <span x-text="t('jevAiTitle')"></span>
                    <span class="badge badge-xs font-mono font-bold"
                          :class="jevEnabled ? 'badge-warning text-black' : 'badge-ghost text-base-content/60'"
                          x-text="jevEnabled ? (currentLang === 'ar' ? 'مفعّل (يستهلك توكنات)' : 'Active') : (currentLang === 'ar' ? 'معطّل (حفظ الرصيد 100%)' : 'Disabled')"></span>
                  </div>
                  <div class="text-[11px] text-base-content/60 mt-0.5" x-text="currentLang === 'ar' ? 'يقوم Jev AI بتكثيف الذاكرة واكتشاف التكرارات عبر نموذج System One. عند التعطيل، تتوقف جميع الاتصالات وتعمل دورات الصيانة (Cron) محلياً دون أي استهلاك للرصيد.' : 'Jev AI compacts memories and detects duplicates. When disabled, cron maintenance runs silently and locally without consuming any external tokens.'">
                  </div>
                </div>
              </div>

              <button class="btn btn-sm px-4 gap-1.5 font-bold shrink-0"
                      :class="jevEnabled ? 'btn-error btn-outline hover:bg-error hover:text-white' : 'btn-warning'"
                      :disabled="loadingJevSetting"
                      @click="toggleJevSetting()">
                <span x-show="!loadingJevSetting" x-text="jevEnabled ? (currentLang === 'ar' ? '🛑 إيقاف وتعطيل Jev AI' : '🛑 Disable Jev AI') : (currentLang === 'ar' ? '⚡ تفعيل Jev AI' : '⚡ Enable Jev AI')"></span>
                <span x-show="loadingJevSetting" class="loading loading-spinner loading-xs"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  `;
}
