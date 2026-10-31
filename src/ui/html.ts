import { renderNavbar } from "./components/navbar.ts";
import { renderNavCards } from "./components/nav_cards.ts";
import { renderModals } from "./components/modals.ts";
import { renderMemoriesTab } from "./tabs/tab_memories.ts";
import { renderGraphTab } from "./tabs/tab_graph.ts";
import { renderTasksTab } from "./tabs/tab_tasks.ts";
import { renderWebhooksTab } from "./tabs/tab_webhooks.ts";
import { renderContextTab } from "./tabs/tab_context.ts";
import { renderAgentTab } from "./tabs/tab_agent.ts";
import { renderVaultTab } from "./tabs/tab_vault.ts";
import { renderConnectTab } from "./tabs/tab_connect.ts";
import { renderR2Tab } from "./tabs/tab_r2.ts";
import { renderAdminTab } from "./tabs/tab_admin.ts";

export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemoryZ — Sovereign Living Memory & Task Substrate</title>
  
  <script>
    (function() {
      const savedTheme = localStorage.getItem('memoryz_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      const savedLang = localStorage.getItem('mz_lang') || 'ar';
      document.documentElement.setAttribute('lang', savedLang);
      document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    })();
  </script>
  
  <!-- Fonts & Core UI Libraries: Tailwind, DaisyUI 4, FontAwesome 6, Alpine.js -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Tajawal', 'sans-serif'],
            mono: ['Fira Code', 'monospace'],
          }
        }
      }
    }
  </script>

  <style>
    [x-cloak] { display: none !important; }
    body { font-family: 'Tajawal', sans-serif; }
    .mono { font-family: 'Fira Code', monospace; direction: ltr; text-align: left; }
    .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: oklch(var(--bc) / 0.18); border-radius: 4px; }
    [dir="ltr"] body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    [dir="ltr"] .text-start { text-align: left; }
    [dir="rtl"] .text-start { text-align: right; }
  </style>
</head>

<body class="min-h-screen bg-base-100 text-base-content flex flex-col antialiased selection:bg-primary selection:text-primary-content"
      x-data="memoryzApp"
      x-init="initApp()"
      x-cloak>

  ${renderNavbar()}

  <!-- MAIN WRAPPER -->
  <main class="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
    <!-- Unauthenticated Banner Alert -->
    <template x-if="!currentUser && !authToken">
      <div class="alert bg-warning/10 border border-warning/30 text-warning text-xs p-3 rounded-xl flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2.5">
          <i class="fa-solid fa-triangle-exclamation text-base"></i>
          <span x-text="t('guestAlert')"></span>
        </div>
        <button class="btn btn-warning btn-xs font-bold gap-1 shrink-0" @click="openAuthModal('login')">
          <i class="fa-solid fa-arrow-right-to-bracket text-[10px]"></i>
          <span x-text="t('loginNow')"></span>
        </button>
      </div>
    </template>

    ${renderNavCards()}

    <!-- Tab Views -->
    ${renderMemoriesTab()}
    ${renderGraphTab()}
    ${renderTasksTab()}
    ${renderWebhooksTab()}
    ${renderContextTab()}
    ${renderAgentTab()}
    ${renderVaultTab()}
    ${renderConnectTab()}
    ${renderR2Tab()}
    ${renderAdminTab()}
  </main>

  ${renderModals()}

  <!-- Modular Scripts Architecture -->
  <script src="/js/i18n.js"></script>
  <script src="/js/utils.js"></script>
  <script src="/js/auth.js"></script>
  <script src="/js/memories.js"></script>
  <script src="/js/graph.js"></script>
  <script src="/js/tasks.js"></script>
  <script src="/js/webhooks.js"></script>
  <script src="/js/context.js"></script>
  <script src="/js/agent.js"></script>
  <script src="/js/vault.js"></script>
  <script src="/js/r2.js"></script>
  <script src="/js/connect.js"></script>
  <script src="/js/admin.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`;
}
