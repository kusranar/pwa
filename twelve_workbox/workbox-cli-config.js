module.exports = {
  "globDirectory": "public/",
  // this pattern here simply says in any folder, any file name with any of these extensions should be cached,
  "globPatterns": [
    "**/*.{html,ico,json,css}",
    "src/images/*.{jpg,png}",
    "src/js/*.min.js"
  ],
  // workbox will automatically have a look at the configuration and see that we want to build up on an existing file
  "swSrc": "public/sw-base.js",
  // so which service worker should be generated
  "swDest": "public/service-worker.js",
  // don't cache files with this name for example,
  "globIgnores": [
    "../workbox-cli-config.js",
    "help/**",
    "404.html"
  ]
};