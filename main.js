gsap.registerPlugin(ScrollTrigger);

/* ---------------- Scene crossfade (4 scenes) ---------------- */
const scenes = gsap.utils.toArray(".scene");
const spacers = gsap.utils.toArray(".spacer");

let current = 0;
function activateScene(next){
  if(next === current) return;

  const prev = scenes[current];
  const nxt = scenes[next];

  gsap.to(prev, { opacity: 0, duration: 0.25, ease: "power2.out" });
  gsap.set(nxt, { opacity: 0 });
  nxt.classList.add("is-active");
  gsap.to(nxt, { opacity: 1, duration: 0.35, ease: "power2.out" });

  setTimeout(() => prev.classList.remove("is-active"), 400);
  current = next;
}

scenes.forEach((s,i)=> s.classList.toggle("is-active", i===0));
gsap.set(scenes[0], { opacity: 1 });

spacers.forEach((sp, idx) => {
  ScrollTrigger.create({
    trigger: sp,
    start: "top center",
    end: "bottom center",
    onEnter: () => activateScene(idx),
    onEnterBack: () => activateScene(idx),
  });
});

/* ---------------- Confetti canvas ---------------- */
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
  canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const confettiColors = ["#ff5a5f","#ffd166","#06d6a0","#4dabf7","#b197fc","#f783ac","#ffa94d","#63e6be"];
let confetti = [];

function spawnConfettiBurst(count = 24){
  const w = window.innerWidth;
  for(let i=0;i<count;i++){
    confetti.push({
      x: w * (0.18 + Math.random() * 0.64),
      y: -20 - Math.random()*80,
      vx: (Math.random()*2 - 1) * 2.0,
      vy: 2.0 + Math.random() * 3.5,
      r: 3 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random()*2 - 1) * 0.16,
      color: confettiColors[(Math.random()*confettiColors.length)|0],
      life: 220 + (Math.random()*120)|0,
      shape: Math.random() < 0.65 ? "rect" : "tri",
    });
  }
}

