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
const COLORS = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#e67e22", "#9b59b6", "#1abc9c", "#e84393", "#f39c12", "#16a085", "#c0392b", "#2980b9"];
const ROW_A = [2, 8, 14, 20, 26], ROW_B = [5, 11, 17, 23];
const BASE_LAYOUT = [[15, ROW_A], [12, ROW_B], [9, ROW_A], [6, ROW_B], [3, ROW_A]]
  .flatMap(([r, cols]) => cols.map(c => [c, r]))
  .map(([c, r], i) => [c, r, COLORS[i % COLORS.length]]);

const COLOR_NAMES = ["Rot", "Gelb", "Grün", "Blau", "Orange", "Lila", "Türkis", "Pink", "Gold", "Dunkelgrün", "Dunkelrot", "Dunkelblau"];
let moveColor = "", lastMoveColor = ""; // Diese Farbe bewegt sich in der aktuellen Runde
const MOVE_RANGE = 60;         // wie weit sie nach links/rechts wandern (Pixel)
const MOVE_SPEED = 0.9;        // etwa 54 Pixel pro Sekunde

function randomPlatforms() {
  return BASE_LAYOUT.map(([c, r, color]) => {
    const col = Math.max(0, Math.min(COLS - 2, c + Math.floor(Math.random() * 5) - 2));
    const row = Math.max(2, Math.min(15, r + Math.floor(Math.random() * 3) - 1));
    const moving = color === moveColor;   // Plattformen in der Rundenfarbe bewegen sich links/rechts
    return { x: col * BLOCK, baseX: col * BLOCK, y: row * BLOCK, w: 2 * BLOCK, h: BLOCK, color, moving };
  });
}

// Kann man von Plattform a nach Plattform b springen? (vorsichtig gerechnet)
function canReach(a, b) {
  const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const rise = a.y - b.y; // positiv = b liegt hoeher
  const disc = JUMP * JUMP - 2 * GRAVITY * rise;
  if (disc <= 0) return false;
  const t = (-JUMP + Math.sqrt(disc)) / GRAVITY;     // Landung beim Runterfallen
  const maxGap = 0.8 * SPEED * t;                    // 20% Sicherheit
  return gap <= maxGap;
}

// Von JEDER Plattform aus muss man ALLE anderen erreichen koennen,
// also gibt es immer eine Plattform, auf die man springen kann.
function allReachableAt(list) {
  for (let start = 0; start < list.length; start++) {
    const seen = new Set([start]), todo = [start];
    while (todo.length) {
      const i = todo.pop();
      list.forEach((p, j) => { if (!seen.has(j) && canReach(list[i], p)) { seen.add(j); todo.push(j); } });
    }
    if (seen.size !== list.length) return false;
  }
  return true;
}

// Auch wenn sich die beweglichen Plattformen ganz links oder ganz rechts befinden,
// muss alles erreichbar bleiben.
function allReachable(list) {
  const movers = list.map((p, i) => p.moving ? i : -1).filter(i => i >= 0);
  for (let mask = 0; mask < (1 << movers.length); mask++) {
    const test = list.map(p => ({ ...p }));
    movers.forEach((idx, k) => { test[idx].x = test[idx].baseX + ((mask >> k) & 1 ? MOVE_RANGE : -MOVE_RANGE); });
    if (!allReachableAt(test)) return false;
  }
  return true;
}

function shufflePlatforms() {
  // Jede Runde bewegt sich eine andere Farbe.
  const choices = COLORS.filter(c => c !== lastMoveColor);
  moveColor = choices[Math.floor(Math.random() * choices.length)];
  lastMoveColor = moveColor;
  for (let i = 0; i < 500; i++) {
    const list = randomPlatforms();
    if (allReachable(list)) { platforms = list; return; }
  }
  platforms = BASE_LAYOUT.map(([c, r, color]) => ({ x: c * BLOCK, baseX: c * BLOCK, y: r * BLOCK, w: 2 * BLOCK, h: BLOCK, color, moving: color === moveColor }));
}
shufflePlatforms();

const keys = {};
// Namen der Spieler (werden vor dem Spiel abgefragt)
const names = ["", ""];
let nameStep = 0;              // 0 = Spieler 1 tippt, 1 = Spieler 2 tippt
const nm = n => names[n - 1] || ("Spieler " + n);

