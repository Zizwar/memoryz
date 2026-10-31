// MemoryZ Dashboard Tab - Webhooks View
export function renderWebhooksTab(): string {
  return `
    <!-- TAB: WEBHOOKS & MULTI-AGENT EVENT STREAM -->
    <div x-show="activeTab === 'webhooks'" class="space-y-4">
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
              <i class="fa-solid fa-satellite-dish"></i>
            </div>
            <div>
              <div class="font-bold text-sm" x-text="t('tabWebhooks')"></div>
              <div class="text-[11px] text-base-content/60" x-text="t('tabWebhooksSub')"></div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <a href="/webhooks" target="_blank" rel="noopener" class="btn btn-sm btn-outline gap-1 text-xs" :title="t('webhooksStandalone')">
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              <span class="hidden sm:inline" x-text="t('webhooksStandalone')"></span>
            </a>
            <button class="btn btn-sm btn-primary gap-1 shadow-sm" @click="openWebhookModal()">
              <i class="fa-solid fa-plus text-xs"></i> <span x-text="t('addWebhook')"></span>
            </button>
          </div>
        </div>

        <div class="alert bg-base-100 border border-base-300 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-info text-sm"></i>
          <span x-text="t('webhookHelp')"></span>
        </div>

        <!-- Webhooks List -->
        <div class="space-y-2.5">
          <template x-for="wh in webhooks" :key="wh.id">
            <div class="p-3.5 rounded-xl border border-base-300 bg-base-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div class="space-y-1.5 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono font-bold text-xs sm:text-sm text-primary break-all" x-text="wh.url"></span>
                  <span class="badge badge-xs font-mono" :class="wh.active ? 'badge-success' : 'badge-ghost'" x-text="wh.active ? 'Active' : 'Disabled'"></span>
                  <template x-if="wh.namespace">
                    <span class="badge badge-outline badge-xs font-mono" x-text="'ns: ' + wh.namespace"></span>
                  </template>
                  <template x-if="wh.secret">
                    <span class="badge badge-ghost badge-xs font-mono gap-1 text-base-content/60">
                      <i class="fa-solid fa-key text-[9px] text-warning"></i>
                      <span>HMAC-SHA256</span>
                    </span>
                  </template>
                </div>

                <div class="flex items-center gap-2 flex-wrap text-xs text-base-content/70">
                  <span class="font-semibold text-[11px]" x-text="t('events') + ':'"></span>
                  <template x-for="ev in (wh.events || '').split(',')" :key="ev">
                    <span class="badge badge-secondary badge-xs font-mono" x-text="ev.trim()"></span>
                  </template>
                  <span class="text-base-content/40 text-[10px] ms-auto" x-text="formatDate(wh.created_at)"></span>
                </div>
              </div>

              <div class="flex items-center gap-1.5 flex-none self-end sm:self-center">
                <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteWebhook(wh.id)" :title="t('delete')">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>
          </template>

          <div x-show="webhooks.length === 0 && !loadingWebhooks" class="p-8 text-center text-base-content/60 border border-dashed border-base-300 rounded-xl">
            <i class="fa-solid fa-tower-broadcast text-3xl mb-2 text-base-content/30"></i>
            <div x-text="t('noWebhooks')"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
