
# AkquiseDashboard an FMDashboard angleichen

## Befunde aus dem Screenshot-Vergleich

Die beiden Dashboards haben folgende Unterschiede, wobei der **Finanzierungsmanager (FM) fuehrend** ist:

### 1. Visitenkarte: Fehlender Edit-Button
- **FM**: Hat einen Pencil-Button oben rechts in der Visitenkarte, der ein Profil-Edit-Sheet oeffnet
- **AM**: Kein Edit-Button vorhanden

### 2. Visitenkarte: Kein Edit-Sheet
- **FM**: Hat ein komplettes `Sheet` mit Kontaktdaten-Formular (Vorname, Nachname, E-Mail, Telefon, Adresse, Firma, Website) und §34i-Pflichtangaben
- **AM**: Kein Edit-Mechanismus vorhanden — muss analog implementiert werden (ohne §34i, aber mit Akquise-spezifischen Feldern)

### 3. Kachel-Hoehe ungleich
- Die linke Visitenkarte und die rechte KPI-Kachel haben im AM unterschiedliche Hoehen, weil kein gemeinsamer Hoehen-Constraint gesetzt ist
- **FM**: Beide Kacheln fuellen sich gegenseitig durch gleichen Content-Umfang
- **Fix**: Sicherstellen, dass beide Kacheln die gleiche Mindesthoehe haben

### 4. Sektions-Header inkonsistent
- **FM**: Nutzt `h3` mit `text-sm font-semibold uppercase tracking-wider text-muted-foreground`
- **AM**: Nutzt `h2` mit identischen Klassen — muss auf `h3` geaendert werden fuer Konsistenz

### 5. Spacing-Unterschied
- **AM** hat `mt-8` auf der zweiten Sektion ("Neue Auftraege"), FM hat keinen manuellen Margin
- **Fix**: `mt-8` entfernen, da PageShell bereits konsistentes Spacing liefert

## Aenderungen

### Datei: `src/pages/portal/akquise-manager/AkquiseDashboard.tsx`

1. **Edit-Button** in die Visitenkarte einfuegen (Pencil-Icon oben rechts, wie FM Zeile 320)
2. **Edit-Sheet** implementieren — analog zum FM-Sheet, aber ohne §34i-Felder. Felder: Vorname, Nachname, E-Mail, Mobil, Festnetz, Strasse, Hausnummer, PLZ, Ort, Firma, Website, plus optionale Akquise-spezifische Felder (z.B. Spezialisierung)
3. **EditRow-Komponente** importieren oder inline definieren (wie FM Zeile 74-83)
4. **Sektions-Header** von `h2` auf `h3` aendern (Zeilen 139 + 172)
5. **`mt-8`** am zweiten Abschnitt entfernen (Zeile 171)
6. **Kachel-Hoehe** angleichen: Sicherstellen, dass Visitenkarte und KPI-Widget gleich hoch werden (z.B. durch identischen Content-Umfang oder `min-h` Constraint)

### Keine weiteren Dateien betroffen
Die EditRow-Komponente wird direkt im AkquiseDashboard definiert (wie auch im FM), da sie spezifisch fuer das Dashboard-Edit-Sheet ist.