addEventListener("keydown", e => {
  if (state === "names") { // Namen eintippen
    if (e.key === "Enter") { if (++nameStep > 1) { state = "pick"; pickStep = 0; cursor = 0; newChoices(); } }
    else if (e.key === "Backspace") names[nameStep] = names[nameStep].slice(0, -1);
    else if (e.key.length === 1 && names[nameStep].length < 12) names[nameStep] += e.key;
    e.preventDefault();
    return;
  }
  if (state === "pick") { // Emoji waehlen
    const k = e.key.toLowerCase();
    if (k === "arrowright" || k === "d") cursor = (cursor + 1) % 10;
    else if (k === "arrowleft" || k === "a") cursor = (cursor + 9) % 10;
    else if (k === "arrowdown" || k === "s") cursor = (cursor + 5) % 10;
    else if (k === "arrowup" || k === "w") cursor = (cursor + 5) % 10;
    else if (k === "enter" || k === " ") choose(cursor);
    e.preventDefault();
    return;
  }
  if (e.key.toLowerCase() === "r") { fullRestart(); return; }   // R = ganz von vorn
  keys[e.key.toLowerCase()] = true; if (e.key === " ") e.preventDefault();
});

// Ganzes Spiel von vorn: Namen, Emojis, Punkte und Rollen werden zurueckgesetzt.
function fullRestart() {
  names[0] = ""; names[1] = ""; nameStep = 0;
  score1 = 0; score2 = 0; rounds = 0; matchOver = false;
  emoji1 = 0; emoji2 = 1; pickStep = 0; cursor = 0;
  for (const k in keys) keys[k] = false;
  reset();
  state = "names";
}

