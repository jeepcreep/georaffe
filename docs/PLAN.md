# PLAN — Umbau in vier Strängen

Kein Rewrite. Bestehendes Projekt behalten, in Etappen modernisieren.
Die Reihenfolge ist bewusst: Strang 1+2+3 gehören zusammen, Strang 4 ist unabhängig.

---

## Strang 1 — GDAL raus, Tiling mit `sharp` ✅ Kern des Umbaus

**Ziel**: Tiling von Minuten auf Sekunden, kein GDAL-Docker mehr, kein Poll-Loop.

- `utils/gdal2tiles.py` löschen
- `requirements.txt` löschen (nur für GDAL nötig)
- Neuer Tiler `utils/tiler.js` mit `sharp` (`sharp` ist bereits Dependency)
  - Erzeugt XYZ-Kacheln (256×256 PNG) aus dem Kartenbild
  - Zoomstufen 0 bis `map.maxZoomLevel`
- `utils/imageHandler.jsx`: `createTilesFromImage` ersetzt `spawn('python3', ...)`
  durch direkten `sharp`-Aufruf — **kein Poll-Loop mehr**, Tiling und R2-Upload
  laufen sequenziell im selben Aufruf
- `utils/s3handler.jsx`: `startPolling`/`pollDB`/`uploadTiledMapsToS3` entfernen,
  nur noch die reinen S3-Helfer behalten
- `Dockerfile`: GDAL-Basis-Image → schlankes `node:20-alpine`, `COPY . .` statt `git clone`,
  kein Python mehr
- `Dockerfile_old`, `nixpacks.toml` löschen (Coolify nutzt den `Dockerfile`)

## Strang 2 — Datei-Limit hoch

**Ziel**: 20 MB ist lächerlich. Limit real hochsetzen.

- `components/CreateMapModal.jsx`: UI-Text an neues Limit anpassen
- Ggf. Next.js-Body-Limit für die Upload-Route prüfen/erhöhen
- Neues Limit: **200 MB** (deckt „nie über 200 MB" ab)

## Strang 3 — Embed/Overlay auf Tiles

**Wichtiger Fund bei der Vorbereitung** (Architektur war bei der Planung unterschätzt):

Die Tiles aus dem Tiler sind **Raster-Tiles** (Bildkoordinaten, `-p raster`). Der Editor
(`GeorefMap.jsx`) nutzt sie mit `L.RasterCoords` — dort ist das Bild noch nicht georeferenziert.

Embed und Overlay zeigen aber das **georeferenzierte** Ergebnis: Der `arrugator` warpt ein
**einzelnes Bild** per WebGL-Shader live auf die echte Weltkarte. Deshalb wird dort das
`_reduced`-Einzelbild geladen (50–100 MB) — die Tiles kennt der arrugator nicht.

„Embed auf Tiles umstellen" ist damit **nicht** einfach „TileLayer statt ImageOverlay".
Es braucht eines von:

- **A (richtig, aber größer):** Serverseitig das Bild anhand der GCPs nach Web-Mercator
  warpen und **dann** kacheln → echte georeferenzierte XYZ-Tiles. Der Embed lädt sie als
  normalen `L.tileLayer` (kein arrugator, kein 100-MB-Bild mehr).
  Machbar mit `libvips`/`sharp` `mapim` + Koordinaten-Mesh, berechnet aus den GCPs
  (`@allmaps/transform` läuft auch in Node).
- **B (kleiner, aber schwächer):** Raster-Tiles clientseitig warpen — der arrugator nimmt
  aber *ein* Bild, nicht viele Tiles. Fällt weitgehend weg.

**Empfehlung: A.** Das ist die einzige Variante, die dein Performance-Ziel wirklich erfüllt
(Browser lädt nur sichtbare Kacheln, jede Zoomstufe scharf).

**Zu beachten bei A:**
- Der Embed muss weiterhin als **Overlay mit Opacity-Regler** funktionieren (Transparenz!).
  Georeferenzierte PNG-Tiles mit Alpha können das.
- Der **Warp muss bei jeder GCP-Änderung neu laufen** (bzw. nach „Speichern").
  Das ist der Preis für Variante A.
- **Embed-URL und äußeres Verhalten bleiben identisch** (harte Randbedingung).
- Vorschau → Tiles: solange `status != ready`, die kleine arrugator-Vorschau zeigen.

**Status: offen** — wartet auf Bestätigung von Variante A.

## Strang 4 — UI/UX neu

**Ziel**: Editor und Kartenverwaltung modern und weniger sperrig.

- Editor (`components/GeorefMap.jsx`): GCP-Setzen flüssiger
- Kartverwaltung (`components/MyMapsDrawer.jsx`): zeitgemäße Darstellung
- Tiling-Status sichtbar (aus Strang 1)
- **Optionales Extra**: GCP-Güte-/Restfehler-Anzeige

---

## Reihenfolge

1. **Strang 1** — GDAL raus, `sharp`-Tiler
2. **Strang 2** — Limit hoch (klein, hängt an nichts)
3. **Strang 3** — Embed auf Tiles
4. **Strang 4** — UI/UX

Strang 1 und 3 müssen zusammen fertig werden: Ein `sharp`-Tiler ohne Embed-Umstellung
bringt nichts (Tiles werden im Embed nicht genutzt), und ein Embed auf Tiles ohne
schnellen Tiler wäre eine Verschlechterung.

---

## Harte Randbedingungen (nicht verhandelbar)

- **Embed (Strang 4 von Anfang an geschützt)**: Der Pfad `/embed/{id}` und das äußere
  Verhalten müssen identisch bleiben. Externe Quellen hängen davon ab.
- **Hosting**: Coolify, eigener Hetzner-Server, Dockerfile-basiert, Env-Vars im Panel.
  Voller Container → `sharp` direkt im Next.js-Prozess, keine Queue, kein Worker.
- **Last**: Solo-Nutzer, 20–50 MB typisch, nie >200 MB, nie parallel.
  → Keine Skalierungs-Architektur nötig.
- **Transformationsmathematik nicht anfassen** (siehe `DECISIONS.md`).
