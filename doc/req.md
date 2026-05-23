# Anforderungen: Chrome Plugin zum Export einer Confluence-Seite als Markdown

## 1. Ziel

Es soll ein Chrome-Plugin entwickelt werden, das eine aktuell geöffnete Confluence-Seite im Browser erkennt, deren relevante Inhalte extrahiert, in Markdown umwandelt und dem Nutzer als `.md`-Datei zum Download bereitstellt.

## 2. Ausgangslage

Confluence-Inhalte werden häufig für technische Dokumentation, Wissensmanagement oder Migrationen verwendet. Für Weiterverarbeitung in Git-Repositories, statischen Dokumentationssystemen oder KI-/Text-Workflows wird ein portables Textformat benötigt. Markdown ist dafür ein geeignetes Zielformat.

## 3. Zielbild

Der Nutzer öffnet eine Confluence-Seite in Chrome, startet das Plugin über das Browser-Plugin-Icon oder eine Schaltfläche im Plugin-Popup und erhält eine Markdown-Datei zum Herunterladen.

## 4. Scope

### 4.1 Im Scope

- Erkennung, dass die aktuelle Browser-Registerkarte eine Confluence-Seite ist
- Extraktion des sichtbaren bzw. relevanten Inhalts der aktuell geöffneten Confluence-Seite
- Umwandlung des Inhalts in valides Markdown
- Download des Ergebnisses als `.md`-Datei
- Sinnvolle Benennung der Datei auf Basis des Seitentitels
- Behandlung typischer Confluence-Inhaltselemente

### 4.2 Nicht im Scope (erste Version)

- Stapelverarbeitung mehrerer Seiten
- Vollständiger Space- oder Bereichsexport
- Synchronisation zurück nach Confluence
- Automatische Ablage in Git, Notion, Obsidian oder anderen Zielsystemen
- Benutzerverwaltung oder Login-Handling außerhalb der bestehenden Browser-Sitzung
- Perfekte 1:1-Abbildung sämtlicher Confluence-Makros

## 5. Zielnutzer

- Technische Redakteure
- Entwickler
- Projektteams
- Wissensmanager
- Nutzer, die Confluence-Inhalte lokal archivieren oder in Markdown-basierte Systeme überführen möchten

## 6. User Stories

### 6.1 Kern-User-Story

Als Nutzer möchte ich eine geöffnete Confluence-Seite per Chrome-Plugin in eine Markdown-Datei exportieren, damit ich den Inhalt lokal speichern oder in anderen Tools weiterverwenden kann.

### 6.2 Weitere User Stories

- Als Nutzer möchte ich den Export mit wenigen Klicks auslösen können.
- Als Nutzer möchte ich, dass Überschriften, Listen, Tabellen, Links und Codeblöcke möglichst korrekt in Markdown übernommen werden.
- Als Nutzer möchte ich einen verständlichen Dateinamen erhalten, damit ich die exportierte Datei leicht wiederfinde.
- Als Nutzer möchte ich bei nicht unterstützten Seitentypen oder Fehlern eine verständliche Fehlermeldung erhalten.
- Als Nutzer möchte ich wissen, wenn bestimmte Confluence-spezifische Elemente nicht vollständig konvertiert werden konnten.

## 7. Funktionale Anforderungen

### F1: Aktivierung auf Confluence-Seiten

Das Plugin muss erkennen können, ob die aktuell geöffnete Seite eine Confluence-Seite ist.

**Akzeptanzkriterien:**
- Das Plugin ist auf Confluence-Seiten nutzbar.
- Auf Nicht-Confluence-Seiten wird der Export deaktiviert oder es wird ein entsprechender Hinweis angezeigt.

### F2: Export der aktuell geöffneten Seite

Das Plugin muss den Inhalt der aktuell geöffneten Confluence-Seite extrahieren.

**Akzeptanzkriterien:**
- Es wird genau die aktuell geöffnete Seite exportiert.
- Seitentitel und Hauptinhalt werden erfasst.
- Navigations-, Footer- oder sonstige Seitenelemente außerhalb des eigentlichen Inhalts werden möglichst nicht übernommen.

### F3: Umwandlung in Markdown

Das Plugin muss den extrahierten Inhalt in Markdown umwandeln.

