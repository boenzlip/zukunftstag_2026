// Jumps - Fangspiel. Map = Raster aus Bloecken (16 x 9), so gross wie der Bildschirm.
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const BLOCK = 60;
const COLS = 16, ROWS = 9;
const GAME_TIME = 60;          // Sekunden
const GRAVITY = 1800, JUMP = -780, SPEED = 260;

// Jede Plattform = 2 Bloecke, jede mit eigener Farbe: [Spalte, Zeile, Farbe]
const platforms = [
  [1, 7, "#e74c3c"], [7, 7, "#f1c40f"], [13, 7, "#2ecc71"],
  [4, 5, "#9b59b6"], [10, 5, "#e67e22"],
  [1, 3, "#1abc9c"], [7, 3, "#e84393"], [13, 3, "#3498db"],
].map(([c, r, color]) => ({ x: c * BLOCK, y: r * BLOCK, w: 2 * BLOCK, h: BLOCK, color }));

const keys = {};
addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if (e.key === " ") e.preventDefault(); });
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

function makeActor(x, y) {
  return { x, y, w: 36, h: 48, vx: 0, vy: 0, onGround: false };
}

let player, chaser, timeLeft, state, freezeLeft, freezeUsed, chaserClock; // state: "play" | "win" | "lose"

function reset() {
  player = makeActor(1.5 * BLOCK, 7 * BLOCK - 48);
  chaser = makeActor(13.5 * BLOCK, 7 * BLOCK - 48);
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
  a.x = Math.max(0, Math.min(canvas.width - a.w, a.x));
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
  if (chaser.y > canvas.height) { // Fänger gefallen -> neu auf eine Plattform setzen
    chaser = makeActor(7.5 * BLOCK, 7 * BLOCK - 48);
  }

  // Verlieren: runtergefallen oder gefangen
  const caught = player.x < chaser.x + chaser.w && player.x + player.w > chaser.x &&
                 player.y < chaser.y + chaser.h && player.y + player.h > chaser.y;
  if (player.y > canvas.height || caught) state = "lose";
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

function bigText(text, sub) {
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = "bold 64px sans-serif"; ctx.fillText(text, canvas.width / 2, 250);
  ctx.font = "28px sans-serif"; ctx.fillText(sub, canvas.width / 2, 300);
}

function draw() {
  ctx.fillStyle = "#87ceeb"; ctx.fillRect(0, 0, canvas.width, canvas.height); // Himmel
  for (const p of platforms) {
    for (let i = 0; i < 2; i++) { // 2 Bloecke pro Plattform
      ctx.fillStyle = p.color; ctx.fillRect(p.x + i * BLOCK, p.y, BLOCK, BLOCK);
      ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2;
      ctx.strokeRect(p.x + i * BLOCK, p.y, BLOCK, BLOCK);
    }
  }
  drawSmiley(chaser, freezeLeft > 0 ? "#8fd9ff" : "#e74c3c", true);
  drawSmiley(player, "#ffe135", false);
  ctx.fillStyle = "#000"; ctx.textAlign = "left"; ctx.font = "bold 28px sans-serif";
  ctx.fillText("Zeit: " + Math.ceil(timeLeft), 16, 36);
  ctx.font = "20px sans-serif";
  ctx.fillText(freezeUsed ? (freezeLeft > 0 ? "Eingefroren!" : "Einfrieren benutzt") : "E = Fänger einfrieren (1x)", 16, 64);
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
