self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Server Worker ... ", event);
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating Server Worker ... ", event);
  return self.clients.claim();
  // to make sure that it works without any issues, we return something
  // means the service workers are loaded are activated correctly.
  // it should work without that line but it can fail from time to time or behave strangely
  // adding this line simply make it more robust, might not be needed in the future but it is needed right now
});

self.addEventListener("fetch", function (event) {
  console.log("[Service Worker] Fetching Something ... ", event);
  // event.respondWith(null) // this site cant be reached window here for a brief second before it recovers simply because we return null initialy here
  event.respondWith(fetch(event.request)); // // means return the fetch request and this is the promise, so this will automatically be parsed thereafter and this will also then use the response of this promise automatically. follback to some browser mechanism

  // this allow us to override the data which gets sent back
  // you can think of the service worker as a network proxy at least if we use the fetch event here
});
// fetch event will trigger when the app fetch something
// for example load assets like script at HTML file, css code, image tag
// it also trigger if we manually send a fetch request in the app.js