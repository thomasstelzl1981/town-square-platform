
# Umsetzungsplan: Exposé-Tab Datenkonsistenz & Duplikat-Bereinigung

## Analyse der aktuellen Situation

### Datenquellen-Vergleich

| Feld | Akte (dossierData) | Exposé (property) | Status |
|------|-------------------|-------------------|--------|
| Straße | ✅ street | ✅ address | OK |
| PLZ | ✅ postalCode | ✅ postal_code | OK |
| Ort | ✅ city | ✅ city | OK |
| Land | ❌ (nicht editierbar) | ✅ country | Nur Exposé |
| Lagebezeichnung | ✅ locationLabel | ❌ FEHLT | **Muss ergänzt werden** |
| Objektbeschreibung | ✅ description | ✅ description | OK |
| Koordinaten | ✅ latitude/longitude | ❌ FEHLT | Für Karte nutzen |

### Duplikate im Exposé-Tab

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER-KARTE                                                │
│ Eigentumswohnung                                            │
│ Leipziger Straße 42                    ← ADRESSE #1         │
│ 04109 Leipzig, Deutschland             ← PLZ/ORT/LAND #1    │
│                              Objekt-Code: DEMO-001          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LAGE & ADRESSE                                              │
│ Straße: Leipziger Straße 42            ← ADRESSE #2 (DUPLIKAT)
│ PLZ: 04109                             ← DUPLIKAT           │
│ Ort: Leipzig                           ← DUPLIKAT           │
│ Land: Deutschland                      ← DUPLIKAT           │
└─────────────────────────────────────────────────────────────┘
```

**Problem:** Die gleichen Adressdaten werden zweimal angezeigt.

---

## Lösung: Exposé-Tab Struktur optimieren

### Neue Karten-Struktur

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (bleibt wie bisher)                                  │
│ [Objekttyp] [Adresse] [PLZ Ort, Land] [Objekt-Code]         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LAGE & MIKROLAGE (NEU - ersetzt "Lage & Adresse")           │
│ Lagebezeichnung: "Altbau am Waldstraßenviertel"   ← NEU     │
│ (Freitext aus Akte locationNotes / location_notes)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OBJEKTBESCHREIBUNG (Vollbreite, prominent)                  │
│ [Beschreibungstext aus property.description]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OBJEKTDATEN (zusammengefasst)                               │
│ Baujahr: 1920 | Sanierung: 2015 | Wohnfläche: 65 qm         │
│ Heizung: Fernwärme | Energieträger: Fernwärme               │
└─────────────────────────────────────────────────────────────┘

... weitere Karten (Grundbuch, Finanzierung, Miete) ...
```

---

## Technische Umsetzung

### Schritt 1: Datenbank-Schema erweitern

Die Spalte `location_notes` existiert möglicherweise nicht in `properties`. Prüfung erforderlich:

```sql
-- Falls nicht vorhanden:
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS location_notes TEXT;
```

### Schritt 2: ExposeTab.tsx - Interface erweitern

**Datei:** `src/components/portfolio/ExposeTab.tsx`

Property-Interface erweitern (Zeile 7-29):

```typescript
interface Property {
  id: string;
  code: string | null;
  property_type: string;
  city: string;
  address: string;
  postal_code: string | null;
  country: string;
  total_area_sqm: number | null;
  year_built: number | null;
  renovation_year: number | null;
  // ... bestehende Felder ...
  description: string | null;
  location_notes: string | null;  // NEU: Lagebezeichnung
}
```

### Schritt 3: ExposeTab.tsx - Karten-Struktur anpassen

**Zeile 97-109 ersetzen** (alte "Lage & Adresse"-Karte):

Von:
```typescript
{/* Lage & Adresse */}
<Card>
  <CardHeader>
    <CardTitle className="text-base">Lage & Adresse</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <InfoRow label="Straße" value={property.address} />
    <InfoRow label="PLZ" value={property.postal_code} />
    <InfoRow label="Ort" value={property.city} />
    <InfoRow label="Land" value={property.country} />
  </CardContent>
</Card>
```

Zu:
```typescript
{/* Lage & Mikrolage - nur wenn vorhanden */}
{property.location_notes && (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Lage & Mikrolage</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm">{property.location_notes}</p>
    </CardContent>
  </Card>
)}
```

### Schritt 4: Beschreibung prominenter platzieren

**Zeile 193-203 verschieben** - Beschreibung nach oben, vor die Detail-Karten:

```typescript
{/* Beschreibung - jetzt direkt nach Header */}
{property.description && (
  <Card className="md:col-span-2">
    <CardHeader>
      <CardTitle className="text-base">Objektbeschreibung</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm whitespace-pre-wrap">{property.description}</p>
    </CardContent>
  </Card>
)}
```

### Schritt 5: PropertyDetailPage.tsx - location_notes laden

**Zeile 31-60** - Property-Interface erweitern und Abfrage anpassen:

Interface ergänzen:
```typescript
interface Property {
  // ... bestehende Felder ...
  location_notes: string | null;  // NEU
}
```

Die Supabase-Query `select('*')` lädt bereits alle Spalten, also ist keine Query-Änderung nötig.

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `properties` Tabelle | `location_notes` Spalte hinzufügen (falls nicht vorhanden) |
| `src/components/portfolio/ExposeTab.tsx` | - "Lage & Adresse"-Karte entfernen (Duplikat)<br>- "Lage & Mikrolage"-Karte mit location_notes hinzufügen<br>- Beschreibung nach oben verschieben |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Property-Interface um `location_notes` erweitern |

---

## Neue Exposé-Struktur (nach Implementierung)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ Eigentumswohnung                                            │
│ Leipziger Straße 42                                         │
│ 04109 Leipzig, Deutschland              DEMO-001            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OBJEKTBESCHREIBUNG (Vollbreite)                             │
│ Die Eigentumswohnung befindet sich in einem gepflegten      │
│ Altbau aus dem Jahr 1920...                                 │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────┐  ┌───────────────────────────┐
│ LAGE & MIKROLAGE          │  │ BAUJAHR & ZUSTAND         │
│ Altbau am Waldstraßen-    │  │ Baujahr: 1920             │
│ viertel, ruhige Seiten-   │  │ Sanierung: 2015           │
│ straße mit guter ÖPNV-    │  │ Wohnfläche: 65 qm         │
│ Anbindung                 │  │                           │
└───────────────────────────┘  └───────────────────────────┘

... weitere Karten ...
```

---

## Testplan

### Test 1: Keine Duplikate
1. Immobilienakte öffnen → Tab "Exposé"
2. **Prüfen:** Adresse erscheint NUR im Header, nicht mehr in separater Karte

### Test 2: Lagebezeichnung wird angezeigt
1. In Akte → "Lage & Beschreibung" eine Lagebezeichnung eingeben
2. Speichern
3. Tab "Exposé" öffnen
4. **Erwartung:** "Lage & Mikrolage"-Karte zeigt den eingegebenen Text

### Test 3: Beschreibung prominent
1. Tab "Exposé" öffnen
2. **Prüfen:** Objektbeschreibung erscheint direkt nach dem Header (über den Detail-Karten)

### Test 4: Leere Felder ausblenden
1. Immobilie ohne Lagebezeichnung/Beschreibung
2. Tab "Exposé" öffnen
3. **Erwartung:** Leere Karten werden nicht angezeigt (kein "–" Platzhalter)
