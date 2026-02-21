# MOD-21 — KI-Browser

## Übersicht
| Feld | Wert |
|---|---|
| Modul-Code | MOD-21 |
| Titel | KI-Browser |
| Zone | 2 (Portal) |
| Status | Active |
| Freeze | true |
| tile_code | MOD-21 |
| icon_key | Globe |

## Beschreibung
Das KI-Browser-Modul ermöglicht Armstrong das kontrollierte Webbrowsen unter strikter Governance. Armstrong kann im Auftrag des Nutzers Webseiten besuchen, Inhalte extrahieren, Screenshots erstellen und strukturierte Rechercheergebnisse liefern — alles unter voller Kontrolle und Transparenz.

## Kernfunktionen
- **Kontrolliertes Webbrowsen**: Armstrong navigiert Webseiten im Auftrag des Nutzers
- **Quellen & Belege**: Alle besuchten Seiten werden mit Zeitstempel dokumentiert
- **Step-Timeline**: Jede Aktion wird als Schritt in einer Timeline protokolliert
- **User Approval Gate**: Risikobehaftete Aktionen erfordern explizite Nutzer-Freigabe
- **Harte Guardrails**: Automatische Blockierung sensibler Eingaben (Passwörter, OTPs)

## Architektur
- **Engine**: `sot-ki-browser` Edge Function (fetch-basiert mit Retry-Logik)
- **Speicher**: Artefakte im privaten Pfad `{tenant_id}/MOD_21/`
- **Logging**: Alle Aktionen im `data_event_ledger`

## Sub-Tiles
| Route | Titel |
|---|---|
| /portal/ki-browser/uebersicht | Übersicht |
| /portal/ki-browser/session | Session |
| /portal/ki-browser/quellen | Quellen & Belege |
| /portal/ki-browser/vorlagen | Vorlagen |
| /portal/ki-browser/policies | Policies |

## Armstrong Actions
| Action Code | Mode | Cost |
|---|---|---|
| ARM.BROWSER.NAVIGATE | readonly | credit |
| ARM.BROWSER.EXTRACT_TEXT | readonly | credit |
| ARM.BROWSER.SCREENSHOT | readonly | credit |
| ARM.BROWSER.SEARCH | readonly | credit |
| ARM.BROWSER.FILL_FORM | write | credit |
| ARM.BROWSER.CLICK | write | credit |
| ARM.BROWSER.SCROLL | readonly | free |
| ARM.BROWSER.BACK | readonly | free |
| ARM.BROWSER.SUMMARIZE | readonly | credit |
| ARM.BROWSER.MULTI_STEP | write | credit |

## Governance
- Alle Aktionen werden im `data_event_ledger` protokolliert
- HTTP/2-Fehler werden automatisch mit Retry-Logik behandelt
- Sensible Eingaben (Passwörter, OTPs) werden automatisch blockiert
