document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const appContainer = document.getElementById("appContainer");
  const openCameraBtn = document.getElementById("openCameraBtn");
  const captureBtn = document.getElementById("captureBtn");
  const flipBtn = document.getElementById("flipBtn");
  const recognizeBtn = document.getElementById("recognizeBtn");
  const upload = document.getElementById("upload");
  const camera = document.getElementById("camera");
  const snapshot = document.getElementById("snapshot");
  const ctx = snapshot.getContext("2d");

  let model, currentStream, facingMode = "environment";

  // Show main app
  startBtn.addEventListener("click", () => {
    document.querySelector(".hero").classList.add("hidden");
    appContainer.classList.remove("hidden");
  });

  // Open camera
  openCameraBtn.addEventListener("click", async () => {
    if (currentStream) currentStream.getTracks().forEach(t => t.stop());
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      camera.srcObject = currentStream;
    } catch (err) {
      alert("Camera access denied or unavailable.");
    }
  });

  // Flip camera
  flipBtn.addEventListener("click", async () => {
    facingMode = facingMode === "user" ? "environment" : "user";
    if (currentStream) currentStream.getTracks().forEach(t => t.stop());
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode }
    });
    camera.srcObject = currentStream;
  });

  // Capture image
  captureBtn.addEventListener("click", () => {
    snapshot.width = camera.videoWidth;
    snapshot.height = camera.videoHeight;
    ctx.drawImage(camera, 0, 0);
    snapshot.classList.remove("hidden");
  });

  // Load model
  (async () => {
    model = await mobilenet.load();
    console.log("✅ MobileNet model loaded");
  })();

  // Recognize plant
  recognizeBtn.addEventListener("click", async () => {
    if (!model) {
      alert("Model still loading. Please wait a moment.");
      return;
    }

    const resultSection = document.getElementById("resultSection");
    resultSection.classList.remove("hidden");

    const img = new Image();
    img.src = snapshot.toDataURL();

    const predictions = await model.classify(img);
    const best = predictions[0];
    const name = best.className.toLowerCase();

    const plant = plantsDB.find(p => name.includes(p.name.toLowerCase()));

    if (plant) {
      document.getElementById("plantName").textContent = plant.name;
      document.getElementById("plantInfo").textContent = plant.info;
      document.getElementById("plantCare").textContent = plant.care;
      document.getElementById("plantImage").src = plant.image;

      new QRious({
        element: document.getElementById("qrCode"),
        value: `${plant.name} — Care: ${plant.care}`,
        size: 120
      });
    } else {
      document.getElementById("plantName").textContent = "Unknown Plant 🌱";
      document.getElementById("plantInfo").textContent = "Try another photo or better lighting.";
      document.getElementById("plantImage").src = "";
      document.getElementById("plantCare").textContent = "";
      document.getElementById("qrCode").innerHTML = "";
    }
  });

  // Upload image manually
  upload.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = new Image();
      img.onload = () => {
        snapshot.width = img.width;
        snapshot.height = img.height;
        ctx.drawImage(img, 0, 0);
        snapshot.classList.remove("hidden");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
});
