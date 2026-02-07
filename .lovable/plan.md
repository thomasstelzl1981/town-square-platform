
# Umbau der Immobilienakte: Header-Buttons entfernen & Beschreibungs-Block erweitern

## Übersicht der Änderungen

Diese Änderung verbessert die UX der Immobilienakte durch:
1. Entfernung der redundanten Header-Buttons "Bearbeiten" und "Beschreibung generieren"
2. Umstrukturierung des Adress-Blocks zu "Lage & Beschreibung"
3. Integration der KI-Beschreibungsgenerierung direkt im Block

**OHNE Google Maps** — diese Funktion existiert bereits im Tab "Exposé".

---

## Änderung 1: Header-Buttons entfernen

**Datei:** `src/pages/portal/immobilien/PropertyDetailPage.tsx`

**Aktuell (Zeilen 337-357):**
```tsx
<div className="flex gap-2">
  <Button variant="outline" asChild className="no-print">
    <Link to={`/portal/immobilien/${id}/edit`}>
      <Edit className="mr-2 h-4 w-4" />
      Bearbeiten
    </Link>
  </Button>
  <Button 
    variant="outline" 
    onClick={handleGenerateDescription}
    disabled={isGeneratingDescription}
    className="no-print"
  >
    Beschreibung generieren
  </Button>
</div>
```

**Nachher:**
Das gesamte `<div className="flex gap-2">` mit beiden Buttons wird entfernt.

**Begründung:**
- "Bearbeiten" ist überflüssig — alle Felder sind bereits inline editierbar
- "Beschreibung generieren" wird in den passenden Kontext-Block verschoben

---

## Änderung 2: Block umbenennen und erweitern

**Datei:** `src/components/immobilienakte/editable/EditableAddressBlock.tsx`

| Vorher | Nachher |
|--------|---------|
| Titel: "Adresse & Lage" | Titel: "Lage & Beschreibung" |
| Label: "Lage-Notizen" | Label: "Objektbeschreibung" |
| Textarea: 2 Zeilen | Textarea: 5 Zeilen |
| — | Neuer Button: "✨ KI-Generieren" |

**Neue Block-Struktur:**

```text
┌─────────────────────────────────────────────────────────────────┐
│ 📍 LAGE & BESCHREIBUNG                                          │
├─────────────────────────────────────────────────────────────────┤
│ Straße: [_____________]  Hausnr.: [___]                         │
│ PLZ: [_____]  Ort: [_______________]                            │
├─────────────────────────────────────────────────────────────────┤
│ Lagebezeichnung: [___________________________________]          │
├─────────────────────────────────────────────────────────────────┤
│ Objektbeschreibung:                           [✨ KI-Generieren]│
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Textarea mit 5 Zeilen für strukturierte Beschreibung       │ │
│ │ (Lage, Mikrolage, Objekteigenschaften)                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Breitengrad: [_______]  Längengrad: [_______]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Änderung 3: Neue Props für KI-Generierung

**Erweiterte Props für `EditableAddressBlock`:**

```typescript
interface EditableAddressBlockProps {
  // Adresse (bestehend)
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  
  // NEU: Beschreibung (ersetzt locationNotes)
  description?: string;
  
  // NEU: Property-Daten für KI-Generierung
  propertyType?: string;
  buildYear?: number;
  totalAreaSqm?: number;
  heatingType?: string;
  energySource?: string;
  
  onFieldChange: (field: string, value: any) => void;
}
```

---

## Änderung 4: KI-Button im Block

**Neue Sektion im EditableAddressBlock:**

```tsx
<div className="space-y-1.5">
  <div className="flex items-center justify-between">
    <Label className="text-xs text-muted-foreground">Objektbeschreibung</Label>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleGenerateDescription}
      disabled={isGenerating}
      className="h-6 px-2 text-xs"
    >
      {isGenerating ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <Sparkles className="h-3 w-3 mr-1" />
      )}
      KI-Generieren
    </Button>
  </div>
  <Textarea 
    value={description || ''} 
    onChange={(e) => onFieldChange('description', e.target.value)}
    placeholder="Strukturierte Beschreibung zu Lage, Mikrolage und Objekteigenschaften..."
    rows={5}
  />
</div>
```

Die KI-Funktion ruft die bestehende Edge Function `sot-expose-description` auf.

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Header-Buttons entfernen (Zeilen 337-357) |
| `src/components/immobilienakte/editable/EditableAddressBlock.tsx` | Block umbenennen, Props erweitern, KI-Button hinzufügen |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Neue Props an Block übergeben |

---

## Visuelles Ergebnis

**Vorher (Header):**
```
┌──────────────────────────────────────────────────────────────┐
│ ← DEMO-001 – Leipziger Str 42   [Bearbeiten] [✨ Beschreibung generieren] │
└──────────────────────────────────────────────────────────────┘
```

**Nachher (Header):**
```
┌──────────────────────────────────────────────────────────────┐
│ ← DEMO-001 – Leipziger Str 42                                │
└──────────────────────────────────────────────────────────────┘
```

Der KI-Button ist jetzt **kontextnah** im Block "Lage & Beschreibung" platziert.

---

## Risikominimierung

1. **Keine Datenbank-Änderung nötig** — `description` existiert bereits
2. **Bestehende Edge Function wird wiederverwendet** — keine Backend-Änderung
3. **Speichern-Logik bleibt unverändert** — der Sticky Footer speichert alle Änderungen

---

## Testplan

1. PropertyDetailPage öffnen → Prüfen: Keine Header-Buttons mehr sichtbar
2. Zum "Lage & Beschreibung" Block scrollen → Prüfen: Neuer Titel
3. KI-Button klicken → Prüfen: Beschreibung wird generiert und im Textarea angezeigt
4. Beschreibung manuell bearbeiten → Prüfen: "Ungespeicherte Änderungen" erscheint
5. Speichern klicken → Prüfen: Beschreibung wird persistiert
