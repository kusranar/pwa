var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-bf1ef-default-rtdb.firebaseio.com/",
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(function () {
        webpush.setVapidDetails(
          // our business email
          "mailto:rk.jbs96@gmail.com",
          "BBkqXWQt8shQwiZqSqhmmeAvGFAeMGNBsraswOOkvL308sYNfe4Nj-IFWUXmD7ec-8djveS5ytJa8ePBqXmiWPw",
          "KWblpjM4SeMFK0N8ikE0uQMCIxRnOdAYl70BAex-joc"
        );
        // pass value as a string to once to basically identify or clarify that you want to get the value of that node.
        return admin.database().ref("subscriptions").once("value");
      })
      .then((subscriptions) => {
        subscriptions.forEach((sub) => {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };

          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New Post Added!",
                openUrl: "/help",
              })
            )
            .catch((err) => {
              console.log(err);
            });
        });
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch(function (err) {
        response.status(500).json({ error: err });
      });
  });
});
