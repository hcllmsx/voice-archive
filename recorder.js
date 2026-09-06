/*
 * recorder.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * 录音、重采样、WAV 封装。
 *
 * 三个关键点：
 *   1. getUserMedia 必须显式关闭 echoCancellation / noiseSuppression /
 *      autoGainControl。这三项会压掉气息、笑声和动态范围，
 *      而它们正是声音留档里最珍贵的特征。
 *   2. 不用 MediaRecorder 录 WAV（Safari 不支持，只给 audio/mp4 + AAC），
 *      改为 AudioWorklet 采集 Float32 原始 PCM，自己写 WAV 头。
 *   3. 手机麦克风原生 44.1k / 48k，GPT-SoVITS 要 32kHz/16bit/单声道，
 *      所以在 App 内线性插值重采样，不留到电脑上去用 ffmpeg。
 */
window.VoiceRecorder = (function () {
  'use strict';

  const TARGET_RATE = 32000;   // GPT-SoVITS 需要的采样率
  const TARGET_BITS = 16;
  const CHANNELS = 1;

  /* ================================================================== */
  /* AudioWorklet 处理器源码                                             */
  /* 用 Blob URL 加载，就不需要额外多一个 js 文件                        */
  /* ================================================================== */
  const WORKLET_SOURCE = [
    'class PCMCapture extends AudioWorkletProcessor {',
    '  constructor() {',
    '    super();',
    '    this.buf = new Float32Array(8192);',
    '    this.fill = 0;',
    '  }',
    '  flush() {',
    '    if (this.fill === 0) return;',
    '    const out = this.buf.slice(0, this.fill);',
    '    this.port.postMessage(out);',
    '    this.fill = 0;',
    '  }',
    '  process(inputs) {',
    '    const input = inputs[0];',
    '    if (input && input[0] && input[0].length) {',
    '      const ch = input[0];',
    '      for (let i = 0; i < ch.length; i++) {',
    '        this.buf[this.fill++] = ch[i];',
    '        if (this.fill >= this.buf.length) this.flush();',
    '      }',
    '    }',
    '    return true;',
    '  }',
    '}',
    'registerProcessor("pcm-capture", PCMCapture);'
  ].join('\n');

  /* ================================================================== */
  /* 基础工具                                                           */
  /* ================================================================== */
  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
      (window.AudioContext || window.webkitAudioContext));
  }

  /**
   * 线性插值重采样
   * 语音场景足够用，且比 ffmpeg 那一步对用户友好得多
   */
  function resample(input, srcRate, dstRate) {
    if (srcRate === dstRate) return input;
    const ratio = srcRate / dstRate;
    const outLen = Math.max(1, Math.floor(input.length / ratio));
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const p = i * ratio;
      const i0 = Math.floor(p);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const frac = p - i0;
      out[i] = input[i0] * (1 - frac) + input[i1] * frac;
    }
    return out;
  }

  /** Float32（-1~1）→ 16bit PCM 小端字节 */
  function floatTo16BitPCM(input) {
    const len = input.length;
    const out = new Uint8Array(len * 2);
    const view = new DataView(out.buffer);
    for (let i = 0; i < len; i++) {
      let s = input[i];
      s = s < -1 ? -1 : (s > 1 ? 1 : s);
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return out;
  }

  /** 写标准 RIFF/WAVE 头（44 字节）+ PCM 数据 */
  function encodeWAV(samples, sampleRate) {
    const pcm = floatTo16BitPCM(samples);
    const buffer = new ArrayBuffer(44 + pcm.length);
    const view = new DataView(buffer);

    function str(offset, s) {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    }

    str(0, 'RIFF');
    view.setUint32(4, 36 + pcm.length, true);          // 总长 - 8
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);                      // fmt 块长度
    view.setUint16(20, 1, true);                       // PCM
    view.setUint16(22, CHANNELS, true);                // 单声道
    view.setUint32(24, sampleRate, true);              // 采样率
    view.setUint32(28, sampleRate * CHANNELS * TARGET_BITS / 8, true); // 字节率
    view.setUint16(32, CHANNELS * TARGET_BITS / 8, true);              // 块对齐
    view.setUint16(34, TARGET_BITS, true);             // 位深
    str(36, 'data');
    view.setUint32(40, pcm.length, true);

    const bytes = new Uint8Array(buffer);
    bytes.set(pcm, 44);
    return new Blob([bytes], { type: 'audio/wav' });
  }

  /** 把任意采样率的 Float32 转成 32k/16bit/单声道的 WAV Blob */
  function toWavBlob(float32, srcRate) {
    const resampled = resample(float32, srcRate, TARGET_RATE);
    return {
      blob: encodeWAV(resampled, TARGET_RATE),
      duration: resampled.length / TARGET_RATE,
      rate: TARGET_RATE
    };
  }

  /* ================================================================== */
  /* 开头静音裁剪                                                       */
  /* 按下录音后总要愣一下才开口，前面那段空白留着没用：                  */
  /* 训练时是纯噪声，当参考音频还会把时长顶到 10 秒以上。                */
  /* ================================================================== */

  const TRIM_WIN_SEC = 0.02;    // 判定窗口：20ms
  const TRIM_MIN_CUT = 0.15;    // 少于这么多秒不值得动
  const TRIM_KEEP_MIN = 0.5;    // 裁完至少还得剩这么多秒
  const TRIM_PRE_ROLL = 0.08;   // 起点往前留的余量，别把起音咬掉
  const TRIM_FLOOR = 0.002;     // 绝对地板（约 -54dBFS），低于它一律当静音

  /**
   * 裁掉开头的静音段。
   * 门槛是「从这段录音自己身上估出来的」：取 90 百分位当说话音量、开头几窗的中位数当底噪，
   * 门槛同时高于底噪 3 倍、低于说话音量一截，这样手机底噪大一点小一点都不会误判。
   * 找到第一个「连续两窗都超门槛」的位置当人声起点（单窗不算，躲开咳嗽、碰麦那种一下的响动）。
   * @param {Float32Array} input 原始 PCM
   * @param {number} sampleRate
   * @returns {{samples: Float32Array, trimmed: number}} trimmed = 裁掉的秒数，0 表示没裁
   */
  function trimLeadingSilence(input, sampleRate) {
    const win = Math.max(1, Math.round(sampleRate * TRIM_WIN_SEC));
    const n = Math.floor(input.length / win);
    if (n < 10) return { samples: input, trimmed: 0 };

    // 每个窗口的 RMS
    const rms = new Float32Array(n);
    for (let w = 0; w < n; w++) {
      let sum = 0;
      const at = w * win;
      for (let i = 0; i < win; i++) {
        const v = input[at + i];
        sum += v * v;
      }
      rms[w] = Math.sqrt(sum / win);
    }

    // 说话音量：90 百分位（比最大值稳，不被个别爆音带跑）
    const sorted = rms.slice().sort();
    const speech = sorted[Math.floor(n * 0.9)] || 0;
    // 整段几乎没声音就别动手了
    if (speech < TRIM_FLOOR * 2) return { samples: input, trimmed: 0 };

    // 底噪：开头本来就是我们要判定的空白，取前几窗的中位数
    const headN = Math.min(15, n);
    const head = rms.slice(0, headN).sort();
    const noise = head[Math.floor(headN / 2)] || 0;

    const threshold = Math.max(speech * 0.08, noise * 3, TRIM_FLOOR);

    let startWin = -1;
    for (let w = 0; w < n - 1; w++) {
      if (rms[w] > threshold && rms[w + 1] > threshold) { startWin = w; break; }
    }
    if (startWin <= 0) return { samples: input, trimmed: 0 };

    let start = startWin * win - Math.round(sampleRate * TRIM_PRE_ROLL);
    if (start < 0) start = 0;

    const trimmed = start / sampleRate;
    const remain = (input.length - start) / sampleRate;
    if (trimmed < TRIM_MIN_CUT || remain < TRIM_KEEP_MIN) return { samples: input, trimmed: 0 };

    return { samples: input.slice(start), trimmed: trimmed };
  }

  /* ================================================================== */
  /* 录音器                                                             */
  /* ================================================================== */
  function Recorder() {
    this.ctx = null;
    this.stream = null;
    this.source = null;
    this.analyser = null;
    this.node = null;
    this.silent = null;
    this.chunks = [];
    this.frames = 0;
    this.rate = 0;
    this.recording = false;
    this.startedAt = 0;
    this.mode = '';            // 'worklet' | 'script'
    this._levelBuf = null;
  }

  /** 解锁 / 创建音频上下文（iOS 必须在用户手势中调用） */
  Recorder.prototype.prepare = function () {
    const self = this;
    if (this.ctx) {
      return this._resume();
    }

    if (!supported()) {
      const msg = (window.I18N && window.I18N.T)
        ? window.I18N.T('micPrepFail')
        : '当前环境不能调用麦克风：请确认网址是 https://，并用系统浏览器（Chrome / Edge / Safari）打开';
      return Promise.reject(new Error(msg));
    }

    // 关键：三个「增强」选项全部关闭
    const constraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      }
    };

    return navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      self.stream = stream;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      let ctx;
      // 优先直接以 32kHz 打开；老浏览器不支持 sampleRate 选项则回退
      try {
        ctx = new Ctor({ sampleRate: TARGET_RATE });
      } catch (e) {
        ctx = new Ctor();
      }
      self.ctx = ctx;
      self.rate = ctx.sampleRate;
      return ctx.audioWorklet
        ? ctx.audioWorklet.addModule(URL.createObjectURL(
            new Blob([WORKLET_SOURCE], { type: 'application/javascript' })
          )).then(function () { return 'worklet'; })
            .catch(function () { return 'script'; })
        : Promise.resolve('script');
    }).then(function (mode) {
      const ctx = self.ctx;
      self.mode = mode;
      self.source = ctx.createMediaStreamSource(self.stream);
      self.analyser = ctx.createAnalyser();
      self.analyser.fftSize = 1024;
      self.analyser.smoothingTimeConstant = 0.2;
      self._levelBuf = new Float32Array(self.analyser.fftSize);

      // 静音增益：让节点链能被拉取，又不会有回声
      self.silent = ctx.createGain();
      self.silent.gain.value = 0;

      if (mode === 'worklet') {
        self.node = new AudioWorkletNode(ctx, 'pcm-capture');
        self.node.port.onmessage = function (e) {
          if (!self.recording) return;
          self.chunks.push(e.data);
          self.frames += e.data.length;
        };
      } else {
        // 兜底：ScriptProcessorNode（老 Safari / 微信内核）
        self.node = ctx.createScriptProcessor(4096, 1, 1);
        self.node.onaudioprocess = function (e) {
          if (!self.recording) return;
          const ch = e.inputBuffer.getChannelData(0);
          const copy = new Float32Array(ch.length);
          copy.set(ch);
          self.chunks.push(copy);
          self.frames += copy.length;
        };
      }

      // 链路：source → analyser → 采集节点 → 静音增益 → 输出
      self.source.connect(self.analyser);
      self.analyser.connect(self.node);
      self.node.connect(self.silent);
      self.silent.connect(ctx.destination);

      return self._resume();
    });
  };

  Recorder.prototype._resume = function () {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve();
    if (ctx.state === 'suspended') {
      return ctx.resume().catch(function () {});
    }
    return Promise.resolve();
  };

  /** 开始录音（会丢弃上一次的结果） */
  Recorder.prototype.start = function () {
    const self = this;
    return this.prepare().then(function () {
      self.chunks = [];
      self.frames = 0;
      self.recording = true;
      self.startedAt = Date.now();
    });
  };

  /** 停止录音并产出 WAV */
  Recorder.prototype.stop = function () {
    this.recording = false;
    if (!this.ctx) return Promise.resolve(null);

    const total = this.frames;
    if (!total) return Promise.resolve(null);

    const merged = new Float32Array(total);
    let off = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      merged.set(this.chunks[i], off);
      off += this.chunks[i].length;
    }
    this.chunks = [];

    // 开头发呆留下的空白自动裁掉；原版也留一份，用户在确认页想保留原样还能换回来
    const cut = trimLeadingSilence(merged, this.rate);
    const result = toWavBlob(cut.samples, this.rate);
    result.trimmed = cut.trimmed;
    if (cut.trimmed > 0) {
      const raw = toWavBlob(merged, this.rate);
      result.rawBlob = raw.blob;
      result.rawDuration = raw.duration;
    }
    result.elapsed = (Date.now() - this.startedAt) / 1000;
    return Promise.resolve(result);
  };

  /** 放弃本次录音 */
  Recorder.prototype.cancel = function () {
    this.recording = false;
    this.chunks = [];
    this.frames = 0;
  };

  /**
   * 实时电平。
   * 返回 { rms, peak, db }，db 为 RMS 分贝值。
   * 说明：文档里的「-9dB ~ -6dB」是峰值口径；语音峰均比约 15dB，
   *       换算到 RMS 舒适区约为 -27dB ~ -15dB，界面按这个区间判定。
   */
  Recorder.prototype.level = function () {
    if (!this.analyser || !this.recording) return { rms: 0, peak: 0, db: -100 };
    const buf = this._levelBuf;
    this.analyser.getFloatTimeDomainData(buf);
    let sum = 0, peak = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      sum += v * v;
      const a = v < 0 ? -v : v;
      if (a > peak) peak = a;
    }
    const rms = Math.sqrt(sum / buf.length);
    return {
      rms: rms,
      peak: peak,
      db: rms > 0 ? 20 * Math.log10(rms) : -100
    };
  };

  /** 实时波形数据（用于 Canvas 绘制） */
  Recorder.prototype.waveform = function (target) {
    if (!this.analyser) return null;
    const buf = this._levelBuf || new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    if (target) target.set(buf);
    return buf;
  };

  Recorder.prototype.analysisSize = function () {
    return this.analyser ? this.analyser.fftSize : 1024;
  };

  /** 释放麦克风与音频上下文 */
  Recorder.prototype.dispose = function () {
    this.recording = false;
    if (this.stream) {
      this.stream.getTracks().forEach(function (t) { t.stop(); });
      this.stream = null;
    }
    if (this.source) { try { this.source.disconnect(); } catch (e) {} }
    if (this.node) { try { this.node.disconnect(); } catch (e) {} }
    if (this.analyser) { try { this.analyser.disconnect(); } catch (e) {} }
    if (this.silent) { try { this.silent.disconnect(); } catch (e) {} }
    if (this.ctx) { try { this.ctx.close(); } catch (e) {} }
    this.ctx = null;
    this.node = null;
    this.analyser = null;
    this.chunks = [];
  };

  /* ================================================================== */
  /* 导入已有音频（微信语音、旧录音等）                                   */
  /* ================================================================== */
  function decodeFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctor();
        const done = function (audioBuffer) {
          // 混成单声道后重采样到 32k
          const n = audioBuffer.length;
          const mono = new Float32Array(n);
          const count = audioBuffer.numberOfChannels;
          for (let c = 0; c < count; c++) {
            const ch = audioBuffer.getChannelData(c);
            for (let i = 0; i < n; i++) mono[i] += ch[i];
          }
          if (count > 1) {
            for (let i = 0; i < n; i++) mono[i] /= count;
          }
          const result = toWavBlob(mono, audioBuffer.sampleRate);
          result.name = file.name;
          try { ctx.close(); } catch (e) {}
          resolve(result);
        };
        const fail = function (err) {
          try { ctx.close(); } catch (e) {}
          const msg = (window.I18N && window.I18N.T)
            ? window.I18N.T('audioDecodeFail')
            : '这个音频格式读不出来，试试转成 wav 或 m4a';
          reject(err || new Error(msg));
        };
        try {
          const p = ctx.decodeAudioData(reader.result, done, fail);
          if (p && p.then) p.then(done, fail);
        } catch (e) {
          fail(e);
        }
      };
      reader.onerror = function () {
        reject(new Error((window.I18N && window.I18N.T)
          ? window.I18N.T('toastFileReadFail')
          : '文件读取失败'));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /* ================================================================== */
  return {
    TARGET_RATE: TARGET_RATE,
    supported: supported,
    Recorder: Recorder,
    resample: resample,
    encodeWAV: encodeWAV,
    toWavBlob: toWavBlob,
    trimLeadingSilence: trimLeadingSilence,
    decodeFile: decodeFile
  };
})();