// Emoji-Auswahl: erst Spieler 1, dann Spieler 2. Jedes Emoji nur einmal!
let pickStep = 0, cursor = 0;
// Bei jeder Auswahl kommen 10 andere Emojis aus dem grossen Vorrat (zufaellig gemischt).
let choices = [];
function newChoices() {
  const pool = EMOJI_DEFS.map((d, i) => i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  choices = pool.slice(0, 10);
}
function takenBy(i) { return pickStep >= 1 && emoji1 === choices[i] ? 1 : 0; }
function choose(i) {
  if (takenBy(i)) return;                  // schon vergeben
  if (pickStep === 0) { emoji1 = choices[i]; pickStep = 1; cursor = (i + 1) % 10; }
  else { emoji2 = choices[i]; reset(); }
}
const CELL = { w: 150, h: 170, x0: (W - 5 * 150) / 2, y0: 210 };   // Gitter 5 x 2
canvas.addEventListener("click", e => {
  if (state !== "pick") return;
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
  const col = Math.floor((mx - CELL.x0) / CELL.w), row = Math.floor((my - CELL.y0) / CELL.h);
  if (col >= 0 && col < 5 && row >= 0 && row < 2) { cursor = row * 5 + col; choose(cursor); }
});
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

function makeActor(x, y) {
  return { x, y, w: 36, h: 48, vx: 0, vy: 0, onGround: false };
}

let score1 = 0, score2 = 0, matchOver = false;
const WIN_SCORE = 10;          // Wer zuerst 10 Punkte hat, gewinnt
const SWAP_EVERY = 5;          // Alle 5 Runden tauschen Faenger (gelb) und Laeufer (gruen)
let rounds = 0;                // gespielte Runden
// Spieler 1 = W/A/D (player), Spieler 2 = Pfeiltasten (player2)
const catcherIs1 = () => Math.floor(rounds / SWAP_EVERY) % 2 === 0;
// Goldene Muenze: liegt jede Runde auf einer zufaelligen Plattform.
// Wer sie einsammelt, springt 30 Sekunden lang doppelt so hoch.
const BOOST_TIME = 30;
const SUPER_JUMP = JUMP * Math.SQRT2;   // doppelte Sprunghoehe = Startgeschwindigkeit x Wurzel 2
let coin = null, boost1 = 0, boost2 = 0;   // Restzeit des Superhuepfers in Sekunden

// Portale: auf den zwei gleichfarbigen Plattformen einer Farbe. Wer hineinlaeuft, kommt beim anderen heraus.
let portals = null;            // [Plattform A, Plattform B]
let tele1 = false, tele2 = false;   // true = gerade teleportiert, noch im Portal
const PORTAL_W = 30, PORTAL_H = 56;
const portalRect = p => ({ x: p.x + p.w / 2 - PORTAL_W / 2, y: p.y - PORTAL_H, w: PORTAL_W, h: PORTAL_H });

// Gruener Hebel: Wer ihn beruehrt, laesst ALLE Plattformen an neue Stellen gleiten (animiert).
// Der Hebel zieht dabei auf eine andere Plattform um und kann immer wieder benutzt werden.
let lever = null, flash = 0;
const LEVER_W = 34, LEVER_H = 40;
const SLIDE_TIME = 1.5;        // so lange gleiten die Plattformen (Sekunden)
const leverRect = p => ({ x: p.x + p.w / 2 - LEVER_W / 2, y: p.y - LEVER_H, w: LEVER_W, h: LEVER_H });

// Neue Plaetze fuer alle Plattformen suchen (immer noch alles erreichbar) und losgleiten lassen.
function slidePlatforms() {
  for (let i = 0; i < 500; i++) {
    const list = randomPlatforms();
    if (!allReachable(list)) continue;
    platforms.forEach((p, j) => {
      p.anim = { x0: p.baseX, y0: p.y, x1: list[j].baseX, y1: list[j].y, t: 0 };
    });
    return;
  }
}

let player, player2, chaser, winner, timeLeft, state, freezeLeft, freezeUsed, chaserClock; // state: "play" | "win" | "lose"

function reset() {
  shufflePlatforms();
  player = makeActor(platforms[0].x + BLOCK - 18, platforms[0].y - 48);
  player2 = makeActor(platforms[2].x + BLOCK - 18, platforms[2].y - 48);
  winner = "";
  chaser = makeActor(25.5 * BLOCK, 15 * BLOCK - 48);
  timeLeft = GAME_TIME;
  freezeLeft = 0; freezeUsed = false; chaserClock = 0;
  boost1 = 0; boost2 = 0;
  // Portale: eine zufaellige Farbe, die genau 2 Plattformen hat (nicht die Startfarben)
  const pairColors = COLORS.filter(c => platforms.filter(p => p.color === c).length === 2 &&
                                        c !== platforms[0].color && c !== platforms[2].color);
  const portalColor = pairColors[Math.floor(Math.random() * pairColors.length)];
  portals = platforms.filter(p => p.color === portalColor);
  tele1 = false; tele2 = false;
  // Muenze auf eine zufaellige Plattform (nicht Start- und Portalplattformen)
  const spots = platforms.filter((p, i) => i !== 0 && i !== 2 && !portals.includes(p));
  coin = { plat: spots[Math.floor(Math.random() * spots.length)], taken: false };
  // Hebel auf einer weiteren zufaelligen Plattform
  const leverSpots = spots.filter(p => p !== coin.plat);
  lever = { plat: leverSpots[Math.floor(Math.random() * leverSpots.length)], cool: false, flip: false };
  flash = 0;
  state = "play";
}

function physics(a, dt) {
  a.vy += GRAVITY * dt;
  a.x += a.vx * dt;
  const prevBottom = a.y + a.h;
  a.y += a.vy * dt;
  a.onGround = false; a.standingOn = null;
  // Plattformen sind von oben fest: man landet nur, wenn man von oben kommt.
  if (a.vy >= 0) {
    for (const p of platforms) {
      const overlapX = a.x + a.w > p.x && a.x < p.x + p.w;
      if (overlapX && prevBottom <= p.y + 1 && a.y + a.h >= p.y) {
        a.y = p.y - a.h; a.vy = 0; a.onGround = true; a.standingOn = p;
      }
    }
  }
  a.x = Math.max(0, Math.min(W - a.w, a.x));
  if (a.y < 0) { a.y = 0; a.vy = 0; } // oben ist eine Decke
}

// Runde zu Ende: who = 1 (Spieler 1), 2 (Spieler 2) oder 0 (keiner) bekommt einen Punkt.
function endRound(who, text) {
  state = "end"; winner = text;
  rounds++;
  if (who === 1) score1++;
  if (who === 2) score2++;
  if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) {
    matchOver = true;
    winner = (score1 >= WIN_SCORE ? nm(1) : nm(2)).toUpperCase() + " GEWINNT DAS SPIEL!";
  }
}

