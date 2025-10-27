// app.js (module)
const qs = s => document.querySelector(s);

const fileInput = qs('#fileInput');
const cameraBtn = qs('#cameraBtn');
const identifyBtn = qs('#identifyBtn');
const clearBtn = qs('#clearBtn');
const previewImage = qs('#previewImage');
const noImage = qs('#noImage');
const recognitionBox = qs('#recognitionBox');
const confidenceBox = qs('#confidenceBox');
const savePlantBtn = qs('#savePlantBtn');
const plantProfile = qs('#plantProfile');
const myPlantsList = qs('#myPlantsList');
const generateQrBtn = qs('#generateQrBtn');
const qrCanvas = qs('#qrCanvas');
const memHint = qs('#memHint');
const autoRemToggle = qs('#autoRemToggle');

let currentImageBlob = null;
let currentRecognition = null;

/* device memory */
if (navigator.deviceMemory) memHint.textContent = navigator.deviceMemory + ' GB';
else memHint.textContent = 'unknown';

/* file input */
fileInput.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return clearPreview();
  showPreviewFromFile(f);
});

/* camera capture (single frame) */
cameraBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      showPreviewFromFile(blob);
      stream.getTracks().forEach(t => t.stop());
    }, 'image/jpeg', 0.9);
  } catch (err) {
    alert('Camera not available or permission denied.');
  }
});

clearBtn.addEventListener('click', clearPreview);

function showPreviewFromFile(fileOrBlob){
  const url = URL.createObjectURL(fileOrBlob);
  previewImage.src = url;
  previewImage.style.display = 'block';
  noImage.style.display = 'none';
  currentImageBlob = fileOrBlob;
  recognitionBox.textContent = 'Ready to identify';
  confidenceBox.textContent = '';
  savePlantBtn.disabled = true;
  currentRecognition = null;
}

/* Identify -> send image to backend /api/identify */
identifyBtn.addEventListener('click', async () => {
  if (!currentImageBlob) { alert('Select or capture an image first.'); return; }
  recognitionBox.textContent = 'Recognizing...';
  confidenceBox.textContent = '';
  identifyBtn.disabled = true;

  try {
    const form = new FormData();
    // if blob has no name, give a default
    const file = currentImageBlob instanceof File ? currentImageBlob : new File([currentImageBlob], 'capture.jpg', { type: 'image/jpeg' });
    form.append('image', file);

    // optional: hint to backend which model to use
    form.append('model', 'auto');

    const t0 = performance.now();
    const res = await fetch('/api/identify', { method: 'POST', body: form });
    const t1 = performance.now();

    if (!res.ok) throw new Error('Server error: ' + res.status);
    const json = await res.json();

    /*
      Expected backend response (example):
      {
        label: "Aloe Vera",
        latin: "Aloe vera",
        confidence: 0.87,
        care: "Bright light. Water every 2-3 weeks...",
        duration_ms: 420,
        source: "tfjs" | "cloud-vision"
      }
    */

    if (!json || !json.label) {
      recognitionBox.textContent = 'No label returned';
      confidenceBox.textContent = '';
      identifyBtn.disabled = false;
      return;
    }

    currentRecognition = json;
    recognitionBox.textContent = `${json.label}${json.latin ? ' ('+json.latin+')' : ''}`;
    confidenceBox.textContent = `Confidence: ${Math.round((json.confidence||0)*100)}% · backend: ${json.source||'unknown'} · total ${Math.round(t1-t0)} ms`;
    showProfile(json);
    savePlantBtn.disabled = false;
  } catch (err) {
    console.error(err);
    recognitionBox.textContent = 'Recognition failed';
    confidenceBox.textContent = err.message || '';
  } finally {
    identifyBtn.disabled = false;
  }
});

function showProfile(profile){
  plantProfile.innerHTML = `
    <div class="profile">
      <div style="width:120px;height:100px;background:#f3fff3;border-radius:8px;display:flex;align-items:center;justify-content:center">
        <strong class="tiny">${profile.label}</strong>
      </div>
      <div class="info">
        <div><strong>${profile.label}</strong> <span class="muted">${profile.latin||''}</span></div>
        <div class="muted" style="margin-top:8px">${profile.care||'Care info not available'}</div>
      </div>
    </div>
  `;
}

/* Save plant locally */
savePlantBtn.addEventListener('click', async () => {
  if (!currentRecognition || !currentImageBlob) return;
  const id = 'plant_' + Date.now();
  const dataURL = await blobToDataURL(currentImageBlob);
  const saved = {
    id, name: currentRecognition.label, latin: currentRecognition.latin||'', care: currentRecognition.care||'', img: dataURL, savedAt: new Date().toISOString()
  };
  const list = loadPlants();
  list.unshift(saved);
  localStorage.setItem('wikiroots_plants', JSON.stringify(list));
  renderMyPlants();
  alert('Plant saved');
});

generateQrBtn.addEventListener('click', () => {
  if (!currentRecognition) return alert('Identify first');
  const payload = JSON.stringify({ label: currentRecognition.label, latin: currentRecognition.latin||'' });
  new QRious({ element: qrCanvas, value: payload, size: 240 });
});

/* My Plants rendering */
function loadPlants(){ try { return JSON.parse(localStorage.getItem('wikiroots_plants')||'[]'); } catch(e){ return []; } }
function renderMyPlants(){
  const list = loadPlants();
  if (!list.length){ myPlantsList.innerHTML = '<div class="muted tiny">No saved plants</div>'; return; }
  myPlantsList.innerHTML = '';
  for (const p of list){
    const div = document.createElement('div');
    div.className = 'myplant';
    div.style.display='flex';
    div.style.justifyContent='space-between';
    div.style.alignItems='center';
    div.style.marginBottom='8px';
    div.innerHTML = `<div style="display:flex;gap:8px;align-items:center">
      <img src="${p.img}" style="width:48px;height:36px;object-fit:cover;border-radius:6px" />
      <div><strong style="font-size:13px">${p.name}</strong><div class="tiny muted">${new Date(p.savedAt).toLocaleString()}</div></div>
    </div>
    <div><button class="tiny" onclick='openSaved("${p.id}")'>Open</button></div>`;
    myPlantsList.appendChild(div);
  }
}
window.openSaved = function(id){
  const list = loadPlants();
  const p = list.find(x=>x.id===id);
  if (!p) return alert('Not found');
  showProfile({ label: p.name, latin: p.latin, care: p.care });
}

/* helpers */
function blobToDataURL(blob){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function clearPreview(){
  previewImage.src = '';
  previewImage.style.display = 'none';
  noImage.style.display = 'block';
  currentImageBlob = null;
  recognitionBox.textContent = 'No result';
  confidenceBox.textContent = '';
  savePlantBtn.disabled = true;
  plantProfile.innerHTML = 'No profile shown';
}

/* load saved */
(function init(){ renderMyPlants(); })();
