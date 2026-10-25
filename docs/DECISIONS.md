# GeoRaffe — Umbau-Doku

Diese Dateien halten fest, **was entschieden wurde** und **wo der Umbau steht**.
Bei einem Abbruch/Fehlschlag: `PROGRESS.md` lesen, dort steht der letzte gute Stand.

## Dateien

| Datei | Zweck |
|---|---|
| `DECISIONS.md` | Was wir entschieden haben und **warum** — die Basis für alles Weitere |
| `PLAN.md` | Die vier Stränge, Reihenfolge, betroffene Dateien |
| `PROGRESS.md` | Laufender Fortschritt, **hier zuerst nachsehen** |

---

## Ausgangslage (Bestandsaufnahme, Stand vor dem Umbau)

Analyse des Altstands, bevor irgendetwas geändert wurde:

### Der Kern funktioniert und bleibt

- **Georeferenzierung läuft im Browser**, nicht in GDAL:
  `@allmaps/transform` (`GcpTransformer`) + `leaflet.imageoverlay.arrugator` (WebGL-Warper).
  Der Warper verzerrt das Kartenbild live per Fragment-Shader auf die OSM-Karte.
- **Transformationsarten** (`utils/enums.jsx`): `polynomial` (1st order), `polynomial2`,
  `polynomial3`, `thinPlateSpline` (TPS), `projective`.
  Werden direkt an `GcpTransformer` durchgereicht.
- **Datenschicht ist sauber**: `models/map.js` (Mongoose, ControlPoints + Markers eingebettet),
  `utils/enums.jsx` (zentrale Konstanten), strukturierte API-Routen unter `app/api/`.

### Drei Pfade, wie ein Kartenbild geladen wird

| Pfad | Datei | Lädt | Bewertung |
|---|---|---|---|
| **Editor** (GCPs setzen) | `components/GeorefMap.jsx` | XYZ-Tiles (`/{z}/{x}/{y}.png`) | klein ✅, aber wartet auf GDAL-Tiling |
| **Embed / Overlay** | `components/EmbedMap.jsx`, `components/OverlayMap.jsx` | `_reduced`-**Einzelbild** | 50–100 MB ❌ **Performance-Killer** |
| **Dashboard-Thumbnail** | `components/MyMapsDrawer.jsx` | `tiles/0/0/0.png` | klein ✅ |

### Gefundene Probleme

1. **GDAL nur noch für Tiling**, und das Tiling ist ein 2014er Python-Skript
   (`utils/gdal2tiles.py`, Header `$Id: gdal2tiles.py 27349 2014-05-16`).
   Erzwingt ein GDAL-Docker-Image (einige GB) für einen Job, den `sharp`/`libvips`
   (bereits als Dependency in `package.json`!) in Sekunden statt Minuten erledigt.
2. **Tiling + R2-Upload sind über einen Poll-Loop verdrahtet** (`utils/s3handler.jsx`,
   `startPolling`: `poll(pollDB, 5000)` + `poll(uploadTiledMapsToS3, 4000)`).
   Jeder Übergang kostet bis zu 5 s Wartezeit — daher das „sehr zeitaufwändig".
3. **20-MB-Limit ist nur ein UI-Text** (`components/CreateMapModal.jsx`, Zeile 148:
   `PNG or JPG (MAX. 20MB)`), nicht im Code durchgesetzt.
4. **`Dockerfile` klont das Repo aus GitHub** (`RUN git clone ... /app`) statt `COPY . .`
   → Build nur möglich, wenn gepusht, zweimaliges Holen, fragil.
5. **Drei konkurrierende Build-Definitionen**: `Dockerfile`, `Dockerfile_old`, `nixpacks.toml`.
6. **Liegengebliebene Altlasten**: `requirements.txt` (79 Zeilen Python, teils Jupyter),
   `utils/gdal2tiles.py` (nur Tiling), `Dockerfile_old`.

### Bewusst NICHT angefasst

- **Die Transformationsmathematik** (`differentHandedness`, Achsen-Handling, `maxDepth`,
  `maxOffsetRatio`). Verdacht auf Fehler dort wurde durch die Praxis widerlegt:
  Bei breit verteilten GCPs funktionieren TPS und 2nd order einwandfrei.
  → **Kein Fix ohne reproduzierbaren Fehler.**
- Der **datierte Fall** („TPS kaputt") tritt laut Nutzer nur bei schlecht verteilten GCPs auf.
  Idee für später, kein Auftrag jetzt: GCP-Güte-/Restfehler-Anzeige in der UI.
