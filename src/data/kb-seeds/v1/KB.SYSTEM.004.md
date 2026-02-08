---
item_code: KB.SYSTEM.004
category: system
content_type: faq
title_de: "Was ist SSOT? Warum MOD-04 Dossier die Wahrheit ist"
summary_de: "FAQ zur Single Source of Truth und der zentralen Rolle des Immobilien-Dossiers."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# FAQ: Single Source of Truth (SSOT)

## Was bedeutet SSOT?

**Single Source of Truth** (Einzige Wahrheitsquelle) bedeutet, dass es für jede Information genau einen autoritativen Speicherort gibt. Änderungen erfolgen nur dort.

---

## Warum ist das MOD-04 Dossier die SSOT für Immobilien?

Das Immobilien-Dossier in MOD-04 ist die zentrale Wahrheit für alle Objektdaten:

- **Stammdaten:** Adresse, Baujahr, Fläche
- **Einheiten:** Wohnungen, Gewerbe, Stellplätze
- **Mietverträge:** Aktuelle und historische
- **Dokumente:** Verknüpft aus dem DMS
- **KPIs:** Berechnet aus den Rohdaten

---

## Was passiert, wenn Daten an mehreren Stellen liegen?

❌ **Problem:** Inkonsistenz
- Finanzierung zeigt andere Fläche als Dossier
- Investment-Rechner verwendet veraltete Miete
- Export enthält widersprüchliche Werte

✅ **Lösung:** SSOT-Prinzip
- Alle Module lesen aus MOD-04
- Änderungen nur im Dossier
- Automatische Synchronisation

---

## Wie hilft Armstrong dabei?

Armstrong:
1. **Prüft Datenqualität** (ARM.MOD04.DATA_QUALITY_CHECK)
2. **Berechnet KPIs** aus aktuellen Dossier-Daten
3. **Warnt bei Inkonsistenzen**
4. **Schlägt fehlende Dokumente vor**

---

## Wichtige Regeln

| Regel | Beschreibung |
|-------|--------------|
| Dossier ist Master | Alle anderen Module lesen von dort |
| Keine Duplikate | Daten existieren nur einmal |
| Änderungen geloggt | Audit-Trail für alle Mutationen |
| Armstrong respektiert SSOT | Schreibt nur nach Bestätigung |
