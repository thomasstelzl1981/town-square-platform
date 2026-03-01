

## Fix: Correct Twilio Regulatory Compliance API URL

### Problem
The `ItemAssignments` lookup returns **404** because the URL path is wrong:
- Current (broken): `https://api.ie1.twilio.com/2010-04-01/Accounts/{SID}/RegulatoryCompliance/Bundles/{bundle}/ItemAssignments.json`
- Correct: `https://api.twilio.com/v2/RegulatoryCompliance/Bundles/{bundle}/ItemAssignments`

Two issues:
1. Regulatory Compliance is a **v2 API** — not under `/2010-04-01/Accounts/`
2. The v2 API may only be available on `api.twilio.com` (not regional `api.ie1.twilio.com`)

Because the 404 triggers the fallback, the generic account address (`AD0aed...`) is used, which is NOT the one inside the bundle → Twilio rejects with error 21651.

### Fix (single file: `supabase/functions/sot-phone-provision/index.ts`)

**Line 223** — Change the URL to use `api.twilio.com` directly with the correct v2 path:
```typescript
// Before (wrong path + regional host):
const assignUrl = `https://${selectedHost}/2010-04-01/Accounts/${TWILIO_SID}/RegulatoryCompliance/Bundles/${bundleSid}/ItemAssignments.json`;

// After (correct v2 path on main host):
const assignUrl = `https://api.twilio.com/v2/RegulatoryCompliance/Bundles/${bundleSid}/ItemAssignments`;
```

No other changes needed. Once the URL is correct, the bundle's actual address SID will be returned and used for the purchase — no more fallback, no more mismatch.

