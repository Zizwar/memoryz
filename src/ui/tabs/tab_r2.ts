// MemoryZ Dashboard Tab - Cloudflare R2 View
export function renderR2Tab(): string {
  return `
    <!-- TAB 8: CLOUDFLARE R2 OBJECT STORAGE -->
    <div x-show="activeTab === 'r2'" class="space-y-4">
      <!-- R2 Header & Toolbar -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
              <i class="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div>
              <div class="font-bold text-sm" x-text="t('r2Title')"></div>
              <div class="text-[11px] text-base-content/60" x-text="t('tabR2Sub')"></div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Bucket Selector -->
            <div class="flex items-center gap-1.5 bg-base-100 px-2.5 py-1 rounded-lg border border-base-300 text-xs">
              <i class="fa-solid fa-bucket text-primary text-xs"></i>
              <span class="text-base-content/60" x-text="t('bucket') + ':'"></span>
              <select class="select select-ghost select-xs font-mono font-bold focus:outline-none"
                      x-model="selectedR2Bucket"
                      @change="loadR2Files()">
                <template x-for="b in r2Buckets" :key="b.name || b">
                  <option :value="b.name || b" x-text="b.name || b"></option>
                </template>
              </select>
            </div>

            <!-- Upload File Button -->
            <button class="btn btn-primary btn-xs sm:btn-sm gap-1 shadow-sm shadow-primary/20" @click="openR2UploadModal()">
              <i class="fa-solid fa-plus text-xs"></i> <span x-text="t('uploadToR2')"></span>
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="flex items-center gap-2 flex-wrap pt-2 border-t border-base-300/80">
          <div class="join flex-1 min-w-[200px]">
            <span class="join-item btn btn-xs btn-ghost border border-base-300 bg-base-100 pointer-events-none">
              <i class="fa-solid fa-filter text-[10px] text-base-content/60"></i>
            </span>
            <input type="text" class="input input-xs input-bordered join-item flex-1 focus:outline-none font-mono"
                   :placeholder="t('prefix')"
                   x-model="r2PrefixFilter"
                   @input.debounce.300ms="loadR2Files()">
          </div>

          <button class="btn btn-xs btn-outline gap-1" @click="loadR2Files()">
            <i class="fa-solid fa-rotate-right text-[10px]" :class="{ 'fa-spin': loadingR2 }"></i>
            <span x-text="t('refresh')"></span>
          </button>
        </div>
      </div>

      <!-- Files List / Grid -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between text-xs text-base-content/70 pb-1 border-b border-base-300">
          <div class="flex items-center gap-2 font-bold">
            <i class="fa-solid fa-folder-tree text-primary"></i>
            <span><span x-text="currentLang === 'ar' ? 'الملفات المرفوعة' : 'Uploaded Files'"></span> (<span x-text="r2Files.length"></span>)</span>
          </div>
          <span class="text-[11px] text-base-content/50 font-mono" x-text="'Bucket: ' + selectedR2Bucket"></span>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-xs sm:table-sm w-full">
            <thead>
              <tr class="text-base-content/60 border-base-300">
                <th x-text="t('fileName')"></th>
                <th x-text="t('type')"></th>
                <th x-text="currentLang === 'ar' ? 'الحجم' : 'Size'"></th>
                <th x-text="t('date')"></th>
                <th class="text-end" x-text="t('actions')"></th>
              </tr>
            </thead>
            <tbody>
              <template x-for="f in r2Files" :key="f.key">
                <tr class="hover:bg-base-300/40 border-base-300/60 transition-colors">
                  <td class="font-mono text-xs font-semibold">
                    <div class="flex items-center gap-2">
                      <i class="fa-solid" :class="getFileIcon(f.key, f.content_type)"></i>
                      <span class="truncate max-w-xs sm:max-w-md" :title="f.key" x-text="f.key"></span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-ghost badge-xs font-mono" x-text="f.content_type || 'binary'"></span>
                  </td>
                  <td class="font-mono text-xs" x-text="formatBytes(f.size)"></td>
                  <td class="text-[11px] text-base-content/60 font-mono" x-text="f.last_modified ? new Date(f.last_modified).toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US') : '-'"></td>
                  <td>
                    <div class="flex items-center justify-end gap-1">
                      <!-- Open / View Link -->
                      <a :href="f.url" target="_blank" class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" :data-tip="currentLang === 'ar' ? 'عرض الرابط المباشر' : 'Open direct URL'">
                        <i class="fa-solid fa-arrow-up-right-from-square text-xs text-info"></i>
                      </a>
                      <!-- Download Link -->
                      <a :href="f.download_url" download class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" :data-tip="currentLang === 'ar' ? 'تحميل الملف' : 'Download file'">
                        <i class="fa-solid fa-download text-xs text-primary"></i>
                      </a>
                      <!-- Copy URL -->
                      <button class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" :data-tip="currentLang === 'ar' ? 'نسخ رابط التحميل' : 'Copy download URL'" @click="copyText(window.location.origin + f.download_url)">
                        <i class="fa-solid fa-copy text-xs"></i>
                      </button>
                      <!-- Delete File -->
                      <button class="btn btn-ghost btn-xs btn-square text-error tooltip tooltip-bottom" :data-tip="t('delete')" @click="deleteR2File(f.key)">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div x-show="r2Files.length === 0 && !loadingR2" class="p-8 text-center text-base-content/60 border border-dashed border-base-300 rounded-xl">
          <i class="fa-solid fa-cloud-arrow-up text-3xl mb-2 text-base-content/30"></i>
          <div x-text="t('noFiles')"></div>
        </div>

        <div x-show="loadingR2" class="p-8 text-center">
          <span class="loading loading-spinner loading-md text-primary"></span>
          <div class="text-xs text-base-content/60 mt-2" x-text="t('loading')"></div>
        </div>
      </div>
    </div>
  `;
}
