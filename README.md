## Supabase-Keys für Mentos-Tracker (Render)

Damit die Mentos-Seite funktioniert, müssen die Supabase-URL und der Anon-Key als Umgebungsvariablen im Render-Dashboard hinterlegt werden:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Im Code (`mentos.js`) werden Platzhalter (`{{ SUPABASE_URL }}` und `{{ SUPABASE_ANON_KEY }}`) verwendet. Diese werden beim Deployment automatisch durch die echten Werte ersetzt.

**Empfohlener Build/Start-Befehl für Render:**

```sh
sed -i "s|{{ SUPABASE_URL }}|$SUPABASE_URL|g; s|{{ SUPABASE_ANON_KEY }}|$SUPABASE_ANON_KEY|g" kiosk-backend/public/mentos.js
# Danach wie gewohnt starten, z.B.:
npm start
```

So sind die Keys nie im Git, aber zur Laufzeit im Frontend verfügbar.
# Rischis Kiosk Backend

Eine kleine Express-Anwendung zur Verwaltung eines digitalen Kiosks. Die Anwendung nutzt Supabase als Datenbank.



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


Beim Start des Servers werden diese Variablen mit einem Zod-Schema
validiert. Fehlen erforderliche Werte oder sind sie ungültig, wird der
Start abgebrochen.

## Datenbank vorbereiten

Damit Kaufvorgänge funktionieren, muss in Supabase die Funktion
`purchase_product` vorhanden sein. Führen Sie dazu das SQL-Skript
`kiosk-backend/sql/purchase_product.sql` in Ihrem Supabase-Projekt aus.

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


