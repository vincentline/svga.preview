/*! coi-serviceworker v0.2.0 - Simplified version */
/*! Enables SharedArrayBuffer for GitHub Pages */

if (typeof window === 'undefined') {
  // Service Worker 代码
  let isCrossOriginIsolated = false;

  self.addEventListener('install', (event) => {
    console.log('[COI SW] Installing new version...');
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    console.log('[COI SW] Activating new version...');
    event.waitUntil(
      self.clients.claim().then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            console.log('[COI SW] Reloading client:', client.url);
            client.navigate(client.url);
          });
        });
      })
    );
  });

  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_CROSS_ORIGIN_ISOLATED') {
      isCrossOriginIsolated = event.data.value;
      console.log('[COI SW] Cross origin isolated status:', isCrossOriginIsolated);
    }
  });

  self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 跳过非导航请求
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      return;
    }

    // 检查是否是 Worker 脚本请求
    const isWorkerScript = request.destination === 'worker' || url.pathname.includes('.worker.js');

    // 跳过第三方服务和CDN
    if (url.hostname === 'wind.hlgdata.com' ||
      url.hostname.includes('jsdelivr.net') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
      return;
    }

    // 只有以下情况才拦截：
    // 1. Worker 脚本请求（始终需要添加 CORP 头）
    // 2. 页面没有 COI 且是导航请求（需要添加 COOP/COEP 头）
    if (!isWorkerScript && isCrossOriginIsolated) {
      // 页面已经有 COI，且不是 Worker 脚本，直接返回原响应
      return;
    }

    event.respondWith(
      fetch(request)
        .then(response => {
          // 主文档（HTML页面）添加COOP/COEP头部
          if (request.mode === 'navigate' || request.destination === 'document') {
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
            newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders
            });
          }

          // Worker脚本需要添加CORP头
          if (isWorkerScript) {
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders
            });
          }

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

    // 检查浏览器支持
    if (!navigator.serviceWorker) {
      console.warn('[COI] Service Worker not supported');
      return;
    }

    // 即使已经跨域隔离，也需要注册 Service Worker
    // 原因：Worker 脚本需要 CORP 头才能在 COEP 环境下加载
    // 如果 SW 不注册，Worker 脚本会因为没有 CORP 头而被阻止
    if (window.crossOriginIsolated) {
      console.log('[COI] Already cross-origin isolated, but still registering SW for Worker support');
    }

    // 检查是否刚刚刷新过，防止无限循环
    const justReloaded = sessionStorage.getItem('coi_reloaded');
    if (justReloaded === 'yes') {
      sessionStorage.removeItem('coi_reloaded');
      console.log('[COI] Reloaded, Service Worker should be active now');
    }

    // 注册Service Worker
    const scriptUrl = document.currentScript ? document.currentScript.src : window.location.origin + '/coi-serviceworker.js';

    const registerSW = () => {
      navigator.serviceWorker.register(scriptUrl)
        .then(registration => {
          console.log('[COI] Service Worker registered:', registration.scope);

          // 向 Service Worker 发送 COI 状态
          if (window.crossOriginIsolated && registration.active) {
            registration.active.postMessage({
              type: 'SET_CROSS_ORIGIN_ISOLATED',
              value: true
            });
          }

          // 检查Service Worker状态
          const checkSWStatus = () => {
            // 如果已经被Service Worker控制，检查是否支持SharedArrayBuffer
            if (navigator.serviceWorker.controller) {
              // 检查SharedArrayBuffer是否可用
              if (typeof SharedArrayBuffer !== 'undefined') {
                console.log('[COI] Service Worker active and SharedArrayBuffer available');
                return;
              }
              // 虽然被控制，但SharedArrayBuffer不可用，需要刷新
              console.log('[COI] Service Worker active but SharedArrayBuffer not available, reloading...');
              sessionStorage.setItem('coi_reloaded', 'yes');
              window.location.reload();
              return;
            }

            // 如果还没有被控制，检查Service Worker是否激活
            if (registration.active) {
              console.log('[COI] Service Worker activated, reloading to take control...');
              sessionStorage.setItem('coi_reloaded', 'yes');
              window.location.reload();
              return;
            }
          
            // 继续检查，直到 Service Worker 激活或超时
            // 使用定时器服务进行轮询检测
            if (window.MeeWoo && window.MeeWoo.Service && window.MeeWoo.Service.TimerService) {
              window.MeeWoo.Service.TimerService.createPoll(
                function () { return registration.active !== null; },  // 条件：Service Worker 已激活
                function () { /* 轮询中 */ },                           // 每次轮询的回调（空）
                500,                                                    // 间隔 500ms
                10000,                                                  // 超时 10 秒
                'service-worker'                                        // 分组
              );
            } else {
              // 降级方案：使用原生 setTimeout
              setTimeout(checkSWStatus, 500);
            }
          };

          // 立即检查状态
          checkSWStatus();

          // 监听Service Worker状态变化
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[COI] New Service Worker activated, reloading...');
                  sessionStorage.setItem('coi_reloaded', 'yes');
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch(err => {
          console.error('[COI] Service Worker registration failed:', err);
        });
    };

    // 确保在文档完全加载后再注册Service Worker
    // 避免文档状态不正确导致的注册失败
    if (document.readyState === 'loading' || document.readyState === 'interactive') {
      window.addEventListener('load', registerSW);
    } else {
      // 文档已经完全加载，直接注册
      registerSW();
    }
  })();
}