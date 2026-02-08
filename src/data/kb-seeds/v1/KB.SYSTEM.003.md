---
item_code: KB.SYSTEM.003
category: system
content_type: playbook
title_de: "Wie Armstrong arbeitet: Plan → Propose → Confirm → Execute → Log"
summary_de: "Schritt-für-Schritt-Anleitung zum Verständnis des Armstrong-Workflows."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# Wie Armstrong arbeitet

Armstrong folgt einem strukturierten Workflow für alle Aktionen:

## Der 5-Stufen-Workflow

### 1. Plan (Verstehen)
Armstrong analysiert die Anfrage:
- Was will der Nutzer erreichen?
- Welche Action ist passend?
- Welche Daten werden benötigt?
- Welche Kosten entstehen?

### 2. Propose (Vorschlagen)
Armstrong erstellt einen Vorschlag:
- Konkreter Aktionsplan
- Geschätzte Credits/Kosten
- Erwartetes Ergebnis
- Mögliche Risiken oder Hinweise

### 3. Confirm (Bestätigen)
Der Nutzer prüft und bestätigt:
- Bei `readonly`: Automatisch (kein Gate)
- Bei `execute_with_confirmation`: Explizite Bestätigung
- Bei `draft_only`: Hinweis auf Review-Pflicht
- Anzeige: "X Credits (≈ Y €)"

### 4. Execute (Ausführen)
Armstrong führt die Action aus:
- Zugriff nur auf erlaubte Daten (RLS)
- Audit-Event wird geloggt
- Credits werden reserviert
- Ergebnis wird zurückgegeben

### 5. Log (Dokumentieren)
Vollständige Nachverfolgung:
- `armstrong_action_runs` Eintrag
- Input/Output (redacted)
- Tokens, Kosten, Dauer
- Correlation ID für Debugging

---

## Beispiel: Dokument extrahieren

```
User: "Extrahiere die Daten aus dem Kaufvertrag"

[Plan] Action: ARM.MOD03.EXTRACT_DOC
       Cost: ~10 Credits (≈ 5 €)
       
[Propose] "Ich werde den Kaufvertrag analysieren und 
          folgende Daten extrahieren: ..."

[Confirm] ✓ Nutzer bestätigt

[Execute] → Edge Function sot-document-parser
          → Extraktion läuft
          → Confidence: 94%

[Log] Run ID: abc123
      Status: completed
      Duration: 3.2s
      Tokens: 2,400
```

---

## Warum dieser Workflow?

- **Transparenz:** Nutzer weiß immer, was passiert
- **Kontrolle:** Keine überraschenden Aktionen
- **Audit:** Vollständige Nachvollziehbarkeit
- **Governance:** K3/K4 Compliance automatisch
