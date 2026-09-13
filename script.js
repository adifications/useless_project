const NASA_API_KEY = "APIKEY"; 
let spaceImage = new Image();
let currentMediaType = "image"; 
let pendingNasaData = null; // Store data while traversing gauntlet

const canvas = document.getElementById("space-canvas");
const ctx = canvas.getContext("2d");

// ==========================================
// USELESS GAUNTLET 1: THE 3.14s IGNITION
// ==========================================
let holdStart = 0;
let holdVisualInterval;
const launchBtn = document.getElementById("launch-btn");

launchBtn.addEventListener("mousedown", () => {
    const dateInput = document.getElementById("target-date").value;
    if (!dateInput) return alert("ERROR: Must input temporal coordinates.");
    
    holdStart = performance.now();
    holdVisualInterval = setInterval(() => {
        let current = (performance.now() - holdStart) / 1000;
        let jitter = current + (Math.random() * 0.3 - 0.15); // Fake visual jitter
        launchBtn.innerText = Math.max(0, jitter).toFixed(3) + "s";
    }, 45);
});

window.addEventListener("mouseup", (e) => {
    if (holdStart === 0) return;
    clearInterval(holdVisualInterval);
    let duration = (performance.now() - holdStart) / 1000;
    holdStart = 0;
    launchBtn.innerText = "ENGAGE";

    if (e.target !== launchBtn) return; 

    // Must be exactly around 3.14s
    if (duration >= 3.0 && duration <= 3.2) {
        initiateSyzygyGame();
    } else {
        alert(`CRITICAL TRAJECTORY MISALIGNMENT.\nYou held ignition for ${duration.toFixed(3)}s.\nRequired: 3.14s (Pi).`);
    }
});

// ==========================================
// USELESS GAUNTLET 2: SYZYGY CALIBRATION
// ==========================================
let pAngles = { year: 120, month: 240, day: 45 };
let draggingPlanet = null;
let lastAngle = 0;

function updatePlanets() {
    document.getElementById('planet-year').style.transform = `rotate(${pAngles.year}deg) translateX(120px)`;
    document.getElementById('planet-month').style.transform = `rotate(${pAngles.month}deg) translateX(80px)`;
    document.getElementById('planet-day').style.transform = `rotate(${pAngles.day}deg) translateX(40px)`;
}
updatePlanets(); // Init positioning

function initiateSyzygyGame() {
    document.getElementById("syzygy-modal").classList.remove("hidden");
    pAngles = { year: Math.random()*360, month: Math.random()*360, day: Math.random()*360 };
    updatePlanets();
}

document.querySelectorAll('.planet').forEach(p => {
    p.addEventListener('mousedown', (e) => {
        draggingPlanet = p.id.split('-')[1]; 
        let ring = document.getElementById('ring-' + draggingPlanet);
        let rect = ring.getBoundingClientRect();
        lastAngle = Math.atan2(e.clientY - (rect.top + rect.height/2), e.clientX - (rect.left + rect.width/2)) * 180 / Math.PI;
    });
});

window.addEventListener('mousemove', (e) => {
    if(!draggingPlanet) return;
    let ring = document.getElementById('ring-' + draggingPlanet);
    let rect = ring.getBoundingClientRect();
    let currentAngle = Math.atan2(e.clientY - (rect.top + rect.height/2), e.clientX - (rect.left + rect.width/2)) * 180 / Math.PI;

    let delta = Math.abs(currentAngle - lastAngle);
    if (delta > 180) delta = 360 - delta; 

    if (delta > 35) { // Mouse moved too fast -> Slingshot!
        pAngles[draggingPlanet] = Math.random() * 360;
        draggingPlanet = null;
        alert("Velocity threshold exceeded. Planet slingshotted out of orbit.");
    } else {
        pAngles[draggingPlanet] += (currentAngle - lastAngle);
    }
    lastAngle = currentAngle;
    updatePlanets();
});

window.addEventListener('mouseup', () => draggingPlanet = null);

document.getElementById('syzygy-lock-btn').addEventListener('click', () => {
    // Check if all planets are near top dead center (-15 to 15 degrees)
    let valid = ['year', 'month', 'day'].every(k => {
        let normalized = ((pAngles[k] % 360) + 360) % 360; 
        return normalized <= 15 || normalized >= 345; // Must be near 0/360
    });

    if(valid) {
        document.getElementById("syzygy-modal").classList.add("hidden");
        fetchNasaData(); // Proceed to next phase
    } else {
        alert("Alignment Failed. The celestial bodies must form a straight line pointing UP (0°).");
    }
});

