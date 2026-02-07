
# Umsetzungsplan: Bereinigung Identitätsblock, Grundbuch-Felder & Mieterverwaltung

## Executive Summary

Dieser Plan umfasst vier zentrale Umstrukturierungen:
1. **Kategorie-Dropdown**: Ersetzen von "Einzelobjekt/Globalobjekt" durch praxisrelevante Immobilientypen
2. **Status-Anzeige**: Toggles für "Verkauf/Vermietung/WEG" durch lesbare Ampel-Indikatoren ersetzen
3. **Grundbuch-Felder**: MEA-Anteil und TE-Nummer als separate Felder im Legal-Block konsolidieren
4. **Mieterverwaltung**: Akte-Block zeigt nur Zusammenfassung; vollständige Vertragsverwaltung im Mietverhältnis-Tab

---

## Teil 1: Kategorie-Dropdown bereinigen

### Ist-Zustand

In `EditableIdentityBlock.tsx` (Zeile 33-36):
```typescript
const CATEGORIES: { value: PropertyCategory; label: string }[] = [
  { value: 'einzelobjekt', label: 'Einzelobjekt' },
  { value: 'globalobjekt', label: 'Globalobjekt (Mehrere Einheiten)' },
];
```

**Problem:** "Einzelobjekt/Globalobjekt" ist eine technische Unterscheidung ohne praktischen Nutzen für den Anwender.

### Soll-Zustand

Das bestehende "Objektart"-Feld (`propertyType`) enthält bereits die korrekten Werte:
```typescript
const PROPERTY_TYPES = [
  { value: 'ETW', label: 'Eigentumswohnung' },
  { value: 'EFH', label: 'Einfamilienhaus' },
  { value: 'MFH', label: 'Mehrfamilienhaus' },
  { value: 'DHH', label: 'Doppelhaushälfte' },
  { value: 'RH', label: 'Reihenhaus' },
  { value: 'Gewerbe', label: 'Gewerbeobjekt' },
  { value: 'Grundstueck', label: 'Grundstück' },
];
```

### Umsetzung

**Änderungen in `EditableIdentityBlock.tsx`:**
1. Das "Kategorie"-Dropdown (Zeile 103-115) komplett entfernen
2. Die Prop `category` entfernt sich aus dem Interface
3. Das "Objektart"-Dropdown bleibt bestehen und übernimmt die Funktion

**Änderungen in Datenbank:**
- Keine Migration nötig; das `category`-Feld kann bestehen bleiben, wird aber nicht mehr im UI angezeigt
- Alternativ: Später `category` als deprecated markieren

---

## Teil 2: Toggles durch Status-Ampeln ersetzen

### Ist-Zustand

Im `EditableIdentityBlock.tsx` (Zeile 148-173):
```
┌─────────────────────────────────────────────┐
│ [Toggle] Verkauf aktiv                      │
│ [Toggle] Vermietung verwaltet               │
│ [Toggle] WEG                                │
└─────────────────────────────────────────────┘
```

**Probleme:**
1. Toggles suggerieren direkte Steuerung - aber Aktivierung erfordert Workflows/Verträge
2. WEG ist ein Sachverhalt (ja/nein), kein zu aktivierendes Feature
3. Keine Unterscheidung zwischen Status und Aktivierung

### Soll-Zustand

```
┌─────────────────────────────────────────────┐
│ Verkauf    [🔴 Nicht aktiv] [🟡 Beantragt] [🟢 Aktiv]
│ Vermietung [🔴 Nicht aktiv] [🟡 Beantragt] [🟢 Aktiv]
│                                              │
│ → Aktivierung erfolgt im Tab "Features"      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Objekttyp:  WEG [Ja/Nein Auswahl]           │
│ (Bei "Ja" erscheint WEG-Block)              │
└─────────────────────────────────────────────┘
```

### Umsetzung

