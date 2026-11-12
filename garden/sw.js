// Vegful Garden moved to the main link. This worker removes itself and sends its open pages there.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.registration.unregister().then(() => self.clients.matchAll({ type: 'window' })).then(cs => Promise.all(cs.map(c => c.navigate(new URL('../', self.location).href).catch(() => {}))))));
