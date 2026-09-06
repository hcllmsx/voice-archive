/*
 * app.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 主逻辑：路由、录音流程、素材管理、导出导入、备份提醒、游戏化。
 * 无框架、无构建工具，直接操作 DOM。
 *
 * 界面文案统一走 I18N.T(key, vars)；引导内容语言由 content.js 的
 * 数据函数按（项目语言 / 界面语言）分别解析。
 */
(function () {
  'use strict';

  const C = window.Content;
  const DB = window.DB;
  const ZIP = window.ZIP;
  const VR = window.VoiceRecorder;
  const I18N = window.I18N;
  const T = I18N.T;

  /* ================================================================== */
  /* 全局状态                                                            */
  /* ================================================================== */
  const state = {
    view: 'home',
    projects: [],
    project: null,
    clips: [],
    tasks: [],
    cursor: 0,
    recording: false,
    recCountdown: 2,      // 录音前倒计时（秒），设置页可改，0=点了就开始
    targetPath: '',       // 电脑目标路径（全局设置；导出训练包时写入 dataset.list）
    countdown: 0,         // 当前倒计时剩余秒数，>0 表示正在倒计时
    cdTimer: 0,           // 倒计时的 setInterval 句柄
    pending: null,        // { task, blob, url, duration, text }
    recorder: null,
    player: null,
    playingId: null,
    persisted: false,
    standalone: false,
    openCount: 0,
    installDismissed: false,
    envDismissed: false,
    privacyDismissed: false,
    backupMuted: false,
    sinceBackup: 0,
    raf: 0,
    lastZip: null,
    showTaskList: false,
    showResume: false,
    /* 「看看怎么说」示例开关：用户打开后跨句保持，直到再次点击关闭 */
    showIdeas: false,
    editingProjectId: null,
    _dlFn: null
  };

  const viewEl = function () { return document.getElementById('view'); };
  const modalEl = function () { return document.getElementById('modal'); };
  const toastEl = function () { return document.getElementById('toast'); };

  /* ================================================================== */
  /* 小工具                                                             */
  /* ================================================================== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDuration(sec) {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function fmtTotal(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (I18N.getUiLang() === 'en') {
      if (m <= 0) return s + 's';
      return m + 'm ' + (s < 10 ? '0' : '') + s + 's';
    }
    if (m <= 0) return s + ' 秒';
    return m + ' 分 ' + (s < 10 ? '0' : '') + s + ' 秒';
  }

  function pad(n, len) {
    let s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }

  function dateStamp(d) {
    d = d || new Date();
    return '' + d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2);
  }

  /** 引导内容语言：跟随当前项目的主要语言 */
  function guideLangOf(p) {
    return I18N.guideLang(p ? p.language : 'zh');
  }

  function buildProjectTasks(p) {
    return C.buildTasks(p.ageGroup, p.language || 'zh', p.dialect, guideLangOf(p), I18N.getUiLang());
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = toastEl();
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function closeModal() {
    const m = modalEl();
    m.hidden = true;
    m.innerHTML = '';
  }

  function openModal(html) {
    const m = modalEl();
    m.innerHTML = '<div class="modal-mask" data-act="modal-close"></div>' +
      '<div class="modal-body">' + html + '</div>';
    m.hidden = false;
  }

  let pendingConfirm = null;
  function confirmModal(title, bodyHTML, okText) {
    return new Promise(function (resolve) {
      openModal(
        '<h3 class="modal-title">' + esc(title) + '</h3>' +
        '<p class="modal-text">' + bodyHTML + '</p>' +
        '<div class="modal-actions">' +
        '<button class="btn ghost" data-act="modal-no">' + esc(T('modalCancel')) + '</button>' +
        '<button class="btn danger" data-act="modal-yes">' + esc(okText) + '</button>' +
        '</div>'
      );
      pendingConfirm = resolve;
    });
  }

  /* ================================================================== */
  /* 路由                                                               */
  /* ================================================================== */
  function go(view) {
    // 离开录音页时清掉倒计时，避免切走后定时器还在偷偷开麦
    if (state.countdown) {
      if (state.cdTimer) { clearInterval(state.cdTimer); state.cdTimer = 0; }
      state.countdown = 0;
    }
    state.view = view;
    const path = pathFor(view);
    if (location.hash !== path) {
      history.replaceState(null, '', path);
    }
    render();
    window.scrollTo(0, 0);
  }

  /** 某视图的完整路径：项目内页面（record/manage/export）带上当前项目 id，供刷新后恢复 */
  function pathFor(view) {
    const inProject = (view === 'record' || view === 'manage' || view === 'export') && state.project;
    return inProject ? '#/' + view + '/' + encodeURIComponent(state.project.id) : '#/' + view;
  }

  function routeFromHash() {
    const parts = (location.hash || '').replace(/^#\//, '').split('/');
    const v = ['home', 'record', 'manage', 'export', 'settings'].indexOf(parts[0]) >= 0 ? parts[0] : 'home';
    return { view: v, projectId: parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  /** 刷新后恢复：hash 指向项目内页面时，异步把项目拉回来并停在原页面；
      项目不存在 / 数据不兼容 / 读取失败 → 留在首页（有故障就回家） */
  function restoreRoute(route) {
    if (!route.projectId) return;
    DB.getProject(route.projectId).then(function (p) {
      if (!p || !C.projectCompatible(p)) return;
      return openProject(p, route.view);
    }).catch(function () {});
  }

  function render() {
    const el = viewEl();
    if (!el) return;
    let html = '';
    if (state.view === 'record') html = viewRecord();
    else if (state.view === 'manage') html = viewManage();
    else if (state.view === 'export') html = viewExport();
    else if (state.view === 'settings') html = viewSettings();
    else html = viewHome();
    el.innerHTML = html;
    afterRender();
  }

  /* 待录 / 倒计时：在波形区中央画一条低透明度细基线，
     提示用户这块区域会显示声音波形（录制时波形沿此线起伏） */
  function drawIdleBaseline() {
    const canvas = document.getElementById('wave');
    if (!canvas) return;
    const c2d = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function paint() {
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      c2d.clearRect(0, 0, W, H);
      c2d.strokeStyle = 'rgba(185, 96, 60, 0.30)';
      c2d.lineWidth = 1.5;
      c2d.beginPath();
      c2d.moveTo(0, H / 2);
      c2d.lineTo(W, H / 2);
      c2d.stroke();
    }
    releaseBaseline();
    paint();
    window.addEventListener('resize', paint);
    state._baselineOff = function () {
      window.removeEventListener('resize', paint);
      state._baselineOff = null;
    };
  }

  function releaseBaseline() {
    if (state._baselineOff) { state._baselineOff(); state._baselineOff = null; }
  }

  /* 每次渲染完统一收尾：只有待在录音页且未在录音（含倒计时）时才画基线 */
  function afterRender() {
    if (state.view === 'record' && !state.recording && document.getElementById('wave')) {
      drawIdleBaseline();
    } else {
      releaseBaseline();
    }
  }

  /** 把界面语言同步到 <html lang> 和标题 */
  function applyDocLang() {
    document.documentElement.setAttribute('lang',
      I18N.getUiLang() === 'en' ? 'en' : 'zh-CN');
    document.title = T('appTitle');
  }

  /* ================================================================== */
  /* 页脚伦理提示                                                        */
  /* ================================================================== */
  function footerHTML() {
    return '<footer class="ethics">' +
      '<p>' + esc(T('footerNote1')) + '</p>' +
      '<p>' + esc(T('footerNote2')) + '</p>' +
      '<p class="sign">' +
      '<a href="' + esc(C.APP.repo) + '" target="_blank" rel="noopener noreferrer">' +
      esc(C.APP.name) + ' · ' + esc(C.APP.nameEn) + '</a> · ' +
      '<a href="' + esc(C.APP.authorUrl) + '" target="_blank" rel="noopener noreferrer">' +
      esc(C.APP.author) + '</a>（' + esc(C.APP.authorId) + '）</p>' +
      '</footer>';
  }

  /* ================================================================== */
  /* 页面 1：首页                                                       */
  /* ================================================================== */
  function viewHome() {
    let html = '';

    html += '<section class="hero">' +
      '<h1>' + esc(T('appTitle')) + '</h1>' +
      '<p class="lede">' + T('heroLede') + '</p>' +
      '</section>';

    // 隐私提示：可关闭，关闭状态存在 meta 里，关过就不再出现
    if (!state.privacyDismissed) {
      html += '<section class="card privacy">' +
        '<div class="privacy-inner">' +
        '<p class="privacy-line">' + esc(T('privacyShort')) + '</p>' +
        '<button type="button" class="privacy-close" data-act="dismiss-privacy" ' +
        'aria-label="' + esc(T('privacyClose')) + '">✕</button>' +
        '</div></section>';
    }

    html += '<section class="card"><h2>' + esc(T('myProjects')) + '</h2>';
    if (!state.projects.length) {
      html += '<p class="muted empty">' + esc(T('noProjects')) + '</p>';
    } else {
      html += '<ul class="proj-list">';
      state.projects.forEach(function (p) {
        const g = C.ageGroup(p.ageGroup, I18N.getUiLang());
        const total = C.buildTasks(p.ageGroup, p.language || 'zh', p.dialect).length;
        const done = Math.min(p.clipCount || 0, total);
        const pct = total ? Math.round(done / total * 100) : 0;
        const langTag = p.dialect || C.language(p.language, I18N.getUiLang()).label;
        const isArchive = (p.purpose || 'train') === 'archive';
        html += '<li class="proj">' +
          '<div class="proj-head">' +
          '<span class="proj-name">' + esc(p.nickname) + '</span>' +
          '<span class="proj-tags">' +
          '<span class="tag">' + esc(g.label) + ' · ' + esc(langTag) + '</span>' +
          (isArchive ? '<span class="tag soft">' + esc(T('tagArchiveOnly')) + '</span>' : '') +
          '</span>' +
          '</div>' +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="proj-foot">' +
          '<span class="muted">' + esc(T('recordedN', { done: done, total: total })) +
          (p.duration ? ' · ' + esc(fmtTotal(p.duration)) : '') + '</span>' +
          '<span class="proj-ops">' +
          '<button class="btn small primary" data-act="open" data-id="' + p.id + '">' + esc(T('btnContinue')) + '</button>' +
          '<button class="btn small ghost" data-act="manage" data-id="' + p.id + '">' + esc(T('btnClips')) + '</button>' +
          '<button class="btn small ghost" data-act="project-settings" data-id="' + p.id + '">' + esc(T('btnProjectSettings')) + '</button>' +
          '</span></div></li>';
      });
      html += '</ul>';
    }
    html += '<button class="btn primary block" data-act="new-project">' + esc(T('btnNewProject')) + '</button>';
    html += '</section>';

    // 继续上次录制：默认折叠，点一下才展开（多数时候用不上，别占地方）
    html += '<section class="card resume' + (state.showResume ? ' open' : '') + '">' +
      '<button type="button" class="btn ghost block resume-toggle" data-act="toggle-resume"' +
      ' aria-expanded="' + (state.showResume ? 'true' : 'false') + '">' +
      '<span>' + esc(T('resumeTitle')) + '</span>' +
      '<span class="resume-arrow" aria-hidden="true">›</span>' +
      '</button>' +
      (state.showResume
        ? '<p class="muted">' + esc(T('resumeHint')) + '</p>' +
          '<label class="btn primary block file-btn">' + esc(T('pickBackup')) +
          '<input type="file" accept=".zip,.json,application/zip,application/json" data-act="import"></label>'
        : '') +
      '</section>';

    html += '<section class="card">' +
      '<button class="btn ghost block" data-act="go-settings">' + esc(T('btnSettings')) + '</button>' +
      // 用户选过「以后不再提示」后首页不再显示；仍可通过设置页的「查看添加步骤」查看
      (!state.installDismissed
        ? '<button class="btn ghost block" data-act="go-install">' + esc(T('btnInstall')) + '</button>'
        : '') +
      '</section>';

    html += footerHTML();
    return html;
  }

  /* ---------------- 新建项目 ---------------- */
  /** 语言 / 用途 切换时，同步说明文字与相关字段的显示 */
  function syncProjectForm() {
    const langEl = document.querySelector('input[name=language]:checked');
    const hintEl = document.getElementById('lang-hint');
    const dWrap = document.getElementById('f-dialect-wrap');
    if (langEl) {
      const lang = C.language(langEl.value, I18N.getUiLang());
      if (hintEl) hintEl.textContent = lang.hint || '';
      if (dWrap) dWrap.hidden = !lang.dialectable;
    }
    const pEl = document.querySelector('input[name=purpose]:checked');
    const pHint = document.getElementById('purpose-hint');
    const sWrap = document.getElementById('f-speaker-wrap');
    if (pEl) {
      const purpose = C.purpose(pEl.value, I18N.getUiLang());
      if (pHint) pHint.textContent = purpose.hint;
      // 只做存档的话不需要模型名
      if (sWrap) sWrap.hidden = purpose.id === 'archive';
    }
  }

  function newProjectForm() {
    const ui = I18N.getUiLang();
    const groups = C.AGE_GROUPS.map(function (g) {
      const gl = C.ageGroup(g.id, ui);
      return '<label class="chip"><input type="radio" name="ageGroup" value="' + g.id + '"' +
        (g.id === C.DEFAULT_AGE_GROUP ? ' checked' : '') + '><span>' + esc(gl.label + '（' + gl.range + '）') + '</span></label>';
    }).join('');
    const langs = C.LANGUAGES.map(function (l, i) {
      const ll = C.language(l.code, ui);
      return '<label class="chip"><input type="radio" name="language" value="' + l.code + '"' +
        (i === 0 ? ' checked' : '') + '><span>' + esc(ll.label) + '</span></label>';
    }).join('');
    const purposes = C.PURPOSES.map(function (p, i) {
      const pl = C.purpose(p.id, ui);
      return '<label class="chip"><input type="radio" name="purpose" value="' + p.id + '"' +
        (i === 0 ? ' checked' : '') + '><span>' + esc(pl.label) + '</span></label>';
    }).join('');

    openModal(
      '<h3 class="modal-title">' + esc(T('newProjectTitle')) + '</h3>' +
      '<div class="form">' +
      '<label class="field"><span>' + esc(T('fNickname')) + '</span>' +
      '<input type="text" id="f-nickname" placeholder="' + esc(T('phNickname')) + '" maxlength="20"></label>' +
      '<div class="field"><span>' + esc(T('fAgeGroup')) + '</span><div class="chips">' + groups + '</div></div>' +
      '<div class="field"><span>' + esc(T('fLanguage')) + '</span><div class="chips">' + langs + '</div>' +
      '<p class="muted small" id="lang-hint"></p></div>' +
      '<label class="field" id="f-dialect-wrap" hidden><span>' + esc(T('fDialect')) + '</span>' +
      '<input type="text" id="f-dialect" placeholder="' + esc(T('phDialect')) + '" maxlength="20"></label>' +
      '<div class="field"><span>' + esc(T('fPurpose')) + '</span><div class="chips">' + purposes + '</div>' +
      '<p class="muted small" id="purpose-hint"></p></div>' +
      '<label class="field" id="f-speaker-wrap"><span>' + esc(T('fSpeaker')) + '</span>' +
      '<input type="text" id="f-speaker" placeholder="' + esc(T('phSpeaker')) + '" maxlength="24"></label>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-act="modal-close">' + esc(T('btnCancel')) + '</button>' +
      '<button class="btn primary" data-act="create-project">' + esc(T('btnCreate')) + '</button>' +
      '</div>'
    );
    setTimeout(syncProjectForm, 0);
  }

  function createProject() {
    const nickname = (document.getElementById('f-nickname').value || '').trim();
    if (!nickname) { toast(T('toastNeedNickname')); return; }

    const speakerRaw = (document.getElementById('f-speaker').value || '').trim();
    const speakerId = speakerRaw.replace(/[^a-zA-Z0-9_]/g, '') || ('speaker' + pad(1, 2));
    const ageGroup = (document.querySelector('input[name=ageGroup]:checked') || {}).value || C.DEFAULT_AGE_GROUP;
    const language = (document.querySelector('input[name=language]:checked') || {}).value || 'zh';
    const purpose = (document.querySelector('input[name=purpose]:checked') || {}).value || 'train';

    // 只有选了「中文（其他方言）」才出现具体是哪种话的选填框
    const dialectEl = document.getElementById('f-dialect');
    const dialect = (C.language(language).dialectable && dialectEl)
      ? (dialectEl.value || '').trim()
      : '';

    DB.createProject({
      nickname: nickname, speakerId: speakerId, ageGroup: ageGroup,
      language: language, dialect: dialect, purpose: purpose
    }).then(function (p) {
      upsertProject(p);
      closeModal();
      return openProject(p);
    }).catch(function (e) {
      toast(T('toastCreateFail', { msg: e.message }));
    });
  }

  /* ---------------- 项目设置 ---------------- */
  /** 打开项目设置：改昵称 / 模型名 / 年龄段 / 语言 / 用途 */
  function projectSettingsForm(id) {
    const p = state.projects.filter(function (x) { return x.id === id; })[0] ||
      (state.project && state.project.id === id ? state.project : null);
    if (!p) return;
    state.editingProjectId = p.id;

    const ui = I18N.getUiLang();
    const groups = C.AGE_GROUPS.map(function (g) {
      const gl = C.ageGroup(g.id, ui);
      return '<label class="chip"><input type="radio" name="ageGroup" value="' + g.id + '"' +
        (g.id === p.ageGroup ? ' checked' : '') + '><span>' +
        esc(gl.label + '（' + gl.range + '）') + '</span></label>';
    }).join('');
    const langs = C.LANGUAGES.map(function (l) {
      const ll = C.language(l.code, ui);
      return '<label class="chip"><input type="radio" name="language" value="' + l.code + '"' +
        (l.code === p.language ? ' checked' : '') + '><span>' + esc(ll.label) + '</span></label>';
    }).join('');
    const purposes = C.PURPOSES.map(function (x) {
      const pl = C.purpose(x.id, ui);
      return '<label class="chip"><input type="radio" name="purpose" value="' + x.id + '"' +
        (x.id === (p.purpose || 'train') ? ' checked' : '') + '><span>' + esc(pl.label) + '</span></label>';
    }).join('');

    openModal(
      '<h3 class="modal-title">' + esc(T('projectSettingsTitle')) + '</h3>' +
      '<div class="form">' +
      '<label class="field"><span>' + esc(T('fNickname')) + '</span>' +
      '<input type="text" id="f-nickname" value="' + esc(p.nickname) + '" maxlength="20"></label>' +
      '<div class="field"><span>' + esc(T('fAgeGroup')) + '</span><div class="chips">' + groups + '</div></div>' +
      '<div class="field"><span>' + esc(T('fLanguage')) + '</span><div class="chips">' + langs + '</div>' +
      '<p class="muted small" id="lang-hint"></p></div>' +
      '<label class="field" id="f-dialect-wrap" hidden><span>' + esc(T('fDialect')) + '</span>' +
      '<input type="text" id="f-dialect" value="' + esc(p.dialect || '') + '" maxlength="20"></label>' +
      '<div class="field"><span>' + esc(T('fPurpose')) + '</span><div class="chips">' + purposes + '</div>' +
      '<p class="muted small" id="purpose-hint"></p></div>' +
      '<label class="field" id="f-speaker-wrap"><span>' + esc(T('fSpeaker')) + '</span>' +
      '<input type="text" id="f-speaker" value="' + esc(p.speakerId || '') + '" maxlength="24"></label>' +
      '<p class="muted small">' + esc(T('projectSettingsHint')) + '</p>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-act="modal-close">' + esc(T('btnCancel')) + '</button>' +
      '<button class="btn primary" data-act="save-project-settings">' + esc(T('btnSave')) + '</button>' +
      '</div>' +
      '<button type="button" class="btn danger-ghost block" data-act="delete-project">' +
      esc(T('btnDeleteProject')) + '</button>'
    );
    setTimeout(syncProjectForm, 0);
  }

  /** 删除整个项目及其全部录音（二次确认，确认里会报出有多少段录音） */
  function deleteProject() {
    const id = state.editingProjectId;
    const p = state.projects.filter(function (x) { return x.id === id; })[0] ||
      (state.project && state.project.id === id ? state.project : null);
    if (!p) { closeModal(); return; }

    DB.countClips(p.id).then(function (n) {
      return confirmModal(T('confirmDelProjectTitle'),
        T('confirmDelProjectBody', { name: esc(p.nickname), n: n }),
        T('confirmDelProjectOk'));
    }).then(function (ok) {
      if (!ok) { closeModal(); return null; }
      return DB.deleteProject(p.id).then(function () {
        state.projects = state.projects.filter(function (x) { return x.id !== p.id; });
        // 删的是当前打开的项目：清干净内存状态并回首页
        const wasCurrent = !!(state.project && state.project.id === p.id);
        if (wasCurrent) {
          stopPlay();
          state.project = null;
          state.clips = [];
          state.tasks = [];
          state.pending = null;
          state.cursor = 0;
        }
        state.editingProjectId = null;
        closeModal();
        toast(T('toastProjectDeleted'));
        if (wasCurrent) {
          go('home');
          return null;
        }
        return refreshProjects();
      });
    }).catch(function (e) {
      toast(T('toastSaveFail', { msg: e && e.message ? e.message : '-' }));
    });
  }

  function saveProjectSettings() {
    const id = state.editingProjectId;
    const p = state.projects.filter(function (x) { return x.id === id; })[0] ||
      (state.project && state.project.id === id ? state.project : null);
    if (!p) { closeModal(); return; }

    const nickname = (document.getElementById('f-nickname').value || '').trim();
    if (!nickname) { toast(T('toastNeedNickname')); return; }

    const speakerRaw = (document.getElementById('f-speaker').value || '').trim();
    const ageGroup = (document.querySelector('input[name=ageGroup]:checked') || {}).value || p.ageGroup;
    const language = (document.querySelector('input[name=language]:checked') || {}).value || p.language;
    const purpose = (document.querySelector('input[name=purpose]:checked') || {}).value || (p.purpose || 'train');
    const dialectEl = document.getElementById('f-dialect');
    const dialect = (C.language(language).dialectable && dialectEl)
      ? (dialectEl.value || '').trim()
      : '';
    const speakerId = speakerRaw.replace(/[^a-zA-Z0-9_]/g, '') || p.speakerId;

    DB.updateProject(p.id, {
      nickname: nickname, speakerId: speakerId, ageGroup: ageGroup,
      language: language, dialect: dialect, purpose: purpose
    }).then(function (upd) {
      state.editingProjectId = null;
      closeModal();
      upsertProject(upd);
      // 改的是当前打开的项目：同步内存里的项目，并按新设置重建任务队列
      if (state.project && state.project.id === upd.id) {
        state.project = upd;
        state.tasks = buildProjectTasks(upd);
        if (state.cursor >= state.tasks.length) state.cursor = 0;
      }
      render();
      toast(T('toastSaved'));
      return refreshProjects();
    }).catch(function (e) {
      toast(T('toastSaveFail', { msg: e.message }));
    });
  }

  /* ================================================================== */
  /* 页面 2：录音（核心页面）                                            */
  /* ================================================================== */
  function clipFor(taskId) {
    for (let i = 0; i < state.clips.length; i++) {
      if (state.clips[i].taskId === taskId) return state.clips[i];
    }
    return null;
  }

  function firstIncomplete() {
    for (let i = 0; i < state.tasks.length; i++) {
      if (!clipFor(state.tasks[i].id)) return i;
    }
    return Math.max(0, state.tasks.length - 1);
  }

  function nextIncompleteFrom(start) {
    const n = state.tasks.length;
    for (let i = 0; i < n; i++) {
      const idx = (start + i) % n;
      if (!clipFor(state.tasks[idx].id)) return idx;
    }
    return null;
  }

  function doneCount() {
    let n = 0;
    state.tasks.forEach(function (t) { if (clipFor(t.id)) n++; });
    return n;
  }

  function openProject(p, view) {
    state.project = p;
    state.tasks = buildProjectTasks(p);
    state.pending = null;
    state.showTaskList = false;
    state.sinceBackup = 0;
    stopPlay();
    return DB.getClips(p.id).then(function (clips) {
      state.clips = clips;
      state.cursor = firstIncomplete();
      go(view || 'record');
      maybeShowRecGuide();
    });
  }

  /**
   * 录音指引：新建 / 恢复的项目第一次进录音页自动弹一次（每个项目只弹一次），
   * 之后随时点右上角 💡 再看。recGuideSeen 存进项目记录。
   */
  function maybeShowRecGuide() {
    const p = state.project;
    if (!p || p.recGuideSeen) return;
    p.recGuideSeen = true;
    openRecGuide();
    DB.updateProject(p.id, { recGuideSeen: true }).catch(function () {});
  }

  /** 录音指引弹窗：年龄段注意事项 + 建议时长（+ 方言提示） */
  function openRecGuide() {
    const p = state.project;
    if (!p) return;
    const g = C.ageGroup(p.ageGroup, I18N.getUiLang());
    const dNote = C.dialectNote(p.dialect, I18N.getUiLang());

    let html = '<h3 class="modal-title">' + esc(T('recGuide')) + '</h3>' +
      '<p class="modal-text"><b>' + esc(g.label + '（' + g.range + '）') + '</b></p>';
    if (g.notes && g.notes.length) {
      html += '<ul class="steps">' + g.notes.map(function (n) {
        return '<li>' + esc(n) + '</li>';
      }).join('') + '</ul>';
    }
    html += '<p class="modal-text">' + esc(T('suggestedDuration', { d: g.duration })) + '</p>';
    if (dNote) {
      html += '<p class="modal-text">' + esc(dNote) + '</p>';
    }
    html += '<div class="modal-actions col">' +
      '<button class="btn primary" data-act="modal-close">' + esc(T('btnGotIt')) + '</button>' +
      '</div>';
    openModal(html);
  }

  /** 还没有备份的句数 */
  function unbackedCount() {
    const backed = state.project ? (state.project.lastBackupCount || 0) : 0;
    return Math.max(0, state.clips.length - backed);
  }

  /* 录音页右上角常驻安全标签（与进度文字同行、右对齐）：
     一句都没录时显示"无数据"；有备份缺口时黄底警告；全部已备份绿底 + 锁标放最后 */
  function safetySpan() {
    const unbacked = unbackedCount();
    let cls = 'ok', text, icon = '';
    if (!state.clips.length) {
      cls = 'none';
      text = T('noData');
    } else if (unbacked > 0) {
      cls = 'warn';
      text = T('unbackedN', { n: unbacked });
      icon = '⚠️';
    } else {
      text = T('backedOk');
      icon = '🔒';
    }
    return '<span class="safety ' + cls + '">' +
      '<span>' + esc(text) + '</span>' +
      (icon ? '<span class="safety-ico" aria-hidden="true">' + icon + '</span>' : '') +
      '</span>';
  }

  function viewRecord() {
    const p = state.project;
    if (!p) return viewHome();
    const g = C.ageGroup(p.ageGroup, I18N.getUiLang());
    const task = state.tasks[state.cursor];
    const total = state.tasks.length;
    const done = doneCount();

    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-home">' + esc(T('crumbProjects')) + '</button>' +
      '<span class="crumb-title">' + esc(p.nickname) + '</span>' +
      '<span class="crumbs-ops">' +
      '<button type="button" class="btn tiny ghost icon-btn" data-act="rec-guide" ' +
      'title="' + esc(T('recGuide')) + '" aria-label="' + esc(T('recGuide')) + '">💡</button>' +
      '<button class="btn tiny ghost" data-act="go-manage">' + esc(T('btnClips')) + '</button>' +
      '</span>' +
      '</nav>';

    // 常驻安全状态标签：与进度文字同一行，右对齐
    html += '<section class="progress-head">' +
      '<div class="progress-line">' +
      '<span class="muted">' + esc(T('progressN', { cur: state.cursor + 1, total: total, done: done })) + '</span>' +
      safetySpan() +
      '</div>' +
      '<div class="bar thin"><i style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></i></div>' +
      '</section>';

    html += '<section class="task-card' + (state.recording ? ' rec' : '') + '">' +
      '<div class="task-head">' +
      '<p class="task-group">' + esc(task.groupTitle) + '</p>' +
      (task.idea
        ? '<button type="button" class="btn tiny ghost idea-btn' + (state.showIdeas ? ' active' : '') + '" data-act="toggle-idea" aria-expanded="' + (state.showIdeas ? 'true' : 'false') + '">' +
          esc(T('ideaBtn')) + '</button>'
        : '') +
      '</div>' +
      '<h2 class="task-label">' + esc(task.label) + '</h2>' +
      (task.tip ? '<p class="task-tip"' + (state.showIdeas && task.idea ? ' hidden' : '') + '>' + esc(task.tip) + '</p>' : '') +
      (task.idea ? '<p class="task-idea"' + (state.showIdeas ? '' : ' hidden') + '>' + esc(task.idea) + '</p>' : '') +
      '</section>';

    if (done >= total && !state.pending) {
      const secs = state.clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
      html += '<section class="card done-card">' +
        '<h2>' + esc(T('allDone')) + '</h2>' +
        '<p>' + T('allDoneBody', { n: done, total: esc(fmtTotal(secs)) }) + '</p>' +
        '<p class="muted small">' + esc(T('allDoneHint')) + '</p>' +
        '<button class="btn primary block" data-act="go-export">' + esc(T('btnExport')) + '</button>' +
        '<button class="btn ghost block" data-act="go-manage">' + esc(T('btnViewClips')) + '</button>' +
        '</section>';
    } else if (state.pending) {
      html += reviewHTML();
    } else {
      html += recorderHTML();
    }

    html += '<section class="card tasks-card' + (state.showTaskList ? ' open' : '') + '">' +
      '<button class="btn ghost block" data-act="toggle-tasks">' +
      esc(state.showTaskList
        ? T('hideAllLines')
        : T('showAllLines', { n: total })) + '</button>';
    if (state.showTaskList) {
      html += '<ul class="task-list">';
      state.tasks.forEach(function (t, i) {
        const c = clipFor(t.id);
        html += '<li class="' + (i === state.cursor ? 'current ' : '') + (c ? 'done' : '') + '">' +
          '<button class="task-jump" data-act="jump" data-i="' + i + '">' +
          '<span class="tl-no">' + pad(i + 1, 2) + '</span>' +
          '<span class="tick">' + (c ? '●' : '○') + '</span>' +
          '<span class="tl-text">' + esc(t.label) + '</span>' +
          (c ? '<span class="tl-dur">' + esc(fmtDuration(c.duration)) + '</span>' : '') +
          '</button></li>';
      });
      html += '</ul>';
    }
    html += '</section>';

    html += footerHTML();
    return html;
  }

  function recorderHTML() {
    const cd = state.countdown > 0;
    // 待录 / 倒计时 / 录音中三种状态共用同一套盒子（波形画布、电平条、计时器行），
    // 只切换文字与数字，切换状态时高度不变，页面不跳
    return '<section class="recorder">' +
      '<canvas id="wave" class="wave"></canvas>' +
      '<div class="level">' +
      '<div class="level-bar"><i id="level-fill"' + (cd ? ' style="width:100%"' : '') + '></i><span class="zone"></span></div>' +
      '<p class="level-text" id="level-text">' + esc(cd ? T('cdLevelText') : T('levelStart')) + '</p>' +
      '</div>' +
      '<p class="timer' + (cd ? ' countdown-num' : '') + '" id="timer">' + (cd ? state.countdown : '0:00') + '</p>' +
      '<button class="rec-btn' + (state.recording ? ' on' : '') + '" data-act="toggle-rec">' +
      '<span class="rec-dot"></span>' +
      '<span class="rec-label">' + esc(state.recording ? T('btnStop') : (cd ? T('btnCancelCd') : T('btnStartRec'))) + '</span>' +
      '</button>' +
      '<p class="hint">' + esc(state.recording ? T('recWarning') : (cd ? T('cdTip') : T('hintIdle'))) + '</p>' +
      '</section>';
  }

  function reviewHTML() {
    const pd = state.pending;
    return '<section class="review">' +
      '<p class="review-title">' + esc(T('reviewTitle')) + '</p>' +
      '<audio id="preview" controls preload="auto" src="' + pd.url + '"></audio>' +
      '<label class="field"><span>' + esc(T('fClipText')) + '</span>' +
      '<textarea id="clip-text" rows="3" placeholder="' + esc(T('phClipText')) + '">' +
      esc(pd.text || '') + '</textarea></label>' +
      '<div class="row review-actions">' +
      '<span class="ra-left">' +
      '<button class="btn ghost" data-act="rerecord">' + esc(T('btnRerecord')) + '</button>' +
      '<button class="btn primary" data-act="confirm-clip">' + esc(T('btnSaveNext')) + '</button>' +
      '</span>' +
      '<button class="btn danger-outline" data-act="discard-clip">' + esc(T('btnDiscardClip')) + '</button>' +
      '</div>' +
      '</section>';
  }

  /* ---------------- 录音控制 ---------------- */
  function ensureRecorder() {
    if (!state.recorder) state.recorder = new VR.Recorder();
    return state.recorder;
  }

  function toggleRecord() {
    if (state.recording) { stopRecord(); return; }
    if (state.countdown > 0) { cancelCountdown(); return; }
    beginCountdown();
  }

  /** 按下「开始录音」：先倒计时，倒数结束才真正收音 */
  function beginCountdown() {
    if (!VR.supported()) {
      toast(T('toastNoRecHere'));
      return;
    }
    if (state.recording || state.countdown > 0) return;
    if (state.recCountdown <= 0) { startRecord(); return; }
    state.countdown = state.recCountdown;
    state.cdTimer = setInterval(countdownTick, 1000);
    render();
    popCountdown();
  }

  function countdownTick() {
    if (state.countdown > 0) state.countdown--;
    if (state.countdown > 0) {
      const el = document.getElementById('timer');
      if (el) el.textContent = state.countdown;
      // 电平条当作剩余进度用：宽一点 → 离开始越近
      const fill = document.getElementById('level-fill');
      if (fill && state.recCountdown > 0) {
        fill.style.width = Math.round(state.countdown / state.recCountdown * 100) + '%';
      }
      popCountdown();
    } else {
      clearCountdown();
      startRecord();
    }
  }

  function clearCountdown() {
    if (state.cdTimer) { clearInterval(state.cdTimer); state.cdTimer = 0; }
    state.countdown = 0;
  }

  /** 倒计时中再点一次按钮：取消，回到待录状态 */
  function cancelCountdown() {
    clearCountdown();
    render();
  }

  function popCountdown() {
    const el = document.getElementById('timer');
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth;      // 强制 reflow，让弹跳动画每次都能重放
    el.classList.add('pop');
  }

  function startRecord() {
    if (!VR.supported()) {
      toast(T('toastNoRecHere'));
      return;
    }
    ensureRecorder().start().then(function () {
      state.recording = true;
      render();
      startMeter();
    }).catch(function (e) {
      toast(e && e.message ? e.message : T('toastMicFail'));
    });
  }

  function stopRecord() {
    const rec = ensureRecorder();
    rec.stop().then(function (res) {
      state.recording = false;
      stopMeter();
      // 录完立刻松开麦克风。不释放的话 getUserMedia 的通道会一直被占着，
      // 之后用输入法的「语音转文字」会提示录音通道被占用。
      // 下一句开录时 startRecord 会重新申请，成本很低。
      rec.dispose();
      if (!res || !res.duration || res.duration < 0.3) {
        toast(T('toastTooShort'));
        render();
        return;
      }
      state.pending = {
        task: state.tasks[state.cursor],
        blob: res.blob,
        url: URL.createObjectURL(res.blob),
        duration: res.duration,
        text: ''
      };
      render();
      // 进入界面立刻聚焦文本框（不等播放完）：录音人就在现场，当场记录最准。
      const t = document.getElementById('clip-text');
      if (t) t.focus();
      // 刚录的这句循环播放，方便对照着听；手动点暂停才会停。
      const audio = document.getElementById('preview');
      if (audio) {
        audio.loop = true;
        audio.play().catch(function () {});
      }
    });
  }

  function rerecord() {
    if (state.pending && state.pending.url) URL.revokeObjectURL(state.pending.url);
    state.pending = null;
    render();
    beginCountdown();
  }

  function discardClip() {
    if (state.pending && state.pending.url) URL.revokeObjectURL(state.pending.url);
    state.pending = null;
    render();
  }

  function confirmClip() {
    const pd = state.pending;
    if (!pd) return;
    const textEl = document.getElementById('clip-text');
    const text = (textEl.value || '').trim();
    const task = pd.task;
    const existing = clipFor(task.id);

    DB.addClip({
      id: existing ? existing.id : undefined,
      projectId: state.project.id,
      taskId: task.id,
      taskLabel: task.label,
      group: task.group,
      text: text,
      blob: pd.blob,
      duration: pd.duration,
      rate: VR.TARGET_RATE,
      ref: existing ? existing.ref : false,
      source: 'record',
      ts: existing ? existing.ts : Date.now()
    }).then(function (saved) {
      let replaced = false;
      for (let i = 0; i < state.clips.length; i++) {
        if (state.clips[i].id === saved.id) { state.clips[i] = saved; replaced = true; break; }
      }
      if (!replaced) state.clips.push(saved);

      URL.revokeObjectURL(pd.url);
      state.pending = null;
      state.sinceBackup++;

      const next = nextIncompleteFrom(state.cursor + 1);
      if (next != null) state.cursor = next;

      DB.updateProject(state.project.id, { updatedAt: Date.now() });
      render();
      maybeRemindBackup();
    }).catch(function (e) {
      toast(T('toastSaveFail', { msg: e.message }));
    });
  }

  /* ---------------- 实时波形与电平 ---------------- */
  function startMeter() {
    const rec = ensureRecorder();
    const canvas = document.getElementById('wave');
    if (!canvas) return;
    const c2d = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    state._resizeOff = function () { window.removeEventListener('resize', resize); };

    const startedAt = Date.now();
    const fill = document.getElementById('level-fill');
    const text = document.getElementById('level-text');
    const timer = document.getElementById('timer');
    let buf = new Float32Array(rec.analysisSize());

    function frame() {
      if (!state.recording) return;
      const data = rec.waveform(buf);
      if (data) buf = data;

      c2d.clearRect(0, 0, W, H);
      const mid = H / 2;
      const step = Math.max(1, Math.floor(buf.length / Math.max(1, W)));
      c2d.beginPath();
      for (let x = 0, i = 0; x < W; x++, i += step) {
        const v = Math.max(-1, Math.min(1, buf[i] || 0));
        const y = mid - v * (mid - 6);
        if (x === 0) c2d.moveTo(x, y); else c2d.lineTo(x, y);
      }
      c2d.strokeStyle = '#B9603C';
      c2d.lineWidth = 2;
      c2d.lineJoin = 'round';
      c2d.stroke();

      // 电平：db 按 RMS 计，-45dB ~ -6dB 映射到 0~100%
      const lv = rec.level();
      const db = lv.db;
      const pct = Math.max(0, Math.min(100, (db + 45) / 39 * 100));
      if (fill) fill.style.width = pct + '%';
      if (text) {
        if (db < -27) text.textContent = T('levelCloser');
        else if (db > -15) text.textContent = T('levelFarther');
        else text.textContent = T('levelGood');
      }
      if (timer) timer.textContent = fmtDuration((Date.now() - startedAt) / 1000);

      state.raf = requestAnimationFrame(frame);
    }
    frame();
  }

  function stopMeter() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    if (state._resizeOff) { state._resizeOff(); state._resizeOff = null; }
  }

  /* ================================================================== */
  /* 页面 3：素材管理                                                    */
  /* ================================================================== */
  function viewManage() {
    const p = state.project;
    if (!p) return viewHome();
    const total = state.clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
    const g = C.ageGroup(p.ageGroup, I18N.getUiLang());

    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-record">' + esc(T('crumbRecord')) + '</button>' +
      '<span class="crumb-title">' + esc(p.nickname) + esc(T('crumbClipsSuffix')) + '</span>' +
      '<button class="btn tiny ghost" data-act="go-export">' + esc(T('crumbExport')) + '</button>' +
      '</nav>';

    html += '<section class="card stat">' +
      '<p>' + T('statLine', { n: state.clips.length, total: esc(fmtTotal(total)) }) + '</p>' +
      '<ul class="stat-notes">' +
      '<li>' + esc(T('statHint')) + '</li>' +
      '<li>' + esc(T('statRefHint')) + '</li>' +
      '</ul>' +
      '</section>';

    if (!state.clips.length) {
      html += '<section class="card"><p class="muted empty">' + esc(T('noClips')) + '</p></section>';
    } else {
      html += '<ul class="clip-list">';
      state.clips.forEach(function (c, i) {
        html += '<li class="clip">' +
          '<div class="clip-head">' +
          '<span class="clip-no">' + pad(i + 1, 3) + '</span>' +
          '<span class="clip-dur">' + esc(fmtDuration(c.duration)) + '</span>' +
          '</div>' +
          (c.missing
            ? '<p class="clip-text warn-text">' + esc(T('clipMissing')) + '</p>'
            : '<p class="clip-text">' + (c.text ? esc(c.text) : '<i class="muted">' + esc(T('noTextYet')) + '</i>') + '</p>') +
          '<p class="clip-label">' + esc(c.taskLabel || T('importedAudio')) + '</p>' +
          '<div class="clip-ops">' +
          '<span class="ops-left">' +
          '<button class="btn tiny ghost" data-act="play" data-id="' + c.id + '">' +
          esc(state.playingId === c.id ? T('btnStop') : T('btnPlay')) + '</button>' +
          '<button class="btn tiny ghost" data-act="rerecord-clip" data-id="' + c.id + '">' + esc(T('btnRerecord')) + '</button>' +
          '<button class="btn tiny ghost" data-act="edit-clip" data-id="' + c.id + '">' + esc(T('btnEditText')) + '</button>' +
          '</span>' +
          '<span class="ops-right">' +
          '<button type="button" class="btn tiny icon-only' + (c.ref ? ' is-on' : '') + '" data-act="toggle-ref" data-id="' + c.id + '" ' +
          'title="' + esc(c.ref ? T('btnIsRef') : T('btnSetRef')) + '" aria-label="' + esc(c.ref ? T('btnIsRef') : T('btnSetRef')) + '">' +
          '<span aria-hidden="true">' + (c.ref ? '\u2605' : '\u2606') + '</span></button>' +
          '<button type="button" class="btn tiny icon-only icon-del" data-act="del-clip" data-id="' + c.id + '" ' +
          'title="' + esc(T('btnDelete')) + '" aria-label="' + esc(T('btnDelete')) + '">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>' +
          '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>' +
          '</button>' +
          '</span>' +
          '</div></li>';
      });
      html += '</ul>';
    }

    html += footerHTML();
    return html;
  }

  function stopPlay() {
    if (state.player) {
      try { state.player.pause(); } catch (e) {}
      state.player = null;
    }
    state.playingId = null;
  }

  function playClip(id) {
    if (state.playingId === id) { stopPlay(); render(); return; }
    stopPlay();
    const c = state.clips.filter(function (x) { return x.id === id; })[0];
    if (!c || !c.blob) { toast(T('toastNoAudio')); return; }
    const url = URL.createObjectURL(c.blob);
    const a = new Audio(url);
    state.player = a;
    state.playingId = id;
    a.onended = function () {
      URL.revokeObjectURL(url);
      state.playingId = null;
      state.player = null;
      render();
    };
    a.onerror = function () { URL.revokeObjectURL(url); stopPlay(); render(); };
    a.play().catch(function () { stopPlay(); toast(T('toastPlayFail')); });
    render();
  }

  function editClip(id) {
    const c = state.clips.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    openModal(
      '<h3 class="modal-title">' + esc(T('editClipTitle')) + '</h3>' +
      '<div class="form"><label class="field"><span>' + esc(c.taskLabel || T('importedAudio')) + '</span>' +
      '<textarea id="edit-text" rows="3">' + esc(c.text || '') + '</textarea></label></div>' +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-act="modal-close">' + esc(T('btnCancel')) + '</button>' +
      '<button class="btn primary" data-act="save-edit" data-id="' + c.id + '">' + esc(T('btnSave')) + '</button>' +
      '</div>'
    );
    setTimeout(function () {
      const t = document.getElementById('edit-text');
      if (t) t.focus();
    }, 30);
  }

  function saveEdit(id) {
    const text = (document.getElementById('edit-text').value || '').trim();
    DB.updateClip(id, { text: text }).then(function (c) {
      for (let i = 0; i < state.clips.length; i++) {
        if (state.clips[i].id === id) state.clips[i] = c;
      }
      closeModal();
      render();
      toast(T('toastSaved'));
    });
  }

  function toggleRef(id) {
    const c = state.clips.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    DB.updateClip(id, { ref: !c.ref }).then(function (u) {
      for (let i = 0; i < state.clips.length; i++) {
        if (state.clips[i].id === id) state.clips[i] = u;
      }
      render();
    });
  }

  function delClip(id) {
    const c = state.clips.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    confirmModal(T('confirmDelClip'),
      esc(T('confirmDelClipBody', { label: c.taskLabel || T('importedAudio') })),
      T('confirmDel')).then(function (ok) {
        if (!ok) { closeModal(); return; }
        return DB.deleteClip(id).then(function () {
          state.clips = state.clips.filter(function (x) { return x.id !== id; });
          closeModal();
          render();
          toast(T('toastDeleted'));
        });
      });
  }

  function rerecordClip(id) {
    const c = state.clips.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    let idx = -1;
    for (let i = 0; i < state.tasks.length; i++) {
      if (state.tasks[i].id === c.taskId) { idx = i; break; }
    }
    if (idx >= 0) {
      state.cursor = idx;
      state.pending = null;
      go('record');
      setTimeout(beginCountdown, 80);
    } else {
      toast(T('toastImportedClip'));
    }
  }

  /* ================================================================== */
  /* 页面 4：导出                                                       */
  /* ================================================================== */
  function viewExport() {
    const p = state.project;
    if (!p) return viewHome();
    const ui = I18N.getUiLang();
    const total = state.clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
    const refs = state.clips.filter(function (c) { return c.ref; });
    const purpose = C.purpose(p.purpose, ui);
    const isArchive = purpose.id === 'archive';
    const langText = p.dialect || C.language(p.language, ui).label;

    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-manage">' + esc(T('crumbClipsBack')) + '</button>' +
      '<span class="crumb-title">' + esc(p.nickname) + esc(T('crumbExportSuffix')) + '</span>' +
      '<button class="btn tiny ghost" data-act="go-home">' + esc(T('crumbProjectsPlain')) + '</button>' +
      '</nav>';

    if (state.lastZip) {
      html += '<section class="card">' +
        '<p class="muted small">' + esc(T('lastZip', { name: state.lastZip.name })) + '</p>' +
        '<button class="btn ghost block" data-act="share-again">' + esc(T('btnShareAgain')) + '</button>' +
        '</section>';
    }

    html += '<section class="card">' +
      '<h2>' + esc(isArchive ? T('exportArchiveTitle') : T('exportFullTitle')) + '</h2>' +
      '<p class="muted small">' + esc(T('exportPurpose', { p: purpose.label })) +
      ' · ' + esc(T('exportLang', { l: langText })) + '</p>' +
      '<ul class="tree">' +
      '<li><b>wavs/</b> ' + esc(T('wavCount', { n: state.clips.length })) + '</li>' +
      (isArchive ? '' :
        '<li><b>dataset.list</b> ' + esc(T('datasetDesc')) + '</li>' +
        '<li><b>references/</b> ' + esc(T('refsDesc', { n: refs.length })) + '</li>' +
        '<li><b>' + esc(T('nextStepsFile')) + '</b> ' + esc(T('nextStepsDesc')) + '</li>') +
      '<li><b>project.json</b> ' + esc(T('projectJsonDesc')) + '</li>' +
      '</ul>' +
      (isArchive
        ? '<p class="muted small">' + esc(T('archiveOnlyNote')) + '</p>'
        : '') +
      '<p class="muted small">' + esc(T('exportTotal', { total: fmtTotal(total) })) +
      (total < 60 ? esc(T('tooShortHint')) : '') + '</p>' +
      '</section>';

    if (!isArchive) {
      html += '<section class="card">' +
        '<p class="muted small">' + esc(T('exportPathNote', { path: exportDataDir(p, normalizePath(state.targetPath)) })) + '</p>' +
        '</section>';
    }

    html += '<section class="card">' +
      (isArchive
        ? '<button class="btn primary block" data-act="export-audio">' + esc(T('btnExportArchive')) + '</button>' +
          '<button class="btn ghost block" data-act="export-full">' + esc(T('btnAlsoFull')) + '</button>'
        : '<button class="btn primary block" data-act="export-full">' + esc(T('btnExportFull')) + '</button>' +
          '<button class="btn ghost block" data-act="export-audio">' + esc(T('btnAudioOnly')) + '</button>') +
      '</section>';

    if (!isArchive && refs.length === 0) {
      html += '<section class="card tip-card">' +
        '<p>' + esc(T('noRefTip')) + '</p></section>';
    }

    html += footerHTML();
    return html;
  }

  /** 电脑目标路径的兜底：没设置时用与「接下来怎么做」示例一致的 D:\GPT-SoVITS */
  function defaultTargetPath() { return 'D:\\GPT-SoVITS\\'; }

  function normalizePath(p) {
    let s = (p || '').trim();
    if (!s) s = defaultTargetPath();
    s = s.replace(/\//g, '\\');
    if (s.slice(-1) !== '\\') s += '\\';
    return s;
  }

  /**
   * 训练包数据最终落地的目录 = 全局基础目录下自动拼一层「VoiceArchive-模型名」。
   * dataset.list 里的绝对路径、以及电脑上解压 ZIP 的位置都以它为准。
   * archive（纯音频存档）没有 dataset.list，直接用基础目录即可。
   */
  function exportDataDir(p, base) {
    if ((p.purpose || 'train') === 'archive') return base;
    const id = String(p.speakerId || '').replace(/[^a-zA-Z0-9_]/g, '') || 'speaker';
    return base + 'VoiceArchive-' + id + '\\';
  }

  /** 把片段的 Blob 读成字节（ZIP 打包器只吃 Uint8Array） */
  function readClips() {
    const list = state.clips.slice()
      .filter(function (c) { return !!c.blob; })
      .sort(function (a, b) { return a.ts - b.ts; });
    return Promise.all(list.map(function (c) {
      return c.blob.arrayBuffer().then(function (buf) {
        return { clip: c, bytes: new Uint8Array(buf) };
      });
    }));
  }

  function buildZip(mode, items) {
    const p = state.project;
    // 训练语种代码：中文方言（zh-dialect）也要导出成 zh，GPT-SoVITS 只认这几个
    const lang = C.trainCode(p.language);
    const base = normalizePath(state.targetPath);
    const dir = exportDataDir(p, base);
    const batch = (p.exportCount || 0) + 1;
    const name = T('zipName', { name: p.nickname, n: batch, date: dateStamp() });

    const zip = ZIP.create();
    zip.addFolder('wavs/');
    if (mode === 'full') zip.addFolder('references/');

    const listLines = [];
    const metas = [];
    let audioCount = 0;

    items.forEach(function (item) {
      const c = item.clip;
      const fname = pad(++audioCount, 4) + '.wav';
      const wavPath = 'wavs/' + fname;
      zip.add(wavPath, item.bytes);
      const text = String(c.text || '').replace(/[\r\n|]+/g, ' ').trim();
      if (mode === 'full') {
        listLines.push(dir + 'wavs\\' + fname + '|' + p.speakerId + '|' + lang + '|' + text);
        if (c.ref) zip.add('references/' + fname, item.bytes);
      }
      metas.push({
        id: c.id, taskId: c.taskId, taskLabel: c.taskLabel, group: c.group,
        text: c.text, duration: c.duration, ref: c.ref, ts: c.ts,
        source: c.source, file: wavPath
      });
    });

    // 训练相关的文件只在完整包里
    if (mode === 'full') {
      zip.add('dataset.list', listLines.join('\n') + '\n');
      zip.add(T('nextStepsFile'), C.nextSteps(I18N.getUiLang()));
    }

    // project.json 两种包都放：它是备份，导回来才能续录
    zip.add('project.json', JSON.stringify({
      app: C.APP.slug,
      version: C.APP.version,
      exportedAt: Date.now(),
      mode: mode,
      project: {
        id: p.id, nickname: p.nickname, speakerId: p.speakerId,
        ageGroup: p.ageGroup, language: p.language, dialect: p.dialect || '',
        purpose: p.purpose || 'train', targetPath: dir,
        createdAt: p.createdAt, exportCount: batch
      },
      clips: metas
    }, null, 2));

    return { zip: zip, name: name, batch: batch, base: dir, count: audioCount };
  }

  function doExport(mode) {
    const p = state.project;
    if (!state.clips.length) { toast(T('toastNothingToExport')); return; }

    toast(T('toastPacking'));
    // 让浏览器先把 toast 画出来，再做重活
    setTimeout(function () {
      // 完整训练包要带「接下来怎么做.html」：先确保文档已就绪（离线时走 SW 缓存）
      const ready = (mode === 'full' && I18N.ensureNextSteps)
        ? I18N.ensureNextSteps(I18N.getUiLang())
        : Promise.resolve(true);
      ready.then(function (ok) {
        if (!ok) { toast(T('nextStepsUnavailable')); return null; }
        return readClips().then(function (items) {
          if (!items.length) { toast(T('toastNoAudioExport')); return null; }
          const built = buildZip(mode, items);
          const blob = built.zip.build();
          state.lastZip = { blob: blob, name: built.name };
          return DB.updateProject(p.id, {
            targetPath: built.base,
            exportCount: built.batch,
            lastExportAt: Date.now(),
            lastBackupCount: state.clips.length
          }).then(function (upd) {
            if (upd) state.project = upd;
            state.sinceBackup = 0;
            state.backupMuted = false;
            render();
            presentZip(blob, built.name);
          });
        });
      }).catch(function (e) {
        toast(T('toastPackFail', { msg: e && e.message ? e.message : '-' }));
      });
    }, 40);
  }

  function presentZip(blob, name) {
    // 桌面上（无法系统分享时）保持原行为：直接弹出下载窗口。
    // 手机等支持原生分享的环境：弹「打包好了」时只给一个「下载到手机」入口，
    // 不再提供「分享到微信/备忘录」——那在实际手机上表现就是一次普通下载。
    let file = null;
    try {
      file = new File([blob], name, { type: 'application/zip' });
    } catch (e) { file = null; }
    const canShare = !!(navigator.canShare && file && navigator.canShare({ files: [file] }));
    state._dlFn = function () { saveZip(blob, name); };

    if (canShare) {
      openModal(
        '<h3 class="modal-title">' + esc(T('packedTitle')) + '</h3>' +
        '<p class="modal-text">' + esc(name) + '</p>' +
        '<p class="modal-text muted">' + esc(T('packedTip')) + '</p>' +
        '<div class="modal-actions col">' +
        '<button class="btn primary block" data-act="do-download">' + esc(T('btnDownload')) + '</button>' +
        '</div>'
      );
    } else {
      downloadZip(blob, name);
    }
  }

  /** 结果弹窗：告知文件被存到了哪里（普通弹窗，不是底部 toast） */
  function zipDoneModal(titleKey, msgKey, name) {
    openModal(
      '<h3 class="modal-title">' + esc(T(titleKey)) + '</h3>' +
      '<p class="modal-text">' + esc(T(msgKey, { name: name })) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn primary" data-act="modal-close">' + esc(T('btnGotIt')) + '</button>' +
      '</div>'
    );
  }

  /**
   * 手机端保存 ZIP：
   * 1) 优先拉起系统的文件保存框（showSaveFilePicker），让用户自己选目录；
   *    写完后弹窗告知「已保存到所选位置」。
   * 2) 弹不出保存框（如 iOS Safari）时退化为普通下载，存进系统下载文件夹，
   *    随后用弹窗（而非 toast）告知文件会出现在哪里。
   */
  function saveZip(blob, name) {
    closeModal();

    function saveToDefault() {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      zipDoneModal('zipSavedDefaultTitle', 'zipSavedDefaultMsg', name);
    }

    if (window.showSaveFilePicker) {
      window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: T('zipTypeDesc'), accept: { 'application/zip': ['.zip'] } }]
      }).then(function (handle) {
        return handle.createWritable().then(function (w) {
          return w.write(blob).then(function () { return w.close(); });
        });
      }).then(function () {
        zipDoneModal('zipSavedOkTitle', 'zipSavedOkMsg', name);
      }).catch(function (err) {
        // 用户取消保存框就安静退出；权限/异常回退到默认下载
        if (err && err.name === 'AbortError') return;
        saveToDefault();
      });
      return;
    }
    saveToDefault();
  }

  function downloadZip(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    closeModal();
    toast(T('toastDownloadStarted'));
  }

  /* ================================================================== */
  /* 导入                                                               */
  /* ================================================================== */
  function handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        if (/\.json$/i.test(file.name)) {
          importJson(JSON.parse(new TextDecoder('utf-8').decode(reader.result)), []);
        } else {
          const entries = ZIP.read(reader.result);
          const jsonBytes = ZIP.find(entries, 'project.json');
          let data = null;
          if (jsonBytes) {
            try { data = JSON.parse(new TextDecoder('utf-8').decode(jsonBytes)); } catch (e) { data = null; }
          }
          importJson(data, entries.filter(function (e) { return !e.dir && e.name !== 'project.json'; }));
        }
      } catch (e) {
        toast(T('toastCantRead', { msg: e && e.message ? e.message : '-' }));
      }
    };
    reader.onerror = function () { toast(T('toastFileReadFail')); };
    reader.readAsArrayBuffer(file);
  }

  /**
   * 优先还原成 32k/16bit/单声道；已经是这个规格的 WAV 直接复用，
   * 其它格式（44.1k 的 wav、m4a、mp3）走一次解码重采样。
   */
  function bytesToWav(bytes, name) {
    if (/\.wav$/i.test(name) && bytes.length > 44) {
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (dv.getUint32(0, true) === 0x46464952 /* RIFF */) {
        const channels = dv.getUint16(22, true);
        const rate = dv.getUint32(24, true);
        const bits = dv.getUint16(34, true);
        if (channels === 1 && rate === VR.TARGET_RATE && bits === 16) {
          const blob = new Blob([bytes], { type: 'audio/wav' });
          const dataLen = bytes.length - 44;
          return Promise.resolve({ blob: blob, duration: dataLen / 2 / rate });
        }
      }
    }
    const file = new File([bytes], name || 'audio', { type: 'audio/*' });
    return VR.decodeFile(file);
  }

  function importJson(data, files) {
    if (!data || !data.project) {
      const wavs = files.filter(function (f) { return /\.wav$/i.test(f.name); });
      if (!wavs.length) { toast(T('toastNoProjectJson')); return; }
      data = {
        project: {
          id: 'p_import_' + Date.now(), nickname: T('importedRecordings'),
          speakerId: 'speaker', ageGroup: C.DEFAULT_AGE_GROUP, language: 'zh'
        },
        clips: []
      };
    }

    const meta = data.project;
    // 以当前版本为准：不认识的字段 / 旧版本备份直接丢弃，不做任何猜测
    if (!C.projectCompatible(meta)) {
      toast(T('toastUnknownDropped'));
      return;
    }
    const metas = Array.isArray(data.clips) ? data.clips : [];

    DB.getProject(meta.id).then(function (existing) {
      return existing || DB.createProject({
        id: meta.id,
        nickname: meta.nickname || T('importedRecordings'),
        speakerId: meta.speakerId || 'speaker',
        ageGroup: meta.ageGroup,
        language: meta.language,
        dialect: meta.dialect || '',
        purpose: meta.purpose || 'train',
        targetPath: meta.targetPath || ''
      });
    }).then(function (project) {
      return DB.getClips(project.id).then(function (old) {
        // 按时间戳去重，避免重复导入
        const seen = {};
        old.forEach(function (c) { seen[String(c.ts)] = true; });

        const jobs = metas.map(function (m) {
          if (seen[String(m.ts)]) return Promise.resolve(null);
          const bytes = m.file ? ZIP.find(files, m.file) : null;
          if (!bytes) {
            // 只导了 project.json（没有音频）：恢复文本，标记缺失，方便对着重录
            return DB.addClip({
              id: m.id, projectId: project.id, taskId: m.taskId, taskLabel: m.taskLabel,
              group: m.group || 'must', text: m.text || '', blob: null,
              duration: m.duration || 0, rate: VR.TARGET_RATE, ref: !!m.ref,
              source: m.source || 'record', ts: m.ts || Date.now(), missing: true
            });
          }
          return bytesToWav(bytes, m.file).then(function (res) {
            return DB.addClip({
              id: m.id, projectId: project.id, taskId: m.taskId, taskLabel: m.taskLabel,
              group: m.group || 'must', text: m.text || '', blob: res.blob,
              duration: res.duration || m.duration || 0, rate: VR.TARGET_RATE,
              ref: !!m.ref, source: m.source || 'record', ts: m.ts || Date.now()
            });
          });
        });

        // 包里有 project.json 没记录的音频（比如「仅导出音频」的包）
        const known = {};
        metas.forEach(function (m) { if (m.file) known[m.file] = true; });
        const baseTs = Date.now();
        files.filter(function (f) {
          return /^wavs\/[^/]+\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(f.name) && !known[f.name];
        }).forEach(function (f, i) {
          jobs.push(bytesToWav(f.data, f.name).then(function (res) {
            return DB.addClip({
              projectId: project.id, taskId: '', taskLabel: f.name.replace(/^.*\//, ''),
              group: 'import', text: '', blob: res.blob, duration: res.duration,
              rate: VR.TARGET_RATE, ref: false, source: 'import',
              ts: baseTs + i
            });
          }).catch(function () { return null; }));
        });

        return Promise.all(jobs).then(function (added) {
          const n = added.filter(Boolean).length;
          return { project: project, added: n };
        });
      });
    }).then(function (r) {
      upsertProject(r.project);
      return openProject(r.project).then(function () {
        if (r.added > 0) toast(T('toastRestoredN', { n: r.added }));
        else toast(T('toastAlreadyHere'));
      });
    }).catch(function (e) {
      toast(T('toastImportFail', { msg: e && e.message ? e.message : '-' }));
    });
  }

  /* ================================================================== */
  /* 页面 5：设置                                                       */
  /* ================================================================== */
  function viewSettings() {
    const ui = I18N.getUiLang();

    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-home">' + esc(T('crumbBack')) + '</button>' +
      '<span class="crumb-title">' + esc(T('settingsTitle')) + '</span>' +
      '<span></span></nav>';

    html += '<section class="card">' +
      '<h2>' + esc(T('langTitle')) + '</h2>' +
      '<p class="muted small">' + esc(T('langHint')) + '</p>' +
      '<div class="chips">' +
      '<label class="chip"><input type="radio" name="uiLang" value="zh"' + (ui === 'zh' ? ' checked' : '') + '><span>中文</span></label>' +
      '<label class="chip"><input type="radio" name="uiLang" value="en"' + (ui === 'en' ? ' checked' : '') + '><span>English</span></label>' +
      '</div>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>' + esc(T('cdSettingTitle')) + '</h2>' +
      '<p class="muted small">' + esc(T('cdSettingHint')) + '</p>' +
      '<div class="chips">' +
      [0, 1, 2, 3, 5].map(function (n) {
        const label = n === 0 ? T('cdOff') : T('cdSec', { n: n });
        return '<label class="chip"><input type="radio" name="recCountdown" value="' + n + '"' +
          (state.recCountdown === n ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
      }).join('') +
      '</div>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>' + esc(T('secTargetPath')) + '</h2>' +
      '<label class="field"><span>' + esc(T('fTargetPath')) + '</span>' +
      '<input type="text" id="f-path" value="' + esc(state.targetPath || defaultTargetPath()) + '"></label>' +
      '<p class="muted small">' + esc(T('targetPathHint')) + '</p>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>' + esc(T('secPrivacy')) + '</h2>' +
      '<p class="muted">' + esc(T('privacyLong')) + '</p>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>' + esc(T('secStorage')) + '</h2>' +
      '<p>' + (state.persisted
        ? esc(T('storageOk'))
        : esc(T('storageNotPersisted'))) + '</p>' +
      '<p class="muted small">' + esc(T('storageHint')) + '</p>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>' + esc(T('secInstall')) + '</h2>' +
      '<p class="muted">' + esc(T('installTitle')) + '</p>' +
      '<button class="btn ghost block" data-act="go-install">' + esc(T('btnHowToInstall')) + '</button>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>' + esc(T('secAbout')) + '</h2>' +
      '<p class="muted small">' + esc(C.APP.name) + ' · ' + esc(C.APP.nameEn) + '<br>' +
      esc(T('aboutVersion', { v: C.APP.version })) + '<br>' +
      esc(T('aboutAuthor', { a: C.APP.author, id: C.APP.authorId })) + '</p>' +
      '</section>';

    html += '<section class="card danger-zone">' +
      '<h2>' + esc(T('secDanger')) + '</h2>' +
      '<p class="muted">' + esc(T('dangerHint')) + '</p>' +
      '<button class="btn danger block" data-act="factory-reset">' + esc(T('btnClearAll')) + '</button>' +
      '</section>';

    html += footerHTML();
    return html;
  }

  /**
   * 恢复出厂设置
   * 清空 IndexedDB（项目 / 录音 / meta 里的各种「已关闭」标记），
   * 界面语言存在 localStorage 里、不属于 IndexedDB，也要一并清掉，
   * 然后重载页面，让所有内存状态回到初始值。
   * 注意：这次重载要回到首页，而不是按 URL hash 恢复回设置页。
   */
  function resetToFactory() {
    confirmModal(T('confirmClearTitle'),
      T('confirmClearBody'),
      T('confirmClearOk')).then(function (ok) {
        if (!ok) { closeModal(); return; }
        return DB.clearAll().then(function () {
          state.projects = [];
          state.project = null;
          state.clips = [];
          state.lastZip = null;
          state.installDismissed = false;
          state.privacyDismissed = false;
          try {
            localStorage.removeItem('va-ui-lang');
            localStorage.removeItem('va-rec-countdown');
          } catch (e) { /* 忽略 */ }
          closeModal();
          toast(T('toastCleared'));
          // 留一拍让 toast 显示出来，再回到初始状态
          setTimeout(function () {
            // 去掉 URL 里的 hash，避免这次重载被 routeFromHash 恢复回设置页
            try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* 忽略 */ }
            location.reload();
          }, 700);
        });
      });
  }

  /* ---------------- 安装引导 ---------------- */
  /**
   * 显示「添加到桌面」的操作步骤弹窗。
   * allowDismiss === false（设置页的「查看添加步骤」入口）时，不出现「以后不再提示」；
   * 首页按钮与第 2 次打开的自动弹窗才允许永久关闭，以便据此隐藏首页按钮。
   */
  function installGuide(allowDismiss) {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const steps = (isIos ? T('installStepsIos') : T('installStepsAndroid')).split('\n');
    openModal(
      '<h3 class="modal-title">' + esc(T('installTitle')) + '</h3>' +
      '<p class="modal-text muted">' + esc(isIos ? T('platformIos') : T('platformAndroid')) + '</p>' +
      '<ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="modal-text muted small">' + esc(T('installOptional')) + '</p>' +
      '<div class="modal-actions col">' +
      '<button class="btn primary" data-act="modal-close">' + esc(T('btnGotIt')) + '</button>' +
      (allowDismiss === false
        ? ''
        : '<button class="btn ghost" data-act="install-dismiss">' + esc(T('btnNeverAgain')) + '</button>') +
      '</div>'
    );
  }

  function dismissInstall() {
    state.installDismissed = true;
    DB.setMeta('installDismissed', true);
    closeModal();
    // 重渲染，让首页的「添加到桌面」按钮即时隐藏（设置页的查看步骤不受影响）
    render();
  }

  /* ================================================================== */
  /* 备份提醒                                                            */
  /* ================================================================== */
  function maybeRemindBackup() {
    if (state.backupMuted) return;
    // 已安装 PWA 的 10 句一提醒，没安装的 3 句一提醒
    const threshold = state.standalone ? 10 : 3;
    const n = unbackedCount();
    if (n < threshold) return;

    openModal(
      '<h3 class="modal-title">' + esc(T('remindTitle', { n: n })) + '</h3>' +
      '<p class="modal-text">' + esc(T('remindBody')) + '</p>' +
      '<div class="modal-actions col">' +
      '<button class="btn primary" data-act="backup-now">' + esc(T('btnSaveNow')) + '</button>' +
      '<button class="btn ghost" data-act="backup-later">' + esc(T('btnLater')) + '</button>' +
      '<button class="btn ghost" data-act="backup-mute">' + esc(T('btnMuteRemind')) + '</button>' +
      '</div>'
    );
  }

  /* ================================================================== */
  /* 事件                                                               */
  /* ================================================================== */
  function onAction(act, el) {
    switch (act) {
      case 'modal-close': closeModal(); break;
      case 'modal-yes':
        if (pendingConfirm) { const f = pendingConfirm; pendingConfirm = null; f(true); }
        break;
      case 'modal-no':
        if (pendingConfirm) { const f = pendingConfirm; pendingConfirm = null; f(false); }
        else closeModal();
        break;

      case 'go-home':
        // 回首页前重新拉一次列表：新录的进度、新建的项目都能立刻看到
        if (state.project) {
          refreshProjects().then(function () { go('home'); });
        } else {
          go('home');
        }
        break;
      case 'go-record': go('record'); break;
      case 'rec-guide': openRecGuide(); break;
      case 'go-manage': go('manage'); break;
      case 'go-export': go('export'); break;
      case 'go-settings': go('settings'); break;
      case 'go-install': installGuide(state.view !== 'settings'); break;
      case 'install-dismiss': dismissInstall(); break;
      case 'env-dismiss': dismissEnvBanner(); break;
      case 'dismiss-privacy': dismissPrivacy(); break;

      case 'new-project': newProjectForm(); break;
      case 'create-project': createProject(); break;
      case 'project-settings': projectSettingsForm(el.getAttribute('data-id')); break;
      case 'save-project-settings': saveProjectSettings(); break;
      case 'delete-project': deleteProject(); break;
      case 'open': {
        const id = el.getAttribute('data-id');
        const p = state.projects.filter(function (x) { return x.id === id; })[0];
        if (p) openProject(p);
        break;
      }
      case 'manage': {
        const id = el.getAttribute('data-id');
        const p = state.projects.filter(function (x) { return x.id === id; })[0];
        if (p) {
          state.project = p;
          state.tasks = buildProjectTasks(p);
          DB.getClips(p.id).then(function (clips) {
            state.clips = clips;
            go('manage');
          });
        }
        break;
      }

      case 'toggle-rec': toggleRecord(); break;
      case 'rerecord': rerecord(); break;
      case 'confirm-clip': confirmClip(); break;
      case 'discard-clip': discardClip(); break;
      case 'toggle-tasks': state.showTaskList = !state.showTaskList; render(); break;
      case 'toggle-resume': state.showResume = !state.showResume; render(); break;
      case 'toggle-idea': {
        // 「看看怎么说」示例开关：全局保持（切到下一句仍保持当前开/关状态），
        // 直到用户再次点击。只动当前卡片节点，不整页重渲染，避免打断录音。
        state.showIdeas = !state.showIdeas;
        const card = el.closest('.task-card');
        const tip = card && card.querySelector('.task-tip');
        const box = card && card.querySelector('.task-idea');
        if (tip) tip.hidden = state.showIdeas;
        if (box) box.hidden = !state.showIdeas;
        el.classList.toggle('active', state.showIdeas);
        el.setAttribute('aria-expanded', String(state.showIdeas));
        break;
      }
      case 'jump':
        if (state.countdown) clearCountdown();
        state.pending = null;
        state.cursor = parseInt(el.getAttribute('data-i'), 10);
        render();
        break;

      case 'play': playClip(el.getAttribute('data-id')); break;
      case 'edit-clip': editClip(el.getAttribute('data-id')); break;
      case 'save-edit': saveEdit(el.getAttribute('data-id')); break;
      case 'toggle-ref': toggleRef(el.getAttribute('data-id')); break;
      case 'del-clip': delClip(el.getAttribute('data-id')); break;
      case 'rerecord-clip': rerecordClip(el.getAttribute('data-id')); break;

      case 'export-full': doExport('full'); break;
      case 'export-audio': doExport('audio'); break;
      case 'do-download': if (state._dlFn) state._dlFn(); break;
      case 'share-again':
        if (state.lastZip) presentZip(state.lastZip.blob, state.lastZip.name);
        break;

      case 'backup-now': closeModal(); doExport('full'); break;
      case 'backup-later': closeModal(); break;
      case 'backup-mute': state.backupMuted = true; closeModal(); break;

      case 'factory-reset': resetToFactory(); break;
      default: break;
    }
  }

  function bindEvents() {
    document.addEventListener('click', function (e) {
      const el = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!el) return;
      const act = el.getAttribute('data-act');
      if (el.tagName === 'INPUT' && el.type === 'file') return;
      e.preventDefault();
      onAction(act, el);
    });

    document.addEventListener('change', function (e) {
      const el = e.target;
      if (!el) return;

      if (el.type === 'file') {
        const act = el.getAttribute('data-act');
        if (act === 'import') {
          if (el.files && el.files[0]) handleImport(el.files[0]);
          el.value = '';
        }
        return;
      }

      // 设置页：切换界面语言，立即生效并重绘
      if (el.type === 'radio' && el.name === 'uiLang') {
        I18N.setUiLang(el.value);
        applyDocLang();
        closeModal();
        render();
        return;
      }

      // 设置页：录音倒计时秒数（0=点了就开始），立即保存并刷新选中态
      if (el.type === 'radio' && el.name === 'recCountdown') {
        const v = parseInt(el.value, 10);
        state.recCountdown = isNaN(v) ? 0 : Math.min(5, Math.max(0, v));
        try { localStorage.setItem('va-rec-countdown', String(state.recCountdown)); } catch (e) { /* 忽略 */ }
        render();
        return;
      }

      // 设置页：电脑目标路径（全局，训练包 dataset.list 用），改动即存
      if (el.id === 'f-path') {
        state.targetPath = el.value.trim();
        DB.setMeta('targetPath', state.targetPath);
      }

      // 新建项目表单：语言 / 用途 切换时联动
      if (el.type === 'radio' && (el.name === 'language' || el.name === 'purpose')) {
        syncProjectForm();
      }
    });

    // 切到后台：iOS 会挂起音频上下文，自动收尾，别让已录内容丢掉
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        // 切到后台：倒计时还没开始就先取消，避免在后台偷偷开麦
        if (state.countdown) {
          clearCountdown();
          render();
        }
        if (state.recording) {
          stopRecord();
          toast(T('bgStopped'));
        }
      }
    });

    window.addEventListener('hashchange', function () {
      const v = routeFromHash().view;
      if (v !== state.view) {
        // 直接改 hash 时，保证必要的状态已就位
        if (v !== 'home' && v !== 'settings' && !state.project) go('home');
        else { state.view = v; render(); }
      }
    });

    // Esc 关闭弹窗
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modalEl().hidden) {
        if (pendingConfirm) { const f = pendingConfirm; pendingConfirm = null; f(false); }
        closeModal();
      }
    });
  }

  /* ================================================================== */
  /* 微信内置浏览器：能力受限，引导到系统浏览器                           */
  /* ================================================================== */
  function wechatGate() {
    if (!/micromessenger/i.test(navigator.userAgent)) return;
    openModal(
      '<h3 class="modal-title">' + esc(T('wechatTitle')) + '</h3>' +
      '<p class="modal-text">' + esc(T('wechatBody')) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn primary" data-act="modal-close">' + esc(T('btnTryAnyway')) + '</button>' +
      '</div>'
    );
  }

  /* ================================================================== */
  /* 环境横幅：无法录音时的常驻提示，手动关闭                              */
  /* ================================================================== */
  function secureOrigin() {
    return location.protocol === 'https:' ||
      location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }

  /** 返回无法录音的原因；能录音就返回 null */
  function envProblem() {
    if (VR.supported()) return null;
    if (!secureOrigin()) {
      return {
        title: T('envHttpTitle'),
        body: T('envHttpBody', { host: location.host })
      };
    }
    return {
      title: T('envGenericTitle'),
      body: T('envGenericBody')
    };
  }

  function envBanner() {
    const el = document.getElementById('env-banner');
    if (!el) return;
    const p = state.envDismissed ? null : envProblem();
    el.hidden = !p;
    el.innerHTML = p ? (
      '<div class="env-banner-inner">' +
      '<div class="env-banner-text">' +
      '<b class="env-banner-title">' + esc(p.title) + '</b>' +
      '<span class="env-banner-body">' + esc(p.body) + '</span>' +
      '</div>' +
      '<button type="button" class="env-banner-close" data-act="env-dismiss" aria-label="' + esc(T('envClose')) + '">✕</button>' +
      '</div>'
    ) : '';
  }

  function dismissEnvBanner() {
    state.envDismissed = true;
    const el = document.getElementById('env-banner');
    if (el) { el.hidden = true; el.innerHTML = ''; }
  }

  /** 首页隐私提示：关掉后写入 meta，之后不再显示 */
  function dismissPrivacy() {
    state.privacyDismissed = true;
    DB.setMeta('privacyDismissed', true);
    render();
  }

  /* ================================================================== */
  /* 初始化                                                             */
  /* ================================================================== */
  function detectStandalone() {
    return navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }

  function initPersistence() {
    if (!navigator.storage || !navigator.storage.persisted) return Promise.resolve(false);
    return navigator.storage.persisted().then(function (p) {
      if (p) return true;
      return navigator.storage.persist ? navigator.storage.persist() : false;
    }).catch(function () { return false; });
  }

  /**
   * 把项目同步进首页列表：新建 / 导入后不必刷新页面就能看到。
   * 已在列表里的只更新字段（列表按 updatedAt 排序，新建的排最前）。
   */
  function upsertProject(p) {
    let row = null;
    for (let i = 0; i < state.projects.length; i++) {
      if (state.projects[i].id === p.id) { row = state.projects[i]; break; }
    }
    if (!row) {
      row = { id: p.id, clipCount: 0, duration: 0 };
      state.projects.unshift(row);
    }
    ['nickname', 'speakerId', 'ageGroup', 'language', 'dialect', 'purpose', 'recGuideSeen',
      'createdAt', 'updatedAt', 'exportCount', 'lastBackupCount', 'targetPath']
      .forEach(function (k) {
        if (p[k] !== undefined) row[k] = p[k];
      });
    return row;
  }

  function refreshProjects() {
    return DB.listProjects().then(function (list) {
      // 本地库里不认识的旧数据直接丢弃并提示（projects + 其全部录音一起删）
      const bad = list.filter(function (p) { return !C.projectCompatible(p); });
      const good = list.filter(function (p) { return C.projectCompatible(p); });
      const cleanup = bad.length
        ? Promise.all(bad.map(function (p) { return DB.deleteProject(p.id); })).then(function () {
            toast(T('toastUnknownDropped'));
          })
        : Promise.resolve();
      return cleanup.then(function () {
        return Promise.all(good.map(function (p) {
          return DB.getClips(p.id).then(function (clips) {
            p.clipCount = clips.length;
            p.duration = clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
            return p;
          });
        }));
      });
    }).then(function (list) {
      state.projects = list;
      render();
    });
  }

  /** 读取录音倒计时设置（localStorage，非法值回退默认 2 秒） */
  function readRecCountdown() {
    try {
      const v = parseInt(localStorage.getItem('va-rec-countdown'), 10);
      if (!isNaN(v)) return Math.min(5, Math.max(0, v));
    } catch (e) { /* 忽略 */ }
    return 2;
  }

  function init() {
    state.standalone = detectStandalone();
    state.recCountdown = readRecCountdown();
    applyDocLang();
    bindEvents();

    // 第 1 层：申请持久化存储（静默，不打扰）
    initPersistence().then(function (ok) { state.persisted = !!ok; });

    // 预载「接下来怎么做.html」（zh / en），导出打包时直接可用；
    // 失败也没关系，导出前 ensureNextSteps 还会再兜底一次
    if (I18N.preloadNextSteps) I18N.preloadNextSteps().catch(function () {});

    // Service Worker：离线缓存
    if ('serviceWorker' in navigator) {
      const secure = location.protocol === 'https:' ||
        location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (secure) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('sw.js').catch(function () {});
        });
      }
    }

    DB.getMeta('installDismissed', false).then(function (v) {
      state.installDismissed = !!v;
      return DB.getMeta('privacyDismissed', false);
    }).then(function (v) {
      state.privacyDismissed = !!v;
      return DB.getMeta('targetPath', '');
    }).then(function (v) {
      state.targetPath = v || '';
      return DB.getMeta('openCount', 0);
    }).then(function (n) {
      state.openCount = (n || 0) + 1;
      return DB.setMeta('openCount', state.openCount);
    }).then(function () {
      return refreshProjects();
    }).then(function () {
      // 第 6 层：第 2 次打开才提示添加到桌面，可永久关闭
      if (state.openCount === 2 && !state.standalone && !state.installDismissed) {
        installGuide();
      } else if (/micromessenger/i.test(navigator.userAgent)) {
        wechatGate();
      }
    }).catch(function (e) {
      toast(T('toastInitFail', { msg: e.message }));
    });

    // 刷新恢复：首页 / 设置页直接渲染；
    // 项目内页面（record / manage / export）先以首页垫底，再按 hash 里的项目 id 异步恢复原页面
    const route = routeFromHash();
    state.view = (route.view === 'settings') ? 'settings' : 'home';
    render();
    envBanner();
    restoreRoute(route);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
