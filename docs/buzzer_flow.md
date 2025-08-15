# Buzzer-Spiel – Ablauf und Funktionen

Diese Datei beschreibt den kompletten Ablauf des Buzzer-Spiels, wie es in "Rischis Kiosk" umgesetzt ist. Die Logik basiert auf Supabase und einer einfachen Express API.

## 1. Rundenstart durch den Admin

- Der Admin wählt einen Einsatz in Euro (z. B. 1 €) und ein Punktelimit (z. B. 5 Punkte) bevor eine Runde startet.
- Eine neue Runde wird in `buzzer_rounds` als aktiv gespeichert. Es kann immer nur eine aktive Runde geben.

## 2. Spieler beitreten

- Teilnahme ist nur möglich, wenn eine Runde aktiv ist.
- Klickt ein Spieler auf **Beitreten**, entsteht ein Eintrag in `buzzer_participants`.
- Der Einsatz wird sofort vom Guthaben abgezogen.
- Der Spielerstatus wird gesetzt: `has_buzzed = false`, `has_skipped = false`.

## 3. KOLO-Start durch den Admin

- Ein KOLO entspricht einem Lied oder einer Frage.
- Der Admin startet das KOLO und legt einen Eintrag in `kolos` an (`active = true`).
- Buzz und Skip der Teilnehmer werden zurückgesetzt.
- Über ein SSE-Event wird der Buzzer für alle Spieler wieder freigeschaltet.

## 4. Buzz-Phase

- Jeder Spieler darf genau **einmal** buzzern.
- Buzzes werden in `kolos.buzz_order` mit Zeitstempel gespeichert.
- Ein SQL-Trigger stellt sicher, dass nur der erste Buzz als `first = true` markiert wird.
- Nach einem Buzz kann der Spieler weder Buzz noch Skip nutzen.
- Nachdem der erste Buzz eingegangen ist, wird der Buzzer für alle anderen automatisch gesperrt.

## 5. Skip-Phase (optional)

- Alternativ darf ein Spieler genau einmal skippen.
- Die User-ID wird in `kolos.skip_user_ids` gespeichert.
- Nach einem Skip sind Buzz und Skip ebenfalls gesperrt.
- Ein Skip hat keine Auswirkung auf die Punkte.

## 6. Bewertung durch den Admin

- Der Admin sieht die Buzz-Reihenfolge.
- Entscheidet er "richtig", erhält der `first_buzzer` einen Punkt (`buzzer_participants.score`).
- Bei "falsch" gibt es keinen Punkt, aber der Buzz bleibt gespeichert.
- Der Spieler ist für dieses KOLO gesperrt.

## 7. KOLO-Ende

- Der Admin beendet das KOLO, der Eintrag wird auf inaktiv gesetzt.
- Danach kann ein neues KOLO gestartet werden (zurück zu Schritt 3).

## 8. Rundenende

- Erreicht ein Spieler das Punktelimit, muss der Admin die Runde manuell beenden.
- Über `POST /api/buzzer/round/end` wird die Runde auf inaktiv gesetzt.
- Der Gewinner wird in `buzzer_rounds.winner_id` vermerkt.

## 9. Topf und Auszahlung

- Der Gesamtpot setzt sich aus Einsatz × Teilnehmerzahl zusammen.
- Auszahlung: 95 % an den Gewinner, 5 % an den System-User "Bank".
- Änderungen am Guthaben werden in `users.balance` gespeichert.

## 10. Realtime-Funktionen

- Supabase Realtime wird für Spielstand, KOLO-Status und Buzz-Reihenfolge genutzt.
- Der Online-Status der Spieler wird in `user_sessions.online` abgebildet.

## 11. Sicherheitslogik

- Trigger stellen sicher, dass nur ein Buzz als "first" gezählt wird.
- Buzz und Skip sind pro KOLO nur einmal pro Spieler zulässig.
- Verwaltungsfunktionen sind ausschließlich für Admins sichtbar.
