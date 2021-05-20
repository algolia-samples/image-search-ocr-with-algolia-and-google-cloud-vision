var video = document.getElementById("video");
var canvas = document.getElementById("canvas");

var scanBtn = document.getElementById("action-scan");
var notifyBtn = document.getElementById("action-notify");
var cancelBtn = document.getElementById("action-cancel");

var employeeEl = document.getElementById("employee");
var employeeNameEl = document.getElementById("employee-name");
var employeePictureEl = document.getElementById("employee-picture");
var employeeSlackEl = document.getElementById("slack-id");

var errorContainerEl = document.getElementById("error-container");
var errorTextEl = document.getElementById("error-text");

var handleResponse = function(res) {
    if (!res.ok) {
        return res.json().then(function(json) {
            if (json.error) {
                throw new Error(res.url + ' ' + res.status + ' ' + json.error);
            }
        }).catch(function(err) {
            showError(err);
            throw err;
        });
    }
    return res.json();
}

var showError = function(err) {
    errorContainerEl.style.display = "flex";
    errorTextEl.innerText = err.message;
}

var hideError = function() {
    errorContainerEl.style.display = "none";
}

var webcamToImage = function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    var dataURL = canvas.toDataURL();
    return fetch(dataURL).then(function(res){
        return res.blob().then(function(blob) {
            return new File([blob], 'label.png')
        })
    });
}

var uploadImage = function(image) {
    var data = new FormData();
    data.append('label', image);
    return fetch(
        '/scan',
        {
            method: 'POST',
            body: data,
            header: { 'Content-Type': 'multipart/form-data' }
        }
    ).then(handleResponse);
}

var scanLabel = function() {
    hideError();
    webcamToImage()
        .then(uploadImage)
        .then(displayEmployee);
}

var displayEmployee = function(employee) {
    employeeNameEl.innerText = employee['displayName'];
    employeePictureEl.src = employee["slack"]["image"];
    employeeSlackEl.value = employee["slack"]["id"];

    employeeEl.style.display = "flex";
    scanBtn.style.display = "none";
}

var hideEmployee = function() {
    employeeEl.style.display = "none";
    scanBtn.style.display = "inline-flex";
}

var notifyEmployee = function() {
    var slackID = employeeSlackEl.value;
    fetch("/notify", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({slackID: slackID})
    }).then(confirm);
}

var confirm = function() {
    var previousTextLabel = notifyBtn.innerText;
    notifyBtn.innerText = 'Notification sent!';
    setTimeout(function() {
        hideEmployee();
        notifyBtn.innerText = previousTextLabel;
    }, 500)
}

var startWebcam = function() {
    var constraints = {
        audio: false,
        video: {
            facingMode: {
                exact: 'environment'
            }
        }
    };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            window.stream = stream;
            video.srcObject = stream;
        })
        .catch(function(err) {
            showError(new Error("This sample only work on mobile devices with a front-facing camera."));
        });
}

startWebcam();

scanBtn.addEventListener("click", scanLabel);
cancelBtn.addEventListener("click", hideEmployee);
notifyBtn.addEventListener("click", notifyEmployee);