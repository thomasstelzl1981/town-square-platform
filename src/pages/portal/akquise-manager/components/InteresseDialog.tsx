/**
 * InteresseDialog — Interest declaration with data room creation
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Sparkles, Send, ThumbsUp, FolderPlus, Bell } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InteresseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerTitle?: string;
  mandateId?: string;
  senderEmail?: string;
}

export function InteresseDialog({
  open,
  onOpenChange,
  offerId,
  offerTitle,
  mandateId,
  senderEmail,
}: InteresseDialogProps) {
  const queryClient = useQueryClient();
  const [createDataRoom, setCreateDataRoom] = React.useState(true);
  const [notifyClient, setNotifyClient] = React.useState(true);
  const [customMessage, setCustomMessage] = React.useState('');
  const [generatedEmail, setGeneratedEmail] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Generate AI email
  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-acq-generate-response', {
        body: {
          type: 'interest',
          offerId,
          createDataRoom,
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

  // Send interest
  const sendInterest = useMutation({
    mutationFn: async () => {
      let dataRoomFolderId: string | null = null;

      // 1. Create data room if requested
      if (createDataRoom) {
        const { data: dataRoom, error: dataRoomError } = await supabase.functions.invoke(
          'sot-acq-create-dataroom',
          {
            body: { offerId, offerTitle },
          }
        );

        if (dataRoomError) {
          console.error('Data room creation failed:', dataRoomError);
          // Continue anyway, just log
        } else {
          dataRoomFolderId = dataRoom?.folderId;
        }
      }

      // 2. Update offer status
      const updateData: Record<string, unknown> = { status: 'accepted' };
      if (dataRoomFolderId) {
        updateData.data_room_folder_id = dataRoomFolderId;
      }

      const { error: updateError } = await supabase
        .from('acq_offers')
        .update(updateData)
        .eq('id', offerId);

      if (updateError) throw updateError;

      // 3. Log activity
      const { error: activityError } = await supabase
        .from('acq_offer_activities')
        .insert({
          offer_id: offerId,
          activity_type: 'interest',
          description: `Interesse bekundet${createDataRoom ? ' + Datenraum erstellt' : ''}`,
          metadata: {
            createDataRoom,
            notifyClient,
            dataRoomFolderId,
          },
        });

      if (activityError) throw activityError;

      // 4. TODO: Notify client if requested (via separate function)

      return { success: true, dataRoomFolderId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['acq-offer', offerId] });
      queryClient.invalidateQueries({ queryKey: ['acq-offers'] });
      
      if (data.dataRoomFolderId) {
        toast.success('Interesse gesendet & Datenraum erstellt');
      } else {
        toast.success('Interesse gesendet');
      }
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error('Fehler: ' + (err as Error).message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-green-600" />
            Interesse bekunden
          </DialogTitle>
          <DialogDescription>
            Signalisieren Sie Interesse an {offerTitle || 'diesem Angebot'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Options */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-start gap-3">
              <Checkbox
                id="createDataRoom"
                checked={createDataRoom}
                onCheckedChange={(checked) => setCreateDataRoom(!!checked)}
              />
              <div className="space-y-1">
                <label htmlFor="createDataRoom" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Datenraum erstellen
                </label>
                <p className="text-xs text-muted-foreground">
                  Erstellt einen Ordner im DMS für alle zugehörigen Dokumente
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="notifyClient"
                checked={notifyClient}
                onCheckedChange={(checked) => setNotifyClient(!!checked)}
                disabled={!mandateId}
              />
              <div className="space-y-1">
                <label 
                  htmlFor="notifyClient" 
                  className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${!mandateId ? 'text-muted-foreground' : ''}`}
                >
                  <Bell className="h-4 w-4" />
                  Mandant benachrichtigen
                </label>
                <p className="text-xs text-muted-foreground">
                  {mandateId 
                    ? 'Informiert den Mandanten über das interessante Objekt'
                    : 'Nur bei zugewiesenem Mandat verfügbar'}
                </p>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label>Nachricht an Anbieter (optional)</Label>
            <Textarea
              placeholder="Persönliche Nachricht oder spezifische Fragen..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            variant="outline"
            onClick={generateEmail}
            disabled={isGenerating}
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
            onClick={() => sendInterest.mutate()}
            disabled={sendInterest.isPending}
            variant="default"
          >
            {sendInterest.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Interesse senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
