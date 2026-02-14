/**
 * SectionRenderer — Maps section_type to the correct renderer component.
 * Used by both Zone 2 (live preview) and Zone 3 (public delivery).
 * Supports optional `editable` mode for inline editing.
 */
import type { WebsiteSection, WebsiteBranding, SectionType } from './types';
import { SectionHero } from './SectionHero';
import { SectionFeatures } from './SectionFeatures';
import { SectionAbout } from './SectionAbout';
import { SectionServices } from './SectionServices';
import { SectionTestimonials } from './SectionTestimonials';
import { SectionGallery } from './SectionGallery';
import { SectionContact } from './SectionContact';
import { SectionFooter } from './SectionFooter';

const RENDERERS: Record<SectionType, React.ComponentType<any>> = {
  hero: SectionHero,
  features: SectionFeatures,
  about: SectionAbout,
  services: SectionServices,
  testimonials: SectionTestimonials,
  gallery: SectionGallery,
  contact: SectionContact,
  footer: SectionFooter,
};

interface Props {
  sections: WebsiteSection[];
  branding?: WebsiteBranding;
  /** For Zone 3 contact form submissions */
  leadCaptureUrl?: string;
  websiteId?: string;
  tenantId?: string;
  /** Enable inline editing */
  editable?: boolean;
  /** Called when a section's content changes (sectionId, field, value) */
  onSectionContentChange?: (sectionId: string, field: string, value: any) => void;
}

export function SectionRenderer({ sections, branding, leadCaptureUrl, websiteId, tenantId, editable, onSectionContentChange }: Props) {
  const visibleSections = sections
    .filter(s => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="min-h-screen">
      {visibleSections.map(section => {
        const Component = RENDERERS[section.section_type];
        if (!Component) return null;
        return (
          <Component
            key={section.id}
            content={section.content_json}
            design={section.design_json}
            branding={branding}
            leadCaptureUrl={section.section_type === 'contact' ? leadCaptureUrl : undefined}
            websiteId={websiteId}
            tenantId={tenantId}
            editable={editable}
            onContentChange={editable ? (field: string, value: any) => onSectionContentChange?.(section.id, field, value) : undefined}
          />
        );
      })}
    </div>
  );
}