**Mindestens zu unterstützende Elemente:**
- Überschriften
- Absätze
- Fett / kursiv
- ungeordnete und geordnete Listen
- Links
- Inline-Code
- Codeblöcke
- Tabellen
- Zitate
- horizontale Trennlinien

**Akzeptanzkriterien:**
- Der erzeugte Markdown-Text ist lesbar und strukturell nachvollziehbar.
- Typische Formatierungen bleiben soweit möglich erhalten.
- HTML-Reste werden minimiert.

### F4: Dateidownload

Das Plugin muss den erzeugten Markdown-Inhalt als Datei herunterladen.

**Akzeptanzkriterien:**
- Nach erfolgreichem Export wird eine `.md`-Datei zum Download angeboten oder automatisch heruntergeladen.
- Der Dateiname basiert auf dem Seitentitel und ist für Dateisysteme bereinigt.

### F5: Plugin-Bedienung

Das Plugin muss eine einfache UI zur Auslösung des Exports bereitstellen.

**Akzeptanzkriterien:**
- Der Export kann mit maximal wenigen Klicks gestartet werden.
- Der Nutzer erhält sichtbares Feedback über Erfolg oder Fehler.

### F6: Fehlerbehandlung

Das Plugin muss typische Fehlerfälle behandeln.

**Zu behandelnde Fälle:**
- aktuelle Seite ist keine Confluence-Seite
- Seiteninhalt kann nicht gelesen werden
- Seite ist unvollständig geladen
- Konvertierung schlägt fehl
- Download schlägt fehl

**Akzeptanzkriterien:**
- Fehler werden verständlich angezeigt.
- Das Plugin bricht kontrolliert ab.

### F7: Umgang mit Confluence-spezifischen Inhalten

Das Plugin soll mit typischen Confluence-Besonderheiten pragmatisch umgehen.

**Beispiele:**
- Status-Elemente
- Info-/Warning-/Note-Boxen
- Expand-Bereiche
- Aufgabenlisten
- Emojis
- Erwähnungen
- Makros

**Akzeptanzkriterien:**
- Nicht direkt unterstützte Elemente führen nicht zum Abbruch des Exports.
- Wo möglich, erfolgt eine sinnvolle textuelle Repräsentation.
- Nicht sauber konvertierbare Inhalte können vereinfacht oder als Hinweistext übernommen werden.

## 8. Nichtfunktionale Anforderungen

### NF1: Benutzerfreundlichkeit

- Der Export soll ohne technische Vorkenntnisse nutzbar sein.
- Die Bedienoberfläche soll minimalistisch und verständlich sein.

### NF2: Performance

- Der Export einer normalen Confluence-Seite soll innerhalb weniger Sekunden abgeschlossen sein.
- Die Browser-Nutzung soll nicht spürbar beeinträchtigt werden.

### NF3: Datenschutz

- Die Konvertierung soll nach Möglichkeit lokal im Browser erfolgen.
- Es sollen keine Seiteninhalte unnötig an externe Server übertragen werden.
- Falls externe Dienste benötigt würden, müsste dies explizit ausgewiesen werden. Für die erste Version ist dies nicht vorgesehen.

### NF4: Robustheit

- Das Plugin soll auf typischen Confluence-Seiten stabil funktionieren.
- Teilweise nicht unterstützte Inhalte sollen den Export nicht komplett verhindern.

### NF5: Wartbarkeit

- Die Konvertierungslogik soll modular aufgebaut sein.
- Selektoren und Mapping-Regeln für Confluence-Inhalte sollen nachvollziehbar gepflegt werden können.

### NF6: Kompatibilität

- Zielbrowser ist Google Chrome.
- Das Plugin soll mit aktuellen Chrome-Versionen kompatibel sein.
- Primärer Fokus liegt auf aktuellen Confluence-Weboberflächen.

## 9. Fachliche Regeln

- Der exportierte Markdown-Inhalt soll sich inhaltlich am Hauptcontent der Seite orientieren.
- Der Seitentitel soll als Dateiname und optional als erste Markdown-Überschrift verwendet werden.
- Relative oder interne Links sollen nach Möglichkeit in eine nutzbare Form überführt werden.
- Inhalte, die nicht sinnvoll in Markdown abbildbar sind, sollen textuell vereinfacht statt verworfen werden, sofern dies den Informationsverlust reduziert.

