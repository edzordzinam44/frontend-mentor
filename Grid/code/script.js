/* =========================================================
   Fabulous Hope — Portfolio interactions
   ========================================================= */

// ---- Footer year ----
document.querySelectorAll('.footer-year').forEach(el => {
  el.textContent = `· ${new Date().getFullYear()}`;
});

// ---- Mobile nav toggle ----
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

/* =========================================================
   GUESTBOOK SIGNATURE PAD
   Signatures are saved to this browser's localStorage, so the
   wall persists for you on this device/browser across visits.
   They are NOT shared across different visitors' devices —
   that requires a backend (see note at bottom of this file).
   ========================================================= */

const STORAGE_KEY = 'fh_guestbook_signatures_v1';

const canvas = document.getElementById('sigCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let drawing = false;
let hasDrawn = false;

function resizeCanvasForDPR() {
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0c1f17';
}

function getPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const point = evt.touches ? evt.touches[0] : evt;
  return {
    x: point.clientX - rect.left,
    y: point.clientY - rect.top
  };
}

function startDraw(evt) {
  if (!ctx) return;
  drawing = true;
  hasDrawn = true;
  const { x, y } = getPos(evt);
  ctx.beginPath();
  ctx.moveTo(x, y);
  evt.preventDefault();
}

function moveDraw(evt) {
  if (!drawing || !ctx) return;
  const { x, y } = getPos(evt);
  ctx.lineTo(x, y);
  ctx.stroke();
  evt.preventDefault();
}

function endDraw() {
  drawing = false;
}

if (canvas) {
  window.addEventListener('resize', () => {
    const data = hasDrawn ? canvas.toDataURL() : null;
    resizeCanvasForDPR();
    if (data) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
      img.src = data;
    }
  });
  resizeCanvasForDPR();

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', moveDraw, { passive: false });
  canvas.addEventListener('touchend', endDraw);
}

document.getElementById('clearSig')?.addEventListener('click', () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
});

function loadSignatures() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSignatures(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderWall() {
  const wallGrid = document.getElementById('wallGrid');
  const wallCount = document.getElementById('wallCount');
  const wallEmpty = document.getElementById('wallEmpty');
  const list = loadSignatures();

  wallCount.textContent = `${list.length} signature${list.length === 1 ? '' : 's'}`;

  if (list.length === 0) {
    wallGrid.innerHTML = '';
    wallGrid.appendChild(wallEmpty);
    return;
  }

  wallGrid.innerHTML = list
    .slice()
    .reverse()
    .map(entry => `
      <div class="wall-entry">
        <img src="${entry.signature}" alt="${entry.name}'s signature" width="90" height="40">
        <div>
          <p class="wall-entry-name">${escapeHTML(entry.name)}</p>
          <p class="wall-entry-msg">${escapeHTML(entry.message)}</p>
          <p class="wall-entry-time">${entry.date}</p>
        </div>
      </div>
    `)
    .join('');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('signForm')?.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!hasDrawn) {
    alert('Please draw your signature before saving.');
    return;
  }

  const name = document.getElementById('signerName').value.trim();
  const message = document.getElementById('signerMsg').value.trim();
  const signature = canvas.toDataURL('image/png');

  const list = loadSignatures();
  list.push({
    name,
    message,
    signature,
    date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  });
  saveSignatures(list);

  renderWall();

  document.getElementById('signForm').reset();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
});

renderWall();

/* =========================================================
   NOTE ON SHARED PERSISTENCE
   This guestbook uses localStorage, which keeps signatures
   saved on the visitor's own browser/device only — it will
   not show signatures from other people's computers.
   To make the wall genuinely shared across every visitor,
   connect this form to a small backend or service such as
   Firebase Firestore, Supabase, or a simple serverless
   function, and replace loadSignatures()/saveSignatures()
   with calls to that service instead of localStorage.
   ========================================================= */
