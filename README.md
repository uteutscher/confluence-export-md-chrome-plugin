# Confluence Export to Markdown

Chrome Extension (Manifest V3) zum Export der aktuell geoeffneten **Confluence Cloud**-Seite als **GitHub Flavored Markdown**.

## MVP-Funktionen

- erkennt unterstuetzte Confluence-Cloud-Seiten
- exportiert den Hauptinhalt der aktuellen Seite
- wandelt Standard-HTML und typische Confluence-Elemente in Markdown um
- laedt das Ergebnis als `.md`-Datei herunter
- zeigt Erfolg, Warnungen oder Fehler im Popup an

## Aktueller Scope

Unterstuetzt im MVP:

- Confluence Cloud
- regulaere Seiten
- Markdown-Export als einzelne Datei
- lokale Verarbeitung im Browser

Nicht im MVP:

- Confluence Server / Data Center
- Mehrseiten- oder rekursive Exporte
- Bild- oder Attachment-Bundles
- Vorschau vor dem Download
- Ruecksync nach Confluence

## Projektstruktur

- `src/core/` - Kernlogik fuer Seitenerkennung, Extraktion, Markdown-Konvertierung und Dateinamen
- `src/content/` - Content-Script und Export-Orchestrierung in der Confluence-Seite
- `src/background/` - Background-Service-Worker fuer Popup-Anfragen und Download
- `src/popup/` - Popup-UI und Statusanzeige
- `tests/` - Vitest-Tests fuer Kernlogik und Popup
- `public/manifest.json` - Extension-Manifest

## Voraussetzungen

- Node.js
- Google Chrome

## Installation fuer Entwicklung

```bash
npm install
```

## Verfuegbare Skripte

```bash
npm test
npm run build
npm run test:watch
```

## Extension bauen

```bash
npm run build
```

Der Build liegt danach in `dist/`.

## Extension in Chrome laden

1. `chrome://extensions` oeffnen
2. **Developer mode** aktivieren
3. **Load unpacked** waehlen
4. den Ordner `dist/` auswaehlen

## Verwendung

1. Eine unterstuetzte Confluence-Cloud-Seite oeffnen
2. Das Extension-Popup oeffnen
3. **Export Markdown** klicken
4. Die generierte `.md`-Datei herunterladen

## Technische Basis

- TypeScript
- Vite
- Vitest
- Turndown
- turndown-plugin-gfm

## Hinweise

- Die Extension ist auf Confluence-Cloud-DOM-Strukturen ausgerichtet.
- Confluence-Makros werden beim Export ignoriert.
- Teilweise vereinfachte Inhalte werden als Warnungen behandelt, nicht als harter Fehler.
