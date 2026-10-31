// MemoryZ Dashboard Tab - Zero-Knowledge Vault View
export function renderVaultTab(): string {
  return `
    <!-- TAB 5: ZERO-KNOWLEDGE VAULT -->
    <div x-show="activeTab === 'vault'" class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-error/20 text-error flex items-center justify-center font-bold">
            <i class="fa-solid fa-vault"></i>
          </div>
          <div>
            <div class="font-bold text-sm" x-text="t('vaultTitle')"></div>
            <div class="text-[11px] text-base-content/60" x-text="t('vaultDesc')"></div>
          </div>
        </div>

        <button class="btn btn-sm btn-error text-error-content gap-1 shadow-sm" @click="openVaultModal()">
          <i class="fa-solid fa-plus text-xs"></i> <span x-text="t('storeSecret')"></span>
        </button>
      </div>

      <!-- Vault Keys List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <template x-for="k in vaultKeys" :key="k.key_name">
          <div class="card bg-base-100 border border-base-300 p-3.5 flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-sm text-base-content truncate" x-text="k.key_name"></span>
              <span class="badge badge-outline badge-xs font-mono">AES-GCM</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-base-300 text-xs">
              <button class="btn btn-primary btn-xs gap-1" @click="openDecryptModal(k.key_name)">
                <i class="fa-solid fa-unlock-keyhole text-[11px]"></i> <span x-text="t('decryptSecret')"></span>
              </button>
              <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteVaultKey(k.key_name)" :title="t('delete')">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div x-show="vaultKeys.length === 0 && !loadingVault" class="p-8 text-center text-base-content/60">
        <i class="fa-solid fa-lock text-3xl mb-2 text-base-content/30"></i>
        <div x-text="t('noSecrets')"></div>
      </div>
    </div>
  `;
}
