const API = "http://127.0.0.1:8000";

let video;
let output;
let stream = null;
let running = false;

// ✅ LOAD EVERYTHING PROPERLY
window.onload = () => {
    video = document.getElementById("webcam");
    output = document.getElementById("output");

    if (isLoggedIn()) {
        startDetection(); // auto start only if logged in
    }
};

// CAMERA
async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
}

// STOP CAMERA
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// CAPTURE FRAME
function captureFrame() {
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
    }
    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg").split(",")[1];
}
let alertSent = false;

async function sendFrame() {
    if (!running) return;

    let frame = captureFrame();
    if (!frame) {
        // Video not ready yet, wait a bit and try again
        if (running) {
            requestAnimationFrame(sendFrame);
        }
        return;
    }

    try {
        let res = await fetch(API + "/detect-frame", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ image: frame })
        });

        if (!res.ok) throw new Error("Server returned HTTP " + res.status);
        let data = await res.json();

        // Check if stopped while fetch was in progress
        if (!running) return;

        // show detection image
        if (data.image) {
            output.src = "data:image/jpeg;base64," + data.image;
        }

        // update status overlay
        const overlay = document.getElementById("status-overlay");
        if (overlay) {
            overlay.style.display = "flex";
            if (data.threat) {
                overlay.innerHTML = "⚠ DANGEROUS";
                overlay.className = "status-overlay threat";
            } else {
                overlay.innerHTML = "✓ SAFE";
                overlay.className = "status-overlay safe";
            }
        }

        // 🚨 Threat Alert Handling
        if (data.threat) {
            document.body.style.border = "5px solid red";

            if (!alertSent) {
                const user = getUser();
                if (user && user.email) {
                    fetch(API + "/send-alert", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            email: user.email,
                            threat: true,
                            detections: data.detections,
                            image: data.image
                        })
                    })
                    .then(r => {
                        if (!r.ok) throw new Error("Server returned error status");
                        return r.json();
                    })
                    .then(res => {
                        console.log("Alert email sent successfully:", res);
                        showToast("🚨 SECURITY ALERT EMAIL SENT!", "error");
                    })
                    .catch(err => {
                        console.error("Alert email failed to send:", err);
                        showToast("Failed to send alert email", "error");
                    });
                }
                alertSent = true;
            }
        } else {
            document.body.style.border = "none";
            alertSent = false;
        }

        if (running) {
            requestAnimationFrame(sendFrame);
        }
    } catch (err) {
        console.error("Frame detection failed:", err);
        // Wait 1 second before retrying on network/server error to prevent spamming the console/server
        if (running) {
            setTimeout(() => {
                requestAnimationFrame(sendFrame);
            }, 1000);
        }
    }
}

// START
async function startDetection() {
    if (running) return;
    running = true;
    try {
        await startCamera();
        sendFrame();
    } catch (err) {
        console.error("Failed to start camera:", err);
        running = false;
        showToast("⚠️ CAMERA ACCESS DENIED OR UNAVAILABLE", "error");
    }
}

// STOP
function stopDetection() {
    running = false;
    stopCamera();
    document.body.style.border = "none";
    const overlay = document.getElementById("status-overlay");
    if (overlay) overlay.style.display = "none";
}