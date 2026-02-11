# Contract: Lead Capture

| Feld | Wert |
|------|------|
| **Name** | Lead Capture |
| **Direction** | Z3 → Z1 |
| **Trigger** | Form-Submit auf Kaufy/Website (Interessentenformular) |
| **Payload-Schema** | `{ lead_source: string, source_url: string, contact_data: { first_name, last_name, email, phone?, message? }, property_id?: string, listing_id?: string }` |
| **IDs/Correlation** | `lead_id` (generiert), `listing_id` (optional), `source_url` |
| **SoT nach Übergabe** | Z1 Lead Pool (`leads` Tabelle) |
| **Code-Fundstelle** | `supabase/functions/sot-lead-inbox/` |
| **Fehlerfälle/Retry** | 24h-Deduplizierung via E-Mail. Bei Edge-Function-Fehler: HTTP 500, Client zeigt Fehlermeldung. Kein automatischer Retry. |

## Ablauf

1. Interessent füllt Formular auf Z3-Website aus
2. POST an Edge Function `sot-lead-inbox`
3. Deduplizierung (24h-Fenster, gleiche E-Mail + Listing)
4. INSERT in `leads` Tabelle mit Status `new`
5. Lead erscheint im Z1 Admin Lead Pool
6. Admin weist Lead an Partner (MOD-09) zu

## Datenfluss

```
Z3 (Website) → Edge Function → leads (DB) → Z1 (Admin Pool) → Z2 (MOD-09 Partner)
```
