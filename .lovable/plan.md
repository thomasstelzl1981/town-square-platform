
# Fehleranalyse: Demo-Daten bleiben nach Toggle OFF

## Ursachen-Analyse

Es gibt **drei verschiedene Problemkategorien**, die zusammen das inkonsistente Verhalten verursachen:

### Problem 1: Cleanup loescht nichts (Hauptursache)

Die `test_data_registry` Tabelle ist **komplett leer**. Die Cleanup-Engine basiert aber ausschliesslich auf Registry-Eintraegen:
- Cleanup sucht in `test_data_registry` nach Eintraegen mit `batch_name = 'demo-ssot'`
- Findet 0 Eintraege → loescht nichts
- **Alle 7 Insurance, 6 Vorsorge, 8 Subscriptions, 2 Loans, 3 Properties, 5 Contacts etc. bleiben in der DB**

Die Daten wurden entweder ueber alte DB-Seeds oder einen frueheren Seed-Lauf eingefuegt, bei dem die Registry-Registrierung fehlschlug.

### Problem 2: Finanzbericht ignoriert Demo-Toggle (Hardcoded Data)

In `src/hooks/useFinanzberichtData.ts` Zeile 178:
```
const kvContracts = getDemoKVContracts();
```
Diese Zeile liefert **immer** 4 KV-Vertraege — unabhaengig ob der Demo-Toggle aktiv ist oder nicht. Das erklaert die Krankenversicherungsdaten im Finanzbericht-Screenshot (685 EUR PKV Max, 424 EUR GKV Lisa, etc.).

Zusaetzlich: `useFinanzberichtData` liest Versicherungen, Vorsorge, Abonnements, Darlehen direkt aus der DB via `tenant_id` — ohne `isDemoId`-Filter. Wenn die DB-Daten nicht geloescht wurden, erscheinen sie im Bericht.

### Problem 3: Portfolio-Widget ist komplett hardcoded

In `src/pages/portal/immobilien/PortfolioTab.tsx` Zeilen 700-748: Das Demo-Widget "Familie Mustermann" mit den Werten (3 Einheiten, 850.000 EUR Verkehrswert, 520.000 EUR Restschuld, 330.000 EUR Nettovermoegen) ist **direkt im JSX hartcodiert** — keine Datenbankabfrage, keine Demo-Toggle-Pruefung fuer die Sichtbarkeit.

### Problem 4: Steuer-Tab zeigt Landlord Context

Die `landlord_contexts` Tabelle enthaelt noch den Demo-Eintrag "Familie Mustermann" (ID: `d0000000-...-000000000010`). Diese Tabelle ist **nicht im Cleanup-Order** enthalten.

---

## Betroffene Dateien und Aenderungen

### 1. Cleanup-Engine: Fallback auf ID-Pattern (useDemoCleanup.ts)

Da die Registry leer ist, muss die Cleanup-Engine einen **Fallback** haben: Wenn keine Registry-Eintraege gefunden werden, loescht sie alle Records deren IDs dem Demo-ID-Pattern entsprechen (`e0000000-*` und `d0000000-*`).

Zusaetzlich: `landlord_contexts` in die CLEANUP_ORDER aufnehmen (nach `properties`, vor `contacts`).

### 2. useFinanzberichtData.ts: KV-Contracts demo-aware machen

Zeile 178 aendern:
```typescript
// Vorher:
const kvContracts = getDemoKVContracts();
// Nachher:
const kvContracts = demoEnabled ? getDemoKVContracts() : [];
```
Dafuer muss `useDemoToggles` importiert und `isEnabled('GP-KONTEN')` abgefragt werden.

### 3. useFinanzberichtData.ts: DB-Daten durch isDemoId filtern

Alle DB-Queries in `useFinanzberichtData` (insurance, vorsorge, subscriptions, private_loans, pv_plants, loans) muessen ihre Ergebnisse durch `isDemoId` filtern wenn der Demo-Toggle OFF ist. 

Pattern fuer jede Query:
```typescript
const filteredInsurance = demoEnabled 
  ? insuranceData 
  : insuranceData.filter(r => !isDemoId(r.id));
```

### 4. PortfolioTab.tsx: Demo-Widget Sichtbarkeit steuern

Das hardcodierte Demo-Widget (Zeilen 700-748) soll nur angezeigt werden wenn `demoEnabled === true`. Wenn OFF, wird es ausgeblendet oder mit "Inaktiv"-Overlay dargestellt (aktuell zeigt es `opacity-60` bei inaktiv, aber die Daten sind trotzdem sichtbar und anklickbar).

### 5. Seed-Engine: Registry-Registrierung pruefen

Die `useDemoSeedEngine.ts` muss sicherstellen, dass jede `seed()`-Funktion die IDs korrekt in `test_data_registry` eintraegt. Aktuell scheint die Registrierung zu versagen — entweder weil der Seed nie lief oder weil ein Fehler bei der Registrierung auftritt.

---

## Zusammenfassung der Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useDemoCleanup.ts` | ID-Pattern-Fallback + `landlord_contexts` in CLEANUP_ORDER |
| `src/hooks/useFinanzberichtData.ts` | KV-Contracts + alle DB-Daten demo-aware filtern |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Demo-Widget ausblenden wenn Toggle OFF |
| `src/hooks/useDemoSeedEngine.ts` | Registry-Registrierung validieren |

## Erwartetes Ergebnis nach Fix

- Toggle OFF: 0 Records in allen operativen Tabellen, Finanzbericht leer, Portfolio-Widget ausgeblendet
- Toggle ON: Vollstaendiger Datensatz, Finanzbericht mit allen Werten, Portfolio-Widget sichtbar
