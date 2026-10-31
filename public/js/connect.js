// MemoryZ Dashboard - Connect & MCP Module
window.MZ = window.MZ || {};

MZ.connect = {
  getDirectMcpUrl() {
    const origin = window.location.origin;
    const key = this.currentUser?.api_key || 'YOUR_TOKEN';
    return origin + '/mcp?token=' + key;
  },

  getOpenApiUrl() {
    const origin = window.location.origin;
    const key = this.currentUser?.api_key || 'YOUR_TOKEN';
    return origin + '/openapi.json?token=' + key;
  },

  copyDirectMcpUrl() {
    this.copyText(this.getDirectMcpUrl());
    const msg = MZ.i18n.currentLang === 'ar' ? 'تم نسخ رابط MCP المباشر ⚡' : 'Direct MCP URL copied ⚡';
    this.showToast(msg);
  },

  copySkillUrl() {
    const origin = window.location.origin;
    this.copyText(origin + '/skill.md');
    const msg = MZ.i18n.currentLang === 'ar' ? 'تم نسخ رابط ملف skill.md المباشر للوكلاء 📜' : 'Skill.md URL copied 📜';
    this.showToast(msg);
  }
};
