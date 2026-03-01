

## Problem

Twilio error 21651: **"Address not contained in bundle"**

The code sends both `AddressSid` and `BundleSid` in the purchase request. The `AddressSid` is fetched separately (line 219) and may not be the same address that's registered inside the bundle. When a `BundleSid` is provided, Twilio expects the address to come FROM the bundle — sending a separate `AddressSid` causes a mismatch.

## Fix

**File: `supabase/functions/sot-phone-provision/index.ts`** (lines 257-259)

When a `BundleSid` is being used (DE + Local), do **not** send `AddressSid` at all. The bundle already contains the verified address. Only fall back to `AddressSid` when no bundle is used.

```text
Current logic (broken):
  if (addressSid) buyParams.AddressSid = addressSid    ← always added
  if (bundleSid)  buyParams.BundleSid = bundleSid      ← also added → conflict

Fixed logic:
  if (bundleSid)  buyParams.BundleSid = bundleSid      ← bundle includes address
  else if (addressSid) buyParams.AddressSid = addressSid ← fallback only
```

One change, ~5 lines affected. No UI changes needed.

