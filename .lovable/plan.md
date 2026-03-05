
Ziel: Den kompletten Flow stabil machen und dann als echten End-to-End-Smoke-Test prüfen: Magic Intake → Projektdatenblatt → Landingpage-Erstellung → Landingpage (inkl. Rechner/Exposé/Verlinkungen) → Veröffentlichung/Preview → Reset → Löschprüfung.

Ist-Analyse (bereits geprüft):
1) Projekt „Menden Living“ ist vorhanden, Landingpage `menden-living` existiert (`draft`), AI-Optimierung läuft.
2) Kritische Datenlücken im Projektdatenblatt/Landingpage-Kontext:
   - `developer_contexts` hat keine `phone`/`email`/`register_court`-Spalten.
   - Mehrere Selects fragen diese Felder dennoch ab (führt zu Fehlern/Null-Resultaten und damit leeren Footer/Impressum-Daten).
3) Rechner-/Qualitätsproblem auf Landing-Startseite:
   - Tabelle nutzt `rent_net`, im Datensatz ist aber `current_rent` gefüllt (72/72), dadurch Miete/Rendite in der UI leer bzw. schwach.
4) Exposé-Download-Link-Problem:
   - `ProjectLandingObjekt` sucht über `storage_nodes.folder_path/type`; diese Spalten existieren so nicht.
   - Exposé liegt tatsächlich in `storage_nodes` (`node_type='file'`, Ordner `01_expose`), wird aber mit aktueller Query nicht gefunden.
5) Beratungsformular-Risiko:
   - Direkter Insert in `leads` aus Zone 3; Policy-Lage ist restriktiv und kann in Public/anon-Kontext brechen.

Umsetzungsplan:
Phase A — Datenkonsistenz Projektdatenblatt/Landingpage
1) `src/pages/portal/projekte/LandingPageTab.tsx`
   - `developer_contexts`-Select auf reale Spalten reduzieren.
   - Fallbacks ergänzen:
     - `footer_company_name`: zuerst Developer Context, sonst `dev_projects.seller_name`.
     - `footer_address`: nur aus realen Context-Feldern aufbauen.
     - Kontaktfelder sauber null-sicher setzen.
2) `src/pages/zone3/project-landing/ProjectLandingDatenschutz.tsx`
   - fehlerhafte `developer_contexts`-Felder entfernen (kein `email`-Select).
   - Ausgabe nur mit vorhandenen Feldern.
3) `src/pages/zone3/project-landing/ProjectLandingImpressum.tsx`
   - `register_court`-Fallback korrigieren (nicht vorhandenes Feld entfernen).
   - Impressum robust mit vorhandenen Feldern rendern.

Phase B — Landingpage-Inhalte & Verlinkungen funktional machen
4) `src/pages/zone3/project-landing/ProjectLandingHome.tsx`
   - Für Miete/Yield/Engine-Fallback `unit.rent_net ?? unit.current_rent` nutzen.
   - Summen-/Ø-Berechnungen analog korrigieren.
   - Rechner-Anker/CTA prüfen und konsistent halten.
5) `src/pages/zone3/project-landing/ProjectLandingObjekt.tsx`
   - Exposé-Abfrage auf korrektes `storage_nodes`-Schema umbauen:
     - `node_type='file'`
     - `entity_id = project.id`
     - Parent-Ordner `01_expose` ermitteln und daraus Dateien lesen.
   - Download-CTA explizit als Verkaufsexposé kennzeichnen.
6) `src/pages/zone3/project-landing/ProjectLandingExpose.tsx`
   - Verlinkungen zurück zur Projektseite/Beratung/Rechner prüfen und ggf. Text klarer machen.

Phase C — Lead-Capture robust absichern
7) Statt Direkt-Insert aus Zone 3:
   - neue Backend-Funktion für Landing-Leads (slug-validiert, tenant-sicher, serverseitiges Insert).
   - `ProjectLandingBeratung.tsx` auf diese Funktion umstellen.
   - Vorteil: kein Public-Insert auf `leads`, stabiler bei RLS.

Phase D — Reset/Smoke-Test-Absicherung
8) `useTenantReset`-Pfad validieren:
   - DB-Reset + Storage-Reset + Ledger-Logging end-to-end prüfen.
   - Falls nötig, Fehlerbehandlung verbessern (klare Status pro Phase).
9) Prüf-Skript/Checklist für Smoke-Test (ich führe danach exakt so durch):
   - A: Projektdatenblatt Vollständigkeit (Verkäufer/Anbieter/Impressumfelder)
   - B: Landingpage erzeugen
   - C: Startseite: Hero, Galerie, Highlights, Rechner, Einheiten-Tabelle
   - D: Objektseite: Verkaufsexposé Download vorhanden
   - E: Einheitenseite: Exposé + Rechner + Beratung-Link
   - F: Beratungsformular Submit erfolgreich
   - G: Veröffentlichung/Preview-Link erreichbar
   - H: Reset ausführen
   - I: Verifizieren, dass Projekt/Landing/Units/Bilder/Leads wie erwartet gelöscht oder zurückgesetzt sind

Sicherheits- und Governance-Check:
- MOD-13 ist nicht eingefroren.
- Zone3 „project-landing“ ist nicht in der Zone3-Freeze-Liste gesperrt.
- Keine Änderungen an gesperrter Infrastruktur (manifests/goldenpath) nötig.
- RLS-Öffnung für sensible Tabellen wird vermieden; Lead-Write wird serverseitig gekapselt.

Abnahme-Kriterien (Done):
1) Kein „Projekt nicht gefunden“, keine leere Template-Seite.
2) Projektdatenblatt zeigt/übernimmt Anbieter-/Verkäuferdaten korrekt.
3) Rechner zeigt realistische Werte (Mietdaten aus `current_rent` fallback).
4) Verkaufsexposé ist auf Objektseite verfügbar und downloadbar.
5) Beratungseintrag funktioniert zuverlässig.
6) Reset löscht Daten nachvollziehbar; Nachprüfung ist sauber.
