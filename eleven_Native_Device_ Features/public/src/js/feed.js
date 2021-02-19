var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");
var videoPlayer = document.querySelector("#player");
var canvasElement = document.querySelector("#canvas");
var captureBtn = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");
var picture;
var locationBtn = document.querySelector("#location-btn");
var locationLoader = document.querySelector("#location-loader");
var fetchLocation = { lat: 0, lng: 0 };

locationBtn.addEventListener("click", function (event) {
  if (!("geolocation" in navigator)) {
    return;
  }

  var showAlert = true;

  locationBtn.style.display = "none";
  locationLoader.style.display = "block";

  navigator.geolocation.getCurrentPosition(
    function (position) {
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      fetchLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      locationInput.value = "In Munich";
      document.querySelector("#manual-location").classList.add("if-focused");
    },
    function (err) {
      console.log(err);
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      fetchLocation = { lat: 0, lng: 0 };
      if (showAlert) {
        alert("Couldn't fetch location, please enter manually");
        showAlert = false;
      }
    },
    {
      // Timeout allows us to specify how long we try to get a location, a position.
      timeout: 70000,
    }
  );
});

function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
}

function initializeMedia() {
  // a device can generate and that typically is audio or video, video includes images.
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    // Constraint basically will be is it audio or is it video which we want to capture?
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // if it doesn't support the modern syntax, it at least has its own implementation
      // webkit get user media which is Safari's || Mozilla
      var getUserMedia = navigator.webkitGetUser || navigator.mozGetUserMedia;
      // If we neither can get access to webkit,
      // user media normal Mozilla because either we're using another browser,
      // maybe Internet Explorer, an older version which doesn't support get user media or we use as a Safari
      // browser but just an older version too.
      if (!getUserMedia) {
        // So here we also return a new promise because again, get user media, the modern implementation returns one,
        // so our custom one should do so
        // too
        return Promise.reject(new Error(), "getUserMedia is not implemented!");
      } else {
        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    };
  }

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      videoPlayer.srcObject = stream;
      captureBtn.style.display = "inline-block";
      videoPlayer.style.display = "block";
    })
    .catch((err) => {
      imagePickerArea.style.display = "block";
    });
}

captureBtn.addEventListener("click", function (event) {
  canvasElement.style.display = "block";
  videoPlayer.style.display = "none";
  captureBtn.style.display = "none";
  var context = canvasElement.getContext("2d");
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvasElement.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width)
  );
  videoPlayer.srcObject.getVideoTracks().forEach((track) => {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener("change", function (event) {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  setTimeout(function () {
    createPostArea.style.transform = "translateY(0)";
  }, 1);
  initializeMedia();
  initializeLocation();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  if ("srcObject" in videoPlayer) {
    videoPlayer.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    });
  }
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  captureBtn.style.display = "inline";
  canvasElement.style.display = "none";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
  setTimeout(() => {
    createPostArea.style.transform = "translateY(100vh)";
  }, 1);
  // createPostArea.style.display = 'none';
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log("clicked");
  if ("caches" in window) {
    caches.open("user-requested").then(function (cache) {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url(" + data.image + ")";
  cardTitle.style.backgroundSize = "cover";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var url = "https://pwagram-bf1ef-default-rtdb.firebaseio.com/posts.json";
var networkDataReceived = false;

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    console.log("From web", data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ("indexedDB" in window) {
  readAllData("posts").then(function (data) {
    if (!networkDataReceived) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
}

function sendData() {
  var id = new Date().toISOString();
  var postData = new FormData();
  postData.append("id", id);
  postData.append("title", titleInput.value);
  postData.append("location", locationInput.value);
  postData.append("file", picture, id + ".png");
  postData.append("rawLocationLat", fetchLocation.lat);
  postData.append("rawLocationLng", fetchLocation.lng);
  fetch("https://us-central1-pwagram-bf1ef.cloudfunctions.net/storePostData", {
    method: "POST",
    body: postData,
  }).then(function (res) {
    console.log("Sent data", res);
    updateUI();
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("Please enter valid data!");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(function (sw) {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchLocation,
      };
      writeData("sync-posts", post)
        .then(function () {
          return sw.sync.register("sync-new-posts");
        })
        .then(function () {
          var snackbarContainer = document.querySelector("#confirmation-toast");
          var data = { message: "Your Post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
