# Unser Spiel

## 🎮 So spielt man

- Spielname (darf sich ändern): Jumps
- Spielart: Jump’n’Run wie ein Fangspiel. Einer ist der Fänger und hat eine Minute Zeit, die anderen zu fangen. Wer von der Map runterfällt, stirbt.
- Spieler: allein (die anderen steuert der Computer)
- Unsere Spielfigur: Smiley mit Beinen
- So steuert man sie: Tasten W (springen), A (links), D (rechts)
- Das ist das Ziel: Nicht runterfallen und nicht vom Computer gefangen werden. Nach einer Minute hat der Spieler gewonnen.
- Das sind die Gefahren: Runterfallen und vom Computer gefangen werden (sonst keine)
- Man verliert, wenn: man runterfällt oder vom Computer gefangen wird

## 🎨 So sieht es aus

- Unsere Welt: Der Hintergrund sieht aus wie der Himmel. Die Map ist ein Raster, und ein Rasterfeld ist ein Block (wie in Minecraft). Die Map ist so groß wie der Bildschirm. Zwei Blöcke bilden eine Plattform, jede Plattform hat eine andere Farbe. Die Plattformen schweben in der Luft. Man muss von einer zur anderen kommen, auch hoch und runter.
- Zeichenstil: Pixel
- Gegner und Hindernisse: Wütende Smileys (sie fangen den Spieler)
- Extras zum Sammeln: keine
- Punkte bekommt man für: keine Punkte
- Unsere besondere Idee: Mit der E-Taste kann man den Fänger für 3 Sekunden einfrieren, aber nur einmal pro Spiel

## 🛠️ Unsere erste Version

Zum Start: eine Figur, ein kurzer Level, eine Gefahr und ein Ziel.

- Das muss schon funktionieren: Smiley läuft und springt, ein Gegner jagt ihn, eine Minute Zeit, Gewinnen und Verlieren
- Das kommt später: mehr Gegner (Einfrieren mit E ist schon drin)
- Wer übernimmt was: Laptop 1 macht den Code, Laptop 2 macht die Bilder

## 🔊 Später entscheiden

- Sounds:
- Musik:

## 📁 Unsere Bilder

Ordner: `art/`

Alle Bilder im gleichen Stil.
Figuren und Gegenstände einzeln und mit durchsichtigem Hintergrund.

Dateinamen:
- player_idle.png – Spieler steht
- player_jump.png – Spieler springt
- enemy_bat.png – Fledermaus
- item_coin.png – Münze
- background_forest.png – Wald
- platform_grass.png – Grasplattform

## Änderungen

(Hier schreibt Claude auf, was ihr geändert habt.)

- Spielname eingetragen: Jumps.
- Spielart eingetragen: Jump'n'Run als Fangspiel, 1 Minute Zeit, runterfallen = sterben.
- Spieler eingetragen: allein, Computer steuert die anderen.
- Spielfigur eingetragen: Smiley mit Beinen.
- Steuerung eingetragen: W, A, D.
- Ziel und Verlieren eingetragen: nicht runterfallen, nicht gefangen werden.
- Gewinnen eingetragen: nach einer Minute hat der Spieler gewonnen.
- Gefahren eingetragen: nur runterfallen und gefangen werden.
- Zeichenstil eingetragen: Pixel.
- Gegner eingetragen: wütende Smileys.
- Extras: keine.
- Punkte: keine.
- Erste Version eingetragen.
- Aufgaben eingetragen: Laptop 1 Code, Laptop 2 Bilder.
- Besondere Idee eingetragen: E-Taste friert den Fänger 3 Sekunden ein, nur einmal pro Spiel.

- Welt eingetragen: Himmel, Raster aus Blöcken, Plattformen aus 2 Blöcken in verschiedenen Farben.
- Einfrieren mit E-Taste eingebaut.
- Fänger bewegt sich jetzt schlauer (zielt voraus, wechselt Tempo, macht Pausen).
- Fänger gefährlicher gemacht (schneller, weniger Pausen).
- Fänger vorerst aus dem Spiel genommen (CHASER_ON = false in src/game.js).
- Map 25% groesser gemacht (MAP_SCALE = 1.25).
- Blockraster kleiner (40px, 30x17 Bloecke) und mehr Plattformen (14).
- Decke eingebaut: man kann oben nicht mehr rausspringen.
