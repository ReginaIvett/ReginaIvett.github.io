<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WikiRoots</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>🌿 WikiRoots</h1>
        <p>Discover, care and connect with nature</p>
        <p class="team">By Team #4</p>
    </header>

    <main>
        <!-- Sección de inicio -->
        <section id="startScreen">
            <h2>Welcome to WikiRoots!</h2>
            <p>Identify your plants, learn how to care for them, and generate QR codes for your collection.</p>
            <button id="startBtn">Start</button>
        </section>

        <!-- Sección de cámara -->
        <section id="cameraSection" class="hidden">
            <h2>Camera</h2>
            <video id="camera" autoplay playsinline></video>
            <div class="camera-buttons">
                <button id="flipBtn">🔄 Flip Camera</button>
                <button id="captureBtn">📸 Capture</button>
            </div>
            <canvas id="canvas" class="hidden"></canvas>
            <p id="loading" class="hidden">Analyzing plant...</p>
        </section>

        <!-- Sección de resultados -->
        <section id="resultSection" class="hidden">
            <h2>Plant Identified 🌱</h2>
            <img id="plantImage" alt="Plant">
            <p id="plantName"></p>
            <p id="plantInfo"></p>
            <div id="qrCode"></div>
        </section>

        <!-- Sección de explicación de la app -->
        <section id="about">
            <h2>About WikiRoots</h2>
            <p>WikiRoots is your personal plant assistant! Take a photo of your plant, get detailed information about it, learn how to care for it, and generate a QR code to track its profile.</p>
            <ul>
                <li>📸 Take photos with AI-powered recognition</li>
                <li>🌱 Learn plant care, watering schedules, and pruning tips</li>
                <li>📌 Save your plants in "My Plants" and get reminders</li>
                <li>🔗 Generate QR codes to quickly access plant profiles</li>
            </ul>
        </section>
    </main>

    <footer>
        <p>©️ 2025 WikiRoots Project</p>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/qrcodejs/qrcode.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8/dist/teachablemachine-image.min.js"></script>
    <script src="app.js"></script>
</body>
</html>