function update(dt) {
  if (state === "names" || state === "pick") return;
  if (state !== "play") {
    if (keys["enter"] || keys[" "]) {
      if (matchOver) { score1 = 0; score2 = 0; rounds = 0; matchOver = false; }
      reset();
    }
    return;
  }
  timeLeft -= dt;

  boost1 = Math.max(0, boost1 - dt); boost2 = Math.max(0, boost2 - dt);

  // Plattformen: gleiten zu neuen Stellen (Hebel) und/oder wandern hin und her (Rundenfarbe).
  // Spieler, die darauf stehen, werden mitgenommen.
  for (const p of platforms) {
    const oldX = p.x, oldY = p.y;
    if (p.anim) {
      p.anim.t = Math.min(1, p.anim.t + dt / SLIDE_TIME);
      const e = p.anim.t * p.anim.t * (3 - 2 * p.anim.t);   // weich starten und bremsen
      p.baseX = p.anim.x0 + (p.anim.x1 - p.anim.x0) * e;
      p.y = p.anim.y0 + (p.anim.y1 - p.anim.y0) * e;
      if (p.anim.t >= 1) p.anim = null;
    }
    p.x = p.moving ? p.baseX + MOVE_RANGE * Math.sin((GAME_TIME - timeLeft) * MOVE_SPEED) : p.baseX;
    for (const a of [player, player2]) if (a.standingOn === p) { a.x += p.x - oldX; a.y += p.y - oldY; }
  }
  const sliding = platforms.some(p => p.anim);

  // Portale: nach dem Teleportieren muss man erst aus dem Portal herauslaufen,
  // sonst wuerde man sofort zurueckspringen.
  const through = (a, justTeleported) => {
    // Es zaehlt die Mitte der Figur: nahe an der Portalmitte (10 px) = hineingelaufen.
    // Nach dem Teleportieren ist man wieder bereit, sobald man 16 px von der Mitte weg ist.
    const cx = a.x + a.w / 2;
    let near = -1, zone = false;
    for (let k = 0; k < 2; k++) {
      const r = portalRect(portals[k]);
      const dx = Math.abs(cx - (r.x + r.w / 2));
      const vOverlap = a.y < r.y + r.h && a.y + a.h > r.y;
      if (vOverlap && dx < 10) near = k;
      if (vOverlap && dx < 16) zone = true;
    }
    if (justTeleported) return zone;         // noch im Portalbereich: warten
    if (near < 0) return false;
    const dest = portals[1 - near];
    a.x = dest.x + dest.w / 2 - a.w / 2; a.y = dest.y - a.h;
    return true;
  };
  tele1 = through(player, tele1); tele2 = through(player2, tele2);

  // Hebel beruehren (immer wieder benutzbar; erst loslassen/weggehen, dann wieder bereit)
  flash = Math.max(0, flash - dt);
  if (lever) {
    const r = leverRect(lever.plat);
    const touch = a => a.x < r.x + r.w && a.x + a.w > r.x && a.y < r.y + r.h && a.y + a.h > r.y;
    const touching = touch(player) || touch(player2);
    if (touching && !lever.cool && !sliding) {
      lever.cool = true; lever.flip = !lever.flip; flash = 0.25;
      slidePlatforms();
      // Hebel zieht auf eine andere Plattform um (nicht auf Portal- oder Muenzplattform)
      const spots = platforms.filter(p => p !== lever.plat && !portals.includes(p) && p !== player.standingOn && p !== player2.standingOn &&
                                         !(coin && !coin.taken && p === coin.plat));
      lever.plat = spots[Math.floor(Math.random() * spots.length)];
    } else if (!touching && !sliding) {
      lever.cool = false;
    }
  }

  // Muenze einsammeln
  if (coin && !coin.taken) {
    const cx = coin.plat.x + coin.plat.w / 2, cy = coin.plat.y - 16;
    const touch = a => a.x < cx + 14 && a.x + a.w > cx - 14 && a.y < cy + 14 && a.y + a.h > cy - 14;
    if (touch(player)) { coin.taken = true; boost1 = BOOST_TIME; }
    else if (touch(player2)) { coin.taken = true; boost2 = BOOST_TIME; }
  }

  // Faenger = gelb, Laeufer = gruen. Der Laeufer kann den Faenger 3 Sekunden einfrieren (1x pro Runde):
  // Spieler 1 mit S, Spieler 2 mit Pfeil runter.
  const c1 = catcherIs1();
  if (keys[c1 ? "arrowdown" : "s"] && !freezeUsed) { freezeUsed = true; freezeLeft = 3; }
  if (freezeLeft > 0) freezeLeft -= dt;
  const frozen = freezeLeft > 0;

  // Spieler 1: W springen, A links, D rechts
  const f1 = frozen && c1, f2 = frozen && !c1;
  player.vx = f1 ? 0 : ((keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0)) * SPEED;
  if (keys["w"] && player.onGround && !f1) player.vy = boost1 ? SUPER_JUMP : JUMP;
  physics(player, dt);

  // Spieler 2: Pfeiltasten (hoch = springen)
  player2.vx = f2 ? 0 : ((keys["arrowright"] ? 1 : 0) - (keys["arrowleft"] ? 1 : 0)) * SPEED;
  if (keys["arrowup"] && player2.onGround && !f2) player2.vy = boost2 ? SUPER_JUMP : JUMP;
  physics(player2, dt);

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

  // Gelb faengt Gruen, wenn sie sich beruehren. Wer runterfaellt, verliert.
  const caught = player.x < player2.x + player2.w && player.x + player.w > player2.x &&
                 player.y < player2.y + player2.h && player.y + player.h > player2.y;
  const p1Out = player.y > H, p2Out = player2.y > H;
  const catcherN = c1 ? 1 : 2, runnerN = c1 ? 2 : 1;
  const catcherOut = c1 ? p1Out : p2Out, runnerOut = c1 ? p2Out : p1Out;
  if (caught) endRound(catcherN, "Fänger hat gefangen: Punkt für " + nm(catcherN) + "!");
  else if (p1Out && p2Out) endRound(0, "Unentschieden!");
  else if (catcherOut) endRound(runnerN, "Fänger ist gefallen: Punkt für " + nm(runnerN) + "!");
  else if (runnerOut) endRound(catcherN, "Läufer ist gefallen: Punkt für " + nm(catcherN) + "!");
  else if (timeLeft <= 0) { timeLeft = 0; endRound(runnerN, "Zeit um: Punkt für " + nm(runnerN) + "!"); }
}

