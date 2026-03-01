

## Diagnose — Alle SIDs aus den Screenshots abgeglichen

### Was die Screenshots zeigen

**Bundle `BU7b6e70441548870e7a0655d5b4d63474`** — Status: **Accepted** ✅

| Typ | SID | Status |
|---|---|---|
| Address (im Bundle-Profil) | `ADdfec635e3ea56ba7095db1d937345dce` | ✅ Im Bundle |
| End-User | `IT497b63a248b6146837a24319559bf722` | ✅ ItemAssignment |
| Handelsregisterauszug | `RD6e82b1d216c57c7a48d44c99dae9400e` | ✅ ItemAssignment |
| Gewerbeanmeldung | `RDa47525be4ecf79186a554964b53990cd` | ✅ ItemAssignment |

**Callback URL**: Leer (`-`) — das ist OK für den Kaufprozess, nicht erforderlich.

### Das Problem

Die Adresse `ADdfec635e3ea56ba7095db1d937345dce` ist im Bundle-**Profil** eingebettet, aber sie taucht **nicht** als eigenes ItemAssignment auf (die API gibt nur RD... und IT... zurück). Der Code sucht in ItemAssignments nach einem `AD`-prefixed SID → findet nichts → sendet keinen AddressSid → Fehler 21631.

Der vorherige Fehler 21651 kam, weil eine **andere** Adresse (`AD0aed...`) gesendet wurde, die nicht zu diesem Bundle gehört. Die richtige Adresse `ADdfec...` wurde nie versucht.

### Fix — Einfach und direkt

Die Bundle-eigene AddressSid `ADdfec635e3ea56ba7095db1d937345dce` als Konstante hinterlegen und zusammen mit der BundleSid senden.

**Änderung in `supabase/functions/sot-phone-provision/index.ts`:**

1. Neue Konstante neben `DE_BUNDLES`:
```typescript
const DE_BUNDLE_ADDRESS: Record<string, string | null> = {
  Local: "ADdfec635e3ea56ba7095db1d937345dce",
  Mobile: null,
  TollFree: null,
};
```

2. Im Purchase-Block (Zeilen 316-330) — beide Parameter senden:
```typescript
if (cc === "DE") {
  const bundleSid = DE_BUNDLES[purchaseType];
  const bundleAddr = DE_BUNDLE_ADDRESS[purchaseType];
  if (bundleSid) {
    buyParams.BundleSid = bundleSid;
    console.log("Using BundleSid for DE:", bundleSid);
  }
  if (bundleAddr) {
    buyParams.AddressSid = bundleAddr;
    console.log("Using bundle AddressSid for DE:", bundleAddr);
  }
} else if (addressSid) {
  buyParams.AddressSid = addressSid;
}
```

### Warum das funktioniert

- `ADdfec...` ist die Adresse, die **im Bundle-Profil** steht (Screenshot 2)
- Vorher wurde `AD0aed...` gesendet → "not contained in bundle" (21651)
- Vorher wurde gar keine gesendet → "Address required" (21631)
- Jetzt senden wir die **richtige** Adresse, die zum genehmigten Bundle gehört

### Callback URL

Nicht erforderlich für den Nummernkauf. Die Voice/StatusCallback URLs werden bereits im Code über `VoiceUrl` und `StatusCallback` Parameter beim Kauf gesetzt.

