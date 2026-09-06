/*
 * 生成 PNG 图标与 favicon.ico（仅构建期使用，不参与运行时）
 * 用法：node tools/gen-icons.js
 * 零依赖：PNG 用 zlib 手写，ICO 直接内嵌 PNG。
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..');
const ICONS = path.join(OUT, 'icons');

const BG = [0xC0, 0x6A, 0x45];
const FG = [0xFD, 0xFB, 0xF7];

/* ---------------- 形状（坐标系：512x512） ---------------- */
function roundedRect(px, py, x0, y0, x1, y1, r) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const cx = Math.min(Math.max(px, x0 + r), x1 - r);
  const cy = Math.min(Math.max(py, y0 + r), y1 - r);
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

// 麦克风：胶囊 + U 形托架 + 立杆 + 底座
function mark(px, py) {
  if (roundedRect(px, py, 208, 124, 304, 260, 48)) return true;          // 拾音头
  if (roundedRect(px, py, 247, 306, 265, 368, 0)) return true;           // 立杆
  if (roundedRect(px, py, 206, 366, 306, 388, 11)) return true;          // 底座
  const d = Math.hypot(px - 256, py - 236);
  if (py >= 236 && Math.abs(d - 80) <= 9) return true;                   // U 形托架
  if (Math.hypot(px - 176, py - 236) <= 9) return true;                  // 左端圆头
  if (Math.hypot(px - 336, py - 236) <= 9) return true;                  // 右端圆头
  return false;
}

/* ---------------- 渲染 ---------------- */
function render(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 3;                       // 3x3 超采样
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let covBg = 0, covFg = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) * 512 / size;
          const py = (y + (sy + 0.5) / SS) * 512 / size;
          if (maskable ? true : roundedRect(px, py, 0, 0, 512, 512, 112)) covBg++;
          if (mark(px, py)) covFg++;
        }
      }
      const n = SS * SS;
      const aBg = covBg / n;
      const aFg = covFg / n;
      // fg 画在 bg 之上
      const a = aBg + aFg * (1 - aBg);
      const r = (FG[0] * aFg + BG[0] * (aBg - aFg * aBg)) / (a || 1);
      const g = (FG[1] * aFg + BG[1] * (aBg - aFg * aBg)) / (a || 1);
      const b = (FG[2] * aFg + BG[2] * (aBg - aFg * aBg)) / (a || 1);
      const i = (y * size + x) * 4;
      // 预乘还原：按未预乘 alpha 输出
      rgba[i] = Math.round(Math.min(255, a ? r / a : 0));
      rgba[i + 1] = Math.round(Math.min(255, a ? g / a : 0));
      rgba[i + 2] = Math.round(Math.min(255, a ? b / a : 0));
      rgba[i + 3] = Math.round(Math.min(255, a * 255));
    }
  }
  return rgba;
}

/* ---------------- PNG 编码 ---------------- */
let CRC_TABLE = null;
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  CRC_TABLE = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c;
  }
  return CRC_TABLE;
}
function crc32(buf) {
  const t = crcTable();
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;                                  // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;      // bit depth
  ihdr[9] = 6;      // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------- ICO 编码 ---------------- */
function encodeIco(entries) {   // entries: [{size, png}]
  const n = entries.length;
  const dir = Buffer.alloc(6 + 16 * n);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(n, 4);
  let offset = dir.length;
  entries.forEach(function (e, i) {
    const o = 6 + 16 * i;
    dir[o] = e.size >= 256 ? 0 : e.size;
    dir[o + 1] = e.size >= 256 ? 0 : e.size;
    dir[o + 2] = 0;                 // 调色板
    dir[o + 3] = 0;                 // 保留
    dir.writeUInt16LE(1, o + 4);    // 色彩平面
    dir.writeUInt16LE(32, o + 6);   // 位深
    dir.writeUInt32LE(e.png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.png.length;
  });
  return Buffer.concat([dir].concat(entries.map(function (e) { return e.png; })));
}

/* ---------------- 输出 ---------------- */
if (!fs.existsSync(ICONS)) fs.mkdirSync(ICONS, { recursive: true });

[180, 192, 512].forEach(function (s) {
  const png = encodePng(s, render(s, false));
  fs.writeFileSync(path.join(ICONS, 'icon-' + s + '.png'), png);
  console.log('icon-' + s + '.png', png.length, 'bytes');
});

{
  const png = encodePng(512, render(512, true));
  fs.writeFileSync(path.join(ICONS, 'icon-512-maskable.png'), png);
  console.log('icon-512-maskable.png', png.length, 'bytes');
}

{
  const entries = [16, 32, 48, 256].map(function (s) {
    return { size: s, png: encodePng(s, render(s, false)) };
  });
  const ico = encodeIco(entries);
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);
  console.log('favicon.ico', ico.length, 'bytes');
}

console.log('done');
