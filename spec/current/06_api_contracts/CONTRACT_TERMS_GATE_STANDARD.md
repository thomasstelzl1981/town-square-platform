# CONTRACT_TERMS_GATE_STANDARD

## Systemweiter Vertragsabschluss-Standard v1.0

Dieses Dokument definiert den verbindlichen Standard für alle Vertragsabschlüsse innerhalb der Plattform.

---

## 1. Grundprinzip

Jeder kostenpflichtige Service oder jede verbindliche Beauftragung innerhalb des Systems erfordert einen formalen Vertragsabschluss über die **TermsGatePanel**-Komponente. Direkte Aktivierungen ohne Vertragsbestätigung sind unzulässig.

## 2. Ablauf (TermsGate Flow)

```
Nutzer klickt CTA → Dialog öffnet sich → Vertragsbedingungen werden gerendert
→ Checkbox "Ich akzeptiere" → Button "Vertrag abschließen"
→ Consent persistiert → PDF generiert → DMS-Ablage → Service aktiviert
```

### 2.1 Komponente
- **TermsGatePanel** (`src/components/shared/TermsGatePanel.tsx`)
- Kann als Dialog oder Inline-Panel eingebettet werden
- Lädt Template aus `agreement_templates` Tabelle per `templateCode`

### 2.2 Template-Rendering
- Contract-Template wird via `generateContract()` aus `src/lib/contractGenerator.ts` geladen
- Platzhalter (`{{variable}}`) werden zur Laufzeit ersetzt
- Template enthält: Leistungsbeschreibung, Kostendefinition, Laufzeit, Kündigungsklausel

## 3. Persistenz

### 3.1 Consent-Tabelle
```sql
INSERT INTO user_consents (
  user_id, tenant_id, template_id, template_version,
  status, consented_at, metadata
)
```
- `status`: `accepted`
- `metadata`: JSON mit `reference_id`, `reference_type`, `contract_document_id`

### 3.2 DMS-Ablage (Zone 2 — Tenant)
- Vertragsdokument wird als Datei im `tenant-documents` Bucket gespeichert
- Pfad: `{tenant_id}/MOD_03/contracts/{template_code}_{reference_id}_{timestamp}.txt`
- Eintrag in `documents` Tabelle mit `doc_type: 'contract'`, `source: 'system'`

### 3.3 Zone 1 Referenz (Plattform-Kopie)
- `document_links` Eintrag mit `object_type: 'platform_contract_copy'`
- Ermöglicht Admin-Zugriff auf alle abgeschlossenen Verträge

### 3.4 Provisionserfassung (optional)
- Bei provisionsrelevanten Verträgen: `commissions` Eintrag erstellen
- Provision berechnet über `calculatePlatformFee()` aus `contractGenerator.ts`
- Nicht alle Verträge sind provisionsrelevant (z.B. Postservice → keine Provision)

## 4. Aktuelle Anwendungsfälle

| Template-Code | Modul | Beschreibung | Provision |
|---|---|---|---|
| `PARTNER_RELEASE_V1` | MOD-04/09 | Vertriebsauftrag für Immobilienverkauf | Ja (30% Plattformanteil) |
| `FIN_MANDATE_ACCEPTANCE_V1` | MOD-11 | Finanzierungsmandat-Annahme | Ja |
| `ACQ_MANDATE_ACCEPTANCE_V1` | MOD-12 | Akquise-Mandat-Annahme | Ja |
| `POSTSERVICE_ACTIVATION_V1` | MOD-03 | Digitaler Postservice-Aktivierung | Nein (Servicegebühr) |

## 5. Ablage-Pfad-Standard

```
{tenant_id}/MOD_03/contracts/{template_code}_{reference_id}_{timestamp}.txt
```

Alle Verträge — unabhängig vom Modul — werden einheitlich unter `MOD_03/contracts/` abgelegt, da das DMS (MOD-03) die zentrale Dokumentenverwaltung ist.

## 6. Regeln

1. **Keine Aktivierung ohne Consent**: Jeder kostenpflichtige Service MUSS über TermsGatePanel abgeschlossen werden
2. **Versionierung**: Templates sind versioniert. Consent referenziert immer die konkrete Version
3. **Widerruf**: Nutzer kann über die Einstellungen den Service kündigen. Der Consent bleibt archiviert
4. **DSGVO**: Consent-Zeitstempel und Template-Version werden für Compliance aufbewahrt
5. **Idempotenz**: Doppelte Vertragsabschlüsse werden durch Check auf existierenden aktiven Consent verhindert

---

*Erstellt: 2026-02-14 | Version: 1.0*
