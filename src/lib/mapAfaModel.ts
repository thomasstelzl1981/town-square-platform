/**
 * Maps detailed AfA model keys from the Immobilienakte (property_accounting)
 * to the simplified engine-compatible model identifiers.
 *
 * Immobilienakte uses: '7_4_1', '7_4_2a', '7_4_2b', '7_4_2c', '7_5a', '7b', '7h', '7i', 'rnd'
 * Engine accepts:      'linear' | '7i' | '7h' | '7b'
 */
export function mapAfaModelToEngine(
  akteModel?: string | null
): 'linear' | '7i' | '7h' | '7b' {
  if (!akteModel) return 'linear';

  const normalized = akteModel.trim().toLowerCase();

  if (normalized === '7i') return '7i';
  if (normalized === '7h') return '7h';
  if (normalized === '7b') return '7b';

  // §7 Abs. 5a EStG (degressiv) → closest Sonder-AfA bucket
  if (normalized === '7_5a') return '7b';

  // All linear variants: 7_4_1, 7_4_2a, 7_4_2b, 7_4_2c, rnd, or any unknown → linear
  return 'linear';
}
