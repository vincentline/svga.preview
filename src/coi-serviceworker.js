/*! coi-serviceworker v0.3.0 - Based on gzuidhof/coi-serviceworker */
/*! Enables SharedArrayBuffer for GitHub Pages */

/**
 * 使用 credentialless 模式：
 * - 对文档设置 Cross-Origin-Embedder-Policy: credentialless
 * - 该模式不需要为资源设置 CORP 头（与 require-corp 不同）
 * - 对 no-cors 请求省略凭据
 */
if (typeof window === 'undefined') {
  // Service Worker 代码
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('fetch', (event) => {
    const r = event.request;
    
    // 跳过特殊缓存请求
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') {
      return;
    }

    // credentialless 模式：对 no-cors 请求省略凭据
    const request = (r.mode === 'no-cors')
      ? new Request(r, { credentials: 'omit' })
      : r;

    event.respondWith(
      fetch(request)
        .then((response) => {
          // 响应状态码为 0 表示 opaque 响应（跨域 no-cors），直接返回
          if (response.status === 0) {
            return response;
          }

          const newHeaders = new Headers(response.headers);
          
          // 为所有响应设置 COOP
          newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
          
          // 为文档设置 COEP: credentialless
          // credentialless 模式不需要为资源设置 CORP 头
          newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
        .catch((e) => {
          console.error('[COI SW] Fetch error:', e);
          // 返回网络错误而不是抛异常，避免页面崩溃
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

    // 检查是否刚刚刷新过，防止无限循环
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