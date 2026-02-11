

# Storage Hardening — Bewertung der 4 Ergaenzungen

---

## ERGAENZUNG 1 — Public Buckets DSGVO-Minimum

**Sinnvoll? JA**

**Begruendung:**

`social-assets` ist public und enthaelt Tenant-Medien. Aktuell nutzt `AssetsPage.tsx` bereits korrekt `{tenantId}/{documentId}` als Pfad — aber die Storage-Policies erzwingen das nicht. Ein User koennte theoretisch in einen fremden Tenant-Pfad hochladen. `docs-export` ist public und nutzt vorhersagbare Dateinamen (`sot-docs-export-2026-02-...`), die via `getPublicUrl()` ausgegeben werden. Die ZIPs enthalten Spezifikationen (keine PII), aber die Pfade sind erratbar.

**Anpassungen an SBC v1.0:**

Neue Regel **SBC-R07: Public Bucket Governance**

- `social-assets`: Write-Pfad MUSS `{tenant_id}/` als Prefix erzwingen (Storage-Policy). Read bleibt public (Social-Media-Zweck). Keine PII in Dateinamen oder Metadaten.
- `docs-export`: Dateinamen mit UUID-Suffix statt Timestamp (unguessable). Admin-only Upload bleibt (bereits korrekt). Keine TTL/Rotation in Phase 1 noetig — Dateien enthalten keine PII, nur Specs.

**Plananpassung:**

Schritt 3 (bereits vorhanden: `social-assets` Write-Isolation) deckt den Write-Teil ab. Ergaenzung: `docs-export`-Dateinamen auf UUID umstellen.

| Schritt | Aenderung |
|---------|-----------|
| Schritt 3 (bestehend) | Zusaetzlich: Dokumentation in SBC-R07, dass social-assets keine PII in Dateinamen enthalten darf |
| Schritt 3b (neu, niedrig) | `sot-docs-export/index.ts` und `sot-docs-export-engineering/index.ts`: Dateinamen von `sot-docs-export-${timestamp}` auf `sot-docs-export-${crypto.randomUUID()}` aendern |

---

## ERGAENZUNG 2 — access_grants bis zur Storage-Surface

**Sinnvoll? JA**

**Begruendung:**

SBC-R03 definiert aktuell nur, dass externer Zugriff ueber `access_grants` laeuft, aber nicht WIE. Die Edge Function `sot-dms-download-url` existiert bereits und implementiert das korrekte Pattern: Auth-User → Tenant-Check → Document-Lookup → Service-Role Signed URL. Fuer Z3/externe Nutzer (Leads ohne Auth) fehlt aber ein aehnlicher Mechanismus. Ohne explizite Definition koennte jemand versucht sein, clientseitig mit anon-Key Signed URLs zu generieren — das waere ein Sicherheitsproblem.

**Anpassungen an SBC v1.0:**

SBC-R03 praezisieren:

> **SBC-R03 (erweitert):** Externer Zugriff auf Tenant-Dokumente erfordert eine Server-seitige Signed URL Issuance:
> - Authentifizierte User: Via `sot-dms-download-url` (besteht, prueft tenant_id + document ownership)
> - Externe/Anon-User (Z3): Via dedizierte Edge Function, die `access_grants` validiert (scope, expires_at, revoked_at) und erst dann eine Signed URL mit Service-Role ausstellt
> - VERBOTEN: Clientseitiges Signing mit anon-Key auf private Buckets
> - VERBOTEN: Direkte Storage-URLs ohne Grant-Validierung

**Plananpassung:**

Kein neuer Schritt noetig — die Edge Function fuer Z3-Downloads ist Feature-Arbeit (Data Room), nicht Hardening. Die Regel in SBC-R03 stellt sicher, dass bei Implementierung das richtige Pattern verwendet wird.

---

## ERGAENZUNG 3 — Legacy Bucket `documents`

**Sinnvoll? JA — Empfehlung: Deprecated + Freeze**

**Begruendung:**

Der Bucket `documents` wird im Frontend-Code NICHT mehr referenziert (keine Treffer). Er hat keine Tenant-Isolation in den Storage-Policies. Er scheint ein Legacy-Artefakt zu sein. Eine Migration bestehender Dateien waere aufwaendig und riskant. Besser: Als deprecated markieren, Write-Policies entfernen (nur Read bleibt fuer eventuelle alte Referenzen), und in der Dokumentation als "frozen" kennzeichnen.

