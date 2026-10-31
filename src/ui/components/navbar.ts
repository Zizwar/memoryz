// MemoryZ Dashboard Component - Top Navbar
export function renderNavbar(): string {
  return `
  <!-- TOP NAVBAR -->
  <header class="navbar bg-base-200/90 backdrop-blur border-b border-base-300 sticky top-0 z-40 px-3 sm:px-6 h-14 min-h-14">
    <!-- Brand -->
    <div class="flex-1 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center font-black shadow-md shadow-primary/20 text-sm">
        <i class="fa-solid fa-brain"></i>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-base sm:text-lg font-black tracking-tight">Memory<span class="text-primary">Z</span></span>
        <span class="badge badge-primary badge-xs font-mono font-bold tracking-wider">v3</span>
      </div>
    </div>

    <!-- Right Actions / Status Bar (Token + Lang + Theme + Menu) -->
    <div class="flex-none flex items-center gap-1 sm:gap-2">
      <!-- Token Economy Indicator (Compact) -->
      <div class="badge badge-outline badge-xs sm:badge-sm font-mono gap-1 tooltip tooltip-bottom" :data-tip="t('tokenEconomy')">
        <i class="fa-solid fa-microchip text-[10px] text-info"></i>
        <span x-text="'~' + (totalMemories * 18) + 't'"></span>
      </div>

      <!-- Language Switcher (AR / EN) with RTL/LTR Auto-Toggle -->
      <button class="btn btn-ghost btn-xs sm:btn-sm gap-1 px-2 rounded-xl border border-base-300/80 hover:bg-base-300/60 transition-all font-bold tooltip tooltip-bottom"
              :data-tip="currentLang === 'ar' ? 'Switch to English' : 'التحويل للعربية'"
              @click="toggleLang()">
        <i class="fa-solid fa-globe text-xs text-primary"></i>
        <span class="text-[11px] font-mono uppercase" x-text="currentLang === 'ar' ? 'EN' : 'عربي'"></span>
      </button>

      <!-- Theme Switcher (Dark / Light Mode) -->
      <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom"
              :data-tip="theme === 'dark' ? t('themeLight') : t('themeDark')"
              @click="toggleTheme()">
        <i class="fa-solid text-xs sm:text-sm" :class="theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-primary'"></i>
      </button>

      <!-- Prominent Login Button when unauthenticated -->
      <template x-if="!currentUser">
        <button class="btn btn-primary btn-xs sm:btn-sm gap-1 px-2.5 rounded-xl font-bold shadow-sm" @click="openAuthModal('login')">
          <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
          <span class="hidden sm:inline" x-text="t('login')"></span>
        </button>
      </template>

      <!-- Unified Profile & Actions Dropdown Menu -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button"
             class="btn btn-ghost btn-xs sm:btn-sm gap-1.5 px-2 rounded-xl border border-base-300/80 bg-base-100/40 hover:bg-base-300/60 transition-all"
             :title="t('mainMenu')">
          <i class="fa-solid fa-bars text-xs sm:text-sm"></i>
          <template x-if="currentUser">
            <div class="w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-[10px] uppercase">
              <span x-text="currentUser.username.substring(0, 2)"></span>
            </div>
          </template>
        </div>

        <ul tabindex="0" class="dropdown-content z-50 menu p-2.5 shadow-2xl bg-base-200 border border-base-300 rounded-2xl w-64 text-xs mt-2 space-y-1">
          <!-- User Profile / Auth Header -->
          <template x-if="currentUser">
            <li class="bg-base-300/60 rounded-xl p-2.5 mb-1">
              <div class="flex items-center justify-between w-full p-0">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-xs uppercase flex-none">
                    <span x-text="currentUser.username.substring(0, 2)"></span>
                  </div>
                  <div class="truncate">
                    <div class="font-bold text-sm truncate" x-text="currentUser.username"></div>
                    <div class="text-[10px] text-base-content/60 truncate" x-text="currentUser.email || t('activeAccount')"></div>
                  </div>
                </div>
                <span class="badge badge-primary badge-xs font-mono font-bold uppercase" x-text="currentUser.role"></span>
              </div>
            </li>
          </template>

          <template x-if="!currentUser">
            <li class="mb-1">
              <button class="btn btn-primary btn-sm w-full gap-2 justify-center text-xs" @click="openAuthModal('login')">
                <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                <span x-text="t('loginOrRegister')"></span>
              </button>
            </li>
          </template>

          <!-- System & Account Links -->
          <template x-if="currentUser">
            <li>
              <a @click="switchTab('connect')" class="flex items-center gap-2.5 py-2 rounded-lg">
                <i class="fa-solid fa-key text-primary text-xs w-4 text-center"></i>
                <span class="font-medium" x-text="t('apiKeyAndConnect')"></span>
              </a>
            </li>
          </template>

          <template x-if="currentUser && currentUser.role === 'admin'">
            <li>
              <a @click="switchTab('admin')" class="flex items-center gap-2.5 py-2 text-warning font-bold rounded-lg">
                <i class="fa-solid fa-crown text-xs w-4 text-center"></i>
                <span x-text="t('adminPanel')"></span>
              </a>
            </li>
          </template>

          <li class="menu-title text-[10px] text-base-content/50 uppercase tracking-wider pt-1" x-text="t('standalonePages')"></li>

          <!-- Standalone Knowledge Graph -->
          <li>
            <a href="/graph" target="_blank" rel="noopener" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-circle-nodes text-primary text-xs w-4 text-center"></i>
                <span class="font-medium" x-text="t('graphStandalone')"></span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- Standalone Webhooks -->
          <li>
            <a href="/webhooks" target="_blank" rel="noopener" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-satellite-dish text-secondary text-xs w-4 text-center"></i>
                <span class="font-medium" x-text="t('webhooksStandalone')"></span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- Docs -->
          <li>
            <a href="/docs" target="_blank" rel="noopener" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-book-open text-info text-xs w-4 text-center"></i>
                <span class="font-medium" x-text="t('docsPortal')"></span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- Skill URL Copier -->
          <li>
            <a @click="copySkillUrl()" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-scroll text-accent text-xs w-4 text-center"></i>
                <span x-text="t('copySkillUrl')"></span>
              </div>
              <span class="badge badge-ghost badge-xs font-mono">Skill</span>
            </a>
          </li>

          <!-- Direct MCP Copier -->
          <li>
            <a @click="copyDirectMcpUrl()" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-bolt text-warning text-xs w-4 text-center"></i>
                <span x-text="t('copyDirectMcpUrl')"></span>
              </div>
              <span class="badge badge-ghost badge-xs font-mono">SSE</span>
            </a>
          </li>

          <li class="menu-title text-[10px] text-base-content/50 uppercase tracking-wider pt-1" x-text="t('packagesAndRepos')"></li>

          <!-- GitHub Repo -->
          <li>
            <a href="https://github.com/Zizwar/memoryz" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-brands fa-github text-xs w-4 text-center"></i>
                <span x-text="t('githubRepo')"></span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- NPM Package -->
          <li>
            <a href="https://www.npmjs.com/package/memoryz" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between py-2 rounded-lg">
              <div class="flex items-center gap-2.5">
                <i class="fa-brands fa-npm text-error text-sm w-4 text-center"></i>
                <span x-text="t('npmPackage')"></span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
            </a>
          </li>

          <!-- Logout -->
          <template x-if="currentUser">
            <li class="border-t border-base-300 mt-1 pt-1">
              <a @click="logout()" class="text-error flex items-center gap-2.5 py-2 rounded-lg">
                <i class="fa-solid fa-right-from-bracket text-xs w-4 text-center"></i>
                <span x-text="t('logout')"></span>
              </a>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </header>
  `;
}
