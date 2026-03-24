/**
 * risk.js — OceanGuard Risk Analyzer
 * Handles: image upload, text input, geolocation,
 *          Nominatim location search, Leaflet map,
 *          risk score simulation, animated output.
 *
 * ─────────────────────────────────────────────────────────────
 * TODO: Replace the simulateAnalysis() dummy JSON response with
 *       a real REST API call to your backend, e.g.:
 *
 *       const formData = new FormData();
 *       formData.append('image', imageFile);
 *       formData.append('description', descriptionText);
 *       formData.append('lat', selectedLocation.lat);
 *       formData.append('lng', selectedLocation.lng);
 *
 *       const res  = await fetch('https://your-api.com/api/analyze', {
 *           method: 'POST',
 *           body: formData,
 *       });
 *       const data = await res.json();
 *       // Expected shape: { "risk_score": 78 }
 *
 *       Your backend should:
 *         1. Store the uploaded image via Cloudinary SDK
 *         2. Pass image URL + text description to your custom AI model
 *         3. Save the result document in MongoDB
 *         4. Return { "risk_score": <number 0–100> }
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════ */
const RISK_LEVELS = {
    low:      { label: 'Low',      min: 0,  max: 30,  color: '#16a34a', radius: 2000  },
    moderate: { label: 'Moderate', min: 31, max: 60,  color: '#ca8a04', radius: 5000  },
    high:     { label: 'High',     min: 61, max: 80,  color: '#ea580c', radius: 10000 },
    critical: { label: 'Critical', min: 81, max: 100, color: '#dc2626', radius: 20000 },
};

const INTERPRETATIONS = {
    low:      'Coastal conditions appear stable. Minor wave activity detected. Routine monitoring advised. No immediate evacuation threat.',
    moderate: 'Elevated wave height and moderate flood risk observed. Residents in low-lying coastal zones should remain alert and prepare contingency plans.',
    high:     'Significant coastal threat identified. Wave surges and flood indicators are serious. Authorities should consider preemptive action and public advisories.',
    critical: 'EXTREME RISK. Catastrophic coastal disaster indicators detected. Immediate evacuation of the impact zone is strongly advised. Emergency services should be deployed.',
};

const NOMINATIM_URL      = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_DELAY_MS = 400;

/* ═══════════════════════════════════════════
   DOM REFERENCES
═══════════════════════════════════════════ */
const uploadZone        = document.getElementById('uploadZone');
const imageInput        = document.getElementById('imageInput');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreview      = document.getElementById('imagePreview');
const removeImgBtn      = document.getElementById('removeImg');

const descInput         = document.getElementById('descInput');
const charCount         = document.getElementById('charCount');

const geoBtn            = document.getElementById('geoBtn');
const geoBtnText        = document.getElementById('geoBtnText');

const locationSearch    = document.getElementById('locationSearch');
const suggestionsBox    = document.getElementById('suggestionsBox');
const locationChip      = document.getElementById('locationChip');
const chipText          = document.getElementById('chipText');
const chipClear         = document.getElementById('chipClear');

const analyzeBtn        = document.getElementById('analyzeBtn');
const btnSpinner        = document.getElementById('btnSpinner');
const btnArrow          = analyzeBtn.querySelector('.btn-arrow');
const btnTxt            = analyzeBtn.querySelector('.btn-text');

const mapBadge          = document.getElementById('mapBadge');

const outputIdle        = document.getElementById('outputIdle');
const outputResult      = document.getElementById('outputResult');

const ringFill          = document.getElementById('ringFill');
const scoreNumber       = document.getElementById('scoreNumber');
const riskBadge         = document.getElementById('riskBadge');
const progressFill      = document.getElementById('progressFill');
const progressPct       = document.getElementById('progressPct');
const interpretationText = document.getElementById('interpretationText');
const zoneText          = document.getElementById('zoneText');
const resetBtn          = document.getElementById('resetBtn');

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let imageFile        = null;
let selectedLocation = null;   // { lat, lng, label }
let nominatimTimer   = null;
let leafletMap       = null;
let mapMarker        = null;
let impactCircle     = null;

/* ═══════════════════════════════════════════
   MAP INIT  — light tile theme matching home
═══════════════════════════════════════════ */
function initMap() {
    leafletMap = L.map('map', {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
    });

    /* Carto Positron — clean light tiles matching the page palette */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(leafletMap);
}

