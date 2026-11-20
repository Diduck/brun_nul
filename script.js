const btn = document.getElementById("sendBtn");
const hint = document.getElementById("hint");

// Réglages de la physique
const RADIUS = 160;     // zone de peur autour du curseur (px)
const PUSH = 6;         // force de répulsion
const FRICTION = 0.86;  // amortissement (plus proche de 1 = plus glissant)
const SPRING = 0.004;   // force qui ramène le bouton à sa place quand on s'éloigne
const MARGIN = 10;      // marge avec les bords de l'écran
const BOOST = 9;        // accélération quand il est coincé contre un bord

const taunts = [
  "Hé ! Pas si vite…",
  "Tu es sûr(e) de toi ?",
  "Pense au ticket resto…",
  "Le boss a l'air sympa en fait, non ?",
  "Raté",
  "Encore un petit effort… ou pas.",
  "Le bouton a peur du chômage.",
  "Tu n'y arriveras jamais !",
  "Même le bouton a besoin de ce job.",
];

let home = btn.getBoundingClientRect(); // position d'origine du bouton
let ox = 0, oy = 0;    // décalage actuel par rapport à l'origine
let vx = 0, vy = 0;    // vitesse
let mx = -9999, my = -9999; // position du pointeur
let wasScared = false;
let escapes = 0;

function taunt(text) {
  hint.textContent = text || taunts[Math.floor(Math.random() * taunts.length)];
}

// Direction de fuite le long d'un mur : à l'opposé du pointeur,
// ou vers le centre de l'écran si le pointeur est pile en face
function slideDir(btnPos, mousePos, screenSize) {
  const d = btnPos - mousePos;
  if (Math.abs(d) > 8) return Math.sign(d);
  return Math.sign(screenSize / 2 - btnPos) || 1;
}

// Grosse impulsion pour s'éloigner (clic ou clavier), sans jamais quitter l'écran
function dash() {
  const cx = home.left + ox + home.width / 2;
  const cy = home.top + oy + home.height / 2;
  vx += slideDir(cx, mx, window.innerWidth) * 40;
  vy += slideDir(cy, my, window.innerHeight) * 40;
}

function tick() {
  const cx = home.left + ox + home.width / 2;
  const cy = home.top + oy + home.height / 2;

  // Distance entre le pointeur et le bord le plus proche du bouton
  const nx = Math.max(home.left + ox, Math.min(mx, home.left + ox + home.width));
  const ny = Math.max(home.top + oy, Math.min(my, home.top + oy + home.height));
  const edgeDist = Math.hypot(mx - nx, my - ny);

  let dx = cx - mx, dy = cy - my;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;

  if (edgeDist < RADIUS) {
    // Plus le pointeur est proche, plus la poussée est forte (courbe douce)
    const k = 1 - edgeDist / RADIUS;
    vx += dx * k * k * PUSH;
    vy += dy * k * k * PUSH;
    if (!wasScared && ++escapes % 3 === 0) taunt();
    wasScared = true;
  } else {
    // Revient tranquillement vers sa place, pour narguer
    vx -= ox * SPRING;
    vy -= oy * SPRING;
    wasScared = false;
  }

  vx *= FRICTION;
  vy *= FRICTION;
  ox += vx;
  oy += vy;

  // Rebonds doux sur les bords de l'écran
  const minOx = MARGIN - home.left;
  const maxOx = window.innerWidth - home.width - MARGIN - home.left;
  const minOy = MARGIN - home.top;
  const maxOy = window.innerHeight - home.height - MARGIN - home.top;
  let pinnedX = false, pinnedY = false;
  if (ox <= minOx) { ox = minOx; vx = Math.max(vx, 0) * 0.3; pinnedX = true; }
  if (ox >= maxOx) { ox = maxOx; vx = Math.min(vx, 0) * 0.3; pinnedX = true; }
  if (oy <= minOy) { oy = minOy; vy = Math.max(vy, 0) * 0.3; pinnedY = true; }
  if (oy >= maxOy) { oy = maxOy; vy = Math.min(vy, 0) * 0.3; pinnedY = true; }

  // Coincé contre un mur : il glisse le long du mur, de plus en plus vite
  // à mesure que le pointeur se rapproche
  if ((pinnedX || pinnedY) && edgeDist < RADIUS) {
    const k = 1 - edgeDist / RADIUS;
    const boost = BOOST * k;
    const bx = home.left + ox + home.width / 2;
    const by = home.top + oy + home.height / 2;

    let slideAlongY = pinnedX;
    if (pinnedX && pinnedY) {
      // Dans un coin : on longe le mur le plus éloigné du pointeur
      slideAlongY = Math.abs(bx - mx) > Math.abs(by - my);
    }
    if (slideAlongY) vy += slideDir(by, my, window.innerHeight) * boost;
    else vx += slideDir(bx, mx, window.innerWidth) * boost;
  }

  // Légère inclinaison selon la vitesse, pour un effet vivant
  const tilt = Math.max(-15, Math.min(15, vx * 1.5));
  btn.style.transform = `translate(${ox}px, ${oy}px) rotate(${tilt}deg)`;

  requestAnimationFrame(tick);
}

// Souris
document.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
document.addEventListener("mouseleave", () => { mx = my = -9999; });

// Tactile
function onTouch(e) {
  const t = e.touches[0];
  if (!t) return;
  mx = t.clientX; my = t.clientY;
}
document.addEventListener("touchstart", onTouch, { passive: true });
document.addEventListener("touchmove", onTouch, { passive: true });
document.addEventListener("touchend", () => { mx = my = -9999; });

// Clavier (Tab + Entrée) : on ne triche pas !
btn.addEventListener("focus", () => {
  btn.blur();
  const r = btn.getBoundingClientRect();
  mx = r.left + r.width / 2; my = r.top + r.height / 2;
  dash();
  taunt("Le clavier ? Bien essayé");
});

// Au cas où quelqu'un réussirait quand même à cliquer
btn.addEventListener("click", (e) => {
  e.preventDefault();
  mx = e.clientX; my = e.clientY;
  dash();
  taunt("Presque ! Mais non.");
});

// Recalcule la position d'origine si la fenêtre change de taille
window.addEventListener("resize", () => {
  const r = btn.getBoundingClientRect();
  home = { left: r.left - ox, top: r.top - oy, width: r.width, height: r.height };
});

requestAnimationFrame(tick);
