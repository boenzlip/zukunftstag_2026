// Jumps - Fangspiel. Map = Raster aus Bloecken (16 x 9), so gross wie der Bildschirm.
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const MAP_SCALE = 1;           // 1 = Spielwelt so gross wie die Zeichenflaeche
const W = 1200, H = 680;       // Map (25% groesser als vorher)
canvas.width = W * MAP_SCALE; canvas.height = H * MAP_SCALE;
const BLOCK = 40;              // kleineres Blockraster
const COLS = 30, ROWS = 17;
const CHASER_ON = false;       // Fänger an/aus (true = Fänger ist im Spiel)
const GAME_TIME = 60;          // Sekunden
const GRAVITY = 1800, JUMP = -780, SPEED = 260;

// Jede Plattform = 2 Bloecke, jede mit eigener Farbe: [Spalte, Zeile, Farbe]
const platforms = [
  [2, 15, "#e74c3c"], [13, 15, "#f1c40f"], [25, 15, "#2ecc71"],
  [7, 12, "#3498db"], [19, 12, "#e67e22"],
  [3, 9, "#9b59b6"], [12, 9, "#1abc9c"], [22, 9, "#e84393"],
  [8, 6, "#f39c12"], [17, 6, "#16a085"], [27, 6, "#c0392b"],
  [4, 3, "#2980b9"], [13, 3, "#8e44ad"], [23, 3, "#27ae60"],
].map(([c, r, color]) => ({ x: c * BLOCK, y: r * BLOCK, w: 2 * BLOCK, h: BLOCK, color }));

const keys = {};
addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if (e.key === " ") e.preventDefault(); });
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

function makeActor(x, y) {
  return { x, y, w: 36, h: 48, vx: 0, vy: 0, onGround: false };
}

let player, chaser, timeLeft, state, freezeLeft, freezeUsed, chaserClock; // state: "play" | "win" | "lose"

function reset() {
  player = makeActor(2.5 * BLOCK, 15 * BLOCK - 48);
  chaser = makeActor(25.5 * BLOCK, 15 * BLOCK - 48);
  timeLeft = GAME_TIME;
  freezeLeft = 0; freezeUsed = false; chaserClock = 0;
  state = "play";
}

function physics(a, dt) {
  a.vy += GRAVITY * dt;
  a.x += a.vx * dt;
  const prevBottom = a.y + a.h;
  a.y += a.vy * dt;
  a.onGround = false;
  // Plattformen sind von oben fest: man landet nur, wenn man von oben kommt.
  if (a.vy >= 0) {
    for (const p of platforms) {
      const overlapX = a.x + a.w > p.x && a.x < p.x + p.w;
      if (overlapX && prevBottom <= p.y + 1 && a.y + a.h >= p.y) {
        a.y = p.y - a.h; a.vy = 0; a.onGround = true;
      }
    }
  }
  a.x = Math.max(0, Math.min(W - a.w, a.x));
  if (a.y < 0) { a.y = 0; a.vy = 0; } // oben ist eine Decke
}

function update(dt) {
  if (state !== "play") {
    if (keys["enter"] || keys[" "]) reset();
    return;
  }
  timeLeft -= dt;

  // Spieler: W springen, A links, D rechts
  player.vx = ((keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0)) * SPEED;
  if (keys["w"] && player.onGround) player.vy = JUMP;
  physics(player, dt);

  if (CHASER_ON) {
  // E: Fänger 3 Sekunden einfrieren (nur einmal pro Spiel)
  if (keys["e"] && !freezeUsed) { freezeUsed = true; freezeLeft = 3; }
  if (freezeLeft > 0) freezeLeft -= dt;
  const frozen = freezeLeft > 0;

  // Fänger: laeuft zum Spieler und springt, wenn der Spieler hoeher ist oder eine Luecke kommt
  // Der Fänger denkt voraus: er zielt dorthin, wo der Spieler gleich ist,
  // wechselt sein Tempo und macht kleine Pausen, damit er nicht synchron laeuft.
  chaserClock += dt;
  const target = player.x + player.vx * 0.7;
  const dx = target - chaser.x;
  const pace = 0.7 + 0.45 * Math.abs(Math.sin(chaserClock * 1.3));
  const pause = Math.sin(chaserClock * 0.7 + 1) > 0.97; // kurz stehen bleiben
  chaser.vx = (frozen || pause || Math.abs(dx) < 6) ? 0 : Math.sign(dx) * SPEED * pace;
  if (chaser.onGround && !frozen) {
    const aheadX = chaser.x + chaser.w / 2 + Math.sign(dx) * 50;
    const groundAhead = platforms.some(p => aheadX > p.x && aheadX < p.x + p.w && Math.abs(p.y - (chaser.y + chaser.h)) < 2);
    const playerAbove = player.y < chaser.y - 20;
    if ((playerAbove && Math.abs(dx) < 300) || !groundAhead || Math.random() < 0.004) chaser.vy = JUMP;
  }
  physics(chaser, dt);
  if (chaser.y > H) { // Fänger gefallen -> neu auf eine Plattform setzen
    chaser = makeActor(13.5 * BLOCK, 15 * BLOCK - 48);
  }

  }

  // Verlieren: runtergefallen oder gefangen
  const caught = CHASER_ON && player.x < chaser.x + chaser.w && player.x + player.w > chaser.x &&
                 player.y < chaser.y + chaser.h && player.y + player.h > chaser.y;
  if (player.y > H || caught) state = "lose";
  else if (timeLeft <= 0) { timeLeft = 0; state = "win"; }
}

