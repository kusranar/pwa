var STATIC_NAME_CACHE = "static-v2";
var DYNAMIC_NAME_CACHE = "dynamic-v1";
var STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
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
];

function trimCache(cacheName, maxItem) {
  caches.open(cacheName).then((cache) => {
    return cache.keys().then((keys) => {
      if (keys.length > maxItem) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItem));
      }
    });
  });
}

self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches.open(STATIC_NAME_CACHE).then(function (cache) {
      console.log("[Service Worker] Precaching App Shell");
      return cache.addAll(STATIC_ASSETS);
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

// cache then network & dynamic cache and offline support
self.addEventListener("fetch", function (event) {
  var url = "https://httpbin.org/get";

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(DYNAMIC_NAME_CACHE).then((cache) => {
        return fetch(event.request).then((res) => {
          cache.put(event.request, res.clone());
          trimCache(DYNAMIC_NAME_CACHE, 3);
          return res;
        });
      })
    );
    // join file with word boundary operators
    // so basically its mean we have  separate words and i check if this regular expression of separate words,
    // if the URL matches thiss

    // we store in our
    // app shell, it does make sense in my opinion because whenever we update one of these files, we push a new
    // service worker to the front-end anyways, so we always have the latest version of these files in the cache.
    // Hence it makes sense to load all these files directly from the cache instead of trying to get them from
    // the network
    // if the cache fails. Now you could argue if the cache fails for some other reason, then these files not
    // being present,
    // we kind of break our app unnecessarily, though that shouldn't really happen.
  } else if (isInArray(event.request.url, STATIC_ASSETS)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((res) => {
        if (res) {
          return res;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(DYNAMIC_NAME_CACHE).then(function (cache) {
                cache.put(event.request.url, res.clone());
                trimCache(DYNAMIC_NAME_CACHE, 3);
                return res;
              });
            })
            .catch(function (err) {
              return caches.open(STATIC_NAME_CACHE).then(function (cache) {
                if (
                  event.request.headers.get("accept").includes("/text/html")
                ) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
});

// cache first then network with dynamic cache and if failed then offline page
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     caches.match(event.request).then((res) => {
//       if (res) {
//         return res;
//       } else {
//         return fetch(event.request)
//         .then(function (res) {
//           return caches.open(DYNAMIC_NAME_CACHE).then(function (cache) {
//             cache.put(event.request.url, res.clone());
//             return res;
//           })
//         }).catch(function(err){
//           return caches.open(STATIC_NAME_CACHE)
//             .then(function(cache){
//               return cache.match('/offline.html');
//             });
//         });
//       }
//     })
//   );
// });

// network first with dynamic cache if failed then cache
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function (res) {
//         return caches.open(DYNAMIC_NAME_CACHE).then(function (cache) {
//           cache.put(event.request.url, res.clone());
//           return res;
//         });
//       })
//       .catch(function (err) {
//         return caches.match(event.request);
//       })
//   );
// });

// network first then cache
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     fetch(event.request)
//       .catch(function (err) {
//         return caches.match(event.request);
//       })
//   );
// });

// cache only
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// network only
// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });
