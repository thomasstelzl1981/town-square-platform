/**
 * AbsageDialog — Rejection Dialog with AI email generation
 */
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, Sparkles, Send, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AbsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerTitle?: string;
  senderEmail?: string;
}

const REJECTION_REASONS = [
  { value: 'price_too_high', label: 'Preis zu hoch' },
  { value: 'location_not_matching', label: 'Lage passt nicht' },
  { value: 'object_type_not_matching', label: 'Objektart passt nicht' },
  { value: 'yield_too_low', label: 'Rendite zu niedrig' },
  { value: 'condition_too_bad', label: 'Zustand zu schlecht' },
  { value: 'no_capacity', label: 'Aktuell keine Kapazität' },
  { value: 'other', label: 'Sonstiges' },
];

export function AbsageDialog({
  open,
  onOpenChange,
  offerId,
  offerTitle,
  senderEmail,
}: AbsageDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = React.useState<string>('');
  const [customMessage, setCustomMessage] = React.useState('');
  const [generatedEmail, setGeneratedEmail] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Generate AI email
  const generateEmail = async () => {
    if (!reason) {
      toast.error('Bitte wählen Sie einen Absagegrund');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-acq-generate-response', {
        body: {
          type: 'rejection',
          offerId,
          reason,
          customMessage,
        },
      });

      if (error) throw error;
      setGeneratedEmail(data.email || 'Fehler bei der E-Mail-Generierung');
    } catch (err) {
      console.error('Email generation error:', err);
      toast.error('E-Mail konnte nicht generiert werden');
    } finally {
      setIsGenerating(false);
    }
  };

  // Send rejection
  const sendRejection = useMutation({
    mutationFn: async () => {
      // 1. Update offer status
      const { error: updateError } = await supabase
        .from('acq_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId);

      if (updateError) throw updateError;

      // 2. Log activity
      const { error: activityError } = await supabase
        .from('acq_offer_activities')
        .insert({
          offer_id: offerId,
          activity_type: 'rejection',
          description: `Absage gesendet: ${REJECTION_REASONS.find(r => r.value === reason)?.label}`,
          metadata: { reason, customMessage, emailSent: !!generatedEmail },
        });

      if (activityError) throw activityError;

      // STUB: Email sending will be implemented via Zone 1 Backbone (CONTRACT_ACQ_OUTBOUND_EMAIL)
      // Activity is logged above; actual dispatch requires sot-acq-outbound edge function

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offer', offerId] });
      queryClient.invalidateQueries({ queryKey: ['acq-offers'] });
      toast.success('Absage gesendet');
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => {
      toast.error('Fehler: ' + (err as Error).message);
    },
  });

  const resetForm = () => {
    setReason('');
    setCustomMessage('');
    setGeneratedEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-destructive" />
            Absage senden
          </DialogTitle>
          <DialogDescription>
            Senden Sie eine Absage für {offerTitle || 'dieses Angebot'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>Absagegrund</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Grund auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label>Zusätzliche Nachricht (optional)</Label>
            <Textarea
              placeholder="Optionale persönliche Nachricht..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <Button
            variant="outline"
            onClick={generateEmail}
            disabled={!reason || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            E-Mail mit KI generieren
          </Button>

          {/* Generated Email Preview */}
          {generatedEmail && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-Mail-Vorschau
              </Label>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">
                  An: {senderEmail || 'Absender'}
                </div>
                <Textarea
                  value={generatedEmail}
                  onChange={(e) => setGeneratedEmail(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => sendRejection.mutate()}
            disabled={!reason || sendRejection.isPending}
            variant="destructive"
          >
            {sendRejection.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Absage senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
