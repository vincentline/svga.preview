/*! coi-serviceworker v0.2.0 - Simplified version */
/*! Enables SharedArrayBuffer for GitHub Pages */

if (typeof window === 'undefined') {
  // Service Worker 代码
  self.addEventListener('install', (event) => {
    console.log('[COI SW] Installing new version...');
    // 强制跳过等待，立即激活新版本
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    console.log('[COI SW] Activating new version...');
    event.waitUntil(
      self.clients.claim().then(() => {
        // 强制刷新所有已打开的页面，使其使用新的 Service Worker
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            console.log('[COI SW] Reloading client:', client.url);
            client.navigate(client.url);
          });
        });
      })
    );
  });

  self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 跳过非导航请求
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      return;
    }

    /**
     * 跳过第三方服务和CDN（避免 CORS 错误）
     * 
     * 重要：即使使用 credentialless 模式，某些CDN还是会被 Service Worker 拦截导致 CORS 错误
     * 
     * 必须跳过的域名：
     * 1. wind.hlgdata.com - 第三方统计服务
     * 2. jsdelivr.net - 主 CDN（Vue、protobuf等核心库）
     * 3. unpkg.com - 备用 CDN（pngquant 等）
     * 4. cdnjs.cloudflare.com - 备用 CDN
     * 
     * 注意：修改此处时，请确保：
     * - 所有项目依赖的 CDN 都在白名单中
     * - 更新后升级 index.html 中的 Service Worker 版本号
     * - 本地测试确认核心库能加载（Vue、SVGA、protobuf、pako）
     */
    if (url.hostname === 'wind.hlgdata.com' ||
      url.hostname.includes('jsdelivr.net') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then(response => {
          // 只为主文档（HTML页面）添加COOP/COEP头部，其他资源不处理
          if (request.mode === 'navigate' || request.destination === 'document') {
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
            // 使用credentialless模式，允许跨域资源加载
            newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders
            });
          }

          // 其他资源直接返回，不修改头部
          return response;
        })
        .catch(err => {
          console.error('[COI SW] Fetch failed:', err);
          return new Response('Network error', { status: 500 });
        })
    );
  });
} else {
  // 客户端注册代码
  (function () {
    'use strict';

    // 检查是否已经跨域隔离
    if (typeof window !== 'undefined' && window.crossOriginIsolated) {
      console.log('[COI] Already cross-origin isolated');
      return;
    }

    // 检查浏览器支持
    if (!navigator.serviceWorker) {
      console.warn('[COI] Service Worker not supported');
      return;
    }

    // 检查是否刚刚刷新过
    const justReloaded = sessionStorage.getItem('coi_reloaded');
    if (justReloaded === 'yes') {
      sessionStorage.removeItem('coi_reloaded');
      console.log('[COI] Reloaded, Service Worker should be active now');
      return;
    }

    // 注册Service Worker
    const scriptUrl = document.currentScript ? document.currentScript.src : window.location.origin + '/coi-serviceworker.js';

    const registerSW = () => {
      navigator.serviceWorker.register(scriptUrl)
        .then(registration => {
          console.log('[COI] Service Worker registered:', registration.scope);

          // 检查Service Worker状态
          if (registration.active && navigator.serviceWorker.controller) {
            console.log('[COI] Service Worker already controlling page');
            return;
          }

          // 首次注册，需要刷新一次来激活Service Worker
          if (!navigator.serviceWorker.controller) {
            console.log('[COI] First registration, reloading to activate...');
            sessionStorage.setItem('coi_reloaded', 'yes');
            window.location.reload();
          }
        })
        .catch(err => {
          console.error('[COI] Service Worker registration failed:', err);
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  })();
}