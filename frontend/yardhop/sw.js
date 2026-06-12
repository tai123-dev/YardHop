// sw.js — This file makes the app work even without an internet connection.
// Every time you load a page or image, it quietly saves a copy in the background.
// If you later open the app with no signal, it serves those saved copies instead
// so the app still loads and feels fast.
const CACHE='yardhop-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.open(CACHE).then(cache=>
      fetch(e.request).then(res=>{cache.put(e.request,res.clone());return res;})
      .catch(()=>caches.match(e.request))
    )
  );
});