function drawSmiley(a, color, angry) {
  const cx = a.x + a.w / 2, r = 18, cy = a.y + r;
  // Beine
  ctx.strokeStyle = "#000"; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + r); ctx.lineTo(cx - 10, a.y + a.h);
  ctx.moveTo(cx + 8, cy + r); ctx.lineTo(cx + 10, a.y + a.h);
  ctx.stroke();
  // Kopf
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Augen
  ctx.fillStyle = "#000";
  ctx.fillRect(cx - 8, cy - 6, 4, 6); ctx.fillRect(cx + 4, cy - 6, 4, 6);
  ctx.lineWidth = 3; ctx.beginPath();
  if (angry) {
    ctx.moveTo(cx - 11, cy - 12); ctx.lineTo(cx - 3, cy - 7);
    ctx.moveTo(cx + 11, cy - 12); ctx.lineTo(cx + 3, cy - 7);
    ctx.moveTo(cx - 7, cy + 11); ctx.quadraticCurveTo(cx, cy + 5, cx + 7, cy + 11);
  } else {
    ctx.arc(cx, cy + 2, 9, 0.2 * Math.PI, 0.8 * Math.PI);
  }
  ctx.stroke();
}


// Hintergrund: Feuerkrater in der Wueste (nach dem Foto der Kinder)
const flames = [];
(function () {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    const ang = rnd() * Math.PI * 2, ring = 0.55 + rnd() * 0.4;
    flames.push({ ang, ring, h: 14 + rnd() * 34, w: 6 + rnd() * 10, ph: rnd() * 10 });
  }
})();

function drawBackground(t) {
  // Himmel und Wueste
  let g = ctx.createLinearGradient(0, 0, 0, 110);
  g.addColorStop(0, "#4d78a8"); g.addColorStop(1, "#c8b9a3");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 110);
  ctx.fillStyle = "#8a6f5a"; // ferner Huegel
  ctx.beginPath(); ctx.moveTo(820, 90); ctx.lineTo(880, 62); ctx.lineTo(980, 62); ctx.lineTo(1060, 90); ctx.fill();
  ctx.fillStyle = "#b9b2a8"; ctx.fillRect(0, 90, W, H - 90);
  // Krater
  const cx = W / 2, cy = 380, rx = 570, ry = 280;
  g = ctx.createRadialGradient(cx, cy + 40, 20, cx, cy, rx);
  g.addColorStop(0, "#b4521f"); g.addColorStop(0.6, "#7d3a22"); g.addColorStop(1, "#3e2018");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  // Feuer am Rand und im Krater
  for (const f of flames) {
    const x = cx + Math.cos(f.ang) * rx * f.ring;
    const y = cy + Math.sin(f.ang) * ry * f.ring;
    const h = f.h * (0.7 + 0.3 * Math.sin(t * 6 + f.ph));
    ctx.fillStyle = "#ff7a1a";
    ctx.beginPath(); ctx.moveTo(x - f.w / 2, y);
    ctx.quadraticCurveTo(x - f.w / 4, y - h * 0.5, x, y - h);
    ctx.quadraticCurveTo(x + f.w / 4, y - h * 0.5, x + f.w / 2, y); ctx.fill();
    ctx.fillStyle = "#ffd34d";
    ctx.beginPath(); ctx.moveTo(x - f.w / 4, y);
    ctx.quadraticCurveTo(x, y - h * 0.6, x + f.w / 4, y); ctx.fill();
  }
  // grosses Feuer unten
  const fh = 70 + 12 * Math.sin(t * 7);
  ctx.fillStyle = "#ff8a1a";
  const bx = cx - 95, by = cy + 200;
  ctx.beginPath(); ctx.moveTo(bx - 45, by);
  ctx.quadraticCurveTo(bx - 40, by - fh * 0.6, bx, by - fh * 1.3);
  ctx.quadraticCurveTo(bx + 40, by - fh * 0.6, bx + 45, by); ctx.fill();
  ctx.fillStyle = "#ffd34d";
  ctx.beginPath(); ctx.moveTo(bx - 18, by);
  ctx.quadraticCurveTo(bx - 14, by - fh * 0.4, bx, by - fh * 0.8);
  ctx.quadraticCurveTo(bx + 14, by - fh * 0.4, bx + 18, by); ctx.fill();
}

function bigText(text, sub) {
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = "bold 64px sans-serif"; ctx.fillText(text, W / 2, 250);
  ctx.font = "28px sans-serif"; ctx.fillText(sub, W / 2, 300);
}

function draw() {
  ctx.setTransform(MAP_SCALE, 0, 0, MAP_SCALE, 0, 0);
  drawBackground(performance.now() / 1000);
  for (const p of platforms) {
    for (let i = 0; i < 2; i++) { // 2 Bloecke pro Plattform
      ctx.fillStyle = p.color; ctx.fillRect(p.x + i * BLOCK, p.y, BLOCK, BLOCK);
      ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2;
      ctx.strokeRect(p.x + i * BLOCK, p.y, BLOCK, BLOCK);
    }
  }
  if (CHASER_ON) drawSmiley(chaser, freezeLeft > 0 ? "#8fd9ff" : "#e74c3c", true);
  drawSmiley(player, "#ffe135", false);
  ctx.fillStyle = "#000"; ctx.textAlign = "left"; ctx.font = "bold 28px sans-serif";
  ctx.fillText("Zeit: " + Math.ceil(timeLeft), 16, 36);
  ctx.font = "20px sans-serif";
  if (CHASER_ON) ctx.fillText(freezeUsed ? (freezeLeft > 0 ? "Eingefroren!" : "Einfrieren benutzt") : "E = Fänger einfrieren (1x)", 16, 64);
  if (state === "win") bigText("GEWONNEN! 🏆", "Enter = nochmal");
  if (state === "lose") bigText("VERLOREN", "Enter = nochmal");
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(loop);
}
reset();
requestAnimationFrame(loop);
