

# MOD-05 MSV — Tab "Vermietung" Korrigierter Plan

## Korrektur: Kaufy nur für Verkauf

| Kanal | MOD-05 Vermietung | MOD-06 Verkauf |
|-------|-------------------|----------------|
| ImmobilienScout24 | ✅ Ja (Miete) | ✅ Ja (Kauf) |
| Kleinanzeigen | ✅ Ja (Export) | ✅ Ja (Export) |
| Kaufy Marketplace | ❌ **Nein** | ✅ Ja |
| Partner-Netzwerk | ❌ Nein | ✅ Ja |

**Begründung:** Kaufy ist der Marketplace für Kaufobjekte. Mietobjekte werden dort nicht gelistet.

---

## Tab "Vermietung" — Korrigierte Struktur

### Verfügbare Kanäle (nur 2)

| Kanal | Typ | Beschreibung |
|-------|-----|--------------|
| **ImmobilienScout24** | API | Direkte Veröffentlichung über Credits |
| **Kleinanzeigen** | Export | Text + Bilder exportieren, manuell einstellen |

---

## Hauptansicht: Liste der Vermietungsinserate

| # | Spalte | Beschreibung |
|---|--------|--------------|
| 1 | Objekt-ID | Kurzcode |
| 2 | Adresse | Straße, Nr, Ort |
| 3 | Typ | Wohnung, Haus, Gewerbe |
| 4 | Fläche | qm |
| 5 | Kaltmiete | Angebots-Kaltmiete |
| 6 | Warmmiete | Kalt + NK |
| 7 | Status | draft, active, paused, rented |
| 8 | Kanäle | 🏠 Scout24, 📢 Kleinanzeigen |
| 9 | Aktionen | Dropdown |

### Action-Buttons (korrigiert)

| Aktion | Icon | Beschreibung |
|--------|------|--------------|
| Vermietungsexposé erstellen/bearbeiten | FileText | Wizard für Exposé |
| Bei ImmobilienScout24 veröffentlichen | Building | Publishing Wizard |
| Zu Kleinanzeigen exportieren | ExternalLink | Export-Dialog |
| Exposé als PDF | Download | PDF-Export |
| Deaktivieren | X | Inserat pausieren |

~~Auf Kaufy veröffentlichen~~ — **entfernt**

---

## UI-Wireframe (korrigiert)

```
┌──────────────────────────────────────────────────────────────────┐
│  MSV — Mietmanagement                                             │
├──────────────────────────────────────────────────────────────────┤
│  [Objekte] [Mieteingang] [Vermietung] [Einstellungen]            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Vermietung — Ihre Inserate                                       │
│                                                                   │
│  [+ Neues Vermietungsexposé erstellen]                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Objekt     │ Adresse        │ Fläche │ Miete  │ Kanäle │ ⚡│  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ZL002      │ Marktstr. 12   │ 85 qm  │ 950 €  │ 🏠     │[▼]│  │
│  │ ZL005      │ Bahnhofstr. 5  │ 62 qm  │ 720 €  │ —      │[▼]│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Dropdown [▼]:                                                   │
│  ├─ 📋 Exposé bearbeiten                                         │
│  ├─ 🏠 Bei Scout24 veröffentlichen                               │
│  ├─ 📢 Zu Kleinanzeigen exportieren                              │
│  └─ 📄 Als PDF exportieren                                       │
│                                                                   │
│  ────────────────────────────────────────────────────────────    │
│                                                                   │
│  💡 Veröffentlichen Sie Ihre Mietobjekte direkt auf              │
│     ImmobilienScout24 oder exportieren Sie für Kleinanzeigen.    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Datenmodell (korrigiert)

### rental_publications.channel ENUM

```sql
CHECK (channel IN ('scout24', 'kleinanzeigen'))
```

~~'kaufy'~~ — **entfernt**

---

## Gesamte 4-Tab Struktur (Final)

| Tab | Funktion | Tier |
|-----|----------|------|
| **Objekte** | MOD-04 Liste + Brief-Actions (Kündigung etc.) | Freemium |
| **Mieteingang** | Zahlungen + Mahnungen + Accordion | Premium |
| **Vermietung** | Exposé + Scout24/Kleinanzeigen Publishing | Freemium |
| **Einstellungen** | Automation (Mahntag, Reporttag) + Credits | Beide |

---

## Implementierung

### Dateien zu erstellen/ändern

| Datei | Aktion |
|-------|--------|
| `VermietungTab.tsx` | Komplett neu: Rental Listings + 2 Kanäle |
| `RentalListingWizard.tsx` | Exposé-Erstellung |
| `RentalPublishDialog.tsx` | Scout24 + Kleinanzeigen (kein Kaufy) |
| `ObjekteTab.tsx` | Brief-Buttons hinzufügen |

### Datenbank

```sql
-- rental_publications mit 2 Kanälen
CREATE TABLE rental_publications (
  ...
  channel text NOT NULL CHECK (channel IN ('scout24', 'kleinanzeigen')),
  ...
);
```

### Edge Function

| Name | Zweck |
|------|-------|
| `sot-rental-listing-publish` | Scout24 API (Miete) |

---

## Zusammenfassung der Korrektur

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Kanäle | Scout24, Kleinanzeigen, Kaufy | Scout24, Kleinanzeigen |
| Kaufy | Für Miete geplant | ❌ Nur für Verkauf (MOD-06) |
| channel ENUM | 3 Werte | 2 Werte |

