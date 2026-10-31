// MemoryZ Dashboard - Tasks Module
window.MZ = window.MZ || {};

MZ.tasks = {
  tasks: [],
  taskTree: [],
  tasksCount: 0,
  taskAsciiPreview: '',
  taskStatusFilter: '',
  loadingTasks: false,
  formTask: { parent_id: '', title: '', status: 'todo', priority: 'medium', assignee: '', description: '', namespace: 'vibzcode' },

  async loadTasks() {
    this.loadingTasks = true;
    try {
      const nsParam = this.currentNamespace !== 'all' ? '&namespace=' + encodeURIComponent(this.currentNamespace) : '';
      const url = '/api/tasks?format=tree' + (this.taskStatusFilter ? '&status=' + this.taskStatusFilter : '') + nsParam;
      const headers = this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {};
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        this.taskTree = data.tree || [];
        this.taskAsciiPreview = data.ascii || '';
        
        const flatRes = await fetch('/api/tasks' + (nsParam ? '?' + nsParam.slice(1) : ''), { headers });
        const flatData = await flatRes.json();
        this.tasks = flatData.tasks || [];
        this.tasksCount = this.tasks.filter(t => !this.isTaskDone(t.status)).length;
      }
    } catch (_e) {}
    this.loadingTasks = false;
  },

  isTaskDone(status) {
    return status && (status.toLowerCase() === 'done' || status.toLowerCase() === 'completed');
  },

  getTaskBadgeClass(status) {
    if (this.isTaskDone(status)) return 'badge-success text-success-content';
    if (status === 'in_progress') return 'badge-info text-info-content';
    if (status === 'blocked') return 'badge-error text-error-content';
    return 'badge-ghost';
  },

  openTaskModal(parentId = '') {
    this.formTask = {
      parent_id: parentId,
      title: '',
      status: 'todo',
      priority: 'medium',
      assignee: '',
      description: '',
      namespace: this.currentNamespace !== 'all' ? this.currentNamespace : 'vibzcode'
    };
    this.modals.task = true;
  },

  async saveTask() {
    if (!this.authToken) return this.openAuthModal();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify(this.formTask)
      });
      if (res.ok) {
        this.modals.task = false;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تمت إضافة المهمة بنجاح 📋' : 'Task added successfully 📋');
        this.loadTasks();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save task');
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async toggleTaskStatus(task) {
    const next = this.isTaskDone(task.status) ? 'todo' : 'done';
    try {
      const res = await fetch('/api/tasks/' + task.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.authToken
        },
        body: JSON.stringify({ status: next })
      });
      if (res.ok) {
        const msg = next === 'done'
          ? (MZ.i18n.currentLang === 'ar' ? 'أحسنت! تم إكمال المهمة ✓' : 'Task marked as completed ✓')
          : (MZ.i18n.currentLang === 'ar' ? 'تمت إعادة فتح المهمة ⏳' : 'Task reopened ⏳');
        this.showToast(msg);
        this.loadTasks();
      }
    } catch (err) {
      console.error(err);
    }
  },

  async deleteTask(id) {
    const confirmMsg = MZ.i18n.currentLang === 'ar' ? 'هل تريد حذف هذه المهمة وفروعها؟' : 'Are you sure you want to delete this task and its subtasks?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch('/api/tasks/' + id + '?cascade=true', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + this.authToken }
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حذف المهمة' : 'Task deleted');
        this.loadTasks();
      }
    } catch (err) {
      alert(err.message);
    }
  },

  async releaseTaskLock(taskId, lockedBy) {
    try {
      const res = await fetch('/api/tasks/' + taskId + '/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {})
        },
        body: JSON.stringify({ agent_id: lockedBy || 'admin' })
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم فك قفل المهمة بنجاح 🔓' : 'Task lock released successfully 🔓');
        this.loadTasks();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to release task lock');
      }
    } catch (err) {
      alert(err.message);
    }
  }
};
