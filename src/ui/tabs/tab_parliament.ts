// MemoryZ Dashboard Tab - Parliament & Multi-Agent Deliberations
export function renderParliamentTab(): string {
  return `
    <!-- TAB: PARLIAMENT & MULTI-AGENT DELIBERATIONS -->
    <div x-show="activeTab === 'parliament'" class="space-y-4" x-init="if (typeof initParliament === 'function') initParliament()">

      <!-- OWNER DECISION NOTIFICATION ALERT -->
      <template x-if="proposalsNeedingDecision && proposalsNeedingDecision.length > 0">
        <div class="alert bg-warning/15 border border-warning/40 text-warning text-xs p-3.5 rounded-2xl flex items-center justify-between shadow-sm animate-pulse">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-warning/20 flex items-center justify-center font-bold text-sm shrink-0">
              <i class="fa-solid fa-bell"></i>
            </div>
            <div>
              <div class="font-bold text-xs sm:text-sm" x-text="t('ownerDecisionNeeded')"></div>
              <div class="text-[11px] opacity-80" x-text="(MZ.i18n.currentLang === 'ar' ? 'هناك ' : 'There are ') + proposalsNeedingDecision.length + (MZ.i18n.currentLang === 'ar' ? ' مقترح(ات) جاهزة للمراجعة أو كشف الأصوات أو الحسم.' : ' proposal(s) ready for review, reveal or owner decision.')"></div>
            </div>
          </div>
          <button class="btn btn-warning btn-xs font-bold gap-1 shrink-0" @click="parliamentFilter = 'revealed'">
            <i class="fa-solid fa-eye text-[10px]"></i>
            <span x-text="MZ.i18n.currentLang === 'ar' ? 'عرض الجاهزة' : 'View Ready'"></span>
          </button>
        </div>
      </template>

      <!-- TOP CONTROL & SUB-NAVIGATION BAR -->
      <div class="card bg-base-200 border border-base-300 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <!-- Brand & Stats -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-lg font-bold shadow-sm">
            <i class="fa-solid fa-landmark"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm sm:text-base" x-text="t('tabParliament')"></span>
              <span class="badge badge-primary badge-xs font-mono font-bold" x-text="'Active: ' + activeSessionsCount"></span>
            </div>
            <div class="text-[11px] text-base-content/60" x-text="t('tabParliamentSub')"></div>
          </div>
        </div>

        <!-- View Mode Switcher Join & Actions -->
        <div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div class="join shadow-sm bg-base-100 border border-base-300 rounded-xl p-0.5 text-xs">
            <button class="btn btn-xs join-item gap-1.5 transition-all"
                    :class="parliamentViewMode === 'proposals' ? 'btn-primary font-bold' : 'btn-ghost'"
                    @click="parliamentViewMode = 'proposals'">
              <i class="fa-solid fa-list-check text-[11px]"></i>
              <span x-text="t('proposals')"></span>
            </button>
            <button class="btn btn-xs join-item gap-1.5 transition-all"
                    :class="parliamentViewMode === 'vibing' ? 'btn-primary font-bold' : 'btn-ghost'"
                    @click="parliamentViewMode = 'vibing'">
              <i class="fa-solid fa-comments text-[11px]"></i>
              <span x-text="t('vibingSessions')"></span>
            </button>
            <button class="btn btn-xs join-item gap-1.5 transition-all"
                    :class="parliamentViewMode === 'agents' ? 'btn-primary font-bold' : 'btn-ghost'"
                    @click="parliamentViewMode = 'agents'">
              <i class="fa-solid fa-users-gear text-[11px]"></i>
              <span x-text="t('guardians')"></span>
            </button>
          </div>

          <div class="flex items-center gap-1.5">
            <button class="btn btn-primary btn-xs sm:btn-sm gap-1.5 rounded-xl font-bold shadow-sm shadow-primary/20" @click="openNewProposalModal()">
              <i class="fa-solid fa-plus text-xs"></i>
              <span x-text="t('newProposal')"></span>
            </button>
            <button class="btn btn-ghost btn-xs sm:btn-sm btn-circle tooltip tooltip-bottom" :data-tip="t('refresh')" @click="loadProposals()" :disabled="loadingProposals">
              <i class="fa-solid fa-rotate text-xs" :class="loadingProposals ? 'fa-spin text-primary' : ''"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- SECRECY RULE PRINCIPLE BANNER (Collapsible / Educational) -->
      <div class="bg-base-200/60 border border-base-300 rounded-2xl p-3 text-xs flex items-start gap-3 text-base-content/80">
        <div class="w-7 h-7 rounded-lg bg-info/15 text-info flex items-center justify-center shrink-0 mt-0.5">
          <i class="fa-solid fa-shield-halved text-xs"></i>
        </div>
        <div class="flex-1 space-y-1">
          <div class="font-bold text-[12px] text-base-content flex items-center gap-2">
            <span x-text="t('secrecyRule')"></span>
            <span class="badge badge-outline badge-xs font-mono font-normal">Ariadne Thread</span>
          </div>
          <p class="text-[11px] leading-relaxed text-base-content/70" x-text="t('secrecyDesc')"></p>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 1: PROPOSALS LIST & DETAIL CHAMBER -->
      <!-- ========================================================================= -->
      <div x-show="parliamentViewMode === 'proposals'" class="space-y-4">

        <!-- PROPOSAL DETAIL CHAMBER (When a proposal is selected) -->
        <template x-if="selectedProposal">
          <div class="space-y-4">
            <!-- Chamber Header / Back Bar -->
            <div class="card bg-base-200 border border-primary/30 p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <button class="btn btn-ghost btn-xs sm:btn-sm gap-1.5 rounded-xl font-bold" @click="closeProposalDetail()">
                  <i class="fa-solid fa-arrow-right rtl:rotate-0 ltr:rotate-180 text-xs"></i>
                  <span x-text="MZ.i18n.currentLang === 'ar' ? 'العودة للقائمة' : 'Back to List'"></span>
                </button>
                <div class="h-5 w-px bg-base-300 hidden sm:block"></div>
                <div class="truncate">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="badge badge-xs font-mono" :class="getStatusBadgeClass(selectedProposal.status)" x-text="getStatusLabel(selectedProposal.status, selectedProposal.round)"></span>
                    <span class="badge badge-xs" :class="getKindBadgeClass(selectedProposal.kind)" x-text="selectedProposal.kind"></span>
                    <span class="badge badge-outline badge-xs font-mono" x-text="selectedProposal.namespace"></span>
                    <template x-if="selectedProposal.deadline">
                      <span class="badge badge-warning badge-xs font-mono gap-1" :title="t('deadline')">
                        <i class="fa-solid fa-stopwatch text-[9px]"></i>
                        <span x-text="formatCountdown(selectedProposal.deadline)"></span>
                      </span>
                    </template>
                  </div>
                  <h2 class="font-black text-sm sm:text-base text-base-content mt-1 truncate" x-text="selectedProposal.title"></h2>
                </div>
              </div>

              <!-- Chamber Top Controls -->
              <div class="flex items-center gap-1.5 flex-none w-full sm:w-auto justify-end">
                <button class="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom" :data-tip="t('refresh')" @click="loadProposalDetail(selectedProposal.id)">
                  <i class="fa-solid fa-rotate text-xs" :class="loadingDetail ? 'fa-spin text-primary' : ''"></i>
                </button>
              </div>
            </div>

            <!-- TIMELINE PROGRESS BAR -->
            <div class="card bg-base-200 border border-base-300 p-3.5 sm:p-5 rounded-2xl shadow-sm space-y-3">
              <div class="font-bold text-xs text-base-content/70 flex items-center gap-2">
                <i class="fa-solid fa-timeline text-primary"></i>
                <span x-text="MZ.i18n.currentLang === 'ar' ? 'المخطط الزمني لمسار القرار' : 'Deliberation Timeline'"></span>
              </div>
              <ul class="steps steps-vertical sm:steps-horizontal w-full text-xs font-medium">
                <li class="step step-primary" :data-content="'✓'">
                  <div class="text-start sm:text-center mt-1">
                    <div class="font-bold text-[11px]" x-text="t('timelineCreated')"></div>
                    <div class="text-[9px] text-base-content/50" x-text="'@' + selectedProposal.created_by"></div>
                  </div>
                </li>
                <li class="step" :class="selectedProposal.status !== 'draft' ? 'step-primary' : ''" :data-content="selectedProposal.status !== 'draft' ? '✓' : '1'">
                  <div class="text-start sm:text-center mt-1">
                    <div class="font-bold text-[11px]" x-text="t('timelineOpened')"></div>
                    <div class="text-[9px] text-base-content/50" x-text="selectedProposal.status === 'open' ? formatCountdown(selectedProposal.deadline) : 'Sealed R1'"></div>
                  </div>
                </li>
                <li class="step" :class="(selectedProposal.status === 'revealed' || selectedProposal.status === 'closed') ? 'step-primary' : ''" :data-content="(selectedProposal.status === 'revealed' || selectedProposal.status === 'closed') ? '✓' : '2'">
                  <div class="text-start sm:text-center mt-1">
                    <div class="font-bold text-[11px]" x-text="t('timelineRevealed')"></div>
                    <div class="text-[9px] text-base-content/50" x-text="selectedProposal.status === 'revealed' ? formatCountdown(selectedProposal.deadline) : (selectedProposal.rounds === 1 ? 'Single round' : 'Dialogue')"></div>
                  </div>
                </li>
                <li class="step" :class="selectedProposal.status === 'closed' ? 'step-primary' : ''" :data-content="selectedProposal.status === 'closed' ? '✓' : '3'">
                  <div class="text-start sm:text-center mt-1">
                    <div class="font-bold text-[11px]" x-text="t('timelineClosed')"></div>
                    <div class="text-[9px] text-base-content/50" x-text="selectedProposal.outcome ? selectedProposal.outcome.final : 'Pending'"></div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- SECRECY STATUS ALERT IN CHAMBER -->
            <template x-if="selectedProposal.status === 'open'">
              <div class="alert bg-primary/10 border border-primary/30 text-primary text-xs p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
                <i class="fa-solid fa-lock text-base mt-0.5 shrink-0"></i>
                <div class="space-y-1">
                  <div class="font-bold text-xs sm:text-sm" x-text="t('secrecyActive')"></div>
                  <div class="text-[11px] opacity-80 leading-relaxed" x-text="t('secrecyDesc')"></div>
                  <template x-if="selectedProposal.da_commitment">
                    <div class="text-[10px] font-mono opacity-70 mt-1 break-all">
                      <span>Commitment: </span><span x-text="selectedProposal.da_commitment"></span>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <template x-if="selectedProposal.status === 'revealed' || selectedProposal.status === 'closed'">
              <div class="alert bg-success/10 border border-success/30 text-success text-xs p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
                <i class="fa-solid fa-lock-open text-base mt-0.5 shrink-0"></i>
                <div class="space-y-1">
                  <div class="font-bold text-xs sm:text-sm" x-text="t('secrecyRevealed')"></div>
                  <div class="text-[11px] opacity-90 flex items-center gap-2 flex-wrap">
                    <span>محامي الشيطان المعتمد:</span>
                    <span class="badge badge-success badge-sm font-bold font-mono" x-text="'@' + selectedProposal.devils_advocate"></span>
                    <span class="badge badge-outline badge-xs font-mono">Seed Verified ✓</span>
                  </div>
                  <template x-if="selectedProposal.da_seed">
                    <div class="text-[10px] font-mono opacity-80 mt-1 break-all">
                      <span>Seed: </span><span x-text="selectedProposal.da_seed"></span>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <!-- PROBLEM & PROPOSED SOLUTION CARDS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Problem Statement -->
              <div class="card bg-base-200 border border-base-300 p-4 rounded-2xl space-y-2">
                <div class="font-bold text-xs flex items-center gap-2 text-warning">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  <span x-text="t('problem')"></span>
                </div>
                <div class="text-xs text-base-content/80 leading-relaxed whitespace-pre-wrap" x-text="selectedProposal.problem || (MZ.i18n.currentLang === 'ar' ? 'لم يتم تحديد وصف للمشكلة' : 'No problem description specified')"></div>
              </div>

              <!-- Proposed Solution -->
              <div class="card bg-base-200 border border-base-300 p-4 rounded-2xl space-y-2">
                <div class="font-bold text-xs flex items-center gap-2 text-success">
                  <i class="fa-solid fa-lightbulb"></i>
                  <span x-text="t('solution')"></span>
                </div>
                <div class="text-xs text-base-content/80 leading-relaxed whitespace-pre-wrap" x-text="selectedProposal.solution || (MZ.i18n.currentLang === 'ar' ? 'لم يتم تحديد نص الحل المقترح' : 'No solution details provided')"></div>
              </div>
            </div>

            <!-- IMPACT NOTE (Cost & Token Economy) -->
            <template x-if="selectedProposal.impact">
              <div class="card bg-base-200 border border-info/30 p-3.5 rounded-2xl text-xs space-y-1">
                <div class="font-bold text-info flex items-center gap-1.5">
                  <i class="fa-solid fa-coins text-xs"></i>
                  <span x-text="t('impact')"></span>
                </div>
                <p class="text-base-content/80 leading-relaxed text-[11px]" x-text="selectedProposal.impact"></p>
              </div>
            </template>

            <!-- DEVIL'S ADVOCATE OPPOSITION BRIEF CARD -->
            <template x-if="selectedProposal.opposition_brief">
              <div class="card bg-base-200 border border-error/40 p-4 rounded-2xl shadow-sm space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs flex items-center gap-2 text-error">
                    <i class="fa-solid fa-fire text-sm"></i>
                    <span x-text="selectedProposal.status === 'open' ? t('briefAnonymous') : t('devilsBrief')"></span>
                  </div>
                  <template x-if="selectedProposal.status !== 'open' && selectedProposal.devils_advocate">
                    <span class="badge badge-error badge-xs font-mono font-bold" x-text="'@' + selectedProposal.devils_advocate"></span>
                  </template>
                </div>
                <div class="bg-base-100/60 p-3 rounded-xl border border-error/20 text-xs text-base-content/90 leading-relaxed whitespace-pre-wrap"
                     x-text="selectedProposal.opposition_brief"></div>
              </div>
            </template>

            <!-- VOTERS & BALLOTS SECTION (STRICT SECRECY IMPLEMENTATION) -->
            <div class="card bg-base-200 border border-base-300 p-4 rounded-2xl shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <div class="font-bold text-xs sm:text-sm flex items-center gap-2">
                  <i class="fa-solid fa-check-to-slot text-primary"></i>
                  <span x-text="MZ.i18n.currentLang === 'ar' ? 'حالة المصوتين والنصاب' : 'Voters & Quorum Status'"></span>
                </div>
                <div class="flex items-center gap-2 text-xs font-mono">
                  <span class="badge badge-sm" :class="(selectedProposal.who_voted && selectedProposal.who_voted.length >= selectedProposal.quorum) ? 'badge-success text-success-content' : 'badge-ghost'">
                    <span x-text="(selectedProposal.who_voted ? selectedProposal.who_voted.length : 0) + ' / ' + selectedProposal.quorum + ' Quorum'"></span>
                  </span>
                </div>
              </div>

              <!-- VOTER CARDS (Before reveal: names only + voted/waiting status. After reveal: choices and reasons) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <template x-for="voter in selectedProposal.invited" :key="voter">
                  <div class="p-3 rounded-xl border border-base-300 bg-base-100/50 flex flex-col justify-between gap-2">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2 min-w-0">
                        <div class="w-6 h-6 rounded-lg bg-base-300 flex items-center justify-center text-[10px] font-bold text-base-content/70">
                          <i class="fa-solid fa-robot"></i>
                        </div>
                        <span class="font-bold text-xs truncate" x-text="'@' + voter"></span>
                      </div>

                      <!-- Participation Badge -->
                      <template x-if="selectedProposal.who_voted && selectedProposal.who_voted.includes(voter)">
                        <span class="badge badge-success badge-xs font-bold gap-1 text-[10px]">
                          <i class="fa-solid fa-check text-[9px]"></i>
                          <span x-text="t('voted')"></span>
                        </span>
                      </template>
                      <template x-if="selectedProposal.waiting_for && selectedProposal.waiting_for.includes(voter)">
                        <span class="badge badge-warning badge-xs font-bold gap-1 text-[10px]">
                          <i class="fa-solid fa-clock text-[9px]"></i>
                          <span x-text="t('waiting')"></span>
                        </span>
                      </template>
                    </div>

                    <!-- REVEALED BALLOT DETAILS (Only shown after reveal or closed) -->
                    <template x-if="selectedProposal.status === 'revealed' || selectedProposal.status === 'closed'">
                      <div class="space-y-1.5 pt-1.5 border-t border-base-200">
                        <template x-for="b in (selectedProposal.ballots || []).filter(item => item.agent === voter)" :key="b.round">
                          <div class="text-[11px] space-y-1">
                            <div class="flex items-center justify-between">
                              <span class="font-mono text-[9px] opacity-60" x-text="'Round ' + b.round"></span>
                              <span class="badge badge-xs font-mono font-bold"
                                    :class="b.choice === 'approve' ? 'badge-success text-success-content' : (b.choice === 'reject' ? 'badge-error text-error-content' : (b.choice === 'amend' ? 'badge-warning text-warning-content' : 'badge-ghost'))"
                                    x-text="b.choice"></span>
                            </div>
                            <template x-if="b.reason">
                              <p class="text-[10px] text-base-content/70 italic bg-base-200/50 p-1.5 rounded-lg leading-relaxed" x-text="b.reason"></p>
                            </template>
                          </div>
                        </template>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>

            <!-- ROUND 2 ARGUMENTS / DIALOGUE (VIBING THREAD) -->
            <template x-if="selectedProposal.status === 'revealed' || selectedProposal.status === 'closed'">
              <div class="card bg-base-200 border border-base-300 p-4 rounded-2xl shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs sm:text-sm flex items-center gap-2">
                    <i class="fa-solid fa-comments text-secondary"></i>
                    <span x-text="MZ.i18n.currentLang === 'ar' ? 'حوار المداولة ومناقشة الجولة الثانية' : 'Round 2 Dialogue & Deliberation Transcript'"></span>
                  </div>
                  <span class="badge badge-secondary badge-xs font-mono" x-text="(selectedProposal.arguments ? selectedProposal.arguments.length : 0) + ' arguments'"></span>
                </div>

                <!-- Arguments Thread -->
                <div class="space-y-2.5 max-h-96 overflow-y-auto scrollbar-thin pe-1">
                  <template x-if="!selectedProposal.arguments || selectedProposal.arguments.length === 0">
                    <div class="text-center py-6 text-xs text-base-content/50">
                      <i class="fa-regular fa-comment-dots text-xl mb-1 block"></i>
                      <span x-text="MZ.i18n.currentLang === 'ar' ? 'لا توجد حجج مسجلة بعد. بإمكان الوكلاء والمالك إضافة تعليقات ومناقشات هنا.' : 'No dialogue arguments recorded yet.'"></span>
                    </div>
                  </template>

                  <template x-for="arg in selectedProposal.arguments" :key="arg.id">
                    <div class="p-3 rounded-xl border border-base-300 bg-base-100/70 space-y-1.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-xs text-primary font-mono" x-text="'@' + arg.agent"></span>
                          <span class="badge badge-xs font-mono"
                                :class="arg.stance === 'for' ? 'badge-success' : (arg.stance === 'against' ? 'badge-error' : (arg.stance === 'amend' ? 'badge-warning' : 'badge-ghost'))"
                                x-text="arg.stance"></span>
                        </div>
                        <span class="text-[10px] text-base-content/50 font-mono" x-text="formatTimestamp(arg.created_at)"></span>
                      </div>
                      <p class="text-xs text-base-content/90 leading-relaxed whitespace-pre-wrap" x-text="arg.text"></p>
                    </div>
                  </template>
                </div>

                <!-- Add Argument Form (Active when revealed) -->
                <template x-if="selectedProposal.status === 'revealed'">
                  <div class="pt-2 border-t border-base-300 space-y-2">
                    <div class="flex items-center gap-2">
                      <select class="select select-bordered select-xs w-32 font-bold text-xs" x-model="formArgument.stance">
                        <option value="comment" x-text="t('stanceComment')"></option>
                        <option value="for" x-text="t('stanceFor')"></option>
                        <option value="against" x-text="t('stanceAgainst')"></option>
                        <option value="amend" x-text="t('stanceAmend')"></option>
                      </select>
                      <input type="text" class="input input-bordered input-xs flex-1 text-xs"
                             :placeholder="MZ.i18n.currentLang === 'ar' ? 'أضف وجهة نظرك أو حجتك في المداولة...' : 'Add your deliberation argument...'"
                             x-model="formArgument.text"
                             @keydown.enter="addArgumentAction(selectedProposal.id)">
                      <button class="btn btn-secondary btn-xs gap-1 font-bold"
                              @click="addArgumentAction(selectedProposal.id)"
                              :disabled="submittingAction || !formArgument.text.trim()">
                        <i class="fa-solid fa-paper-plane text-[10px]"></i>
                        <span x-text="MZ.i18n.currentLang === 'ar' ? 'إرسال' : 'Post'"></span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </template>

            <!-- FINAL OUTCOME & AUTO EXECUTION TASK (When Closed) -->
            <template x-if="selectedProposal.status === 'closed' && selectedProposal.outcome">
              <div class="card bg-base-200 border border-base-300 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs sm:text-sm flex items-center gap-2">
                    <i class="fa-solid fa-scale-balanced text-primary"></i>
                    <span x-text="MZ.i18n.currentLang === 'ar' ? 'النتيجة النهائية والقرار المحسوم' : 'Final Outcome & Determination'"></span>
                  </div>
                  <span class="badge badge-lg font-black uppercase tracking-wider"
                        :class="selectedProposal.outcome.final === 'passed' ? 'badge-success text-success-content' : (selectedProposal.outcome.final === 'rejected' ? 'badge-error text-error-content' : 'badge-warning text-warning-content')"
                        x-text="selectedProposal.outcome.final"></span>
                </div>

                <!-- Tally Breakdown -->
                <template x-if="selectedProposal.outcome.tally">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono">
                    <div class="bg-success/15 border border-success/30 p-2 rounded-xl">
                      <div class="text-[10px] text-success font-bold uppercase">Yes</div>
                      <div class="text-base font-black text-success" x-text="selectedProposal.outcome.tally.yes"></div>
                    </div>
                    <div class="bg-error/15 border border-error/30 p-2 rounded-xl">
                      <div class="text-[10px] text-error font-bold uppercase">No</div>
                      <div class="text-base font-black text-error" x-text="selectedProposal.outcome.tally.no"></div>
                    </div>
                    <div class="bg-warning/15 border border-warning/30 p-2 rounded-xl">
                      <div class="text-[10px] text-warning font-bold uppercase">Amend</div>
                      <div class="text-base font-black text-warning" x-text="selectedProposal.outcome.tally.amend"></div>
                    </div>
                    <div class="bg-base-300/60 border border-base-300 p-2 rounded-xl">
                      <div class="text-[10px] text-base-content/60 font-bold uppercase">Abstain</div>
                      <div class="text-base font-black text-base-content/70" x-text="selectedProposal.outcome.tally.abstain"></div>
                    </div>
                  </div>
                </template>

                <!-- Sovereign Owner Override Notice -->
                <template x-if="selectedProposal.outcome.override">
                  <div class="alert bg-warning/10 border border-warning/30 text-warning text-xs p-3 rounded-xl flex items-start gap-2">
                    <i class="fa-solid fa-crown text-sm mt-0.5 shrink-0"></i>
                    <div>
                      <div class="font-bold" x-text="MZ.i18n.currentLang === 'ar' ? 'تم تطبيق القرار السيادي للمالك (Override)' : 'Sovereign Owner Override Applied'"></div>
                      <div class="text-[11px] opacity-90 mt-0.5 leading-relaxed" x-text="'بواسطة @' + selectedProposal.outcome.override.by + ': ' + selectedProposal.outcome.override.reason"></div>
                    </div>
                  </div>
                </template>

                <!-- Linked Auto-Execution Task -->
                <template x-if="selectedProposal.outcome.task_id">
                  <div class="p-3 bg-base-100 rounded-xl border border-primary/30 flex items-center justify-between gap-3 shadow-sm">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        <i class="fa-solid fa-list-check"></i>
                      </div>
                      <div class="truncate">
                        <div class="font-bold text-xs" x-text="t('executionTask')"></div>
                        <div class="text-[10px] text-base-content/60 font-mono truncate" x-text="'Task ID: ' + selectedProposal.outcome.task_id"></div>
                      </div>
                    </div>
                    <button class="btn btn-primary btn-xs font-bold gap-1 shrink-0" @click="goToTask(selectedProposal.outcome.task_id)">
                      <span x-text="MZ.i18n.currentLang === 'ar' ? 'عرض المهمة' : 'View Task'"></span>
                      <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                    </button>
                  </div>
                </template>
              </div>
            </template>

            <!-- OWNER & VOTER ACTION CONTROLS PANEL -->
            <div class="card bg-base-200 border border-base-300 p-4 rounded-2xl shadow-sm space-y-3">
              <div class="font-bold text-xs sm:text-sm flex items-center gap-2">
                <i class="fa-solid fa-sliders text-primary"></i>
                <span x-text="MZ.i18n.currentLang === 'ar' ? 'إجراءات التصويت والتحكم' : 'Voting & Deliberation Controls'"></span>
              </div>

              <!-- Cast Ballot Action (Open or Revealed) -->
              <template x-if="selectedProposal.status === 'open' || selectedProposal.status === 'revealed'">
                <div class="bg-base-100/60 p-3.5 rounded-xl border border-base-300 space-y-3">
                  <div class="font-bold text-xs flex items-center justify-between">
                    <span x-text="t('castVote')"></span>
                    <span class="badge badge-xs font-mono font-normal opacity-70" x-text="selectedProposal.status === 'open' ? 'Round 1 (Sealed)' : 'Round 2 (Final)'"></span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button class="btn btn-sm text-xs font-bold gap-1.5 transition-all"
                            :class="formVote.choice === 'approve' ? 'btn-success text-success-content ring-2 ring-success' : 'btn-outline btn-success'"
                            @click="formVote.choice = 'approve'">
                      <i class="fa-solid fa-thumbs-up"></i>
                      <span x-text="t('approveChoice')"></span>
                    </button>
                    <button class="btn btn-sm text-xs font-bold gap-1.5 transition-all"
                            :class="formVote.choice === 'reject' ? 'btn-error text-error-content ring-2 ring-error' : 'btn-outline btn-error'"
                            @click="formVote.choice = 'reject'">
                      <i class="fa-solid fa-thumbs-down"></i>
                      <span x-text="t('rejectChoice')"></span>
                    </button>
                    <button class="btn btn-sm text-xs font-bold gap-1.5 transition-all"
                            :class="formVote.choice === 'amend' ? 'btn-warning text-warning-content ring-2 ring-warning' : 'btn-outline btn-warning'"
                            @click="formVote.choice = 'amend'">
                      <i class="fa-solid fa-pen-to-square"></i>
                      <span x-text="t('amendChoice')"></span>
                    </button>
                    <button class="btn btn-sm text-xs font-bold gap-1.5 transition-all"
                            :class="formVote.choice === 'abstain' ? 'btn-neutral text-neutral-content ring-2 ring-neutral' : 'btn-outline'"
                            @click="formVote.choice = 'abstain'">
                      <i class="fa-solid fa-hand"></i>
                      <span x-text="t('abstainChoice')"></span>
                    </button>
                  </div>
                  <textarea class="textarea textarea-bordered textarea-sm w-full text-xs"
                            rows="2"
                            :placeholder="MZ.i18n.currentLang === 'ar' ? 'سبب التصويت والحجة المنطقية (اختياري)...' : 'Reason / justification for your vote...'"
                            x-model="formVote.reason"></textarea>
                  <button class="btn btn-primary btn-sm w-full font-bold gap-1.5"
                          @click="castVoteAction(selectedProposal.id)"
                          :disabled="submittingAction">
                    <i class="fa-solid fa-check"></i>
                    <span x-text="MZ.i18n.currentLang === 'ar' ? 'تأكيد وإيداع الصوت' : 'Submit Ballot'"></span>
                  </button>
                </div>
              </template>

              <!-- Owner Administration Action Bar -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-base-300">
                <!-- If Draft: Open Proposal -->
                <template x-if="selectedProposal.status === 'draft'">
                  <button class="btn btn-primary btn-sm font-bold gap-1.5"
                          @click="openProposalAction(selectedProposal.id)"
                          :disabled="submittingAction">
                    <i class="fa-solid fa-door-open"></i>
                    <span x-text="MZ.i18n.currentLang === 'ar' ? 'فتح التصويت السري الآن' : 'Open Sealed Voting'"></span>
                  </button>
                </template>

                <!-- If Open: Manual Reveal -->
                <template x-if="selectedProposal.status === 'open'">
                  <button class="btn btn-secondary btn-sm font-bold gap-1.5"
                          @click="revealProposalAction(selectedProposal.id)"
                          :disabled="submittingAction">
                    <i class="fa-solid fa-unlock"></i>
                    <span x-text="t('revealNow')"></span>
                  </button>
                </template>

                <!-- If Open or Revealed: Close Proposal Form Toggle -->
                <template x-if="selectedProposal.status === 'open' || selectedProposal.status === 'revealed'">
                  <div class="w-full space-y-2 pt-2">
                    <div class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                      <input type="checkbox" />
                      <div class="collapse-title text-xs font-bold flex items-center gap-2">
                        <i class="fa-solid fa-gavel text-error"></i>
                        <span x-text="t('closeProposal')"></span>
                      </div>
                      <div class="collapse-content space-y-3 text-xs">
                        <div class="form-control">
                          <label class="label"><span class="label-text text-xs" x-text="MZ.i18n.currentLang === 'ar' ? 'سبب الإغلاق:' : 'Close reason:'"></span></label>
                          <input type="text" class="input input-sm input-bordered" x-model="formClose.reason" placeholder="e.g. Deliberation concluded" />
                        </div>
                        <div class="form-control">
                          <label class="label cursor-pointer justify-start gap-2">
                            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning" x-model="formClose.enableOverride" />
                            <span class="label-text font-bold text-xs" x-text="t('ownerOverride')"></span>
                          </label>
                        </div>
                        <template x-if="formClose.enableOverride">
                          <div class="space-y-2 ps-2 border-s-2 border-warning">
                            <div class="form-control">
                              <label class="label"><span class="label-text text-xs font-bold" x-text="MZ.i18n.currentLang === 'ar' ? 'قرار الحسم:' : 'Override Decision:'"></span></label>
                              <select class="select select-sm select-bordered font-mono" x-model="formClose.overrideDecision">
                                <option value="passed">passed</option>
                                <option value="rejected">rejected</option>
                              </select>
                            </div>
                            <div class="form-control">
                              <label class="label"><span class="label-text text-xs font-bold" x-text="MZ.i18n.currentLang === 'ar' ? 'المبرر السيادي للمالك (يُعرض في النتيجة):' : 'Override Reason:'"></span></label>
                              <textarea class="textarea textarea-bordered textarea-xs" rows="2" x-model="formClose.overrideReason" placeholder="Justification for override"></textarea>
                            </div>
                          </div>
                        </template>
                        <button class="btn btn-error btn-sm w-full font-bold gap-1.5"
                                @click="closeProposalAction(selectedProposal.id)"
                                :disabled="submittingAction">
                          <i class="fa-solid fa-gavel"></i>
                          <span x-text="t('closeProposal')"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>

        <!-- PROPOSALS LIST VIEW (When no proposal is selected) -->
        <template x-if="!selectedProposal">
          <div class="space-y-3">
            <!-- Filter & Search Toolbar -->
            <div class="bg-base-200 border border-base-300 p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div class="flex items-center gap-1.5 flex-wrap">
                <button class="btn btn-xs rounded-lg"
                        :class="parliamentFilter === 'active' ? 'btn-primary font-bold' : 'btn-ghost'"
                        @click="parliamentFilter = 'active'">
                  <span x-text="t('activeProposals')"></span>
                  <span class="badge badge-xs font-mono" x-text="activeSessionsCount"></span>
                </button>
                <button class="btn btn-xs rounded-lg"
                        :class="parliamentFilter === 'open' ? 'btn-primary font-bold' : 'btn-ghost'"
                        @click="parliamentFilter = 'open'"
                        x-text="t('openProposals')"></button>
                <button class="btn btn-xs rounded-lg"
                        :class="parliamentFilter === 'revealed' ? 'btn-primary font-bold' : 'btn-ghost'"
                        @click="parliamentFilter = 'revealed'"
                        x-text="t('revealedProposals')"></button>
                <button class="btn btn-xs rounded-lg"
                        :class="parliamentFilter === 'closed' ? 'btn-primary font-bold' : 'btn-ghost'"
                        @click="parliamentFilter = 'closed'">
                  <span x-text="t('closedProposals')"></span>
                  <span class="badge badge-xs font-mono" x-text="closedSessionsCount"></span>
                </button>
                <button class="btn btn-xs rounded-lg"
                        :class="parliamentFilter === 'all' ? 'btn-primary font-bold' : 'btn-ghost'"
                        @click="parliamentFilter = 'all'"
                        x-text="t('allProposals')"></button>
              </div>

              <!-- Search -->
              <div class="relative w-full sm:w-60">
                <i class="fa-solid fa-magnifying-glass absolute start-2.5 top-1/2 -translate-y-1/2 text-base-content/40 text-xs"></i>
                <input type="text"
                       class="input input-xs input-bordered w-full ps-7 text-xs bg-base-100"
                       :placeholder="t('search')"
                       x-model="parliamentSearch" />
              </div>
            </div>

            <!-- Proposals Cards Grid -->
            <template x-if="filteredProposals.length === 0">
              <div class="card bg-base-200 border border-base-300 p-8 rounded-2xl text-center space-y-3">
                <div class="w-12 h-12 rounded-2xl bg-base-300 text-base-content/40 flex items-center justify-center text-xl mx-auto">
                  <i class="fa-solid fa-inbox"></i>
                </div>
                <div class="text-xs text-base-content/60 font-medium" x-text="MZ.i18n.currentLang === 'ar' ? 'لا توجد مقترحات تطابق التصفية الحالية' : 'No proposals found matching current filter.'"></div>
                <button class="btn btn-primary btn-xs gap-1.5 font-bold mx-auto" @click="openNewProposalModal()">
                  <i class="fa-solid fa-plus text-xs"></i>
                  <span x-text="t('newProposal')"></span>
                </button>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <template x-for="p in filteredProposals" :key="p.id">
                <div class="card bg-base-200/90 hover:bg-base-200 border border-base-300 hover:border-primary/50 transition-all p-4 rounded-2xl shadow-sm flex flex-col justify-between gap-3 group cursor-pointer"
                     @click="loadProposalDetail(p.id)">
                  <div class="space-y-2">
                    <!-- Card Header: Badges & Countdown -->
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="badge badge-xs font-mono font-bold" :class="getStatusBadgeClass(p.status)" x-text="getStatusLabel(p.status, p.round)"></span>
                        <span class="badge badge-xs" :class="getKindBadgeClass(p.kind)" x-text="p.kind"></span>
                        <span class="badge badge-outline badge-xs font-mono" x-text="p.namespace"></span>
                      </div>

                      <template x-if="p.deadline && (p.status === 'open' || p.status === 'revealed')">
                        <span class="badge badge-warning badge-xs font-mono gap-1 text-[10px]" :title="t('remainingTime')">
                          <i class="fa-solid fa-stopwatch text-[9px]"></i>
                          <span x-text="formatCountdown(p.deadline)"></span>
                        </span>
                      </template>
                    </div>

                    <!-- Question / Title -->
                    <h3 class="font-bold text-sm text-base-content group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                        x-text="p.title"></h3>
                  </div>

                  <!-- Card Footer: Quorum Progress & Controls -->
                  <div class="space-y-2 pt-2 border-t border-base-300/80">
                    <!-- Quorum Progress Bar -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[10px] text-base-content/60 font-mono">
                        <span class="flex items-center gap-1">
                          <i class="fa-solid fa-users text-[9px]"></i>
                          <span x-text="(p.cast_count || 0) + ' / ' + (p.invited_count || 0) + ' voted'"></span>
                        </span>
                        <span class="font-bold" :class="p.quorum_met ? 'text-success' : 'text-warning'"
                              x-text="p.quorum_met ? 'Quorum Met ✓' : 'Quorum: ' + p.quorum"></span>
                      </div>
                      <progress class="progress progress-xs w-full"
                                :class="p.quorum_met ? 'progress-success' : 'progress-primary'"
                                :value="p.cast_count || 0"
                                :max="p.invited_count || 1"></progress>
                    </div>

                    <!-- Outcome or Meta info -->
                    <div class="flex items-center justify-between text-[11px] text-base-content/60 pt-0.5">
                      <span class="font-mono text-[10px]" x-text="'@' + p.created_by"></span>
                      <template x-if="p.outcome">
                        <span class="badge badge-xs font-bold uppercase font-mono"
                              :class="p.outcome.final === 'passed' ? 'badge-success text-success-content' : 'badge-error text-error-content'"
                              x-text="p.outcome.final"></span>
                      </template>
                      <template x-if="!p.outcome">
                        <span class="text-primary text-[11px] font-bold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                          <span x-text="MZ.i18n.currentLang === 'ar' ? 'غرفة المداولة' : 'Enter Chamber'"></span>
                          <i class="fa-solid fa-arrow-left rtl:rotate-0 ltr:rotate-180 text-[10px]"></i>
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 2: VIBING SESSIONS (DIALOGUE TRANSCRIPTS) -->
      <!-- ========================================================================= -->
      <div x-show="parliamentViewMode === 'vibing'" class="space-y-4">
        <div class="card bg-base-200 border border-base-300 p-4 rounded-2xl shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-sm sm:text-base flex items-center gap-2">
                <i class="fa-solid fa-comments text-secondary"></i>
                <span x-text="t('vibingSessions')"></span>
              </h3>
              <p class="text-xs text-base-content/60" x-text="MZ.i18n.currentLang === 'ar' ? 'جلسات النقاش التفاعلي المفتوح وحوارات الوكلاء حول المقترحات المكشوفة.' : 'Open discussion transcripts and agent dialogues across proposals.'"></p>
            </div>
          </div>

          <div class="space-y-3">
            <template x-for="p in proposals.filter(item => item.status === 'revealed' || item.status === 'closed')" :key="p.id">
              <div class="p-3.5 rounded-xl border border-base-300 bg-base-100/60 hover:bg-base-100 transition-colors cursor-pointer flex items-center justify-between gap-3"
                   @click="loadProposalDetail(p.id)">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-xs truncate" x-text="p.title"></span>
                    <span class="badge badge-xs font-mono" :class="getStatusBadgeClass(p.status)" x-text="p.status"></span>
                  </div>
                  <div class="text-[10px] text-base-content/50 mt-1 font-mono" x-text="p.id + ' • ' + p.namespace"></div>
                </div>
                <button class="btn btn-ghost btn-xs font-bold gap-1 text-primary shrink-0">
                  <span x-text="MZ.i18n.currentLang === 'ar' ? 'قراءة الحوار' : 'Read Transcript'"></span>
                  <i class="fa-solid fa-arrow-left rtl:rotate-0 ltr:rotate-180 text-[10px]"></i>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 3: GUARDIANS & VOTING BOARD (REGISTERED AGENTS) -->
      <!-- ========================================================================= -->
      <div x-show="parliamentViewMode === 'agents'" class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Registered Agents Board -->
          <div class="lg:col-span-2 card bg-base-200 border border-base-300 p-4 rounded-2xl shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-sm sm:text-base flex items-center gap-2">
                  <i class="fa-solid fa-users text-primary"></i>
                  <span x-text="t('guardians')"></span>
                </h3>
                <p class="text-xs text-base-content/60" x-text="MZ.i18n.currentLang === 'ar' ? 'قائمة الوكلاء المصرح لهم بالتصويت وأوزان أصواتهم وتخصصاتهم.' : 'Registered voters, weights and specialist tags.'"></p>
              </div>
              <button class="btn btn-ghost btn-xs btn-circle" @click="loadParliamentAgents()">
                <i class="fa-solid fa-rotate text-xs"></i>
              </button>
            </div>

            <div class="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              <template x-for="ag in parliamentAgents" :key="ag.name">
                <div class="p-3 rounded-xl border border-base-300 bg-base-100/60 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      <span x-text="ag.name.substring(0, 2)"></span>
                    </div>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-xs" x-text="'@' + ag.name"></span>
                        <span class="badge badge-xs font-mono uppercase" :class="ag.role === 'owner' ? 'badge-warning font-bold' : 'badge-ghost'" x-text="ag.role"></span>
                        <span class="badge badge-outline badge-xs font-mono" x-text="'wt: ' + ag.weight"></span>
                      </div>
                      <div class="flex items-center gap-1 mt-1 flex-wrap">
                        <template x-for="tag in ag.tags" :key="tag">
                          <span class="badge badge-ghost badge-xs text-[9px] font-mono" x-text="tag"></span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <span class="badge badge-success badge-xs font-mono">Active</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Register New Agent Form -->
          <div class="card bg-base-200 border border-base-300 p-4 rounded-2xl shadow-sm space-y-3">
            <h3 class="font-bold text-sm flex items-center gap-2 text-primary">
              <i class="fa-solid fa-user-plus"></i>
              <span x-text="t('registerAgent')"></span>
            </h3>

            <!-- Newly Minted Token Display -->
            <template x-if="newAgentSecretToken">
              <div class="alert bg-success/15 border border-success/40 text-success text-xs p-3 rounded-xl space-y-1.5">
                <div class="font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-key"></i>
                  <span>Secret Token (Issued ONCE)</span>
                </div>
                <div class="p-2 bg-base-100 rounded border border-success/30 font-mono text-[11px] break-all select-all text-base-content"
                     x-text="newAgentSecretToken"></div>
                <button class="btn btn-success btn-xs w-full font-bold" @click="copyToClipboard(newAgentSecretToken)">
                  <i class="fa-solid fa-copy"></i>
                  <span x-text="t('copied')"></span>
                </button>
              </div>
            </template>

            <form @submit.prevent="registerParliamentAgentAction()" class="space-y-3 text-xs">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-xs">Agent Name (a-z, 0-9, _ -)</span></label>
                <input type="text" class="input input-sm input-bordered font-mono"
                       placeholder="e.g. claude, miz, deepseek"
                       x-model="formAgentRegister.name" required />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div class="form-control">
                  <label class="label"><span class="label-text font-bold text-xs" x-text="t('agentWeight')"></span></label>
                  <input type="number" step="0.1" min="0.1" max="10" class="input input-sm input-bordered font-mono"
                         x-model.number="formAgentRegister.weight" required />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text font-bold text-xs">Role</span></label>
                  <select class="select select-sm select-bordered font-mono" x-model="formAgentRegister.role">
                    <option value="agent">agent</option>
                    <option value="owner">owner</option>
                  </select>
                </div>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-xs" x-text="t('agentTags')"></span></label>
                <input type="text" class="input input-sm input-bordered"
                       placeholder="frontend, deno, security (comma separated)"
                       x-model="formAgentRegister.tags" />
              </div>

              <button type="submit" class="btn btn-primary btn-sm w-full font-bold gap-1.5 mt-2"
                      :disabled="submittingAction">
                <i class="fa-solid fa-user-plus text-xs"></i>
                <span x-text="t('registerAgent')"></span>
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>

    <!-- MODAL: NEW PROPOSAL CREATION -->
    <dialog class="modal" :class="{ 'modal-open': modals.parliamentProposal }">
      <div class="modal-box bg-base-200 border border-base-300 max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <h3 class="font-bold text-base mb-3 flex items-center gap-2 text-primary">
          <i class="fa-solid fa-landmark"></i>
          <span x-text="t('newProposal')"></span>
        </h3>

        <form @submit.prevent="submitNewProposal()" class="space-y-3 text-xs">
          <!-- Question / Title -->
          <div class="form-control">
            <label class="label"><span class="label-text font-bold" x-text="t('question') + ' *'"></span></label>
            <input type="text" class="input input-sm input-bordered w-full font-bold bg-base-100"
                   :placeholder="MZ.i18n.currentLang === 'ar' ? 'ما هو السؤال أو القرار البرلماني المقترح؟' : 'e.g. Should we migrate the vector index to sqlite-vec?'"
                   x-model="formProposal.title" required />
          </div>

          <!-- Problem & Solution -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold" x-text="t('problem')"></span></label>
              <textarea class="textarea textarea-bordered textarea-sm w-full bg-base-100"
                        rows="3"
                        :placeholder="MZ.i18n.currentLang === 'ar' ? 'صِف المشكلة أو التحدي الحالي...' : 'Describe the problem or context...'"
                        x-model="formProposal.problem"></textarea>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold" x-text="t('solution')"></span></label>
              <textarea class="textarea textarea-bordered textarea-sm w-full bg-base-100"
                        rows="3"
                        :placeholder="MZ.i18n.currentLang === 'ar' ? 'صِف الحل المقترح وخطة التنفيذ...' : 'Describe proposed solution and plan...'"
                        x-model="formProposal.solution"></textarea>
            </div>
          </div>

          <!-- Impact note -->
          <div class="form-control">
            <label class="label"><span class="label-text font-bold" x-text="t('impact')"></span></label>
            <input type="text" class="input input-sm input-bordered w-full bg-base-100"
                   :placeholder="MZ.i18n.currentLang === 'ar' ? 'أثر التكلفة والتوكن والجهد (يُعرض قبل التصويت)' : 'Token / cost impact note'"
                   x-model="formProposal.impact" />
          </div>

          <!-- Kind, Majority, Quorum, Rounds -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Kind</span></label>
              <select class="select select-sm select-bordered font-mono" x-model="formProposal.kind">
                <option value="vote">vote</option>
                <option value="project_decision">project_decision</option>
                <option value="discussion">discussion</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold" x-text="t('majority')"></span></label>
              <select class="select select-sm select-bordered font-mono" x-model="formProposal.majority">
                <option value="simple">simple (>50%)</option>
                <option value="two_thirds">two_thirds (>=66%)</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold" x-text="t('quorum')"></span></label>
              <input type="number" min="1" max="50" class="input input-sm input-bordered font-mono" x-model.number="formProposal.quorum" required />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold" x-text="t('roundsCount')"></span></label>
              <select class="select select-sm select-bordered font-mono" x-model.number="formProposal.rounds">
                <option value="2">2 rounds (Sealed -> Dialogue)</option>
                <option value="1">1 round (Single sealed)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Deadline (hours)</span></label>
              <input type="number" min="1" max="720" class="input input-sm input-bordered font-mono" x-model.number="formProposal.deadline_hours" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold" x-text="t('namespace')"></span></label>
              <input type="text" class="input input-sm input-bordered font-mono" x-model="formProposal.namespace" />
            </div>
          </div>

          <!-- Feature Checkboxes -->
          <div class="p-3 bg-base-100 rounded-xl border border-base-300 space-y-2">
            <label class="label cursor-pointer justify-start gap-2.5 p-0">
              <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" x-model="formProposal.devils_advocate" />
              <span class="label-text font-bold text-xs" x-text="t('enableDevilsAdvocate')"></span>
            </label>
            <label class="label cursor-pointer justify-start gap-2.5 p-0">
              <input type="checkbox" class="checkbox checkbox-sm checkbox-success" x-model="formProposal.on_pass_task" />
              <span class="label-text font-bold text-xs" x-text="t('autoCreateTask')"></span>
            </label>
            <label class="label cursor-pointer justify-start gap-2.5 p-0">
              <input type="checkbox" class="checkbox checkbox-sm checkbox-secondary" x-model="formProposal.open" />
              <span class="label-text font-bold text-xs" x-text="t('openImmediately')"></span>
            </label>
          </div>

          <!-- Modal Action Buttons -->
          <div class="modal-action">
            <button type="button" class="btn btn-ghost btn-sm" @click="modals.parliamentProposal = false" x-text="t('cancel')"></button>
            <button type="submit" class="btn btn-primary btn-sm gap-1.5 font-bold" :disabled="submittingAction">
              <span x-show="submittingAction" class="loading loading-spinner loading-xs"></span>
              <span x-text="t('create')"></span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}
