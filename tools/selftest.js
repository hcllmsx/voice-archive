/*
 * 自测：ZIP 打包/解包、inflate、WAV 封装、内容完整性
 * 用法：node tools/selftest.js
 * 仅构建期使用，不参与运行时。
 */
'use strict';

// 最小垫片，让浏览器脚本能在 Node 里加载
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
}

require('../content.js');
require('../db.js');       // 只验证能加载；IndexedDB 相关逻辑不在 Node 里跑
require('../zip.js');
require('../recorder.js');

const C = window.Content;
const ZIP = window.ZIP;
const VR = window.VoiceRecorder;

let failed = 0;
function check(name, cond) {
  if (cond) console.log('  ok  ' + name);
  else { console.log('FAIL  ' + name); failed++; }
}

/* ---------------- 1. 内容完整性 ---------------- */
console.log('\n[content]');
check('NEXT_STEPS 含路径 D:\\voice', C.NEXT_STEPS.includes('D:\\voice'));
check('NEXT_STEPS 含 GPT-SoVITS-v2pro-xxx\\GPT_weights\\', C.NEXT_STEPS.includes('GPT-SoVITS-v2pro-xxx\\GPT_weights\\'));
check('NEXT_STEPS 反斜杠未被转义成垂直制表符', !C.NEXT_STEPS.includes('\x0b'));
check('NEXT_STEPS 完整（含结尾祝福）', C.NEXT_STEPS.includes('祝你顺利'));
check('5 个年龄段', C.AGE_GROUPS.length === 5);
const qCounts = C.AGE_GROUPS.map(g => g.questions.length).join(',');
check('引导问题数量 10,10,9,9,9 → ' + qCounts, qCounts === '10,10,9,9,9');
const taskCounts = C.AGE_GROUPS.map(g => C.buildTasks(g.id).length);
console.log('  任务总数：' + taskCounts.join(', '));
check('必录清单 6 组', C.CHECKLIST.length === 6);
check('每组任务数一致（16 条必录）',
  C.AGE_GROUPS.every(g => C.buildTasks(g.id).length - g.questions.length === 16));
check('任务 id 无重复',
  C.AGE_GROUPS.every(g => new Set(C.buildTasks(g.id).map(t => t.id)).size === C.buildTasks(g.id).length));

/* ---------------- 2. ZIP 打包 → 解包 ---------------- */
console.log('\n[zip round-trip]');
{
  const zip = ZIP.create();
  zip.addFolder('wavs/');
  const wavBytes = new Uint8Array(1000);
  for (let i = 0; i < wavBytes.length; i++) wavBytes[i] = i & 0xFF;
  zip.add('wavs/0001.wav', wavBytes);
  zip.add('接下来怎么做.txt', C.NEXT_STEPS);
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
    check('中文文本一致', txtBack === C.NEXT_STEPS);

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
    'text-200kb': Buffer.from((C.NEXT_STEPS + '\n').repeat(60), 'utf-8'),
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
