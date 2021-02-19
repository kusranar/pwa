var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");
var fs = require("fs");
var UUID = require("uuid-v4");
var os = require('os');
var Busboy = require("busboy");
var path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pwagram-fb-key.json");

var gcConfig = {
  projectId: "pwagram-bf1ef",
  // automatically search file
  keyFileName: "pwagram-fb-key.json",
};

const { Storage } = require("@google-cloud/storage");

const gcs = new Storage(gcConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-bf1ef-default-rtdb.firebaseio.com/",
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    var uuid = UUID();
    var busboy = new Busboy({ headers: request.headers });

    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      fields[fieldname] = val;
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", () => {
      var bucket = gcs.bucket("pwagram-bf1ef.appspot.com");
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        function(err, uploadedFile) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(uploadedFile.name) +
                  "?alt=media&token=" +
                  uuid
              })
              .then(function() {
                webpush.setVapidDetails(
                  "mailto:rk.jbs96@gmail.com",
                  "BBkqXWQt8shQwiZqSqhmmeAvGFAeMGNBsraswOOkvL308sYNfe4Nj-IFWUXmD7ec-8djveS5ytJa8ePBqXmiWPw",
                  "KWblpjM4SeMFK0N8ikE0uQMCIxRnOdAYl70BAex-joc"
                );
                return admin
                  .database()
                  .ref("subscriptions")
                  .once("value");
              })
              .then(function(subscriptions) {
                subscriptions.forEach(function(sub) {
                  var pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh
                    }
                  };

                  webpush
                    .sendNotification(
                      pushConfig,
                      JSON.stringify({
                        title: "New Post",
                        content: "New Post added!",
                        openUrl: "/help"
                      })
                    )
                    .catch(function(err) {
                      console.log(err);
                    });
                });
                response
                  .status(201)
                  .json({ message: "Data stored", id: fields.id });
              })
              .catch(function(err) {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(err);
          }
        }
      );
    });

    // // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // // a callback when it's finished.
    // busboy.end(request.rawBody);
    // // formData.parse(request, function(err, fields, files) {
    // //   fs.rename(files.file.path, "/tmp/" + files.file.name);
    // //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
    // // });

    // var formData = new formidable.IncomingForm();
    // formData.parse(request, function (err, fields, files) {
    //   // First of all, I want to move that incoming file from the temporary storage to another temporary storage,

    //   // so tmp plus files, file name and yes you could of course used that default path,
    //   // this was just the security mechanism to make sure it doesn't clean it up in-between or something like
    //   // that.

    //   // so tmp, that's a path available on Google cloud functions or Firebase cloud functions
    //   // and then we can access fs rename and pass the old path which we can get from the files we got. There
    //   // the file is the only file we get, file here by the way refers to the name we set up on the front-end
    //   // here,
    //   // so if you have file here as a name for the file you attached to the post data, you need to use file here
    //   // too
    //   // and then the path. That's the path where it is stored automatically once it's uploaded and I'll use it
    //   // to /tmp,
    //   fs.rename(files.file.path, "/tmp/" + files.file.name);
    //   var bucket = gcs.bucket("pwagram-bf1ef.appspot.com");
    //   // So that just moves it temporarily, we'll permanently move it into a bucket, into a bucket of that cloud storage.
    //   bucket.upload(
    //     "/tmp/" + files.file.name,
    //     {
    //       uploadType: "media",
    //       metadata: {
    //         metadata: {
    //           contentType: files.file.type,
    //           // I want to make sure that I get a download URL by which I can easily access
    //           // this even if I'm not a Google Cloud user which of course probably none of our users are going to be
    //           // or very little.
    //           firebaseStorageDownloadTokens: uuid,
    //         },
    //       },
    //     },
    //     function (err, file) {
    //       if (!err) {
    //         admin
    //           .database()
    //           .ref("posts")
    //           .push({
    //             id: fields.id,
    //             title: fields.title,
    //             location: fields.location,
    //             image:
    //               "https://firebasestorage.googleapis.com/v0/b/" +
    //               bucket.name +
    //               "/o/" +
    //               encodeURIComponent(file.name) +
    //               "?alt=media&token=" +
    //               uuid,
    //           })
    //           .then(function () {
    //             webpush.setVapidDetails(
    //               // our business email
    //               "mailto:rk.jbs96@gmail.com",
    //               "BBkqXWQt8shQwiZqSqhmmeAvGFAeMGNBsraswOOkvL308sYNfe4Nj-IFWUXmD7ec-8djveS5ytJa8ePBqXmiWPw",
    //               "KWblpjM4SeMFK0N8ikE0uQMCIxRnOdAYl70BAex-joc"
    //             );
    //             // pass value as a string to once to basically identify or clarify that you want to get the value of that node.
    //             return admin.database().ref("subscriptions").once("value");
    //           })
    //           .then((subscriptions) => {
    //             subscriptions.forEach((sub) => {
    //               var pushConfig = {
    //                 endpoint: sub.val().endpoint,
    //                 keys: {
    //                   auth: sub.val().keys.auth,
    //                   p256dh: sub.val().keys.p256dh,
    //                 },
    //               };

    //               webpush
    //                 .sendNotification(
    //                   pushConfig,
    //                   JSON.stringify({
    //                     title: "New Post",
    //                     content: "New Post Added!",
    //                     openUrl: "/help",
    //                   })
    //                 )
    //                 .catch((err) => {
    //                   console.log(err);
    //                 });
    //             });
    //             response
    //               .status(201)
    //               .json({ message: "Data stored", id: fields.id });
    //           })
    //           .catch(function (err) {
    //             response.status(500).json({ error: err });
    //           });
    //       } else {
    //         console.log(err);
    //       }
    //     }
    //   );
    // });
  });
});
