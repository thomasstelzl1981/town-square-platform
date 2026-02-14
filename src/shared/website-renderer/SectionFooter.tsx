import type { SectionContent, SectionDesign } from './types';
import { EditableText } from './EditableHelpers';

interface FooterLink {
  label: string;
  url: string;
}

interface Props {
  content: SectionContent;
  design: SectionDesign;
  editable?: boolean;
  onContentChange?: (field: string, value: any) => void;
}

export function SectionFooter({ content, design, editable, onContentChange }: Props) {
  const companyName = (content.company_name as string) || '';
  const impressumUrl = (content.impressum_url as string) || '';
  const datenschutzUrl = (content.datenschutz_url as string) || '';
  const links = (content.links as FooterLink[]) || [];
  const up = (f: string, v: any) => onContentChange?.(f, v);

  return (
    <footer className="py-8 px-6 border-t border-border/30" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {editable ? (
          <EditableText value={`© ${new Date().getFullYear()} ${companyName}. Alle Rechte vorbehalten.`} onChange={v => up('company_name', v.replace(/© \d{4} /, '').replace('. Alle Rechte vorbehalten.', ''))} tag="p" className="text-sm text-muted-foreground" />
        ) : (
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {companyName}. Alle Rechte vorbehalten.
          </p>
        )}
        <div className="flex items-center gap-4 text-sm">
          {impressumUrl && <a href={impressumUrl} className="text-muted-foreground hover:text-foreground transition-colors">Impressum</a>}
          {datenschutzUrl && <a href={datenschutzUrl} className="text-muted-foreground hover:text-foreground transition-colors">Datenschutz</a>}
          {links.map((link, i) => (
            <a key={i} href={link.url} className="text-muted-foreground hover:text-foreground transition-colors">{link.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
