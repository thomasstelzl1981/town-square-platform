# MOD-07: Finanzierung (Customer Finance Preparation)

**Version:** 2.0.0  
**Zone:** 2 (Portal)  
**Status:** FROZEN

## Übersicht

MOD-07 ist das Vorbereitungsmodul für Finanzierungsanfragen. Kunden erfassen hier ihre Selbstauskunft, laden Dokumente hoch und reichen die Anfrage ein.

**WICHTIG:** MOD-07 ist SoT (Source of Truth) NUR bis zur Einreichung. Danach übernimmt Zone 1 FutureRoom.

## Routes

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/portal/finanzierung` | Index/Redirect | Leitet zu selbstauskunft |
| `/portal/finanzierung/selbstauskunft` | SelbstauskunftTab | Selbstauskunft-Formular |
| `/portal/finanzierung/dokumente` | DokumenteTab | Dokument-Upload (DMS-Links) |
| `/portal/finanzierung/anfrage` | AnfrageTab | Objekt-Auswahl + Einreichung |
| `/portal/finanzierung/status` | StatusTab | Status-Übersicht (read-only nach Submit) |
| `/portal/finanzierung/anfrage/:requestId` | AnfrageDetailPage | Detail-Ansicht |

## Status-Machine

```
draft → incomplete → ready_to_submit → submitted_to_zone1 → [Zone 1 übernimmt]
```

## Datenmodell

- `finance_requests` — Haupt-Container
- `applicant_profiles` — Selbstauskunft-Daten
- `document_links` — Verknüpfung zu DMS (MOD-03)

## Integration

- **MOD-03 (DMS):** Dokumente werden über DMS verwaltet, MOD-07 zeigt nur Referenzen
- **MOD-04 (Immobilien):** Objekt-Daten können aus Portfolio übernommen werden
- **Zone 1 (FutureRoom):** Nach Submit wird Mandat in Zone 1 erstellt

## Acceptance Criteria

- [ ] Selbstauskunft kann gespeichert werden
- [ ] Dokumente können hochgeladen werden (DMS-Integration)
- [ ] Einreichung sperrt Bearbeitung
- [ ] Status wird nach Einreichung von Zone 1 gespiegelt
