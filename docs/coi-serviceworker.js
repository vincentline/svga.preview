/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coi = {
  shouldRegister: () => true,
  shouldDeregister: () => false,
  coepCredentialless: () => true,
  coepDegrade: () => true,
  doReload: () => window.location.reload(),
  quiet: false,
  ...window.coi
};

if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('message', (ev) => {
    if (!ev.data) return;
    if (ev.data.type === 'deregister') {
      self.registration
        .unregister()
        .then(() => {
          return self.clients.matchAll();
        })
        .then(clients => {
          clients.forEach((client) => client.navigate(client.url));
        });
    }
  });

  const interceptCspHeader = (headers) => {
    const csp = headers.get('content-security-policy');
    if (!csp) return;

    const parsed = parseCsp(csp);
    const upgradeInsecureRequests = parsed['upgrade-insecure-requests'];
    if (upgradeInsecureRequests && upgradeInsecureRequests.length === 0) return;

    parsed['upgrade-insecure-requests'] = [];
    headers.set('content-security-policy', serializeCsp(parsed));
  };

  self.addEventListener('fetch', function (event) {
    const r = event.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') {
      return;
    }

    const headers = new Headers(r.headers);
    const newHeaders = new Headers();
    const corsStatus = coi.coepCredentialless() ? 'credentialless' : 'require-corp';

    headers.forEach((v, k) => {
      if (k === 'cross-origin-embedder-policy') {
        newHeaders.set(k, corsStatus);
      } else if (k === 'cross-origin-opener-policy') {
        newHeaders.set(k, 'same-origin');
      } else {
        newHeaders.set(k, v);
      }
    });

    if (!headers.has('cross-origin-embedder-policy')) {
      newHeaders.set('cross-origin-embedder-policy', corsStatus);
    }
    if (!headers.has('cross-origin-opener-policy')) {
      newHeaders.set('cross-origin-opener-policy', 'same-origin');
    }

    const req = new Request(r, { headers: newHeaders });
    event.respondWith(
      fetch(req)
        .then(response => {
          const newHeaders = new Headers(response.headers);
          newHeaders.set('cross-origin-embedder-policy', corsStatus);
          newHeaders.set('cross-origin-opener-policy', 'same-origin');

          if (r.mode === 'navigate') {
            interceptCspHeader(newHeaders);
          }

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        })
        .catch(e => {
          if (coi.coepDegrade() && !coi.coepCredentialless()) {
            return fetch(r).catch(e => new Response('', { status: 500 }));
          }
          return new Response('', { status: 500 });
        })
    );
  });

  const parseCsp = (csp) => {
    const result = {};
    const directives = csp.split(';');

    for (let directive of directives) {
      directive = directive.trim();
      const parts = directive.split(' ');
      const name = parts[0].toLowerCase();

      if (parts.length > 1) {
        result[name] = parts.slice(1);
      } else {
        result[name] = [];
      }
    }

    return result;
  };

  const serializeCsp = (parsed) => {
    return Object.entries(parsed)
      .map(([name, values]) => {
        if (values.length === 0) {
          return name;
        }
        return `${name} ${values.join(' ')}`;
      })
      .join('; ');
  };
} else {
  let coisrc = window.document.currentScript ? window.document.currentScript.src : 'coi-serviceworker.js';

  const reloadedBySelf = sessionStorage.getItem('coiReloadedBySelf');
  const redirected = reloadedBySelf && sessionStorage.getItem('coiRedirected');

  if (redirected) {
    sessionStorage.removeItem('coiRedirected');
    history.replaceState(null, '', sessionStorage.getItem('coiOriginalHref') || '');
    sessionStorage.removeItem('coiOriginalHref');
  }

  if (reloadedBySelf === 'coep' || reloadedBySelf === 'coop') {
    sessionStorage.removeItem('coiReloadedBySelf');
  }

  if (coi.shouldDeregister() && navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'deregister' });
  }

  const maybeRegister = () => {
    if (coi.shouldRegister() === false) return;

    if (!navigator.serviceWorker || !navigator.serviceWorker.register) {
      if (!coi.quiet) console.log('[COI] Service worker not supported');
      return;
    }

    const registration = navigator.serviceWorker.getRegistration();
    registration.then((reg) => {
      const hasSW = !!reg;
      const scopeMatch = reg && (reg.scope.endsWith('/coi-serviceworker.js') || reg.scope.endsWith('/coi-serviceworker.min.js'));

      if (scopeMatch) return;

      if (hasSW) {
        reg.unregister().then(() => {
          sessionStorage.setItem('coiReloadedBySelf', 'swoutdated');
          coi.doReload();
        });
        return;
      }

      navigator.serviceWorker.register(window.document.currentScript.src).then(
        (registration) => {
          if (!coi.quiet) console.log('[COI] Service worker registered', registration.scope);
          sessionStorage.setItem('coiReloadedBySelf', 'registered');
          coi.doReload();
        },
        (err) => {
          if (!coi.quiet) console.error('[COI] Service worker registration failed', err);
        }
      );
    }).catch(err => {
      if (!coi.quiet) console.error('[COI] Service worker detection failed', err);
    });
  };

  const onMessage = (event) => {
    if (!event.data) return;
    if (event.data.type === 'coi-redirect') {
      sessionStorage.setItem('coiRedirected', '1');
      sessionStorage.setItem('coiOriginalHref', location.href);
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    maybeRegister();
  } else {
    document.addEventListener('DOMContentLoaded', maybeRegister);
  }

  navigator.serviceWorker.addEventListener('message', onMessage);
}