// Pixel-Emojis (12 x 12). Jeder Spieler waehlt eins; jedes Emoji gibt es nur einmal pro Spiel.
// Zeichen: O = Rand, Y = gelb, W = weiss, B = schwarz, R = rot, L = blau, G = gruen, P = rosa, . = nichts aendern
const EMOJI_COLORS = { O: "#5a3a00", Y: "#ffd23f", W: "#ffffff", B: "#1b1b1b", R: "#e63946", L: "#4dabf7", G: "#6cc24a", P: "#ff8fab",
  C: "#66d9e8", V: "#b197fc", N: "#ff922b", S: "#ced4da", D: "#6b3f12" };
const EMOJI_BASE = [
  "...OOOOOO...", ".OOYYYYYYOO.", ".OYYYYYYYYO.", "OYYYYYYYYYYO", "OYYYYYYYYYYO", "OYYYYYYYYYYO",
  "OYYYYYYYYYYO", "OYYYYYYYYYYO", "OYYYYYYYYYYO", ".OYYYYYYYYO.", ".OOYYYYYYOO.", "...OOOOOO...",
];
// patch = Zeilen 3..9 der Gesichter (nur Gesichtsdetails), base = Grundfarbe
const EMOJI_DEFS = [
  { name: "Grinser",     patch: ["...BB..BB...", "...BB..BB...", "............", "............", "..BBBBBBBB..", "...BWWWWB...", "....BBBB...."] },
  { name: "Zunge raus",  patch: ["...BB.......", "...BB..BBB..", "............", "............", "..BBBBBBBB..", "...BRRRRB...", "....RRRR...."] },
  { name: "Cool",        patch: [".BBBBBBBBBB.", ".BBBBBBBBBB.", "..BB....BB..", "............", "..B......B..", "...BBBBBB...", "............"] },
  { name: "Herzaugen",   patch: ["..R.R..R.R..", "..RRR..RRR..", "...R....R...", "............", "..B......B..", "...BBBBBB...", "............"] },
  { name: "Lachtränen",  patch: ["..BB....BB..", "...BB..BB...", "..L......L..", "..L......L..", "..BBBBBBBB..", "...BWWWWB...", "....BBBB...."] },
  { name: "Schock",      patch: ["..WW....WW..", "..WB....BW..", "..WW....WW..", "............", "....BBBB....", "....BBBB....", "....BBBB...."] },
  { name: "Müde",        patch: ["............", "..BBB..BBB..", "............", "............", "...BBBBB....", "........L...", "............"] },
  { name: "Streber",     patch: [".BBBB..BBBB.", ".BWWBBBBWWB.", ".BBBB..BBBB.", "............", "...BBBBBB...", "....BWWB....", "............"] },
  { name: "Alien", base: "G", patch: [".BBB....BBB.", "..BBB..BBB..", "...BB..BB...", "............", "............", "....BBBB....", "............"] },
  { name: "Clown", base: "W", patch: ["LL........LL", "...BB..BB...", ".....RR.....", ".....RR.....", "............", "..RRRRRRRR..", "............"] },
  { name: "Wütend", base: "R", patch: ["..B......B..", "...BB..BB...", "...BB..BB...", "............", "............", "...BBBBBB...", "..B......B.."] },
  { name: "Kuss", patch: ["............", "..BB....BB..", "............", ".PP......PP.", "....RRRR....", "....RRRR....", "............"] },
  { name: "Traurig", patch: ["............", "...BB..BB...", "...BB..BB...", "...L....L...", "............", "....BBBB....", "...B....B..."] },
  { name: "Roboter", base: "S", patch: ["..LLL..LLL..", "..LBL..LBL..", "..LLL..LLL..", "............", "..BBBBBBBB..", "..BWBWBWBW..", "..BBBBBBBB.."] },
  { name: "Katze", base: "N", patch: ["..GG....GG..", "..GB....BG..", "............", "BB...PP...BB", "....B..B....", ".....BB.....", "............"] },
  { name: "Pirat", extra: [[1, ".OORRRRRROO."], [2, ".ORRRRRRRRO."]], patch: ["...B....B...", ".BBBB..BB...", ".BBBB.......", "............", "............", "...BBBBBB...", "............"] },
  { name: "Geist", base: "W", patch: ["............", "..BB....BB..", "..BB....BB..", "............", "....B..B....", "....BBBB....", "............"] },
  { name: "Sternchen", patch: ["..N.N..N.N..", "..NNN..NNN..", "...N....N...", "............", "..BBBBBBBB..", "...BWWWWB...", "............"] },
  { name: "Monster", base: "V", patch: [".....WW.....", "....WBBW....", ".....WW.....", "............", "..BBBBBBBB..", "..BWBWBWBW..", "....BBBB...."] },
  { name: "Frost", base: "C", patch: ["............", "...BB..BB...", "...BB..BB...", "............", "..B.B.B.B.B.", "..BBBBBBBB..", "............"] },
  { name: "Schnurrbart", patch: ["............", "...BB..BB...", "............", "..DDDDDDDD..", "...DDDDDD...", "....BBBB....", "............"] },
  { name: "Nervös", patch: ["..........L.", "...BB..BB...", "...BB..BB...", "..........L.", "..B.BB.BB.B.", "...B..BB.B..", "............"] },
];
// Jedes Emoji einmal in eine Liste von farbigen Punkten umrechnen
const EMOJI_PIXELS = EMOJI_DEFS.map(def => {
  const rows = EMOJI_BASE.map(r => r.split(""));
  const base = def.base || "Y";
  rows.forEach((r, y) => r.forEach((c, x) => { if (c === "Y") rows[y][x] = base; }));
  (def.extra || []).forEach(([y, line]) => line.split("").forEach((c, x) => { if (c !== ".") rows[y][x] = c; }));
  def.patch.forEach((line, i) => line.split("").forEach((c, x) => { if (c !== ".") rows[3 + i][x] = c; }));
  const px = [];
  rows.forEach((r, y) => r.forEach((c, x) => { if (c !== ".") px.push([x, y, EMOJI_COLORS[c] || EMOJI_COLORS.Y]); }));
  return px;
});

