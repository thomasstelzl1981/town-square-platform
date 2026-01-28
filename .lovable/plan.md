# Workflow-Audit MOD-04 → MOD-06 → Zone 3 Kaufy

## Status: KORRIGIERT ✅

### Durchgeführte Änderungen

#### 1. KaufyExpose.tsx - MOCK-DATEN ENTFERNT
- **Zeilen 77-93**: Hardcoded Mock-Daten ("Musterstraße 123", "Leipzig", "890.000€") komplett gelöscht
- Jetzt: Echte DB-Abfrage mit Kaufy-Channel-Validierung
- Wenn Objekt nicht auf Kaufy publiziert → zeigt "Objekt nicht gefunden"

#### 2. Datenfluss verifiziert
```
MOD-04 (properties/units) 
    ↓
MOD-06 (listings + Verkaufsexposé)
    ↓ [Publikation mit channel='kaufy']
Zone 3 KaufyImmobilien (v_public_listings / listing_publications)
    ↓ [Klick auf Objekt]
Zone 3 KaufyExpose (Detailseite mit Investment-Rechner)
```

#### 3. Komponenten-Status

| Komponente | Status | Quelle |
|------------|--------|--------|
| KaufyHome.tsx | ✅ KORREKT | listing_publications + channel='kaufy' |
| KaufyImmobilien.tsx | ✅ KORREKT | listing_publications + channel='kaufy' |
| KaufyExpose.tsx | ✅ KORRIGIERT | listings + Kaufy-Validierung |
| ExposeDetail.tsx (MOD-06) | ✅ KORREKT | units als Basis, auto-creates listings |
| VermietungTab.tsx (MOD-05) | ✅ KORREKT | rental_listings (separater Kanal) |

### Aktuelle Datenlage

| Tabelle | Anzahl | Kommentar |
|---------|--------|-----------|
| properties | 0 | Testdaten via Zone 1 → /admin/tiles importieren |
| units | 0 | Werden mit Properties angelegt |
| listings | 0 | Werden in MOD-06 erstellt |
| listing_publications | 0 | Kaufy-Freigabe in MOD-06 ExposeDetail |

### Workflow zum Testen

1. **Zone 1**: `/admin/tiles` → Tab "Testdaten" → Excel-Import
2. **MOD-04**: `/portal/immobilien/portfolio` → Properties erscheinen
3. **MOD-06**: `/portal/verkauf/objekte` → Units erscheinen
4. **MOD-06**: Klick auf Eye-Button → Verkaufsexposé öffnet
5. **MOD-06**: "Partner-Freigabe" aktivieren → dann Kaufy-Toggle aktivieren
6. **Zone 3**: `/kaufy/immobilien` → Objekt erscheint
7. **Zone 3**: Klick auf Objekt → KaufyExpose mit Investment-Rechner

### MOD-05 vs MOD-06 Unterschied

| Feature | MOD-05 (MSV) | MOD-06 (Verkauf) |
|---------|--------------|------------------|
| Tabelle | rental_listings | listings |
| Kanäle | Scout24, Kleinanzeigen | Kaufy, Partner Network, Scout24 |
| Zone 3 | ❌ Nicht auf Kaufy | ✅ Kaufy Marketplace |

### Offene Punkte

- [ ] Testdaten importieren (Phase 0 Sample Portfolio ZL002-ZL009)
- [ ] Armstrong Sidebar Position prüfen (Desktop = rechts, Mobile = Bottom)
- [ ] Footer-Links vervollständigen (KAUFY_COPYKIT.md)
