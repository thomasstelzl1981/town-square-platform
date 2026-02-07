
# Umfassende Überarbeitung: Exposé-Tab & Mieten-SSOT

## Zusammenfassung der gefundenen Probleme

### Problem 1: Falsches Mieten-Label im Exposé-Tab
**Zeile 213 in `ExposeTab.tsx`:**
```tsx
<InfoRow label="Warmmiete" value={formatCurrency(unit.current_monthly_rent)} />
```
- `unit.current_monthly_rent` enthält die **Kaltmiete** (682 €), nicht die Warmmiete!
- Die Datenbank zeigt: `current_monthly_rent = 682` und `ancillary_costs = 155` (Nebenkosten)
- Warmmiete wäre: 682 + 155 = 837 €

### Problem 2: Objektbeschreibung fehlt
- Die `ExposeDescriptionCard` wurde **nie erstellt** (File not found)
- Der statische Block in Zeile 117-126 zeigt nur vorhandene Beschreibungen, bietet aber keine Bearbeitung

### Problem 3: ExposeHeadlineCard UI-Flackern
- Nach dem Speichern wird `queryClient.invalidateQueries` aufgerufen, was die ganze Seite neu lädt
- Optimistisches Update fehlt

### Problem 4: Karte über volle Breite
- Die `PropertyMap`-Komponente nimmt die gesamte Breite ein (unschön)
- Vorschlag: Objektbeschreibung links, Karte rechts (je 50%)

### Problem 5: Daten-SSOT nicht konsistent
Die **Leases-Tabelle** ist der SSOT für Mietdaten, aber das Exposé liest von der **Units-Tabelle**:
- Leases hat: `rent_cold_eur`, `nk_advance_eur`, `heating_advance_eur` (korrekt aufgeteilt)
- Units hat nur: `current_monthly_rent`, `ancillary_costs` (redundant, veraltet)

---

## Lösungsplan

### Phase 1: Mieten-Labels korrigieren (ExposeTab.tsx)

**Aktuelle fehlerhafte Darstellung (Zeile 210-220):**
```tsx
<InfoRow label="Warmmiete" value={formatCurrency(unit.current_monthly_rent)} />
<InfoRow label="NK-Vorauszahlung" value={formatCurrency(unit.ancillary_costs)} />
```

**Korrekte Darstellung:**
| Label | Quelle | Beschreibung |
|-------|--------|--------------|
| Kaltmiete | `leases.rent_cold_eur` | Nettokaltmiete |
| NK-Vorauszahlung | `leases.nk_advance_eur` | Nebenkosten-Vorauszahlung |
| Heizkosten-VZ | `leases.heating_advance_eur` | Falls vorhanden |
| **Warmmiete** | Summe aller obigen | Bruttowarmmiete |

**Änderung:** Das Exposé muss die Lease-Daten laden, nicht die Unit-Daten.

### Phase 2: ExposeDescriptionCard erstellen

Neue Komponente `src/components/verkauf/ExposeDescriptionCard.tsx`:
- Editierbare Textarea für `properties.description`
- KI-Generierungs-Button (ruft `sot-expose-description` Edge Function auf)
- Speichert direkt in `properties.description`
- Optimistisches Update nach Speichern

### Phase 3: Layout-Überarbeitung (Beschreibung + Karte)

**Neues Layout:**
```
+-------------------------------+-------------------------------+
| Objektbeschreibung (editbar)  | Karte (quadratisch)           |
| - Textarea                    | - 300px Höhe                  |
| - KI-Button                   | - Google Maps Embed           |
+-------------------------------+-------------------------------+
```

Änderungen in `ExposeTab.tsx`:
- Grid mit 2 Spalten für Beschreibung + Karte
- `PropertyMap` bekommt feste Höhe (quadratisch: ca. 300px x 300px)

### Phase 4: ExposeHeadlineCard optimieren

Änderungen:
1. **Optimistisches Update:** Nach Speichern lokalen State aktualisieren, nicht invalidieren
2. **Query-Invalidierung entfernen:** Verhindert Flackern
3. **Textgrößen anpassen:** Headline größer (text-2xl), Subline kleiner (text-sm)

