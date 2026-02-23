
# SOAT Search Engine in AcquiaryKontakte einbinden

## Hintergrund

Die AcquiaryKontakte-Seite (Zone 1 Admin, NICHT frozen) zeigt aktuell nur `contact_staging`-Daten mit einfacher Text-Filterung. Die SOAT Search Engine (`useSoatSearchEngine`) ist bereits voll implementiert und wird in `AdminRecherche.tsx` genutzt, aber nicht im Acquiary Desk.

## Aktueller Zustand

- `AcquiaryKontakte.tsx`: 166 Zeilen, einfache Liste aus `contact_staging`, keine SOAT-Anbindung
- `useSoatSearchEngine.ts`: Vollstaendiger Hook mit Orders, Results, Realtime, Create/Start/Cancel
- `AdminRecherche.tsx`: 727 Zeilen, volle Referenz-Implementierung mit Widget-Grid + Inline-Flow

## Preiskalkulation (MOD-12 -- FROZEN)

Die Preis-Override-Funktion ist bereits vollstaendig implementiert in `ObjekteingangDetail.tsx`:
- Editierbarer Kaufpreis in der Schnellanalyse-Leiste
- Engine-basierte Echtzeit-Neuberechnung (Bestand + Aufteiler)
- Gegenvorschlag-Badge + Speichern/Zuruecksetzen
- Persistenz in `acq_offers.price_counter`

Falls du die UI prominenter gestalten moechtest (z.B. groesseres Eingabefeld, farbige Hervorhebung), muss MOD-12 erst ungefroren werden.

## Umsetzung: AcquiaryKontakte mit SOAT Search Engine

### Aenderungen an `src/pages/admin/acquiary/AcquiaryKontakte.tsx`

Die Seite wird von einer einfachen Kontaktliste zu einem zweistufigen Layout erweitert:

**Oberer Bereich: SOAT Search Orders**
- Import von `useSoatOrders`, `useSoatResults`, `useCreateSoatOrder`, `useStartSoatOrder`
- "Neue Recherche"-Button oeffnet ein Inline-Formular (Titel, Intent, Anzahl)
- Liste laufender/abgeschlossener Search Orders mit Status-Badge und Progress-Bar
- Klick auf eine Order zeigt die Ergebnisse inline darunter an

**Unterer Bereich: Contact Staging (bestehend)**
- Die existierende Kontaktliste bleibt erhalten
- Neue Quelle "soat" wird zum Source-Filter hinzugefuegt
- Ergebnisse aus SOAT-Recherchen koennen direkt in `contact_staging` uebernommen werden

### UI-Struktur

```text
+--------------------------------------------------+
| KPI-Leiste: Kontakte | Ausstehend | Freigegeben  |
+--------------------------------------------------+
| [+ Neue Recherche]                                |
| ┌──────────────────────────────────────────────┐  |
| │ Search Orders (Tabs: Aktiv / Abgeschlossen)  │  |
| │  - Order 1: "Makler Berlin" ● Laeuft 45%     │  |
| │  - Order 2: "Hausverwaltungen" ✓ Fertig      │  |
| └──────────────────────────────────────────────┘  |
|                                                    |
| --- Kontakt-Pool (contact_staging) ---            |
| [Suche...] [Filter: Quelle v]                    |
| ┌──────────────────────────────────────────────┐  |
| │ Max Mustermann · max@firma.de · Apollo        │  |
| │ Lisa Mueller · lisa@gmbh.de · SOAT            │  |
| └──────────────────────────────────────────────┘  |
+--------------------------------------------------+
```

### Technische Details

1. **Hooks**: `useSoatOrders()`, `useSoatResults(selectedOrderId)`, `useCreateSoatOrder()`, `useStartSoatOrder()`
2. **Realtime**: Bereits im Hook implementiert -- Orders und Results werden live aktualisiert
3. **State**: `selectedOrderId` fuer Inline-Detail der Ergebnisse
4. **Source-Filter**: "soat" als neue Option neben "apollo", "import", "manual"
5. **Uebernahme**: Button pro SOAT-Result, der einen Eintrag in `contact_staging` mit `source: 'soat'` erstellt

### Keine Aenderungen an

- `useSoatSearchEngine.ts` (Hook bleibt unveraendert)
- MOD-12 Dateien (FROZEN)
- Routing (Seite existiert bereits als Acquiary-Tab)
