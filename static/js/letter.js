"use strict";

// 刮刮樂手感參數：可調整筆刷大小與自動揭曉門檻。
const SCRATCH_CONFIG = {
  brushRadius: 26,
  revealThreshold: 0.5,
  sampleStep: 10,          // 計算刮開比例時每隔幾個像素取樣一次
  checkEveryMoves: 6,      // 每移動幾次檢查一次是否刮夠
};

const cards = [...document.querySelectorAll("[data-scratch-card]")];
const progressDots = [...document.querySelectorAll("[data-progress]")];
let completed = 0;

// ---------- 小工具 ----------
const ctxOf = canvas => canvas.getContext("2d", {willReadFrequently: true});

function celebrate(amount = 26) {
  const layer = document.querySelector("#letterConfetti");
  const colors = ["#ff719b", "#ffd968", "#83d9c5", "#9b83e6", "#ffa8c2"];
  for (let i = 0; i < amount; i += 1) {
    const piece = document.createElement("span");
    piece.textContent = ["♥", "★", "●", "✦", "♡"][i % 5];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.color = colors[i % colors.length];
    piece.style.setProperty("--size", `${0.8 + Math.random() * 0.9}rem`);
    piece.style.setProperty("--duration", `${1.8 + Math.random() * 1.6}s`);
    piece.style.setProperty("--drift", `${(Math.random() - .5) * 260}px`);
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 3600);
  }
}

// ---------- 信封 ----------
const envelope = document.querySelector("#envelope");
envelope.addEventListener("click", () => {
  if (envelope.classList.contains("open")) {
    document.querySelector("#letter").scrollIntoView({behavior: "smooth"});
    return;
  }
  envelope.classList.add("open");
  envelope.setAttribute("aria-label", "閱讀信件");
  // 拆開信封後，下面的信與刮刮樂才出現；出現後卡片才有尺寸，可以畫上塗層
  document.body.classList.add("unsealed");
  cards.forEach(paintCover);
  document.querySelector("#envelopeHint").classList.add("gone");
  celebrate(18);
  setTimeout(() => document.querySelector("#letter").scrollIntoView({behavior: "smooth"}), 1150);
});

