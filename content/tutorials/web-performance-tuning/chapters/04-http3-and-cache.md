---
order: 4
title: HTTP/3 与缓存
est_read_minutes: 13
---

# HTTP/3 与缓存

之前三章都在讨论"减少要发送的字节数"和"让字节更快到达浏览器"。这一章讨论另一个维度：**让字节根本不需要发送**——通过缓存；以及让发送的字节走更好的协议——HTTP/3。

## HTTP/1.1 → HTTP/2 → HTTP/3 的关键差异

简单回顾：

**HTTP/1.1**（1997）：每个请求一个 TCP 连接（理论上可保持，但实践中浏览器对单域名并发限制为 6）。多个资源要么排队，要么开多个连接。

**HTTP/2**（2015）：单一连接上**多路复用**，多个请求并行不互相阻塞。引入 header 压缩、server push（实验性，目前已基本废弃）。

**HTTP/3**（2022 RFC 9114）：基于 **QUIC** 协议（运行在 UDP 之上而非 TCP）。最大改进是消除了 TCP 层的**队头阻塞**——HTTP/2 虽然在应用层多路复用，但底层 TCP 仍是单字节流，任何一个包丢失就会卡住整个连接。

## HTTP/3 的真实收益

对网络不稳定的环境（移动网络、跨大洲连接），HTTP/3 的提升非常明显——尤其是丢包率高的场景下能比 HTTP/2 快 30%+。

但对网络优质的环境，HTTP/3 vs HTTP/2 的差距不大。所以**不要为了启用 HTTP/3 而做大改造**——它是锦上添花，不是雪中送炭。

实际做法：

- **如果你用 CDN**（Cloudflare、Fastly、CloudFront）：HTTP/3 通常是一个开关，启用即可。
- **如果你自己运行 nginx**：需要 nginx 1.25+ 和 OpenSSL 3.0+，配置 listen 443 quic + http2。

```nginx
server {
    listen 443 ssl;
    listen 443 quic reuseport;
    http2 on;
    http3 on;

    add_header Alt-Svc 'h3=":443"; ma=86400';
    # ...
}
```

`Alt-Svc` header 告诉浏览器"这个域名支持 HTTP/3，下次试试"——所以**第一次访问时浏览器仍走 HTTP/2**，后续访问才会切到 HTTP/3。

## 缓存：分两层思考

缓存策略可以分成两大层：

1. **强缓存（Cache-Control / Expires）**：浏览器直接使用本地副本，不发请求。
2. **协商缓存（ETag / Last-Modified）**：浏览器发请求询问"我的副本还有效吗"，服务器返回 304 或新内容。

90% 的项目缓存配置错误，几乎都集中在两个误区上。

## 误区一：把强缓存设太短

很多项目对静态资源设 `Cache-Control: max-age=3600`（1 小时）。理由是"防止用户拿到旧版本"。

但这个理由不成立——因为现代构建工具会给文件名加 hash（如 `app.7d3e2f.js`），文件内容变化时 hash 必变，URL 必变。所以缓存"过期"这件事在带 hash 的资源上**不存在**——它要么是同一个文件（永远可缓存），要么是新文件（新 URL，新缓存条目）。

正确做法：**带 hash 的静态资源用一年缓存 + immutable**：

```
Cache-Control: public, max-age=31536000, immutable
```

`immutable` 这个关键字告诉浏览器"这个资源不会变"，浏览器连"用户刷新页面"都不再去验证。

对**不带 hash** 的入口文件（如 index.html），用相反的策略：

```
Cache-Control: no-cache, must-revalidate
```

`no-cache` 不是"不缓存"，是"每次必须验证"。配合 ETag，新版本能立刻让用户拿到。

## 误区二：API 响应没有任何缓存策略

很多团队的 API 响应是 `Cache-Control: no-store`，意思是"完全不允许缓存"。

但实际上，绝大多数 GET API 都可以缓存——哪怕只是 60 秒。例如：

- 用户资料（5 分钟）；
- 商品列表（30 秒）；
- 国家 / 城市列表（24 小时）；
- 评论列表（30 秒）。

```
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

`stale-while-revalidate` 是一个非常实用的指令：

- max-age 内：直接用本地缓存；
- max-age 过期但 stale-while-revalidate 内：返回旧缓存 **同时**后台异步刷新；
- 都过期：正常重新请求。

这套策略对 API 性能的提升是数量级的。

## CDN 缓存

CDN 是另一层缓存。把"哪些 URL 在 CDN 边缘节点缓存多久"配置好，能让全球用户的延迟从 200ms 降到 20ms。

CDN 缓存的关键是**缓存键**。同一个 URL 在不同的 cookie / header 下可能返回不同内容，CDN 必须知道这些差异。

```
# Cloudflare / Fastly 配置
Vary: Accept-Encoding, Accept-Language
```

`Vary` 告诉 CDN "这两个 header 不同的请求要分别缓存"。如果忘了写，A 用户拿到中文版后，所有人都会从 CDN 拿到中文版——B 用户的英文请求也会被命中错误的缓存。

## 用 Service Worker 做最后一层缓存

下一章会详细讲 Service Worker。这里先抛一个引子：

Service Worker 可以拦截所有 fetch 请求，在浏览器本地实现一层"完全可编程"的缓存。它的关键优势是：

- 控制粒度最细——可以按 URL pattern 单独配置策略；
- 离线可用——网络中断时仍能返回缓存的内容；
- 跨页面共享——多个页签共用一份缓存。

下一章我们专门展开 Service Worker 的策略模式。

## 防御缓存的几条规则

最后给一份避免"踩缓存坑"的清单：

1. **不要给 HTML 入口加长缓存**——否则发版后用户永远拿不到新版本。
2. **不要在带 hash 的资源上设短缓存**——浪费 CDN 容量。
3. **API 默认加 60 秒 stale-while-revalidate**——除非真的是动态写操作。
4. **Vary 一定要写全**——`Accept-Encoding` 是最基础的，`Accept-Language` 按需。
5. **缓存配置改动要灰度发布**——错误的缓存配置可能让某些用户卡在旧版本里直到 max-age 过期。

## 本章小结

缓存的核心心智模型是分层：**浏览器强缓存 → 协商缓存 → CDN → 应用服务器**。每一层都能拦截一部分请求。配置得好，一个真实用户的页面访问里 60%+ 的请求可以从最近一层缓存返回，根本不到源站。

HTTP/3 是网络层的另一个机会，但只在不稳定网络下有显著优势。先把缓存做对，再讨论协议升级。

下一章是本系列的最后一章：**Service Worker 与离线策略**——把性能优化推到极致，让你的应用在断网时也能继续工作。
