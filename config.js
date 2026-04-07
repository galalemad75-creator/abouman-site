const API = '/api/data';

const DB = {
  _cache: null, _source: 'none',

  async init() {
    try {
      const res = await fetch(API + '?action=read&t=' + Date.now());
      if (!res.ok) throw new Error('API read failed');
      const data = await res.json();
      if (data.chapters && data.chapters.length > 0) {
        this._cache = { chapters: data.chapters, nextId: data.settings?.nextId || { chapter: 11, song: 1 }, admin: data.settings?.admin || { email: '', password: '' } };
        this._source = data.source || 'api';
      } else {
        this._cache = { chapters: [], nextId: { chapter: 11, song: 1 }, admin: { email: '', password: '' } };
      }
    } catch (e) {
      this._cache = { chapters: [], nextId: { chapter: 11, song: 1 }, admin: {} };
    }
    localStorage.setItem('ab_cache', JSON.stringify(this._cache));
    return this._cache;
  },

  getData() { return this._cache || { chapters: [], nextId: { chapter: 11, song: 1 }, admin: {} }; },

  async save() {
    const data = this._cache;
    localStorage.setItem('ab_cache', JSON.stringify(data));
    try {
      await fetch(API + '?action=save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: data.chapters, settings: { nextId: data.nextId, admin: data.admin } }),
      });
    } catch (e) {}
  },

  getChapters() { return this.getData().chapters; },
  addChapter(name, icon) { const d = this._cache; const ch = { id: d.nextId.chapter++, name, icon, songs: [] }; d.chapters.push(ch); this.save(); return ch; },
  updateChapter(id, u) { const ch = this._cache.chapters.find(c => c.id === id); if (ch) { Object.assign(ch, u); this.save(); } return ch; },
  deleteChapter(id) { this._cache.chapters = this._cache.chapters.filter(c => c.id !== id); this.save(); },

  addSong(chId, title, fileUrl, fileId, imageUrl) {
    const ch = this._cache.chapters.find(c => c.id === chId);
    if (!ch) return null;
    const song = { id: this._cache.nextId.song++, title, audio: fileUrl, image: imageUrl || '', file_path: fileId, created: new Date().toISOString() };
    if (!ch.songs) ch.songs = [];
    ch.songs.push(song); this.save(); return song;
  },
  deleteSong(chId, sId) { const ch = this._cache.chapters.find(c => c.id === chId); if (ch) { ch.songs = (ch.songs || []).filter(s => s.id !== sId); this.save(); } },

  async uploadFile(file, folder, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          if (onProgress) onProgress(50);
          const base64 = reader.result.split(',')[1];
          const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const res = await fetch(API + '?action=upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, content: base64, folder: folder || 'audio' }) });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Upload failed'); }
          const result = await res.json();
          if (onProgress) onProgress(100);
          resolve({ url: result.url, path: result.path, sha: result.sha });
        } catch (e) { reject(e); }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  },

  login(email, password) {
    const e = String(email || '').trim().toLowerCase();
    const p = String(password || '').trim();
    const admin = this._cache?.admin;
    if (admin && e === String(admin.email || '').trim().toLowerCase() && p === String(admin.password || '').trim()) return true;
    return false;
  },
  async resetPassword(newPass, newEmail) {
    this._cache = this._cache || {};
    this._cache.admin = { email: newEmail || 'admin@abouman.com', password: newPass };
    await this.save(); return { ok: true };
  },
  isLoggedIn() { return !!localStorage.getItem('ab_admin'); },
  setSession(email) { localStorage.setItem('ab_admin', JSON.stringify({ email, ts: Date.now() })); },
  logout() { localStorage.removeItem('ab_admin'); },
};
