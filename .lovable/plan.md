

# MOD-05 MSV — 4-Tab Struktur (Implementiert)

## Korrektur: Kaufy nur für Verkauf

| Kanal | MOD-05 Vermietung | MOD-06 Verkauf |
|-------|-------------------|----------------|
| ImmobilienScout24 | ✅ Ja (Miete) | ✅ Ja (Kauf) |
| Kleinanzeigen | ✅ Ja (Export) | ✅ Ja (Export) |
| Kaufy Marketplace | ❌ **Nein** | ✅ Ja |
| Partner-Netzwerk | ❌ Nein | ✅ Ja |

---

## Finale 4-Tab Struktur

| Tab | Route | Funktion | Tier |
|-----|-------|----------|------|
| **Objekte** | /portal/msv/objekte | MOD-04 Liste + Brief-Actions | Freemium |
| **Mieteingang** | /portal/msv/mieteingang | Zahlungen + Mahnungen | Premium |
| **Vermietung** | /portal/msv/vermietung | Exposé + Scout24/Kleinanzeigen | Freemium |
| **Einstellungen** | /portal/msv/einstellungen | Automation + Credits | Beide |

---

## Implementierte Komponenten

### Neue Dateien

| Datei | Status |
|-------|--------|
| `src/pages/portal/msv/VermietungTab.tsx` | ✅ Komplett neu |
| `src/pages/portal/msv/ObjekteTab.tsx` | ✅ Umbenannt von ListenTab |
| `src/components/msv/RentalListingWizard.tsx` | ✅ Erstellt |
| `src/components/msv/RentalPublishDialog.tsx` | ✅ Erstellt |

### Datenbank

| Tabelle | Status |
|---------|--------|
| `rental_listings` | ✅ Erstellt mit RLS |
| `rental_publications` | ✅ Erstellt (channel: scout24, kleinanzeigen) |

---

## Tab "Vermietung" — Funktionen

### Verfügbare Kanäle (nur 2)

| Kanal | Typ | Beschreibung |
|-------|-----|--------------|
| **ImmobilienScout24** | API | Phase 2 - Entwurf wird gespeichert |
| **Kleinanzeigen** | Export | Text kopieren, Link eintragen |

### Action-Buttons

| Aktion | Icon | Beschreibung |
|--------|------|--------------|
| Vermietungsexposé erstellen/bearbeiten | FileText | Wizard für Exposé |
| Bei ImmobilienScout24 veröffentlichen | Home | Publishing Wizard |
| Zu Kleinanzeigen exportieren | Megaphone | Export-Dialog |
| Exposé als PDF | Download | PDF-Export |
| Deaktivieren | X | Inserat pausieren |

---

## Nächste Schritte (Phase 2)

1. Scout24 API-Integration aktivieren
2. Bilder-Export für Kleinanzeigen (ZIP)
3. PDF-Export für Vermietungsexposé
4. Automatisierungs-Einstellungen (Mahntag, Reporttag)
