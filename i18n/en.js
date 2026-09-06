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
      cdSettingTitle: 'Recording countdown',
      cdSettingHint: 'Waits a few seconds after tapping Start before actually recording — lets the speaker get ready',
      cdOff: 'None — start right away',
      cdSec: '{n}s',

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
      recGuide: 'Recording tips',
      unbackedN: '{n} clip(s) not backed up',
      backedOk: 'Backed up',
      noData: 'No data yet',
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
      btnCancelCd: 'Cancel',
      cdTip: 'Counting down — tap again to cancel',
      cdLevelText: 'Get ready…',
      hintIdle: 'It plays back automatically — type down what was said',
      recWarning: 'Don\'t lock the screen or switch apps — recording stops in the background',
      reviewTitle: 'Listen to that take',
      fClipText: 'What was said (type it while it\'s fresh)',
      phClipText: 'Write it down word for word',
      btnRerecord: 'Redo',
      btnSaveNext: 'Save',
      btnDiscardClip: 'Discard take',
      ideaBtn: 'Give me an idea',
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
      fTargetPath: 'Folder where the training data should live (the base folder)',
      targetPathHint: 'Base folder where recordings live on the computer. If GPT-SoVITS is at D:\\GPT-SoVITS\\, enter that. Export creates a VoiceArchive-<model> subfolder — unzip the pack into it and train. Prefer ASCII paths with no spaces.',
      exportPathNote: 'This training pack writes every dataset.list line against: {path}. When unzipping, unzip into the VoiceArchive-<model name> folder. The base folder is a global setting (Settings → Computer target path) shared by all projects.',
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
      nextStepsFile: 'NEXT-STEPS.html',
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
      toastUnknownDropped: 'Unknown data detected and discarded',

      /* 设置页 */
      crumbBack: '‹ Back',
      settingsTitle: 'Settings & privacy',
      secTargetPath: 'Computer target path (training data)',
      secPrivacy: 'Privacy',
      secStorage: 'Storage',
      storageOk: '🔒 Persistent storage granted — the browser won\'t priority-clear this app\'s data.',
      storageHint: 'Whatever it says above, the safest habit is: export a backup after every session.',
      secInstall: 'Add to Home screen',
      btnHowToInstall: 'How to add',
      secAbout: 'About',
      aboutVersion: 'Version {v}',
      aboutAuthor: 'By {a} ({id})',
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
            { q: 'What yummy thing did you eat today?', idea: 'Start with something you really ate today. For example: “I had noodles and an egg. The egg was really good.”' },
            { q: 'What do you want to play with right now?', idea: 'Just say what you really want to play with. For example: “I want to play with my cars. I’m going to drive them somewhere really far.”' },
            { q: 'What animal do you like best?', idea: 'Pick an animal you know. For example: “I like cats because they’re soft and they say meow.”' },
            { q: 'What do you like to play at school?', idea: 'Think of a game you really play. For example: “I like building with blocks. I made a really tall house once.”' },
            { q: 'Look around you. What is something you like?', idea: 'Just look nearby and pick something. For example: “I like this teddy bear because it sleeps with me every night.”' },
            { q: 'How would you call a little dog to come over?', idea: 'Say it like you’re really calling a dog. For example: “Come here, puppy! Come on over!”' },
            { q: 'Pretend you’re a little cat. Say meow, then say one thing.', idea: 'Start with a little “meow,” then add a simple sentence. For example: “Meow! I’m hungry. I want some food.”' },
            { q: 'What color do you like best?', idea: 'Pick a color you really like and say what it reminds you of. For example: “I like yellow because it looks like the sun.”' },
            { q: 'Did anything funny happen to you today?', idea: 'Think of one little thing that happened today. For example: “I was running really fast and almost bumped into a chair, and everybody laughed.”' }
          ]
        },
        child: {
          label: 'Child', range: 'Ages 7–12', duration: 'About 20 min per session',
          notes: [
            'Catchphrases at this age change fast — half a year later they may be gone. Record now',
            'Chat casually; 20 minutes at a stretch is fine'
          ],
          questions: [
            { q: 'What do you like to do first after school?', idea: 'Just say one thing you really do. For example: “When I get home, I usually drop my bag and look for something to eat.”' },
            { q: 'What do you and your friends like to play together?', idea: 'Think of a game or activity you actually play. For example: “We play soccer at recess, and sometimes we race each other.”' },
            { q: 'If you suddenly got a million dollars, what would you do first?', idea: 'You don’t need the whole plan. Just say the first thing you’d do. For example: “I’d take my family somewhere we’ve never been, and I’d buy lots of books.”' },
            { q: 'Tell me something adults do that you think is kind of funny.', idea: 'Think of a little thing that happens at home. For example: “Dad looked for his glasses forever, and they were on top of his head.”' },
            { q: 'What’s something you did recently that made you feel pretty proud?', idea: 'It can be something small. For example: “I rode my bike by myself without falling, and I felt really happy.”' },
            { q: 'If you could hide a secret base in your room, where would it be?', idea: 'Pick a place and imagine what you’d keep there. For example: “I’d hide it under my bed and put a flashlight, snacks, and lots of books inside.”' },
            { q: 'Is there something that makes you laugh whenever you think about it?', idea: 'You don’t have to explain why it’s funny. Just tell the little story. For example: “We were taking a picture once, and my little brother sneezed really loudly.”' },
            { q: 'What do adults do that you think is kind of strange?', idea: 'You can talk about a funny little habit. For example: “I think it’s funny when grown-ups say they’re not tired when they’re obviously tired.”' },
            { q: 'If you didn’t have school tomorrow, how would you spend the day?', idea: 'Describe the day you’d actually want. For example: “I’d sleep until I woke up, eat something really good, and then go out and play.”' }
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
            { q: 'What’s something you keep watching, listening to, or doing whenever you have time?', idea: 'Just say what you’ve genuinely been into lately. For example: “I’ve been listening to this kind of music a lot. I even play it when I’m walking.”' },
            { q: 'What’s a little thing that’s been getting on your nerves lately?', idea: 'It can be something completely ordinary. For example: “I hate getting ready to leave and then realizing my phone is almost dead.”' },
            { q: 'Have you had a moment lately when you felt a little more grown-up?', idea: 'Think of something you used to need help with but can handle yourself now. For example: “I used to ask someone right away, but now I try to figure it out myself first.”' },
            { q: 'Is there something you don’t really agree with, even though people expect you to?', idea: 'You don’t need to argue your point. Just say what you really think. For example: “People think being busy all the time means you’re doing well, but I actually like taking things slower.”' },
            { q: 'What’s one little thing that made you think, ‘That was pretty nice’ recently?', idea: 'It doesn’t have to be a big deal. For example: “I went for a walk the other day. The weather was great, and it put me in a good mood.”' },
            { q: 'If nobody was rushing you, what would you make time for?', idea: 'Pick something you would genuinely enjoy doing. For example: “I’d listen to music and not have to hurry anywhere.”' },
            { q: 'What’s one part of yourself you hope you still have a few years from now?', idea: 'It can be a habit, a personality trait, or a relationship. For example: “I hope I still tell the people I care about how I feel.”' },
            { q: 'Is there something someone once said that you still remember?', idea: 'It doesn’t have to be a famous quote. It can be something a family member, teacher, or friend said. For example: “Someone told me, ‘Don’t rush. Just finish what’s right in front of you.’ I still remember that.”' },
            { q: 'If nobody was judging you, what would you want your future to look like?', idea: 'Forget what sounds impressive. Say what kind of life you actually want. For example: “I’d like more freedom with my time, room to do things I enjoy, and time with my family.”' }
          ]
        },
        youngAdult: {
          label: 'Young adult', range: 'Ages 19–35', duration: 'About 30 min per session',
          notes: [
            'Normal conversation is fine; 30 minutes at a stretch',
            'Record again every few months — this stage changes fast'
          ],
          questions: [
            { q: 'What part of your day do you like the most right now?', idea: 'Think of a real everyday moment. For example: “I like getting home at night, taking a shower, and finally sitting down without anyone rushing me.”' },
            { q: 'What do you usually do after work, school, or a busy day?', idea: 'Think of a real little habit. For example: “When I’m done, I usually find something to eat and lie down with some music for a while.”' },
            { q: 'What’s one thing about the place you live that feels very ‘you’?', idea: 'It could be your room, desk, kitchen, or favorite corner. For example: “My desk looks a little messy, but I know where everything is.”' },
            { q: 'What’s something you know how to do now that you didn’t know how to do before?', idea: 'It doesn’t have to be a big skill. Everyday things count. For example: “I couldn’t really cook before, but now I can make a few simple meals.”' },
            { q: 'What’s a little thing that recently made you feel like you’re really living your own life?', idea: 'It could be a meal you chose, a decision you made, or a day you planned yourself. For example: “One day I decided to go for a walk just because I wanted to. It felt really good.”' },
            { q: 'What’s one thing you’re not ready to let go of yet?', idea: 'It could be a habit, a relationship, or an ordinary old object. For example: “I still don’t want to replace that old chair because I’ve spent so much of my life sitting there.”' },
            { q: 'What’s something you used to care about a lot that matters less to you now?', idea: 'Think of one real change. For example: “I used to care a lot about what people thought of me. Now I care more about being comfortable with my own life.”' },
            { q: 'Have you ever realized that growing up is different from what you imagined?', idea: 'It could be about work, money, relationships, or family. For example: “I thought being an adult meant getting to make every decision. Then I realized adults have plenty of things they can’t control.”' },
            { q: 'If you could give yourself more time over the next few years, what would you spend it on?', idea: 'It could be family, hobbies, travel, rest, or even doing nothing. For example: “I’d spend more time with family, and I’d leave some time completely unplanned.”' }
          ]
        },
        midlife: {
          label: 'Middle-aged', range: 'Ages 36–59', duration: 'About 30 min per session',
          notes: [
            'Normal conversation is fine; 30 minutes at a stretch',
            'Record again every few months — people change'
          ],
          questions: [
            { q: 'What kind of day feels like a pretty good day to you now?', idea: 'Don’t describe an ideal life. Describe a real day. For example: “Everyone at home is doing okay, work isn’t too rushed, and we all get to sit down for dinner. That feels pretty good to me.”' },
            { q: 'What little thing at home has made you feel happy recently?', idea: 'Think of an ordinary moment. For example: “Everyone happened to be home one evening, and we sat around talking after dinner. I really liked that.”' },
            { q: 'What feels like the biggest change in you over the years?', idea: 'Pick one change you can feel in everyday life. For example: “I used to want to finish everything right away. Now I’m more willing to slow down.”' },
            { q: 'What small part of everyday life matters more to you now?', idea: 'It could be food, sleep, a walk, family time, or being alone for a while. For example: “These days, getting a good night’s sleep matters more to me than almost anything.”' },
            { q: 'Is there something you used to care about a lot that doesn’t matter as much now?', idea: 'Think of something where your feelings really changed. For example: “I used to worry a lot about what people thought. Now I care more about feeling at peace with myself.”' },
            { q: 'What tends to make you think about your younger years?', idea: 'It could be a song, a place, a smell, or something you see. For example: “Sometimes I hear an old song, and suddenly I’m back in those younger days.”' },
            { q: 'What’s something you’ve done in recent years that still makes you proud?', idea: 'It doesn’t have to be a big achievement. Getting through a hard time, caring for family, or solving a difficult problem all count. For example: “There was a really busy period, but I handled things one by one and got through it. I’m still proud of that.”' },
            { q: 'What’s one thing you wish you had understood earlier in life?', idea: 'Think of something you only learned slowly. For example: “I used to think everything had to be won or settled. Later I realized some things are better left alone.”' },
            { q: 'How do you hope your family remembers you someday?', idea: 'You don’t need to choose an impressive description. You can describe a feeling. For example: “I hope they remember that even when I didn’t say much, I cared about everyone a lot.”' },
            { q: 'If you had a little more time each year that was completely yours, how would you spend it?', idea: 'Forget practical schedules for a moment. For example: “I’d go somewhere quiet for a few days, sleep properly, take long walks, and not have to rush anywhere.”' }
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
            { q: 'Tell me what the place you lived in as a child was like.', idea: 'Start with something you can still picture. For example: “The house wasn’t very big. There was a tree in the yard, and in summer everyone liked sitting underneath it.”' },
            { q: 'What was one food you loved when you were little?', idea: 'Pick something you really ate and say when you had it. For example: “I loved fresh steamed buns. I’d grab one while it was still hot.”' },
            { q: 'Tell me about one little thing from childhood that you still remember clearly.', idea: 'It doesn’t need to be an important event. Specific details are better. For example: “There was a huge rainstorm once, and we all stood by the doorway watching the water.”' },
            { q: 'What was a normal day like for you when you were young?', idea: 'You can start in the morning and just follow the day. For example: “I’d get up when it got light, help around the house, go to work, and then come home and keep busy for a while.”' },
            { q: 'What was a place you used to go to all the time when you were young?', idea: 'Pick somewhere familiar and tell a little about it. For example: “I used to go to a little shop near our home. I’d buy what I needed and usually stop to talk with someone I knew.”' },
            { q: 'What’s one thing you remember most about your wedding day?', idea: 'You don’t need the exact date. Just tell one moment you still remember. For example: “So many people came. There were voices everywhere, and everyone was rushing around.”' },
            { q: 'What’s something you did in your life that still makes you proud?', idea: 'It doesn’t have to be something grand. Think of something you handled, built, protected, or did for your family. For example: “There were some very difficult years, but I kept everything going. Looking back, I’m proud I got through them.”' },
            { q: 'What was something that seemed very hard at first, but you eventually figured out?', idea: 'It could be work, family, learning something new, or getting through a difficult period. For example: “At first I didn’t know how to do it at all, but I kept learning and eventually got the hang of it.”' },
            { q: 'Looking back now, what would you like to say to your younger self?', idea: 'Imagine your younger self is sitting nearby. For example: “Don’t rush so much. A lot of things can take their time, and that’s okay.”' },
            { q: 'What’s one little thing you hope your family remembers about you?', idea: 'It can be a dish you made, something you always said, or a habit. For example: “I hope you remember that I always made a little extra food because I was afraid nobody would have enough.”' }
          ]
        }
      },

      checklist: [
        {
          id: 'call',
          title: 'Names / Calls',
          hint: 'This group is for natural ways of calling someone; it works best when the operator creates a real-life situation instead of asking for a name like a roll call.',
          tasks: [
            { label: 'Imagine someone is in another room. Call them over the way you normally would at home.', tip: 'Call naturally, like you really want someone to hear you. Don’t pronounce each word too carefully.', idea: 'For example: “Hey——, dinner’s ready!” A slightly stretched-out, everyday calling voice is exactly what we want.' },
            { label: 'Imagine someone close to you is right beside you. Use the nickname or pet name you normally use and call them once.', tip: 'You don’t need to sound extra sweet. Use your real everyday voice.', idea: 'For example: “Sweetie—”, “Mom—”, “Buddy—”, or whatever you actually say at home.' },
            { label: 'Imagine you’re introducing yourself on the phone or in a formal situation. Say your full name naturally.', tip: 'Say it normally. It should not sound like you’re reading an ID card.', idea: 'For example: “My name is Zhang Ming. Zhang, as in the surname, and Ming, as in tomorrow.”' },
            { label: 'Call someone using the name you normally use most, but make it more relaxed and casual this time.', tip: 'It’s okay to use a different rhythm or tone from the previous call.', idea: 'For example: “Ming——, come here for a second.” Imagine the person is just in the next room.' }
          ]
        },
        {
          id: 'catchphrase',
          title: 'Catchphrases / Reactions',
          hint: 'The goal here is not to find a perfect “catchphrase,” but to capture everyday filler words, sighs, hesitations, and automatic reactions.',
          tasks: [
            { label: 'Think of the words that often come out when you start talking, then say two or three natural sentences.', tip: 'Don’t search for a “real catchphrase.” Just say what normally slips out.', idea: '“Oh boy,” “Well…,” “How do I put it…,” “Honestly…,” “That’s it, that’s it,” or even a simple “Hey—” or “Hmm…” all count.' },
            { label: 'Imagine you suddenly remember something. Say your first reaction, then tell what you just remembered.', tip: 'You can start with something like “Oh!” and keep going naturally.', idea: 'For example: “Oh, right! I almost forgot. I still need to buy some vegetables tomorrow.” It doesn’t need to sound polished.' },
            { label: 'Think of a moment that makes you sigh, answer with a little “mm-hmm,” or react without thinking. Say the first thing that comes out.', tip: 'Keep it natural. Don’t make the emotion bigger than it really is.', idea: 'For example, after touching something hot: “Ow, that’s hot.” After realizing you forgot something: “Oh no, oh no.” Even a natural “Hmm,” “Yeah,” or “Uh…” is useful.' }
          ]
        },
        {
          id: 'laugh',
          title: 'Laughter',
          hint: 'Laughter is hard to produce on command; a familiar memory or harmless joke usually works much better than simply asking someone to laugh.',
          tasks: [
            { label: 'Think of a small happy memory, give a light laugh, and then say one thing that comes to mind.', tip: 'A tiny, natural laugh is enough. Don’t force a big one.', idea: 'For example: “That day, the kid put both socks on the wrong feet and walked out like nothing was wrong.” A little real laugh is perfect.' },
            { label: 'Think of an old story that still makes you laugh when you remember it, and let your real laugh come out.', tip: 'You don’t need to tell the whole story. Just picture the moment.', idea: 'For example: “Everyone was looking for the glasses, and after all that, they were sitting right on top of someone’s head.”' },
            { label: 'Start with three pretend laughs, then think of something that genuinely makes you laugh and see what happens.', tip: 'It’s completely fine to start with “ha-ha-ha.” Don’t force it after that.', idea: 'Think of a silly little family mistake, something funny from childhood, or a harmless moment that still makes you smile.' }
          ]
        },
        {
          id: 'number',
          title: 'Numbers / Dates',
          hint: 'This group adds continuous numbers, dates, and everyday number-reading so the voice model gets natural numerical speech.',
          tasks: [
            { label: 'Count from one to ten, then keep going naturally to twenty.', tip: 'Use your normal counting speed. You don’t need to slow down.', idea: 'For example: “One, two, three… ten, eleven… twenty.” Keep the rhythm smooth and natural.' },
            { label: 'Say your birthday: the year, month, and day.', tip: 'Say it like you’re casually telling someone your birthday.', idea: 'For example: “I was born on May 12, 1990.” You can leave out any part you’d rather not say.' }
          ]
        },
        {
          id: 'love',
          title: 'Affection / Feelings',
          hint: 'This group captures warmth, gratitude, and care; the goal is not to sound sentimental, but to sound like the way someone really speaks to family.',
          tasks: [
            { label: 'Think of someone you care about and tell them, in your own words, that you love them.', tip: 'You don’t have to say the exact words “I love you” if that isn’t how you normally speak.', idea: 'You can say something more natural to you, such as: “Eat well,” “Come home when you can,” or “I’m always thinking about you.”' },
            { label: 'Think of someone you miss and say, in your own everyday way, that you miss them.', tip: 'Keep it simple, like something you might say on a normal phone call.', idea: 'For example: “I’ve been missing you lately.” Or: “When are you coming home? I’m still waiting for you.”' },
            { label: 'Think of someone who has been working hard. Tell them they’ve done a lot and deserve a break.', tip: 'Say it the way you normally comfort or care for family.', idea: 'For example: “You’ve worked really hard lately. Don’t push yourself too much.” Or: “You’ve done enough. Go get some rest.”' },
            { label: 'Think of a time someone really helped you, and thank them in your own words.', tip: 'Adding the little thing they did can make it sound more natural.', idea: 'For example: “I couldn’t have managed that day without your help. Thank you. I still remember it.”' }
          ]
        },
        {
          id: 'dialect',
          title: 'Home Accent',
          hint: 'This group is only for Mandarin projects. One or two naturally spoken local words, place names, or familiar phrases are enough; there is no need to switch fully into a dialect.',
          tasks: [
            { label: 'Say one familiar local phrase, proverb, place name, or childhood phrase in the way you naturally say it.', tip: 'Just add one or two lines naturally. Don’t change your whole speaking style for the recording.', idea: 'It could be a phrase you heard at home growing up, a local way of saying hello, or the name of a place from your hometown. If you don’t know what to say, just use Mandarin.' },
            { label: 'Think of something your family used to say to you when you were little, and say it in the local way you remember.', tip: 'Don’t imitate someone else. Use the voice and pronunciation that come naturally to you.', idea: 'For example: “Come home for dinner,” “Get home early,” or “Don’t stay out too late.” Use your hometown pronunciation if you have one; otherwise, Mandarin is completely fine.' }
          ]
        }
      ],

      /* 引导流程里的操作者界面文案 */
      ui: {
        chatGroupTitle: 'Free talk',
        guideTaskTip: 'Answer in your own words — there\'s no script to follow',
        dialectGroupHint: 'They speak {d} — this group is the highlight, don\'t skip it',
        dialectTipFirst: 'Use their everyday {d} — no need to switch to Mandarin',
        dialectTipRest: 'Say it in {d}, as native as possible',
        dialectNote: 'They speak {d}. Don\'t push them toward standard Mandarin — the dialect itself is what we\'re preserving.'
      }
    }
  };
})();
