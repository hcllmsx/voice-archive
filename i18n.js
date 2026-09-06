/*
 * i18n.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 多语言层：
 *   1. 界面语言（UI）  —— 操作者看的，中 / 英可切换，存 localStorage；
 *   2. 引导内容语言    —— 念给被录者听的（引导问题、必录任务），跟随项目的主要语言。
 *                         目前 en 有完整翻译；ja / ko 暂回退中文，翻译补进 GUIDE_EN 即可。
 *
 * 取词统一走 T(key, vars)，{name} 占位；缺 key 回退中文，再缺回退 key 本身。
 */
window.I18N = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 界面文案字典                                                        */
  /* ------------------------------------------------------------------ */
  const UI = {
    zh: {
      appTitle: '声音留档',
      langTitle: '界面语言',
      langHint: '只切换界面文字。录音引导问题使用项目里选的「主要语言」。',

      /* 首页 */
      heroLede: '把重要的人真实的声音，一句一句留下来。<br>不是标准台词，是他平时说话的样子。',
      resumeTitle: '继续上次录制',
      resumeHint: '之前导出过备份包？直接选回来，接着往下录。',
      pickBackup: '选择备份包（ZIP / project.json）',
      myProjects: '我的项目',
      noProjects: '还没有项目。点下面的按钮，先建一个。',
      tagArchiveOnly: '只做存档',
      recordedN: '已录 {done} / {total} 句',
      btnContinue: '继续录制',
      btnClips: '素材',
      btnNewProject: '＋ 新建项目',
      btnSettings: '设置与隐私',
      btnInstall: '添加到桌面',

      /* 新建项目 */
      newProjectTitle: '新建项目',
      fNickname: '被录制人的昵称',
      phNickname: '例如：奶奶 / 小满',
      fAgeGroup: '年龄段',
      fLanguage: '主要语言',
      fDialect: '具体是哪种话（选填）',
      phDialect: '例如：四川话 / 闽南语 / 上海话',
      fPurpose: '打算拿这些录音做什么',
      fSpeaker: '模型名（只能用英文字母和数字）',
      phSpeaker: '例如：nainai',
      btnCancel: '取消',
      btnCreate: '创建',
      toastNeedNickname: '先填个昵称吧',
      toastCreateFail: '创建失败：{msg}',

      /* 录音页 */
      crumbProjects: '‹ 项目',
      unbackedN: '⚠️ 有 {n} 句还没备份',
      backedOk: '🔒 已备份',
      notesTitle: '注意',
      suggestedDuration: '建议时长：{d}',
      progressN: '第 {cur} / {total} 句 · 已完成 {done} 句',
      allDone: '都录完了',
      allDoneBody: '你一共留下了 <b>{n}</b> 句话，总时长 <b>{total}</b>。',
      allDoneHint: '还想再录，点上面的句子补一条；够了就去导出。',
      btnExport: '去导出',
      btnViewClips: '看看素材',
      hideAllLines: '收起全部句子',
      showAllLines: '查看全部句子（{n} 句）',
      levelStart: '点下面的按钮开始',
      btnStop: '停止',
      btnStartRec: '开始录音',
      hintIdle: '录完会自动播放，你当场把这句话敲下来',
      recWarning: '请不要锁屏或切走，切到后台录音会中断',
      reviewTitle: '听一下刚才那句',
      fClipText: '这句话说的是什么（当场敲下来最准）',
      phClipText: '一个字不差地写下来',
      btnRerecord: '重录',
      btnSaveNext: '保存，下一句',
      toastNoRecHere: '当前环境不能录音，页面上方有原因说明',
      toastMicFail: '打不开麦克风，检查一下浏览器权限',
      micPrepFail: '当前环境不能调用麦克风：请确认网址是 https://，并用系统浏览器（Chrome / Edge / Safari）打开',
      audioDecodeFail: '这个音频格式读不出来，试试转成 wav 或 m4a',
      toastTooShort: '这句太短了，再来一次',
      toastSaveFail: '保存失败：{msg}',
      levelCloser: '离近一点',
      levelFarther: '离远一点',
      levelGood: '音量正好',
      stickerHint: '每 5 句解锁一张贴纸，已经收集 {n} 张',

      /* 素材页 */
      crumbRecord: '‹ 录音',
      crumbClipsSuffix: ' · 素材',
      crumbExport: '导出 ›',
      statLine: '共 <b>{n}</b> 段 · 总时长 <b>{total}</b>',
      statHint: '1 分钟只是最低要求，5 分钟以上会好很多',
      importAudioBtn: '从手机导入已有音频（微信语音、旧录音）',
      noClips: '还没有素材。',
      importedAudio: '导入的音频',
      clipMissing: '音频缺失，需要重录',
      noTextYet: '还没写文本',
      btnPlay: '试听',
      btnEditText: '改文本',
      btnIsRef: '★ 参考音频',
      btnSetRef: '☆ 设为参考',
      btnDelete: '删除',
      editClipTitle: '修改文本',
      btnSave: '保存',
      toastSaved: '已保存',
      confirmDelClip: '删除这一段？',
      confirmDelClipBody: '「{label}」会被删掉，删了就找不回来了。',
      confirmDel: '删除',
      toastDeleted: '已删除',
      toastNoAudio: '这段没有音频，需要重录',
      toastPlayFail: '播放失败',
      toastImportedClip: '这是导入的音频，删掉后用对应任务重录',
      toastProcessingN: '正在处理 {n} 个文件…',
      toastImportDone: '导入完成',

      /* 导出页 */
      crumbClipsBack: '‹ 素材',
      crumbExportSuffix: ' · 导出',
      crumbProjectsPlain: '项目',
      exportFullTitle: '训练包里有什么',
      exportArchiveTitle: '存档包里有什么',
      exportPurpose: '用途：{p}',
      exportLang: '语言：{l}',
      wavCount: '{n} 个 32kHz / 16bit / 单声道 WAV',
      datasetDesc: '标注文件',
      refsDesc: '{n} 段参考音频',
      nextStepsDesc: '电脑上的操作说明',
      projectJsonDesc: '项目备份，可重新导入',
      archiveOnlyNote: '纯音频存档，不含训练相关的标注文件。',
      exportTotal: '总时长 {total}',
      tooShortHint: ' · 还偏少，建议再录一些',
      fTargetPath: '电脑上的目标路径（用来生成 dataset.list 里的绝对路径）',
      targetPathHint: '填你打算在电脑上解压到的文件夹，例如 D:\\voice\\ 或 E:\\GPT-SoVITS\\。路径里尽量不要有中文和空格。',
      btnExportArchive: '导出音频存档包',
      btnAlsoFull: '也导出一份训练包',
      btnExportFull: '导出完整训练包',
      btnAudioOnly: '仅导出音频（高级用户自己处理）',
      noRefTip: '还没有标记参考音频。回到「素材」页，挑 3-10 秒说得最自然的几段，点「设为参考」，训练时效果会好很多。',
      lastZip: '刚才生成的：{name}',
      btnShareAgain: '再分享 / 下载一次',
      toastNothingToExport: '还没有素材可以导出',
      toastPacking: '正在打包…',
      toastNoAudioExport: '没有可用的音频',
      toastPackFail: '打包失败：{msg}',
      zipName: '声音留档-{name}-批次{n}-{date}.zip',
      nextStepsFile: '接下来怎么做.txt',
      packedTitle: '打包好了',
      packedTip: '推荐分享到微信「文件传输助手」，在电脑上直接就能拿到。',
      btnShare: '分享到微信 / 备忘录',
      btnDownload: '直接下载到手机',
      shareTitle: '声音留档备份',
      toastDownloadStarted: '已开始下载',

      /* 导入 */
      toastCantRead: '读不出来：{msg}',
      toastFileReadFail: '文件读取失败',
      toastNoProjectJson: '这个包里没有 project.json，也没有找到音频',
      importedRecordings: '导入的录音',
      toastRestoredN: '已恢复 {n} 句录音',
      toastAlreadyHere: '这个备份包里的内容都在了',
      toastImportFail: '导入失败：{msg}',

      /* 设置页 */
      crumbBack: '‹ 返回',
      settingsTitle: '设置与隐私',
      secPrivacy: '隐私',
      secStorage: '存储状态',
      storageOk: '🔒 已获得持久化存储权限，浏览器不会优先清理本应用的数据。',
      storageHint: '无论上面显示什么，最可靠的做法都是：每次录完就导出一份。',
      secInstall: '添加到桌面',
      btnHowToInstall: '查看添加步骤',
      secAbout: '关于',
      aboutVersion: '版本 {v}',
      aboutAuthor: '作者 {a}（{id}）',
      aboutTech: '纯前端实现，无框架、无依赖、无网络请求。',
      secDanger: '恢复出厂设置',
      dangerHint: '清除这台设备上的所有项目、录音和设置，回到刚安装时的状态。',
      btnClearAll: '一键恢复出厂设置',
      confirmClearTitle: '恢复出厂设置？',
      confirmClearBody: '会清除这台设备上的<b>全部内容</b>并回到初始状态：<br>' +
        '· 所有项目和录音<br>' +
        '· 已关闭的提示（隐私提示、添加到桌面提醒）<br>' +
        '· 界面语言回到跟随系统<br>' +
        '<b>无法恢复</b>。如果还没导出备份，建议先返回去导出一份。',
      confirmClearOk: '确认恢复',
      toastCleared: '已恢复出厂设置',

      /* 安装引导 */
      platformIos: 'iPhone / iPad（Safari）',
      platformAndroid: '安卓（Chrome / Edge）',
      installOptional: '不添加也能用，只是录音被系统清理的风险更高一些。',
      btnGotIt: '知道了',
      btnNeverAgain: '以后不再提示',

      /* 备份提醒 */
      remindTitle: '已经录了 {n} 句啦',
      remindBody: '要不要先发给自己存一份？长时间不打开的话，系统可能会把这些录音清掉。',
      btnSaveNow: '立即保存',
      btnLater: '稍后',
      btnMuteRemind: '本次不再提醒',

      /* 微信 */
      btnTryAnyway: '我就试试看',

      /* 环境 */
      bgStopped: '已切到后台，录音自动停止了',
      envHttpTitle: '这个页面不是 https://，麦克风被浏览器禁用了',
      envHttpBody: '当前地址是「{host}」。浏览器只允许 https://（或 localhost）页面调用麦克风，所以 Edge、Chrome、Safari 在这里都无法录音。请改用部署后的正式 https:// 链接访问；本地调试请用 http://localhost。',
      envGenericTitle: '当前浏览器无法录音',
      envGenericBody: '这个浏览器（或应用内网页）缺少调用麦克风所需的能力。请复制本页网址，换系统浏览器打开——Chrome、Edge、Safari 都可以。',
      envClose: '关闭提示',

      /* 通用 */
      toastInitFail: '初始化失败：{msg}',
      modalCancel: '取消',
      footerNote1: '录制他人声音需本人知情同意',
      footerNote2: '声音是生物特征，请谨慎保管导出的文件',

      /* 内容文案（原 content.TEXTS） */
      privacyShort: '你的录音只存在这台设备上，我们无法访问，请放心使用',
      privacyClose: '关闭提示',
      privacyLong: '录音保存在这台设备的浏览器里，不上传任何服务器，也没有任何统计和埋点。清理浏览器数据、或长时间不打开本应用，都可能导致录音丢失。建议每次录完就导出一份。',
      storageNotPersisted: '系统未授予持久化存储权限，浏览器在空间紧张时可能优先清理本应用的数据。建议勤导出备份。',
      installTitle: '添加到桌面后，录音就不会被系统清理了',
      installStepsIos: '点 Safari 底部的「分享」按钮（方框向上箭头）\n向下滑，找到「添加到主屏幕」\n点右上角「添加」',
      installStepsAndroid: '点浏览器右上角「⋮」（Chrome / Edge）\n选「添加到主屏幕」或「安装应用」\n确认',
      wechatTitle: '请在浏览器中打开',
      wechatBody: '微信里打不开录音功能。请点右上角「···」→「在浏览器中打开」，然后就能正常使用了。'
    },

    en: {
      appTitle: 'Voice Archive',
      langTitle: 'Interface language',
      langHint: 'Switches the interface only. Recording prompts follow the project\'s main language.',

      heroLede: 'Preserve the real voice of someone you love, line by line.<br>Not rehearsed lines — the way they actually talk.',
      resumeTitle: 'Continue where you left off',
      resumeHint: 'Exported a backup before? Import it here and keep recording.',
      pickBackup: 'Choose backup (ZIP / project.json)',
      myProjects: 'My projects',
      noProjects: 'No projects yet. Tap the button below to create one.',
      tagArchiveOnly: 'Archive only',
      recordedN: '{done} / {total} recorded',
      btnContinue: 'Continue',
      btnClips: 'Clips',
      btnNewProject: '＋ New project',
      btnSettings: 'Settings & privacy',
      btnInstall: 'Add to Home screen',

      newProjectTitle: 'New Project',
      fNickname: 'Their nickname',
      phNickname: 'e.g. Grandma / Amy',
      fAgeGroup: 'Age group',
      fLanguage: 'Main language',
      fDialect: 'Which dialect? (optional)',
      phDialect: 'e.g. Sichuanese / Hokkien / Shanghainese',
      fPurpose: 'What will you do with these recordings',
      fSpeaker: 'Model name (letters and numbers only)',
      phSpeaker: 'e.g. grandma',
      btnCancel: 'Cancel',
      btnCreate: 'Create',
      toastNeedNickname: 'Please enter a nickname first',
      toastCreateFail: 'Failed to create: {msg}',

      crumbProjects: '‹ Projects',
      unbackedN: '⚠️ {n} clip(s) not backed up',
      backedOk: '🔒 Backed up',
      notesTitle: 'Notes',
      suggestedDuration: 'Suggested duration: {d}',
      progressN: 'Clip {cur} / {total} · {done} done',
      allDone: 'All done!',
      allDoneBody: 'You\'ve preserved <b>{n}</b> clips, <b>{total}</b> in total.',
      allDoneHint: 'Want more? Tap a line above to add one. Done? Go export.',
      btnExport: 'Export',
      btnViewClips: 'View clips',
      hideAllLines: 'Hide all lines',
      showAllLines: 'Show all lines ({n})',
      levelStart: 'Tap the button below to start',
      btnStop: 'Stop',
      btnStartRec: 'Start recording',
      hintIdle: 'It plays back automatically — type down what was said',
      recWarning: 'Don\'t lock the screen or switch apps — recording stops in the background',
      reviewTitle: 'Listen to that take',
      fClipText: 'What was said (type it while it\'s fresh)',
      phClipText: 'Write it down word for word',
      btnRerecord: 'Redo',
      btnSaveNext: 'Save, next one',
      toastNoRecHere: 'Can\'t record here — see the banner above for why',
      toastMicFail: 'Couldn\'t open the mic — check the browser permission',
      micPrepFail: 'Microphone unavailable here: make sure the address is https:// and open it in a system browser (Chrome / Edge / Safari)',
      audioDecodeFail: 'Can\'t decode this audio format — try converting it to wav or m4a',
      toastTooShort: 'Too short — try again',
      toastSaveFail: 'Save failed: {msg}',
      levelCloser: 'Move closer',
      levelFarther: 'Move farther',
      levelGood: 'Perfect level',
      stickerHint: 'One sticker unlocked every 5 clips — {n} collected',

      crumbRecord: '‹ Record',
      crumbClipsSuffix: ' · Clips',
      crumbExport: 'Export ›',
      statLine: '<b>{n}</b> clips · <b>{total}</b> in total',
      statHint: '1 minute is the bare minimum; 5+ minutes is much better',
      importAudioBtn: 'Import existing audio (WeChat voice, old recordings)',
      noClips: 'No clips yet.',
      importedAudio: 'Imported audio',
      clipMissing: 'Audio missing — needs re-recording',
      noTextYet: 'No text yet',
      btnPlay: 'Play',
      btnEditText: 'Edit text',
      btnIsRef: '★ Reference',
      btnSetRef: '☆ Set as reference',
      btnDelete: 'Delete',
      editClipTitle: 'Edit text',
      btnSave: 'Save',
      toastSaved: 'Saved',
      confirmDelClip: 'Delete this clip?',
      confirmDelClipBody: '“{label}” will be deleted. This cannot be undone.',
      confirmDel: 'Delete',
      toastDeleted: 'Deleted',
      toastNoAudio: 'This clip has no audio — re-record it',
      toastPlayFail: 'Playback failed',
      toastImportedClip: 'Imported audio — delete it and re-record via its task',
      toastProcessingN: 'Processing {n} file(s)…',
      toastImportDone: 'Import done',

      crumbClipsBack: '‹ Clips',
      crumbExportSuffix: ' · Export',
      crumbProjectsPlain: 'Projects',
      exportFullTitle: 'What\'s in the training pack',
      exportArchiveTitle: 'What\'s in the archive pack',
      exportPurpose: 'Purpose: {p}',
      exportLang: 'Language: {l}',
      wavCount: '{n} WAV files, 32kHz / 16bit / mono',
      datasetDesc: 'transcription list',
      refsDesc: '{n} reference clips',
      nextStepsDesc: 'step-by-step guide for your computer',
      projectJsonDesc: 'project backup, re-importable',
      archiveOnlyNote: 'Audio-only archive — no training files inside.',
      exportTotal: 'Total {total}',
      tooShortHint: ' · A bit short — record some more',
      fTargetPath: 'Target path on your computer (for absolute paths in dataset.list)',
      targetPathHint: 'The folder you\'ll unzip to on your computer, e.g. D:\\voice\\ or E:\\GPT-SoVITS\\. Avoid non-ASCII characters and spaces in the path.',
      btnExportArchive: 'Export audio archive',
      btnAlsoFull: 'Also export a training pack',
      btnExportFull: 'Export full training pack',
      btnAudioOnly: 'Audio only (for advanced users)',
      noRefTip: 'No reference audio yet. Go to “Clips”, pick a few natural 3–10 second takes and tap “Set as reference” — it noticeably improves training results.',
      lastZip: 'Just generated: {name}',
      btnShareAgain: 'Share / download again',
      toastNothingToExport: 'Nothing to export yet',
      toastPacking: 'Packing…',
      toastNoAudioExport: 'No usable audio',
      toastPackFail: 'Packing failed: {msg}',
      zipName: 'VoiceArchive-{name}-batch{n}-{date}.zip',
      nextStepsFile: 'NEXT-STEPS.txt',
      packedTitle: 'All packed',
      packedTip: 'Tip: share it to WeChat “File Transfer” and grab it on your computer directly.',
      btnShare: 'Share (WeChat / Notes)',
      btnDownload: 'Download to phone',
      shareTitle: 'Voice Archive backup',
      toastDownloadStarted: 'Download started',

      toastCantRead: 'Can\'t read it: {msg}',
      toastFileReadFail: 'Failed to read the file',
      toastNoProjectJson: 'No project.json and no audio found in this package',
      importedRecordings: 'Imported recordings',
      toastRestoredN: 'Restored {n} clips',
      toastAlreadyHere: 'Everything in this backup is already here',
      toastImportFail: 'Import failed: {msg}',

      crumbBack: '‹ Back',
      settingsTitle: 'Settings & privacy',
      secPrivacy: 'Privacy',
      secStorage: 'Storage',
      storageOk: '🔒 Persistent storage granted — the browser won\'t priority-clear this app\'s data.',
      storageHint: 'Whatever it says above, the safest habit is: export a backup after every session.',
      secInstall: 'Add to Home screen',
      btnHowToInstall: 'How to add',
      secAbout: 'About',
      aboutVersion: 'Version {v}',
      aboutAuthor: 'By {a} ({id})',
      aboutTech: 'Pure front-end: no framework, no dependencies, no network requests.',
      secDanger: 'Factory reset',
      dangerHint: 'Clears all projects, recordings and settings on this device — back to the state right after install.',
      btnClearAll: 'Reset to factory settings',
      confirmClearTitle: 'Reset to factory settings?',
      confirmClearBody: 'This erases <b>everything</b> on this device and returns to the initial state:<br>' +
        '· All projects and recordings<br>' +
        '· Dismissed notices (privacy tip, add-to-home reminder)<br>' +
        '· Interface language back to following your system<br>' +
        '<b>This cannot be undone.</b> If you haven\'t exported a backup yet, go export one first.',
      confirmClearOk: 'Reset',
      toastCleared: 'Reset complete',

      platformIos: 'iPhone / iPad (Safari)',
      platformAndroid: 'Android (Chrome / Edge)',
      installOptional: 'It works without adding, but recordings face a higher risk of being cleared by the system.',
      btnGotIt: 'Got it',
      btnNeverAgain: 'Don\'t show again',

      remindTitle: '{n} clips recorded!',
      remindBody: 'Save a copy to yourself first? If the app stays closed for a while, the system may clear these recordings.',
      btnSaveNow: 'Save now',
      btnLater: 'Later',
      btnMuteRemind: 'Don\'t remind me again',

      btnTryAnyway: 'Let me try anyway',

      bgStopped: 'Went to background — recording stopped automatically',
      envHttpTitle: 'This page isn\'t https:// — the microphone is disabled by the browser',
      envHttpBody: 'The current address is “{host}”. Browsers only allow https:// (or localhost) pages to use the microphone, so Edge, Chrome and Safari all fail here. Open the deployed https:// link instead; for local debugging use http://localhost.',
      envGenericTitle: 'This browser can\'t record',
      envGenericBody: 'This browser (or in-app webview) lacks the ability to access the microphone. Copy this page\'s URL and open it in a system browser — Chrome, Edge and Safari all work.',
      envClose: 'Dismiss',

      toastInitFail: 'Init failed: {msg}',
      modalCancel: 'Cancel',
      footerNote1: 'Recording someone\'s voice requires their informed consent',
      footerNote2: 'Voice is biometric data — guard the exported files carefully',

      privacyShort: 'Your recordings never leave this device — we can\'t access them. Use with confidence.',
      privacyClose: 'Dismiss',
      privacyLong: 'Recordings live in this device\'s browser. Nothing is uploaded to any server, no analytics, no tracking. Clearing browser data — or simply not opening the app for a long time — can cause recordings to be lost. Export a backup after each session.',
      storageNotPersisted: 'Persistent storage wasn\'t granted; the browser may clear this app\'s data first when space runs low. Export backups often.',
      installTitle: 'Add to Home screen so the system won\'t clear your recordings',
      installStepsIos: 'Tap the Share button at the bottom of Safari (square with an arrow up)\nScroll down and tap “Add to Home Screen”\nTap “Add” in the top-right corner',
      installStepsAndroid: 'Tap ⋮ in the browser\'s top-right corner (Chrome / Edge)\nChoose “Add to Home screen” or “Install app”\nConfirm',
      wechatTitle: 'Please open in a browser',
      wechatBody: 'WeChat\'s built-in browser can\'t record. Tap ⋯ in the top-right → “Open in browser”, then everything works.'
    }
  };

  /* ------------------------------------------------------------------ */
  /* 界面语言选择                                                        */
  /* ------------------------------------------------------------------ */
  const LANG_KEY = 'va-ui-lang';

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'zh') return saved;
    } catch (e) { /* 隐私模式等，忽略 */ }
    const nav = (navigator.language || 'zh').toLowerCase();
    return nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  let uiLang = detectLang();

  function getUiLang() { return uiLang; }

  function setUiLang(l) {
    uiLang = l === 'en' ? 'en' : 'zh';
    try { localStorage.setItem(LANG_KEY, uiLang); } catch (e) { /* 忽略 */ }
    return uiLang;
  }

  /** 取词：{name} 占位；en 缺 key 回退 zh */
  function T(key, vars) {
    let s = (UI[uiLang] && UI[uiLang][key]);
    if (s == null) s = UI.zh[key];
    if (s == null) s = key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  /**
   * 引导内容语言：项目主要语言 → 有翻译就用，没有回退中文。
   * 以后补日韩翻译时，在 GUIDE_EN 旁加 GUIDE_JA / GUIDE_KO 并在这里登记即可。
   */
  const GUIDE_PACKS = { en: 'GUIDE_EN' };

  function guideLang(projectLanguage) {
    const key = GUIDE_PACKS[projectLanguage];
    return (key && window.I18N && window.I18N[key]) ? projectLanguage : 'zh';
  }

  /* ------------------------------------------------------------------ */
  /* 英文引导内容（覆盖层：按 id 对应，缺的字段回退中文）                  */
  /* ------------------------------------------------------------------ */
  const GUIDE_EN = {
    languages: {
      'zh': {
        label: 'Chinese (Mandarin)',
        hint: 'Pick this for standard Mandarin; accented but broadly Mandarin counts too'
      },
      'zh-dialect': {
        label: 'Chinese (other dialect)',
        hint: 'They don\'t really speak standard Mandarin (Sichuanese, Hokkien, Shanghainese…). Picking it adds an optional field below'
      },
      'yue': {
        label: 'Cantonese',
        hint: 'Cantonese has its own training code — much better results than treating it as Mandarin'
      },
      'en': { label: 'English', hint: '' },
      'ja': { label: 'Japanese', hint: '' },
      'ko': { label: 'Korean', hint: '' }
    },

    purposes: {
      train: { label: 'Train a model that can speak', hint: 'Exports a complete GPT-SoVITS training pack' },
      archive: { label: 'Just preserve the voice', hint: 'Audio only — no training files generated' }
    },

    ageGroups: {
      toddler: {
        label: 'Toddler', range: 'Ages 3–6', duration: '5–10 min per session',
        notes: [
          'Never correct their pronunciation. Mispronunciation is the most precious trait at this age',
          'Only 5–10 minutes per session; stop the moment they lose patience — split it across days',
          'Record while playing together — don\'t say “now, you say this”',
          'No professional gear; it makes kids self-conscious'
        ],
        questions: [
          'What did you eat at kindergarten today?',
          'Which toy is your favorite, and what\'s its name?',
          'What did you play with your friends today?',
          'Do you still remember your dream?',
          'Who do you like playing with most?',
          'What animal would you like to become?',
          'What was the happy part of today?',
          'What are you most afraid of?',
          'Tell me about the picture you drew.',
          'What\'s your favorite food?'
        ]
      },
      child: {
        label: 'Child', range: 'Ages 7–12', duration: 'About 20 min per session',
        notes: [
          'Catchphrases at this age change fast — half a year later they may be gone. Record now',
          'Chat casually; 20 minutes at a stretch is fine'
        ],
        questions: [
          'Anything fun at school today?',
          'Who\'s your best friend, and what are they like?',
          'What do you want to be when you grow up, and why?',
          'What book or cartoon are you into lately? Tell me about it.',
          'Which class do you like most?',
          'Anything recently that made you really mad or really happy?',
          'If I gave you a million, how would you spend it?',
          'Describe your room for me.',
          'What do you most want to do this weekend?',
          'What do you find weird about grown-ups?'
        ]
      },
      teen: {
        label: 'Teenager', range: 'Ages 13–18', duration: 'Up to them',
        notes: [
          'Let them pick the topics. Nothing valuable comes out of an interrogation',
          'Don\'t judge their opinions — once you do, everything after is half-hearted',
          'Let them record on their own phone; it\'s more real without an adult around',
          'Respect their right to stop at any time'
        ],
        questions: [
          'What are you into lately (shows / games / music / creators)?',
          'What\'s been bugging you recently?',
          'What\'s a view you hold, and why?',
          'When did you last feel a real sense of achievement?',
          'What do you and your friends usually talk about?',
          'Any plans for the future?',
          'Anything you never quite dare to say?',
          'What\'s the most interesting corner of this home, to you?',
          'What would you say to yourself ten years from now?'
        ]
      },
      adult: {
        label: 'Adult', range: 'Ages 19–50', duration: 'About 30 min per session',
        notes: [
          'Normal conversation is fine; 30 minutes at a stretch',
          'Record again every few months — people change'
        ],
        questions: [
          'What does a normal day look like for you?',
          'Anything that left a deep impression lately?',
          'What was your childhood dream? And now?',
          'How did you and your family meet?',
          'What\'s changed most about you in the past ten years?',
          'Any words you want to leave for the family of the future?',
          'How do you make the dish you\'re best at?',
          'When did you last laugh until your stomach hurt?',
          'How do you usually comfort people?'
        ]
      },
      elder: {
        label: 'Elder', range: 'Ages 60 and up', duration: 'Aim for 4 sessions, 20–30 min each',
        notes: [
          'Must split into sessions — 4 is a good number, 20–30 min each, with real breaks in between',
          'A tired elder\'s voice differs from their everyday voice; mixing it into the training set pollutes the model. Stop rather than push on',
          'Dialect is the key thing to protect — never demand standard Mandarin',
          'Old photos and old objects guide far better than bare questions'
        ],
        questions: [
          'What was the house you grew up in like?',
          'What did you love eating as a kid?',
          'How did you and your spouse meet?',
          'What work did you do when young, and what did a day\'s pay earn?',
          'What are you proudest of in your life?',
          'And the hardest time?',
          'When did you first hold your grandchild?',
          'Is there anything you want to teach the younger ones?',
          'What do you think about most these days?'
        ]
      }
    },

    checklist: {
      call: {
        title: 'What they call their family',
        hint: 'Names, pet names, nicknames — each one 2–3 times',
        tasks: [
          { label: 'Call out their name once', tip: 'The way you\'d shout it at home — not formally' },
          { label: 'Call again, in a different tone', tip: 'Like calling them in from the kitchen for dinner' },
          { label: 'Use the nickname only you two use', tip: 'Pet names, childhood nicknames — the most precious ones' }
        ]
      },
      catchphrase: {
        title: 'Catchphrases',
        hint: 'The things they say all the time — their verbal fingerprint',
        tasks: [
          { label: 'Say a few of your most-used catchphrases', tip: 'Run them together, don\'t stop in between' },
          { label: 'Once more, naturally', tip: 'As if you were chatting with someone' }
        ]
      },
      laugh: {
        title: 'Laughter',
        hint: 'Smile, big laugh, amused chuckle — record them separately',
        tasks: [
          { label: 'Give a soft chuckle', tip: 'Corners of the mouth turning up; a silent one counts too' },
          { label: 'Have a big laugh', tip: 'Really laugh — the bigger the better' },
          { label: 'The “that\'s hilarious” laugh', tip: 'Think back to the last time you cracked up' }
        ]
      },
      number: {
        title: 'Numbers and dates',
        hint: 'Count 1–20, birthdays, years',
        tasks: [
          { label: 'Count from 1 to 20', tip: 'At your usual pace' },
          { label: 'Say your birthday (year, month, day)', tip: 'Mention what year it is now, too' }
        ]
      },
      love: {
        title: 'Words from the heart',
        hint: '“I love you”, “I miss you”, “You\'ve worked hard”, “Thank you”',
        tasks: [
          { label: 'Say “I love you”', tip: 'In your own way — it doesn\'t have to sound formal' },
          { label: 'Say “I miss you”', tip: '' },
          { label: 'Say “You\'ve worked hard”', tip: '' },
          { label: 'Say “Thank you”', tip: '' }
        ]
      },
      dialect: {
        title: 'Dialect words / hometown places / sayings',
        hint: 'If they have any, absolutely record them; skip if not',
        tasks: [
          { label: 'Say a casual line in your hometown dialect', tip: 'No need for standard anything' },
          { label: 'Name hometown places, or say a local proverb', tip: '' }
        ]
      }
    },

    /* buildTasks 的动态字符串（给操作者的部分走 UI，念的 label 走项目语言） */
    ui: {
      chatGroupTitle: 'Free talk',
      guideTaskTip: 'Let them answer freely — no scripts',
      dialectGroupHint: 'They speak {d} — this group is the highlight, don\'t skip it',
      dialectTipFirst: 'Use their everyday {d} — no need to switch to Mandarin',
      dialectTipRest: 'Say it in {d}, as native as possible',
      dialectNote: 'They speak {d}. Don\'t push them toward standard Mandarin — the dialect itself is what we\'re preserving.'
    }
  };

  /* ------------------------------------------------------------------ */
  /* 「接下来怎么做.txt」英文版（界面语言为英文时导出）                    */
  /* ------------------------------------------------------------------ */
  const NEXT_STEPS_EN = String.raw`================================================
     Voice Archive · What to do next
================================================

You've just finished the most important, irreplaceable step:
recording their voice.

All that's left is turning these recordings into a model
that can speak. No coding needed — just follow along.

Estimated time: 40 minutes ~ 2 hours
(most of it is the computer running on its own — go do
 something else meanwhile)


================================================
Before you start: can your computer handle it?
================================================

[Required]
A Windows PC with an NVIDIA graphics card, 8GB+ of VRAM.

How to check your GPU:
  Press Ctrl + Shift + Esc to open Task Manager
  → Click "Performance"
  → Find "GPU" on the left
  → Top-right shows the GPU model and VRAM

  If you see an N-card (GTX / RTX prefix), you're fine.
  The VRAM line needs to be above 8GB.

[Required]
At least 30GB of free disk space.

[Note]
Macs work too, but training quality will be noticeably
worse. If possible, borrow a Windows laptop instead.

[Note]
If your computer has no dedicated GPU (integrated only),
training won't run. Ask a friend with a gaming PC,
or rent a cloud GPU.


================================================
Step 0: Get the recordings onto the computer
================================================

What you exported from your phone is a ZIP file.

If you shared it to WeChat "File Transfer":
  Open WeChat on the computer
  → Find "File Transfer"
  → Download the ZIP file

Once downloaded, unzip it into a folder.

  ⚠️ Important: the extracted folder path must NOT
     contain Chinese characters or spaces!

  Recommended: create an English-named folder directly
  on a drive root, e.g. D:\voice

  After unzipping, the structure should look like:
    D:\voice\
      ├── wavs\          a bunch of wav audio files
      ├── dataset.list   the transcription file
      ├── references\    reference audio
      └── NEXT-STEPS.txt   what you're reading now

  Not recommended (Chinese + spaces, may cause errors):
    D:\My Files\Voice Backup\Recordings\


================================================
Step 1: Download the software (~20 min, depends on speed)
================================================

The software is called GPT-SoVITS. It's open source
and free, made by Bilibili creator "Hua Er Bu Ku"
(花儿不哭).

Download page (official GitHub releases):
  https://github.com/RVC-Boss/GPT-SoVITS/releases

How to pick a version:
  Look for names containing the full package
  ("整合包"), pick the latest date, e.g.:
  GPT-SoVITS-v2pro-20250604.7z

  In short:
    · Clean, high-quality recordings → use v3 or v4
    · Some noise, or not sure → use v2pro (safer)
    · Undecided → pick v2pro, it's the most forgiving

Official full tutorial (Chinese, Yuque docs):
  https://www.yuque.com/baicaigongchang1145haoyuangong/ib3g1e

If GitHub is slow or unreachable, search "花儿不哭" on
Bilibili — the profile page has mirror downloads and
detailed video tutorials.

What you download is an archive. Unzip it.
Again, no Chinese characters or spaces in the path,
e.g. D:\GPT-SoVITS


================================================
Step 2: Launch it (~3 min)
================================================

In the extracted folder, find this file:

  go-webui.bat

Double-click it.

A black console window will pop up and start loading.
The first launch is slow — a few minutes is normal.

  ⚠️ Do NOT close that black window!
     Closing it stops the software.

When loaded, a browser page opens automatically.
If it doesn't, open your browser and type:

  http://localhost:9874

If you can see the interface, you're good.


================================================
Step 3: Format the training set (~5 min)
================================================

This step lets the computer "understand" your
recordings and prepares them for training.
You only type paths and click buttons.

1. Switch to the "1-GPT-SoVITS-TTS" tab at the top

2. Find "1A-训练集格式化工具" (training set formatter)

3. Fill in the experiment/model name
   Use English letters or numbers only, no Chinese
   e.g.: zhangsan

4. Fill in the "文本标注文件" (transcription file) path
   That's the dataset.list you just unzipped
   e.g.: D:\voice\dataset.list

5. Fill in the "训练集音频文件夹路径" (audio folder) path
   That's the wavs folder you just unzipped
   e.g.: D:\voice\wavs

6. Check "开启训练集格式化一键三连"
   (enable the one-click format trio)

7. Click "一键三连" (one-click trio)

Then wait. Progress shows at the bottom.
When you see something like "格式化完毕"
(formatting complete), you're done.

  ⚠️ If this step errors out, 99% of the time it's
     because the path has Chinese characters or spaces.
     Go back to Step 0 and pick a pure-English path.


================================================
Step 4: Train the model (~20 min ~ 1 hour)
================================================

Switch to the "1B-微调训练" (fine-tuning) tab.

Two models get trained, in order — don't flip them:

  ───────────────────────────────
  First: SoVITS
  ───────────────────────────────
  1. Click "开始 SoVITS 训练" (start SoVITS training)
  2. Keep the default epoch count (usually 8)
  3. Wait for the completion message

  ───────────────────────────────
  Then: GPT
  ───────────────────────────────
  4. Click "开始 GPT 训练" (start GPT training)
  5. Keep the default epoch count (usually 15)
  6. Wait for the completion message

  ⚠️⚠️ THE most important warning ⚠️⚠️

  Do NOT crank epochs up to 50 or 100 thinking
  "more training = better"!

  Too many epochs causes "overfitting" — the model
  memorizes the recordings, then can't say anything
  new, and produces metallic buzz, cracks and glitches.

  The defaults are already the best. Leave them alone.

  ───────────────────────────────
  If you hit "out of memory" (显存不足)
  ───────────────────────────────
  Lower the batch_size (e.g. 8 → 4, then 2 if needed)
  and start training again.
  It'll be slower, but it will finish.


================================================
Step 5: Test it — make them speak (~2 min)
================================================

Switch to the "1C-推理" (inference) tab.

1. Click "刷新模型路径" (refresh model paths)
   In the GPT model dropdown, pick the one you just
   trained (its name contains e.g. zhangsan)
   Same for the SoVITS model dropdown.

2. Upload a reference audio
   Click upload, pick any wav from the references
   folder (the ones you starred as reference candidates
   on your phone).

3. Fill in "参考音频的文本" (reference audio text)
   Type exactly, word for word, what that reference
   clip says. This matters — it noticeably improves
   similarity.

4. Pick "参考音频的语种" (reference audio language).
   For English recordings, choose English (英文).

5. In "需要合成的文本" (text to synthesize), type
   what you want them to say.
   e.g.: The weather is nice today. Shall we go out?

6. Click "合成语音" (synthesize speech)

Wait a few seconds — and you'll hear them.

  💡 Want a different mood? Just swap the reference
     audio — no retraining needed.
     Happy reference → happy voice.
     Gentle reference → gentle voice.

  💡 Remember: whatever emotion the reference audio
     carries is the emotion the output speaks with.


================================================
FAQ
================================================

Q: The voice doesn't sound quite like them?

  Don't rush to retrain. Check in order:

  1. Try a different reference audio (works fastest)
  2. Is the reference audio text filled in exactly?
  3. Is total recording long enough? 1 minute is the
     floor; 5+ minutes is much better
  4. Any background noise? Noise drags everything down
  5. Try the v2pro build — more forgiving of source
     quality


Q: Metallic buzz, glitchy artifacts, cracking?

  Too many training epochs — the model overfitted.
  Go back to Step 4 and retrain with fewer epochs
  (SoVITS: 4–8). Or switch to the v2pro build.


Q: It stalls mid-sentence / loops the same phrase?

  The input is too long. Split long text into short
  sentences and synthesize one at a time.
  In the "how to cut" option, choose "split by
  punctuation".


Q: The software won't open / keeps erroring?

  1. Check the path for Chinese characters and spaces
     (this fixes most problems)
  2. Check you actually unzipped it before running
  3. Check your GPU driver isn't ancient — update the
     NVIDIA driver
  4. See the troubleshooting section of the official
     tutorial


Q: Power cut mid-training / accidentally closed the
window?

  It's fine — just run it again.
  The recordings you made are safe (they're in
  D:\voice); you'll just need to redo Steps 3 and 4.


================================================
Important: back up the trained model
================================================

After training, the model files live in these two spots
inside the package folder:

  GPT-SoVITS-v2pro-xxx\GPT_weights\
  GPT-SoVITS-v2pro-xxx\SoVITS_weights\

Find the two files whose names contain your model name
(e.g. zhangsan), and copy them to cloud storage or an
external drive.

Those two files ARE "their voice" — hours of recordings
condensed into two files.

  ⚠️ If you reinstall the OS or delete the package
     folder, the model is gone and must be retrained
     from scratch. Back it up.


================================================
Last: about this whole thing
================================================

The technical part ends here.

But a few words before you go:

These recordings are evidence that this person truly
existed. The way they said your name, the way they
laughed, the little phrases they always used —
all of it is preserved now.

Please guard these files carefully.
Voice is biometric data, the same category as
fingerprints and faces.

If you plan to let family use this model too,
it's worth telling everyone up front that it exists,
and who is allowed to use it.


================================================
  Good luck.
  If you get stuck, search "花儿不哭" on Bilibili —
  the comments under his videos are full of helpful
  people.
================================================
`;

  /* ------------------------------------------------------------------ */
  /* 导出                                                                */
  /* ------------------------------------------------------------------ */
  return {
    T: T,
    getUiLang: getUiLang,
    setUiLang: setUiLang,
    guideLang: guideLang,
    GUIDE_EN: GUIDE_EN,
    NEXT_STEPS_EN: NEXT_STEPS_EN
  };
})();