// ==========================================
// 1. FETCH LOGIC (Intercepted by Gauntlet)
// ==========================================
async function fetchNasaData() {
    const dateInput = document.getElementById("target-date").value;
    
    // Purge the previous image/video immediately so the Solar System shows
    const videoEl = document.getElementById("space-video");
    videoEl.style.display = "none";
    videoEl.src = "";
    canvas.style.backgroundImage = "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("eraser-tools").style.display = "none";
    
    // Reset the text bubble
    document.getElementById("apod-title").innerText = "Decrypting Signal...";
    document.getElementById("apod-desc").innerText = "";

    // Show the universal loader
    document.getElementById("loader-overlay").classList.remove("hidden");
    document.getElementById("ping-text").innerText = "Establishing secure uplink...";

    try {
        const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${dateInput}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        pendingNasaData = await res.json();
        
        // Hide loader, trigger Captcha instead of showing image
        document.getElementById("loader-overlay").classList.add("hidden");
        initiateCaptcha();

    } catch (error) {
        document.getElementById("ping-text").innerHTML = `CRITICAL FAILURE: ${error.message}<br><button class="glass-btn" onclick="document.getElementById('loader-overlay').classList.add('hidden')">CLOSE</button>`;
    }
}

// ==========================================
// USELESS GAUNTLET 3: DARK MATTER CAPTCHA
// ==========================================
document.querySelectorAll('.c-tile').forEach(tile => {
    tile.addEventListener('click', () => tile.classList.toggle('selected'));
});

function initiateCaptcha() {
    document.getElementById("captcha-modal").classList.remove("hidden");
    document.querySelectorAll('.c-tile').forEach(t => t.classList.remove('selected'));
}

document.getElementById('captcha-verify-btn').addEventListener('click', () => {
    const selectedCount = document.querySelectorAll('.c-tile.selected').length;
    if(selectedCount > 0) {
        alert("Bot detected. Dark Matter is invisible and interacts with nothing. You selected visible baryonic matter.");
        document.querySelectorAll('.c-tile').forEach(t => t.classList.remove('selected'));
    } else {
        document.getElementById("captcha-modal").classList.add("hidden");
        initiateKineticDownload();
    }
});

// ==========================================
// USELESS GAUNTLET 4: KINETIC BANDWIDTH
// ==========================================
let kbProgress = 0;
let kbActive = false;
let kbInterval;

function initiateKineticDownload() {
    document.getElementById("kinetic-modal").classList.remove("hidden");
    kbProgress = 0;
    kbActive = true;
    
    // Drain progress rapidly over time
    kbInterval = setInterval(() => {
        kbProgress -= 0.8;
        if(kbProgress < 0) kbProgress = 0;
        updateKineticUI();
    }, 50);
}

window.addEventListener('wheel', () => {
    if(!kbActive) return;
    kbProgress += 2.5; 
    
    if(kbProgress >= 100) {
        kbProgress = 100;
        kbActive = false;
        clearInterval(kbInterval);
        document.getElementById("kinetic-modal").classList.add("hidden");
        renderFinalMedia(); // WE FINALLY SHOW THE IMAGE!
    }
    updateKineticUI();
});

function updateKineticUI() {
    document.getElementById("kinetic-fill").style.width = kbProgress + "%";
    document.getElementById("kinetic-text").innerText = Math.floor(kbProgress) + "%";
}


// ==========================================
// FINAL RENDER & ERASER LOGIC
// ==========================================
async function renderFinalMedia() {
    const data = pendingNasaData;
    currentMediaType = data.media_type;
    const videoEl = document.getElementById("space-video");
    const eraserTools = document.getElementById("eraser-tools");

    document.getElementById("apod-title").innerText = data.title;
    document.getElementById("apod-desc").innerText = data.explanation;

    if (currentMediaType === "video") {
        canvas.style.display = "none";
        eraserTools.style.display = "none";
        videoEl.style.display = "block";
        let safeUrl = data.url.includes("watch?v=") ? data.url.replace("watch?v=", "embed/") : data.url;
        videoEl.src = safeUrl + "?autoplay=1&mute=1";
    } else {
        videoEl.style.display = "none";
        canvas.style.display = "block";
        eraserTools.style.display = "block";
        spaceImage.src = data.url; 
        spaceImage.onload = () => renderPixelated();
    }
}

function renderPixelated() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.backgroundImage = `url(${spaceImage.src})`;
    ctx.globalCompositeOperation = "source-over";
    const scale = 0.02; 
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width * scale;
    tempCanvas.height = canvas.height * scale;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(spaceImage, 0, 0, tempCanvas.width, tempCanvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
}

let isScrubbing = false;
window.addEventListener("mousedown", (e) => {
    if (currentMediaType === "image" && document.getElementById("dashboard").style.display !== "none") {
        isScrubbing = true;
        document.body.classList.add("is-erasing");
        eraseRect(e);
    }
});
window.addEventListener("mouseup", () => { isScrubbing = false; document.body.classList.remove("is-erasing"); });
window.addEventListener("mousemove", (e) => { if (isScrubbing) eraseRect(e); });

