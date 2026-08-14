/* flâneur map 漫游地图 — Service Worker
   离线可用 + 秒开。改动资源后把 CACHE 版本号 +1 即可强制刷新缓存。 */
const CACHE = 'flaneur-map-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './fonts/serifsc.woff2',
  './fonts/sanssc.woff2',
  './fonts/cormorant.woff2',
  './fonts/cormorant-italic.woff2'
];

// 安装:预缓存核心资源(图片按需缓存，避免首装等待 21 张图)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 激活:清掉旧版本缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 取用:cache-first，未命中则网络请求并写入缓存(含景点图片按需缓存)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        // 只缓存同源成功响应
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit); // 离线且未缓存时优雅失败
    })
  );
});