/* ═══════════════════════════════════════════
   MAP: Place marker + impact circle
═══════════════════════════════════════════ */
function placeMapMarker(lat, lng, riskLevel) {
    const level  = RISK_LEVELS[riskLevel];
    const color  = level ? level.color  : '#1a56ff';
    const radius = level ? level.radius : 5000;

    if (mapMarker)    { leafletMap.removeLayer(mapMarker); }
    if (impactCircle) { leafletMap.removeLayer(impactCircle); }

    /* Pulsing marker icon — uses home primary blue for the border */
    const icon = L.divIcon({
        className: '',
        html: `
            <div style="
                width:16px; height:16px;
                background:${color};
                border:3px solid #fff;
                border-radius:50%;
                box-shadow: 0 0 0 0 ${color};
                animation: mkPulse 1.8s ease-out infinite;
            "></div>
            <style>
                @keyframes mkPulse {
                    0%  { box-shadow: 0 0 0 0 ${color}88; }
                    70% { box-shadow: 0 0 0 12px transparent; }
                    100%{ box-shadow: 0 0 0 0 transparent; }
                }
            </style>`,
        iconSize:   [16, 16],
        iconAnchor: [8, 8],
    });

    mapMarker = L.marker([lat, lng], { icon }).addTo(leafletMap);
    mapMarker.bindPopup(
        `<strong style="color:#080f1e">${selectedLocation.label}</strong><br/>
         Risk: <span style="color:${color}; font-weight:600">${level ? level.label : '—'}</span><br/>
         Radius: <span style="color:#5a6680">${(radius / 1000).toFixed(0)} km</span>`,
        { maxWidth: 220 }
    ).openPopup();

    impactCircle = L.circle([lat, lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.1,
        weight: 2,
        dashArray: riskLevel === 'critical' ? '6 4' : null,
    }).addTo(leafletMap);

    leafletMap.fitBounds(impactCircle.getBounds(), { padding: [30, 30] });

    /* Update badge */
    mapBadge.textContent   = `${level ? level.label : ''} · ${(radius / 1000).toFixed(0)} km radius`;
    mapBadge.style.color   = color;
    mapBadge.style.background = `${color}12`;
    mapBadge.style.borderColor = `${color}44`;
}

/* ═══════════════════════════════════════════
   GEOLOCATION
═══════════════════════════════════════════ */
geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    geoBtn.disabled        = true;
    geoBtnText.textContent = 'Detecting location…';

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            try {
                const res  = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await res.json();
                if (data && data.display_name) {
                    label = data.display_name.split(',').slice(0, 3).join(', ');
                }
            } catch (_) { /* keep coordinate label */ }

            setLocation({ lat, lng, label });
            geoBtn.disabled        = false;
            geoBtnText.textContent = 'Use My Current Location';
        },
        (err) => {
            console.warn('Geolocation error:', err.message);
            alert('Unable to retrieve your location. Please search manually.');
            geoBtn.disabled        = false;
            geoBtnText.textContent = 'Use My Current Location';
        },
        { timeout: 10000 }
    );
});

/* ═══════════════════════════════════════════
   NOMINATIM SEARCH (debounced)
═══════════════════════════════════════════ */
locationSearch.addEventListener('input', () => {
    const q = locationSearch.value.trim();
    clearTimeout(nominatimTimer);
    if (q.length < 3) { hideSuggestions(); return; }
    nominatimTimer = setTimeout(() => fetchSuggestions(q), NOMINATIM_DELAY_MS);
});

async function fetchSuggestions(query) {
    try {
        const params = new URLSearchParams({ q: query, format: 'json', limit: 6, addressdetails: 1 });
        const res    = await fetch(`${NOMINATIM_URL}?${params}`, { headers: { 'Accept-Language': 'en' } });
        renderSuggestions(await res.json());
    } catch (err) {
        console.error('Nominatim error:', err);
        hideSuggestions();
    }
}

function renderSuggestions(results) {
    suggestionsBox.innerHTML = '';

    if (!results.length) {
        suggestionsBox.innerHTML = '<div class="suggestion-item" style="cursor:default;color:#8a96b0">No results found.</div>';
        suggestionsBox.classList.remove('hidden');
        return;
    }

    results.forEach((place) => {
        const item       = document.createElement('div');
        item.className   = 'suggestion-item';
        const label      = place.display_name;
        const shortLabel = label.split(',').slice(0, 3).join(', ');
        item.innerHTML   = `<span class="sug-icon">📍</span>${shortLabel}`;
        item.title       = label;

        item.addEventListener('click', () => {
            setLocation({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), label: shortLabel });
            locationSearch.value = '';
            hideSuggestions();
        });

        suggestionsBox.appendChild(item);
    });

    suggestionsBox.classList.remove('hidden');
}