**Neue Komponente: `StatusIndicator.tsx`**
```typescript
// Zeigt Ampel-Status für Verkauf/Vermietung
interface StatusIndicatorProps {
  label: string;
  isActive: boolean;
  isPending?: boolean; // Falls Antrag läuft
}

function StatusIndicator({ label, isActive, isPending }: StatusIndicatorProps) {
  const color = isActive ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-gray-300';
  const text = isActive ? 'Aktiv' : isPending ? 'Beantragt' : 'Nicht aktiv';
  
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-sm">{label}: {text}</span>
    </div>
  );
}
```

**Änderungen in `EditableIdentityBlock.tsx`:**
1. Ersetze Switch-Komponenten durch `StatusIndicator`
2. WEG-Toggle bleibt als Select (Ja/Nein) - da dies ein Sachverhalt ist, kein Feature
3. Hinzufügen: Link/Hinweis "→ Aktivierung im Tab Features"

**Logik-Flow:**
- `sale_enabled` und `rental_managed` werden read-only angezeigt
- Änderung erfolgt nur über `FeaturesTab` (bereits implementiert mit `property_features`)
- Der FeaturesTab steuert die eigentliche Aktivierung mit Workflow-Unterstützung

---

## Teil 3: MEA-Anteil und TE-Nummer konsolidieren

### Ist-Zustand

**Problem 1: Doppelte Felder**
- `EditableIdentityBlock.tsx` (Zeile 175-184): "MEA/TE-Nr." als kombiniertes Feld
- `EditableLegalBlock.tsx` (Zeile 89-96): "TE-Nummer" separates Feld
- `EditableWEGBlock.tsx` (Zeile 71-91): "MEA Anteil" und "MEA Gesamt"

**Problem 2: Datenbankstruktur**
- `properties.te_number` → TE-Nummer auf Property-Ebene
- `units.mea_share` → MEA-Anteil auf Unit-Ebene

**Problem 3: Unterschiedliche Bedeutungen vermischt**
- **MEA-Anteil** = Miteigentumsanteil (z.B. 42,5/1000) → WEG-Block korrekt
- **TE-Nummer** = Teileigentumsnummer im Grundbuch → Legal-Block korrekt

### Soll-Zustand

| Feld | Block | Bedeutung |
|------|-------|-----------|
| **MEA-Anteil** | WEG-Block | Numerischer Anteil (z.B. 42,5 von 1000) |
| **TE-Nummer** | Grundbuch-Block | Grundbuch-Bezeichnung (z.B. "TE 42") |

Das kombinierte Feld "MEA/TE-Nr." im Identitäts-Block wird entfernt.

### Umsetzung

**1. `EditableIdentityBlock.tsx`:**
- Entferne das Feld "MEA/TE-Nr." (Zeile 175-184) komplett
- WEG-Toggle wird zu einem Select-Dropdown

**2. `EditableLegalBlock.tsx`:**
- Behalte "TE-Nummer (Wohnungseigentum)" (bereits vorhanden, Zeile 89-96)
- Keine Änderung nötig

**3. `EditableWEGBlock.tsx`:**
- Behalte "MEA Anteil" und "MEA Gesamt" (bereits vorhanden, Zeile 71-91)
- Keine Änderung nötig

---

## Teil 4: Mieterverwaltung neu strukturieren

### Ist-Zustand

**Im Akte-Tab (`EditableTenancyBlock.tsx`):**
- Vollständige Mietvertragsdetails direkt editierbar
- Zeigt Daten aus `leases[0]` (erster Mietvertrag)
- Mieter-Name ist read-only (verknüpft über Kontakte)
- Keine Unterstützung für mehrere Mietverträge

**Im Mietverhältnis-Tab (`TenancyTab.tsx`):**
- Mietvertrag anlegen mit Kontakt-Auswahl
- Aktivieren/Deaktivieren des Mietvertrags
- Mieter zum Portal einladen

