var STATIC_NAME_CACHE = "static-v1";
var DYNAMIC_NAME_CACHE = "dynamic-v1";

self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches.open(STATIC_NAME_CACHE).then(function (cache) {
      console.log("[Service Worker] Precaching App Shell");
      return cache.addAll([
        "/",
        "/index.html",
        "/src/js/app.js",
        "/src/js/feed.js",
        "/src/js/fetch.js",
        "/src/js/promise.js",
        "/src/js/material.min.js",
        "/src/css/app.css",
        "/src/css/feed.css",
        "/src/images/main-image.jpg",
        "https://fonts.googleapis.com/css?family=Roboto:400,700",
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
      ]);
      // cache.add("/");
      // cache.add("/index.html");
      // cache.add("/src/js/app.js");
    })
  );
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating Service Worker ....", event);
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map((key) => {
          console.log(key);
          if (key !== STATIC_NAME_CACHE && key !== DYNAMIC_NAME_CACHE) {
            console.log("[Service Service] Removing old cache.", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  return self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then((res) => {
      if (res) {
        return res;
      } else {
        return fetch(event.request).then(function (res) {
          return caches.open(DYNAMIC_NAME_CACHE).then(function (cache) {
            cache.put(event.request.url, res.clone());
            return res;
          });
        }).catch(function(err){
          
        });
      }
    })
  );
});
