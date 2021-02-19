var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function () {
      console.log("Service worker registered!");
    })
    .catch(function (err) {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    var options = {
      body: "You successfully subscribed to our Notification service!",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      // dir: 'ltr',
      lang: "en-US", // BCP 47
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-96x96.png",
      // Now the cool thing about the tag is it acts like an ID for that notification
      // and if you send more or display more notifications with the same tag, they will actually not be displayed
      // beneath each other but they will stack onto each other,
      // so basically, the latest notification with the same tag will replace the previous one with the same tag.
      // So if you have two notifications using confirmed notification, only one will be displayed on your mobile
      // device or on your device in general,
      // if you don't set the tag option, they will actually display beneath each other which sometimes is the
      // behavior you want,
      // think about news websites who
      // want to push new headlines,
      // definitely don't want to overwrite new headlines other ones because they might not be related but
      // on other applications, you might simply want to show one notification at a time to not spam the user.
      // So by setting tag here, you ensure that the notifications actually stack.
      tag: "confirm-notification",
      // Connected to tag is re-notify. Re-notify if set to true allows you or makes sure that even if you use
      // the same tag, a new notification will still vibrate and alert the user. If it's set to false and you
      // use the same tag on notifications, new notifications of the same tag actually won't vibrate the phone
      // again and won't notify the user again.
      // So if you set this to false and use tags, you have very passive notifications only sitting in the top
      // bar and vibrating on the very first notification.
      // If you set it to true, you still don't spam the user but you have a vibration on each new notification
      // and if you disable both, you send a notification every time and they will sit beneath each other and
      // maybe spam the user,
      renotify: true,
      // keep that in mind is a system feature,
      // it's not displayed in our web application, it's not HTML or something like that, it's displayed by the
      // operating system.
      // Hence the user may interact with it when our page isn't even opened,
      // infact this is something
      // service workers are about, they run in the background
      // and for example when using Chrome on Android, you will get notifications even if your application is
      // closed, even if the browser is closed.
      actions: [
        {
          action: "confirm",
          title: "Okay",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
    };
    navigator.serviceWorker.ready.then((swr) => {
      swr.showNotification("Successfully subscribed!", options);
    });
  }
}

function configurePushSub() {
  if ("serviceWorker" in navigator) {
    var reg;
    navigator.serviceWorker.ready
      .then((swreg) => {
        reg = swreg;
        // Get subscription is a method which will return any existing subscriptions
        return swreg.pushManager.getSubscription();
      })
      // If we open a wrap in a second browser on the same device, we will also get a new service worker, a whole
      // new scope, a whole new app in the end
      // and therefore each browser device combination yields one subscription and this is exactly what we check
      // here.
      .then((sub) => {
        if (sub === null) {
          var vapidPublicKey =
            "BBkqXWQt8shQwiZqSqhmmeAvGFAeMGNBsraswOOkvL308sYNfe4Nj-IFWUXmD7ec-8djveS5ytJa8ePBqXmiWPw";
          var validPrivateKey = "KWblpjM4SeMFK0N8ikE0uQMCIxRnOdAYl70BAex-joc";
          var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
          console.log('convertedVapidPublicKey', convertedVapidPublicKey);
          // create a new subscription
          return reg.pushManager.subscribe({
            // this basically says that push notifications sent through our service are only visible to this user.
            userVisibleOnly: true,
            applicationServerKey: convertedVapidPublicKey,
          });
        } else {
          // we have a subscription
          // so we have a subscription and this might be where you maybe want to send it to your back-end server again
          // to update it there
          // or just ignore it because you rely on already having it stored on your back-end server, whatever you
          // want.
        }
      })
      .then(function (newSub) {
        console.log('newSub', newSub);
        return fetch(
          "https://pwagram-bf1ef-default-rtdb.firebaseio.com/subscriptions.json",
          {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(newSub),
          }
        );
      })
      .then((res) => {
        if (res.ok) {
          displayConfirmNotification();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

function askForNotificationPermission() {
  Notification.requestPermission(function (result) {
    console.log("User Choice", result);
    if (result !== "granted") {
      console.log("No notification permission granted!");
    } else {
      configurePushSub();
    }
  });
}

if ("Notification" in window && "serviceWorker" in navigator) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermission
    );
  }
}