function drawEmoji(idx, x, y, size) {
  const u = size / 12;
  for (const [cx, cy, color] of EMOJI_PIXELS[idx]) {
    ctx.fillStyle = color; ctx.fillRect(x + cx * u, y + cy * u, Math.ceil(u), Math.ceil(u));
  }
}

let emoji1 = 0, emoji2 = 1;   // gewaehlte Emojis (Spieler 1, Spieler 2)

// Figur: Pixel-Emoji als Kopf, Ring in der Rollenfarbe (gelb = Faenger, gruen = Laeufer), Beine (Faenger = rot).
function drawPlayer(a, ringColor, emojiIdx, isCatcher) {
  const cx = a.x + a.w / 2, cy = a.y + 19;
  ctx.strokeStyle = isCatcher ? "#e00000" : "#000"; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 19); ctx.lineTo(cx - 10, a.y + a.h);
  ctx.moveTo(cx + 8, cy + 19); ctx.lineTo(cx + 10, a.y + a.h);
  ctx.stroke();
  ctx.strokeStyle = ringColor; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.stroke();
  drawEmoji(emojiIdx, cx - 20, cy - 20, 40);
  if (isCatcher) { // Faenger traegt einen roten Hut
    ctx.fillStyle = "#d62828"; ctx.fillRect(cx - 11, cy - 38, 22, 17);      // Hutkrone
    ctx.fillStyle = "#9d0208"; ctx.fillRect(cx - 11, cy - 27, 22, 4);       // Hutband
    ctx.fillStyle = "#d62828"; ctx.fillRect(cx - 19, cy - 22, 38, 5);       // Krempe
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 11, cy - 38, 22, 17); ctx.strokeRect(cx - 19, cy - 22, 38, 5);
  }
}

