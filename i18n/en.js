/*
 * i18n/en.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 英文语言包，结构与 i18n/zh.js 对齐：
 *   ui     —— 界面文案
 *   guide  —— 引导内容
 *
 * 缺 key 时统一回退中文（见 i18n/core.js）。
 */
(function () {
  'use strict';
  const L = (window.I18N_LANGS = window.I18N_LANGS || {});

  L.en = {

    /* ------------------------------------------------------------------ */
    /* 界面文案                                                            */
    /* ------------------------------------------------------------------ */
    ui: {
      appTitle: 'Voice Archive',
      langTitle: 'Interface language',
      langHint: 'Switches the interface only. Recording prompts follow the project\'s main language.',

      /* 首页 */
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
      btnProjectSettings: 'Settings',
      projectSettingsTitle: 'Project settings',
      projectSettingsHint: 'Changing the age group or language swaps in a new set of guide questions. Already recorded audio is never lost.',
      btnDeleteProject: 'Delete this project',
      confirmDelProjectTitle: 'Delete project?',
      confirmDelProjectBody: '“{name}” and its {n} clips will be deleted, <b>irrecoverably</b>. Export a backup first if you can.',
      confirmDelProjectOk: 'Delete project',
      toastProjectDeleted: 'Project deleted',
      btnNewProject: '＋ New project',
      btnSettings: 'Settings & privacy',
      btnInstall: 'Add to Home screen',

      /* 新建项目 */
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

      /* 录音页 */
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

      /* 素材页 */
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

      /* 导出页 */
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

      /* 导入 */
      toastCantRead: 'Can\'t read it: {msg}',
      toastFileReadFail: 'Failed to read the file',
      toastNoProjectJson: 'No project.json and no audio found in this package',
      importedRecordings: 'Imported recordings',
      toastRestoredN: 'Restored {n} clips',
      toastAlreadyHere: 'Everything in this backup is already here',
      toastImportFail: 'Import failed: {msg}',

      /* 设置页 */
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

      /* 安装引导 */
      platformIos: 'iPhone / iPad (Safari)',
      platformAndroid: 'Android (Chrome / Edge)',
      installOptional: 'It works without adding, but recordings face a higher risk of being cleared by the system.',
      btnGotIt: 'Got it',
      btnNeverAgain: 'Don\'t show again',

      /* 备份提醒 */
      remindTitle: '{n} clips recorded!',
      remindBody: 'Save a copy to yourself first? If the app stays closed for a while, the system may clear these recordings.',
      btnSaveNow: 'Save now',
      btnLater: 'Later',
      btnMuteRemind: 'Don\'t remind me again',

      /* 微信 */
      btnTryAnyway: 'Let me try anyway',

      /* 环境 */
      bgStopped: 'Went to background — recording stopped automatically',
      envHttpTitle: 'This page isn\'t https:// — the microphone is disabled by the browser',
      envHttpBody: 'The current address is “{host}”. Browsers only allow https:// (or localhost) pages to use the microphone, so Edge, Chrome and Safari all fail here. Open the deployed https:// link instead; for local debugging use http://localhost.',
      envGenericTitle: 'This browser can\'t record',
      envGenericBody: 'This browser (or in-app webview) lacks the ability to access the microphone. Copy this page\'s URL and open it in a system browser — Chrome, Edge and Safari all work.',
      envClose: 'Dismiss',

      /* 通用 */
      toastInitFail: 'Init failed: {msg}',
      modalCancel: 'Cancel',
      footerNote1: 'Recording someone\'s voice requires their informed consent',
      footerNote2: 'Voice is biometric data — guard the exported files carefully',

      /* 内容文案（原 content.TEXTS） */
      privacyShort: 'Your recordings never leave this device — we can\'t access them. Use with confidence.',
      privacyClose: 'Dismiss',
      privacyLong: 'Recordings live in this device\'s browser. Nothing is uploaded to any server, no analytics, no tracking. Clearing browser data — or simply not opening the app for a long time — can cause recordings to be lost. Export a backup after each session.',
      storageNotPersisted: 'Persistent storage wasn\'t granted; the browser may clear this app\'s data first when space runs low. Export backups often.',
      installTitle: 'Add to Home screen so the system won\'t clear your recordings',
      installStepsIos: 'Tap the Share button at the bottom of Safari (square with an arrow up)\nScroll down and tap “Add to Home Screen”\nTap “Add” in the top-right corner',
      installStepsAndroid: 'Tap ⋮ in the browser\'s top-right corner (Chrome / Edge)\nChoose “Add to Home screen” or “Install app”\nConfirm',
      wechatTitle: 'Please open in a browser',
      wechatBody: 'WeChat\'s built-in browser can\'t record. Tap ⋯ in the top-right → “Open in browser”, then everything works.',

      /* 导出说明文档读取失败（i18n/core.js 报错用） */
      nextStepsUnavailable: 'The guide document isn\'t ready yet — please check your connection and try again.'
    },

    /* ------------------------------------------------------------------ */
    /* 引导内容（原 GUIDE_EN）                                             */
    /* ------------------------------------------------------------------ */
    guide: {
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

      checklist: [
        {
          id: 'call',
          title: 'What they call their family',
          hint: 'Names, pet names, nicknames — each one 2–3 times',
          tasks: [
            { label: 'Call out their name once', tip: 'The way you\'d shout it at home — not formally' },
            { label: 'Call again, in a different tone', tip: 'Like calling them in from the kitchen for dinner' },
            { label: 'Use the nickname only you two use', tip: 'Pet names, childhood nicknames — the most precious ones' }
          ]
        },
        {
          id: 'catchphrase',
          title: 'Catchphrases',
          hint: 'The things they say all the time — their verbal fingerprint',
          tasks: [
            { label: 'Say a few of your most-used catchphrases', tip: 'Run them together, don\'t stop in between' },
            { label: 'Once more, naturally', tip: 'As if you were chatting with someone' }
          ]
        },
        {
          id: 'laugh',
          title: 'Laughter',
          hint: 'Smile, big laugh, amused chuckle — record them separately',
          tasks: [
            { label: 'Give a soft chuckle', tip: 'Corners of the mouth turning up; a silent one counts too' },
            { label: 'Have a big laugh', tip: 'Really laugh — the bigger the better' },
            { label: 'The “that\'s hilarious” laugh', tip: 'Think back to the last time you cracked up' }
          ]
        },
        {
          id: 'number',
          title: 'Numbers and dates',
          hint: 'Count 1–20, birthdays, years',
          tasks: [
            { label: 'Count from 1 to 20', tip: 'At your usual pace' },
            { label: 'Say your birthday (year, month, day)', tip: 'Mention what year it is now, too' }
          ]
        },
        {
          id: 'love',
          title: 'Words from the heart',
          hint: '“I love you”, “I miss you”, “You\'ve worked hard”, “Thank you”',
          tasks: [
            { label: 'Say “I love you”', tip: 'In your own way — it doesn\'t have to sound formal' },
            { label: 'Say “I miss you”', tip: '' },
            { label: 'Say “You\'ve worked hard”', tip: '' },
            { label: 'Say “Thank you”', tip: '' }
          ]
        },
        {
          id: 'dialect',
          title: 'Dialect words / hometown places / sayings',
          hint: 'If they have any, absolutely record them; skip if not',
          tasks: [
            { label: 'Say a casual line in your hometown dialect', tip: 'No need for standard anything' },
            { label: 'Name hometown places, or say a local proverb', tip: '' }
          ]
        }
      ],

      /* 引导流程里的操作者界面文案 */
      ui: {
        chatGroupTitle: 'Free talk',
        guideTaskTip: 'Let them answer freely — no scripts',
        dialectGroupHint: 'They speak {d} — this group is the highlight, don\'t skip it',
        dialectTipFirst: 'Use their everyday {d} — no need to switch to Mandarin',
        dialectTipRest: 'Say it in {d}, as native as possible',
        dialectNote: 'They speak {d}. Don\'t push them toward standard Mandarin — the dialect itself is what we\'re preserving.'
      }
    }
  };
})();
