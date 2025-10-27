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

// --- Home screen ---
startBtn.addEventListener('click',()=>{
  homeScreen.classList.add('hidden');
  setTimeout(()=>{ homeScreen.style.display='none'; appContainer.style.display='block'; },700);
});

// --- Load MobileNet ---
async function loadModel(){ model = await mobilenet.load(); }
loadModel();

// --- File input ---
fileInput.addEventListener('change',(e)=>{
  const file=e.target.files[0];
  if(file){
    previewImage.src=URL.createObjectURL(file);
    previewImage.style.display='block';
    currentBlob=file;
    recognizeBlob(file);
  }
});

// --- Camera real-time recognition ---
openCameraBtn.addEventListener('click', async ()=>{
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:true});
    cameraView.srcObject=stream;
    cameraView.style.display='block';
    requestAnimationFrame(recognizeFrame);
  }catch(err){ alert('Camera access denied or not supported.'); }
});

async function recognizeFrame(){
  if(!model || !cameraView.srcObject) return;
  if(cameraView.videoWidth && cameraView.videoHeight){
    const canvas=document.createElement('canvas');
    canvas.width=cameraView.videoWidth;
    canvas.height=cameraView.videoHeight;
    canvas.getContext('2d').drawImage(cameraView,0,0);
    const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg'));
    recognizeBlob(blob);
  }
  setTimeout(()=>requestAnimationFrame(recognizeFrame),500);
}

// --- Recognize a blob ---
async function recognizeBlob(blob){
  if(!model) return;
  const img = await blobToImage(blob);
  const predictions = await model.classify(img);
  const top = predictions[0];
  let name = top.className.split(',')[0].trim();
  displayResult(name, top.probability);
}

function displayResult(name, prob){
  if(plantsDB[name]){
    resultText.textContent=`${name} (${(prob*100).toFixed(1)}%)`;
    plantImage.src=plantsDB[name].img;
    plantImage.style.display='block';
    plantInfo.textContent=plantsDB[name].info;
    generateQR(name);
  } else {
    resultText.textContent=`Unknown plant (${(prob*100).toFixed(1)}%)`;
    plantImage.style.display='none';
    plantInfo.textContent='';
  }
}

function generateQR(text){
  new QRious({ element:qrCanvas, value:`https://wikiroots.app/plants/${encodeURIComponent(text)}`, size:200 });
}

function blobToImage(blob){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const url=URL.createObjectURL(blob);
    img.onload=()=>{ URL.revokeObjectURL(url); resolve(img); };
    img.onerror=reject;
    img.src=url;
  });
}
