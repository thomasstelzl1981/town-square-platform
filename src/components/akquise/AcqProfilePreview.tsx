/**
 * AcqProfilePreview — DIN-A4 CI-konforme Vorschau des Ankaufsprofils
 * 
 * Read-only Vorschau, exakt wie das exportierte PDF.
 * DIN-A4-Proportionen, Armstrong-Logo, professionelle Typografie.
 */

import logoLight from '@/assets/logos/armstrong_logo_light.png';

interface ProfileData {
  region?: string;
  asset_focus?: string[];
  price_min?: number | null;
  price_max?: number | null;
  yield_target?: number | null;
  exclusions?: string;
}

interface AcqProfilePreviewProps {
  clientName: string;
  profileData: ProfileData | null;
  profileTextLong: string;
  logoUrl?: string;
}

function formatPrice(val?: number | null): string {
  if (!val) return '';
  if (val >= 1_000_000) return `${(val / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio. EUR`;
  if (val >= 1_000) return `${(val / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} Tsd. EUR`;
  return `${val.toLocaleString('de-DE')} EUR`;
}

function formatPriceRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return '–';
  if (min && max) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (min) return `ab ${formatPrice(min)}`;
  return `bis ${formatPrice(max)}`;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-[3px]" style={{ fontFamily: "'D-DIN', 'DIN', ui-sans-serif, system-ui, sans-serif" }}>
      <span className="w-[140px] shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="text-[11px] text-gray-800">{value}</span>
    </div>
  );
}

export function AcqProfilePreview({ clientName, profileData, profileTextLong, logoUrl }: AcqProfilePreviewProps) {
  const logo = logoUrl || logoLight;
  const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!profileData) return null;

  return (
    <div
      className="mx-auto bg-white rounded-sm shadow-lg overflow-hidden"
      style={{
        aspectRatio: '210 / 297',
        maxWidth: '680px',
        fontFamily: "'D-DIN', 'DIN', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Inner padding simulating DIN-A4 margins */}
      <div className="relative h-full w-full px-[48px] py-[40px] flex flex-col">

        {/* ── Logo (top right) ── */}
        <div className="flex justify-end mb-[24px]">
          <img
            src={logo}
            alt="Armstrong"
            className="h-[36px] w-auto object-contain"
          />
        </div>

        {/* ── Title ── */}
        <h1
          className="text-[22px] font-bold tracking-[0.08em] text-gray-900 uppercase mb-[4px]"
          style={{ letterSpacing: '0.08em' }}
        >
          ANKAUFSPROFIL
        </h1>
        <p className="text-[9px] text-gray-400 tracking-wide mb-[20px]">
          Erstellt am {today}
        </p>

        {/* ── Divider ── */}
        <div className="w-full h-[1px] bg-gray-200 mb-[16px]" />

        {/* ── Client ── */}
        <h2 className="text-[14px] font-semibold text-gray-800 mb-[16px]">
          Mandant: {clientName || 'Investor'}
        </h2>

        {/* ── Profile data table ── */}
        <div className="mb-[20px]">
          <DataRow label="Suchgebiet" value={profileData.region || '–'} />
          <DataRow label="Asset-Fokus" value={profileData.asset_focus?.join(', ') || '–'} />
          <DataRow label="Investitionsrahmen" value={formatPriceRange(profileData.price_min, profileData.price_max)} />
          <DataRow label="Zielrendite" value={profileData.yield_target ? `${profileData.yield_target} %` : '–'} />
          <DataRow label="Ausschlüsse" value={profileData.exclusions || '–'} />
        </div>

        {/* ── Divider ── */}
        <div className="w-full h-[1px] bg-gray-200 mb-[16px]" />

        {/* ── Summary text ── */}
        {profileTextLong && (
          <p className="text-[10px] leading-[1.7] text-gray-700 whitespace-pre-wrap flex-1">
            {profileTextLong}
          </p>
        )}

        {/* ── Footer spacer ── */}
        <div className="mt-auto pt-[24px]">
          <div className="w-full h-[1px] bg-gray-100" />
          <p className="text-[7px] text-gray-300 mt-[6px] text-center tracking-wider">
            Armstrong Advisory · Vertraulich
          </p>
        </div>
      </div>
    </div>
  );
}
