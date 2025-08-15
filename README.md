# Rischis Kiosk Backend

Eine kleine Express-Anwendung zur Verwaltung eines digitalen Kiosks. Die Anwendung nutzt Supabase als Datenbank.

Zusätzlich enthält das Repository ein Multiplayer-Buzzer-Spiel, das ebenfalls Supabase zur Echtzeit-Synchronisation verwendet. Der Server stellt hierfür unter `/api/buzzer` diverse Endpunkte bereit.

## Installation

```bash
cd kiosk-backend
npm install
```

## Entwicklung starten

```bash
npm start
```

## Umgebungsvariablen

Legen Sie eine `.env` Datei im Verzeichnis `kiosk-backend` an oder nutzen Sie die bereitgestellte `.env.example` als Vorlage.

| Variable                | Beschreibung                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| `SUPABASE_URL`          | URL Ihres Supabase Projekts                                       |
| `SUPABASE_SERVICE_ROLE` | Service Role Key von Supabase                                     |
| `PORT`                  | Port, auf dem der Server läuft (optional)                         |
| `COOKIE_DOMAIN`         | Domain für Cookies (optional)                                     |
| `COOKIE_SECURE`         | `true` erzwingt Secure-Cookies                                    |
| `COOKIE_SAMESITE`       | Wert für das SameSite-Attribut                                    |
| `FORCE_HTTPS`           | `true` leitet HTTP-Anfragen auf HTTPS um                          |
| `NODE_ENV`              | Umgebung (`production`, `development`, ...) |
| `CORS_TLD`              | Top-Level-Domain, die in `production` für CORS erlaubt ist |
| `BANK_USER_NAME`        | Name des System-Users für Buzzer-Auszahlungen (optional) |

Beim Start des Servers werden diese Variablen mit einem Zod-Schema
validiert. Fehlen erforderliche Werte oder sind sie ungültig, wird der
Start abgebrochen.

## Datenbank vorbereiten

Damit Kaufvorgänge funktionieren, muss in Supabase die Funktion
`purchase_product` vorhanden sein. Führen Sie dazu das SQL-Skript
`kiosk-backend/sql/purchase_product.sql` in Ihrem Supabase-Projekt aus.

Damit stets nur eine einzige Buzzer‑Runde aktiv sein kann, empfiehlt es sich
zusätzlich das Skript `kiosk-backend/sql/unique_active_round.sql` auszuführen.
Dieses legt einen partiellen Unique‑Index auf `buzzer_rounds(active)` an.

Anschließend können Produkte im Shop gekauft werden.

## CSRF-Schutz

Der Server stellt unter `/api/csrf-token` einen Endpunkt bereit, der ein
gültiges CSRF-Token zurückliefert. Dieses muss bei schreibenden Anfragen in
das Header-Feld `x-csrf-token` übernommen werden.

## CORS-Einstellungen

Im Entwicklungsmodus sind Anfragen von allen Domains erlaubt. Wird der Server
mit `NODE_ENV=production` gestartet, akzeptiert er nur noch Ursprünge, deren
Domain auf die in `CORS_TLD` definierte Top-Level-Domain endet (Standard: `de`).

## Safari-Hinweis vermeiden

Safari auf iOS blendet gelegentlich den Text
"Wenn die Website nicht richtig funktioniert, kannst du die Datenschutzmaßnahmen
reduzieren" ein, wenn Cookies oder API-Aufrufe als Cross‑Site eingestuft werden.
Damit der Hinweis gar nicht erst erscheint, sollte möglichst alles als
First‑Party wahrgenommen werden:

1. **Backend und Frontend unter derselben Domain betreiben** –
   Idealerweise laufen Frontend und Express‑Server beide unter `rischi.de`, z. B.
   `https://rischi.de` und `https://api.rischi.de`. Wenn Supabase genutzt wird,
   kann ein [Custom Domain](https://supabase.com/docs/guides/platform/custom-domains)
   oder ein Reverse Proxy helfen.
2. **Cookies korrekt konfigurieren** – In der `.env` empfiehlt es sich,
   `COOKIE_DOMAIN=rischi.de`, `COOKIE_SECURE=true` und ein
   `COOKIE_SAMESITE` von `lax` oder `strict` zu setzen. So behandelt Safari die
   Cookies als First‑Party.
3. **Externe Skripte minimieren** – Je weniger Drittanbieter‑Skripte geladen
   werden, desto geringer ist die Wahrscheinlichkeit, dass Safari eine
   Tracking‑Gefahr vermutet.

Sind alle Cookies und API‑Calls auf dieselbe Domain ausgerichtet, verschwindet
der Safari‑Hinweis in der Regel dauerhaft.

## Formatierung und Linting

Das Projekt verwendet ESLint und Prettier zur Code-Qualität. Die folgenden Befehle stehen zur Verfügung:

```bash
npm run lint     # Code mit ESLint prüfen
npm run format   # Code mit Prettier formatieren
```

## Tools

Neben Linting und Formatierung stehen noch weitere npm-Skripte zur
Verfügung, die den Entwicklungsalltag erleichtern:

```bash
npm start        # Express-Server starten
npm test         # Tests ausführen (Platzhalter)
npm run lint     # Code mit ESLint prüfen
npm run format   # Code mit Prettier formatieren
```

## Buzzer-Spiel

Das Buzzer-Spiel ermöglicht schnelle Musikquiz-Runden. Es nutzt Supabase für Authentifizierung, Datenbankzugriffe und Realtime-Channels.

### Features

- **Rundenverwaltung** durch einen Admin
- **Echtzeit-Buzzern** und Skippen – nur der erste Buzz zählt
- Punktevergabe manuell durch den Admin
- Verteilung des Einsatzes: 95 % an Gewinner, 5 % an Bank

### API-Endpunkte (Auszug)

- `GET /api/buzzer/round` – aktive Runde abrufen
- `GET /api/buzzer/kolo` – aktuelles KOLO abrufen
- `POST /api/buzzer/round` – neue Runde starten (Admin)
- `POST /api/buzzer/round/end` – laufende Runde beenden (Admin)
- `POST /api/buzzer/join` – aktueller Runde beitreten
- `POST /api/buzzer/buzz` – im laufenden KOLO buzzern
- `POST /api/buzzer/skip` – Buzz überspringen
- `POST /api/buzzer/kolo` – neues KOLO starten (Admin)
- `POST /api/buzzer/kolo/end` – KOLO beenden und werten (Admin)

Weitere Details zum kompletten Ablauf finden sich in [docs/buzzer_flow.md](docs/buzzer_flow.md).