function eraseRect(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(x - 40, y - 25, 80, 50);
}


// ==========================================
// ENVIRONMENTAL HAZARD 1: SOLAR FLARE 
// ==========================================
setInterval(() => {
    document.body.classList.add('solar-flare');
    setTimeout(() => { document.body.classList.remove('solar-flare'); }, 10000);
}, 60000); // Triggers every 60 seconds

// ==========================================
// ENVIRONMENTAL HAZARD 2: ZERO-GRAVITY
// ==========================================
let idleTimer;
let zeroGActive = false;
let floatAnimId;
let affectedElements = [];

function resetIdle() {
    if (zeroGActive) {
        zeroGActive = false;
        cancelAnimationFrame(floatAnimId);
        
        // Strip the inline styles to let CSS snap everything back into place
        affectedElements.forEach(el => {
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';
            el.style.margin = '';
            el.style.zIndex = '';
        });
        affectedElements = [];
    }
    
    clearTimeout(idleTimer);
    idleTimer = setTimeout(triggerZeroGravity, 45000); // 45s idle time
}

['mousemove', 'keydown', 'wheel', 'mousedown'].forEach(evt => window.addEventListener(evt, resetIdle));
resetIdle();

function triggerZeroGravity() {
    zeroGActive = true;
    affectedElements = [];
    const elements = document.querySelectorAll('.liquid-panel, .glass-btn, .liquid-pill, #project-brand, .mcq-card');
    const bodies = [];
    
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if(rect.width === 0) return; 
        
        affectedElements.push(el);

        el.style.position = 'fixed';
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        el.style.margin = '0';
        el.style.zIndex = '9998';
        
        bodies.push({
            el: el, x: rect.left, y: rect.top, w: rect.width, h: rect.height,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6
        });
    });

    function float() {
        if (!zeroGActive) return; // Halt loop if gravity restored
        bodies.forEach(b => {
            b.x += b.vx; b.y += b.vy;
            if (b.x <= 0 || b.x + b.w >= window.innerWidth) b.vx *= -1;
            if (b.y <= 0 || b.y + b.h >= window.innerHeight) b.vy *= -1;
            b.el.style.left = b.x + 'px';
            b.el.style.top = b.y + 'px';
        });
        floatAnimId = requestAnimationFrame(float);
    }
    float();
}

/* 
=====================================================
>>> KEEP YOUR MENU NAV, MCQ, AND SOLAR SYSTEM LOGIC 
>>> BELOW THIS LINE AS THEY WERE IN SCRIPT_2.JS
=====================================================
*/
// ==========================================
// 3. COMMAND MENU & MCQ GAME LOGIC
// ==========================================
const menuBtn = document.getElementById("menu-btn");
const dropdown = document.getElementById("dropdown");
const navApod = document.getElementById("nav-apod");
const navMcq = document.getElementById("nav-mcq");
const dashboard = document.getElementById("dashboard");
const mcqGame = document.getElementById("mcq-game");
const mcqOptionsContainer = document.getElementById("mcq-options-container");
const dateEntryBar = document.getElementById("dashboard-date-entry");

let correctMcqAnswer = "";

menuBtn.addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
});

navApod.addEventListener("click", () => {
    mcqGame.style.display = "none";
    dashboard.style.display = "block";
    dropdown.style.display = "none";
    dateEntryBar.style.display = "flex";
});

navMcq.addEventListener("click", () => {
    dashboard.style.display = "none";
    mcqGame.style.display = "flex";
    dropdown.style.display = "none";
    dateEntryBar.style.display = "none";
    loadMcqQuestion();
});

