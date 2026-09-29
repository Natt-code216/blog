---
order: 5
title: Service Worker 与离线策略
est_read_minutes: 13
---

# Service Worker 与离线策略

Service Worker 是介于浏览器和服务器之间的一个"代理"——它可以拦截所有 fetch 请求，决定走网络、走缓存、还是混合策略。

它最常被讨论的应用是 PWA（渐进式 Web 应用），但即使你不打算把站点做成 PWA，Service Worker 仍能给性能带来巨大改进。本章讲它最实用的几种缓存策略，以及"离线优先"的落地路径。

## 几个生命周期事实

在写策略之前，先理解 Service Worker 的几个关键事实：

1. **它运行在独立线程**——不会阻塞主线程；
2. **它的生命周期与页面分离**——页面关掉后它可能仍在后台运行一段时间；
3. **它必须在 HTTPS 下运行**（localhost 例外）——浏览器对 SW 的能力极其谨慎；
4. **它有 install / activate / fetch 三个核心事件**——`install` 用来预缓存、`activate` 用来清理旧缓存、`fetch` 是拦截请求的钩子。

```js
// sw.js 的骨架
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('app-v1').then(cache => cache.addAll(['/', '/app.css', '/app.js']))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== 'app-v1').map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  // 这里写策略
});
```

## 四种核心策略

社区把 SW 缓存策略归纳为四种基本模式。它们各有适用场景。

### 1. Cache First（缓存优先）

**适合**：静态资源（CSS、JS、字体、图标）。

逻辑：先看缓存，命中就用；没命中才去网络。

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open('runtime').then(cache => cache.put(event.request, clone));
        return response;
      })
    )
  );
});
```

对带 hash 的静态资源，这种策略让重复访问几乎是 0 延迟。

### 2. Network First（网络优先）

**适合**：经常变化、对新鲜度敏感的内容（如新闻列表、订单列表）。

逻辑：先发网络请求；网络失败时才用缓存兜底。

```js
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open('runtime');
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}
```

这种策略给离线用户兜底，但在线时仍会等待网络。

### 3. Stale While Revalidate

**适合**：可以接受旧数据但希望尽快可见的内容（如用户头像、商品图）。

逻辑：立刻返回缓存（如果有），同时后台刷新缓存。

```js
async function staleWhileRevalidate(request) {
  const cache = await caches.open('runtime');
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  });
  return cached || fetchPromise;
}
```

这是性能与新鲜度的最佳平衡，常用于头像、图片这类不需要"立刻最新"的资源。

### 4. Cache Only / Network Only

**Cache Only**：永远用缓存，不发网络请求。适合预缓存的离线包资源。

**Network Only**：永远用网络，不查缓存。适合写操作（POST / PUT / DELETE）。

## 路由配置：哪种策略对应哪种资源

把上面四种策略组合起来，针对不同 URL pattern 配置：

```js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 静态资源（带 hash）：cache first
  if (url.pathname.match(/\.(js|css|woff2|svg)$/) && /\.[a-f0-9]{8}\./.test(url.pathname)) {
    return event.respondWith(cacheFirst(event.request));
  }

  // 图片：stale while revalidate
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|avif)$/)) {
    return event.respondWith(staleWhileRevalidate(event.request));
  }

  // API 写操作：network only
  if (url.pathname.startsWith('/api/') && event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }

  // API 读操作：network first
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(networkFirst(event.request));
  }

  // 入口 HTML：network first 配 offline fallback
  if (event.request.mode === 'navigate') {
    return event.respondWith(
      networkFirst(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});
```

这一段实现了一份完整、合理的策略路由。

## 离线 fallback 页面

如果用户在断网时打开了一个没缓存过的页面，SW 应该返回一个友好的离线提示，而不是浏览器默认的"无法连接"。

```js
// 在 install 阶段预缓存离线页
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('app-v1').then(cache => cache.add('/offline.html'))
  );
});

// fetch 失败时返回 offline.html
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});
```

`/offline.html` 应该是一个完全自包含的 HTML 页面（CSS / 字体内联），不依赖外部资源——否则离线时它也加载不出来。

## 版本管理与 skipWaiting

Service Worker 的版本切换是新手常踩坑的地方。

默认情况下：新版 SW 注册成功后，旧版仍在掌控所有打开的标签页。新版要等到**所有标签页关闭后**才接管。这意味着用户可能要在多个标签页都关掉、重开后才能拿到新版本。

如果你想立刻让新版接管，可以这样：

```js
self.addEventListener('install', (event) => {
  // ...
  self.skipWaiting(); // 安装完立刻进入 waiting → 立刻可激活
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(keys => Promise.all(
        keys.filter(k => !k.startsWith('app-v')).map(k => caches.delete(k))
      )),
      // 立刻接管所有 client
      self.clients.claim(),
    ])
  );
});
```

**警告**：`skipWaiting` + `clients.claim` 会让新版本立刻接管运行中的标签页。如果新版与旧版的 API 不兼容，运行中的页面可能会拿到不预期的响应。一般做法是同时配合页面端的"检测到新版 SW → 提示用户刷新"逻辑：

```js
// 页面端
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const newSW = reg.installing;
    newSW.addEventListener('statechange', () => {
      if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
        showRefreshToast(); // 提示用户刷新
      }
    });
  });
});
```

## 使用 Workbox 而非手写

上面所有逻辑，Google 的 Workbox 库都封装好了。生产项目建议直接用它：

```js
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';

registerRoute(
  ({ url }) => url.pathname.match(/\.(js|css|woff2)$/),
  new CacheFirst({ cacheName: 'static-v1' })
);

registerRoute(
  ({ url }) => url.pathname.match(/\.(png|jpg|webp)$/),
  new StaleWhileRevalidate({ cacheName: 'images-v1' })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api-v1', networkTimeoutSeconds: 3 })
);
```

Workbox 还提供了缓存过期、precache manifest、widely supported plugin 等机制。对中大型项目，自己手写 SW 几乎没有理由。

## 本章小结

Service Worker 把性能优化推到了"网络断开仍能工作"的极限。四种核心策略（cache first / network first / SWR / network only）组合在一起，能覆盖几乎所有资源类型。配合 Workbox，落地成本非常低。

至此本系列五章完结。从 Web Vitals 心智模型，到关键渲染路径，到字体图片优化，到缓存与协议升级，再到 Service Worker。这些工具组合在一起，能把一个"性能平平"的项目推到"在 4G 网络下也 LCP < 2.5s"的水平。

性能优化没有终点，但有方向。希望这五章给你一份能在每个具体项目里反复使用的检查清单。