## 10. Dateinamensregeln

Der Name der heruntergeladenen Datei soll:

- aus dem Confluence-Seitentitel abgeleitet werden
- ungültige Zeichen entfernen oder ersetzen
- mit der Endung `.md` gespeichert werden

**Beispiel:**
- Seitentitel: `Projektplan / Q3 2026`
- Dateiname: `Projektplan - Q3 2026.md`

## 11. Qualitätskriterien für die Markdown-Ausgabe

Die erzeugte Markdown-Datei soll:

- in gängigen Markdown-Editoren lesbar sein
- möglichst ohne manuelle Nachbearbeitung nutzbar sein
- eine sinnvolle Struktur besitzen
- keine unnötigen UI-Artefakte aus der Confluence-Seite enthalten

## 12. Technische Leitplanken

- Umsetzung als Chrome Extension
- Nutzung der Inhalte der aktuell aktiven Registerkarte
- Extraktion vorzugsweise über DOM-Auswertung der geladenen Seite
- Konvertierung möglichst vollständig im Client
- Download über Browser-Download-Mechanismus

## 13. MVP (Minimum Viable Product)

Die erste lauffähige Version muss mindestens Folgendes können:

1. Plugin in Chrome installieren
2. Confluence-Seite öffnen
3. Export per Plugin auslösen
4. Seitentitel und Hauptinhalt extrahieren
5. Grundlegende Formatierungen in Markdown umwandeln
6. `.md`-Datei herunterladen
7. Fehlerhinweis anzeigen, wenn die Seite ungeeignet ist

## 14. Erweiterungen für spätere Versionen

- Export von Anhängen oder eingebetteten Bildern
- Wahl zwischen „nur Inhalt“ und „inklusive Metadaten“
- Vorschau des generierten Markdown vor dem Download
- Kopieren des Markdown in die Zwischenablage
- Export mehrerer Seiten
- Rekursive Exportfunktion für Unterseiten
- Konfigurierbare Regeln für Makros
- Unterstützung weiterer Browser

## 15. Risiken

- Confluence verwendet je nach Version und Konfiguration unterschiedliche DOM-Strukturen.
- Dynamisch geladene Inhalte oder Makros können schwer zuverlässig zu extrahieren sein.
- Tabellen, Panels und spezielle Makros lassen sich nur begrenzt verlustfrei in Markdown abbilden.
- Änderungen an der Confluence-Oberfläche können Selektoren oder Konvertierungsregeln brechen.

## 16. Annahmen

Diese Anforderungen basieren auf folgenden Annahmen:

- Es geht zunächst um den Export einer einzelnen, aktuell geöffneten Seite.
- Der Nutzer ist bereits in Confluence eingeloggt.
- Das Plugin soll lokal im Browser arbeiten.
- Ziel ist primär ein praktikabler Markdown-Export, nicht eine perfekte visuelle 1:1-Konvertierung.

## 17. Offene Fragen

Für die weitere Spezifikation sollten folgende Punkte geklärt werden:

1. Soll nur Confluence Cloud unterstützt werden oder auch Server/Data Center?
2. Sollen Bilder nur als Links referenziert oder mit exportiert werden?
3. Sollen Anhänge berücksichtigt werden?
4. Soll der Seitentitel zusätzlich als `#`-Überschrift in die Markdown-Datei geschrieben werden?
5. Wie sollen Confluence-Makros konkret behandelt werden?
6. Soll das Plugin nur sichtbare Inhalte exportieren oder auch eingeklappte/geladene Zusatzinhalte?
7. Wird eine Vorschau des generierten Markdown benötigt?
8. Soll die Ausgabe CommonMark-kompatibel sein oder an ein bestimmtes Zielsystem angepasst werden?

## 18. Abnahmekriterien für die erste Version

Die erste Version gilt als erfolgreich, wenn:

- das Plugin auf einer typischen Confluence-Seite gestartet werden kann,
- ein Markdown-Download ausgelöst wird,
- Seitentitel, Fließtext, Überschriften, Listen, Links, Codeblöcke und Tabellen sinnvoll exportiert werden,
- die Datei einen brauchbaren Dateinamen besitzt,
- bei Fehlerfällen verständliche Rückmeldungen angezeigt werden.
