---
item_code: KB.RE.024
category: real_estate
content_type: playbook
title_de: "Dossier Data Quality: Missing Fields schließen"
summary_de: "Schritt-für-Schritt zur Vervollständigung des Immobilien-Dossiers."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "high"
valid_until: null
sources: []
---

# Dossier Data Quality verbessern

## Ziel

Ein vollständiges Dossier ermöglicht:
- Präzise KPI-Berechnung
- Erfolgreiche Finanzierungsanfrage
- Fundierte Kaufentscheidung

---

## Schritt 1: Status prüfen

Rufe `ARM.MOD04.DATA_QUALITY_CHECK` auf oder nutze die Dossier-Ansicht.

### Typische Missing Fields

**Stammdaten:**
- [ ] Baujahr
- [ ] Wohnfläche
- [ ] Grundstücksfläche
- [ ] Gebäudetyp

**Finanzen:**
- [ ] Kaufpreis
- [ ] Kaufnebenkosten
- [ ] Renovierungsbudget

**Vermietung:**
- [ ] IST-Kaltmiete
- [ ] IST-Nebenkosten
- [ ] Mietvertragsdaten

---

## Schritt 2: Quellen identifizieren

| Feld | Quelle |
|------|--------|
| Baujahr | Grundbuch, Exposé, Energieausweis |
| Wohnfläche | Wohnflächenberechnung, Grundriss |
| Kaufpreis | Kaufvertragsentwurf |
| Miete | Mietvertrag |
| Hausgeld | Wirtschaftsplan, WEG-Abrechnung |

---

## Schritt 3: Dokumente hochladen

1. Gehe zu **MOD-03 DMS**
2. Lade relevante Dokumente hoch
3. Verknüpfe mit der Immobilie (Property Link)

→ Armstrong kann Daten aus Dokumenten extrahieren (`ARM.MOD03.EXTRACT_DOC`)

---

## Schritt 4: Felder manuell ergänzen

1. Öffne das Dossier in **MOD-04**
2. Klicke auf "Bearbeiten"
3. Fülle die fehlenden Felder aus
4. Speichern

---

## Schritt 5: KPIs neu berechnen

Nach Dateneingabe:
- `ARM.MOD04.CALCULATE_KPI` ausführen
- Rendite, Cashflow, DSCR werden aktualisiert

---

## Qualitätsstufen

| Score | Status | Bedeutung |
|-------|--------|-----------|
| 90-100% | 🟢 Vollständig | Bereit für Finanzierung |
| 70-89% | 🟡 Gut | Kernfelder vorhanden |
| 50-69% | 🟠 Lückenhaft | Wichtige Daten fehlen |
| < 50% | 🔴 Unvollständig | Nicht verwertbar |

---

## Armstrong-Unterstützung

- `ARM.MOD04.DATA_QUALITY_CHECK` → Zeigt fehlende Felder
- `ARM.MOD04.SUGGEST_DOCUMENTS_CHECKLIST` → Welche Dokumente fehlen
- `ARM.MOD03.EXTRACT_DOC` → Extrahiert Daten aus Dokumenten

---

## Best Practices

1. **Früh beginnen:** Schon bei Interesse Daten sammeln
2. **Original-Dokumente:** Nicht auf Makler-Angaben verlassen
3. **Verknüpfung nutzen:** DMS → Dossier Link
4. **Regelmäßig prüfen:** Vor jedem wichtigen Schritt
