/**
 * BrandPostCard — Social-Media-Post-Vorschau (Zone 1)
 * Zeigt einen Template-Post wie einen echten Social-Media-Beitrag.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Check, X, Pencil, ChevronLeft, ChevronRight,
  Users, MapPin, CreditCard, Calendar, Target,
  Image as ImageIcon, Heart, MessageCircle, Send, Bookmark,
} from 'lucide-react';

const BRAND_COLORS: Record<string, string> = {
  kaufy: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
  futureroom: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
  acquiary: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
};

const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Mehr erfahren',
  SIGN_UP: 'Registrieren',
  GET_QUOTE: 'Angebot einholen',
  CONTACT_US: 'Kontaktieren',
  APPLY_NOW: 'Jetzt bewerben',
  BOOK_NOW: 'Jetzt buchen',
  DOWNLOAD: 'Herunterladen',
  SHOP_NOW: 'Jetzt kaufen',
};

const GENDER_LABELS: Record<number, string> = { 0: 'Alle', 1: 'Männer', 2: 'Frauen' };

interface BrandPostCardProps {
  template: any;
  onRefresh: () => void;
}

export default function BrandPostCard({ template, onRefresh }: BrandPostCardProps) {
  const { user } = useAuth();
  const [imageIndex, setImageIndex] = useState(0);
  const [toggling, setToggling] = useState(false);

  const images: string[] = (template.image_urls && (template.image_urls as string[]).length > 0)
    ? template.image_urls as string[]
    : template.image_url ? [template.image_url] : [];

  const caption = template.editable_fields_schema?.caption?.default || '';
  const cta = template.editable_fields_schema?.cta?.default || '';
  const description = template.description || '';
  const audience = (template.target_audience || {}) as Record<string, any>;
  const defaults = (template.campaign_defaults || {}) as Record<string, any>;
  const gradient = BRAND_COLORS[template.brand_context] || BRAND_COLORS.kaufy;

  const handleToggleApproval = async () => {
    setToggling(true);
    try {
      const newApproved = !template.approved;
      const { error } = await supabase
        .from('social_templates')
        .update({
          approved: newApproved,
          approved_at: newApproved ? new Date().toISOString() : null,
          approved_by: newApproved ? user?.id : null,
        } as any)
        .eq('id', template.id);
      if (error) throw error;
      toast.success(newApproved ? 'Für Zone 2 freigegeben' : 'Freigabe zurückgezogen');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Fehler');
    } finally {
      setToggling(false);
    }
  };

  const formatCents = (c: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(c / 100);

  return (
    <Card className="overflow-hidden">
      {/* Brand accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-0">
          {/* ── Left: Image (4:5) ── */}
          <div className="relative bg-muted aspect-[4/5] max-h-[425px] overflow-hidden">
            {images.length > 0 ? (
              <>
                <img
                  src={images[imageIndex]}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIndex(i => Math.max(0, i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 backdrop-blur-sm"
                      disabled={imageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setImageIndex(i => Math.min(images.length - 1, i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 backdrop-blur-sm"
                      disabled={imageIndex === images.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIndex ? 'bg-white' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <ImageIcon className="h-10 w-10" />
                <span className="text-xs">Kein Bild</span>
              </div>
            )}
          </div>

          {/* ── Right: Content ── */}
          <div className="flex flex-col">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {template.brand_context}
                </span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="text-xs font-mono text-muted-foreground">{template.code}</span>
              </div>
              <Badge variant={template.approved ? 'default' : 'secondary'} className="text-[10px]">
                {template.approved ? 'Freigegeben' : 'Entwurf'}
              </Badge>
            </div>

            {/* Caption */}
            <div className="px-4 flex-1">
              <p className="text-sm font-semibold mb-1">{template.name}</p>
              {caption && <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{caption}</p>}
              {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
            </div>

            {/* CTA Preview */}
            {cta && (
              <div className="px-4 py-2">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate">www.example.com</span>
                  <span className="text-xs font-semibold uppercase">{CTA_LABELS[cta] || cta}</span>
                </div>
              </div>
            )}

            {/* Social actions row */}
            <div className="px-4 py-2 flex items-center justify-between border-t border-border/30">
              <div className="flex items-center gap-4">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <Send className="h-4 w-4 text-muted-foreground" />
              </div>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </div>

            <Separator />

            {/* ── Targeting & Campaign Defaults ── */}
            <div className="px-4 py-3 space-y-3 bg-muted/20">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Zielgruppe & Kampagnen-Defaults
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {audience.age_min != null && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground" />Alter: {audience.age_min}–{audience.age_max || 65}</span>
                )}
                {audience.genders != null && (
                  <span>Geschlecht: {GENDER_LABELS[audience.genders] || 'Alle'}</span>
                )}
                {audience.geo_regions && (audience.geo_regions as string[]).length > 0 && (
                  <span className="flex items-center gap-1 col-span-2"><MapPin className="h-3 w-3 text-muted-foreground" />{(audience.geo_regions as string[]).join(', ')}</span>
                )}
                {audience.interests && (audience.interests as string[]).length > 0 && (
                  <span className="col-span-2 text-muted-foreground">Interessen: {(audience.interests as string[]).join(', ')}</span>
                )}
              </div>
              {(defaults.min_budget_cents || defaults.suggested_duration_days || defaults.credit_cost) && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1 border-t border-border/30">
                  {defaults.min_budget_cents && (
                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-muted-foreground" />Min: {formatCents(defaults.min_budget_cents)}</span>
                  )}
                  {defaults.suggested_budget_cents && (
                    <span>Empfohlen: {formatCents(defaults.suggested_budget_cents)}</span>
                  )}
                  {defaults.suggested_duration_days && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{defaults.suggested_duration_days} Tage</span>
                  )}
                  {defaults.credit_cost && (
                    <span>{defaults.credit_cost} Credits</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="px-4 py-3 flex items-center gap-2 border-t border-border/30">
              <Button
                size="sm"
                variant={template.approved ? 'outline' : 'default'}
                onClick={handleToggleApproval}
                disabled={toggling}
                className="text-xs"
              >
                {template.approved ? <><X className="h-3 w-3 mr-1" />Zurückziehen</> : <><Check className="h-3 w-3 mr-1" />Freigeben</>}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
