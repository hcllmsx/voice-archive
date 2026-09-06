# 声音留档 · Voice Archive

帮普通人给重要的人（孩子、父母、祖辈、伴侣）录制语音素材，
导出成 [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) 训练包，实现"声音留档"。

**纯前端 PWA**：无框架、无构建工具、无 npm 依赖、无后端、无网络请求。
录音只存在你自己设备的浏览器里，随时可以删除。

> 项目的价值是"留住一个人真实的声音"，所以不引导录标准台词，
> 而是记录真实的说话状态——口头禅、笑声、口音、方言。

---

## 快速开始

麦克风 API 只在**安全上下文**下可用，必须通过 `localhost` 或 HTTPS 访问
（直接双击 `index.html` 无法录音）。

```bash
node tools/serve.js      # 本地开发服务器
# 打开 http://localhost:18181，建议 Chrome 或 Safari
```

手机访问需要 HTTPS：把整个目录丢到任意静态托管（GitHub Pages、EdgeOne Pages、
Vercel、Netlify）即可。微信内置浏览器不支持录音，会引导用系统浏览器打开。

## 开发工具

以下脚本零依赖，用系统自带的 Node 就能跑：

| 命令 | 作用 |
| --- | --- |
| `node tools/serve.js` | 本地静态服务器（仅开发用，端口可用 `PORT` 环境变量改） |
| `node tools/gen-icons.js` | 重新生成 `icons/*.png` 与 `favicon.ico`（改图标后运行） |
| `node tools/selftest.js` | 核心逻辑自测：ZIP 打包/解包、inflate、WAV 封装、内容完整性 |

## 使用流程

1. **新建项目**：填昵称、年龄段、主要语言。
   - 选「中文（其他方言）」会多一个选填框，写具体是哪种话（如四川话、闽南语）
   - 选「粤语」按独立代码 `yue` 处理，效果更好
   - 选「只是存档」则导出时不带任何训练相关内容
2. **录音**：按引导逐句录——必录清单（称呼、口头禅、笑声、数字日期、想说的话）
   加上按年龄段切换的引导问题，让对方自由回答。
3. **当场填文本**：录完自动播放，播完焦点自动落到输入框，当场听写最准。
4. **标记参考音频**（可选）：挑 3–10 秒说得最自然的几段设为参考。
5. **导出 ZIP**：选训练模式会附一份《接下来怎么做.html》，
   按提示在电脑上跑 GPT-SoVITS 即可，全程不用写代码。

选了方言时，录音页会提示"不用转成标准普通话"；方言名会写进项目文件一路跟随。

## 数据安全

所有音频只存在浏览器 IndexedDB 里，**不上传任何服务器**，无统计、无埋点。
iOS 的 ITP 规则可能清理未安装 PWA 的数据，所以**每录完几句就导出一份**最稳妥。

## 许可与作者

[GPL-3.0](LICENSE) · **火车啦啦**（hcllmsx）· [GitHub](https://github.com/hcllmsx) · [B 站](https://space.bilibili.com/255947051)

训练侧的 GPT-SoVITS 由 [RVC-Boss](https://github.com/RVC-Boss/GPT-SoVITS) 开源，
本项目只负责前面那一步：把声音好好地录下来。
