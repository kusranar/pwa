var CACHE_STATIC_NAME = "static-v2";
var CACHE_DYNAMIC_NAME = "dynamic-v1";
var STATIC_FILES = [
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

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function (cache) {
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

//
self.addEventListener("fetch", function (event) {
  var endpoint = "https://httpbin.org/ip";
  if (event.request.url.indexOf(endpoint) > -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
        return fetch(event.request).then((res) => {
          cache.add(event.request.url, res.clone());
          return res;
        });
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((res) => {
        if (res) {
          return res;
        } else {
          return fetch(event.request).then((res) => {
            return caches
              .open(DYNAMIC_NAME_CACHE)
              .then((cache) => {
                cache.add(event.request.url, res.clone);
                return cache;
              })
              .catch((err) => {
                return caches.open(STATIC_FILES).then((cache) => {
                  if(event.request.headers.get('accept').includes('/text/html')){
                    return cache.match("/offline.html");
                  }
                });
              });
          });
        }
      })
    );
  }
});

// dynamic caching for cache, fallback network
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//       return fetch(event.request).then((res) => {
//         cache.add(event.request.url, res.clone);
//         return res;
//       });
//     })
//   );
// });

// network, cache fallback
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     fetch(event.request).catch((err) => {
//       return caches.match(event.request);
//     })
//   );
// });

// cache only
// self.addEventListener("fetch", function (event) {
//   event.respondWith(caches.match(event.request));
// });

// network only
// self.addEventListener("fetch", function (event) {
//   event.respondWith(fetch(event.request));
// });

// cache fallback network
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     caches.match(event.request).then(function (response) {
//       if (response) {
//         return response;
//       } else {
//         return fetch(event.request)
//           .then(function (res) {
//             return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
//               cache.put(event.request.url, res.clone());
//               return res;
//             });
//           })
//           .catch(function (err) {});
//       }
//     })
//   );
// });
