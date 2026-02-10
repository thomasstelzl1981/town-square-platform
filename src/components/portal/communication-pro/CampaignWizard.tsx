/**
 * CampaignWizard — 4-step wizard for creating Serien-E-Mails (MOD-14)
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { useMailCampaigns } from '@/hooks/useMailCampaigns';
import { RecipientSelector, type SelectedRecipient } from './RecipientSelector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DictationButton } from '@/components/shared/DictationButton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users, PenLine, Paperclip, Send, ChevronLeft, ChevronRight,
  AlertTriangle, Upload, Trash2, FileText, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CampaignWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { label: 'Empfänger', icon: Users },
  { label: 'Inhalt', icon: PenLine },
  { label: 'Anhänge', icon: Paperclip },
  { label: 'Review & Senden', icon: Send },
];

const PLACEHOLDERS = ['{{first_name}}', '{{last_name}}', '{{company}}', '{{city}}'];

interface UploadedAttachment {
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export function CampaignWizard({ onClose, onSuccess }: CampaignWizardProps) {
  const { user, activeTenantId } = useAuth();
  const { createCampaign, sendCampaign } = useMailCampaigns();
  const { upload } = useUniversalUpload();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [includeSignature, setIncludeSignature] = useState(true);
  const [recipients, setRecipients] = useState<SelectedRecipient[]>([]);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load outbound identity
  const { data: identity } = useQuery({
    queryKey: ['outbound-identity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_outbound_identities')
        .select('display_name, from_email, brand_key')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Load signature
  const { data: profileSignature } = useQuery({
    queryKey: ['profile-signature', user?.id],
    queryFn: async () => {
      if (!user?.id) return '';
      const { data } = await supabase
        .from('profiles')
        .select('email_signature')
        .eq('id', user.id)
        .single();
      return data?.email_signature || '';
    },
    enabled: !!user?.id,
  });

  const insertPlaceholder = (placeholder: string) => {
    setBody(prev => prev + placeholder);
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (attachments.length + files.length > 5) {
      toast.error('Maximal 5 Anhänge erlaubt');
      return;
    }

    setIsUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} ist größer als 10 MB`);
        continue;
      }

      try {
        const result = await upload(file, {
          moduleCode: 'MOD_14',
          docTypeHint: 'campaign_attachment',
        });

        if (result?.storagePath) {
          setAttachments(prev => [...prev, {
            storage_path: result.storagePath,
            filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            size_bytes: file.size,
          }]);
        }
      } catch (err) {
        toast.error(`Upload fehlgeschlagen: ${file.name}`);
      }
    }
    setIsUploading(false);
    e.target.value = '';
  }, [upload, attachments.length]);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return recipients.length > 0;
      case 1: return subject.trim().length > 0 && body.trim().length > 0;
      case 2: return true; // attachments are optional
      case 3: return name.trim().length > 0;
      default: return false;
    }
  };

  const handleSend = async () => {
    if (!user?.id || !activeTenantId) return;
    setIsSending(true);

    try {
      const campaign = await createCampaign.mutateAsync({
        name: name || subject,
        subject_template: subject,
        body_template: body,
        include_signature: includeSignature,
        recipients: recipients.map(r => ({
          contact_id: r.contact_id,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          company: r.company || undefined,
          city: r.city || undefined,
        })),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Now send
      await sendCampaign.mutateAsync(campaign.id);
      onSuccess();
    } catch (err) {
      console.error('Campaign send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Personalize preview for a recipient
  const personalize = (template: string, r: SelectedRecipient) => {
    return template
      .split('{{first_name}}').join(r.first_name || '')
      .split('{{last_name}}').join(r.last_name || '')
      .split('{{company}}').join(r.company || '')
      .split('{{city}}').join(r.city || '');
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Neue Serien-E-Mail</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>Abbrechen</Button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i === step ? 'bg-primary text-primary-foreground' :
                  i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* STEP 0: Recipients */}
        {step === 0 && (
          <RecipientSelector selected={recipients} onChange={setRecipients} />
        )}

        {/* STEP 1: Content */}
        {step === 1 && (
          <div className="space-y-4">
            {/* From (read-only) */}
            {identity && (
              <div>
                <Label className="text-xs text-muted-foreground">Absender (aus Profil)</Label>
                <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm">
                  {identity.display_name} &lt;{identity.from_email}&gt;
                </div>
              </div>
            )}

            <div>
              <Label>Betreff</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Betreff Ihrer Serien-E-Mail…"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Nachricht</Label>
                <DictationButton onTranscript={(text) => setBody(prev => prev + (prev ? ' ' : '') + text)} />
              </div>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Sehr geehrte(r) {{first_name}} {{last_name}},&#10;&#10;..."
                rows={10}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PLACEHOLDERS.map(p => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => insertPlaceholder(p)}
                  >
                    + {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Signatur anhängen</Label>
                {profileSignature && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {profileSignature.split('\n')[0]}…
                  </p>
                )}
              </div>
              <Switch checked={includeSignature} onCheckedChange={setIncludeSignature} />
            </div>
          </div>
        )}

        {/* STEP 2: Attachments */}
        {step === 2 && (
          <div className="space-y-4">
            <CardDescription>
              Fügen Sie bis zu 5 Dateien hinzu (je max. 10 MB). Anhänge werden als Download-Links in die E-Mail eingefügt.
            </CardDescription>

            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Dateien hochladen (PDF, Dokumente, Bilder)
              </p>
              <label>
                <Button variant="outline" size="sm" disabled={isUploading || attachments.length >= 5} asChild>
                  <span>
                    {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Paperclip className="h-4 w-4 mr-2" />}
                    Dateien wählen
                  </span>
                </Button>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{att.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(att.size_bytes / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAttachment(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Review & Send */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Kampagnenname</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={subject || 'Name für diese Kampagne…'}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Empfänger</p>
                <p className="font-medium">{recipients.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Anhänge</p>
                <p className="font-medium">{attachments.length}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Betreff</p>
                <p className="font-medium">{subject}</p>
              </div>
            </div>

            <Separator />

            {/* Preview cards */}
            <div>
              <p className="text-sm font-medium mb-2">Vorschau (personalisiert)</p>
              <div className="space-y-2">
                {recipients.slice(0, 3).map((r, i) => (
                  <Card key={i} className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">An: {r.email}</p>
                      <p className="text-sm font-medium mt-1">{personalize(subject, r)}</p>
                      <p className="text-xs mt-1 whitespace-pre-wrap line-clamp-3">
                        {personalize(body, r)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                Antworten gehen direkt in Ihr persönliches Postfach. Das Portal verfolgt Antworten nicht.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => step === 0 ? onClose() : setStep(step - 1)}
            disabled={isSending}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? 'Abbrechen' : 'Zurück'}
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Weiter <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!canProceed() || isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird gesendet…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Jetzt senden
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