**Anpassungen an SBC v1.0:**

Neue Regel **SBC-R08: Legacy Bucket Governance**

- Bucket `documents` ist **deprecated** und **frozen** (kein neuer Upload).
- INSERT-Policy wird entfernt. SELECT bleibt fuer Abwaertskompatibilitaet.
- Neue Uploads MUESSEN in `tenant-documents` mit korrektem Pfad-Prefix landen.
- Bucket wird NICHT geloescht (bestehende Dateien bleiben lesbar).

**Plananpassung:**

Schritt 1 (bestehend) wird vereinfacht:

| Original Schritt 1 | Neu |
|---------------------|-----|
| `documents`-Bucket Storage-Policies haerten (tenant-scoped) | `documents`-Bucket einfrieren: INSERT-Policy entfernen, DELETE-Policy entfernen, nur SELECT behalten. Dokumentation als deprecated in SBC-R08. |

Das ist einfacher, sicherer und vermeidet unnoetige Migration.

---

## ERGAENZUNG 4 — Audit Logging Minimum

**Sinnvoll? JA — erweitertes Minimalset**

**Begruendung:**

`audit_events` wird bereits fuer Business-Events genutzt (FIN_SUBMIT, listing.published, property.created/deleted, lockdown). Das Pattern ist etabliert. Fuer DSGVO-Compliance (Art. 30) und SBC-R04 brauchen wir ein definiertes Minimalset fuer Dokumentenzugriffe. Nur `document.download` reicht nicht — Preview (Ansicht ohne Download) und Grant-Lifecycle sind ebenfalls relevant.

**Definiertes Minimalset:**

| Event-Type | Trigger | Payload-Minimum |
|------------|---------|-----------------|
| `document.view` | Signed URL fuer Preview erstellt | `{ document_id, scope }` |
| `document.download` | Signed URL fuer Download erstellt | `{ document_id, scope }` |
| `grant.created` | access_grant INSERT | `{ grant_id, scope_id, subject_id }` |
| `grant.revoked` | access_grant revoked_at gesetzt | `{ grant_id, scope_id }` |

**Anpassungen an SBC v1.0:**

SBC-R04 praezisieren:

> **SBC-R04 (erweitert):** Audit-Events fuer Dokumentenzugriff:
> - `document.view` — bei jeder Preview-URL-Erstellung
> - `document.download` — bei jedem Download-URL-Erstellung
> - `grant.created` — bei Erstellung eines access_grants
> - `grant.revoked` — bei Widerruf eines access_grants
> - Alle Events: `actor_user_id`, `target_org_id`, `payload` (JSON mit IDs)

**Plananpassung Schritt 8:**

| Original Schritt 8 | Neu |
|---------------------|-----|
| Nur `document.download` | 4 Event-Types: `document.view`, `document.download`, `grant.created`, `grant.revoked` |
| Nur `useDocumentAudit.ts` | `useDocumentAudit.ts` (view/download) + `useAccessGrantAudit.ts` oder Integration in bestehenden `access_grants`-Hook |

**Akzeptanzkriterium (erweitert):** Jeder der 4 Event-Types erzeugt einen `audit_events`-Eintrag mit korrektem `event_type` und `payload`.

---

## Zusammenfassung der Aenderungen

### SBC v1.0 — Neue/Geaenderte Regeln

| Regel | Status | Aenderung |
|-------|--------|-----------|
| SBC-R03 | Erweitert | Server-seitige Signed URL Issuance Pflicht, anon-Signing verboten |
| SBC-R04 | Erweitert | 4 Event-Types statt 1 (view, download, grant.created, grant.revoked) |
| SBC-R07 | **Neu** | Public Bucket Governance (social-assets Pfad-Erzwingung, docs-export UUID-Namen) |
| SBC-R08 | **Neu** | Legacy Bucket `documents` deprecated + frozen |

### Plan — Geaenderte/Neue Schritte

| Schritt | Aenderung |
|---------|-----------|
| 1 | Vereinfacht: Bucket `documents` einfrieren statt tenant-scopen |
| 3 | Ergaenzt um SBC-R07-Dokumentation |
| 3b (neu) | docs-export Dateinamen auf UUID umstellen (niedrige Prio) |
| 8 | Erweitert auf 4 Audit-Events + ggf. 2 Hooks |
| 9 | SBC-R07 und SBC-R08 in Spec-Dokument aufnehmen |

