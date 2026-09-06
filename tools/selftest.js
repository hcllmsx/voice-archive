/*
 * 自测：ZIP 打包/解包、inflate、WAV 封装、内容完整性
 * 用法：node tools/selftest.js
 * 仅构建期使用，不参与运行时。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

// 最小垫片，让浏览器脚本能在 Node 里加载
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
}

// 语言包 → 多语言核心 → 内容结构层（顺序与 index.html 一致）
require('../i18n/zh.js');
require('../i18n/en.js');
require('../i18n/core.js');
require('../content.js');
require('../db.js');       // 只验证能加载；IndexedDB 相关逻辑不在 Node 里跑
require('../zip.js');
require('../recorder.js');

const C = window.Content;
const ZIP = window.ZIP;
const VR = window.VoiceRecorder;
const ZH = window.I18N_LANGS.zh.guide;
const EN = window.I18N_LANGS.en.guide;

// 独立文档（导出包里「接下来怎么做.txt」的来源）
const NEXT_STEPS_ZH = fs.readFileSync(path.join(root, 'nextsteps', 'next-steps.zh.txt'), 'utf8');

let failed = 0;
function check(name, cond) {
  if (cond) console.log('  ok  ' + name);
  else { console.log('FAIL  ' + name); failed++; }
}

/* ---------------- 1. 内容完整性 ---------------- */
console.log('\n[content]');
check('中文说明文档含路径 D:\\voice', NEXT_STEPS_ZH.includes('D:\\voice'));
check('中文说明文档含权重保存路径', NEXT_STEPS_ZH.includes('GPT-SoVITS-v2pro-xxx\\GPT_weights\\'));
check('说明文档反斜杠未被转义成垂直制表符', !NEXT_STEPS_ZH.includes('\x0b'));
check('中文说明文档完整（含结尾祝福）', NEXT_STEPS_ZH.includes('祝你顺利'));

const AGE_IDS = C.AGE_GROUPS.map(g => g.id).join(',');
check('5 个年龄段 → ' + AGE_IDS, AGE_IDS === 'toddler,child,teen,adult,elder');

const qCounts = C.AGE_GROUPS.map(g => ZH.ageGroups[g.id].questions.length).join(',');
check('中文引导问题数量 10,10,9,9,9 → ' + qCounts, qCounts === '10,10,9,9,9');

check('中文必录清单 6 组', ZH.checklist.length === 6);
const taskCounts = C.AGE_GROUPS.map(g => C.buildTasks(g.id).length);
console.log('  任务总数：' + taskCounts.join(', '));
check('每组任务数一致（16 条必录）',
  C.AGE_GROUPS.every(g => C.buildTasks(g.id).length - ZH.ageGroups[g.id].questions.length === 16));
check('任务 id 无重复',
  C.AGE_GROUPS.every(g => new Set(C.buildTasks(g.id).map(t => t.id)).size === C.buildTasks(g.id).length));

/* 中英语言包结构对齐（防漏翻 / 组错位） */
check('英文年龄段的引导问题数量与中文一致',
  C.AGE_GROUPS.every(g => EN.ageGroups[g.id] && EN.ageGroups[g.id].questions.length === ZH.ageGroups[g.id].questions.length));
check('英文必录清单与中文结构一致（组顺序 / 任务数）',
  EN.checklist.length === ZH.checklist.length &&
  EN.checklist.every((e, i) => e.id === ZH.checklist[i].id && e.tasks.length === ZH.checklist[i].tasks.length));
check('英文语言选项齐全',
  Object.keys(EN.languages).join(',') === Object.keys(ZH.languages).join(','));
check('T 取到界面文案（zh/en 任一）', ['Voice Archive', '声音留档'].indexOf(window.I18N.T('appTitle')) >= 0);
check('T 缺 key 回退 key 本身', window.I18N.T('__no_such_key__') === '__no_such_key__');

/* 引导任务组装：英文引导 + 中文界面混排 */
{
  const zhOnly = C.buildTasks('elder', '', 'zh', 'zh');
  const enGuideZhUi = C.buildTasks('elder', '', 'en', 'zh');
  check('英文引导的任务数与中文一致', enGuideZhUi.length === zhOnly.length);
  check('英文引导的问题为英文', C.buildTasks('elder', '', 'en', 'en').some(t => /house|child|spouse|work/i.test(t.label)));
  check('界面中文时聊天组标题为中文',
    C.buildTasks('elder', '', 'en', 'zh').some(t => t.group === 'guide' && t.groupTitle === '聊一聊'));

  const dZh = C.buildTasks('elder', '四川话', 'zh', 'zh');
  const firstDialect = dZh.findIndex(function (t) { return t.id.indexOf('must.dialect.') === 0; });
  const firstCatch = dZh.findIndex(function (t) { return t.id.indexOf('must.catchphrase.') === 0; });
  check('方言组前移（call 3 句之后紧接方言，且先于口头禅）', firstDialect === 3 && firstCatch > firstDialect);
  check('方言组提示含方言（中文界面）',
    C.buildTasks('elder', '四川话', 'en', 'zh').some(t => t.id === 'must.dialect.0' && t.tip.indexOf('四川话') >= 0));
  check('方言组提示含方言（英文界面）',
    C.buildTasks('elder', 'Sichuanese', 'en', 'en').some(t => t.id === 'must.dialect.0' && t.tip.indexOf('Sichuanese') >= 0));
}
check('方言提示（中文）', C.dialectNote('四川话', 'zh').indexOf('普通话') >= 0);
check('方言提示（英文）', C.dialectNote('Sichuanese', 'en').indexOf('Mandarin') >= 0);
check('语言元数据 train', C.trainCode('zh-dialect') === 'zh' && C.trainCode('yue') === 'yue');
check('语言合并 label（中/英）',
  C.language('zh', 'zh').label === '中文（普通话）' && C.language('zh', 'en').label === 'Chinese (Mandarin)');
