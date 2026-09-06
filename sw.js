/*
 * sw.js
 * 声音留档 voice-archive · 作者：火车啦啦 (hcllmsx)
 *
 * Service Worker：只做离线缓存，策略保持简单。
 * 预缓存应用外壳，之后同源 GET 走「缓存优先 + 后台更新」。
 *
 * 缓存桶名直接使用应用版本号（与 content.js 的 version 保持一致）。
 * 发版时无需手改：编辑根目录 VERSION 后运行 sync-version.bat，
 * 会自动更新此处桶名；新桶生效后旧桶由 activate 自动清理。
 */

// 缓存桶 = voice-archive-<版本号>：由 sync-version.bat 维护，一般不要手改
var CACHE = 'voice-archive-26.9.6.23';

var SHELL = [
  './',
  './index.html',
  './styles.css',
  './i18n/zh.js',
  './i18n/en.js',
  './i18n/core.js',
  './content.js',
  './db.js',
  './zip.js',
  './recorder.js',
  './app.js',
  './nextsteps/next-steps.zh.html',
  './nextsteps/next-steps.en.html',
  './manifest.webmanifest',
  './icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // 单个资源失败不影响整体安装
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () {});
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 网络优先，失败再退回缓存。
  // 本项目没有构建步骤、文件名也不带 hash，如果走「缓存优先」，
  // 更新后会拿到新旧混杂的一组文件；网络优先不会有这个问题，
  // 离线时依然能靠缓存打开。
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        // 离线时导航请求退回首页，保证还能打开
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : hit);
      });
    })
  );
});
