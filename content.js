/*
 * content.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 内容结构层：年龄段 / 必录清单 / 语言选项的「结构 + 元数据」，
 * 以及把清单与引导问题组装成录音任务队列的逻辑。
 *
 * 文案不在本文件：每种语言的完整文案在 i18n/zh.js、i18n/en.js 的 guide 段，
 * 运行时按（项目语言 / 界面语言）从 I18N.guide(lang) 读取；
 * 「接下来怎么做.txt」是独立文档 nextsteps/*.txt，导出时由 I18N 提供。
 */
window.Content = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 应用元信息                                                          */
  /* ------------------------------------------------------------------ */
  const APP = {
    name: '声音留档',
    nameEn: 'Voice Archive',
    slug: 'voice-archive',          // 连字符形式，用于文件名 / manifest id
    author: '火车啦啦',
    authorId: 'hcllmsx',
    authorUrl: 'https://space.bilibili.com/255947051',
    repo: 'https://github.com/hcllmsx/voice-archive',
    version: '1.0.0'
  };

  /* ------------------------------------------------------------------ */
  /* 语言选项 · 结构/元数据                                              */
  /* code 是选项的唯一 id（存进项目、写进 project.json）；                 */
  /* train 是导出给 GPT-SoVITS 的训练语种代码（省略时默认 = code）。       */
  /*                                                                    */
  /* GPT-SoVITS 只认 zh / yue / en / ja / ko，所以不能让用户自定义。      */
  /* 除粤语外，中文方言在训练侧没有独立代码，一律按 zh 导出 ——            */
  /* 模型学到的就是带口音的那把声音，这正是想要的效果。                    */
  /* 「具体是哪种话」只是给人看的备注，写进 project 但不给模型。           */
  /* label / hint 文案在语言包 guide.languages。                          */
  /* ------------------------------------------------------------------ */
  const LANGUAGES = [
    { code: 'zh', train: 'zh' },
    {
      code: 'zh-dialect',
      train: 'zh',
      dialectable: true
    },
    { code: 'yue', train: 'yue' },
    { code: 'en', train: 'en' },
    { code: 'ja', train: 'ja' },
    { code: 'ko', train: 'ko' }
  ];

  /* ------------------------------------------------------------------ */
  /* 项目用途 · 结构/元数据（文案在语言包 guide.purposes）                */
  /* ------------------------------------------------------------------ */
  const PURPOSES = [
    { id: 'train' },
    { id: 'archive' }
  ];

  /* ------------------------------------------------------------------ */
  /* 年龄段 · 结构/元数据                                                */
  /* highlight = true 的年龄段，录音页顶部横幅用醒目样式                  */
  /* kid       = true 启用游戏化（收集贴纸 + 鼓励动画）                   */
  /* label / range / duration / notes / questions 在语言包 guide.ageGroups */
  /* ------------------------------------------------------------------ */
  const AGE_GROUPS = [
    { id: 'toddler', highlight: true, kid: true },
    { id: 'child', highlight: false, kid: true },
    { id: 'teen', highlight: true, kid: false },
    { id: 'adult', highlight: false, kid: false },
    { id: 'elder', highlight: true, kid: false }
  ];

  /* ------------------------------------------------------------------ */
  /* 基础工具                                                            */
  /* ------------------------------------------------------------------ */

  /** 按 id（LANGUAGES 用 code 作唯一键）在结构数组里找项；找不到回退 fallback（默认第一项） */
  function byId(list, key, fallback) {
    for (let i = 0; i < list.length; i++) {
      const k = list[i].id !== undefined ? list[i].id : list[i].code;
      if (k === key) return list[i];
    }
    return fallback || list[0];
  }

  /** 某语言的引导内容包（core 已保证回退 zh，不会为 null） */
  function guide(lang) {
    return (window.I18N && window.I18N.guide) ? window.I18N.guide(lang) : {};
  }

  function arr(o) { return o || []; }

  /** 元数据 + 语言包文本合并成一份完整对象 */
  function merge(meta, t) {
    const out = {};
    Object.keys(meta).forEach(function (k) { out[k] = meta[k]; });
    Object.keys(t).forEach(function (k) { if (t[k] !== undefined) out[k] = t[k]; });
    return out;
  }

  /** 用带 {d} 占位的模板生成方言相关文案；无模板时回退 fallback */
  function tpl(uiObj, key, d, fallback) {
    const t = (uiObj && uiObj[key]) ? uiObj[key] : fallback;
    return (t == null ? '' : t).split('{d}').join(d);
  }

  /* ------------------------------------------------------------------ */
  /* 取数：结构 + 语言包合并                                             */
  /* ------------------------------------------------------------------ */

  /** 按 id 取年龄段（lang 决定 label/range/duration/notes/questions） */
  function ageGroup(id, lang) {
    const base = byId(AGE_GROUPS, id, AGE_GROUPS[3]);
    const t = (guide(lang).ageGroups || {})[base.id] || {};
    return merge(base, t);
  }

  /** 按 code 取语言（lang 决定 label/hint；train/dialectable 始终可用） */
  function language(code, lang) {
    const base = byId(LANGUAGES, code, LANGUAGES[0]);
    const t = (guide(lang).languages || {})[base.code] || {};
    return merge(base, t);
  }

  /** 按 id 取项目用途（lang 决定 label/hint） */
  function purpose(id, lang) {
    const base = byId(PURPOSES, id, PURPOSES[0]);
    const t = (guide(lang).purposes || {})[base.id] || {};
    return merge(base, t);
  }

  /** 导出给 GPT-SoVITS 用的训练语种代码 */
  function trainCode(code) {
    const l = byId(LANGUAGES, code, LANGUAGES[0]);
    return l.train || l.code;
  }

  /* ------------------------------------------------------------------ */
  /* 组装录音任务队列                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * 录音页顶部追加的方言提示（给操作者看，lang = 界面语言）
   * 只有填了方言才返回内容
   */
  function dialectNote(dialect, lang) {
    const d = (dialect || '').trim();
    if (!d) return '';
    return tpl(guide(lang).ui, 'dialectNote', d, '');
  }

  /**
   * 组装某个项目的录音任务队列
   * 顺序：必录清单（逐条展开）→ 引导问题
   * @param guideLang 引导问题的语言（念给被录者听的，跟随项目主要语言）
   * @param uiLang    分组标题 / 提示的语言（给操作者看的，跟随界面语言）
   * @returns {Array<{id:string,group:string,groupTitle:string,label:string,tip:string}>}
   */
  function buildTasks(groupId, dialect, guideLang, uiLang) {
    const gl = guideLang || 'zh';
    const ui = uiLang || gl;
    const base = byId(AGE_GROUPS, groupId, AGE_GROUPS[3]);
    const d = (dialect || '').trim();

    const glP = guide(gl);            // 念给被录者（引导语言）
    const uiP = guide(ui);            // 给操作者（界面语言）
    const glCheck = arr(glP.checklist);
    const uiCheck = arr(uiP.checklist);
    const glBy = {};
    glCheck.forEach(function (g) { glBy[g.id] = g; });
    const uiMeta = uiP.ui || {};

    // 组顺序跟随「界面语言」包（zh / en 两包结构一致）
    const groups = uiCheck.map(function (item) {
      const glItem = glBy[item.id] || item;
      let hint = item.hint || '';
      const tasks = arr(glItem.tasks).map(function (t, i) {
        let tip = t.tip || hint;
        if (item.id === 'dialect' && d) {
          // 方言被填了就点明用什么话讲；模板语言跟随操作者的界面语言
          tip = i === 0
            ? tpl(uiMeta, 'dialectTipFirst', d, tip)
            : tpl(uiMeta, 'dialectTipRest', d, tip);
        }
        return { t: t, tip: tip };
      });
      if (item.id === 'dialect' && d) {
        hint = tpl(uiMeta, 'dialectGroupHint', d, hint);
      }
      return { item: item, hint: hint, tasks: tasks };
    });

    // 说了方言的话，把方言组提到前面（紧跟口头禅）：它们都是语言指纹
    if (d) {
      let idx = -1;
      for (let i = 0; i < groups.length; i++) {
        if (groups[i].item.id === 'dialect') { idx = i; break; }
      }
      if (idx > 1) {
        const moved = groups.splice(idx, 1)[0];
        groups.splice(1, 0, moved);
      }
    }

    const tasks = [];
    groups.forEach(function (grp) {
      grp.tasks.forEach(function (entry, i) {
        tasks.push({
          id: 'must.' + grp.item.id + '.' + i,
          group: 'must',
          groupTitle: grp.item.title,
          label: entry.t.label,
          tip: entry.tip
        });
      });
    });

    const qGroup = (glP.ageGroups || {})[base.id] || {};
    arr(qGroup.questions).forEach(function (q, i) {
      tasks.push({
        id: 'guide.' + base.id + '.' + i,
        group: 'guide',
        groupTitle: uiMeta.chatGroupTitle || '',
        label: q,
        tip: uiMeta.guideTaskTip || ''
      });
    });
    return tasks;
  }

  /* ------------------------------------------------------------------ */
  /* 导出包里「接下来怎么做.txt」：独立静态文档，由 i18n 提供             */
  /* ------------------------------------------------------------------ */
  function nextSteps(lang) {
    if (window.I18N && window.I18N.nextStepsText) return window.I18N.nextStepsText(lang);
    return '';
  }

  return {
    APP: APP,
    LANGUAGES: LANGUAGES,
    PURPOSES: PURPOSES,
    AGE_GROUPS: AGE_GROUPS,
    ageGroup: ageGroup,
    language: language,
    purpose: purpose,
    trainCode: trainCode,
    buildTasks: buildTasks,
    dialectNote: dialectNote,
    nextSteps: nextSteps
  };
})();