check('语言合并 dialectable', C.language('zh-dialect', 'zh').dialectable === true);
check('用途合并（中/英）',
  C.purpose('archive', 'zh').label === '只是想把声音存下来' && C.purpose('archive', 'en').label === 'Just preserve the voice');
check('年龄段合并（中/英）',
  C.ageGroup('elder', 'zh').label === '长辈' && C.ageGroup('elder', 'en').label === 'Elder');
check('引导语言映射：en→en / ja→zh',
  window.I18N.guideLang('en') === 'en' && window.I18N.guideLang('ja') === 'zh' && window.I18N.guideLang('zh') === 'zh');

/* ---------------- 2. ZIP 打包 → 解包 ---------------- */
console.log('\n[zip round-trip]');
{
  const zip = ZIP.create();
  zip.addFolder('wavs/');
  const wavBytes = new Uint8Array(1000);
  for (let i = 0; i < wavBytes.length; i++) wavBytes[i] = i & 0xFF;
  zip.add('wavs/0001.wav', wavBytes);
  zip.add('接下来怎么做.txt', NEXT_STEPS_ZH);
  zip.add('dataset.list', 'E:\\voice\\wavs\\0001.wav|nainai|zh|你好\n');
  zip.add('project.json', JSON.stringify({ app: 'voice-archive', ok: true }));

  const blob = zip.build();
  check('ZIP 生成 Blob', blob.size > 0);

  blob.arrayBuffer().then(function (buf) {
    const entries = ZIP.read(buf);
    const names = entries.map(e => e.name);
    check('目录项存在', names.includes('wavs/'));
    check('中文名文件保留', names.includes('接下来怎么做.txt'));
    check('4 个文件 + 1 个目录', names.length === 5);

    const wavBack = ZIP.find(entries, 'wavs/0001.wav');
    check('WAV 字节一致', wavBack && wavBack.length === wavBytes.length &&
      wavBack.every((b, i) => b === wavBytes[i]));

    const txtBack = new TextDecoder('utf-8').decode(ZIP.find(entries, '接下来怎么做.txt'));
    check('中文文本一致（与独立 txt 文件）', txtBack === NEXT_STEPS_ZH);

    const listBack = new TextDecoder('utf-8').decode(ZIP.find(entries, 'dataset.list'));
    check('dataset.list 一致', listBack === 'E:\\voice\\wavs\\0001.wav|nainai|zh|你好\n');

    // UTF-8 文件名标志位（bit 11）
    const dv = new DataView(buf);
    const flags = dv.getUint16(new Uint8Array(buf).length ? 6 : 6, true);
    check('本地头置位 UTF-8 标志 (0x0800)', (flags & 0x0800) !== 0);

    return testInflate();
  }).then(function () {
    return testWav();
  }).then(function () {
    console.log(failed ? '\n' + failed + ' 项失败' : '\n全部通过');
    process.exit(failed ? 1 : 0);
  }).catch(function (e) {
    console.error('测试异常：', e);
    process.exit(1);
  });
}