function drawSmiley(a, color, angry) {
  const cx = a.x + a.w / 2, r = 18, cy = a.y + r;
  // Beine (Faenger = rot)
  ctx.strokeStyle = angry ? "#e00000" : "#000"; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + r); ctx.lineTo(cx - 10, a.y + a.h);
  ctx.moveTo(cx + 8, cy + r); ctx.lineTo(cx + 10, a.y + a.h);
  ctx.stroke();
  // Kopf
  ctx.strokeStyle = "#000"; ctx.fillStyle = color;
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


// Wolken (ziehen langsam nach rechts) und Regen
const clouds = [], drops = [];
(function () {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) clouds.push({ x: rnd() * 1400, y: 10 + rnd() * 560, s: 0.8 + rnd() * 1.1, v: 10 + rnd() * 25 });
  for (let i = 0; i < 160; i++) drops.push({ x: rnd() * 1400, y: rnd() * 800, len: 10 + rnd() * 12, v: 600 + rnd() * 300 });
})();

function drawCloud(c, t) {
  const x = ((c.x + t * c.v) % 1500) - 150, y = c.y, s = c.s;
  ctx.fillStyle = "#6e7686";
  for (const [dx, dy, r] of [[0, 14, 22], [26, 4, 28], [58, 12, 24], [84, 18, 18], [-20, 20, 16]]) {
    ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#8d96a6"; // hellere Oberseite
  for (const [dx, dy, r] of [[26, -2, 18], [58, 6, 14]]) {
    ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
  }
}

function drawRain(t) {
  ctx.strokeStyle = "rgba(190,215,255,0.55)"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const d of drops) {
    const y = (d.y + t * d.v) % (H + 40) - 20;
    const x = ((d.x - t * 90 - y * 0.15) % (W + 60) + W + 60) % (W + 60) - 30;   // leicht schraeg
    ctx.moveTo(x, y); ctx.lineTo(x - 3, y + d.len);
  }
  ctx.stroke();
}

// Hintergrund: Gewitterhimmel mit ziehenden Wolken und Regen
function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#2f4560"); g.addColorStop(1, "#8da3b8");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const c of clouds) drawCloud(c, t);
  drawRain(t);
}

