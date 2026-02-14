/**
 * WebsiteThumbnail — Scaled-down mini-preview of a website using SectionRenderer
 */
import { SectionRenderer } from '@/shared/website-renderer';
import type { WebsiteSection, WebsiteBranding } from '@/shared/website-renderer/types';

interface Props {
  sections: WebsiteSection[];
  branding?: WebsiteBranding;
  className?: string;
}

export function WebsiteThumbnail({ sections, branding, className }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-white ${className || ''}`}>
      <div
        className="origin-top-left pointer-events-none"
        style={{
          width: '1200px',
          transform: 'scale(0.18)',
          transformOrigin: 'top left',
        }}
      >
        <SectionRenderer sections={sections} branding={branding} />
      </div>
    </div>
  );
}
