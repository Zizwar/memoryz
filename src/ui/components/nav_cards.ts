// MemoryZ Dashboard Component - Navigation Cards & Namespace Bar
export function renderNavCards(): string {
  return `
    <!-- NAVIGATION CARDS (Responsive Grid, Mobile-Friendly, No Horizontal Overflow) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
      <!-- 1. Live Memories -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'memories' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('memories')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'memories' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-brain"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'memories' ? 'badge-primary' : 'badge-ghost'"
                x-text="totalMemories"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabMemories')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabMemoriesSub')"></div>
        </div>
      </button>

      <!-- 2. Knowledge Graph -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'graph' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('graph')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'graph' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-circle-nodes"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'graph' ? 'badge-primary' : 'badge-ghost'"
                x-text="graphStats.totalNodes"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabGraph')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabGraphSub')"></div>
        </div>
      </button>

      <!-- 3. Tasks & TODO -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'tasks' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('tasks')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'tasks' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'tasks' ? 'badge-primary' : 'badge-ghost'"
                x-text="tasksCount"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabTasks')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabTasksSub')"></div>
        </div>
      </button>

      <!-- 4. Context & Logs -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'context' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('context')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'context' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">Pack</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabContext')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabContextSub')"></div>
        </div>
      </button>

      <!-- 5. Simulator -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'agent' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('agent')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'agent' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-robot"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">Sim</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabAgent')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabAgentSub')"></div>
        </div>
      </button>

      <!-- 6. Encrypted Vault -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'vault' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('vault')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'vault' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">ZK</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabVault')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabVaultSub')"></div>
        </div>
      </button>

      <!-- 7. Connect & MCP -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'connect' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('connect')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'connect' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-terminal"></i>
          </div>
          <span class="badge badge-xs badge-ghost font-mono">CLI</span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabConnect')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabConnectSub')"></div>
        </div>
      </button>

      <!-- 8. Webhooks -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'webhooks' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('webhooks')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'webhooks' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-satellite-dish"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'webhooks' ? 'badge-primary' : 'badge-ghost'"
                x-text="webhooksCount"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabWebhooks')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabWebhooksSub')"></div>
        </div>
      </button>

      <!-- 9. Cloudflare R2 -->
      <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98]"
              :class="activeTab === 'r2' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-base-300 hover:border-primary/40'"
              @click="switchTab('r2')">
        <div class="flex items-center justify-between w-full">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
               :class="activeTab === 'r2' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'">
            <i class="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <span class="badge badge-xs font-mono font-medium"
                :class="activeTab === 'r2' ? 'badge-primary' : 'badge-ghost'"
                x-text="r2FilesCount"></span>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-tight" x-text="t('tabR2')"></div>
          <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabR2Sub')"></div>
        </div>
      </button>

      <!-- 10. Admin Panel (Conditional) -->
      <template x-if="currentUser && currentUser.role === 'admin'">
        <button class="card bg-base-200/90 border p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-start flex flex-col justify-between gap-1.5 shadow-sm hover:shadow active:scale-[0.98] col-span-2 sm:col-span-1"
                :class="activeTab === 'admin' ? 'border-warning bg-warning/10 ring-1 ring-warning' : 'border-base-300 hover:border-warning/40'"
                @click="switchTab('admin')">
          <div class="flex items-center justify-between w-full">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                 :class="activeTab === 'admin' ? 'bg-warning text-warning-content' : 'bg-base-300 text-warning'">
              <i class="fa-solid fa-crown"></i>
            </div>
            <span class="badge badge-xs badge-warning font-mono">Root</span>
          </div>
          <div>
            <div class="font-bold text-xs sm:text-sm tracking-tight text-warning" x-text="t('tabAdmin')"></div>
            <div class="text-[10px] text-base-content/60 truncate" x-text="t('tabAdminSub')"></div>
          </div>
        </button>
      </template>
    </div>

    <!-- NAMESPACE FILTER TOOLBAR (v3 Substrate Scope + Jev AI Cron) -->
    <div class="bg-base-200/60 border border-base-300 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-base-content/70 font-bold text-[11px] flex items-center gap-1.5">
          <i class="fa-solid fa-layer-group text-primary"></i>
          <span x-text="t('namespace') + ':'"></span>
        </span>
        <div class="join shadow-sm">
          <button class="btn btn-xs join-item" :class="currentNamespace === 'all' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('all')" x-text="t('all')"></button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'vibzcode' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('vibzcode')">vibzcode</button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'memoryz' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('memoryz')">memoryz</button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'ferme' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('ferme')">ferme</button>
          <button class="btn btn-xs join-item" :class="currentNamespace === 'default' ? 'btn-primary' : 'btn-ghost'" @click="setNamespace('default')">default</button>
        </div>
      </div>

      <!-- Quick Maintenance Cron Button -->
      <button class="btn btn-xs btn-outline btn-secondary gap-1.5 rounded-lg"
              :class="{ 'loading': runningCron }"
              @click="triggerMaintenanceCron()"
              :title="t('runCron')">
        <i class="fa-solid fa-broom" x-show="!runningCron"></i>
        <span x-text="t('runCron') + ' (Cron + Jev AI)'"></span>
      </button>
    </div>

    <!-- Active Section Action Header (Compact & Responsive) -->
    <div class="flex items-center justify-between gap-2 bg-base-200/60 border border-base-300 px-3.5 py-2.5 rounded-xl">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs sm:text-sm font-bold text-base-content/90 truncate" x-text="
          activeTab === 'memories' ? t('tabMemories') + ' — Vector & Meaning' :
          activeTab === 'graph' ? t('tabGraph') + ' — Interactive Network' :
          activeTab === 'tasks' ? t('tabTasks') + ' — Multi-Agent Tree' :
          activeTab === 'webhooks' ? t('tabWebhooks') + ' — Event Dispatcher' :
          activeTab === 'context' ? t('tabContext') + ' — Packs & Logs' :
          activeTab === 'agent' ? t('tabAgent') + ' — Memory Simulator' :
          activeTab === 'vault' ? t('tabVault') + ' — Zero-Knowledge Secrets' :
          activeTab === 'r2' ? t('tabR2') + ' — Cloud Storage' :
          activeTab === 'connect' ? t('tabConnect') + ' — MCP & Tools' : t('tabAdmin')
        "></span>
      </div>

      <div class="flex items-center gap-1.5 flex-none">
        <template x-if="activeTab === 'memories'">
          <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openMemoryModal()">
            <i class="fa-solid fa-plus text-xs"></i> <span x-text="t('addMemory')"></span>
          </button>
        </template>

        <template x-if="activeTab === 'graph'">
          <div class="flex items-center gap-1.5">
            <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openCreateLinkModal()">
              <i class="fa-solid fa-link text-xs"></i> <span x-text="t('addLink')"></span>
            </button>
            <button class="btn btn-ghost btn-xs sm:btn-sm gap-1" @click="loadGraph()" :disabled="loadingGraph" :title="t('refresh')">
              <i class="fa-solid fa-rotate text-xs" :class="loadingGraph ? 'fa-spin' : ''"></i>
            </button>
          </div>
        </template>

        <template x-if="activeTab === 'tasks'">
          <button class="btn btn-success btn-xs sm:btn-sm text-success-content gap-1 shadow-sm" @click="openTaskModal()">
            <i class="fa-solid fa-plus text-xs"></i> <span x-text="t('addTask')"></span>
          </button>
        </template>

        <template x-if="activeTab === 'webhooks'">
          <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openWebhookModal()">
            <i class="fa-solid fa-plus text-xs"></i> <span x-text="t('addWebhook')"></span>
          </button>
        </template>

        <template x-if="activeTab === 'r2'">
          <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openR2UploadModal()">
            <i class="fa-solid fa-cloud-arrow-up text-xs"></i> <span x-text="t('uploadToR2')"></span>
          </button>
        </template>

        <template x-if="activeTab === 'vault'">
          <button class="btn btn-secondary btn-xs sm:btn-sm gap-1" @click="openVaultModal()">
            <i class="fa-solid fa-lock text-xs"></i> <span x-text="t('storeSecret')"></span>
          </button>
        </template>
      </div>
    </div>
  `;
}
