// MemoryZ Dashboard Tab - Knowledge Graph View
export function renderGraphTab(): string {
  return `
    <!-- TAB: INTERACTIVE KNOWLEDGE GRAPH VISUALIZER -->
    <div x-show="activeTab === 'graph'" class="space-y-4">
      <!-- Toolbar & Filters -->
      <div class="card bg-base-200 border border-base-300 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <!-- Search & Type Filters -->
        <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div class="relative flex-1 sm:w-64">
            <i class="fa-solid fa-magnifying-glass absolute right-3 top-2.5 text-base-content/40 text-xs"></i>
            <input type="text"
                   class="input input-sm input-bordered w-full pr-8 pl-3 text-xs bg-base-100"
                   :placeholder="t('searchNodes')"
                   x-model="graphSearchQuery"
                   @input="filterGraph()">
          </div>

          <!-- Type filter buttons -->
          <div class="join">
            <button class="btn btn-xs join-item" :class="graphFilterType === 'all' ? 'btn-primary' : 'btn-ghost'" @click="setGraphFilter('all')" x-text="t('all')"></button>
            <button class="btn btn-xs join-item text-emerald-500 font-medium" :class="graphFilterType === 'note' ? 'btn-active bg-emerald-500/20' : 'btn-ghost'" @click="setGraphFilter('note')">Note</button>
            <button class="btn btn-xs join-item text-indigo-400 font-medium" :class="graphFilterType === 'skill' ? 'btn-active bg-indigo-500/20' : 'btn-ghost'" @click="setGraphFilter('skill')">Skill</button>
            <button class="btn btn-xs join-item text-amber-500 font-medium" :class="graphFilterType === 'preference' ? 'btn-active bg-amber-500/20' : 'btn-ghost'" @click="setGraphFilter('preference')">Pref</button>
            <button class="btn btn-xs join-item text-cyan-400 font-medium" :class="graphFilterType === 'env' ? 'btn-active bg-cyan-500/20' : 'btn-ghost'" @click="setGraphFilter('env')">Env</button>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <div class="flex items-center gap-2 font-mono text-xs text-base-content/70">
            <span class="badge badge-sm badge-outline gap-1 font-mono">
              <i class="fa-solid fa-circle-dot text-[9px] text-primary"></i>
              <span x-text="graphStats.totalNodes + ' ' + (currentLang === 'ar' ? 'عقدة' : 'nodes')"></span>
            </span>
            <span class="badge badge-sm badge-outline gap-1 font-mono">
              <i class="fa-solid fa-arrow-right-arrow-left text-[9px] text-secondary"></i>
              <span x-text="graphStats.totalEdges + ' ' + (currentLang === 'ar' ? 'رابط' : 'edges')"></span>
            </span>
          </div>

          <button class="btn btn-sm btn-ghost btn-circle tooltip tooltip-bottom" :data-tip="t('reset')" @click="fitGraph()">
            <i class="fa-solid fa-expand text-xs"></i>
          </button>

          <button class="btn btn-sm btn-ghost btn-circle tooltip tooltip-bottom"
                  :data-tip="graphPhysicsEnabled ? t('physics') + ' (ON)' : t('physics') + ' (OFF)'"
                  @click="toggleGraphPhysics()">
            <i class="fa-solid text-xs" :class="graphPhysicsEnabled ? 'fa-atom text-primary animate-pulse' : 'fa-pause text-base-content/40'"></i>
          </button>

          <a href="/graph" target="_blank" rel="noopener" class="btn btn-sm btn-outline gap-1 text-xs" :title="t('graphStandalone')">
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            <span class="hidden sm:inline" x-text="t('graphStandalone')"></span>
          </a>

          <button class="btn btn-sm btn-primary gap-1 shadow-sm text-xs font-bold" @click="openCreateLinkModal()">
            <i class="fa-solid fa-plus text-[10px]"></i>
            <span x-text="t('addLink')"></span>
          </button>
        </div>
      </div>

      <!-- Main Graph Workspace: Network Canvas + Side Inspector -->
      <div class="relative card bg-base-200 border border-base-300 shadow-sm overflow-hidden min-h-[580px] h-[640px]">
        <!-- Vis.js Canvas Container -->
        <div id="memory-network-canvas" class="w-full h-full bg-base-300/30"></div>

        <!-- Empty State overlay if no memories -->
        <div x-show="!loadingGraph && graphStats.totalNodes === 0" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-base-200/80 backdrop-blur-sm pointer-events-none">
          <div class="w-16 h-16 rounded-2xl bg-base-300 flex items-center justify-center text-primary text-2xl mb-3 shadow-inner">
            <i class="fa-solid fa-diagram-project"></i>
          </div>
          <h4 class="font-bold text-base" x-text="t('noMemories')"></h4>
          <p class="text-xs text-base-content/60 max-w-sm mt-1" x-text="t('noMemoriesSub')"></p>
        </div>

        <!-- Loading Overlay -->
        <div x-show="loadingGraph" class="absolute inset-0 flex flex-col items-center justify-center bg-base-200/60 backdrop-blur-xs z-10">
          <span class="loading loading-spinner loading-md text-primary"></span>
          <span class="text-xs text-base-content/70 mt-2 font-medium" x-text="t('loading')"></span>
        </div>

        <!-- Side Inspector Drawer -->
        <div x-show="selectedGraphNode"
             x-transition:enter="transition ease-out duration-200 transform"
             x-transition:enter-start="translate-x-full opacity-0"
             x-transition:enter-end="translate-x-0 opacity-100"
             x-transition:leave="transition ease-in duration-150 transform"
             x-transition:leave-start="translate-x-0 opacity-100"
             x-transition:leave-end="translate-x-full opacity-0"
             class="absolute top-3 left-3 bottom-3 w-80 sm:w-96 bg-base-100/95 backdrop-blur-md border border-base-300 rounded-xl shadow-xl p-4 flex flex-col justify-between z-20 overflow-y-auto scrollbar-thin">
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-base-300 pb-2">
              <div class="flex items-center gap-1.5">
                <span class="badge badge-sm font-mono uppercase text-[10px]"
                      :class="{
                        'badge-success text-success-content': selectedGraphNode?.type === 'note',
                        'badge-secondary text-secondary-content': selectedGraphNode?.type === 'skill',
                        'badge-warning text-warning-content': selectedGraphNode?.type === 'preference',
                        'badge-info text-info-content': selectedGraphNode?.type === 'env'
                      }"
                      x-text="selectedGraphNode?.type"></span>
                <span class="badge badge-ghost badge-sm text-[10px] font-mono" x-text="selectedGraphNode?.namespace"></span>
              </div>
              <button class="btn btn-ghost btn-xs btn-circle" @click="selectedGraphNode = null">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div>
              <h4 class="font-bold text-sm text-base-content" x-text="selectedGraphNode?.label"></h4>
              <div class="font-mono text-[10px] text-base-content/50 truncate mt-0.5" x-text="selectedGraphNode?.id"></div>
            </div>

            <!-- Content preview -->
            <div class="bg-base-200/80 p-3 rounded-lg border border-base-300/60 text-xs leading-relaxed max-h-48 overflow-y-auto scrollbar-thin select-text"
                 x-text="selectedGraphNode?.content"></div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div class="bg-base-200 p-2 rounded-lg border border-base-300">
                <div class="text-[10px] text-base-content/60" x-text="t('relevance')"></div>
                <div class="font-mono font-bold text-primary mt-0.5" x-text="selectedGraphNode?.recall_count || 0"></div>
              </div>
              <div class="bg-base-200 p-2 rounded-lg border border-base-300">
                <div class="text-[10px] text-base-content/60" x-text="t('decay')"></div>
                <div class="font-mono font-bold text-secondary mt-0.5" x-text="selectedGraphNode?.recall_score || 0"></div>
              </div>
            </div>

            <!-- Connected Edges list -->
            <div>
              <div class="text-[11px] font-bold text-base-content/70 mb-1.5 flex items-center justify-between">
                <span x-text="t('allRelations') + ':'"></span>
                <button class="btn btn-ghost btn-xs text-primary gap-1" @click="openCreateLinkModal(selectedGraphNode?.id)">
                  <i class="fa-solid fa-plus text-[9px]"></i> <span x-text="t('addLink')"></span>
                </button>
              </div>
              <div class="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                <template x-for="edge in getNodeEdges(selectedGraphNode?.id)" :key="edge.id">
                  <div class="flex items-center justify-between bg-base-200/70 border border-base-300/70 px-2.5 py-1.5 rounded text-[11px]">
                    <div class="flex items-center gap-1.5 truncate">
                      <span class="badge badge-xs badge-outline font-mono text-[9px]" x-text="edge.label"></span>
                      <span class="truncate font-medium" x-text="getNeighborTitle(edge, selectedGraphNode?.id)"></span>
                    </div>
                    <button class="btn btn-ghost btn-xs text-error p-1" :title="t('delete')" @click="deleteGraphLink(edge.from, edge.to, edge.label)">
                      <i class="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                </template>
                <div x-show="getNodeEdges(selectedGraphNode?.id).length === 0" class="text-[10px] text-base-content/40 text-center py-2" x-text="t('noSelectedNode')">
                </div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-base-300 flex items-center gap-2">
            <button class="btn btn-primary btn-xs flex-1 gap-1" @click="searchFromNode(selectedGraphNode?.content)">
              <i class="fa-solid fa-brain text-[10px]"></i>
              <span x-text="t('searchFromNode')"></span>
            </button>
            <button class="btn btn-ghost btn-xs tooltip tooltip-top" :data-tip="t('copy')" @click="copyText(selectedGraphNode?.id)">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Legend Overlay in Bottom-Right -->
        <div class="absolute bottom-3 right-3 bg-base-100/80 backdrop-blur-xs border border-base-300/80 rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-2.5 shadow-sm pointer-events-none">
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <span>Note</span></div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> <span>Skill</span></div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> <span>Preference</span></div>
          <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> <span>Env</span></div>
        </div>
      </div>
    </div>
  `;
}
