
# 🛎️ Buzzer-Spiel – Schnellstart & Ablauf

Willkommen zum Buzzer-Spiel von **Rischis Kiosk**! Hier erfährst du Schritt für Schritt, wie das Spiel funktioniert – einfach, schnell und mit Beispielen.

---

## 🚀 Das Buzzer-Spiel in 1 Minute

1. **Admin** startet eine Runde (Einsatz & Punktelimit wählen)
2. **Spieler** treten bei (Einsatz wird abgezogen)
3. **Admin** startet ein KOLO (Frage/Lied)
4. **Spieler** buzzern oder skippen
5. **Admin** bewertet den ersten Buzz
6. **Admin** beendet KOLO, ggf. neue Runde
7. **Gewinner** bekommt den Topf

---

## 1️⃣ Rundenstart durch den Admin

🛡️ **Nur Admins können Runden starten!**

- Einsatz (z. B. **1 €**) und Punktelimit (z. B. **5 Punkte**) festlegen
- Neue Runde wird als *aktiv* gespeichert (`buzzer_rounds`)
- Es kann immer nur **eine** aktive Runde geben

## 2️⃣ Spieler beitreten

- Teilnahme **nur bei aktiver Runde** möglich
- Klick auf **Beitreten** → Eintrag in `buzzer_participants`
- **Einsatz** wird sofort vom Guthaben abgezogen
- Status: `has_buzzed = false`, `has_skipped = false`

💡 **Tipp:** Wer kein Guthaben hat, kann nicht teilnehmen!

## 3️⃣ KOLO-Start durch den Admin

- Ein **KOLO** = ein Lied oder eine Frage
- Admin startet das KOLO (`kolos.active = true`)
- Buzz & Skip aller Teilnehmer werden **zurückgesetzt**
- Über ein Event wird der Buzzer für alle **freigeschaltet**

## 4️⃣ Buzz-Phase

- Jeder Spieler darf **genau einmal** buzzern
- Buzzes werden mit Zeitstempel gespeichert (`kolos.buzz_order`)
- Nur der **erste Buzz** zählt als `first = true` (SQL-Trigger)
- Nach dem Buzz: **Buzz & Skip gesperrt**
- Nach dem ersten Buzz: Buzzer für alle anderen **gesperrt**

❗ **Hinweis:** Wer zu spät buzzert, geht leer aus!

## 5️⃣ Skip-Phase (optional)

- Jeder Spieler darf **einmal skippen** (statt buzzern)
- User-ID wird in `kolos.skip_user_ids` gespeichert
- Nach Skip: **Buzz & Skip gesperrt**
- Skip hat **keine Auswirkung** auf Punkte

## 6️⃣ Bewertung durch den Admin

- Admin sieht die **Buzz-Reihenfolge**
- Bei **richtig**: `first_buzzer` bekommt einen Punkt (`buzzer_participants.score`)
- Bei **falsch**: kein Punkt, Buzz bleibt gespeichert
- Spieler ist für dieses KOLO **gesperrt**

## 7️⃣ KOLO-Ende

- Admin beendet das KOLO (auf *inaktiv* setzen)
- Danach kann ein neues KOLO gestartet werden (zurück zu Schritt 3)

## 8️⃣ Rundenende

- Erreicht ein Spieler das **Punktelimit**, muss der Admin die Runde **manuell beenden**
- Über `POST /api/buzzer/round/end` wird die Runde auf *inaktiv* gesetzt
- Gewinner wird in `buzzer_rounds.winner_id` gespeichert

## 9️⃣ Topf und Auszahlung

- **Gesamttopf** = Einsatz × Teilnehmerzahl
- **Auszahlung:** 95 % an den Gewinner, 5 % an den System-User "Bank"
- Änderungen am Guthaben werden in `users.balance` gespeichert

## 🔄 Realtime-Funktionen

- **Supabase Realtime** für Spielstand, KOLO-Status & Buzz-Reihenfolge
- Online-Status der Spieler: `user_sessions.online`

## 🔒 Sicherheitslogik

- Trigger: Nur **ein Buzz** zählt als "first"
- Buzz & Skip pro KOLO **nur einmal pro Spieler**
- **Verwaltungsfunktionen** sind nur für Admins sichtbar

---

### ℹ️ Beispielablauf

1. Admin startet Runde mit 2 € Einsatz, 3 Punkte
2. 4 Spieler treten bei (Topf: 8 €)
3. Admin startet KOLO (Song läuft)
4. Spieler A buzzert als Erster, Admin bewertet als richtig → 1 Punkt für A
5. Nächste KOLO, Spieler B skippt, Spieler C buzzert zu spät
6. Nach 3 Punkten für A: Admin beendet Runde, A gewinnt 7,60 €, Bank 0,40 €

---

**Fragen?** Siehe FAQ im Dashboard oder frage den Admin!
