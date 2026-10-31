// MemoryZ Dashboard Component - Modals & Dialogs
export function renderModals(): string {
  return `
  <!-- Modal: Link Memories (Graph Edge) -->
  <dialog class="modal" :class="{ 'modal-open': modals.link }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-lg">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-link text-primary"></i>
        <span x-text="t('addLink')"></span>
      </h3>
      <form @submit.prevent="submitCreateLink()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text font-bold" x-text="t('sourceNode')"></span></label>
          <select class="select select-sm select-bordered w-full bg-base-100" x-model="linkModalData.sourceHash" required>
            <option value="" disabled x-text="t('sourceNode') + '...'"></option>
            <template x-for="m in memories" :key="m.hash">
              <option :value="m.hash" x-text="'[' + m.type + '] ' + (m.title || m.content.substring(0, 35))"></option>
            </template>
          </select>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold" x-text="t('targetNode')"></span></label>
          <select class="select select-sm select-bordered w-full bg-base-100" x-model="linkModalData.targetHash" required>
            <option value="" disabled x-text="t('targetNode') + '...'"></option>
            <template x-for="m in memories" :key="m.hash">
              <option :value="m.hash" x-text="'[' + m.type + '] ' + (m.title || m.content.substring(0, 35))"></option>
            </template>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold" x-text="t('relationType')"></span></label>
            <select class="select select-sm select-bordered font-mono" x-model="linkModalData.relationType" required>
              <option value="related">related</option>
              <option value="depends_on">depends_on</option>
              <option value="context_for">context_for</option>
              <option value="supersedes">supersedes</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold" x-text="t('weight')"></span></label>
            <input type="number" step="0.1" min="0.1" max="5.0" class="input input-sm input-bordered font-mono" x-model.number="linkModalData.weight" required />
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.link = false" x-text="t('cancel')"></button>
          <button type="submit" class="btn btn-primary btn-sm gap-1" :disabled="creatingLink">
            <span x-show="creatingLink" class="loading loading-spinner loading-xs"></span>
            <span x-text="t('save')"></span>
          </button>
        </div>
      </form>
    </div>
  </dialog>

  <!-- Modal: Memory Form (New / Edit) -->
  <dialog class="modal" :class="{ 'modal-open': modals.memory }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-lg">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-brain text-primary"></i>
        <span x-text="t('newMemoryModal')"></span>
      </h3>
      <form @submit.prevent="saveMemory()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('type')"></span></label>
          <select class="select select-sm select-bordered" x-model="formMemory.type">
            <option value="env">env</option>
            <option value="preference">preference</option>
            <option value="skill">skill</option>
            <option value="note">note</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('title') + ' (' + (currentLang === 'ar' ? 'اختياري' : 'optional') + ')'"></span></label>
          <input type="text" class="input input-sm input-bordered" placeholder="e.g. staging_database_port" x-model="formMemory.title">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('content') + ' (768-dim Vector)'"></span></label>
          <textarea class="textarea textarea-sm textarea-bordered h-24" :placeholder="t('searchMemories')" required x-model="formMemory.content"></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.memory = false" x-text="t('cancel')"></button>
          <button type="submit" class="btn btn-primary btn-sm" x-text="t('save')"></button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.memory = false"><button x-text="t('close')"></button></form>
  </dialog>

  <!-- Modal: Task Form (New / Subtask) -->
  <dialog class="modal" :class="{ 'modal-open': modals.task }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-lg">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-list-check text-success"></i>
        <span x-text="formTask.parent_id ? (t('subtasks') || 'Add Subtask') : t('addTask')"></span>
      </h3>
      <form @submit.prevent="saveTask()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('title')"></span></label>
          <input type="text" class="input input-sm input-bordered" placeholder="e.g. Write unit tests..." required x-model="formTask.title">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="form-control">
            <label class="label"><span class="label-text" x-text="t('status')"></span></label>
            <select class="select select-sm select-bordered" x-model="formTask.status">
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
              <option value="blocked">blocked</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text" x-text="t('priority')"></span></label>
            <select class="select select-sm select-bordered" x-model="formTask.priority">
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
              <option value="low">low</option>
            </select>
          </div>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('assignee')"></span></label>
          <input type="text" class="input input-sm input-bordered font-mono" placeholder="cursor, claude, architect..." x-model="formTask.assignee">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('taskDesc')"></span></label>
          <textarea class="textarea textarea-sm textarea-bordered h-20" placeholder="Task execution steps, requirements..." x-model="formTask.description"></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.task = false" x-text="t('cancel')"></button>
          <button type="submit" class="btn btn-success btn-sm text-success-content" x-text="t('save')"></button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.task = false"><button x-text="t('close')"></button></form>
  </dialog>

  <!-- Modal: Webhook Registration Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.webhook }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-satellite-dish text-primary"></i>
        <span x-text="t('addWebhook')"></span>
      </h3>
      <form @submit.prevent="saveWebhook()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('webhookUrl')"></span></label>
          <input type="url" class="input input-sm input-bordered font-mono" placeholder="https://api.domain.com/webhook" required x-model="formWebhook.url">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('webhookSecret')"></span></label>
          <input type="text" class="input input-sm input-bordered font-mono" placeholder="Secret for HMAC-SHA256" x-model="formWebhook.secret">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="form-control">
            <label class="label"><span class="label-text" x-text="t('namespace')"></span></label>
            <input type="text" class="input input-sm input-bordered font-mono" placeholder="vibzcode, default..." x-model="formWebhook.namespace">
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text" x-text="t('events')"></span></label>
            <input type="text" class="input input-sm input-bordered font-mono" placeholder="task.*,memory.*" required x-model="formWebhook.events">
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.webhook = false" x-text="t('cancel')"></button>
          <button type="submit" class="btn btn-primary btn-sm" x-text="t('save')"></button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.webhook = false"><button x-text="t('close')"></button></form>
  </dialog>

  <!-- Modal: Vault Store Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.vault }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-lock text-error"></i>
        <span x-text="t('storeSecret')"></span>
      </h3>
      <form @submit.prevent="saveVaultSecret()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('keyName')"></span></label>
          <input type="text" class="input input-sm input-bordered font-mono" placeholder="e.g. key_gemini or db_pass" required x-model="formVault.key_name">
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('secretValue')"></span></label>
          <textarea class="textarea textarea-sm textarea-bordered font-mono h-20" placeholder="sk_live_... or secret payload" required x-model="formVault.secret_value"></textarea>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('passphrase')"></span></label>
          <input type="password" class="input input-sm input-bordered" placeholder="Client passphrase (never saved)" required x-model="formVault.passphrase">
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.vault = false" x-text="t('cancel')"></button>
          <button type="submit" class="btn btn-error btn-sm text-error-content" x-text="t('save')"></button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.vault = false"><button x-text="t('close')"></button></form>
  </dialog>

  <!-- Modal: Decrypt Secret Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.decrypt }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-unlock-keyhole text-primary"></i>
        <span x-text="t('decryptSecret') + ': ' + decryptKeyName"></span>
      </h3>
      <form @submit.prevent="retrieveVaultSecret()" class="space-y-3 text-xs">
        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('passphrase')"></span></label>
          <input type="password" class="input input-sm input-bordered" required x-model="decryptPassphrase">
        </div>

        <div x-show="decryptedResult" class="space-y-1.5 pt-2">
          <div class="label"><span class="label-text text-success font-bold" x-text="t('secretValue') + ' (RAM):'"></span></div>
          <div class="join w-full">
            <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs" readonly :value="decryptedResult">
            <button type="button" class="btn btn-sm btn-ghost join-item" @click="copyText(decryptedResult)">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.decrypt = false" x-text="t('close')"></button>
          <button type="submit" class="btn btn-primary btn-sm" x-text="t('decryptSecret') + ' 🔓'"></button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.decrypt = false"><button x-text="t('close')"></button></form>
  </dialog>

  <!-- Modal: Auth (Login / Register / API Key) -->
  <dialog class="modal" :class="{ 'modal-open': modals.auth }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-sm">
      <div class="tabs tabs-boxed mb-3 p-1">
        <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': authMode === 'login' }" @click="authMode = 'login'" x-text="t('login')"></a>
        <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': authMode === 'key' }" @click="authMode = 'key'">API Key</a>
        <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': authMode === 'register' }" @click="authMode = 'register'" x-text="t('register')"></a>
      </div>

      <form @submit.prevent="submitAuth()" class="space-y-3 text-xs">
        <template x-if="authMode === 'key'">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold" x-text="t('apiKeyPlaceholder')"></span></label>
            <input type="text" class="input input-sm input-bordered font-mono" placeholder="mz_..." required x-model="authForm.apiKey">
            <label class="label"><span class="label-text-alt text-base-content/50" x-text="t('authApiKeyTitle')"></span></label>
          </div>
        </template>

        <template x-if="authMode === 'register'">
          <div class="form-control">
            <label class="label"><span class="label-text" x-text="t('username')"></span></label>
            <input type="text" class="input input-sm input-bordered" required x-model="authForm.username">
          </div>
        </template>

        <template x-if="authMode !== 'key'">
          <div class="space-y-3">
            <div class="form-control">
              <label class="label"><span class="label-text" x-text="authMode === 'register' ? 'Email' : t('emailOrUsername')"></span></label>
              <input type="text" class="input input-sm input-bordered" required x-model="authForm.identifier">
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text" x-text="t('password')"></span></label>
              <input type="password" class="input input-sm input-bordered" required x-model="authForm.password">
            </div>
          </div>
        </template>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.auth = false" x-text="t('cancel')"></button>
          <button type="submit" class="btn btn-primary btn-sm" x-text="authMode === 'register' ? t('register') : (authMode === 'key' ? 'Key Login 🔑' : t('login'))"></button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.auth = false"><button x-text="t('close')"></button></form>
  </dialog>

  <!-- Modal: R2 Upload Form -->
  <dialog class="modal" :class="{ 'modal-open': modals.r2Upload }">
    <div class="modal-box bg-base-200 border border-base-300 max-w-md">
      <h3 class="font-bold text-base mb-3 flex items-center gap-2">
        <i class="fa-solid fa-cloud-arrow-up text-primary"></i>
        <span x-text="t('uploadToR2')"></span>
      </h3>
      <form @submit.prevent="submitR2Upload()" class="space-y-3 text-xs">
        <div class="tabs tabs-boxed mb-2 p-1">
          <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': formR2Upload.mode === 'file' }" @click="formR2Upload.mode = 'file'" x-text="t('uploadModeFile')"></a>
          <a class="tab tab-sm flex-1 font-bold" :class="{ 'tab-active': formR2Upload.mode === 'text' }" @click="formR2Upload.mode = 'text'" x-text="t('uploadModeText')"></a>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('bucket')"></span></label>
          <select class="select select-sm select-bordered font-mono" x-model="formR2Upload.bucket">
            <template x-for="b in r2Buckets" :key="b.name || b">
              <option :value="b.name || b" x-text="b.name || b"></option>
            </template>
          </select>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text" x-text="t('fileName')"></span></label>
          <input type="text" class="input input-sm input-bordered font-mono"
                 placeholder="e.g. bundles/app.zip or code/script.py"
                 required x-model="formR2Upload.key">
        </div>

        <template x-if="formR2Upload.mode === 'file'">
          <div class="form-control">
            <label class="label"><span class="label-text" x-text="t('uploadModeFile')"></span></label>
            <input type="file" class="file-input file-input-sm file-input-bordered w-full"
                   @change="handleR2FileSelect($event)">
          </div>
        </template>

        <template x-if="formR2Upload.mode === 'text'">
          <div class="form-control">
            <label class="label"><span class="label-text" x-text="t('fileContent')"></span></label>
            <textarea class="textarea textarea-sm textarea-bordered font-mono h-28"
                      placeholder="Paste file content here..."
                      x-model="formR2Upload.textContent"></textarea>
          </div>
        </template>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="modals.r2Upload = false" x-text="t('cancel')"></button>
          <button type="submit" class="btn btn-primary btn-sm gap-1" :disabled="uploadingR2">
            <span class="loading loading-spinner loading-xs" x-show="uploadingR2"></span>
            <span x-text="t('uploadToR2') + ' 🚀'"></span>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="modals.r2Upload = false"><button x-text="t('close')"></button></form>
  </dialog>

  <!-- Toast Notification (Minimalist) -->
  <div class="toast toast-end toast-bottom z-50 pointer-events-none" x-show="toast.show" x-transition>
    <div class="alert alert-info py-2 px-4 shadow-lg text-xs font-semibold gap-2">
      <i class="fa-solid fa-circle-check text-success"></i>
      <span x-text="toast.message"></span>
    </div>
  </div>
  `;
}
