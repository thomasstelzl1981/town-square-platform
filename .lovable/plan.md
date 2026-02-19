

# Portal Terms: Inline-Editor fuer Rechtstexte

## Problem

Der Tab "Portal Terms" in Zone 1 zeigt aktuell nur eine kompakte Liste (Titel + Status-Badge + Version-Button). Der eigentliche Markdown-Inhalt der Dokumente ist **nicht sichtbar**. Man muss erst auf "+ Version" klicken, um in einem Dialog neuen Text einzugeben — aber den bestehenden aktiven Text sieht man nirgends.

## Loesung

Den Tab "Portal Terms" (`CompliancePortalTerms.tsx`) so umbauen, dass fuer jedes Dokument (portal_agb, portal_privacy) eine **aufklappbare Card** mit folgendem Inhalt erscheint:

### Pro Dokument-Card:

1. **Header**: Titel, Status-Badge, aktuelle Version
2. **Aktiver Text (read-only Vorschau)**: Der aktuelle `content_md` der aktiven Version wird als Markdown gerendert angezeigt (Collapsible, standardmaessig eingeklappt)
3. **Editierbare Textarea**: Zum Erstellen einer neuen Draft-Version mit dem Text vorausgefuellt aus der aktuellen aktiven Version
4. **Aenderungsnotiz** + **Speichern-Button**

### Datenfluss:

- Fuer jedes Dokument wird `useDocumentVersions(doc.id)` aufgerufen
- Die aktive Version (status='active') wird gesucht und deren `content_md` als Vorschau + Prefill angezeigt
- Beim Speichern wird eine neue Draft-Version erstellt (wie bisher)

## Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| CompliancePortalTerms.tsx | Kompletter Umbau: pro Dokument eine expandierbare Card mit Markdown-Vorschau + Textarea-Editor |

### Neuer Aufbau pro Dokument:

```text
+-----------------------------------------------+
| [FileText] Nutzungsbedingungen (Portal)       |
| Status: active  |  Version: 1                 |
+-----------------------------------------------+
| [Collapsible] Aktuelle Version anzeigen        |
|   -> Gerendeter Markdown-Text (read-only)      |
+-----------------------------------------------+
| Neue Version erstellen:                        |
| +-------------------------------------------+ |
| | [Textarea, prefilled mit aktivem Text]    | |
| |                                           | |
| +-------------------------------------------+ |
| Aenderungsnotiz: [_______________]             |
| [Draft speichern]  [Aktivieren wenn Draft]     |
+-----------------------------------------------+
```

### Keine Aenderung an:

- ComplianceBundles.tsx (bleibt eigener Tab — Bundles sind Dokumenten-Gruppierungen)
- useComplianceDocuments.ts (Hook bleibt unveraendert)
- ComplianceDeskRouter.tsx (Tab-Struktur bleibt)

## Reihenfolge

1. CompliancePortalTerms.tsx umschreiben mit inline Textarea + Markdown-Vorschau
2. Aktive Version automatisch als Prefill laden

