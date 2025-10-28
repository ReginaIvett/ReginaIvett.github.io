// Modelo de Teachable Machine (público)
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/5fHnbuGx3/";

let video = document.getElementById("camera");
let canvas = document.getElementById("canvas");
let flipBtn = document.getElementById("flipBtn");
let startBtn = document.getElementById("startBtn");
let captureBtn = document.getElementById("captureBtn");
let loading = document.getElementById("loading");
let resultSection = document.getElementById("resultSection");
let plantName = document.getElementById("plantName");
let plantInfo = document.getElementById("plantInfo");
let plantImage = document.getElementById("plantImage");

let currentStream;
let useFrontCamera = false;

// Iniciar cámara
async function startCamera() {
    document.getElementById("cameraSection").classList.remove("hidden");
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: { facingMode: useFrontCamera ? "user" : "environment" }
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
}

flipBtn.addEventListener("click", () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
});

startBtn.addEventListener("click", () => {
    startCamera();
    startBtn.classList.add("hidden");
});

captureBtn.addEventListener("click", async () => {
    loading.classList.remove("hidden");

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const prediction = await predictPlant();

    loading.classList.add("hidden");
    resultSection.classList.remove("hidden");

    const plants = {
        "Sunflower": "Needs direct sunlight and watering twice a week.",
        "Rose": "Water every 2-3 days and prune regularly.",
        "Cactus": "Requires little water and lots of light.",
        "Basil": "Needs sunlight and watering every day.",
        "Orchid": "Keep in bright, indirect light with moderate watering.",
        "Lavender": "Loves sunlight and dry soil.",
        "Fern": "Prefers shade and moist soil.",
        "Aloe Vera": "Needs bright light, water every 2 weeks.",
        "Mint": "Keep soil moist and partial sunlight.",
        "Peace Lily": "Keep soil damp, avoid direct sunlight."
    };

    if (plants[prediction]) {
        plantName.textContent = prediction;
        plantInfo.textContent = plants[prediction];
        plantImage.src = `images/${prediction.toLowerCase().replace(' ', '-')}.jpg`;
        document.getElementById("qrCode").innerHTML = "";
        new QRCode(document.getElementById("qrCode"), {
            text: `https://wikiroots.com/plants/${prediction.toLowerCase().replace(' ', '-')}`,
            width: 100,
            height: 100
        });
    } else {
        plantName.textContent = "Unknown Plant";
        plantInfo.textContent = "Try again with a clearer picture.";
    }
});

// Predicción con modelo de Teachable Machine
async function predictPlant() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    const model = await tmImage.load(modelURL, metadataURL);
    const prediction = await model.predict(video);

    prediction.sort((a, b) => b.probability - a.probability);
    return prediction[0].className;
}