async function loadMcqQuestion() {
    const mcqImage = document.getElementById("mcq-image");
    
    // Hide the image element instead of breaking the src
    mcqImage.style.display = "none"; 
    document.getElementById("mcq-status").innerHTML = "Intercepting random space signals...";
    mcqOptionsContainer.innerHTML = "";

    try {
        const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&count=4`);
        const data = await res.json();
        const imageEntries = data.filter(item => item.media_type === "image");
        
        if (imageEntries.length < 4) {
            loadMcqQuestion(); 
            return;
        }

        const target = imageEntries[0];
        correctMcqAnswer = target.title;

        // Apply the new source and unhide the image
        mcqImage.src = target.url;
        mcqImage.style.display = "block"; 
        
        document.getElementById("mcq-status").innerText = "";

        const options = imageEntries.map(item => item.title);
        options.sort(() => Math.random() - 0.5);

        options.forEach(title => {
            const btn = document.createElement("button");
            btn.className = "glass-btn mcq-btn"; // Updated to match your liquid glass CSS
            btn.innerText = title;
            btn.dataset.realText = title; 

            btn.addEventListener("mouseenter", (e) => {
                e.target.innerText = generateGibberish(e.target.dataset.realText.length);
            });
            btn.addEventListener("mouseleave", (e) => {
                e.target.innerText = e.target.dataset.realText;
            });

            btn.addEventListener("click", () => {
                if (btn.dataset.realText === correctMcqAnswer) {
                    document.getElementById("mcq-status").innerHTML = "<span style='color: black; background: #00ff41; padding: 5px;'>CORRECT. YOU HAVE IDENTIFIED THE ANOMALY.</span>";
                    setTimeout(loadMcqQuestion, 2000); 
                } else {
                    document.getElementById("mcq-status").innerHTML = "<span style='color: white; background: #ff003c; padding: 5px;'>INCORRECT. YOUR HUMAN EYES DECEIVE YOU.</span>";
                }
            });

            mcqOptionsContainer.appendChild(btn);
        });

    } catch (error) {
        document.getElementById("mcq-status").innerText = "Failed to load cosmic data.";
    }
}

function generateGibberish(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+<>?|][{}";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// ==========================================
// 4. PROCEDURAL SOLAR SYSTEM ENGINE
// ==========================================
const sCanvas = document.getElementById("solar-canvas");
const sCtx = sCanvas.getContext("2d");

let sWidth, sHeight;
function resizeSolar() {
    sWidth = sCanvas.width = window.innerWidth;
    sHeight = sCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeSolar);
resizeSolar();

// Generate deep background stars
const stars = Array.from({ length: 140 }, () => ({
    x: Math.random() * sWidth,
    y: Math.random() * sHeight,
    radius: Math.random() * 1.5,
    alpha: Math.random(),
    speed: Math.random() * 0.02 + 0.005
}));

// Planetary orbit tracks
const planets = [
    { distance: 160, size: 4, color: "#00f2fe", speed: 0.008, angle: 0 },
    { distance: 250, size: 7, color: "#9d4edd", speed: 0.005, angle: 2 },
    { distance: 380, size: 11, color: "#4facfe", speed: 0.003, angle: 4, hasRings: true },
    { distance: 520, size: 6, color: "#ffb199", speed: 0.0015, angle: 1 }
];

function drawSolarSystem() {
    sCtx.fillStyle = "#030307";
    sCtx.fillRect(0, 0, sWidth, sHeight);

    // Stars
    stars.forEach(s => {
        s.alpha += s.speed;
        const brightness = Math.abs(Math.sin(s.alpha));
        sCtx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
        sCtx.fillRect(s.x, s.y, s.radius, s.radius);
    });

    const sunX = sWidth * 0.5;
    const sunY = sHeight * 0.5;

    // Glowing Central Star
    const sunGrad = sCtx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 70);
    sunGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
    sunGrad.addColorStop(0.2, "rgba(0, 242, 254, 0.8)");
    sunGrad.addColorStop(0.8, "rgba(112, 0, 255, 0.15)");
    sunGrad.addColorStop(1, "transparent");
    sCtx.fillStyle = sunGrad;
    sCtx.beginPath();
    sCtx.arc(sunX, sunY, 70, 0, Math.PI * 2);
    sCtx.fill();

    // Orbits and planetary bodies
    planets.forEach(p => {
        p.angle += p.speed;

        // Orbital ring path
        sCtx.strokeStyle = "rgba(255, 255, 255, 0.035)";
        sCtx.lineWidth = 1;
        sCtx.beginPath();
        sCtx.arc(sunX, sunY, p.distance, 0, Math.PI * 2);
        sCtx.stroke();

        const px = sunX + Math.cos(p.angle) * p.distance;
        const py = sunY + Math.sin(p.angle) * p.distance;

        // Body glow
        const glow = sCtx.createRadialGradient(px, py, 0, px, py, p.size * 3.5);
        glow.addColorStop(0, p.color);
        glow.addColorStop(1, "transparent");
        sCtx.fillStyle = glow;
        sCtx.beginPath();
        sCtx.arc(px, py, p.size * 3.5, 0, Math.PI * 2);
        sCtx.fill();

        // Planet
        sCtx.fillStyle = "#ffffff";
        sCtx.beginPath();
        sCtx.arc(px, py, p.size, 0, Math.PI * 2);
        sCtx.fill();

        // Planetary rings
        if (p.hasRings) {
            sCtx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            sCtx.lineWidth = 2;
            sCtx.beginPath();
            sCtx.ellipse(px, py, p.size * 2.2, p.size * 0.7, Math.PI / 4, 0, Math.PI * 2);
            sCtx.stroke();
        }
    });

    requestAnimationFrame(drawSolarSystem);
}

drawSolarSystem();