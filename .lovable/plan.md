

# Befund: Datenraum — Struktur- UND Darstellungsproblem

## Das Problem

Der AcqDataRoom hat **zwei Probleme**:

### 1. Inkonsistente Storage-Pfade (Strukturproblem)

Es existieren **3 verschiedene Upload-Pfadmuster** im Code:

| Quelle | Pfadmuster | Beispiel |
|---|---|---|
| `useExposeUpload` (Hook) | `{tenant_id}/MOD_12/{mandate_id}/{file}` | `abc/MOD_12/m001/expose.pdf` |
| `ExposeDragDropUploader` | `{tenant_id}/manual/{file}` | `abc/manual/expose.pdf` |
| E-Mail-Webhook | `{mandate_id}/{offer_id}/{file}` | `m001/o001/expose.pdf` |
| Originale RLS-Policies | `{mandate_id}/...` | `m001/expose.pdf` |

Das bedeutet: Dateien landen an völlig verschiedenen Stellen im Bucket, je nachdem wie sie hochgeladen werden.

### 2. Flache Darstellung (Darstellungsproblem)

`AcqDataRoom` listet nur `supabase.storage.list(tenantId)` — also eine Ebene tief. Es zeigt die unmittelbaren Unterordner (z.B. `manual`, `MOD_12`, oder was immer existiert) als flache Liste. Es gibt keine Drill-Down-Logik für die gewünschte Hierarchie.

## Gewünschte Hierarchie

```text
acq-documents/
└── {tenant_id}/
    └── {mandate_id}/           ← "Acquiary" / Ankaufsmandat
        └── {offer_id}/         ← Einzelnes Objekt/Exposé
            ├── expose/         ← Exposé-PDFs
            ├── recherche/      ← Recherche-Dokumente
            ├── korrespondenz/  ← E-Mails, Briefe
            └── sonstiges/      ← Sonstige Unterlagen
```

## Plan

### Phase 1: Storage-Pfade vereinheitlichen (3 Dateien)

**`src/hooks/useExposeUpload.ts`** — Pfad ändern zu:
`{tenant_id}/{mandate_id}/{offer_id}/expose/{fileName}`
(offer_id wird nach Insert in acq_offers bekannt)

**`src/pages/portal/akquise-manager/components/ExposeDragDropUploader.tsx`** — Gleiche Pfadlogik. Bei Upload ohne Mandat: `{tenant_id}/unassigned/{offer_id}/expose/{fileName}`

**`supabase/functions/sot-acq-inbound-webhook/index.ts`** — E-Mail-Attachments ebenso: `{tenant_id}/{mandate_id}/{offer_id}/expose/{fileName}`

### Phase 2: AcqDataRoom neu aufbauen (1 Datei)

**`src/pages/portal/akquise-manager/components/AcqDataRoom.tsx`** — Komplett umschreiben:

- **Ebene 1**: Mandate laden aus `acq_mandates` (nicht Storage-Ordner). Anzeige: Mandatsname + Badge mit Offer-Anzahl.
- **Ebene 2**: Bei Klick auf Mandat → Offers laden aus `acq_offers WHERE mandate_id = X`. Anzeige: Offer-Titel + Adresse.
- **Ebene 3**: Bei Klick auf Offer → Unterordner anzeigen (expose, recherche, korrespondenz, sonstiges) mit Dateien aus `acq_offer_documents` bzw. Storage-Listing.

Damit wird die Darstellung **datengetrieben** (aus DB-Tabellen) statt rein Storage-basiert.

### Phase 3: RLS-Policies aktualisieren (Migration)

Neue RLS-Policy für das Pfadmuster `{tenant_id}/{mandate_id}/{offer_id}/...` — ersetzt die alte mandate-only Policy.

### Hinweis: Freeze-Status

- MOD-12 ist UNFROZEN (durch vorherigen Befehl)
- INFRA-edge_functions ist UNFROZEN (durch aktuellen Befehl)
- Für die Migration: keine Freeze-Einschränkung

