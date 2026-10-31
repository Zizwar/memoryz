// MemoryZ Dashboard Tab - Tasks View
export function renderTasksTab(): string {
  return `
    <!-- TAB 2: HIERARCHICAL TASKS & MULTI-AGENT TODOS -->
    <div x-show="activeTab === 'tasks'" class="space-y-4">
      <!-- Status Filter Bar -->
      <div class="card bg-base-200 border border-base-300 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-success/20 text-success flex items-center justify-center font-bold">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div>
            <div class="font-bold text-sm" x-text="t('tabTasks')"></div>
            <div class="text-[11px] text-base-content/60" x-text="t('tabTasksSub')"></div>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select class="select select-sm select-bordered w-full sm:w-auto text-xs" x-model="taskStatusFilter" @change="loadTasks()">
            <option value="" x-text="t('allTasks')"></option>
            <option value="active">Active</option>
            <option value="todo" x-text="t('todo')"></option>
            <option value="in_progress" x-text="t('in_progress')"></option>
            <option value="done" x-text="t('done')"></option>
            <option value="blocked" x-text="t('blocked')"></option>
          </select>
        </div>
      </div>

      <!-- Task Hierarchy List -->
      <div class="card bg-base-200 border border-base-300 p-4 shadow-sm space-y-2.5">
        <template x-for="t in taskTree" :key="t.id">
          <div class="space-y-2">
            <!-- Root Task Card -->
            <div class="p-3 rounded-xl border border-base-300 bg-base-100/60 hover:bg-base-100 transition-colors flex items-start justify-between gap-3"
                 :class="{ 'opacity-60': isTaskDone(t.status) }">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5"
                       :checked="isTaskDone(t.status)"
                       @change="toggleTaskStatus(t)">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-bold text-sm text-base-content truncate"
                          :class="{ 'line-through text-base-content/50': isTaskDone(t.status) }"
                          x-text="t.title"></span>
                    <span class="badge badge-xs font-mono" :class="getTaskBadgeClass(t.status)" x-text="t.status"></span>
                    <span class="badge badge-outline badge-xs font-mono" x-text="t.priority"></span>
                    <template x-if="t.namespace">
                      <span class="badge badge-outline badge-xs font-mono" x-text="t.namespace"></span>
                    </template>
                    <template x-if="t.assignee">
                      <span class="badge badge-ghost badge-xs gap-1 font-mono">
                        <i class="fa-solid fa-robot text-[9px] text-primary"></i>
                        <span x-text="'@' + t.assignee"></span>
                      </span>
                    </template>
                    <template x-if="t.locked_by">
                      <span class="inline-flex items-center gap-1">
                        <span class="badge badge-warning badge-xs font-mono gap-1 text-[10px]" :title="(t('lockedBy') || 'Locked by') + ': ' + t.locked_by">
                          <i class="fa-solid fa-lock text-[9px]"></i>
                          <span x-text="t.locked_by"></span>
                        </span>
                        <button class="btn btn-ghost btn-xs text-warning p-0.5 h-auto min-h-0" @click="releaseTaskLock(t.id, t.locked_by)" :title="t('releaseLock')">
                          <i class="fa-solid fa-lock-open text-[10px]"></i>
                        </button>
                      </span>
                    </template>
                  </div>
                  <template x-if="t.description">
                    <p class="text-xs text-base-content/70 mt-1 leading-relaxed" x-text="t.description"></p>
                  </template>
                </div>
              </div>

              <!-- Task Actions -->
              <div class="flex items-center gap-1 flex-none">
                <button class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" :data-tip="t('subtasks')" @click="openTaskModal(t.id)">
                  <i class="fa-solid fa-folder-plus text-xs text-primary"></i>
                </button>
                <button class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom text-error" :data-tip="t('delete')" @click="deleteTask(t.id)">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Subtasks (Children) -->
            <template x-if="t.children && t.children.length > 0">
              <div class="ms-6 ps-3 border-s-2 border-primary/30 space-y-2">
                <template x-for="sub in t.children" :key="sub.id">
                  <div class="p-2.5 rounded-lg border border-base-300 bg-base-100/40 hover:bg-base-100 transition-colors flex items-start justify-between gap-2"
                       :class="{ 'opacity-60': isTaskDone(sub.status) }">
                    <div class="flex items-start gap-2.5 flex-1 min-w-0">
                      <input type="checkbox" class="checkbox checkbox-xs checkbox-primary mt-0.5"
                             :checked="isTaskDone(sub.status)"
                             @change="toggleTaskStatus(sub)">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="text-xs font-semibold" :class="{ 'line-through text-base-content/50': isTaskDone(sub.status) }" x-text="sub.title"></span>
                          <span class="badge badge-xs font-mono" :class="getTaskBadgeClass(sub.status)" x-text="sub.status"></span>
                          <template x-if="sub.namespace">
                            <span class="badge badge-outline badge-xs font-mono" x-text="sub.namespace"></span>
                          </template>
                          <template x-if="sub.assignee">
                            <span class="badge badge-ghost badge-xs gap-1 font-mono">
                              <i class="fa-solid fa-robot text-[9px] text-primary"></i>
                              <span x-text="'@' + sub.assignee"></span>
                            </span>
                          </template>
                          <template x-if="sub.locked_by">
                            <span class="inline-flex items-center gap-1">
                              <span class="badge badge-warning badge-xs font-mono gap-1 text-[9px]" :title="(t('lockedBy') || 'Locked by') + ': ' + sub.locked_by">
                                <i class="fa-solid fa-lock text-[8px]"></i>
                                <span x-text="sub.locked_by"></span>
                              </span>
                              <button class="btn btn-ghost btn-xs text-warning p-0.5 h-auto min-h-0" @click="releaseTaskLock(sub.id, sub.locked_by)" :title="t('releaseLock')">
                                <i class="fa-solid fa-lock-open text-[9px]"></i>
                              </button>
                            </span>
                          </template>
                        </div>
                      </div>
                    </div>
                    <button class="btn btn-ghost btn-xs btn-square text-error" @click="deleteTask(sub.id)">
                      <i class="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>

        <div x-show="taskTree.length === 0 && !loadingTasks" class="p-8 text-center text-base-content/60">
          <i class="fa-solid fa-clipboard-check text-3xl mb-2 text-base-content/30"></i>
          <div x-text="t('noTasks')"></div>
        </div>
      </div>

      <!-- AI Token-Optimized Tree Preview (ASCII format) -->
      <div class="card bg-base-200 border border-base-300 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 text-xs font-bold text-primary">
            <i class="fa-solid fa-code"></i>
            <span x-text="t('asciiView')"></span>
          </div>
          <button class="btn btn-ghost btn-xs gap-1" @click="copyText(taskAsciiPreview)">
            <i class="fa-solid fa-copy text-xs"></i> <span x-text="t('copy')"></span>
          </button>
        </div>
        <pre class="bg-base-300 p-3 rounded-lg text-xs mono text-base-content/80 overflow-x-auto max-h-44" x-text="taskAsciiPreview || '(No tasks)'"></pre>
      </div>
    </div>
  `;
}