**Problem:**
- Doppelte Funktionalität
- Mehrere Mieter pro Einheit nicht abgebildet
- Wo legt man einen neuen Mieter (Kontakt) an?

### Soll-Zustand

```
┌─────────────────────────────────────────────────────────────┐
│ AKTE-TAB: Mietverhältnis (Zusammenfassung)                  │
├─────────────────────────────────────────────────────────────┤
│ Status:        [🟢 Vermietet] / [🔴 Leerstand]              │
│ Akt. Verträge: 1                                            │
│ Gesamtmiete:   1.250,00 € (warm)                            │
│ Mieter seit:   01.01.2020                                   │
│                                                             │
│ → Vollständige Verwaltung im Tab "Mietverhältnis"          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MIETVERHÄLTNIS-TAB: Vollständige Verwaltung                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [+ Neuen Mietvertrag anlegen]                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ AKTIVE VERTRÄGE (1)                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Müller, Hans                                            │ │
│ │ 750,00 € Kaltmiete + 150,00 € NK + 100,00 € Heizung     │ │
│ │ Beginn: 01.01.2020 | Unbefristet                        │ │
│ │ [Bearbeiten] [Kündigen] [Einladen]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ HISTORISCHE VERTRÄGE (2)                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Schmidt, Peter (beendet 31.12.2019)                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Kontakt-Erstellung:**
- Kontakte werden im **Office → Kontakte** angelegt (bereits implementiert)
- Bei Mietvertrag-Anlage wird bestehender Kontakt ausgewählt
- Optional: "Neuen Kontakt anlegen" direkt im Dialog

### Umsetzung

**1. `EditableTenancyBlock.tsx` → `TenancySummaryBlock.tsx`**

Neue vereinfachte Komponente:
```typescript
interface TenancySummaryBlockProps {
  tenancyStatus: TenancyStatus;
  activeLeasesCount: number;
  totalRentWarmEur: number;
  tenantSince?: string;
  onNavigateToTab?: () => void;
}

function TenancySummaryBlock({...}: TenancySummaryBlockProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mietverhältnis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Badge>{tenancyStatus === 'ACTIVE' ? 'Vermietet' : 'Leerstand'}</Badge>
          </div>
          <div>
            <Label>Aktive Verträge</Label>
            <span>{activeLeasesCount}</span>
          </div>
          <div>
            <Label>Gesamtmiete (warm)</Label>
            <span>{totalRentWarmEur.toLocaleString('de-DE')} €</span>
          </div>
          <div>
            <Label>Mieter seit</Label>
            <span>{tenantSince || '–'}</span>
          </div>
        </div>
        <Button variant="link" onClick={onNavigateToTab}>
          → Vollständige Verwaltung
        </Button>
      </CardContent>
    </Card>
  );
}
```

**2. `TenancyTab.tsx` erweitern**

Neue Funktionen:
- Liste aller Mietverträge (aktiv + historisch)
- Vollständiger Mietvertrag-Editor im Dialog
- Unterstützung für mehrere Mieter pro Einheit
- Integration des bestehenden "Mieter einladen"-Flows

```typescript
// Erweiterte Query für alle Leases
const { data: allLeases } = useQuery({
  queryKey: ['unit-leases', unitId],
  queryFn: async () => {
    const { data } = await supabase
      .from('leases')
      .select(`
        *,
        tenant_contact:contacts!tenant_contact_id(id, first_name, last_name, email)
      `)
      .eq('unit_id', unitId)
      .order('start_date', { ascending: false });
    return data;
  }
});

