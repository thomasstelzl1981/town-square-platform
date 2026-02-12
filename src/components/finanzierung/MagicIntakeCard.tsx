/**
 * MagicIntakeCard — Quick-start: enter customer name + email,
 * create a real finance case (draft), then scroll to document room.
 */
import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MagicIntakeResult {
  requestId: string;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  onCaseCreated: (result: MagicIntakeResult) => void;
}

export default function MagicIntakeCard({ onCaseCreated }: Props) {
  const { activeTenantId, user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'creating' | 'created'>('idle');
  const [createdPublicId, setCreatedPublicId] = useState('');

  const canCreate = firstName.trim() && lastName.trim() && email.trim();

  const handleCreate = async () => {
    if (!activeTenantId || !canCreate) return;
    setState('creating');

    try {
      // 1. Create finance_request (draft)
      const { data: fr, error: frErr } = await supabase
        .from('finance_requests')
        .insert({
          tenant_id: activeTenantId,
          created_by: user?.id ?? null,
          status: 'draft',
          purpose: 'kauf',
        })
        .select('id, public_id')
        .single();

      if (frErr) throw frErr;
      if (!fr) throw new Error('Kein Datensatz');

      const publicId = fr.public_id || fr.id.slice(0, 8).toUpperCase();

      // 2. Create applicant_profile (minimal)
      await supabase
        .from('applicant_profiles')
        .insert({
          tenant_id: activeTenantId,
          finance_request_id: fr.id,
          profile_type: 'self_disclosure',
          party_role: 'primary',
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
        });

      // 3. Create storage folder
      const { data: folder } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: activeTenantId,
          name: publicId,
          node_type: 'folder',
          module_code: 'MOD_11',
        })
        .select('id')
        .single();

      // 4. Link folder
      if (folder?.id) {
        await supabase
          .from('finance_requests')
          .update({ storage_folder_id: folder.id })
          .eq('id', fr.id);
      }

      setCreatedPublicId(publicId);
      setState('created');
      toast.success(`Finanzierungsakte ${publicId} angelegt`);

      onCaseCreated({
        requestId: fr.id,
        publicId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
    } catch (err: any) {
      console.error('Magic Intake error:', err);
      toast.error('Fehler: ' + (err?.message || 'Unbekannt'));
      setState('idle');
    }
  };

  if (state === 'created') {
    return (
      <Card className="glass-card overflow-hidden border-green-500/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold">Magic Intake</span>
            <span className="font-mono text-xs text-primary">{createdPublicId}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Akte für {firstName} {lastName} angelegt — Datenraum bereit.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Magic Intake</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Name und E-Mail genügen — Magic Intake erstellt sofort eine vollständige Finanzierungsakte mit Public-ID, strukturiertem Datenraum und Dokumenten-Checkliste. Ihr Kunde kann direkt loslegen.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Vorname"
            className="h-7 text-xs"
          />
          <Input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Nachname"
            className="h-7 text-xs"
          />
        </div>
        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-Mail-Adresse"
          type="email"
          className="h-7 text-xs mb-2"
        />
        <Button
          size="sm"
          disabled={!canCreate || state === 'creating'}
          onClick={handleCreate}
          className="w-full gap-1.5 h-7 text-xs"
        >
          {state === 'creating' ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Wird angelegt...</>
          ) : (
            <><Sparkles className="h-3 w-3" /> Magic Intake aktivieren</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
