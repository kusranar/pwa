var CACHE_FILE = [
  "/",
  "/index.html",
  "/src/css/app.css",
  "/src/css/main.css",
  "/src/js/main.js",
  "/src/js/material.min.js",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

var STATIC_CACHE_NAME = "static-v1";
var DYNAMIC_CACHE_NAME = "dynamic-v1";

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(function (cache) {
      return cache.addAll(CACHE_FILE);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== STATIC_CACHE_NAME) {
            caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(function (res) {
            return caches.open(DYNAMIC_CACHE_NAME).then(function (cache) {
              cache.put(event.request, res.clone());
              return res;
            });
          })
          .catch(function (err) {});
      }
    })
  );
});
