

# Pet Desk Tab-Struktur korrigieren

## Problem

Der Pet Desk weicht als einziger Operativer Desk vom Standard-Tab-Pattern ab:

| Desk | Erster Tab | Weitere Tabs |
|------|-----------|--------------|
| Sales Desk | **Dashboard** | Kontakte, Veroeffentlichungen, Inbox, Partner, Audit |
| Lead Desk | **Dashboard** | Kontakte, Lead Pool, Zuweisungen, Provisionen, Monitor |
| Pet Desk | **Governance** (falsch) | Kontakte, Vorgaenge, Kunden, Shop, Billing |

Zwei Korrekturen:

1. **"Governance" in "Dashboard" umbenennen** — konsistent mit allen anderen Desks
2. **Tab-Struktur vereinheitlichen** — "Vorgaenge", "Kunden", "Shop", "Billing" sind redundant bzw. zu generisch. Stattdessen soll die Struktur dem Desk-Pattern folgen.

## Aenderung

In `src/pages/admin/desks/PetmanagerDesk.tsx`:

### Tab-Umbenennung

```text
Vorher:
  { value: 'governance', label: 'Governance', path: '' }

Nachher:
  { value: 'dashboard', label: 'Dashboard', path: '' }
```

Die `activeTab`-Fallback-Logik aendert sich entsprechend von `'governance'` auf `'dashboard'`.

### Tab-Struktur bereinigen

Die bisherigen 6 Tabs (Governance, Kontakte, Vorgaenge, Kunden, Shop, Billing) werden auf das Standard-Pattern angepasst:

| Tab | Label | Inhalt |
|-----|-------|--------|
| dashboard | Dashboard | Bleibt: PetDeskGovernance (wird zur Dashboard-Komponente) |
| kontakte | Kontakte | Bleibt: PetDeskKontakte |
| vorgaenge | Vorgaenge | Bleibt: PetDeskVorgaenge |
| kunden | Kunden | Bleibt: PetDeskKunden |
| shop | Shop | Bleibt: PetDeskShop |
| billing | Billing | Bleibt: PetDeskBilling |

Die Tabs "Vorgaenge, Kunden, Shop, Billing" bleiben inhaltlich bestehen, da sie Pet-spezifische Funktionen abbilden (Buchungen, Endkunden, Provider-Shop, Abrechnungen). Die einzige Aenderung ist die Umbenennung des ersten Tabs von "Governance" zu "Dashboard".

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/desks/PetmanagerDesk.tsx` | Tab "Governance" in "Dashboard" umbenennen (Zeile 20 + Zeile 35) |

Keine weiteren Dateien betroffen. Keine DB-Migration. Keine Modul-Freeze-Verletzung (Datei liegt in `src/pages/admin/desks/`).

