/*
 * i18n/core.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 多语言核心：
 *   1. 界面语言（UI）—— 操作者看的，中 / 英可切换，存 localStorage；
 *   2. 引导内容语言 —— 念给被录者听的（引导问题、必录任务），跟随项目的主要语言，
 *      只有提供完整 guide 的语言才会被采用（目前 zh / en），否则回退中文。
 *
 * 语言数据不在本文件：见 i18n/zh.js、i18n/en.js（每语言一个文件，注册到 window.I18N_LANGS）。
 * 取词统一走 I18N.T(key, vars)，{name} 占位；缺 key 回退中文，再缺回退 key 本身。
 *
 * 「接下来怎么做.html」是独立静态文档（nextsteps/next-steps.zh.html / .en.html），
 * 导出打包前用 fetch 拉进内存，见 preloadNextSteps / ensureNextSteps。
 */
window.I18N = (function () {
  'use strict';

  const LANGS = window.I18N_LANGS || {};
  const LANG_KEY = 'va-ui-lang';

  /* 拥有完整界面文案的语言（按注册顺序；zh 始终是兜底档） */
  const UI_LANGS = Object.keys(LANGS).filter(function (k) {
    return LANGS[k] && LANGS[k].ui;
  });

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && UI_LANGS.indexOf(saved) >= 0) return saved;
    } catch (e) { /* 隐私模式等，忽略 */ }
    const nav = (navigator.language || '').toLowerCase();
    for (let i = 0; i < UI_LANGS.length; i++) {
      if (nav.indexOf(UI_LANGS[i]) === 0) return UI_LANGS[i];
    }
    return UI_LANGS.indexOf('en') >= 0 ? 'en' : (UI_LANGS[0] || 'zh');
  }

  let uiLang = detectLang();

  function getUiLang() { return uiLang; }

  function setUiLang(l) {
    uiLang = (UI_LANGS.indexOf(l) >= 0) ? l : (UI_LANGS.indexOf('zh') >= 0 ? 'zh' : UI_LANGS[0]);
    try { localStorage.setItem(LANG_KEY, uiLang); } catch (e) { /* 忽略 */ }
    return uiLang;
  }

  /** 某语言的语言包（未定义时回退 zh；都没有则空对象） */
  function pack(lang) {
    return (LANGS[lang] || LANGS.zh) || {};
  }

  /** 某语言的引导内容包；非法语言回退 zh，保证不为 null */
  function guide(lang) {
    return pack(lang).guide || {};
  }

  /** 取词：{name} 占位；当前语言缺 key 回退中文，再缺回退 key 本身 */
  function T(key, vars) {
    let s = pack(uiLang).ui && pack(uiLang).ui[key];
    if (s == null) s = pack('zh').ui && pack('zh').ui[key];
    if (s == null) s = key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  /**
   * 引导内容语言：项目主要语言 → 有完整 guide 就用它，否则回退中文。
   * 以后补日韩翻译时，新建 i18n/ja.js（含 guide）并在 index.html 引入即可。
   */
  function guideLang(projectLanguage) {
    const g = (projectLanguage !== 'zh' && LANGS[projectLanguage]) ? LANGS[projectLanguage].guide : null;
    return (g && g.ageGroups) ? projectLanguage : 'zh';
  }

  /* ------------------------------------------------------------------ */
  /* 「接下来怎么做.html」独立静态文档                                  */
  /* 页面启动时 preload；导出打包前 ensure，保证内容已就绪               */
  /* ------------------------------------------------------------------ */
  const NEXT_STEPS_FILES = {
    zh: 'nextsteps/next-steps.zh.html',
    en: 'nextsteps/next-steps.en.html'
  };
  const nextCache = {};

  function fetchText(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    });
  }

  /** 确保某个语言版本的文档已在内存（返回是否成功） */
  function ensureNextSteps(lang) {
    const key = lang === 'en' ? 'en' : 'zh';
    if (nextCache[key] != null) return Promise.resolve(true);
    return fetchText(NEXT_STEPS_FILES[key]).then(function (t) {
      nextCache[key] = t;
      return true;
    }).catch(function () { return false; });
  }

  /** 启动时静默预载两篇文档，失败不影响使用（导出时还有 ensure 兜底） */
  function preloadNextSteps() {
    return Promise.all([ensureNextSteps('zh'), ensureNextSteps('en')]).then(function () {});
  }

  /** 同步取当前已加载的文档文本；未加载返回 ''（调用方应先 ensure） */
  function nextStepsText(lang) {
    const v = nextCache[lang === 'en' ? 'en' : 'zh'];
    return v == null ? '' : v;
  }

  return {
    T: T,
    getUiLang: getUiLang,
    setUiLang: setUiLang,
    guideLang: guideLang,
    guide: guide,
    preloadNextSteps: preloadNextSteps,
    ensureNextSteps: ensureNextSteps,
    nextStepsText: nextStepsText
  };
})();