function hideSuggestions() {
    suggestionsBox.classList.add('hidden');
    suggestionsBox.innerHTML = '';
}

document.addEventListener('click', (e) => {
    if (!locationSearch.contains(e.target) && !suggestionsBox.contains(e.target)) {
        hideSuggestions();
    }
});

/* ═══════════════════════════════════════════
   LOCATION STATE
═══════════════════════════════════════════ */
function setLocation({ lat, lng, label }) {
    selectedLocation   = { lat, lng, label };
    chipText.textContent = label;
    locationChip.classList.remove('hidden');

    if (leafletMap) {
        if (mapMarker)    { leafletMap.removeLayer(mapMarker); }
        if (impactCircle) { leafletMap.removeLayer(impactCircle); }

        const tempIcon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;background:#1a56ff;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(26,86,255,0.4)"></div>`,
            iconSize:   [14, 14],
            iconAnchor: [7, 7],
        });

        mapMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(leafletMap);
        mapMarker.bindPopup(`<strong>${label}</strong><br/><span style="color:#5a6680">Run analysis to get risk score</span>`).openPopup();
        leafletMap.setView([lat, lng], 10, { animate: true });

        mapBadge.textContent      = 'Location set — run analysis';
        mapBadge.style.color      = '';
        mapBadge.style.background = '';
        mapBadge.style.borderColor = '';
    }

    updateAnalyzeBtn();
}

function clearLocation() {
    selectedLocation = null;
    chipText.textContent = '—';
    locationChip.classList.add('hidden');
    locationSearch.value = '';
    hideSuggestions();

    if (mapMarker)    { leafletMap.removeLayer(mapMarker);    mapMarker    = null; }
    if (impactCircle) { leafletMap.removeLayer(impactCircle); impactCircle = null; }

    mapBadge.textContent       = 'Awaiting Location';
    mapBadge.style.color       = '';
    mapBadge.style.background  = '';
    mapBadge.style.borderColor = '';

    updateAnalyzeBtn();
}

chipClear.addEventListener('click', clearLocation);

/* ═══════════════════════════════════════════
   IMAGE UPLOAD
═══════════════════════════════════════════ */
uploadZone.addEventListener('click', (e) => {
    if (e.target === removeImgBtn) return;
    imageInput.click();
});

uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', ()  => uploadZone.classList.remove('drag-over'));

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
});

imageInput.addEventListener('change', () => {
    if (imageInput.files[0]) handleImageFile(imageInput.files[0]);
});

removeImgBtn.addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });

function handleImageFile(file) {
    if (!file.type.startsWith('image/')) { alert('Please upload a valid image file (JPG, PNG, etc.).'); return; }
    if (file.size > 10 * 1024 * 1024)   { alert('Image must be smaller than 10 MB.'); return; }

    imageFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
        imagePreview.src = ev.target.result;
        uploadPlaceholder.classList.add('hidden');
        imagePreview.classList.remove('hidden');
        removeImgBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    updateAnalyzeBtn();
}

function clearImage() {
    imageFile = null;
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    removeImgBtn.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    imageInput.value = '';
    updateAnalyzeBtn();
}

/* ═══════════════════════════════════════════
   TEXT INPUT
═══════════════════════════════════════════ */
const MAX_CHARS = 600;

descInput.addEventListener('input', () => {
    if (descInput.value.length > MAX_CHARS) descInput.value = descInput.value.slice(0, MAX_CHARS);
    charCount.textContent = `${descInput.value.length} / ${MAX_CHARS}`;
    updateAnalyzeBtn();
});

/* ═══════════════════════════════════════════
   ENABLE / DISABLE ANALYZE BUTTON
   Requires: location AND (image OR text ≥ 10 chars)
═══════════════════════════════════════════ */
function updateAnalyzeBtn() {
    const hasLocation = !!selectedLocation;
    const hasImage    = !!imageFile;
    const hasText     = descInput.value.trim().length >= 10;
    analyzeBtn.disabled = !(hasLocation && (hasImage || hasText));
}

/* ═══════════════════════════════════════════
   RISK LEVEL HELPER
═══════════════════════════════════════════ */
function getRiskLevel(score) {
    if (score <= 30) return 'low';
    if (score <= 60) return 'moderate';
    if (score <= 80) return 'high';
    return 'critical';
}

