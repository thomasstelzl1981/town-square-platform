

## Diagnose

Magic Intake hat Versicherungsvertraege (KFZ, Rechtsschutz, Haftpflicht etc.) faelschlicherweise in die Tabelle `vorsorge_contracts` mit `category: 'sachversicherung'` geschrieben — statt in `insurance_contracts`.

**Aktueller Datenstand** (8 fehlerhafte Eintraege in `vorsorge_contracts`):
- 5x KFZ-Versicherung (VHV, HDI, Versicherungskammer Bayern, Bayerisches Mopedschild)
- 1x Rechtsschutzversicherung (ARAG)
- 1x Vermögensschadenhaftpflicht (Hans John)
- 1x Reiseversicherung (Würzburger)

**Warum tauchen sie in der Uebersicht auf:**
Die Finanzuebersicht-Engine (`calcFinanzuebersicht`) liest ALLE `vorsorge_contracts` ohne Category-Filter. Die Sachversicherungs-Eintraege werden als Vorsorge-/Sparvertraege mitgezaehlt.

**Warum fehlen Widgets im Sachversicherungen-Tab:**
Der SachversicherungenTab liest aus `insurance_contracts`, nicht aus `vorsorge_contracts` — dort liegen die Daten aber gar nicht.

---

## Fix (3 Schritte)

### 1. Engine-Fix: `vorsorge_contracts` mit `category = 'sachversicherung'` ausschliessen

**Datei:** `src/engines/finanzuebersicht/engine.ts`

Zeile 152: `activeVorsorge` Filter erweitern:
```typescript
const activeVorsorge = input.vorsorgeData
  .filter(v => v.status !== 'gekuendigt')
  .filter(v => v.category !== 'sachversicherung');
```

Ebenso in der `buildContractSummaries`-Funktion dasselbe Filter anwenden.

### 2. Daten-Migration: Fehlklassifizierte Records nach `insurance_contracts` verschieben

SQL-Migration:
- Fuer jeden der 8 `vorsorge_contracts` mit `category = 'sachversicherung'` einen entsprechenden INSERT in `insurance_contracts` mit korrekt gemappten Feldern (provider → insurer, premium, payment_interval, contract_no → policy_no, status)
- Danach die 8 Records aus `vorsorge_contracts` loeschen

### 3. Engine-Daten-Input: `useFinanzberichtData` — Vorsorge-Daten ebenfalls filtern

**Datei:** `src/hooks/useFinanzberichtData.ts`

Als zusaetzliche Absicherung: `filteredVorsorge` um den Category-Filter erweitern, damit `sachversicherung`-Eintraege nie in die Engine gelangen.

---

### Freeze-Check
- MOD-18: **unfrozen** ✅
- ENG-FINUEB: **unfrozen** ✅
- `useFinanzberichtData.ts` liegt ausserhalb von Modul-Pfaden → frei editierbar ✅

