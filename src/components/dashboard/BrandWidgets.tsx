/**
 * BrandWidgets — 4 branded tiles linking to Kaufy, FutureRoom, System of a Town, and Acquiary websites.
 * Now delegates to the redesigned BrandLinkWidget for consistent styling.
 */
import { BrandLinkWidget } from '@/components/dashboard/widgets/BrandLinkWidget';

const BRAND_CODES = [
  'SYS.BRAND.KAUFY',
  'SYS.BRAND.FUTUREROOM',
  'SYS.BRAND.SOT',
  'SYS.BRAND.ACQUIARY',
] as const;

export function BrandWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {BRAND_CODES.map((code) => (
        <BrandLinkWidget key={code} code={code} />
      ))}
    </div>
  );
}