// ---------- 段落逐段浮現 ----------
const revealTargets = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {threshold: 0.25, rootMargin: "0px 0px -8% 0px"});
  revealTargets.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i, 3) * 90}ms`;
    observer.observe(el);
  });
} else {
  revealTargets.forEach(el => el.classList.add("is-visible"));
}

// ---------- 刮刮樂 ----------
function drawCover(ctx, width, height, index) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#ffdf7a");
  gradient.addColorStop(.5, "#f6b267");
  gradient.addColorStop(1, "#ef86a8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  // 閃亮小點點
  ctx.fillStyle = "rgba(255,255,255,.35)";
  for (let y = 18; y < height; y += 28) {
    for (let x = (Math.round(y / 28) % 2) * 15; x < width; x += 30) {
      ctx.beginPath(); ctx.arc(x, y, 2.1, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 中央標籤
  const cx = width / 2, cy = height / 2;
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 78, cy - 34, 156, 68, 34) : ctx.rect(cx - 78, cy - 34, 156, 68); ctx.fill();
  ctx.fillStyle = "#b8466c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '900 11px "Noto Sans TC", sans-serif';
  ctx.fillText(`CLUE 0${index + 1}`, cx, cy - 11);
  ctx.font = '700 15px "Noto Sans TC", sans-serif';
  ctx.fillText("✦ 刮開看看 ✦", cx, cy + 11);
}

// 依卡片目前尺寸重畫塗層；如果之前刮過，會保留已刮開的部分。
function paintCover(card) {
  if (card.classList.contains("revealed")) return;
  const canvas = card.querySelector("canvas");
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);

  let previous = null;
  if (canvas.width && canvas.height && card.classList.contains("cover-ready")) {
    previous = document.createElement("canvas");
    previous.width = canvas.width; previous.height = canvas.height;
    previous.getContext("2d").drawImage(canvas, 0, 0);
  }

  canvas.width = width; canvas.height = height;
  const ctx = ctxOf(canvas);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawCover(ctx, rect.width, rect.height, Number(card.dataset.index));
  if (previous) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(previous, 0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  }
  card.dataset.coverWidth = String(width);
  card.classList.add("cover-ready");
}

// 從上一點畫一條粗線到這一點，滑很快也不會斷斷續續。
function scratchLine(canvas, from, to) {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const ctx = ctxOf(canvas);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = SCRATCH_CONFIG.brushRadius * 2 * scale;
  ctx.beginPath();
  ctx.moveTo((from.x - rect.left) * scale, (from.y - rect.top) * scale);
  ctx.lineTo((to.x - rect.left) * scale + 0.01, (to.y - rect.top) * scale);
  ctx.stroke();
  ctx.restore();
}

function scratchedRatio(canvas) {
  const ctx = ctxOf(canvas);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const step = SCRATCH_CONFIG.sampleStep * 4;
  let transparent = 0, sampled = 0;
  for (let i = 3; i < pixels.length; i += step) {
    sampled += 1;
    if (pixels[i] < 40) transparent += 1;
  }
  return sampled ? transparent / sampled : 0;
}

function updateProgressUI() {
  progressDots.forEach((dot, i) => {
    dot.classList.toggle("done", i < completed);
    dot.classList.toggle("active", i === completed);
  });
  document.querySelector("#progressText").textContent = `${completed} / ${cards.length}`;
}

function reveal(card) {
  if (card.classList.contains("revealed") || card.classList.contains("locked")) return;
  const index = Number(card.dataset.index);
  card.classList.add("revealed");
  completed = Math.max(completed, index + 1);
  const next = cards[index + 1];
  if (next) {
    next.classList.remove("locked");
    next.classList.add("unlocking");
    setTimeout(() => next.classList.remove("unlocking"), 600);
  }
  updateProgressUI();
  celebrate();
  if (navigator.vibrate) navigator.vibrate(30);
  if (completed === cards.length) {
    const finale = document.querySelector("#finale");
    finale.classList.add("show");
    setTimeout(() => {
      finale.scrollIntoView({behavior: "smooth", block: "center"});
      celebrate(40);
    }, 650);
  }
}

cards.forEach(card => {
  const canvas = card.querySelector("canvas");
  let last = null, moves = 0;

  const checkReveal = () => {
    if (scratchedRatio(canvas) >= SCRATCH_CONFIG.revealThreshold) reveal(card);
  };

  canvas.addEventListener("pointerdown", event => {
    if (card.classList.contains("locked") || card.classList.contains("revealed")) return;
    event.preventDefault();
    try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* 某些瀏覽器不支援 */ }
    last = {x: event.clientX, y: event.clientY};
    scratchLine(canvas, last, last);
  });
  canvas.addEventListener("pointermove", event => {
    if (!last) return;
    // 使用合併事件可以讓觸控筆劃更平滑
    const points = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    (points.length ? points : [event]).forEach(point => {
      const next = {x: point.clientX, y: point.clientY};
      scratchLine(canvas, last, next);
      last = next;
    });
    moves += 1;
    if (moves % SCRATCH_CONFIG.checkEveryMoves === 0) checkReveal();
  });
  const finish = () => {
    if (!last) return;
    last = null;
    checkReveal();
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
  card.querySelector(".scratch-fallback").addEventListener("click", () => reveal(card));
});

// 每次打開都是全新封好的刮刮樂（不記住進度）
updateProgressUI();

// 等字型載入後再畫一次，避免塗層上的字用到備用字型
if (document.fonts?.ready) document.fonts.ready.then(() => cards.forEach(paintCover));

// 手機捲動時網址列伸縮也會觸發 resize，只在寬度真的改變時才重畫。
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cards.forEach(card => {
      const width = Math.round(card.querySelector("canvas").getBoundingClientRect().width * dpr);
      if (Math.abs(width - Number(card.dataset.coverWidth || 0)) > 2) paintCover(card);
    });
  }, 180);
});