// Gruppierung
const activeLeases = allLeases?.filter(l => ['active', 'notice_given'].includes(l.status));
const historicalLeases = allLeases?.filter(l => ['terminated', 'ended'].includes(l.status));
```

**3. Mietvertrag-Dialog erweitern**

Der bestehende Dialog in `TenancyTab.tsx` (Zeile 297-358) wird erweitert:
- Alle Felder aus dem alten `EditableTenancyBlock` übernehmen:
  - Vertragsart (unbefristet, befristet, Staffel, Index, Gewerbe)
  - Kaltmiete, NK-Vorauszahlung, Heizkosten-Vorauszahlung
  - Kaution und Kaution-Status
  - Zahlungstag
  - Mietmodell (Fix, Index, Staffel)
  - Nächste Anpassung

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/immobilienakte/editable/EditableIdentityBlock.tsx` | Kategorie entfernen, Toggles durch Ampeln ersetzen, MEA/TE-Feld entfernen |
| `src/components/immobilienakte/editable/EditableTenancyBlock.tsx` | Umbenennen zu `TenancySummaryBlock.tsx`, vereinfachen |
| `src/components/portfolio/TenancyTab.tsx` | Erweitern um Multi-Lease-Support und vollständigen Editor |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Neue Summary-Komponente einbinden |
| `src/types/immobilienakte.ts` | `PropertyCategory` als deprecated markieren (optional) |
| `src/hooks/useUnitDossier.ts` | Aggregierte Mieter-Daten berechnen (`leasesCount`, `totalRentWarm`) |

---

## Datenfluss nach Implementierung

```
┌───────────────────────────────────────────────────────────────┐
│                    KONTAKTE (Office)                          │
│   Hier werden alle Personen angelegt:                         │
│   - Mieter, Verwalter, Makler, Handwerker etc.                │
└───────────────────────────────────────────────────────────────┘
                            ↓
                    (Kontakt auswählen)
                            ↓
┌───────────────────────────────────────────────────────────────┐
│                 MIETVERHÄLTNIS-TAB                            │
│   - Neuen Mietvertrag anlegen (Kontakt verknüpfen)            │
│   - Vertragsdetails pflegen (Miete, Laufzeit etc.)            │
│   - Mietvertrag aktivieren/kündigen                           │
│   - Mieter zum Portal einladen                                │
└───────────────────────────────────────────────────────────────┘
                            ↓
                    (Aggregierte Daten)
                            ↓
┌───────────────────────────────────────────────────────────────┐
│                    AKTE-TAB                                   │
│   Mietverhältnis-Block zeigt nur:                             │
│   - Status (Vermietet/Leerstand)                              │
│   - Anzahl aktive Verträge                                    │
│   - Gesamtmiete (warm)                                        │
│   - Link zur vollständigen Verwaltung                         │
└───────────────────────────────────────────────────────────────┘
```

---

## Verkauf/Vermietung Aktivierung (Features-Tab)

Der bestehende `FeaturesTab.tsx` (Zeile 25-41) enthält bereits:
- `msv` (Miety/Mieterverwaltung) → Entspricht `rental_managed`
- `kaufy` (Verkauf) → Entspricht `sale_enabled`

**Workflow:**
1. Nutzer klickt im Features-Tab auf "MSV aktivieren"
2. System prüft Voraussetzungen (z.B. Mietvertrag vorhanden)
3. Bei Erfolg: `property_features.status = 'active'`
4. Die Ampel im Identitäts-Block zeigt "Grün"

**Erweiterung (optional):**
- Vor Aktivierung: Bestätigungs-Dialog mit Hinweis auf Kosten/Vertrag
- Nach Aktivierung: Automatische E-Mail an Nutzer

---

## Testplan

### Test 1: Kategorie-Feld entfernt
1. Akte-Tab öffnen
2. **Prüfen:** Kein Dropdown "Kategorie" mehr sichtbar
3. **Prüfen:** "Objektart" (ETW, EFH, etc.) ist weiterhin wählbar

### Test 2: Status-Ampeln
1. Akte-Tab öffnen (Immobilie ohne aktive Features)
2. **Prüfen:** Verkauf zeigt "Grau" (Nicht aktiv)
3. **Prüfen:** Vermietung zeigt "Grau" (Nicht aktiv)
4. Features-Tab → MSV aktivieren
5. Zurück zu Akte-Tab
6. **Prüfen:** Vermietung zeigt jetzt "Grün" (Aktiv)

