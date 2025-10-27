// app.js
const homeScreen = document.getElementById('homeScreen');
const appContainer = document.getElementById('appContainer');
const startBtn = document.getElementById('startBtn');
const cameraView = document.getElementById('cameraView');
const resultText = document.getElementById('resultText');
const qrCanvas = document.getElementById('qrCanvas');
const plantImage = document.getElementById('plantImage');
const plantInfo = document.getElementById('plantInfo');
const openCameraBtn = document.getElementById('openCameraBtn');

let model = null, stream = null;
let currentCamera = 'environment';

// --- Start Button ---
startBtn.addEventListener('click', ()=>{
  homeScreen.style.display='none';
  appContainer.style.display='block';
});

// --- Flip Camera Button ---
const flipCameraBtn = document.createElement('button');
flipCameraBtn.textContent = 'Flip Camera';
flipCameraBtn.classList.add('primary');
document.querySelector('.container').prepend(flipCameraBtn);

flipCameraBtn.addEventListener('click', async ()=>{
  currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
  if(stream) stream.getTracks().forEach(track => track.stop());
  startCamera(currentCamera);
});

// --- Load MobileNet ---
async function loadModel(){
  model = await mobilenet.load();
  console.log('MobileNet loaded');
}
loadModel();

// --- Name mapping MobileNet -> plantsDB ---
const nameMap = {
  'sunflower':'Sunflower',
  'aloe':'Aloe Vera',
  'monstera':'Monstera',
  'fiddle leaf fig':'Fiddle Leaf Fig',
  'lavender':'Lavender',
  'cactus':'Cactus',
  'rose':'Rose',
  'orchid':'Orchid',
  'bamboo':'Bamboo',
  'tulip':'Tulip',
  'mint':'Mint',
  'basil':'Basil',
  'spider plant':'Spider Plant',
  'peace lily':'Peace Lily',
  'pothos':'Pothos',
  'geranium':'Geranium',
  'marigold':'Marigold',
  'daffodil':'Daffodil',
  'snake plant':'Snake Plant',
  'hibiscus':'Hibiscus'
};

// --- Start Camera ---
openCameraBtn.addEventListener('click', ()=>startCamera(currentCamera));

async function startCamera(facing){
  if(!model) return alert('Model not loaded yet!');
  try{
    stream = await navigator.mediaDevices.getUserMedia({video:{facingMode: facing}});
    cameraView.srcObject = stream;
    cameraView.play();
    cameraView.onloadeddata = ()=>recognizeFrame();
  }catch(err){ alert('Camera access denied or not supported.'); }
}

// --- Recognize frame in real-time ---
async function recognizeFrame(){
  if(!model || !cameraView.srcObject) return;
  const predictions = await model.classify(cameraView);
  if(predictions.length>0){
    const top = predictions[0];
    let key = top.className.split(',')[0].trim().toLowerCase();
    let plantName = nameMap[key];
    if(plantName){
      displayResult(plantName, top.probability);
    } else {
      resultText.textContent = `Unknown plant (${(top.probability*100).toFixed(1)}%)`;
      plantImage.style.display='none';
      plantInfo.textContent='';
    }
  }
  requestAnimationFrame(recognizeFrame);
}

// --- Display result and generate QR ---
function displayResult(name, prob){
  if(plantsDB[name]){
    resultText.textContent = `${name} (${(prob*100).toFixed(1)}%)`;
    plantImage.src = plantsDB[name].img;
    plantImage.style.display='block';
    plantInfo.textContent = plantsDB[name].info;
    generateQR(name);
  }
}

// --- Generate QR code ---
function generateQR(text){
  new QRious({
    element: qrCanvas,
    value: `https://wikiroots.app/plants/${encodeURIComponent(text)}`,
    size:200
  });
}
