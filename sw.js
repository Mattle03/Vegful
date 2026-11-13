// Bump VERSION after every change so phones pick up the new files.
const VERSION = 'vgarden-v23';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/badge-96.png', 'vendor/zxing.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
// Only garden caches are ours to clean; the classic app keeps its own vegful- caches.
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('vgarden-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first for the page (fresh when online), cache first for everything else.
// The classic app lives under /classic/ with its own worker: leave its requests alone.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).pathname.includes('/classic/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (req.url.startsWith(self.location.origin) || req.url.includes('fonts.g') || req.url.includes('unpkg.com'))) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  }).catch(() => hit)));
});

// Push reminders. The server sends an empty push at the chosen times; the phone picks the words.
// The page keeps a small mirror in IndexedDB (voice, today's open meals, ripe plants, the line pools): no food data.
const idb = (mode, fn) => new Promise((res, rej) => {
  const r = indexedDB.open('vgarden', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onerror = () => rej(r.error);
  r.onsuccess = () => { const db = r.result, t = db.transaction('kv', mode), q = fn(t.objectStore('kv')); t.oncomplete = () => { db.close(); res(q && q.result); }; t.onerror = () => { db.close(); rej(t.error); }; };
});
const p2 = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
const dayDiff = (a, b) => Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / 864e5);
function fill(t, c) {
  const m = c.meal || 'lunch';
  return t.replace(/\{Meal\}/g, m.charAt(0).toUpperCase() + m.slice(1)).replace(/\{meal\}/g, m).replace(/\{days\}/g, c.days || 3)
    .replace(/\{kinds\}/g, c.kinds || 0).replace(/\{time\}/g, c.time || '21:00').replace(/\{group\}/g, c.group || 'Your beds');
}
async function ring() {
  let m = null, rec = {};
  try { m = await idb('readonly', s => s.get('m')); rec = (await idb('readonly', s => s.get('r'))) || {}; } catch (_) {}
  const now = new Date(), h = now.getHours(), slot = h < 11 ? 'b' : h < 16 ? 'l' : h < 20 ? 'd' : 'e', today = ymd(now);
  const c = { meal: { b: 'breakfast', l: 'lunch', d: 'dinner', e: 'dinner' }[slot], slot, time: p2(h) + ':' + p2(now.getMinutes()), low: [], days: 0, kinds: 0 };
  let body = 'Your garden is waiting.';
  if (m && m.pools) {
    c.low = m.low || []; c.kinds = m.kinds || 0;
    const away = m.lastOpen ? dayDiff(m.lastOpen, today) : 0, fresh = m.today === today, open = fresh ? (m.open || []) : ['b', 'l', 'd'];
    c.days = away;
    let cat;
    if (away >= 2) cat = 'away';
    else if (slot === 'e' && now.getDay() === 0 && m.recap) cat = 'recap';
    else if (m.ripe && Math.random() < 0.25) cat = 'ripe';
    else if (slot === 'e') cat = fresh && (m.closed || !open.length) ? 'done' : 'nagE';
    else cat = open.includes(slot) ? 'nag' : 'done';
    let P = (m.pools[cat] || []);
    if (!P.length && cat === 'nagE') P = m.pools.nag || [];
    P = P.filter(x => (!x.g || c.low.includes(x.g)) && (!x.s || x.s === slot || (x.s === 'd' && slot === 'e')));
    if (P.length) {
      const last = rec[cat] || [], keep = Math.min(4, P.length - 1), C = P.filter(x => !last.slice(-keep).includes(x.id)), pool = C.length ? C : P;
      const x = pool[Math.floor(Math.random() * pool.length)];
      rec[cat] = last.concat(x.id).slice(-6);
      body = fill(x.t, c);
      try { await idb('readwrite', s => s.put(rec, 'r')); } catch (_) {}
    }
  }
  // The title stays plain so a lock screen never shows more than the app name.
  return self.registration.showNotification('Vegful Garden', { body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'vgarden', data: { url: self.registration.scope } });
}
self.addEventListener('push', e => e.waitUntil(ring()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => {
    const w = L.find(c => c.url.startsWith(self.registration.scope));
    return w ? w.focus() : clients.openWindow(self.registration.scope);
  }));
});