### Phase 5: Lease-Daten im Exposé verwenden (SSOT-Konformität)

**Option A (empfohlen):** ExposeTab erhält Lease-Daten als Props

Die `PropertyDetailPage` lädt bereits `dossierData` via `usePropertyDossier`, welches die korrekten Lease-Summen enthält:
- `rentColdEur` (Kaltmiete aus Leases)
- `nkAdvanceEur` (NK-Vorauszahlung aus Leases)
- `heatingAdvanceEur` (Heizkosten-VZ aus Leases)
- `rentWarmEur` (berechnete Summe)

**Lösung:** ExposeTab bekommt `dossierData` als zusätzliche Props und verwendet diese für die Mieten-Anzeige.

---

## Technische Änderungen

### Datei 1: `src/components/portfolio/ExposeTab.tsx`

Änderungen:
1. **Props erweitern:** Neues Prop `dossierData` für Lease-basierte Mietdaten
2. **Miete-Card korrigieren:** Kaltmiete, NK-VZ, (Heiz-VZ), Warmmiete
3. **Layout-Änderung:** Beschreibung + Karte in 2-Spalten-Grid
4. **Import:** `ExposeDescriptionCard` importieren

### Datei 2: `src/components/verkauf/ExposeDescriptionCard.tsx` (NEU)

Neue Komponente:
- Inline-Editing für Objektbeschreibung
- KI-Generierung über Edge Function
- Speichert in `properties.description`
- Optimistisches Update

### Datei 3: `src/components/verkauf/ExposeHeadlineCard.tsx`

Änderungen:
1. Query-Invalidierung durch optimistisches Update ersetzen
2. Textgrößen verbessern

### Datei 4: `src/components/portfolio/PropertyMap.tsx`

Änderungen:
- Card-Wrapper entfernen (wird in ExposeTab gehandhabt)
- Flexible Höhe ermöglichen via Props

### Datei 5: `src/pages/portal/immobilien/PropertyDetailPage.tsx`

Änderungen:
- `dossierData` an ExposeTab weitergeben

---

## Datenfluss nach Implementierung

```
leases (SSOT)
    │
    ├── rent_cold_eur ─────────┐
    ├── nk_advance_eur ────────┼──► usePropertyDossier ──► dossierData
    ├── heating_advance_eur ───┘            │
    │                                       ▼
    │                              ExposeTab (Props)
    │                                       │
    │                                       ▼
    │                              Miete-Card (korrekt!)
    │                              ├─ Kaltmiete: 682 €
    │                              ├─ NK-VZ: 155 €
    │                              └─ Warmmiete: 837 €

properties (SSOT für Beschreibung)
    │
    └── description ──► ExposeDescriptionCard ──► Editierbar + KI
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/portfolio/ExposeTab.tsx` | Props erweitern, Mieten-Labels korrigieren, Layout 2-spaltig |
| `src/components/verkauf/ExposeDescriptionCard.tsx` | **Neue Datei** |
| `src/components/verkauf/ExposeHeadlineCard.tsx` | Optimistisches Update, UI-Verbesserungen |
| `src/components/portfolio/PropertyMap.tsx` | Flexible Höhe, kein Card-Wrapper |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | dossierData an ExposeTab übergeben |
| `src/pages/portfolio/PropertyDetail.tsx` | dossierData an ExposeTab übergeben (falls verwendet) |

---

## Erwartetes Ergebnis

Nach der Implementierung:
1. **Miete-Card zeigt korrekt:** Kaltmiete 682 €, NK-VZ 155 €, Warmmiete 837 €
2. **Objektbeschreibung:** Editierbar direkt im Exposé mit KI-Generierung
3. **Layout:** Beschreibung links, Karte rechts (je 50%)
4. **Kein Flackern:** Headline-Speicherung erfolgt optimistisch
5. **SSOT-konform:** Alle Mietdaten kommen aus `leases`, nicht aus `units`
