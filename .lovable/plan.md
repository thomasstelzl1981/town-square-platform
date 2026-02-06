# MOD-01 Stammdaten: Bereinigung und Neustrukturierung

## STATUS: ✅ ABGESCHLOSSEN (2026-02-06)

### Durchgeführte Änderungen

| Datei | Aktion | Status |
|-------|--------|--------|
| `src/pages/portal/stammdaten/PersonenTab.tsx` | **GELÖSCHT** | ✅ |
| `src/pages/portal/stammdaten/FirmaTab.tsx` | **GELÖSCHT** | ✅ |
| `src/pages/portal/stammdaten/VertraegeTab.tsx` | **NEU** — Verträge-Übersicht | ✅ |
| `src/pages/portal/stammdaten/index.ts` | **UPDATE** — Exporte bereinigt | ✅ |
| `src/pages/portal/StammdatenPage.tsx` | **UPDATE** — Routen angepasst + Legacy-Redirects | ✅ |
| `src/manifests/routesManifest.ts` | **UPDATE** — Tile "firma" → "vertraege" | ✅ |
| `src/components/portal/HowItWorks/moduleContents.ts` | **UPDATE** — SubTile angepasst | ✅ |

### Neue 4-Tile-Struktur

| Route | Titel | Icon | Beschreibung |
|-------|-------|------|--------------|
| `/profil` | Profil | User | Persönliche Daten + Kontakt |
| `/vertraege` | Verträge | FileText | **NEU:** Alle Vereinbarungen |
| `/abrechnung` | Abrechnung | CreditCard | Zahlungen + Credits |
| `/sicherheit` | Sicherheit | Shield | Passwort + 2FA |

### VertraegeTab Datenquellen

| Quelle | Vertragstyp |
|--------|-------------|
| `user_consents` + `agreement_templates` | AGB, Datenschutz, SCHUFA |
| `finance_mandates` | Finanzierungsbeauftragung |
| `listings` (mit sales_mandate_consent_id) | Verkaufsmandate |
| `commissions` (mit agreement_consent_id) | Provisionsvereinbarungen |
| `acq_mandates` | Suchaufträge |

### Legacy-Redirects

- `/portal/stammdaten/firma` → `/portal/stammdaten/vertraege`
- `/portal/stammdaten/personen` → `/portal/stammdaten/profil`

---

## Ergebnis

1. ✅ **Saubere 4-Tile-Struktur:** Profil, Verträge, Abrechnung, Sicherheit
2. ✅ **Keine versteckten Routen:** `/personen` und `/firma` existieren nicht mehr
3. ✅ **Zentrale Vertrags-Übersicht:** Alle Vereinbarungen an einem Ort
4. ✅ **Konsistenz:** Manifest, Katalog und Code sind synchron
5. ✅ **Zukunftssicher:** Neue Vertragstypen (Payment, Legal) können einfach hinzugefügt werden

