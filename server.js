// server.js
// Simple Express server with /api/identify
// Run: npm init -y
// npm i express multer node-fetch cors
// For Google Cloud Vision: npm i @google-cloud/vision
// For TensorFlow option: npm i @tensorflow/tfjs-node @tensorflow-models/mobilenet canvas

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // if you serve frontend from same server

const PORT = process.env.PORT || 3000;

/* ---------- Option flags (choose one) ---------- */
// Set env var RECOG_BACKEND = 'vision' or 'tfjs' or 'mock'
const BACKEND = process.env.RECOG_BACKEND || 'mock';

/* ---------- Helper: load sample DB (care text) ---------- */
const sampleDB = require('./plants_db.json'); // create JSON mapping name -> care, latin etc.

/* ---------- Mock recognizer (fast demo) ---------- */
async function recognizeMock(filePath){
  // fake: choose random plant from sampleDB
  const list = Object.values(sampleDB);
  const idx = Math.floor(Math.random() * list.length);
  const p = list[idx];
  return { label: p.name, latin: p.latin, confidence: 0.6 + Math.random()*0.35, care: p.care, duration_ms: 200 + Math.floor(Math.random()*300), source: 'mock' };
}

/* ---------- Google Cloud Vision option ---------- */
async function recognizeVision(filePath){
  // Requires: set GOOGLE_APPLICATION_CREDENTIALS env var to service account json
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.labelDetection(filePath);
  const labels = result.labelAnnotations || [];
  // Find best match in sampleDB by label text
  for (const lbl of labels){
    const text = (lbl.description || '').toLowerCase();
    for (const key in sampleDB){
      const p = sampleDB[key];
      if (text.includes(p.name.toLowerCase()) || (p.latin && text.includes(p.latin.toLowerCase()))) {
        return { label: p.name, latin: p.latin, confidence: lbl.score || 0.7, care: p.care, duration_ms: Math.round((lbl.score||0.7)*100), source: 'cloud-vision' };
      }
    }
  }
  // fallback to first label
  const top = labels[0] || { description: 'unknown', score: 0.5 };
  return { label: top.description || 'Unknown', latin: '', confidence: top.score || 0.5, care: '', duration_ms: 300, source: 'cloud-vision' };
}

/* ---------- TFJS Node option (server-side mobilenet) ---------- */
let tfMobilenet = null;
async function loadTfModel(){
  if (tfMobilenet) return tfMobilenet;
  const tf = require('@tensorflow/tfjs-node');
  const mobilenet = require('@tensorflow-models/mobilenet');
  tfMobilenet = await mobilenet.load({ version: 2, alpha: 1.0 });
  return tfMobilenet;
}
async function recognizeTfjs(filePath){
  const tf = require('@tensorflow/tfjs-node');
  const mobilenet = await loadTfModel();
  // read image buffer
  const imageBuffer = fs.readFileSync(filePath);
  const decoded = tf.node.decodeImage(imageBuffer, 3);
  const resized = tf.image.resizeBilinear(decoded, [224,224]);
  const expanded = resized.expandDims(0).toFloat().div(127).sub(1);
  const preds = await tfMobilenet.classify(expanded);
  decoded.dispose(); resized.dispose(); expanded.dispose();
  const top = preds[0] || { className: 'unknown', probability: 0.5 };
  // try to map predicted class to sampleDB
  for (const key in sampleDB){
    const p = sampleDB[key];
    if (top.className.toLowerCase().includes(p.name.toLowerCase())) {
      return { label: p.name, latin: p.latin, confidence: top.probability, care: p.care, duration_ms: Math.round(top.probability*100), source: 'tfjs' };
    }
  }
  return { label: top.className, latin: '', confidence: top.probability, care: '', duration_ms: Math.round(top.probability*100), source: 'tfjs' };
}

/* ---------- API endpoint ---------- */
app.post('/api/identify', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const filePath = path.resolve(req.file.path);
  try {
    let out;
    if (BACKEND === 'vision') {
      out = await recognizeVision(filePath);
    } else if (BACKEND === 'tfjs') {
      out = await recognizeTfjs(filePath);
    } else {
      out = await recognizeMock(filePath);
    }
    // attach care if missing by trying to match label
    if (!out.care) {
      const found = Object.values(sampleDB).find(p => p.name.toLowerCase() === (out.label||'').toLowerCase());
      if (found) out.care = found.care;
    }
    res.json(out);
  } catch (err) {
    console.error('Identify error', err);
    res.status(500).json({ error: 'Recognition failed', detail: err.message });
  } finally {
    // cleanup uploaded file
    fs.unlink(filePath, ()=>{});
  }
});

/* ---------- static plant DB file endpoint example ---------- */
app.get('/api/plants', (req, res) => {
  // return sampleDB as list
  res.json(Object.values(sampleDB));
});

app.listen(PORT, ()=> console.log(`Server running on port ${PORT} (BACKEND=${BACKEND})`));
