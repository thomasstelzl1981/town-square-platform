

## Fix: Circular Dependency in Pet Manager Demo Data

### Problem

The page `/portal/pets/meine-tiere` crashes with:
```
ReferenceError: Cannot access 'DEMO_TENANT_ID' before initialization
```

This is caused by a **circular dependency**:
- `petManagerDemo.ts` imports from `data.ts`
- `data.ts` imports from `petManagerDemo.ts`

When JavaScript resolves this cycle, `DEMO_TENANT_ID` is not yet initialized when `petManagerDemo.ts` tries to use it.

### Fix

Move `DEMO_TENANT_ID` and `DEMO_PET_PROVIDER_LENNOX` out of `data.ts` into a shared constants file that both can import from without cycles.

**Option: Extract to `src/engines/demoData/constants.ts`**

1. Create `src/engines/demoData/constants.ts` with the shared IDs (`DEMO_TENANT_ID`, `DEMO_USER_ID`, `DEMO_PRIMARY_PERSON_ID`, `DEMO_PET_PROVIDER_LENNOX`, and any other base IDs used across files)
2. Update `data.ts` to import these from `constants.ts` instead of defining them (re-export for backward compatibility)
3. Update `petManagerDemo.ts` to import from `constants.ts` instead of `data.ts`
4. Update `index.ts` to re-export `constants.ts`

### Files Changed

- **New**: `src/engines/demoData/constants.ts` (shared base IDs)
- **Edit**: `src/engines/demoData/data.ts` (import + re-export from constants instead of defining)
- **Edit**: `src/engines/demoData/petManagerDemo.ts` (import from constants instead of data)
- **Edit**: `src/engines/demoData/index.ts` (re-export constants)

No other files need changes -- all existing imports from `data.ts` continue to work via re-export.

