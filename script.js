/* ============================================================
   AdaOr Blog Post — Interactive Elements
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
  initSurface();
  initExampleSliders();
});

/* -----------------------------------------------------------
   VISUAL 1: Hero Video Slider with real videos
   ----------------------------------------------------------- */

function initHeroSlider() {
  const slider = document.getElementById('heroSlider');
  const fill = document.getElementById('heroSliderFill');
  const badge = document.getElementById('heroAlphaBadge');
  const valueDisplay = document.getElementById('heroSliderValue');
  const container = document.getElementById('heroVideoDisplay');

  if (!slider || !container) return;

  const alphas = [
    '0.000','0.032','0.065','0.097','0.129','0.161','0.194','0.226',
    '0.258','0.290','0.323','0.355','0.387','0.419','0.452','0.484',
    '0.516','0.548','0.581','0.613','0.645','0.677','0.710','0.742',
    '0.774','0.806','0.839','0.871','0.903','0.935','0.968','1.000'
  ];

  const videos = {};
  let currentIdx = 0;

  alphas.forEach((a, i) => {
    const video = document.createElement('video');
    video.src = `bunny/${a}.mp4`;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = i < 3 ? 'auto' : 'metadata';
    video.className = 'hero-video-layer';
    if (i === 0) {
      video.classList.add('active');
      video.play().catch(() => {});
    }
    container.insertBefore(video, container.firstChild);
    videos[i] = video;
  });

  function findClosestIdx(val) {
    const target = val / 100;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < alphas.length; i++) {
      const dist = Math.abs(parseFloat(alphas[i]) - target);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function switchToVideo(newIdx) {
    if (newIdx === currentIdx) return;

    const oldVideo = videos[currentIdx];
    const newVideo = videos[newIdx];

    newVideo.preload = 'auto';
    newVideo.currentTime = oldVideo.currentTime;
    newVideo.play().catch(() => {});
    newVideo.classList.add('active');
    oldVideo.classList.remove('active');
    oldVideo.pause();

    const preloadRange = 2;
    for (let i = Math.max(0, newIdx - preloadRange); i <= Math.min(alphas.length - 1, newIdx + preloadRange); i++) {
      if (videos[i].preload !== 'auto') {
        videos[i].preload = 'auto';
      }
    }

    currentIdx = newIdx;
  }

  slider.addEventListener('input', () => {
    const val = slider.value;
    const alpha = val / 100;
    fill.style.width = val + '%';
    badge.textContent = `α = ${alpha.toFixed(2)}`;
    valueDisplay.textContent = Math.round(val) + '%';

    const idx = findClosestIdx(val);
    switchToVideo(idx);
  });

  container.addEventListener('click', () => {
    const v = videos[currentIdx];
    if (v.paused) v.play().catch(() => {});
  });
}

/* -----------------------------------------------------------
   VISUAL 2: 2D Interactive Surface (CFG × AdaOr)
   ----------------------------------------------------------- */

function initSurface() {
  const grid = document.getElementById('surfaceGrid');
  const canvas = document.getElementById('surfaceCanvas');
  const knob = document.getElementById('surfaceKnob');
  const readoutAlpha = document.getElementById('readoutAlpha');
  const readoutCFG = document.getElementById('readoutCFG');

  if (!grid || !canvas || !knob) return;

  const ctx = canvas.getContext('2d');
  let isDragging = false;
  let knobX = 0;
  let knobY = 0;

  function resizeCanvas() {
    const rect = grid.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    drawSurface();
  }

  function drawSurface() {
    const w = grid.clientWidth;
    const h = grid.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const cellsX = 7;
    const cellsY = 7;
    const cellW = w / cellsX;
    const cellH = h / cellsY;
    const pad = 2;
    const radius = 3;

    for (let iy = 0; iy < cellsY; iy++) {
      for (let ix = 0; ix < cellsX; ix++) {
        const alpha = ix / (cellsX - 1);
        const cfg = 1 - iy / (cellsY - 1);

        const x = ix * cellW + pad;
        const y = iy * cellH + pad;
        const cw = cellW - pad * 2;
        const ch = cellH - pad * 2;

        const editAmount = alpha * cfg;

        const chaos = cfg < 0.35 && alpha < 0.5
          ? (1 - cfg / 0.35) * (1 - alpha / 0.5) * 0.6 : 0;

        let r, g, b;

        if (chaos > 0.1) {
          const t = chaos;
          r = Math.round(240 - t * 30);
          g = Math.round(230 - t * 60);
          b = Math.round(225 - t * 80);
          r = Math.round(r + t * 40);
          g = Math.round(g - t * 30);
          b = Math.round(b - t * 20);
        } else {
          const t = editAmount;
          r = Math.round(235 - t * 180);
          g = Math.round(235 - t * 165);
          b = Math.round(232 + t * 20);
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        roundRect(ctx, x, y, cw, ch, radius);
        ctx.fill();

        if (chaos > 0.2) {
          ctx.fillStyle = `rgba(220, 80, 60, ${chaos * 0.15})`;
          roundRect(ctx, x, y, cw, ch, radius);
          ctx.fill();
        }
      }
    }

    drawKnobCrosshair(ctx, w, h);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawKnobCrosshair(ctx, w, h) {
    const px = knobX * w;
    const py = (1 - knobY) * h;

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(61, 76, 245, 0.35)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();

    ctx.restore();
  }

  function updateKnobPosition(clientX, clientY) {
    const rect = grid.getBoundingClientRect();
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;

    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    knobX = x;
    knobY = 1 - y;

    knob.style.left = (x * 100) + '%';
    knob.style.top = (y * 100) + '%';

    readoutAlpha.textContent = knobX.toFixed(2);
    readoutCFG.textContent = (knobY * 7 + 1).toFixed(1);

    drawSurface();
  }

  knob.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
  });

  grid.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateKnobPosition(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateKnobPosition(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  knob.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true;
  }, { passive: false });

  grid.addEventListener('touchstart', (e) => {
    isDragging = true;
    const t = e.touches[0];
    updateKnobPosition(t.clientX, t.clientY);
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const t = e.touches[0];
    updateKnobPosition(t.clientX, t.clientY);
  }, { passive: false });

  document.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

/* -----------------------------------------------------------
   VISUAL 3: Multiple Example Sliders
   ----------------------------------------------------------- */

function initExampleSliders() {
  const cards = document.querySelectorAll('.example-card');

  cards.forEach(card => {
    const slider = card.querySelector('.example-slider');
    const fill = card.querySelector('.example-slider-fill');
    const alphaVal = card.querySelector('.ex-alpha-val');
    const videoFrame = card.querySelector('.example-video-frame');

    if (!slider) return;

    slider.addEventListener('input', () => {
      const val = slider.value / 100;
      fill.style.width = slider.value + '%';
      alphaVal.textContent = val.toFixed(2);

      const hue = 45 - val * 30;
      const sat = 6 + val * 18;
      const light = 92 - val * 14;
      videoFrame.querySelector('.placeholder-video').style.background =
        `linear-gradient(135deg, hsl(${hue}, ${sat}%, ${light}%), hsl(${hue - 15}, ${sat + 5}%, ${light - 3}%))`;
    });
  });
}