function updateConfetti(){
  ctx.clearRect(0,0,window.innerWidth, window.innerHeight);
  confetti = confetti.filter(p => p.life > 0 && p.y < window.innerHeight + 40);

  for(const p of confetti){
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.995;
    p.vy += 0.015;
    p.rot += p.vr;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;

    if(p.shape === "rect"){
      ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
    }else{
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.lineTo(p.r, p.r);
      ctx.lineTo(-p.r, p.r);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  requestAnimationFrame(updateConfetti);
}
updateConfetti();

/* ---------------- Scene 1 elements ---------------- */
const s1 = document.querySelector('.scene[data-scene="1"]');
const bg = s1?.querySelector(".bg");
const roy = s1?.querySelector(".roy");
const drawSlot = document.getElementById("drawSlot");

/* ---------------- Helpers ---------------- */
function randInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ---------------- Light sweep ---------------- */
function sweep(){
  gsap.fromTo("#lightSweep",
    { opacity: 0, xPercent: -18 },
    { opacity: 0.65, xPercent: 12, duration: 0.35, ease: "power2.out" }
  );
  gsap.to("#lightSweep", { opacity: 0, duration: 0.5, ease: "power2.inOut", delay: 0.12 });
}

/* ---------------- Final flash (5e boule) ---------------- */
function finalFlash(){
  gsap.killTweensOf("#finalFlash");
  gsap.fromTo("#finalFlash",
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1.02, duration: 0.12, ease: "power2.out" }
  );
  gsap.to("#finalFlash", { opacity: 0, duration: 0.55, ease: "power2.inOut", delay: 0.05 });
}

/* ---------------- Tirage évolutif ---------------- */
let drawTimer = null;
let drawRunning = false;

function initGreyRow(){
  if(!drawSlot) return;
  drawSlot.innerHTML = "";
  for(let i=0;i<5;i++){
    const el = document.createElement("div");
    el.className = "drawBall gray";
    el.textContent = "–";
    drawSlot.appendChild(el);
  }
}

/**
 * Révèle une boule et retourne la couleur choisie ("red" | "green")
 */
function revealBallAt(index, number){
  const el = drawSlot.children[index];
  if(!el) return "red";

  const color = Math.random() < 0.5 ? "red" : "green";
  el.className = `drawBall ${color}`;
  el.textContent = String(number);

  gsap.fromTo(el,
    { scale: 0.35, opacity: 0, y: 10, rotate: -10 },
    { scale: 1, opacity: 1, y: 0, rotate: 0, duration: 0.36, ease: "back.out(2.2)" }
  );

  // sweep à chaque reveal (ça fait "TV")
  sweep();

  return color;
}

async function runProgressiveDraw(){
  if(drawRunning) return;
  drawRunning = true;

  initGreyRow();

  // 5 numéros uniques 1..50
  const used = new Set();
  const picks = [];
  while(picks.length < 5){
    const n = randInt(1, 50);
    if(!used.has(n)){
      used.add(n);
      picks.push(n);
    }
  }

  // Reveal 1 by 1
  for(let i=0;i<5;i++){
    const color = revealBallAt(i, picks[i]);

    // RÈGLES CONFETTI :
    // - boules 1..4 => confetti UNIQUEMENT si vert
    // - boule 5 => confetti TOUJOURS + flash final
    if(i === 4){
      spawnConfettiBurst(110);   // final: plus fort
      finalFlash();
    } else {
      if(color === "green"){
        spawnConfettiBurst(18);  // vert: léger
      }
    }

    await gsap.to({}, { duration: 0.85 }); // intervalle entre boules
  }

  // Pause "results"
  await gsap.to({}, { duration: 1.6 });

  drawRunning = false;
}

function startDrawLoop(){
  if(drawTimer) return;

  runProgressiveDraw();

  // cycle total ~ 0.85*5 + 1.6 = 5.85s => 7s marge
  drawTimer = setInterval(() => {
    runProgressiveDraw();
  }, 7000);
}

function stopDrawLoop(){
  if(!drawTimer) return;
  clearInterval(drawTimer);
  drawTimer = null;
  drawRunning = false;
}

/* ---------------- Scene 1 entrance ---------------- */
const intro = gsap.timeline({ paused:true, defaults:{ ease:"power3.out" } });

function resetS1(){
  if (roy) gsap.set(roy, { x: "120%", y: 0 });
}
resetS1();

if (bg && roy){
  intro
    .fromTo(bg, { scale: 1.02, filter: "saturate(0.95)" }, { scale: 1.0, filter: "saturate(1.05)", duration: 0.9 }, 0)
    .to(roy, { x: 0, duration: 0.95, ease: "power4.out" }, 0.18)
    .to(roy, { y: -6, duration: 0.22, ease: "power2.out" }, 1.00)
    .to(roy, { y: 0, duration: 0.35, ease: "elastic.out(1, 0.45)" }, 1.18);
}

function burstIntro(){
  // petit burst d'intro (indépendant des règles du tirage)
  spawnConfettiBurst(60);
  sweep();
}

let idleStarted = false;
function startIdle(){
  if(idleStarted) return;
  idleStarted = true;
  if (roy) gsap.to(roy, { y: -3, duration: 2.6, yoyo:true, repeat:-1, ease:"sine.inOut" });
}

ScrollTrigger.create({
  trigger: spacers[0],
  start: "top 60%",
  end: "bottom 20%",
  onEnter: () => {
    resetS1();
    intro.restart();
    gsap.delayedCall(1.05, burstIntro);
    gsap.delayedCall(1.6, startIdle);
    startDrawLoop();
  },
  onEnterBack: () => {
    resetS1();
    intro.restart();
    gsap.delayedCall(1.05, burstIntro);
    gsap.delayedCall(1.6, startIdle);
    startDrawLoop();
  },
  onLeave: () => stopDrawLoop(),
  onLeaveBack: () => stopDrawLoop(),
});

/* Parallax */
if (bg){
  gsap.to(bg, {
    yPercent: 2,
    ease:"none",
    scrollTrigger:{ trigger: spacers[0], start:"top bottom", end:"bottom top", scrub:true }
  });
}
if (roy){
  gsap.to(roy, {
    yPercent:-1,
    ease:"none",
    scrollTrigger:{ trigger: spacers[0], start:"top bottom", end:"bottom top", scrub:true }
  });
}

window.addEventListener("resize", () => ScrollTrigger.refresh());


/* ===== Scratch logic (window-only canvas) - GOLD layer + scratch OK ===== */
(() => {
  const scratchCanvas = document.getElementById("scratchCanvas");
  const loginBtn = document.getElementById("loginX");
  const shimmerDiv = document.getElementById("scratchShimmer");
  if(!scratchCanvas || !loginBtn) return;

  // lien OAuth
  loginBtn.href =
    "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=Zks3NGtJVFFIaVJSWm1xcGV0Rko6MTpjaQ&redirect_uri=https%3A%2F%2Fpresale.api.bcmdao.io%2Fapi%2Fauthentication%2Ftwitter%2Fcallback%2F&scope=tweet.read+users.read+offline.access+like.read&state=0fOAUrFMb69uE2rTyaR6UCV9ycSpGBXgxU_hd3hDkes&code_challenge=C_KPbpa48MuG3J-mYMXxPSm9Bj0lQv0IKODaakuHrVU&code_challenge_method=S256";

  const ctx = scratchCanvas.getContext("2d");
  let isDown = false;
  let revealed = false;

  function getRect(){
    return scratchCanvas.getBoundingClientRect();
  }

  function paintGoldLayer(w, h){
    // ✅ couche OR (une seule fois)
    const grad = ctx.createLinearGradient(0, 0, w, h);
grad.addColorStop(0.00, "rgba(255, 240, 170, 1)");
grad.addColorStop(0.22, "rgba(255, 210, 90, 1)");
grad.addColorStop(0.50, "rgba(200, 145, 35, 1)");
grad.addColorStop(0.75, "rgba(255, 205, 85, 1)");
grad.addColorStop(1.00, "rgba(255, 245, 190, 1)");


    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

// ✅ vernis pour rendre l'or plus "plein"
ctx.globalCompositeOperation = "multiply";
ctx.globalAlpha = 0.18;
ctx.fillStyle = "rgba(170,120,20,1)";
ctx.fillRect(0,0,w,h);
ctx.globalAlpha = 1;
ctx.globalCompositeOperation = "source-over";


    // stries foil
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.lineWidth = 1;
    for(let i=0;i<20;i++){
      ctx.beginPath();
      ctx.moveTo(0, (h/20)*i);
      ctx.lineTo(w, (h/20)*i + (Math.random()*10-5));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function resizeScratch(){
    const rect = getRect();
    scratchCanvas.width = Math.floor(rect.width * devicePixelRatio);
    scratchCanvas.height = Math.floor(rect.height * devicePixelRatio);
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);

    paintGoldLayer(rect.width, rect.height);

    // shimmer visible au départ
    if(shimmerDiv) shimmerDiv.style.opacity = "1";
  }

  function getLocalPos(e){
    const rect = getRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function scratchAt(x,y){
    if(revealed) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x,y,18,0,Math.PI*2);
    ctx.fill();
  }

  function revealedRatio(){
    const rect = getRect();
    const data = ctx.getImageData(0,0,rect.width,rect.height).data;
    let cleared = 0;
    const step = 16;
    for(let i=3;i<data.length;i+=4*step){
      if(data[i] < 20) cleared++;
    }
    const total = Math.floor(data.length/(4*step));
    return cleared/total;
  }

  function reveal(){
    revealed = true;
    scratchCanvas.style.pointerEvents = "none";

    // ✅ bouton devient cliquable
    loginBtn.classList.add("revealed");

    // shimmer peut disparaître quand c’est “gagné”
    if(shimmerDiv) shimmerDiv.style.opacity = "0";

    // mini win fx si tu veux
    if(typeof spawnConfettiBurst === "function") spawnConfettiBurst(50);
  }

  scratchCanvas.addEventListener("pointerdown", (e)=>{
    scratchCanvas.setPointerCapture(e.pointerId);
    isDown = true;
    const p = getLocalPos(e);
    scratchAt(p.x,p.y);
  });

  scratchCanvas.addEventListener("pointermove", (e)=>{
    if(!isDown) return;
    const p = getLocalPos(e);
    scratchAt(p.x,p.y);
  });

  function endScratch(){
    isDown = false;
    if(revealed) return;
    if(revealedRatio() > 0.55) reveal();
  }

  scratchCanvas.addEventListener("pointerup", endScratch);
  scratchCanvas.addEventListener("pointercancel", endScratch);
  scratchCanvas.addEventListener("pointerleave", endScratch);

  window.addEventListener("resize", () => {
    if(revealed) return;
    resizeScratch();
  });

  resizeScratch();
})();
