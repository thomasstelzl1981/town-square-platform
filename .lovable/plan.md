

## Problem Analysis

Two bugs in `sot-phone-provision/index.ts`:

### Bug 1: Search returns numbers from all of Germany
Line 144 uses `Contains=89` which matches any number containing "89" anywhere (e.g. Berlin +4930758**89**49). The Twilio `Contains` parameter does substring matching, not prefix matching.

**Fix**: Change the hardcoded area code from `"89"` to `"+4989"` so it matches the international prefix, filtering to only Munich numbers.

### Bug 2: Purchase fails with error 21631 (AddressSid empty)
The previous fix (for error 21651) removed `AddressSid` when `BundleSid` is present. But Twilio requires BOTH for German local numbers. The catch: the `AddressSid` must be the one registered INSIDE the bundle — not a random address from the account.

Currently line 219 fetches the first address from the general `Addresses.json` endpoint, which may not be the address registered in the bundle (that caused error 21651).

**Fix**: Query the Regulatory Bundle's Item Assignments API (`/v2/RegulatoryCompliance/Bundles/{BundleSid}/ItemAssignments`) to find the correct address SID that belongs to the bundle, then send both `BundleSid` AND `AddressSid` in the purchase request.

### Changes — single file: `supabase/functions/sot-phone-provision/index.ts`

1. **Line 135**: Change `"89"` to `"+4989"` so `Contains=%2B4989` only returns Munich numbers
2. **Lines 216-232**: Replace the generic address lookup with a bundle-specific item assignment query that extracts the address SID from the approved bundle
3. **Lines 259-269**: Send BOTH `BundleSid` and the bundle's own `AddressSid` for DE purchases

