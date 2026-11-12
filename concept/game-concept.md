# Unser Spiel

## 🎮 So spielt man

- Spielname (darf sich ändern): Jumps
- Spielart: Jump’n’Run wie ein Fangspiel. Einer ist der Fänger und hat eine Minute Zeit, die anderen zu fangen. Wer von der Map runterfällt, stirbt.
- Spieler: zu zweit am selben Laptop. Gelb = Fänger (W/A/D), Grün = Flüchtling (Pfeiltasten)
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
- Punkte bekommt man für: Rundensieg (1 Punkt). Wer zuerst 10 Punkte hat, gewinnt das Spiel. Alle 5 Runden tauschen Fänger (gelb) und Läufer (grün) die Rollen
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
- skin_winner.png – Skin: grinsender Smiley (hat die letzte Runde gewonnen)
- skin_loser.png – Skin: weinender Smiley (hat die letzte Runde verloren)
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
- Hintergrund: Feuerkrater in der Wueste (nach Foto der Kinder).
- Zu zweit am selben Laptop: Spieler 1 = W/A/D (gelb), Spieler 2 = Pfeiltasten (gruen). Wer runterfaellt, verliert.
- Gelb ist jetzt der Fänger. Fängt er Grün (Berühren) in einer Minute, gewinnt er; sonst gewinnt Grün. Wer runterfällt, verliert. Grün friert Gelb mit Pfeil runter 3 Sekunden ein (1x pro Spiel).
- Plattformen verschieben sich jede Runde (Spalte -1/0/+1).
- Plattformen verschieben sich mehr: Spalte -2..+2, Zeile -1..+1.
- Plattformen werden so gemischt, dass man immer überall hinkommt (Sprungweite wird geprüft).
- Mehr Plattformen (23). Von JEDER Plattform kann man jede andere erreichen, auch nach dem Mischen.
- Punkte eingebaut: Rundensieger bekommt 1 Punkt, wer zuerst 5 hat, gewinnt.
- Rollenwechsel alle 5 Runden eingebaut, Sieg bei 10 Punkten. Spieler 1 = W/A/D, Spieler 2 = Pfeiltasten. Einfrieren: Läufer drückt S (Spieler 1) oder Pfeil runter (Spieler 2), 1x pro Runde.
- Vor dem Spiel werden die Namen der beiden Spieler abgefragt (Name tippen, Enter).
- Pinke Plattformen bewegen sich langsam links und rechts und nehmen Spieler mit.
- Jede Runde bewegt sich eine andere Farbe (etwas schneller). Ein Pfeil auf der Plattform und ein Text oben zeigen, welche.
- Goldmünze: jede Runde liegt eine auf einer zufälligen Plattform. Wer sie einsammelt, springt 30 Sekunden lang doppelt so hoch.
- Superhüpfer hält jetzt 30 Sekunden (statt bis Rundenende).
- Portale: jede Runde erscheint auf den zwei gleichfarbigen Plattformen einer Farbe je ein Portal. Wer hineinläuft, wird zum anderen teleportiert.
- Text unter der Zeit entfernt.
- Grüner Hebel: jede Runde auf einer Plattform. Wer ihn berührt, lässt alle Plattformen außer der Hebel-Plattform verschwinden. Sie erscheinen sofort an neuen Stellen (immer noch alles erreichbar).
- Hebel geändert: Alle Plattformen gleiten animiert an neue Stellen. Der Hebel zieht danach auf eine andere Plattform um und kann immer wieder benutzt werden.
- Portale verbessert: Man kann jetzt leichter wieder zurück. Man ist schon nach einem kurzen Schritt (16 px) aus dem Portal heraus und kann es erneut benutzen.
- Neue Skins (Bilder von den Kindern): Wer die letzte Runde gewonnen hat, bekommt den grinsenden Smiley, wer verloren hat den weinenden. Ein Ring zeigt die Rolle (gelb = Fänger, grün = Läufer).
