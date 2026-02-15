# 03 — Actions (Armstrong Action Registry)

> **SSOT-Delegation**: Die kanonische Quelle für alle Armstrong-Actions ist  
> `src/manifests/armstrongManifest.ts`

Dieses Verzeichnis dient als Spec-Referenz. Es werden keine separaten Action-Spec-Dateien gepflegt,  
da das TypeScript-Manifest die vollständige Definition inklusive:

- Action Codes und Display-Namen
- Zone-Zuordnung (Z1/Z2/Z3)
- Berechtigungsstufen (readonly/write/admin)
- Input/Output-Schemas
- Confirmation-Requirements (2-Step Verification)
- Cost-Model und Credit-Zuordnung

enthält.

## Action-Kategorien (Stand 2026-02-15)

| Kategorie | Beispiele | Zone |
|-----------|-----------|------|
| Navigation | module.open, tile.navigate | Z2 |
| Data Query | property.search, contact.lookup | Z2 |
| Data Write | property.create, lease.update | Z2 (confirm) |
| Analysis | investment.calculate, nk.simulate | Z2 |
| Communication | email.draft, whatsapp.send | Z2 (confirm) |
| Research | web.search, market.analyze | Z2 (opt-in) |
| Admin/Governance | override.set, kb.publish | Z1 |
| Public/FAQ | faq.answer, calculator.run | Z3 (readonly) |

Siehe: `src/manifests/armstrongManifest.ts`
