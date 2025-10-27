// app.js
const homeScreen = document.getElementById('homeScreen');
const appContainer = document.getElementById('appContainer');
const startBtn = document.getElementById('startBtn');

const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const cameraView = document.getElementById('cameraView');
const openCameraBtn = document.getElementById('openCameraBtn');
const resultText = document.getElementById('resultText');
const qrCanvas = document.getElementById('qrCanvas');
const plantImage = document.getElementById('plantImage');
const plantInfo = document.getElementById('plantInfo');

let currentBlob = null, model = null, stream = null;
let currentCamera = 'environment'; // 'environment' = trasera, 'user' = frontal

// --- Botón Flip Camera ---
const flipCameraBtn = document.createElement('button');
flipCameraBtn.textContent = 'Flip Camera';
flipCameraBtn.classList.add('primary');
document.querySelector('.container').prepend(flipCameraBtn);

// --- Start button ---
document.addEventListener('DOMContentLoaded', ()=>{
  startBtn.addEventListener('click', ()=>{
    homeScreen.style.display='none';
    appContainer.style.display='block';
  });
});

// --- Load MobileNet ---
async function loadModel(){
  model = await mobilenet.load();
  console.log('MobileNet loaded');
}
loadModel();

// --- Convert video frame to image ---
function videoToImage(video){
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
  const img = new Image();
  img.src = canvas.toDataURL('image/jpeg');
  return img;
}

// --- File input ---
fileInput.addEventListener('change',(e)=>{
  const file=e.target.files[0];
  if(file){
    previewImage.src=URL.createObjectURL(file);
    previewImage.style.display='block';
    recognizeBlob(file);
  }
});

// --- Recognize blob ---
async function recognizeBlob(blob){
  if(!model) return;
  const img = await blobToImage(blob);
  const predictions = await model.classify(img);
  const top = predictions[0];
  let name = top.className.split(',')[0].trim();
  displayResult(name, top.probability);
}

// --- Convert blob to image ---
function blobToImage(blob){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload=()=>{ URL.revokeObjectURL(url); resolve(img); };
    img.onerror=reject;
    img.src=url;
  });
}

// --- Camera real-time recognition ---
openCameraBtn.addEventListener('click', async ()=>{
  startCamera(currentCamera);
});

// --- Flip Camera ---
flipCameraBtn.addEventListener('click', async ()=>{
  currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
  if(stream){
    stream.getTracks().forEach(track => track.stop());
  }
  startCamera(currentCamera);
});

async function startCamera(facing){
  try{
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing }
    });
    cameraView.srcObject = stream;
    cameraView.style.display='block';
    cameraView.addEventListener('loadeddata',()=>requestAnimationFrame(recognizeFrame));
  }catch(err){ alert('Camera access denied or not supported.'); }
}

// --- Recognize frame ---
async function recognizeFrame(){
  if(!model || !cameraView.srcObject) return;

  if(cameraView.videoWidth && cameraView.videoHeight){
    const img = videoToImage(cameraView);
    const predictions = await model.classify(img);
    const top = predictions[0];
    let name = top.className.split(',')[0].trim();
    displayResult(name, top.probability);
  }

  requestAnimationFrame(recognizeFrame);
}

// --- Display result ---
function displayResult(name, prob){
  if(plantsDB[name]){
    resultText.textContent = `${name} (${(prob*100).toFixed(1)}%)`;
    plantImage.src = plantsDB[name].img;
    plantImage.style.display='block';
    plantInfo.textContent = plantsDB[name].info;
    generateQR(name);
  } else {
    resultText.textContent = `Unknown plant (${(prob*100).toFixed(1)}%)`;
    plantImage.style.display='none';
    plantInfo.textContent='';
  }
}

// --- Generate QR ---
function generateQR(text){
  new QRious({
    element: qrCanvas,
    value: `https://wikiroots.app/plants/${encodeURIComponent(text)}`,
    size: 200
  });
}
