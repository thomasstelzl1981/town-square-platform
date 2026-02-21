/**
 * ManagerApplicationForm — Shared application form for all Zone 3 career pages.
 * Inserts into manager_applications (anonymous, no login required).
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QualificationField {
  key: string;
  label: string;
  type: 'text' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export type BrandId = 'futureroom' | 'acquiary' | 'kaufy' | 'sot' | 'lennox';

interface ManagerApplicationFormProps {
  brand: BrandId;
  requestedRoles: string[];
  qualificationFields?: QualificationField[];
  /** Optional role selector — if set, user picks from this list */
  roleSelector?: { value: string; label: string }[];
  className?: string;
  /** Brand-specific styling */
  accentColor?: string;
  onSuccess?: () => void;
}

// ─── Validation ──────────────────────────────────────────────────────────────

const baseSchema = z.object({
  name: z.string().trim().min(2, 'Name erforderlich').max(100),
  email: z.string().trim().email('Ungültige E-Mail-Adresse').max(255),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(1000).optional(),
});

// ─── Component ───────────────────────────────────────────────────────────────

export function ManagerApplicationForm({
  brand,
  requestedRoles,
  qualificationFields = [],
  roleSelector,
  className,
  accentColor,
  onSuccess,
}: ManagerApplicationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(requestedRoles[0] || '');
  const [qualData, setQualData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleQualChange = (key: string, value: string) => {
    setQualData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate base fields
    const parsed = baseSchema.safeParse({ name, email, phone, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Bitte prüfen Sie Ihre Eingaben.');
      return;
    }

    // Validate required qualification fields
    for (const field of qualificationFields) {
      if (field.required && !qualData[field.key]?.trim()) {
        toast.error(`Bitte füllen Sie "${field.label}" aus.`);
        return;
      }
    }

    setLoading(true);
    try {
      const role = roleSelector ? selectedRole : requestedRoles[0];

      const { error } = await supabase.from('manager_applications').insert({
        requested_role: role,
        qualification_data: qualData,
        status: 'submitted',
        source_brand: brand,
        applicant_name: parsed.data.name,
        applicant_email: parsed.data.email,
        applicant_phone: parsed.data.phone || null,
        tenant_id: null,
        user_id: null,
      } as never);

      if (error) throw error;

      setSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Application submit error:', err);
      toast.error('Fehler beim Senden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success State ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-emerald-500" />
          <h3 className="text-xl font-bold">Bewerbung eingegangen!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vielen Dank für Ihr Interesse. Wir prüfen Ihre Unterlagen und melden uns innerhalb von 48 Stunden.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Input class helper ─────────────────────────────────────────────────

  const inputClass = accentColor
    ? `w-full px-3 py-2 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent`
    : undefined;

  const focusStyle = accentColor
    ? { '--tw-ring-color': accentColor } as React.CSSProperties
    : undefined;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name + Email */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Name <span className="text-destructive">*</span></Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Max Mustermann"
                maxLength={100}
                required
                className={inputClass}
                style={focusStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">E-Mail <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="max@beispiel.de"
                maxLength={255}
                required
                className={inputClass}
                style={focusStyle}
              />
            </div>
          </div>

          {/* Phone + optional role selector */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Telefon</Label>
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+49 123 456 789"
                maxLength={30}
                className={inputClass}
                style={focusStyle}
              />
            </div>
            {roleSelector && (
              <div>
                <Label className="text-sm font-medium">Gewünschte Rolle <span className="text-destructive">*</span></Label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  required
                  className="w-full px-3 py-2 h-10 border border-border/50 bg-muted/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Bitte wählen…</option>
                  {roleSelector.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Qualification Fields */}
          {qualificationFields.map(field => (
            <div key={field.key}>
              <Label className="text-sm font-medium">
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </Label>
              {field.type === 'select' && field.options ? (
                <select
                  value={qualData[field.key] || ''}
                  onChange={e => handleQualChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2 h-10 border border-border/50 bg-muted/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Bitte wählen…</option>
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={qualData[field.key] || ''}
                  onChange={e => handleQualChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={200}
                  required={field.required}
                  className={inputClass}
                  style={focusStyle}
                />
              )}
            </div>
          ))}

          {/* Message */}
          <div>
            <Label className="text-sm font-medium">Nachricht (optional)</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Erzählen Sie uns kurz etwas über sich…"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full"
            style={accentColor ? { background: accentColor } : undefined}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird gesendet…</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Bewerbung absenden</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