function bigText(text, sub) {
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = "bold 48px sans-serif"; ctx.fillText(text, W / 2, 250);
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
    if (p.moving) { // Pfeil zeigt: diese Plattform bewegt sich
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("↔", p.x + p.w / 2, p.y + 28); ctx.textAlign = "left";
    }
  }
  if (CHASER_ON) drawSmiley(chaser, freezeLeft > 0 ? "#8fd9ff" : "#e74c3c", true);
  // Hebel zeichnen
  if (lever) {
    const r = leverRect(lever.plat), bx = r.x + r.w / 2, by = lever.plat.y;
    ctx.fillStyle = "#555"; ctx.fillRect(bx - 16, by - 8, 32, 8);
    ctx.strokeStyle = "#ddd"; ctx.lineWidth = 5; ctx.lineCap = "round";
    const dir = lever.flip ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(bx, by - 8); ctx.lineTo(bx + dir * 14, by - 32); ctx.stroke();
    ctx.fillStyle = "#2ecc40"; ctx.beginPath(); ctx.arc(bx + dir * 14, by - 34, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#0a6b14"; ctx.lineWidth = 2; ctx.stroke(); ctx.lineCap = "butt";
  }
  // Portale zeichnen
  if (portals) for (const p of portals) {
    const r = portalRect(p), t = performance.now() / 300;
    ctx.fillStyle = "#1b0b3a"; ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 + 2, r.h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#7df9ff"; ctx.stroke();
    ctx.fillStyle = "#c28bff"; ctx.beginPath();
    ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, 6 + 3 * Math.sin(t), 16 + 4 * Math.sin(t), 0, 0, Math.PI * 2); ctx.fill();
  }
  // Goldene Muenze
  if (coin && !coin.taken) {
    const cx = coin.plat.x + coin.plat.w / 2, cy = coin.plat.y - 16 + 3 * Math.sin(performance.now() / 200);
    ctx.fillStyle = "#b8860b"; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff6a8"; ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Goldener Schein um Spieler mit Superspruengen
  for (const [a, on] of [[player, boost1], [player2, boost2]]) {
    if (on <= 0) continue;
    ctx.fillStyle = "rgba(255,215,0,0.35)";
    ctx.beginPath(); ctx.arc(a.x + a.w / 2, a.y + a.h / 2, 34, 0, Math.PI * 2); ctx.fill();
  }
  const cn = catcherIs1();
  const catcherColor = freezeLeft > 0 ? "#8fd9ff" : "#ffe135";
  drawPlayer(player, cn ? catcherColor : "#7ee081", emoji1, cn);
  drawPlayer(player2, cn ? "#7ee081" : catcherColor, emoji2, !cn);
  ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = "bold 28px sans-serif";
  ctx.fillText("Zeit: " + Math.ceil(timeLeft), 16, 36);
  ctx.textAlign = "right";
  ctx.fillText(nm(1) + ": " + score1 + "   " + nm(2) + ": " + score2 + "   (bis " + WIN_SCORE + ")", W - 16, 36);
  ctx.textAlign = "left";
  if (flash > 0) { ctx.fillStyle = "rgba(255,255,255," + Math.min(1, flash * 2) + ")"; ctx.fillRect(0, 0, W, H); }
  if (state === "pick") {
    ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "bold 36px sans-serif";
    ctx.fillText(nm(pickStep + 1) + ": Wähle dein Emoji!", W / 2, 110);
    ctx.font = "20px sans-serif";
    ctx.fillText("Pfeiltasten oder W/A/S/D bewegen, Enter wählen (oder anklicken). Jedes Emoji gibt es nur einmal.", W / 2, 150);
    for (let i = 0; i < 10; i++) {
      const x = CELL.x0 + (i % 5) * CELL.w, y = CELL.y0 + Math.floor(i / 5) * CELL.h;
      const taken = takenBy(i);
      ctx.fillStyle = i === cursor ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.08)";
      ctx.fillRect(x + 8, y + 8, CELL.w - 16, CELL.h - 16);
      if (i === cursor) { ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 4; ctx.strokeRect(x + 8, y + 8, CELL.w - 16, CELL.h - 16); }
      ctx.globalAlpha = taken ? 0.25 : 1; drawEmoji(choices[i], x + CELL.w / 2 - 48, y + 22, 96); ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff"; ctx.font = "18px sans-serif";
      ctx.fillText(taken ? "vergeben: " + nm(taken) : EMOJI_DEFS[choices[i]].name, x + CELL.w / 2, y + 144);
    }
    ctx.textAlign = "left";
  }
  if (state === "names") {
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.font = "bold 48px sans-serif"; ctx.fillText("Jumps", W / 2, 200);
    ctx.font = "30px sans-serif";
    ctx.fillText("Wie heißt Spieler " + (nameStep + 1) + (nameStep === 0 ? " (W / A / D)?" : " (Pfeiltasten)?"), W / 2, 280);
    ctx.font = "bold 44px sans-serif"; ctx.fillStyle = "#ffe135";
    ctx.fillText(names[nameStep] + (Math.floor(performance.now() / 500) % 2 ? "_" : " "), W / 2, 350);
    ctx.fillStyle = "#fff"; ctx.font = "22px sans-serif";
    ctx.fillText("Name tippen, dann Enter", W / 2, 410);
    ctx.textAlign = "left";
  }
  if (state === "end") bigText(winner, matchOver ? "Enter = neues Spiel" : "Enter = nächste Runde");
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(loop);
}
reset();
state = "names";
requestAnimationFrame(loop);
