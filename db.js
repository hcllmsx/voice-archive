/*
 * db.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * IndexedDB 原生封装（不引入 idb 之类的库）。
 *
 * 库结构：
 *   projects  { id, nickname, speakerId, ageGroup, language,
 *               createdAt, updatedAt, exportCount, targetPath }
 *   clips     { id, projectId, taskId, taskLabel, group, text,
 *               blob, duration, rate, ref, ts, file }
 *             index: projectId / ts
 *   meta      { key, value }        —— 应用级配置（安装提示、持久化状态等）
 */
window.DB = (function () {
  'use strict';

  const DB_NAME = 'voice-archive';
  const DB_VERSION = 1;
  let dbPromise = null;

  /** 打开（或新建）数据库 */
  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        const db = req.result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('clips')) {
          const s = db.createObjectStore('clips', { keyPath: 'id' });
          s.createIndex('projectId', 'projectId', { unique: false });
          s.createIndex('ts', 'ts', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  /** 把一次事务包成 Promise，并等待其完整结束 */
  function tx(storeNames, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        const t = db.transaction(storeNames, mode);
        const stores = Array.isArray(storeNames)
          ? storeNames.map(function (n) { return t.objectStore(n); })
          : t.objectStore(storeNames);
        let result;
        try {
          result = fn(stores, t);
        } catch (err) {
          reject(err);
          return;
        }
        t.oncomplete = function () { resolve(result && result.__req ? result.__req.result : result); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  /** 取 request 的结果（在事务完成后读取） */
  function req(r) { return { __req: r }; }

  const api = {
    /* ---------------- 项目 ---------------- */

    createProject: function (p) {
      const now = Date.now();
      const project = {
        id: p.id || ('p_' + now + '_' + Math.random().toString(36).slice(2, 8)),
        nickname: p.nickname,
        speakerId: p.speakerId,
        ageGroup: p.ageGroup,
        language: p.language,
        dialect: p.dialect || '',
        purpose: p.purpose || 'train',
        targetPath: p.targetPath || '',
        createdAt: now,
        updatedAt: now,
        exportCount: 0,
        lastExportAt: 0,
        lastBackupCount: 0
      };
      return tx('projects', 'readwrite', function (s) {
        s.put(project);
      }).then(function () { return project; });
    },

    listProjects: function () {
      return tx('projects', 'readonly', function (s) {
        return req(s.getAll());
      }).then(function (list) {
        return (list || []).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
      });
    },

    getProject: function (id) {
      return tx('projects', 'readonly', function (s) {
        return req(s.get(id));
      });
    },

    updateProject: function (id, patch) {
      return tx('projects', 'readwrite', function (s) {
        return req(s.get(id));
      }).then(function (p) {
        if (!p) return null;
        Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
        p.updatedAt = Date.now();
        return tx('projects', 'readwrite', function (s) { s.put(p); })
          .then(function () { return p; });
      });
    },

    deleteProject: function (id) {
      return tx(['projects', 'clips'], 'readwrite', function (stores) {
        const projects = stores[0];
        const clips = stores[1];
        projects.delete(id);
        // 逐条删除该项目下的所有片段
        const idx = clips.index('projectId').openKeyCursor(IDBKeyRange.only(id));
        idx.onsuccess = function () {
          const cur = idx.result;
          if (!cur) return;
          clips.delete(cur.primaryKey);
          cur.continue();
        };
      });
    },

    /* ---------------- 片段 ---------------- */

    addClip: function (clip) {
      const c = {
        id: clip.id || ('c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
        projectId: clip.projectId,
        taskId: clip.taskId || '',
        taskLabel: clip.taskLabel || '',
        group: clip.group || 'must',
        index: typeof clip.index === 'number' ? clip.index : 0,
        text: clip.text || '',
        blob: clip.blob,
        duration: clip.duration || 0,
        rate: clip.rate || 32000,
        ref: !!clip.ref,
        source: clip.source || 'record',
        file: clip.file || '',
        ts: clip.ts || Date.now()
      };
      return tx('clips', 'readwrite', function (s) {
        s.put(c);
      }).then(function () { return c; });
    },

    putClips: function (clips) {
      return tx('clips', 'readwrite', function (s) {
        clips.forEach(function (c) { s.put(c); });
      });
    },

    getClips: function (projectId) {
      return tx('clips', 'readonly', function (s) {
        return req(s.index('projectId').getAll(IDBKeyRange.only(projectId)));
      }).then(function (list) {
        return (list || []).sort(function (a, b) { return a.ts - b.ts; });
      });
    },

    getClip: function (id) {
      return tx('clips', 'readonly', function (s) {
        return req(s.get(id));
      });
    },

    updateClip: function (id, patch) {
      return tx('clips', 'readonly', function (s) {
        return req(s.get(id));
      }).then(function (c) {
        if (!c) return null;
        Object.keys(patch).forEach(function (k) { c[k] = patch[k]; });
        return tx('clips', 'readwrite', function (s) { s.put(c); })
          .then(function () { return c; });
      });
    },

    deleteClip: function (id) {
      return tx('clips', 'readwrite', function (s) {
        s.delete(id);
      });
    },

    countClips: function (projectId) {
      return tx('clips', 'readonly', function (s) {
        return req(s.index('projectId').count(IDBKeyRange.only(projectId)));
      });
    },

    /* ---------------- 元信息 ---------------- */

    getMeta: function (key, fallback) {
      return tx('meta', 'readonly', function (s) {
        return req(s.get(key));
      }).then(function (r) { return r ? r.value : fallback; });
    },

    setMeta: function (key, value) {
      return tx('meta', 'readwrite', function (s) {
        s.put({ key: key, value: value });
      });
    },

    /* ---------------- 全局 ---------------- */

    /** 一键清空所有数据 */
    clearAll: function () {
      return tx(['projects', 'clips', 'meta'], 'readwrite', function (stores) {
        stores[0].clear();
        stores[1].clear();
        stores[2].clear();
      });
    },

    /** 估算占用空间（不支持的浏览器返回 null） */
    estimate: function () {
      if (!navigator.storage || !navigator.storage.estimate) return Promise.resolve(null);
      return navigator.storage.estimate();
    }
  };

  return api;
})();
