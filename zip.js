/*
 * zip.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 极简 ZIP 打包 / 解包实现，无任何依赖。
 *
 * 打包：store 模式（不压缩）。WAV 本身已是无损 PCM，
 *       压缩几乎没收益，还会拖慢手机、吃内存。
 * 解包：支持 store(0) 与 deflate(8)，后者用内置的 inflate 实现，
 *       这样用户把导出包在电脑上重新压缩后再导回来也能读。
 *
 * 文件名统一按 UTF-8 写入并置位 general purpose flag bit 11。
 */
window.ZIP = (function () {
  'use strict';

  /* ================================================================== */
  /* CRC32                                                              */
  /* ================================================================== */
  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* ================================================================== */
  /* 小工具                                                             */
  /* ================================================================== */
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');

  function toBytes(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (typeof data === 'string') return encoder.encode(data);
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      // Blob 只能异步读取，调用方请先 arrayBuffer() 后再传进来
      throw new Error('请先把 Blob 转成 Uint8Array 再添加');
    }
    throw new Error('不支持的数据类型：' + Object.prototype.toString.call(data));
  }

  /** Date → DOS 时间 / 日期 */
  function dosTime(d) {
    return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
  }
  function dosDate(d) {
    return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  }

  /** 往 DataView 里写小端整数 */
  function putU16(v, off, n) { v.setUint16(off, n, true); }
  function putU32(v, off, n) { v.setUint32(off, n, true); }

  /* ================================================================== */
  /* 打包器                                                             */
  /* ================================================================== */
  function ZipWriter() {
    this.files = [];
  }

  /**
   * 添加一个文件
   * @param {string} name  包内路径，用 / 分隔
   * @param {Uint8Array|string|ArrayBuffer} data
   */
  ZipWriter.prototype.add = function (name, data) {
    const bytes = toBytes(data);
    this.files.push({
      name: name,
      data: bytes,
      crc: crc32(bytes),
      size: bytes.length
    });
  };

  /** 目录项 */
  ZipWriter.prototype.addFolder = function (name) {
    if (name.slice(-1) !== '/') name += '/';
    this.add(name, new Uint8Array(0));
  };

  /** 生成 ZIP 的 Blob */
  ZipWriter.prototype.build = function (mime) {
    const parts = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const time = dosTime(now);
    const date = dosDate(now);

    this.files.forEach(function (f) {
      const nameBytes = encoder.encode(f.name);

      // ---- 本地文件头（30 字节 + 文件名）----
      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      putU32(lv, 0, 0x04034b50);      // 签名
      putU16(lv, 4, 20);              // 解压所需版本
      putU16(lv, 6, 0x0800);          // 标志位：文件名 UTF-8
      putU16(lv, 8, 0);               // 方法：store
      putU16(lv, 10, time);
      putU16(lv, 12, date);
      putU32(lv, 14, f.crc);
      putU32(lv, 18, f.size);         // 压缩后大小
      putU32(lv, 22, f.size);         // 原始大小
      putU16(lv, 26, nameBytes.length);
      putU16(lv, 28, 0);              // extra 长度
      local.set(nameBytes, 30);

      parts.push(local);
      if (f.size) parts.push(f.data);

      // ---- 中央目录项（46 字节 + 文件名）----
      const cd = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cd.buffer);
      putU32(cv, 0, 0x02014b50);      // 签名
      putU16(cv, 4, 20);              // 创建版本
      putU16(cv, 6, 20);              // 解压所需版本
      putU16(cv, 8, 0x0800);          // 标志位
      putU16(cv, 10, 0);              // 方法：store
      putU16(cv, 12, time);
      putU16(cv, 14, date);
      putU32(cv, 16, f.crc);
      putU32(cv, 20, f.size);
      putU32(cv, 24, f.size);
      putU16(cv, 28, nameBytes.length);
      putU16(cv, 30, 0);              // extra
      putU16(cv, 32, 0);              // 注释
      putU16(cv, 34, 0);              // 起始磁盘号
      putU16(cv, 36, 0);              // 内部属性
      putU32(cv, 38, 0);              // 外部属性
      putU32(cv, 42, offset);         // 本地头偏移
      cd.set(nameBytes, 46);
      central.push(cd);

      offset += local.length + f.size;
    });

    // ---- 中央目录 ----
    let centralSize = 0;
    central.forEach(function (c) { centralSize += c.length; });

    // ---- 结束记录（22 字节）----
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    putU32(ev, 0, 0x06054b50);
    putU16(ev, 4, 0);
    putU16(ev, 6, 0);
    putU16(ev, 8, this.files.length);
    putU16(ev, 10, this.files.length);
    putU32(ev, 12, centralSize);
    putU32(ev, 16, offset);
    putU16(ev, 20, 0);

    return new Blob(parts.concat(central, [eocd]), { type: mime || 'application/zip' });
  };

  /* ================================================================== */
  /* 可增长的字节缓冲                                                    */
  /* ================================================================== */
  function Bytes(cap) {
    this.buf = new Uint8Array(cap || 1024);
    this.len = 0;
  }
  Bytes.prototype.ensure = function (n) {
    if (this.len + n <= this.buf.length) return;
    let cap = this.buf.length;
    while (cap < this.len + n) cap *= 2;
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  };
  Bytes.prototype.push = function (b) {
    this.ensure(1);
    this.buf[this.len++] = b;
  };
  Bytes.prototype.get = function (i) { return this.buf[i]; };
  Bytes.prototype.toUint8Array = function () { return this.buf.slice(0, this.len); };

  /* ================================================================== */
  /* inflate（原始 DEFLATE，RFC 1951）                                   */
  /* ================================================================== */
  const LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
    35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const LEXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
    257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const DEXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const CLORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  function inflateRaw(input) {
    let pos = 0, bitBuf = 0, bitCnt = 0;
    const out = new Bytes(Math.max(1024, input.length * 3));

    function bits(n) {
      while (bitCnt < n) {
        if (pos >= input.length) throw new Error('数据意外结束');
        bitBuf += input[pos++] * (1 << bitCnt);
        bitCnt += 8;
      }
      const v = bitBuf & ((1 << n) - 1);
      bitBuf = bitBuf >>> n;
      bitCnt -= n;
      return v;
    }

    // 由码长表构造规范 Huffman 解码表
    function build(lengths) {
      const MAXBITS = 15;
      const count = new Int32Array(MAXBITS + 1);
      for (let i = 0; i < lengths.length; i++) count[lengths[i]]++;
      if (count[0] === lengths.length) return { count: count, symbols: new Int32Array(0) };
      let left = 1;
      for (let len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) throw new Error('Huffman 表过满');
      }
      const offs = new Int32Array(MAXBITS + 1);
      for (let len = 1; len < MAXBITS; len++) offs[len + 1] = offs[len] + count[len];
      const symbols = new Int32Array(lengths.length);
      for (let s = 0; s < lengths.length; s++) {
        if (lengths[s]) symbols[offs[lengths[s]]++] = s;
      }
      return { count: count, symbols: symbols };
    }

    function decode(h) {
      let code = 0, first = 0, index = 0;
      for (let len = 1; len <= 15; len++) {
        code |= bits(1);
        const cnt = h.count[len];
        if (code - first < cnt) return h.symbols[index + (code - first)];
        index += cnt;
        first = (first + cnt) << 1;
        code <<= 1;
      }
      throw new Error('无效的 Huffman 编码');
    }

    // 固定 Huffman 表
    let fixedLit = null, fixedDist = null;
    function getFixed() {
      if (fixedLit) return;
      const l = new Uint8Array(288);
      for (let i = 0; i < 144; i++) l[i] = 8;
      for (let i = 144; i < 256; i++) l[i] = 9;
      for (let i = 256; i < 280; i++) l[i] = 7;
      for (let i = 280; i < 288; i++) l[i] = 8;
      fixedLit = build(l);
      const d = new Uint8Array(30);
      for (let i = 0; i < 30; i++) d[i] = 5;
      fixedDist = build(d);
    }

    for (;;) {
      const last = bits(1);
      const type = bits(2);

      if (type === 0) {
        // ---- 未压缩块 ----
        bitBuf = 0; bitCnt = 0;                 // 丢弃当前字节剩余位
        let len = input[pos++] | (input[pos++] << 8);
        pos += 2;                               // 跳过 NLEN
        out.ensure(len);
        for (let i = 0; i < len; i++) out.push(input[pos++]);
      } else if (type === 1 || type === 2) {
        let lencode, distcode;
        if (type === 1) {
          getFixed();
          lencode = fixedLit;
          distcode = fixedDist;
        } else {
          const hlit = bits(5) + 257;
          const hdist = bits(5) + 1;
          const hclen = bits(4) + 4;
          const cl = new Uint8Array(19);
          for (let i = 0; i < hclen; i++) cl[CLORDER[i]] = bits(3);
          const clcode = build(cl);
          const lengths = new Uint8Array(hlit + hdist);
          let i = 0;
          while (i < lengths.length) {
            const sym = decode(clcode);
            if (sym < 16) {
              lengths[i++] = sym;
            } else {
              let repeat, value;
              if (sym === 16) {
                if (i === 0) throw new Error('码长重复位置非法');
                value = lengths[i - 1];
                repeat = 3 + bits(2);
              } else if (sym === 17) {
                value = 0;
                repeat = 3 + bits(3);
              } else {
                value = 0;
                repeat = 11 + bits(7);
              }
              while (repeat--) lengths[i++] = value;
            }
          }
          lencode = build(lengths.subarray(0, hlit));
          distcode = build(lengths.subarray(hlit));
        }

        // ---- 解码主体 ----
        for (;;) {
          const sym = decode(lencode);
          if (sym === 256) break;
          if (sym < 256) {
            out.push(sym);
          } else {
            const li = sym - 257;
            if (li >= 29) throw new Error('无效的长度码');
            const len = LBASE[li] + bits(LEXTRA[li]);
            const dsym = decode(distcode);
            if (dsym >= 30) throw new Error('无效的距离码');
            const dist = DBASE[dsym] + bits(DEXTRA[dsym]);
            if (dist > out.len) throw new Error('距离超出已输出范围');
            out.ensure(len);
            for (let k = 0; k < len; k++) out.push(out.get(out.len - dist));
          }
        }
      } else {
        throw new Error('无效的块类型');
      }

      if (last) break;
    }

    return out.toUint8Array();
  }

  /* ================================================================== */
  /* 解包                                                               */
  /* ================================================================== */

  /**
   * 解析 ZIP
   * @param {ArrayBuffer|Uint8Array} buf
   * @returns {Array<{name:string, data:Uint8Array, dir:boolean}>}
   */
  function read(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

    // 从尾部反查 EOCD 签名
    let eocd = -1;
    const min = Math.max(0, u8.length - 66000);
    for (let i = u8.length - 22; i >= min; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('这不是一个有效的 ZIP 文件');

    let count = dv.getUint16(eocd + 10, true);
    let ptr = dv.getUint32(eocd + 16, true);
    const entries = [];

    for (let n = 0; n < count && ptr + 46 <= u8.length; n++) {
      if (dv.getUint32(ptr, true) !== 0x02014b50) break;
      const method = dv.getUint16(ptr + 10, true);
      const csize = dv.getUint32(ptr + 20, true);
      const nameLen = dv.getUint16(ptr + 28, true);
      const extraLen = dv.getUint16(ptr + 30, true);
      const commentLen = dv.getUint16(ptr + 32, true);
      const localOff = dv.getUint32(ptr + 42, true);
      const flags = dv.getUint16(ptr + 8, true);
      // 文件名可能带 UTF-8 标志，也可能是不带标志的 UTF-8（我们自己写的一定带）
      const name = decoder.decode(u8.subarray(ptr + 46, ptr + 46 + nameLen));

      // 本地头：读取 extra 长度后定位数据起点
      const lNameLen = dv.getUint16(localOff + 26, true);
      const lExtraLen = dv.getUint16(localOff + 28, true);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = u8.subarray(start, start + csize);

      entries.push({
        name: name,
        flags: flags,
        method: method,
        raw: raw
      });

      ptr += 46 + nameLen + extraLen + commentLen;
    }

    return entries.map(function (e) {
      if (e.name.slice(-1) === '/') {
        return { name: e.name, dir: true, data: new Uint8Array(0) };
      }
      let data;
      if (e.method === 0) {
        data = e.raw;
      } else if (e.method === 8) {
        data = inflateRaw(e.raw);
      } else {
        throw new Error('不支持的压缩方式：' + e.method);
      }
      return { name: e.name, dir: false, data: data };
    });
  }

  /** 从解出的条目里按名字取一个文件（找不到返回 null） */
  function find(entries, name) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].name === name) return entries[i].data;
    }
    return null;
  }

  return {
    crc32: crc32,
    create: function () { return new ZipWriter(); },
    read: read,
    find: find,
    inflateRaw: inflateRaw
  };
})();
