/*
 * app.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 主逻辑：路由、录音流程、素材管理、导出导入、备份提醒、游戏化。
 * 无框架、无构建工具，直接操作 DOM。
 */
(function () {
  'use strict';

  const C = window.Content;
  const DB = window.DB;
  const ZIP = window.ZIP;
  const VR = window.VoiceRecorder;

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
    pending: null,        // { task, blob, url, duration, text }
    recorder: null,
    player: null,
    playingId: null,
    persisted: false,
    standalone: false,
    openCount: 0,
    installDismissed: false,
    backupMuted: false,
    sinceBackup: 0,
    raf: 0,
    lastZip: null,
    showTaskList: false,
    _shareFn: null,
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
        '<button class="btn ghost" data-act="modal-no">取消</button>' +
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
    state.view = view;
    if (location.hash !== '#/' + view) {
      history.replaceState(null, '', '#/' + view);
    }
    render();
    window.scrollTo(0, 0);
  }

  function routeFromHash() {
    const v = (location.hash || '').replace('#/', '');
    return ['home', 'record', 'manage', 'export', 'settings'].indexOf(v) >= 0 ? v : 'home';
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
  }

  /* ================================================================== */
  /* 页脚伦理提示                                                        */
  /* ================================================================== */
  function footerHTML() {
    return '<footer class="ethics">' +
      C.FOOTER_NOTES.map(function (n) { return '<p>' + esc(n) + '</p>'; }).join('') +
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
      '<h1>声音留档</h1>' +
      '<p class="lede">把重要的人真实的声音，一句一句留下来。<br>' +
      '不是标准台词，是他平时说话的样子。</p>' +
      '</section>';

    html += '<section class="card privacy">' +
      '<p class="privacy-line">' + esc(C.TEXTS.privacyShort) + '</p>' +
      '</section>';

    html += '<section class="card resume">' +
      '<h2>继续上次录制</h2>' +
      '<p class="muted">之前导出过备份包？直接选回来，接着往下录。</p>' +
      '<label class="btn primary block file-btn">选择备份包（ZIP / project.json）' +
      '<input type="file" accept=".zip,.json,application/zip,application/json" data-act="import"></label>' +
      '</section>';

    html += '<section class="card"><h2>我的项目</h2>';
    if (!state.projects.length) {
      html += '<p class="muted empty">还没有项目。点下面的按钮，先建一个。</p>';
    } else {
      html += '<ul class="proj-list">';
      state.projects.forEach(function (p) {
        const g = C.ageGroup(p.ageGroup);
        const total = C.buildTasks(p.ageGroup, p.dialect).length;
        const done = Math.min(p.clipCount || 0, total);
        const pct = total ? Math.round(done / total * 100) : 0;
        const langTag = p.dialect || C.language(p.language).label;
        const isArchive = (p.purpose || 'train') === 'archive';
        html += '<li class="proj">' +
          '<div class="proj-head">' +
          '<span class="proj-name">' + esc(p.nickname) + '</span>' +
          '<span class="proj-tags">' +
          '<span class="tag">' + esc(g.label) + ' · ' + esc(langTag) + '</span>' +
          (isArchive ? '<span class="tag soft">只做存档</span>' : '') +
          '</span>' +
          '</div>' +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="proj-foot">' +
          '<span class="muted">已录 ' + done + ' / ' + total + ' 句' +
          (p.duration ? ' · ' + esc(fmtTotal(p.duration)) : '') + '</span>' +
          '<span class="proj-ops">' +
          '<button class="btn small primary" data-act="open" data-id="' + p.id + '">继续录制</button>' +
          '<button class="btn small ghost" data-act="manage" data-id="' + p.id + '">素材</button>' +
          '</span></div></li>';
      });
      html += '</ul>';
    }
    html += '<button class="btn primary block" data-act="new-project">＋ 新建项目</button>';
    html += '</section>';

    html += '<section class="card">' +
      '<button class="btn ghost block" data-act="go-settings">设置与隐私</button>' +
      '<button class="btn ghost block" data-act="go-install">添加到桌面</button>' +
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
      const lang = C.language(langEl.value);
      if (hintEl) hintEl.textContent = lang.hint || '';
      if (dWrap) dWrap.hidden = !lang.dialectable;
    }
    const pEl = document.querySelector('input[name=purpose]:checked');
    const pHint = document.getElementById('purpose-hint');
    const sWrap = document.getElementById('f-speaker-wrap');
    if (pEl) {
      const purpose = purposeOf(pEl.value);
      if (pHint) pHint.textContent = purpose.hint;
      // 只做存档的话不需要模型名
      if (sWrap) sWrap.hidden = purpose.id === 'archive';
    }
  }

  function purposeOf(id) {
    return C.PURPOSES.filter(function (x) { return x.id === id; })[0] || C.PURPOSES[0];
  }

  function newProjectForm() {
    const groups = C.AGE_GROUPS.map(function (g) {
      return '<label class="chip"><input type="radio" name="ageGroup" value="' + g.id + '"' +
        (g.id === 'adult' ? ' checked' : '') + '><span>' + esc(g.label + '（' + g.range + '）') + '</span></label>';
    }).join('');
    const langs = C.LANGUAGES.map(function (l, i) {
      return '<label class="chip"><input type="radio" name="language" value="' + l.code + '"' +
        (i === 0 ? ' checked' : '') + '><span>' + esc(l.label) + '</span></label>';
    }).join('');
    const purposes = C.PURPOSES.map(function (p, i) {
      return '<label class="chip"><input type="radio" name="purpose" value="' + p.id + '"' +
        (i === 0 ? ' checked' : '') + '><span>' + esc(p.label) + '</span></label>';
    }).join('');

    openModal(
      '<h3 class="modal-title">新建项目</h3>' +
      '<div class="form">' +
      '<label class="field"><span>被录制人的昵称</span>' +
      '<input type="text" id="f-nickname" placeholder="例如：奶奶 / 小满" maxlength="20"></label>' +
      '<div class="field"><span>年龄段</span><div class="chips">' + groups + '</div></div>' +
      '<div class="field"><span>主要语言</span><div class="chips">' + langs + '</div>' +
      '<p class="muted small" id="lang-hint"></p></div>' +
      '<label class="field" id="f-dialect-wrap" hidden><span>具体是哪种话（选填）</span>' +
      '<input type="text" id="f-dialect" placeholder="例如：四川话 / 闽南语 / 上海话" maxlength="20"></label>' +
      '<div class="field"><span>打算拿这些录音做什么</span><div class="chips">' + purposes + '</div>' +
      '<p class="muted small" id="purpose-hint"></p></div>' +
      '<label class="field" id="f-speaker-wrap"><span>模型名（只能用英文字母和数字）</span>' +
      '<input type="text" id="f-speaker" placeholder="例如：nainai" maxlength="24"></label>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-act="modal-close">取消</button>' +
      '<button class="btn primary" data-act="create-project">创建</button>' +
      '</div>'
    );
    setTimeout(syncProjectForm, 0);
  }

  function createProject() {
    const nickname = (document.getElementById('f-nickname').value || '').trim();
    if (!nickname) { toast('先填个昵称吧'); return; }

    const speakerRaw = (document.getElementById('f-speaker').value || '').trim();
    const speakerId = speakerRaw.replace(/[^a-zA-Z0-9_]/g, '') || ('speaker' + pad(1, 2));
    const ageGroup = (document.querySelector('input[name=ageGroup]:checked') || {}).value || 'adult';
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
      closeModal();
      return openProject(p);
    }).catch(function (e) {
      toast('创建失败：' + e.message);
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

  function openProject(p) {
    state.project = p;
    state.tasks = C.buildTasks(p.ageGroup, p.dialect);
    state.pending = null;
    state.showTaskList = false;
    state.sinceBackup = 0;
    stopPlay();
    return DB.getClips(p.id).then(function (clips) {
      state.clips = clips;
      state.cursor = firstIncomplete();
      go('record');
    });
  }

  /** 还没有备份的句数 */
  function unbackedCount() {
    const backed = state.project ? (state.project.lastBackupCount || 0) : 0;
    return Math.max(0, state.clips.length - backed);
  }

  function viewRecord() {
    const p = state.project;
    if (!p) return viewHome();
    const g = C.ageGroup(p.ageGroup);
    const task = state.tasks[state.cursor];
    const total = state.tasks.length;
    const done = doneCount();
    const unbacked = unbackedCount();

    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-home">‹ 项目</button>' +
      '<span class="crumb-title">' + esc(p.nickname) + '</span>' +
      '<button class="btn tiny ghost" data-act="go-manage">素材</button>' +
      '</nav>';

    // 常驻安全状态指示条：持续可见，但不弹窗打断
    html += '<div class="safety ' + (unbacked > 0 ? 'warn' : 'ok') + '">' +
      (unbacked > 0 ? '⚠️ 有 ' + unbacked + ' 句还没备份' : '🔒 已备份') +
      '</div>';

    html += '<section class="note ' + (g.highlight ? 'strong' : '') + '">' +
      '<h3>' + esc(g.label + '（' + g.range + '）') + ' · 注意</h3>' +
      '<ul>' + g.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
      '<p class="note-dur">建议时长：' + esc(g.duration) + '</p>' +
      '</section>';

    const dNote = C.dialectNote(p.dialect);
    if (dNote) {
      html += '<section class="note"><p class="dialect-note">' + esc(dNote) + '</p></section>';
    }

    html += '<section class="progress-head">' +
      '<span class="muted">第 ' + (state.cursor + 1) + ' / ' + total + ' 句 · 已完成 ' + done + ' 句</span>' +
      '<div class="bar thin"><i style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></i></div>' +
      '</section>';

    html += '<section class="task-card">' +
      '<p class="task-group">' + esc(task.groupTitle) + '</p>' +
      '<h2 class="task-label">' + esc(task.label) + '</h2>' +
      (task.tip ? '<p class="task-tip">' + esc(task.tip) + '</p>' : '') +
      '</section>';

    if (g.kid && done > 0) {
      html += '<section class="card kid-progress">' + stickerRow(done) + '</section>';
    }

    if (done >= total && !state.pending) {
      const secs = state.clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
      html += '<section class="card done-card">' +
        '<h2>都录完了</h2>' +
        '<p>你一共留下了 <b>' + done + '</b> 句话，总时长 <b>' + esc(fmtTotal(secs)) + '</b>。</p>' +
        '<p class="muted small">还想再录，点上面的句子补一条；够了就去导出。</p>' +
        '<button class="btn primary block" data-act="go-export">去导出</button>' +
        '<button class="btn ghost block" data-act="go-manage">看看素材</button>' +
        '</section>';
    } else if (state.pending) {
      html += reviewHTML();
    } else {
      html += recorderHTML();
    }

    html += '<section class="card">' +
      '<button class="btn ghost block" data-act="toggle-tasks">' +
      (state.showTaskList ? '收起全部句子' : '查看全部句子（' + total + ' 句）') + '</button>';
    if (state.showTaskList) {
      html += '<ul class="task-list">';
      state.tasks.forEach(function (t, i) {
        const c = clipFor(t.id);
        html += '<li class="' + (i === state.cursor ? 'current ' : '') + (c ? 'done' : '') + '">' +
          '<button class="task-jump" data-act="jump" data-i="' + i + '">' +
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
    return '<section class="recorder">' +
      '<canvas id="wave" class="wave"></canvas>' +
      '<div class="level">' +
      '<div class="level-bar"><i id="level-fill"></i><span class="zone"></span></div>' +
      '<p class="level-text" id="level-text">点下面的按钮开始</p>' +
      '</div>' +
      '<p class="timer" id="timer">0:00</p>' +
      '<button class="rec-btn' + (state.recording ? ' on' : '') + '" data-act="toggle-rec">' +
      '<span class="rec-dot"></span>' +
      '<span class="rec-label">' + (state.recording ? '停止' : '开始录音') + '</span>' +
      '</button>' +
      '<p class="hint">' + esc(state.recording ? C.TEXTS.backgroundWarning : '录完会自动播放，你当场把这句话敲下来') + '</p>' +
      '</section>';
  }

  function reviewHTML() {
    const pd = state.pending;
    return '<section class="review">' +
      '<p class="review-title">听一下刚才那句</p>' +
      '<audio id="preview" controls preload="auto" src="' + pd.url + '"></audio>' +
      '<label class="field"><span>这句话说的是什么（当场敲下来最准）</span>' +
      '<textarea id="clip-text" rows="3" placeholder="一个字不差地写下来">' +
      esc(pd.text || '') + '</textarea></label>' +
      '<div class="row">' +
      '<button class="btn ghost" data-act="rerecord">重录</button>' +
      '<button class="btn primary" data-act="confirm-clip">保存，下一句</button>' +
      '</div>' +
      '</section>';
  }

  /* ---------------- 录音控制 ---------------- */
  function ensureRecorder() {
    if (!state.recorder) state.recorder = new VR.Recorder();
    return state.recorder;
  }

  function toggleRecord() {
    if (state.recording) stopRecord();
    else startRecord();
  }

  function startRecord() {
    if (!VR.supported()) {
      toast('当前浏览器不支持录音，请用 Safari 或 Chrome 打开');
      return;
    }
    ensureRecorder().start().then(function () {
      state.recording = true;
      render();
      startMeter();
    }).catch(function (e) {
      toast(e && e.message ? e.message : '打不开麦克风，检查一下浏览器权限');
    });
  }

  function stopRecord() {
    const rec = ensureRecorder();
    rec.stop().then(function (res) {
      state.recording = false;
      stopMeter();
      if (!res || !res.duration || res.duration < 0.3) {
        toast('这句太短了，再来一次');
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
      // 播放完立刻聚焦文本框：录音时人就在现场，当场记录比任何 ASR 都准
      const audio = document.getElementById('preview');
      if (audio) {
        audio.play().catch(function () {});
        audio.addEventListener('ended', function () {
          const t = document.getElementById('clip-text');
          if (t) t.focus();
        });
      }
    });
  }

  function rerecord() {
    if (state.pending && state.pending.url) URL.revokeObjectURL(state.pending.url);
    state.pending = null;
    render();
    startRecord();
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

      if (C.ageGroup(state.project.ageGroup).kid) celebrate();

      const next = nextIncompleteFrom(state.cursor + 1);
      if (next != null) state.cursor = next;

      DB.updateProject(state.project.id, { updatedAt: Date.now() });
      render();
      maybeRemindBackup();
    }).catch(function (e) {
      toast('保存失败：' + e.message);
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
        if (db < -27) text.textContent = '离近一点';
        else if (db > -15) text.textContent = '离远一点';
        else text.textContent = '音量正好';
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

  /* ---------------- 儿童项目的游戏化 ---------------- */
  function celebrate() {
    const wrap = document.createElement('div');
    wrap.className = 'confetti';
    const colors = ['#C89B3C', '#B9603C', '#4A5D4E', '#8FA37E', '#D9A05B'];
    for (let i = 0; i < 18; i++) {
      const bit = document.createElement('i');
      bit.style.left = (Math.random() * 100) + '%';
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (Math.random() * 0.25) + 's';
      bit.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      wrap.appendChild(bit);
    }
    document.body.appendChild(wrap);
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 1700);
  }

  function stickerRow(done) {
    const shapes = ['★', '❋', '✿', '☾', '✦', '❤'];
    const unlocked = Math.min(6, Math.floor(done / 5));
    let html = '<div class="stickers">';
    for (let i = 0; i < 6; i++) {
      html += '<span class="sticker' + (i < unlocked ? ' on' : '') + '">' + shapes[i] + '</span>';
    }
    html += '</div>';
    html += '<p class="muted center small">每 5 句解锁一张贴纸，已经收集 ' + unlocked + ' 张</p>';
    return html;
  }

  /* ================================================================== */
  /* 页面 3：素材管理                                                    */
  /* ================================================================== */
  function viewManage() {
    const p = state.project;
    if (!p) return viewHome();
    const total = state.clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
    const g = C.ageGroup(p.ageGroup);

    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-record">‹ 录音</button>' +
      '<span class="crumb-title">' + esc(p.nickname) + ' · 素材</span>' +
      '<button class="btn tiny ghost" data-act="go-export">导出 ›</button>' +
      '</nav>';

    html += '<section class="card stat">' +
      '<p>共 <b>' + state.clips.length + '</b> 段 · 总时长 <b>' + esc(fmtTotal(total)) + '</b></p>' +
      '<p class="muted small">1 分钟只是最低要求，5 分钟以上会好很多</p>' +
      '</section>';

    if (g.kid) html += '<section class="card">' + stickerRow(state.clips.length) + '</section>';

    html += '<section class="card">' +
      '<label class="btn ghost block file-btn">从手机导入已有音频（微信语音、旧录音）' +
      '<input type="file" accept="audio/*" multiple data-act="import-audio"></label>' +
      '</section>';

    if (!state.clips.length) {
      html += '<section class="card"><p class="muted empty">还没有素材。</p></section>';
    } else {
      html += '<ul class="clip-list">';
      state.clips.forEach(function (c, i) {
        html += '<li class="clip">' +
          '<div class="clip-head">' +
          '<span class="clip-no">' + pad(i + 1, 3) + '</span>' +
          '<span class="clip-label">' + esc(c.taskLabel || '导入的音频') + '</span>' +
          '<span class="clip-dur">' + esc(fmtDuration(c.duration)) + '</span>' +
          '</div>' +
          (c.missing
            ? '<p class="clip-text warn-text">音频缺失，需要重录</p>'
            : '<p class="clip-text">' + (c.text ? esc(c.text) : '<i class="muted">还没写文本</i>') + '</p>') +
          '<div class="clip-ops">' +
          '<button class="btn tiny ghost" data-act="play" data-id="' + c.id + '">' +
          (state.playingId === c.id ? '停止' : '试听') + '</button>' +
          '<button class="btn tiny ghost" data-act="rerecord-clip" data-id="' + c.id + '">重录</button>' +
          '<button class="btn tiny ghost" data-act="edit-clip" data-id="' + c.id + '">改文本</button>' +
          '<button class="btn tiny ' + (c.ref ? 'primary' : 'ghost') + '" data-act="toggle-ref" data-id="' + c.id + '">' +
          (c.ref ? '★ 参考音频' : '☆ 设为参考') + '</button>' +
          '<button class="btn tiny danger-ghost" data-act="del-clip" data-id="' + c.id + '">删除</button>' +
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
    if (!c || !c.blob) { toast('这段没有音频，需要重录'); return; }
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
    a.play().catch(function () { stopPlay(); toast('播放失败'); });
    render();
  }

  function editClip(id) {
    const c = state.clips.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    openModal(
      '<h3 class="modal-title">修改文本</h3>' +
      '<div class="form"><label class="field"><span>' + esc(c.taskLabel || '导入的音频') + '</span>' +
      '<textarea id="edit-text" rows="3">' + esc(c.text || '') + '</textarea></label></div>' +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-act="modal-close">取消</button>' +
      '<button class="btn primary" data-act="save-edit" data-id="' + c.id + '">保存</button>' +
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
      toast('已保存');
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
    confirmModal('删除这一段？',
      '「' + esc(c.taskLabel || '导入的音频') + '」会被删掉，删了就找不回来了。',
      '删除').then(function (ok) {
        if (!ok) { closeModal(); return; }
        return DB.deleteClip(id).then(function () {
          state.clips = state.clips.filter(function (x) { return x.id !== id; });
          closeModal();
          render();
          toast('已删除');
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
      setTimeout(startRecord, 80);
    } else {
      toast('这是导入的音频，删掉后用对应任务重录');
    }
  }

  function importAudio(files) {
    const list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    toast('正在处理 ' + list.length + ' 个文件…');
    const jobs = list.map(function (file) {
      return VR.decodeFile(file).then(function (res) {
        return DB.addClip({
          projectId: state.project.id,
          taskId: '',
          taskLabel: file.name,
          group: 'import',
          text: '',
          blob: res.blob,
          duration: res.duration,
          rate: VR.TARGET_RATE,
          ref: false,
          source: 'import'
        }).then(function (c) { state.clips.push(c); });
      }).catch(function () { /* 跳过读不出来的文件 */ });
    });
    Promise.all(jobs).then(function () {
      state.clips.sort(function (a, b) { return a.ts - b.ts; });
      render();
      toast('导入完成');
    });
  }

  /* ================================================================== */
  /* 页面 4：导出                                                       */
  /* ================================================================== */
  function viewExport() {
    const p = state.project;
    if (!p) return viewHome();
    const total = state.clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
    const refs = state.clips.filter(function (c) { return c.ref; });
    const purpose = purposeOf(p.purpose);
    const isArchive = purpose.id === 'archive';
    const langText = p.dialect || C.language(p.language).label;

    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-manage">‹ 素材</button>' +
      '<span class="crumb-title">' + esc(p.nickname) + ' · 导出</span>' +
      '<button class="btn tiny ghost" data-act="go-home">项目</button>' +
      '</nav>';

    html += '<section class="card">' +
      '<h2>' + (isArchive ? '存档包里有什么' : '训练包里有什么') + '</h2>' +
      '<p class="muted small">用途：' + esc(purpose.label) +
      ' · 语言：' + esc(langText) + '</p>' +
      '<ul class="tree">' +
      '<li><b>wavs/</b> ' + state.clips.length + ' 个 32kHz / 16bit / 单声道 WAV</li>' +
      (isArchive ? '' :
        '<li><b>dataset.list</b> 标注文件</li>' +
        '<li><b>references/</b> ' + refs.length + ' 段参考音频</li>' +
        '<li><b>接下来怎么做.txt</b> 电脑上的操作说明</li>') +
      '<li><b>project.json</b> 项目备份，可重新导入</li>' +
      '</ul>' +
      (isArchive
        ? '<p class="muted small">纯音频存档，不含训练相关的标注文件。</p>'
        : '') +
      '<p class="muted small">总时长 ' + esc(fmtTotal(total)) +
      (total < 60 ? ' · 还偏少，建议再录一些' : '') + '</p>' +
      '</section>';

    if (!isArchive) {
      html += '<section class="card">' +
        '<label class="field"><span>电脑上的目标路径（用来生成 dataset.list 里的绝对路径）</span>' +
        '<input type="text" id="f-path" placeholder="E:\\GPT-SoVITS\\" value="' + esc(p.targetPath || '') + '"></label>' +
        '<p class="muted small">填你打算在电脑上解压到的文件夹，例如 D:\\voice\\ 或 E:\\GPT-SoVITS\\。' +
        '路径里尽量不要有中文和空格。</p>' +
        '</section>';
    }

    html += '<section class="card">' +
      (isArchive
        ? '<button class="btn primary block" data-act="export-audio">导出音频存档包</button>' +
          '<button class="btn ghost block" data-act="export-full">也导出一份训练包</button>'
        : '<button class="btn primary block" data-act="export-full">导出完整训练包</button>' +
          '<button class="btn ghost block" data-act="export-audio">仅导出音频（高级用户自己处理）</button>') +
      '</section>';

    if (!isArchive && refs.length === 0) {
      html += '<section class="card tip-card">' +
        '<p>还没有标记参考音频。回到「素材」页，挑 3-10 秒说得最自然的几段，' +
        '点「设为参考」，训练时效果会好很多。</p></section>';
    }

    if (state.lastZip) {
      html += '<section class="card">' +
        '<p class="muted small">刚才生成的：' + esc(state.lastZip.name) + '</p>' +
        '<button class="btn ghost block" data-act="share-again">再分享 / 下载一次</button>' +
        '</section>';
    }

    html += footerHTML();
    return html;
  }

  function normalizePath(p) {
    let s = (p || '').trim();
    if (!s) s = 'E:\\GPT-SoVITS\\';
    s = s.replace(/\//g, '\\');
    if (s.slice(-1) !== '\\') s += '\\';
    return s;
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
    const pathEl = document.getElementById('f-path');
    const base = normalizePath(pathEl ? pathEl.value : p.targetPath);
    const batch = (p.exportCount || 0) + 1;
    const name = '声音留档-' + p.nickname + '-批次' + batch + '-' + dateStamp() + '.zip';

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
        listLines.push(base + 'wavs\\' + fname + '|' + p.speakerId + '|' + lang + '|' + text);
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
      zip.add('接下来怎么做.txt', C.NEXT_STEPS);
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
        purpose: p.purpose || 'train', targetPath: base,
        createdAt: p.createdAt, exportCount: batch
      },
      clips: metas
    }, null, 2));

    return { zip: zip, name: name, batch: batch, base: base, count: audioCount };
  }

  function doExport(mode) {
    const p = state.project;
    if (!state.clips.length) { toast('还没有素材可以导出'); return; }
    const pathEl = document.getElementById('f-path');
    if (pathEl) {
      // 目标路径随手即存，页面重绘后也不会丢
      DB.updateProject(p.id, { targetPath: pathEl.value.trim() });
    }

    toast('正在打包…');
    // 让浏览器先把 toast 画出来，再做重活
    setTimeout(function () {
      readClips().then(function (items) {
        if (!items.length) { toast('没有可用的音频'); return null; }
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
      }).catch(function (e) {
        toast('打包失败：' + (e && e.message ? e.message : '未知错误'));
      });
    }, 40);
  }

  function presentZip(blob, name) {
    let file = null;
    try {
      file = new File([blob], name, { type: 'application/zip' });
    } catch (e) { file = null; }
    const canShare = !!(navigator.canShare && file && navigator.canShare({ files: [file] }));

    state._shareFn = function () {
      if (!canShare) { downloadZip(blob, name); return; }
      navigator.share({
        files: [file],
        title: '声音留档备份',
        text: '声音留档 · ' + name
      }).then(function () {
        closeModal();
        toast('已保存');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        downloadZip(blob, name);
      });
    };
    state._dlFn = function () { downloadZip(blob, name); };

    if (canShare) {
      openModal(
        '<h3 class="modal-title">打包好了</h3>' +
        '<p class="modal-text">' + esc(name) + '</p>' +
        '<p class="modal-text muted">推荐分享到微信「文件传输助手」，' +
        '在电脑上直接就能拿到。</p>' +
        '<div class="modal-actions col">' +
        '<button class="btn primary" data-act="do-share">分享到微信 / 备忘录</button>' +
        '<button class="btn ghost" data-act="do-download">直接下载到手机</button>' +
        '</div>'
      );
    } else {
      downloadZip(blob, name);
    }
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
    toast('已开始下载');
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
        toast('读不出来：' + (e && e.message ? e.message : '文件可能已损坏'));
      }
    };
    reader.onerror = function () { toast('文件读取失败'); };
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
      if (!wavs.length) { toast('这个包里没有 project.json，也没有找到音频'); return; }
      data = {
        project: {
          id: 'p_import_' + Date.now(), nickname: '导入的录音',
          speakerId: 'speaker', ageGroup: 'adult', language: 'zh'
        },
        clips: []
      };
    }

    const meta = data.project;
    const metas = data.clips || [];

    DB.getProject(meta.id).then(function (existing) {
      return existing || DB.createProject({
        id: meta.id,
        nickname: meta.nickname || '导入的录音',
        speakerId: meta.speakerId || 'speaker',
        ageGroup: meta.ageGroup || 'adult',
        language: meta.language || 'zh',
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
      return openProject(r.project).then(function () {
        if (r.added > 0) toast('已恢复 ' + r.added + ' 句录音');
        else toast('这个备份包里的内容都在了');
      });
    }).catch(function (e) {
      toast('导入失败：' + (e && e.message ? e.message : '未知错误'));
    });
  }

  /* ================================================================== */
  /* 页面 5：设置                                                       */
  /* ================================================================== */
  function viewSettings() {
    let html = '<nav class="crumbs">' +
      '<button class="btn tiny ghost" data-act="go-home">‹ 返回</button>' +
      '<span class="crumb-title">设置与隐私</span>' +
      '<span></span></nav>';

    html += '<section class="card">' +
      '<h2>隐私</h2>' +
      '<p class="muted">' + esc(C.TEXTS.privacyLong) + '</p>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>存储状态</h2>' +
      '<p>' + (state.persisted
        ? '🔒 已获得持久化存储权限，浏览器不会优先清理本应用的数据。'
        : esc(C.TEXTS.storageNotPersisted)) + '</p>' +
      '<p class="muted small">无论上面显示什么，最可靠的做法都是：每次录完就导出一份。</p>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>添加到桌面</h2>' +
      '<p class="muted">' + esc(C.TEXTS.installTitle) + '</p>' +
      '<button class="btn ghost block" data-act="go-install">查看添加步骤</button>' +
      '</section>';

    html += '<section class="card">' +
      '<h2>关于</h2>' +
      '<p class="muted small">' + esc(C.APP.name) + ' · ' + esc(C.APP.nameEn) +
      '（' + esc(C.APP.slug) + '）<br>' +
      '版本 ' + esc(C.APP.version) + '<br>' +
      '作者 ' + esc(C.APP.author) + '（' + esc(C.APP.authorId) + '）<br>' +
      '纯前端实现，无框架、无依赖、无网络请求。</p>' +
      '</section>';

    html += '<section class="card danger-zone">' +
      '<h2>清空数据</h2>' +
      '<p class="muted">删除这台设备上保存的所有项目和录音。删了就找不回来了。</p>' +
      '<button class="btn danger block" data-act="clear-all">一键清空所有数据</button>' +
      '</section>';

    html += footerHTML();
    return html;
  }

  function clearAll() {
    confirmModal('清空所有数据？',
      '所有项目和录音都会被删掉，<b>无法恢复</b>。<br>如果还没导出备份，建议先返回去导出一份。',
      '确认清空').then(function (ok) {
        if (!ok) { closeModal(); return; }
        return DB.clearAll().then(function () {
          state.projects = [];
          state.project = null;
          state.clips = [];
          state.lastZip = null;
          closeModal();
          go('home');
          toast('已清空');
        });
      });
  }

  /* ---------------- 安装引导 ---------------- */
  function installGuide() {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const steps = isIos ? C.TEXTS.installIos : C.TEXTS.installAndroid;
    openModal(
      '<h3 class="modal-title">' + esc(C.TEXTS.installTitle) + '</h3>' +
      '<p class="modal-text muted">' + (isIos ? 'iPhone / iPad（Safari）' : '安卓（Chrome）') + '</p>' +
      '<ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="modal-text muted small">不添加也能用，只是录音被系统清理的风险更高一些。</p>' +
      '<div class="modal-actions col">' +
      '<button class="btn primary" data-act="modal-close">知道了</button>' +
      '<button class="btn ghost" data-act="install-dismiss">以后不再提示</button>' +
      '</div>'
    );
  }

  function dismissInstall() {
    state.installDismissed = true;
    DB.setMeta('installDismissed', true);
    closeModal();
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
      '<h3 class="modal-title">已经录了 ' + n + ' 句啦</h3>' +
      '<p class="modal-text">要不要先发给自己存一份？长时间不打开的话，' +
      '系统可能会把这些录音清掉。</p>' +
      '<div class="modal-actions col">' +
      '<button class="btn primary" data-act="backup-now">立即保存</button>' +
      '<button class="btn ghost" data-act="backup-later">稍后</button>' +
      '<button class="btn ghost" data-act="backup-mute">本次不再提醒</button>' +
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

      case 'go-home': go('home'); break;
      case 'go-record': go('record'); break;
      case 'go-manage': go('manage'); break;
      case 'go-export': go('export'); break;
      case 'go-settings': go('settings'); break;
      case 'go-install': installGuide(); break;
      case 'install-dismiss': dismissInstall(); break;

      case 'new-project': newProjectForm(); break;
      case 'create-project': createProject(); break;
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
          state.tasks = C.buildTasks(p.ageGroup, p.dialect);
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
      case 'toggle-tasks': state.showTaskList = !state.showTaskList; render(); break;
      case 'jump': state.pending = null; state.cursor = parseInt(el.getAttribute('data-i'), 10); render(); break;

      case 'play': playClip(el.getAttribute('data-id')); break;
      case 'edit-clip': editClip(el.getAttribute('data-id')); break;
      case 'save-edit': saveEdit(el.getAttribute('data-id')); break;
      case 'toggle-ref': toggleRef(el.getAttribute('data-id')); break;
      case 'del-clip': delClip(el.getAttribute('data-id')); break;
      case 'rerecord-clip': rerecordClip(el.getAttribute('data-id')); break;

      case 'export-full': doExport('full'); break;
      case 'export-audio': doExport('audio'); break;
      case 'do-share': if (state._shareFn) state._shareFn(); break;
      case 'do-download': if (state._dlFn) state._dlFn(); break;
      case 'share-again':
        if (state.lastZip) presentZip(state.lastZip.blob, state.lastZip.name);
        break;

      case 'backup-now': closeModal(); doExport('full'); break;
      case 'backup-later': closeModal(); break;
      case 'backup-mute': state.backupMuted = true; closeModal(); break;

      case 'clear-all': clearAll(); break;
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
        } else if (act === 'import-audio') {
          importAudio(el.files);
          el.value = '';
        }
        return;
      }

      // 新建项目表单：语言 / 用途 切换时联动
      if (el.type === 'radio' && (el.name === 'language' || el.name === 'purpose')) {
        syncProjectForm();
      }
    });

    // 切到后台：iOS 会挂起音频上下文，自动收尾，别让已录内容丢掉
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state.recording) {
        stopRecord();
        toast('已切到后台，录音自动停止了');
      }
    });

    window.addEventListener('hashchange', function () {
      const v = routeFromHash();
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
      '<h3 class="modal-title">' + esc(C.TEXTS.wechatTitle) + '</h3>' +
      '<p class="modal-text">' + esc(C.TEXTS.wechatBody) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn primary" data-act="modal-close">我就试试看</button>' +
      '</div>'
    );
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

  function refreshProjects() {
    return DB.listProjects().then(function (list) {
      return Promise.all(list.map(function (p) {
        return DB.getClips(p.id).then(function (clips) {
          p.clipCount = clips.length;
          p.duration = clips.reduce(function (s, c) { return s + (c.duration || 0); }, 0);
          return p;
        });
      }));
    }).then(function (list) {
      state.projects = list;
      render();
    });
  }

  function init() {
    state.standalone = detectStandalone();
    bindEvents();

    // 第 1 层：申请持久化存储（静默，不打扰）
    initPersistence().then(function (ok) { state.persisted = !!ok; });

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
      toast('初始化失败：' + e.message);
    });

    const v = routeFromHash();
    state.view = (v !== 'home' && !state.project) ? 'home' : v;
    render();

    if (!VR.supported()) {
      toast('当前环境不支持录音，请用 Safari 或 Chrome 打开');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