### Test 3: WEG-Auswahl
1. Akte-Tab öffnen
2. WEG auf "Ja" setzen
3. **Prüfen:** WEG-Block erscheint mit MEA-Anteil und Hausgeld-Feldern
4. WEG auf "Nein" setzen
5. **Prüfen:** WEG-Block zeigt "Kein Wohnungseigentum"

### Test 4: Grundbuch-Felder
1. Akte-Tab → Block "Grundbuch & Erwerb"
2. **Prüfen:** Feld "TE-Nummer" vorhanden
3. Wert eingeben: "TE 42"
4. Speichern
5. **Prüfen:** Wert wird gespeichert

### Test 5: MEA im WEG-Block
1. WEG aktivieren (Ja)
2. WEG-Block → MEA-Anteil eingeben: "42.5"
3. MEA Gesamt eingeben: "1000"
4. Speichern
5. **Prüfen:** Werte werden korrekt gespeichert

### Test 6: Mietverhältnis-Zusammenfassung
1. Akte-Tab öffnen (Immobilie mit aktivem Mietvertrag)
2. **Prüfen:** Block zeigt:
   - Status: "Vermietet"
   - Aktive Verträge: 1
   - Gesamtmiete (warm): 1.250,00 €
3. **Prüfen:** Link "Vollständige Verwaltung" vorhanden

### Test 7: Neuen Mietvertrag anlegen
1. Mietverhältnis-Tab öffnen
2. "Neuen Mietvertrag anlegen" klicken
3. Kontakt aus Liste wählen
4. Alle Felder ausfüllen (Kaltmiete, NK, Heizung, Vertragsart, etc.)
5. Speichern
6. **Prüfen:** Vertrag erscheint in Liste mit Status "Entwurf"
7. "Aktivieren" klicken
8. **Prüfen:** Status wechselt zu "Aktiv"

### Test 8: Mehrere Mietverträge
1. Zweiten Mietvertrag anlegen (anderer Kontakt)
2. **Prüfen:** Beide Verträge in Liste sichtbar
3. Akte-Tab öffnen
4. **Prüfen:** "Aktive Verträge: 2"
5. **Prüfen:** Gesamtmiete ist Summe beider Verträge

### Test 9: Historische Verträge
1. Mietverhältnis-Tab → aktiven Vertrag kündigen
2. Ende-Datum in Vergangenheit setzen
3. **Prüfen:** Vertrag erscheint unter "Historische Verträge"
4. **Prüfen:** Nicht mehr editierbar

### Test 10: Kontakt erstellen und verknüpfen
1. Office → Kontakte → "Neuer Kontakt"
2. Kontakt anlegen (Max Mustermann)
3. Immobilien → Mietverhältnis-Tab → "Mietvertrag anlegen"
4. **Prüfen:** "Max Mustermann" erscheint in Kontakt-Auswahl
5. Auswählen und Vertrag erstellen
6. **Prüfen:** Vertrag zeigt "Max Mustermann" als Mieter

---

## Risikominimierung

1. **Keine Datenbank-Schemaänderung** für Teil 1-3 (nur UI-Änderungen)
2. **Bestehendes funktioniert weiter:** `category`-Feld bleibt in DB, wird nur nicht mehr angezeigt
3. **Feature-Flags:** Alte Toggles können temporär bestehen bleiben, bis neue Ampeln getestet sind
4. **Inkrementelle Umsetzung:**
   - Schritt 1: Kategorie entfernen
   - Schritt 2: Ampeln implementieren
   - Schritt 3: Grundbuch-Felder konsolidieren
   - Schritt 4: Mietverhältnis-Block vereinfachen
   - Schritt 5: TenancyTab erweitern
