
Ja — ich bin wieder an Bord.

Damit wir aus der Internal-Error-Schleife rauskommen, mache ich die Umsetzung jetzt in kleinen, stabilen Etappen statt als großen Block:

1) Stabilitäts-Fix zuerst
- `FileRowMenu` Ref-Warnung beheben (`forwardRef`-Kompatibilität im Trigger/Child), damit die UI-Konsole sauber ist.
- Kurz prüfen, ob dabei irgendwo ein harter Render-Abbruch versteckt ist.

2) MOD-12 Umbau in 3 Mini-Schritten
- Schritt A: `ObjekteingangDetail` Layout umstellen + `ExposePdfViewer` entfernen.
- Schritt B: `ObjektBasisdaten` um Anbieter/Quelle/Badge erweitern.
- Schritt C: neue Ankaufskosten-Sektion einhängen und an Bestand/Aufteiler übergeben.

3) Engine-konforme Logik
- GrESt/PLZ-Zuordnung und Nebenkosten-Prozente sauber in den passenden Engine-Scope (keine Business-Logik im UI).
- Nur verdrahten in den Kalkulationskomponenten, keine Doppel-Logik.

4) Sicherheits-/Governance-Checks vor jeder Änderung
- Freeze-Dateien prüfen (MOD-12 + ggf. Engine/Infra).
- Golden-Path/Zone-2-Konformität beibehalten.
- Keine DB-Änderung, solange nicht zwingend nötig.

5) Abschluss-Validierung
- Typecheck/Build-Konsistenz.
- E2E-Flow auf `/portal/akquise-manager/objekteingang/:offerId` prüfen: Kopf → Kalkulation → Bewertung/Aktivitäten.

Wenn du willst, starte ich jetzt direkt mit Schritt 1 + 2A (stabilster Einstieg), dann liefern wir sichtbar in kleinen, sicheren Inkrementen.
