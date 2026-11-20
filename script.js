const btn = document.getElementById("sendBtn");
const hint = document.getElementById("hint");

// Réglages de la physique
const RADIUS = 160;     // zone de peur autour du curseur (px)
const PUSH = 6;         // force de répulsion
const FRICTION = 0.86;  // amortissement (plus proche de 1 = plus glissant)
const SPRING = 0.004;   // force qui ramène le bouton à sa place quand on s'éloigne
const MARGIN = 10;      // marge avec les bords de l'écran

const taunts = [
  "Hé ! Pas si vite…",
  "Tu es sûr(e) de toi ?",
  "Pense au ticket resto…",
  "Le boss a l'air sympa en fait, non ?",
  "Raté 😏",
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

// Téléporte le bouton loin du pointeur quand il est coincé
function teleport() {
  const maxX = window.innerWidth - home.width - MARGIN;
  const maxY = window.innerHeight - home.height - MARGIN;
  let x, y, tries = 0;
  do {
    x = MARGIN + Math.random() * (maxX - MARGIN);
    y = MARGIN + Math.random() * (maxY - MARGIN);
    tries++;
  } while (Math.hypot(x + home.width / 2 - mx, y + home.height / 2 - my) < RADIUS * 2 && tries < 50);

  btn.classList.add("blink");
  setTimeout(() => {
    ox = x - home.left;
    oy = y - home.top;
    vx = vy = 0;
    btn.classList.remove("blink");
  }, 120);
  taunt("Pouf ! 💨");
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
  let pinned = false;
  if (ox < minOx) { ox = minOx; vx *= -0.5; pinned = true; }
  if (ox > maxOx) { ox = maxOx; vx *= -0.5; pinned = true; }
  if (oy < minOy) { oy = minOy; vy *= -0.5; pinned = true; }
  if (oy > maxOy) { oy = maxOy; vy *= -0.5; pinned = true; }

  // Coincé contre un mur avec le pointeur collé dessus : on s'échappe
  if (pinned && edgeDist < 35) teleport();

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
  teleport();
  taunt("Le clavier ? Bien essayé 😉");
});

// Au cas où quelqu'un réussirait quand même à cliquer
btn.addEventListener("click", (e) => {
  e.preventDefault();
  mx = e.clientX; my = e.clientY;
  teleport();
  taunt("Presque ! Mais non.");
});

// Recalcule la position d'origine si la fenêtre change de taille
window.addEventListener("resize", () => {
  const r = btn.getBoundingClientRect();
  home = { left: r.left - ox, top: r.top - oy, width: r.width, height: r.height };
});

requestAnimationFrame(tick);
