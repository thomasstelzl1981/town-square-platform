

# FinAPI V2 Integration — Korrigierte Analyse (nach OpenAPI-Spec-Prüfung)

## Erkenntnis aus der OpenAPI-Spec (v2.85.0)

Das Feld heißt laut Spec **`bankingInterface`** (NICHT `interface`).
Referenz: `ImportBankConnectionParams` → `required: [bankId, bankingInterface]`

Der vorherige Fix (Umbenennung zu `interface`) war **falsch** und hat den 400-Fehler verursacht:
`"Entweder enthält die Anfrage keine Daten oder die JSON-Syntax ist ungültig"`

## Korrekter Payload laut OpenAPI-Spec

```json
{
  "bankId": 280001,
  "bankingInterface": "XS2A",
  "loginCredentials": [
    { "label": "Onlinebanking-ID", "value": "demo" },
    { "label": "PIN", "value": "demo" }
  ]
}
```

## Durchgeführte Fixes

1. **`bankingInterface`** zurückgesetzt (war fälschlich zu `interface` geändert)
2. **`bankId`** wird jetzt explizit als `Number()` gecastet (Spec erwartet `integer`)
3. **Login-Label** `"Onlinebanking-ID"` beibehalten (Spec-Beispiel Zeile 16175)
4. **KontenTab** Owner-Query auf `landlord_contexts` umgestellt