/* ---------------- 3. inflate（解压 deflate 包） ---------------- */
function testInflate() {
  console.log('\n[inflate]');
  const zlib = require('zlib');

  // 三种数据：纯文本（高压缩）、伪随机（接近存储块）、重复模式（长距离匹配）
  const cases = {
    'text-200kb': Buffer.from((NEXT_STEPS_ZH + '\n').repeat(60), 'utf-8'),
    'random-64kb': (function () {
      let seed = 12345;
      const b = Buffer.alloc(65536);
      for (let i = 0; i < b.length; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
        b[i] = seed & 0xFF;
      }
      return b;
    })(),
    'repeat-128kb': (function () {
      const unit = Buffer.from('声音留档 ABCDEF 0123456789 ——', 'utf-8');
      const b = Buffer.alloc(128 * 1024);
      for (let i = 0; i < b.length; i += unit.length) unit.copy(b, i);
      return b;
    })()
  };

  let ok = true;
  Object.keys(cases).forEach(function (name) {
    const raw = cases[name];
    // level 0 → 存储块；level 9 → 动态/固定 Huffman
    [0, 1, 9].forEach(function (lvl) {
      const deflated = zlib.deflateRawSync(raw, { level: lvl });
      const back = Buffer.from(ZIP.inflateRaw(new Uint8Array(deflated)));
      const same = back.length === raw.length && back.equals(raw);
      if (!same) { ok = false; console.log('FAIL  ' + name + ' level=' + lvl); }
    });
  });
  check('存储块 / 固定 / 动态 Huffman 三种压缩级全部还原', ok);

  // 完整链路：Node 打一个 deflate 的 zip，用我们的 read() 解
  const zip = ZIP.create();
  const data = new Uint8Array(cases['repeat-128kb']);
  zip.add('big.bin', data);
  return zip.build().arrayBuffer().then(function (storeBuf) {
    // 把 store 改成 deflate：手动构造一个 deflate zip
    const zlib2 = require('zlib');
    const deflated = zlib2.deflateRawSync(Buffer.from(data), { level: 9 });
    const out = [];
    const enc = new TextEncoder();
    const nameBytes = enc.encode('big.bin');
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(8, 8, true);                    // method = deflate
    lv.setUint32(18, deflated.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    out.push(local, deflated);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, 8, true);
    cv.setUint32(20, deflated.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, 0, true);
    cd.set(nameBytes, 46);
    out.push(cd);

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, 1, true);
    ev.setUint16(10, 1, true);
    ev.setUint32(12, cd.length, true);
    ev.setUint32(16, local.length + deflated.length, true);
    out.push(eocd);

    const blob = new Blob(out);
    return blob.arrayBuffer().then(function (buf) {
      const entries = ZIP.read(buf);
      const back = ZIP.find(entries, 'big.bin');
      check('deflate ZIP 解包 128KB 一致',
        back && back.length === data.length && back.every((b, i) => b === data[i]));
    });
  });
}

/* ---------------- 4. WAV 封装 ---------------- */
function testWav() {
  console.log('\n[wav]');
  // 48kHz 正弦 → 重采样 32kHz → WAV
  const srcRate = 48000;
  const seconds = 1.37;
  const src = new Float32Array(Math.floor(srcRate * seconds));
  for (let i = 0; i < src.length; i++) {
    src[i] = 0.5 * Math.sin(2 * Math.PI * 220 * i / srcRate);
  }
  const res = VR.toWavBlob(src, srcRate);

  check('输出采样率 32000', res.rate === 32000);
  check('时长约 ' + seconds.toFixed(2) + 's', Math.abs(res.duration - seconds) < 0.01);

  return res.blob.arrayBuffer().then(function (buf) {
    const dv = new DataView(buf);
    const tag = function (o) {
      return String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
    };
    check('RIFF 头', tag(0) === 'RIFF' && tag(8) === 'WAVE');
    check('fmt 块', tag(12) === 'fmt ' && dv.getUint32(16, true) === 16);
    check('PCM 格式码', dv.getUint16(20, true) === 1);
    check('单声道', dv.getUint16(22, true) === 1);
    check('采样率 32000', dv.getUint32(24, true) === 32000);
    check('字节率 64000', dv.getUint32(28, true) === 64000);
    check('块对齐 2 / 位深 16', dv.getUint16(32, true) === 2 && dv.getUint16(34, true) === 16);
    check('data 块', tag(36) === 'data');
    const dataLen = dv.getUint32(40, true);
    check('数据长度 = 44 + PCM', buf.byteLength === 44 + dataLen);
    check('数据长度 = 时长×32000×2', dataLen === Math.round(seconds * 32000) * 2);
    check('总大小 44 字节头', buf.byteLength > 44);

    // 16bit 样本幅度检查（0.5 幅度正弦 ≈ ±16384）
    let peak = 0;
    for (let i = 0; i < Math.min(2000, dataLen / 2); i++) {
      const v = Math.abs(dv.getInt16(44 + i * 2, true));
      if (v > peak) peak = v;
    }
    check('样本幅度正常（峰值 ~16000，实际 ' + peak + '）', peak > 12000 && peak < 17000);

    // 已经是 32kHz 的输入不应触发重采样：样本数保持不变
    const src32 = new Float32Array(32000);   // 恰好 1 秒
    for (let i = 0; i < src32.length; i++) src32[i] = 0.5 * Math.sin(2 * Math.PI * 220 * i / 32000);
    const same = VR.toWavBlob(src32, 32000);
    return same.blob.arrayBuffer().then(function (b2) {
      check('32k 输入不重采样：44 + 32000×2 = ' + (44 + 64000), b2.byteLength === 44 + 64000);
      check('32k 输入时长为 1 秒', Math.abs(same.duration - 1) < 0.001);
    });
  });
}
