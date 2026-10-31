// MemoryZ Dashboard Tab - Connect & MCP View
export function renderConnectTab(): string {
  return `
    <!-- TAB 6: CONNECT & MCP SETTINGS -->
    <div x-show="activeTab === 'connect'" class="space-y-4">
      <!-- 1. Direct Single-URL Remote MCP Connector -->
      <div class="card bg-gradient-to-br from-primary/10 via-base-200 to-base-200 border border-primary/30 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold">
              <i class="fa-solid fa-mobile-screen"></i>
            </div>
            <div>
              <div class="font-bold text-sm">Single URL Remote MCP (Mobile & Web)</div>
              <div class="text-[11px] text-base-content/60">Claude Mobile, ChatGPT, LibreChat, Windsurf, Cursor</div>
            </div>
          </div>
          <span class="badge badge-primary badge-sm font-mono">Streamable HTTP</span>
        </div>

        <div class="join w-full">
          <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                 readonly :value="getDirectMcpUrl()">
          <button class="btn btn-sm btn-primary join-item gap-1" @click="copyText(getDirectMcpUrl())">
            <i class="fa-solid fa-copy text-xs"></i> <span x-text="t('copy')"></span>
          </button>
        </div>
      </div>

      <!-- 2. OpenAPI 3.1 Connector -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center font-bold">
              <i class="fa-solid fa-plug"></i>
            </div>
            <div>
              <div class="font-bold text-sm">OpenAPI 3.1 Connector (ChatGPT Actions)</div>
              <div class="text-[11px] text-base-content/60">Custom GPT &rarr; Actions &rarr; Import from URL</div>
            </div>
          </div>
        </div>

        <div class="join w-full">
          <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                 readonly :value="getOpenApiUrl()">
          <button class="btn btn-sm btn-secondary join-item gap-1" @click="copyText(getOpenApiUrl())">
            <i class="fa-solid fa-copy text-xs"></i> <span x-text="t('copy')"></span>
          </button>
        </div>
      </div>

      <!-- 3. Desktop Cursor & Terminal Configuration -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center font-bold">
            <i class="fa-solid fa-terminal"></i>
          </div>
          <div>
            <div class="font-bold text-sm">CLI & Desktop Setup (Cursor / Claude Code)</div>
            <div class="text-[11px] text-base-content/60">Fast automated installation via npx</div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="join w-full">
            <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                   readonly :value="'npx memoryz init --token=' + (currentUser?.api_key || 'YOUR_TOKEN')">
            <button class="btn btn-sm btn-ghost join-item" @click="copyText('npx memoryz init --token=' + (currentUser?.api_key || 'YOUR_TOKEN'))">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Token-Free Skill File for Autonomous Agents (skill.md) -->
      <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center font-bold">
              <i class="fa-solid fa-scroll"></i>
            </div>
            <div>
              <div class="font-bold text-sm">skill.md — Sovereign Agent Skill</div>
              <div class="text-[11px] text-base-content/60">Token-free public discovery file for agent sandboxes</div>
            </div>
          </div>
          <span class="badge badge-accent badge-sm font-mono">Agent Skill</span>
        </div>

        <div class="join w-full">
          <input type="text" class="input input-sm input-bordered join-item flex-1 mono text-xs bg-base-300"
                 readonly :value="window.location.origin + '/skill.md'">
          <a :href="'/skill.md?download=true'" class="btn btn-sm btn-accent join-item gap-1">
            <i class="fa-solid fa-download text-xs"></i> <span>Download</span>
          </a>
          <button class="btn btn-sm btn-ghost join-item" @click="copySkillUrl()">
            <i class="fa-solid fa-copy text-xs"></i>
          </button>
        </div>

        <div class="space-y-1.5 pt-1">
          <div class="mockup-code text-xs bg-base-300 border border-base-content/10 shadow relative">
            <pre data-prefix="$"><code>npx skills add https://memoryz.wino.deno.net</code></pre>
            <button class="btn btn-ghost btn-xs absolute end-3 top-3 text-base-content/60 hover:text-base-content"
                    @click="copyText('npx skills add https://memoryz.wino.deno.net')">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-base-300 flex-wrap gap-2">
          <span class="text-xs text-base-content/60" x-text="t('docsPortal')"></span>
          <a href="/docs" target="_blank" class="btn btn-outline btn-xs sm:btn-sm gap-1.5">
            <i class="fa-solid fa-book-open text-xs"></i> <span x-text="t('docsPortal')"></span>
          </a>
        </div>
      </div>
    </div>
  `;
}
