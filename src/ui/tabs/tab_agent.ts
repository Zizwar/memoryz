// MemoryZ Dashboard Tab - Agent Simulator View
export function renderAgentTab(): string {
  return `
    <!-- TAB 4: AGENT SIMULATOR -->
    <div x-show="activeTab === 'agent'" class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <div class="font-bold text-sm" x-text="t('simTitle')"></div>
          <div class="text-[11px] text-base-content/60" x-text="t('simDesc')"></div>
        </div>
      </div>

      <div class="join w-full">
        <input type="text" class="input input-sm sm:input-md input-bordered join-item flex-1 focus:outline-none"
               :placeholder="t('simPrompt')"
               x-model="simulatorQuery"
               @keyup.enter="runSimulator()">
        <button class="btn btn-sm sm:btn-md btn-primary join-item gap-1" @click="runSimulator()">
          <span x-show="!loadingSimulator" x-text="t('simRun')"></span>
          <span class="loading loading-spinner loading-xs" x-show="loadingSimulator"></span>
        </button>
      </div>

      <!-- Simulator Recall Results -->
      <div x-show="simulatorResults.length > 0" class="space-y-3 pt-2">
        <div class="text-xs font-bold text-base-content/70" x-text="t('simResults') + ':'"></div>
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
  `;
}
