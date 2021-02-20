importScripts("workbox-sw.prod.v2.1.3.js");
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

// workboxSW.router.registerRoute('https://www.something.com/:slug');
// and I want to cache all requests going to googleapis or gstatic in the URL
// because these two URLs are basically the ones I'm using here to load my fonts. The
// regular expression can look like this.
// I want to find googleapis or gstatic
// in the URL we're sending the request to and they should then end with .com.

const workboxSW = new self.WorkboxSW();

// https://developers.google.com/web/tools/workbox/guides/route-requests
workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  // staleWhileRevalidate will reach out to the cache to get that resource but also send a fetch request
  // and if that fetch request then returns, it will cache the updated resource.
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "google-fonts",
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  })
);

workboxSW.router.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "material-css",
  })
);

workboxSW.router.registerRoute(
  "https://pwagram-bf1ef-default-rtdb.firebaseio.com/posts.json",
  function (args) {
    return fetch(args.event.request).then(function (res) {
      var clonedRes = res.clone();
      clearAllData("posts")
        .then(function () {
          return clonedRes.json();
        })
        .then(function (data) {
          for (var key in data) {
            writeData("posts", data[key]);
          }
        });
      return res;
    });
  }
);

workboxSW.router.registerRoute(
  // routeData : one is the fetch event and the other would be URL, so routeData.url, this would hold
  function (routeData) {
    return routeData.event.request.headers.get("accept").includes("text/html");
  },
  function (args) {
    return caches.match(args.event.request).then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(args.event.request)
          .then(function (res) {
            // but we don't really have to manage that much cache versions here anymore,
            return caches.open("dynamic").then(function (cache) {
              cache.put(args.event.request.url, res.clone());
              return res;
            });
          })
          .catch(function (err) {
            return caches.match("/offline.html").then((res) => res);
          });
      }
    });
  }
);

workboxSW.precache([]);

self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing new Posts");
    event.waitUntil(
      readAllData("sync-posts").then(function (data) {
        for (var dt of data) {
          var postData = new FormData();
          postData.append("id", dt.id);
          postData.append("title", dt.title);
          postData.append("location", dt.location);
          postData.append("file", dt.picture, dt.id + ".png");
          postData.append("rawLocationLat", dt.rawLocation.lat);
          postData.append("rawLocationLng", dt.rawLocation.lng);
          fetch(
            "https://us-central1-pwagram-bf1ef.cloudfunctions.net/storePostData",
            {
              method: "POST",
              body: postData,
            }
          )
            .then(function (res) {
              console.log("Sent data", res);
              if (res.ok) {
                res.json().then(function (resData) {
                  deleteItemFromData("sync-posts", resData.id);
                });
              }
            })
            .catch(function (err) {
              console.log("Error while sending data", err);
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);
  if (action === "confirm") {
    console.log("confirm was chosen");
    notification.close();
  } else {
    event.waitUntil(
      clients.matchAll().then((clis) => {
        var client = clis.find((c) => c.visibilityState === "visible");
        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
      })
    );
    console.log(action);
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("notification was close", event);
});

self.addEventListener("push", function (event) {
  console.log("push notification received", event);

  var data = {
    title: "New!",
    content: "Something new happened!",
    openUrl: "/",
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
