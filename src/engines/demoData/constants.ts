/**
 * Demo Data Engine — Shared Constants
 * 
 * Extracted to break circular dependency between data.ts and petManagerDemo.ts.
 * Both files import from here instead of from each other.
 * 
 * @demo-data
 */

// ─── BASE IDs ──────────────────────────────────────────────
export const DEMO_PRIMARY_PERSON_ID = 'b1f6d204-05ac-462f-9dae-8fba64ab9f88';
export const DEMO_TENANT_ID = 'a0000000-0000-4000-a000-000000000001';
export const DEMO_USER_ID = 'd028bc99-6e29-4fa4-b038-d03015faf222';

// Pet Provider — Lennox & Friends Dog Resorts (Robyn Gebhard, Ottobrunn)
export const DEMO_PET_PROVIDER_LENNOX = 'd0000000-0000-4000-a000-000000000050';
