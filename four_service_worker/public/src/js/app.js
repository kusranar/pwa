var deferredPrompt;

if ("serviceWorker" in navigator) {
  // check if service worker feature is available at the browser
  navigator.serviceWorker
    .register("/sw.js") // it can take 1 params, its object and the property can use is {scope: '/help/} and service worker will work at the page
    .then(function () {
      console.log("service worker registered");
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  console.log("beforeInstallPrompt Fired!");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});
