

# Bugfix-Plan: Investment-Suche zeigt keine Objekte an

## Zusammenfassung

Die Investment-Suche auf der KAUFY-Website zeigt "0 Objekte" an, obwohl ein gültiges Listing in der Datenbank existiert. Die Ursache sind drei zusammenhängende Probleme:

1. **Falsche Datenbank-Spalte** in den Abfragen
2. **Fehlende Zugriffsrechte** für nicht eingeloggte Besucher
3. **Verwirrender Button** ("Alle anzeigen") bei leeren Ergebnissen

---

## Was wird geändert

### 1. Datenbank-Spaltenname korrigieren

Die Abfragen verwenden `construction_year`, aber die Spalte heißt tatsächlich `year_built`. Dies wird in drei Dateien korrigiert:

- `src/pages/zone3/kaufy/KaufyHome.tsx`
- `src/pages/zone3/kaufy/KaufyExpose.tsx`  
- `src/pages/portal/investments/InvestmentExposePage.tsx`

### 2. Öffentlichen Zugriff für Kaufy-Listings ermöglichen

Neue Datenbank-Policies werden erstellt, die anonymen Besuchern erlauben, veröffentlichte Kaufy-Listings zu sehen:

- Policy für `listing_publications`: Lesezugriff auf aktive Kaufy-Publikationen
- Policy für `listings`: Lesezugriff auf Listings mit aktiver Kaufy-Publikation
- Policy für `properties`: Lesezugriff auf Properties verknüpfter Listings

### 3. "Alle anzeigen" Button verbessern

Der Button wird nur angezeigt, wenn tatsächlich Objekte vorhanden sind. Bei 0 Objekten wird stattdessen ein hilfreicher Hinweis eingeblendet.

---

## Technische Details

### Datenbank-Änderungen (SQL Migration)

```text
-- 1. Öffentlicher Lesezugriff auf aktive Kaufy-Publikationen
CREATE POLICY "public_read_kaufy_publications"
  ON public.listing_publications FOR SELECT
  USING (channel = 'kaufy' AND status = 'active');

-- 2. Öffentlicher Lesezugriff auf Listings mit Kaufy-Publikation
CREATE POLICY "public_read_kaufy_listings"
  ON public.listings FOR SELECT
  USING (
    status IN ('active', 'reserved') AND
    EXISTS (
      SELECT 1 FROM listing_publications lp
      WHERE lp.listing_id = listings.id
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );

-- 3. Öffentlicher Lesezugriff auf verknüpfte Properties
CREATE POLICY "public_read_kaufy_properties"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE l.property_id = properties.id
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );
```

### Code-Änderungen

**KaufyHome.tsx** (Zeile 63-66):
```text
Vorher:  total_area_sqm, construction_year, annual_income
Nachher: total_area_sqm, year_built, annual_income
```

**KaufyHome.tsx** (Zeile 86):
```text
Vorher:  year_built: l.properties.construction_year || 0,
Nachher: year_built: l.properties.year_built || 0,
```

**KaufyHome.tsx** (Zeile 208-216):
```text
Der "Alle anzeigen" Link wird nur angezeigt, wenn properties.length > 0
```

---

## Betroffene Bereiche

| Bereich | Auswirkung |
|---------|------------|
| KAUFY Homepage | Listings werden für alle Besucher sichtbar |
| KAUFY Immobilien-Seite | Detailseiten funktionieren für anonyme Benutzer |
| Portal Investment-Suche | Korrigierter Spaltenname |
| Mobile Ansicht | Identisches Verhalten wie Desktop |

---

## Risiken & Mitigation

| Risiko | Mitigation |
|--------|------------|
| Daten-Exposure | RLS-Policies begrenzen Zugriff strikt auf Kaufy-aktive Listings |
| Bestehende Queries | Korrektur des Spaltennamens behebt auch andere potentielle Fehler |

