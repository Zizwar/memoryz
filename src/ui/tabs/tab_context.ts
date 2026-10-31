// MemoryZ Dashboard Tab - Context Packs & Logs View
export function renderContextTab(): string {
  return `
    <!-- TAB 3: CONTEXT PACKS & EPHEMERAL LOGS -->
    <div x-show="activeTab === 'context'" class="space-y-4">
      <!-- 1. Context Pack Generator -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-info/20 text-info flex items-center justify-center font-bold">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <div>
            <div class="font-bold text-sm" x-text="t('contextPacker')"></div>
            <div class="text-[11px] text-base-content/60" x-text="t('packerDesc')"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input type="text" class="input input-sm input-bordered sm:col-span-6"
                 :placeholder="t('contextQuery')"
                 x-model="contextQuery"
                 @keyup.enter="generateContextPack()">

          <select class="select select-sm select-bordered sm:col-span-3 text-xs" x-model="contextFormat">
            <option value="xml">XML (LLM Prompt Format)</option>
            <option value="markdown">Markdown</option>
            <option value="compact">Compact text</option>
          </select>

          <input type="number" class="input input-sm input-bordered sm:col-span-2 font-mono text-center"
                 :placeholder="t('tokenBudget')"
                 x-model="contextBudget">

          <button class="btn btn-sm btn-primary sm:col-span-1 gap-1" @click="generateContextPack()">
            <span x-show="!loadingContext" x-text="t('generatePack')"></span>
            <span class="loading loading-spinner loading-xs" x-show="loadingContext"></span>
          </button>
        </div>

        <!-- Result Box -->
        <div x-show="contextResult" class="space-y-2 pt-2">
          <div class="flex items-center justify-between text-xs font-mono text-base-content/70">
            <span x-text="contextStats"></span>
            <button class="btn btn-ghost btn-xs gap-1" @click="copyText(contextResult)">
              <i class="fa-solid fa-copy text-xs"></i> <span x-text="t('copyPack')"></span>
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
              <div class="font-bold text-sm" x-text="t('ephemeralLogs')"></div>
              <div class="text-[11px] text-base-content/60" x-text="t('tabContextSub')"></div>
            </div>
          </div>

          <div class="join">
            <input type="text" class="input input-sm input-bordered join-item w-48 sm:w-64 text-xs"
                   :placeholder="t('logPlaceholder')"
                   x-model="quickLogMessage"
                   @keyup.enter="appendQuickLog()">
            <button class="btn btn-sm btn-secondary join-item gap-1" @click="appendQuickLog()">
              <i class="fa-solid fa-plus text-xs"></i> <span x-text="t('addLog')"></span>
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
            (No ephemeral logs)
          </div>
        </div>
      </div>
    </div>
  `;
}
