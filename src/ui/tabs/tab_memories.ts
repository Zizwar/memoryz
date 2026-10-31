// MemoryZ Dashboard Tab - Memories View
export function renderMemoriesTab(): string {
  return `
    <!-- TAB 1: MEMORIES VIEW -->
    <div x-show="activeTab === 'memories'" class="space-y-4">
      <!-- Search & Filter Controls -->
      <div class="card bg-base-200 border border-base-300 p-3 sm:p-4 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div class="join flex-1">
            <span class="join-item bg-base-300 border border-base-300 px-3 flex items-center text-base-content/50">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input type="text" class="input input-sm sm:input-md input-bordered join-item flex-1 focus:outline-none"
                   :placeholder="t('searchMemories')"
                   x-model="memoryQuery"
                   @keyup.enter="searchMemories()">
            <button class="btn btn-sm sm:btn-md btn-primary join-item gap-1" @click="searchMemories()">
              <span x-show="!loadingMemories" x-text="t('search')"></span>
              <span class="loading loading-spinner loading-xs" x-show="loadingMemories"></span>
            </button>
          </div>

          <!-- Type filter pills -->
          <div class="join join-horizontal overflow-x-auto scrollbar-thin">
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('all')" x-text="t('all')"></button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'env' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('env')">env</button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'preference' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('preference')" x-text="t('preference')"></button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'skill' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('skill')" x-text="t('pattern')"></button>
            <button class="btn btn-xs sm:btn-sm join-item" :class="memoryFilter === 'note' ? 'btn-primary' : 'btn-ghost'" @click="setMemoryFilter('note')">note</button>
          </div>
        </div>
      </div>

      <!-- Memories Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <template x-for="m in filteredMemories" :key="m.hash">
          <div class="card bg-base-200 border border-base-300 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
            <div class="card-body p-4 flex flex-col justify-between gap-2.5">
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="badge badge-sm font-semibold uppercase tracking-wider"
                        :class="{
                          'badge-info text-info-content': m.type === 'env',
                          'badge-accent text-accent-content': m.type === 'preference',
                          'badge-primary text-primary-content': m.type === 'skill',
                          'badge-secondary text-secondary-content': m.type === 'note'
                        }"
                        x-text="m.type"></span>
                  <span class="font-bold text-sm text-base-content truncate max-w-[200px]" x-text="m.title || m.hash.substring(0, 8)"></span>
                  <template x-if="m.namespace">
                    <span class="badge badge-outline badge-xs font-mono" x-text="m.namespace"></span>
                  </template>
                  <template x-if="m.agent_id || m.source">
                    <span class="badge badge-ghost badge-xs font-mono gap-1 text-base-content/60" :title="(t('provenance') || 'Source') + ': ' + (m.agent_id || m.source)">
                      <i class="fa-solid fa-microchip text-[9px]"></i>
                      <span x-text="m.agent_id || m.source"></span>
                    </span>
                  </template>
                  <template x-if="m.time_decay">
                    <span class="badge badge-ghost badge-xs font-mono text-base-content/50" :title="(t('decay') || 'Decay') + ': ' + m.time_decay">
                      <i class="fa-solid fa-clock-rotate-left text-[9px]"></i>
                      <span x-text="Number(m.time_decay).toFixed(2)"></span>
                    </span>
                  </template>
                </div>
                <div class="flex items-center gap-1 opacity-80">
                  <span class="badge badge-ghost badge-xs font-mono gap-1" :title="t('relevance')">
                    <i class="fa-solid fa-fire text-amber-500 text-[10px]"></i>
                    <span x-text="m.recall_count"></span>
                  </span>
                  <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteMemory(m.hash)" :title="t('delete')">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>

              <!-- Content -->
              <p class="text-xs sm:text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed" x-text="m.content"></p>

              <!-- Footer Meta -->
              <div class="flex items-center justify-between pt-2 border-t border-base-300/60 text-[11px] text-base-content/50 font-mono">
                <div class="flex items-center gap-1">
                  <span class="hover:text-primary cursor-pointer" @click="copyText(m.hash)" :title="'#' + m.hash" x-text="'#' + m.hash.substring(0, 8)"></span>
                  <button class="btn btn-ghost btn-xs p-0.5 h-auto min-h-0 text-base-content/40 hover:text-base-content" @click="copyText(m.hash)" :title="t('copy')">
                    <i class="fa-solid fa-copy text-[10px]"></i>
                  </button>
                </div>
                <span x-text="formatDate(m.created_at)"></span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div x-show="filteredMemories.length === 0 && !loadingMemories" class="card bg-base-200 border border-base-300 p-8 text-center text-base-content/60">
        <i class="fa-solid fa-box-open text-3xl mb-2 text-base-content/30"></i>
        <span x-text="t('noMemories')"></span>
      </div>
    </div>
  `;
}
