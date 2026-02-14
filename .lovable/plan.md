
# PV-Anlage als echte DB-Akte anlegen und DMS-Verknuepfungen reparieren

## Problem-Analyse

### 1. PV-Anlage existiert nur client-seitig
Die Demo-PV-Anlage "EFH SMA 9,8 kWp" ist eine hartcodierte Konstante in `AnlagenTab.tsx` (`id: 'demo-plant-001'`). Sie wurde nie in die `pv_plants`-Tabelle eingefuegt. Damit hat sie:
- Keinen DMS-Ordner unter MOD_19
- Keine Sortierkachel
- Keine Sortierregeln
- Keine echte Akte

### 2. DMS-Ordner haben keine Entity-Verknuepfung
Alle `storage_nodes` fuer Properties (MOD_04) und Fahrzeuge (MOD_17) haben `entity_type = NULL` und `entity_id = NULL`. Das bedeutet: Der Button "Im Datenraum oeffnen" in der Sortierkachel-Detailansicht kann den richtigen Ordner nicht finden.

### 3. Sortierkacheln fuer Properties/Fahrzeuge sind korrekt
Die 5 Sortierkacheln (3 Properties + 2 Fahrzeuge) und ihre Regeln wurden korrekt angelegt. Was fehlt: die PV-Anlage.

---

## Umsetzung

### SQL-Migration (3 Schritte)

**Schritt 1: PV-Anlage als echten DB-Eintrag anlegen**

| Feld | Wert |
|------|------|
| id | `00000000-0000-4000-a000-000000000901` |
| name | EFH SMA 9,8 kWp |
| tenant_id | `a0000000-0000-4000-a000-000000000001` |
| kwp | 9.8 |
| status | active |
| city | Berlin |
| street | Musterstr. |
| commissioning_date | 2023-06-15 |
| has_battery | true |
| battery_kwh | 10.0 |
| public_id | SOT-PV-SMA98 |

Dazu: DMS-Unterordner unter dem MOD_19-Root (`bae9c64f-...`) mit den 8 Standard-PV-Unterordnern (01_Stammdaten bis 08_Wartung_Service).

**Schritt 2: Sortierkachel fuer PV-Anlage erstellen**

| Kachel-Name | Entity-Typ | Keywords |
|-------------|-----------|----------|
| EFH SMA 9,8 kWp | pv_plant | SMA, Photovoltaik, SOT-PV-SMA98, 9,8 kWp |

**Schritt 3: Entity-Verknuepfungen in storage_nodes reparieren**

Update aller bestehenden DMS-Ordner mit korrekten `entity_type` und `entity_id`:

| DMS-Ordner | entity_type | entity_id |
|------------|-------------|-----------|
| BER-01 - Schadowstr. | property | d0000000-...001 |
| MUC-01 - Leopoldstr. | property | d0000000-...002 |
| HH-01 - Osterstr. | property | d0000000-...003 |
| B-P911 (Ordner) | vehicle | 00000000-...301 |
| M-M5005 (Ordner) | vehicle | 00000000-...302 |

---

### Frontend: `AnlagenTab.tsx` anpassen

Die hartcodierte `DEMO_PLANT`-Konstante wird durch eine DB-Query ersetzt (oder die Konstante bekommt die echte UUID `00000000-0000-4000-a000-000000000901`), damit das Dossier auf den echten DB-Eintrag verweist. So funktionieren DMS-Uploads, Monitoring und Sortierkacheln einheitlich.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| SQL-Migration | PV-Anlage + DMS-Ordner + Sortierkachel + Entity-Updates |
| `src/pages/portal/photovoltaik/AnlagenTab.tsx` | DEMO_PLANT-ID auf echte DB-UUID aendern |

## Was sich NICHT aendert
- `SortierenTab.tsx` — wurde bereits im letzten Schritt erweitert
- `useRecordCardDMS.ts` — bleibt korrekt
- `CONTRACT_EMAIL_INBOUND.md` — wurde bereits aktualisiert
- Die 5 bestehenden Sortierkacheln — bleiben unveraendert
