/*
 * i18n/zh.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 中文语言包，结构与 i18n/en.js 对齐：
 *   ui     —— 界面文案（随「界面语言」切换，取词走 I18N.T(key, vars)）
 *   guide  —— 引导内容（念给被录者 / 给操作者的提示）
 *
 * zh 是全语言兜底档：其他语言缺 key 时回退到这里（见 i18n/core.js）。
 */
(function () {
  'use strict';
  const L = (window.I18N_LANGS = window.I18N_LANGS || {});

  L.zh = {

    /* ------------------------------------------------------------------ */
    /* 界面文案                                                            */
    /* ------------------------------------------------------------------ */
    ui: {
      appTitle: '声音留档',
      langTitle: '界面语言',
      langHint: '只切换界面文字。录音引导问题使用项目里选的「主要语言」。',
      cdSettingTitle: '录音倒计时',
      cdSettingHint: '点「开始录音」后等几秒再真正收音，给说话的人留出准备时间',
      cdOff: '不等待，点了就开始',
      cdSec: '{n} 秒',

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
      btnProjectSettings: '设置',
      projectSettingsTitle: '项目设置',
      projectSettingsHint: '改了年龄段或语言，引导问题会换成新的一组；已经录好的音频不会丢。',
      btnDeleteProject: '删除这个项目',
      confirmDelProjectTitle: '删除项目？',
      confirmDelProjectBody: '「{name}」和它下面的 {n} 段录音都会被删掉，<b>无法恢复</b>。建议先导出一份备份。',
      confirmDelProjectOk: '删除项目',
      toastProjectDeleted: '项目已删除',
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
      recGuide: '录音指引',
      unbackedN: '有 {n} 句还没备份',
      backedOk: '已备份',
      noData: '无数据',
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
      btnCancelCd: '取消',
      cdTip: '倒计时中，再点一下可取消',
      cdLevelText: '准备开始…',
      hintIdle: '录完会自动播放，你当场把这句话敲下来',
      recWarning: '请不要锁屏或切走，切到后台录音会中断',
      reviewTitle: '听一下刚才那句',
      fClipText: '这句话说的是什么（当场敲下来最准）',
      phClipText: '一个字不差地写下来',
      btnRerecord: '重录',
      btnSaveNext: '保存，下一句',
      btnDiscardClip: '放弃本次',
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
      wechatBody: '微信里打不开录音功能。请点右上角「···」→「在浏览器中打开」，然后就能正常使用了。',

      /* 导出说明文档读取失败（i18n/core.js 报错用） */
      nextStepsUnavailable: '操作说明文档还没准备好，请检查网络后再试'
    },

    /* ------------------------------------------------------------------ */
    /* 引导内容                                                            */
    /* 结构与 i18n/en.js 一致；content.js 只存结构/元数据，文案在这里       */
    /* ------------------------------------------------------------------ */
    guide: {

      /* 「主要语言」选项文案（code / train 等元数据在 content.js） */
      languages: {
        'zh': {
          label: '中文（普通话）',
          hint: '标准普通话就选它；带点口音但整体是普通话，也算它'
        },
        'zh-dialect': {
          label: '中文（其他方言）',
          hint: '他说的不是标准普通话（比如四川话、闽南语、上海话）。选它下面会多一个选填框'
        },
        'yue': {
          label: '粤语',
          hint: '粤语在训练侧有独立代码，会比按普通话处理好很多'
        },
        'en': { label: '英文', hint: '' },
        'ja': { label: '日文', hint: '' },
        'ko': { label: '韩文', hint: '' }
      },

      /* 项目用途文案 */
      purposes: {
        train: {
          label: '训练一个能说话的模型',
          hint: '导出完整的 GPT-SoVITS 训练包'
        },
        archive: {
          label: '只是想把声音存下来',
          hint: '只导出纯音频，不生成训练文件'
        }
      },

      /* 年龄段：注意事项 + 引导问题（highlight / kid 等元数据在 content.js） */
      ageGroups: {
        toddler: {
          label: '幼儿',
          range: '3-6 岁',
          duration: '每次 5-10 分钟',
          notes: [
            '绝对不要纠正发音。发音不准是这个阶段最珍贵的特征',
            '每次只录 5-10 分钟，孩子没耐心立刻停，宁可多分几次',
            '在玩的时候顺便录，不要说「来，你说这句」',
            '不要摆专业设备，会让孩子不自然'
          ],
          questions: [
            '今天幼儿园吃了什么？',
            '你最喜欢的玩具是哪个、它叫什么？',
            '今天和小朋友玩了什么？',
            '你做的梦还记得吗？',
            '你最喜欢和谁玩？',
            '想变成什么小动物？',
            '今天有什么开心的事？',
            '你最害怕什么？',
            '跟我讲讲你画的画。',
            '你最爱吃什么？'
          ]
        },
        child: {
          label: '儿童',
          range: '7-12 岁',
          duration: '每次约 20 分钟',
          notes: [
            '这个年龄段口头禅更新极快，半年后可能就换了，要录就现在录',
            '聊天式进行，一次 20 分钟没问题'
          ],
          questions: [
            '今天学校有什么好玩的事？',
            '你最好的朋友是谁、他什么样？',
            '长大想做什么、为什么？',
            '最近在看什么书或动画片、讲给我听听？',
            '最喜欢哪堂课？',
            '最近有没有特别生气或特别开心的事？',
            '如果给你一百万怎么花？',
            '说说你房间的样子。',
            '周末最想干什么？',
            '你觉得大人有什么地方很奇怪？'
          ]
        },
        teen: {
          label: '青少年',
          range: '13-18 岁',
          duration: '由他自己决定',
          notes: [
            '让他自己挑话题，这个年龄段最怕被审问，逼出来的话毫无价值',
            '不要评判他的观点，一旦评判后面全是敷衍',
            '可以让他自己拿手机录，没大人在场反而更真实',
            '尊重他随时叫停的权利'
          ],
          questions: [
            '最近在追什么（剧/游戏/音乐/UP主）？',
            '最近最烦的事是什么？',
            '你认同什么观点、为什么？',
            '最近一次有成就感是什么时候？',
            '你和朋友平时聊什么？',
            '对未来的打算？',
            '有没有平时不好意思说的话？',
            '你觉得这个家最有趣的地方是什么？',
            '想对十年后的自己说什么？'
          ]
        },
        adult: {
          label: '中青年',
          range: '19-50 岁',
          duration: '每次约 30 分钟',
          notes: [
            '正常对话即可，一次 30 分钟',
            '建议隔几个月再录一次，人的状态会变'
          ],
          questions: [
            '你一天通常怎么过？',
            '最近有什么印象深刻的事？',
            '小时候的梦想是什么、现在呢？',
            '你和家人是怎么认识的？',
            '这十年你觉得自己最大的变化是什么？',
            '有什么话想留给未来的家人？',
            '你最拿手的一道菜怎么做？',
            '最近一次笑到肚子疼是什么时候？',
            '你平时怎么安慰人？'
          ]
        },
        elder: {
          label: '长辈',
          range: '60 岁以上',
          duration: '建议 4 次，每次 20-30 分钟',
          notes: [
            '必须分次录，建议 4 次，每次 20-30 分钟，中间一定要休息',
            '老人累了的声音和平时不一样，混进训练集会污染模型，宁可停',
            '方言是重点保护对象，不要要求他说标准普通话',
            '用老照片、老物件辅助引导，比干问效果好得多'
          ],
          questions: [
            '你小时候住的房子是什么样的？',
            '小时候最爱吃什么？',
            '你和老伴是怎么认识的？',
            '年轻时做什么工作、一天挣多少钱？',
            '这辈子最骄傲的事是什么？',
            '最难过的事呢？',
            '第一次抱孙子/孙女是什么时候？',
            '有什么想教给晚辈的？',
            '现在最惦记的是什么？'
          ]
        }
      },

      /* 必录清单（title / hint 给操作者；tasks 的 label 念给被录者） */
      checklist: [
        {
          id: 'call',
          title: '叫家人的各种称呼',
          hint: '名字、小名、昵称，每个录 2-3 遍',
          tasks: [
            { label: '叫一遍 TA 的名字', tip: '就像平时在家喊他那样，不要正式' },
            { label: '再叫一遍，换个语气', tip: '比如在厨房喊他来吃饭' },
            { label: '叫一声只有你们会用的昵称', tip: '小名、外号都算，这是最珍贵的' }
          ]
        },
        {
          id: 'catchphrase',
          title: '口头禅',
          hint: '「你看看」「那会儿」「哎呀我说」这类，这是身份指纹',
          tasks: [
            { label: '说几句你最常说的口头禅', tip: '连着说，中间别停' },
            { label: '再来一遍，自然一点', tip: '假装正在跟人聊天' }
          ]
        },
        {
          id: 'laugh',
          title: '笑声',
          hint: '微笑、大笑、被逗乐，分开录',
          tasks: [
            { label: '轻轻笑一下', tip: '嘴角上扬那种，不出声也算' },
            { label: '大笑一次', tip: '真的笑出来，越大越好' },
            { label: '被逗乐时那种笑', tip: '想想上次被逗笑的场景' }
          ]
        },
        {
          id: 'number',
          title: '数字和日期',
          hint: '数数 1-20，生日、年份',
          tasks: [
            { label: '从 1 数到 20', tip: '按你平时的语速' },
            { label: '说出你的生日（年月日）', tip: '顺便说说今年是哪一年' }
          ]
        },
        {
          id: 'love',
          title: '想说的话',
          hint: '「我爱你」「我想你了」「辛苦了」「谢谢你」',
          tasks: [
            { label: '说一句「我爱你」', tip: '用你平时的方式，不用标准' },
            { label: '说一句「我想你了」', tip: '' },
            { label: '说一句「辛苦了」', tip: '' },
            { label: '说一句「谢谢你」', tip: '' }
          ]
        },
        {
          id: 'dialect',
          title: '方言词 / 家乡地名 / 俗语',
          hint: '有的话一定要录，没有就跳过',
          tasks: [
            { label: '用家乡话说一句家常话', tip: '不用标准普通话' },
            { label: '说出老家的地名，或者一句俗语', tip: '' }
          ]
        }
      ],

      /* 引导流程里的操作者界面文案（{d} 会被替换成具体方言） */
      ui: {
        chatGroupTitle: '聊一聊',
        guideTaskTip: '让他自由回答，不要念稿',
        dialectGroupHint: '他会说{d}，这一组是重点，一定要录',
        dialectTipFirst: '就用平时说的{d}，不用转成普通话',
        dialectTipRest: '用{d}说出来，越地道越好',
        dialectNote: '他会说{d}。不要要求他说标准普通话，方言本身就是要留下来的东西。'
      }
    }
  };
})();
