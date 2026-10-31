// MemoryZ Dashboard - Cloudflare R2 Storage Module
window.MZ = window.MZ || {};

MZ.r2 = {
  r2Files: [],
  r2FilesCount: 0,
  r2Buckets: [{ name: 'memoryz' }, { name: 'vibenote' }],
  selectedR2Bucket: 'memoryz',
  r2PrefixFilter: '',
  loadingR2: false,
  uploadingR2: false,
  formR2Upload: { mode: 'file', key: '', bucket: 'memoryz', file: null, textContent: '' },

  async loadR2Buckets() {
    try {
      const res = await fetch('/api/r2/buckets', {
        headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
      });
      if (res.ok) {
        const d = await res.json();
        if (d.buckets && d.buckets.length > 0) {
          this.r2Buckets = d.buckets;
        }
      }
    } catch (_e) {}
  },

  async loadR2Files() {
    this.loadingR2 = true;
    try {
      const params = new URLSearchParams();
      if (this.selectedR2Bucket) params.set('bucket', this.selectedR2Bucket);
      if (this.r2PrefixFilter) params.set('prefix', this.r2PrefixFilter.trim());
      if (this.currentNamespace !== 'all' && this.currentNamespace !== 'default' && !this.r2PrefixFilter) {
        params.set('namespace', this.currentNamespace);
      }
      const res = await fetch('/api/r2/objects?' + params.toString(), {
        headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
      });
      if (res.ok) {
        const d = await res.json();
        this.r2Files = d.objects || [];
        this.r2FilesCount = this.r2Files.length;
      }
    } catch (_e) {}
    this.loadingR2 = false;
  },

  openR2UploadModal() {
    this.formR2Upload = {
      mode: 'file',
      key: this.currentNamespace !== 'all' && this.currentNamespace !== 'default' ? this.currentNamespace + '/' : '',
      bucket: this.selectedR2Bucket || 'memoryz',
      file: null,
      textContent: '',
    };
    this.modals.r2Upload = true;
  },

  handleR2FileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.formR2Upload.file = file;
      if (!this.formR2Upload.key || this.formR2Upload.key.endsWith('/')) {
        const prefix = this.formR2Upload.key || '';
        this.formR2Upload.key = prefix + file.name;
      }
    }
  },

  async submitR2Upload() {
    if (!this.formR2Upload.key.trim()) {
      alert(MZ.i18n.currentLang === 'ar' ? 'يرجى كتابة مسار/اسم الملف' : 'Please provide a file name or path');
      return;
    }
    this.uploadingR2 = true;
    try {
      let res;
      if (this.formR2Upload.mode === 'file') {
        if (!this.formR2Upload.file) {
          alert(MZ.i18n.currentLang === 'ar' ? 'يرجى اختيار ملف' : 'Please select a file');
          this.uploadingR2 = false;
          return;
        }
        const formData = new FormData();
        formData.append('file', this.formR2Upload.file);
        formData.append('key', this.formR2Upload.key);
        formData.append('bucket', this.formR2Upload.bucket);
        if (this.currentNamespace !== 'all') {
          formData.append('namespace', this.currentNamespace);
        }

        res = await fetch('/api/r2/upload', {
          method: 'POST',
          headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {},
          body: formData,
        });
      } else {
        res = await fetch('/api/r2/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}),
          },
          body: JSON.stringify({
            key: this.formR2Upload.key,
            bucket: this.formR2Upload.bucket,
            content: this.formR2Upload.textContent,
            namespace: this.currentNamespace !== 'all' ? this.currentNamespace : undefined,
          }),
        });
      }

      if (res.ok) {
        this.modals.r2Upload = false;
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم رفع الملف إلى Cloudflare R2 بنجاح ☁️' : 'File uploaded to R2 successfully ☁️');
        await this.loadR2Files();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to upload file');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      this.uploadingR2 = false;
    }
  },

  async deleteR2File(key) {
    const confirmMsg = MZ.i18n.currentLang === 'ar'
      ? 'هل تريد بالتأكيد حذف الملف ' + key + ' من Cloudflare R2؟'
      : 'Are you sure you want to delete file ' + key + ' from R2?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch('/api/r2/objects/' + encodeURIComponent(key) + '?bucket=' + encodeURIComponent(this.selectedR2Bucket), {
        method: 'DELETE',
        headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
      });
      if (res.ok) {
        this.showToast(MZ.i18n.currentLang === 'ar' ? 'تم حذف الملف من R2 بنجاح 🗑️' : 'File deleted from R2 🗑️');
        await this.loadR2Files();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete file');
      }
    } catch (err) {
      alert(err.message);
    }
  }
};
