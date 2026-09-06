/*
 * content.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 内容结构层：年龄段 / 必录清单 / 语言选项的「结构 + 元数据」，
 * 以及把清单与引导问题组装成录音任务队列的逻辑。
 *
 * 文案不在本文件：每种语言的完整文案在 i18n/zh.js、i18n/en.js 的 guide 段，
 * 运行时按（项目语言 / 界面语言）从 I18N.guide(lang) 读取；
 * 「接下来怎么做.html」是独立文档 nextsteps/*.html，导出时由 I18N 提供。
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
    // 应用版本号：设置页「关于」与导出 project.json 均读取此字段。
    // 发版时无需手改：编辑根目录 VERSION 文件后运行 sync-version.bat，
    // 会自动同步此字段，并让 sw.js 的缓存桶使用同一版本号。
    version: '26.9.6'
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
  /* label / range / duration / notes / questions 在语言包 guide.ageGroups */
  /* ------------------------------------------------------------------ */
  const AGE_GROUPS = [
    { id: 'toddler', highlight: true },
    { id: 'child', highlight: false },
    { id: 'teen', highlight: true },
    { id: 'youngAdult', highlight: false },
    { id: 'midlife', highlight: false },
    { id: 'elder', highlight: true }
  ];

  /** 默认年龄段（新建项目 / 数据缺失时兜底），取青年成年组 */
  const DEFAULT_AGE_GROUP = 'youngAdult';

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

  /** 结构数组里是否存在某个 id/code（不含兜底） */
  function hasId(list, key) {
    for (let i = 0; i < list.length; i++) {
      const k = list[i].id !== undefined ? list[i].id : list[i].code;
      if (k === key) return true;
    }
    return false;
  }

  /** 默认年龄段的元数据项（只在结构里兜底用，正常路径不会触发） */
  function defaultAgeMeta() {
    return byId(AGE_GROUPS, DEFAULT_AGE_GROUP, AGE_GROUPS[0]);
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
    const base = byId(AGE_GROUPS, id, defaultAgeMeta());
    const t = (guide(lang).ageGroups || {})[base.id] || {};
    return merge(base, t);
  }

  /**
   * 判断一条项目数据是否被当前版本认识：
   * 年龄段 / 语言 / 用途的 id 都要在当前结构里（purpose 缺失时按默认 train 算）。
   * 不认识的一律视为旧版本 / 未知数据，调用方直接丢弃并提示，不做任何猜测。
   */
  function projectCompatible(p) {
    if (!p || !p.id) return false;
    return hasId(AGE_GROUPS, p.ageGroup) &&
      hasId(LANGUAGES, p.language) &&
      hasId(PURPOSES, p.purpose == null ? 'train' : p.purpose);
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
   * @param groupId   年龄段 id
   * @param langCode  项目主要语言 code（zh / zh-dialect / yue / en / ja / ko）
   * @param dialect   用户填的具体方言（如「四川话」，仅普通话项目才可能出现）
   * @param guideLang 引导问题的语言（念给被录者听的，跟随项目主要语言）
   * @param uiLang    分组标题 / 提示的语言（给操作者看的，跟随界面语言）
   * @returns {Array<{id,group,groupTitle,label,tip,idea}>}
   *   idea 是「给点思路 / 示例答案」（可选），有值时录音页才显示展开按钮
   *
   * 必录清单里的「方言 / 家乡话」组是普通话项目的特色（普通话语料里掺一两句
   * 家乡话当点缀）；整个项目本来就在讲方言或外语（zh-dialect / yue / en / ja / ko）
   * 时这一组会让被录者摸不着头脑，直接跳过。
   */
  function buildTasks(groupId, langCode, dialect, guideLang, uiLang) {
    const gl = guideLang || 'zh';
    const ui = uiLang || gl;
    const base = byId(AGE_GROUPS, groupId, defaultAgeMeta());
    const d = (dialect || '').trim();
    const keepDialectGroup = !langCode || langCode === 'zh';

    const glP = guide(gl);            // 念给被录者（引导语言）
    const uiP = guide(ui);            // 给操作者（界面语言）
    const glCheck = arr(glP.checklist);
    const uiCheck = arr(uiP.checklist);
    const glBy = {};
    glCheck.forEach(function (g) { glBy[g.id] = g; });
    const uiMeta = uiP.ui || {};

    // 组顺序跟随「界面语言」包（zh / en 两包结构一致）
    const groups = [];
    uiCheck.forEach(function (item) {
      if (item.id === 'dialect' && !keepDialectGroup) return;   // 跳过家乡话组
      const glItem = glBy[item.id] || item;
      let hint = item.hint || '';
      const tasks = arr(glItem.tasks).map(function (t, i) {
        // 兼容字符串或 { label, tip, idea } 对象
        const to = (t && typeof t === 'object') ? t : { label: t };
        let tip = to.tip || hint;
        if (item.id === 'dialect' && d) {
          // 方言被填了就点明用什么话讲；模板语言跟随操作者的界面语言
          tip = i === 0
            ? tpl(uiMeta, 'dialectTipFirst', d, tip)
            : tpl(uiMeta, 'dialectTipRest', d, tip);
        }
        return { to: to, tip: tip };
      });
      if (item.id === 'dialect' && d) {
        hint = tpl(uiMeta, 'dialectGroupHint', d, hint);
      }
      groups.push({ item: item, hint: hint, tasks: tasks });
    });

    const tasks = [];
    groups.forEach(function (grp) {
      grp.tasks.forEach(function (entry, i) {
        tasks.push({
          id: 'must.' + grp.item.id + '.' + i,
          group: 'must',
          groupTitle: grp.item.title,
          label: entry.to.label,
          tip: entry.tip,
          idea: entry.to.idea || ''
        });
      });
    });

    const qGroup = (glP.ageGroups || {})[base.id] || {};
    arr(qGroup.questions).forEach(function (q, i) {
      // 兼容字符串或 { q, idea } 对象
      const qo = (q && typeof q === 'object') ? q : { q: q };
      tasks.push({
        id: 'guide.' + base.id + '.' + i,
        group: 'guide',
        groupTitle: uiMeta.chatGroupTitle || '',
        label: qo.q,
        tip: uiMeta.guideTaskTip || '',
        idea: qo.idea || ''
      });
    });
    return tasks;
  }

  /* ------------------------------------------------------------------ */
  /* 导出包里「接下来怎么做.html」：独立静态文档，由 i18n 提供           */
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
    DEFAULT_AGE_GROUP: DEFAULT_AGE_GROUP,
    ageGroup: ageGroup,
    language: language,
    purpose: purpose,
    trainCode: trainCode,
    projectCompatible: projectCompatible,
    buildTasks: buildTasks,
    dialectNote: dialectNote,
    nextSteps: nextSteps
  };
})();