/* ═══════════════════════════════════════════
   DUMMY API SIMULATION
   ─────────────────────────────────────────
   TODO: Replace this function body with a real
         fetch() call to your backend API.
         See the top-of-file comment for the full
         implementation guide.
   ─────────────────────────────────────────
═══════════════════════════════════════════ */
async function analyzeWithBackend() {

    const formData = new FormData();

    if (imageFile) {
        formData.append('image', imageFile);
    }

    formData.append('description', descInput.value.trim());
    formData.append('lat', selectedLocation.lat);
    formData.append('lng', selectedLocation.lng);
    formData.append('label', selectedLocation.label);

    const response = await fetch('http://localhost:5000/api/risks', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('API Error');
    }

    return await response.json();
}

/* ═══════════════════════════════════════════
   ANIMATED SCORE COUNTER
═══════════════════════════════════════════ */
function animateCounter(target, duration = 1200) {
    const start = performance.now();
    const step  = (now) => {
        const elapsed = Math.min(now - start, duration);
        const ease    = 1 - Math.pow(1 - elapsed / duration, 3);
        scoreNumber.textContent = Math.round(ease * target);
        if (elapsed < duration) requestAnimationFrame(step);
        else scoreNumber.textContent = target;
    };
    requestAnimationFrame(step);
}

/* ═══════════════════════════════════════════
   RENDER RESULT
═══════════════════════════════════════════ */
function renderResult(score) {
    const level = getRiskLevel(score);
    const info  = RISK_LEVELS[level];
    const color = info.color;

    outputIdle.classList.add('hidden');
    outputResult.classList.remove('hidden');

    /* Ring */
    const circumference = 2 * Math.PI * 66; // 414.69
    ringFill.style.stroke = color;
    ringFill.style.strokeDashoffset = circumference - (score / 100) * circumference;
    ringFill.classList.toggle('critical-anim', level === 'critical');

    /* Counter */
    scoreNumber.style.color = color;
    animateCounter(score);

    /* Badge */
    riskBadge.textContent = info.label;
    riskBadge.className   = `risk-badge ${level}`;

    /* Progress bar */
    progressFill.style.background = color;
    requestAnimationFrame(() => { progressFill.style.width = `${score}%`; });
    progressPct.textContent = `${score}%`;

    /* Interpretation */
    interpretationText.textContent = INTERPRETATIONS[level];

    /* Zone */
    zoneText.textContent  = `${info.label} zone · ${(info.radius / 1000).toFixed(0)} km impact radius`;
    zoneText.style.color  = color;

    /* Map */
    if (selectedLocation) {
        placeMapMarker(selectedLocation.lat, selectedLocation.lng, level);
    }
}

/* ═══════════════════════════════════════════
   ANALYZE BUTTON
═══════════════════════════════════════════ */
analyzeBtn.addEventListener('click', async () => {
    if (analyzeBtn.disabled) return;

    analyzeBtn.disabled    = true;
    btnTxt.textContent     = 'Analyzing…';
    btnSpinner.classList.remove('hidden');
    btnArrow.classList.add('hidden');

    try {
        const result = await analyzeWithBackend();
        renderResult(Math.max(0, Math.min(100, Math.round(result.risk_score))));
    } catch (err) {
        console.error('Analysis error:', err);
        alert('Analysis failed. Please try again.');
        analyzeBtn.disabled = false;
    } finally {
        btnTxt.textContent = 'Analyze Risk';
        btnSpinner.classList.add('hidden');
        btnArrow.classList.remove('hidden');
    }
});

/* ═══════════════════════════════════════════
   RESET
═══════════════════════════════════════════ */
resetBtn.addEventListener('click', () => {
    clearImage();
    descInput.value       = '';
    charCount.textContent = '0 / 600';
    clearLocation();

    outputResult.classList.add('hidden');
    outputIdle.classList.remove('hidden');

    ringFill.style.strokeDashoffset = '414.69';
    ringFill.style.stroke           = '#1a56ff';
    ringFill.classList.remove('critical-anim');
    scoreNumber.textContent = '0';
    scoreNumber.style.color = '';
    progressFill.style.width = '0%';

    leafletMap.setView([20, 0], 2, { animate: true });
    mapBadge.textContent       = 'Awaiting Location';
    mapBadge.style.color       = '';
    mapBadge.style.background  = '';
    mapBadge.style.borderColor = '';

    updateAnalyzeBtn();
});

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
(function init() {
    initMap();
    updateAnalyzeBtn();
})();