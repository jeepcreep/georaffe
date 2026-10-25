# PROGRESS — hier zuerst nachsehen

Letzte Aktualisierung: Start des Umbaus

## Status je Strang

| Strang | Status |
|---|---|
| Doku | ✅ abgeschlossen |
| 1 — GDAL raus, `sharp`-Tiler | ✅ erledigt, Self-Check grün |
| 2 — Datei-Limit hoch | ✅ erledigt |
| 3 — Embed/Overlay auf Tiles | ✅ Variante A umgesetzt, Self-Check grün |
| 4 — UI/UX neu | ⬜ offen |

## Deployment-Fix (Healthcheck)

Coolify meldete wiederholt `unhealthy`, Log zeigte pro Versuch:
`/bin/sh: 1: curl: not found` / `wget: not found`.

**Ursache**: Coolify's HTTP-Healthcheck ruft die URL per `curl`/`wget` ab.
`node:20-slim` bringt keins von beiden mit → Exit 1 → Container gilt als unhealthy.

**Fix**:
- `Dockerfile`: `curl` via apt installiert (node:20-slim, ein Layer).
- `app/api/health/route.js`: neuer, bewusst DB- und Auth-freier Endpoint,
  liefert immer `{"status":"ok"}` mit 200. Als Healthcheck-Pfad in Coolify eintragen.
- Verifiziert: `next build` grün, `next start` + `GET /api/health` → 200.

## ⚠️ Strang 3: offene Architektur-Entscheidung

Bei der Vorbereitung zeigte sich, dass „Embed auf Tiles umstellen" **nicht** trivial ist:
Die Tiles sind Raster-Tiles (Bildkoordinaten). Embed/Overlay zeigt aber das **georeferenzierte**
Ergebnis über den `arrugator`-Live-Warp mit einem Einzelbild. Entweder müssen die Tiles erst
serverseitig georeferenziert (gewarped) werden (Variante A) — oder der Warp muss clientseitig
bleiben (Variante B, schwächer). Details in `docs/PLAN.md`.

**Vor dem Weiterbau von Strang 3 braucht es eine Entscheidung.**

## Strang 1 + 2 — was geändert wurde

**Neu**
- `utils/tiler.js` — `buildTilePyramid()`, baut XYZ-Pyramide (256px PNG) mit `sharp`.
  Reines CommonJS, damit es auch standalone testbar ist.
- `utils/tiler.test.mjs` — Self-Check (21 Kacheln für maxZoom 2, alle 256×256).

**Geändert**
- `utils/imageHandler.jsx` — `createTilesFromImage` ruft jetzt `buildTilePyramid` direkt auf
  und lädt Kacheln selbst hoch. Kein `spawn('python3', …)`, kein Poll-Loop mehr.
  Tiling + Upload sequenziell → Status `ready` sobald wirklich fertig.
- `utils/s3handler.jsx` — `startPolling`/`pollDB`/`uploadTiledMapsToS3`/`walk` entfernt
  (Poll-Loop obsolet). Nur noch S3-Helfer.
- `app/(main)/page.jsx` — Scheduler-Start-Block entfernt.
- `components/CreateMapModal.jsx` — UI-Text „MAX. 20MB" → „MAX. 200MB".
- `Dockerfile` — `node:20-slim`, `COPY . .` statt `git clone`, kein GDAL/Python/nvm.
- `package.json` — `poll`-Dependency entfernt (nirgends mehr genutzt).

**Gelöscht**
- `utils/gdal2tiles.py` (2014er Tiling-Skript)
- `requirements.txt` (79 Zeilen Python, nur für GDAL)
- `Dockerfile_old`, `nixpacks.toml` (konkurrierende Build-Definitionen)
- `app/api/services/scheduler/route.js` (nur für den Poll-Loop da)

## Offene Punkte für den Nutzer

- **Coolify**: Proxy-Limit prüfen (Traefik), falls 200-MB-Uploads abgewiesen werden.
  Next.js selbst setzt kein Limit; das alte 20 MB war reiner UI-Text.
- **Nach dem Umbau**: eine Karte testweise hochladen, Tiling-Dauer + Kacheln prüfen.

## Nebenbei behoben

- `app/api/map/[id]/upload/route.js`: toter `const { db } = await connectToDatabase();`
  auf Modulebene entfernt (Variable wurde nie benutzt, zwang aber jeden `next build`
  zu einer **erreichbaren DB**). Build läuft jetzt ohne laufende Datenbank durch.

## Verifikation

- **Tiler Self-Check**: `node utils/tiler.test.mjs` → grün (21 Kacheln, alle 256×256).
- **Build**: `npx next build` → `✓ Compiled successfully` (mit dem nächsten Lauf ohne DB-Zwang).

## Vor dem Umbau abgeschlossene Arbeiten

- **Git-Historie bereinigt** (2026): MongoDB-Passwort und `.next_old`/`.venv` (232 MB)
  aus allen 135 Commits gefiltert. `.git` von 232 MB auf 17 MB.
- `.env`/`.env.development`/`.env.production` nicht mehr getrackt, `.env.example` angelegt.
- **Offen für den Nutzer**: MongoDB-Passwort in Atlas rotieren (das alte war öffentlich).
- Backup der Vor-Filter-Historie: `/tmp/georaffe-backup/pre-filter.bundle` (löschbar).

## Wiederaufnahme nach Abbruch

1. Diese Datei lesen → letzter Stand
2. `docs/DECISIONS.md` → warum so entschieden
3. `docs/PLAN.md` → was als Nächstes
4. Git-Status prüfen: `git status`, `git log --oneline -5`

Der Umbau ist so angelegt, dass jeder Strang einzeln lauffähig ist.
Falls Strang 1+3 nicht fertig wurden: Der Altstand funktioniert weiter,
erst ab der Umstellung von `imageHandler.jsx` ist der neue Tiler aktiv.
