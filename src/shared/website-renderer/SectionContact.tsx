import { useState } from 'react';
import type { SectionContent, SectionDesign } from './types';

interface Props {
  content: SectionContent;
  design: SectionDesign;
  branding?: { primary_color?: string };
  /** Edge function URL for lead capture (Zone 3 only) */
  leadCaptureUrl?: string;
  websiteId?: string;
  tenantId?: string;
}

export function SectionContact({ content, design, branding, leadCaptureUrl, websiteId, tenantId }: Props) {
  const title = (content.title as string) || 'Kontakt';
  const subtitle = (content.subtitle as string) || 'Wir freuen uns auf Ihre Nachricht';
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leadCaptureUrl) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await fetch(leadCaptureUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          message: form.get('message'),
          website_id: websiteId,
          tenant_id: tenantId,
        }),
      });
      setSubmitted(true);
    } catch {
      // silently fail in public
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-16 px-6" style={{ backgroundColor: design.backgroundColor || 'hsl(var(--muted) / 0.3)' }}>
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">{title}</h2>
        <p className="text-center text-muted-foreground mb-8">{subtitle}</p>
        {submitted ? (
          <div className="text-center p-8 bg-background rounded-xl border border-border/30">
            <p className="text-lg font-semibold mb-2">Vielen Dank!</p>
            <p className="text-sm text-muted-foreground">Wir melden uns schnellstmöglich bei Ihnen.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" placeholder="Name" required
              className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input name="email" type="email" placeholder="E-Mail" required
              className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input name="phone" placeholder="Telefon (optional)"
              className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <textarea name="message" placeholder="Ihre Nachricht" rows={4} required
              className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: branding?.primary_color || 'hsl(var(--primary))' }}
            >
              {loading ? 'Wird gesendet...' : 'Nachricht senden'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
