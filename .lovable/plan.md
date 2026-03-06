

# Plan: Textarea in "Lage & Objektbeschreibung" vergrößern

## Problem
Die Textarea für die Objektbeschreibung hat aktuell nur `rows={4}` — viel zu klein für KI-generierte Texte. Die Kachel soll den verfügbaren Platz voll ausnutzen.

## Änderung

**Datei:** `src/components/immobilienakte/editable/EditableAddressBlock.tsx`

1. Card auf `h-full flex flex-col` setzen, damit sie den Container ausfüllt
2. CardContent auf `flex-1 flex flex-col` setzen
3. Den Beschreibungs-Container (`div.space-y-1`) auf `flex-1 flex flex-col` setzen
4. Textarea: `rows={4}` entfernen, stattdessen `className="text-xs flex-1 min-h-[200px]"` — damit füllt sie den restlichen Platz der Kachel aus

Ergebnis: Die Beschreibung nutzt den gesamten verfügbaren Platz innerhalb der Kachel.

