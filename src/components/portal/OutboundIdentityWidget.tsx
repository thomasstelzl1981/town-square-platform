/**
 * OutboundIdentityWidget — Profil-Outbound-Kennung (Phase 1)
 * 
 * Allows users to select and save their outbound email identity.
 * Filtered by user roles. Auto-provisions on first load.
 */
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Mail, Info, Copy, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getAllowedBrands,
  getDefaultBrandKey,
  generateFromEmail,
  getBrandByKey,
  type OutboundBrand,
} from '@/config/outboundBrands';

function UploadEmailSection() {
  const { user } = useAuth();
  const { data: mailboxAddress } = useQuery({
    queryKey: ['inbound-mailbox-profil'],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return null;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-inbound-receive?action=mailbox`,
        { headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) return null;
      const result = await res.json();
      return result.address as string;
    },
    enabled: !!user,
  });

  const copyAddress = () => {
    if (mailboxAddress) {
      navigator.clipboard.writeText(mailboxAddress);
      toast.success('E-Mail-Adresse kopiert');
    }
  };

  return (
    <div className="border-t border-border/30 pt-4 space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <Upload className="h-3.5 w-3.5 text-muted-foreground" />
        <Label className="text-xs font-medium">Upload-E-Mail</Label>
        <span className="text-[11px] text-muted-foreground">— PDFs per Mail ins DMS senden</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-muted/50 rounded-lg font-mono text-xs truncate">
          {mailboxAddress || 'Wird geladen...'}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copyAddress} disabled={!mailboxAddress} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          Kopieren
        </Button>
      </div>
    </div>
  );
}

interface OutboundIdentity {
  id: string;
  brand_key: string;
  from_email: string;
  display_name: string;
  is_active: boolean;
}

export function OutboundIdentityWidget() {
  const { user, isDevelopmentMode } = useAuth();
  const queryClient = useQueryClient();
  const [brandKey, setBrandKey] = React.useState('SOT');
  const [displayName, setDisplayName] = React.useState('');
  const [fromEmail, setFromEmail] = React.useState('');
  const [hasChanges, setHasChanges] = React.useState(false);
  const autoProvisionedRef = React.useRef(false);

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return ['user'];
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const roles = data?.map((r: any) => r.role) || [];
      if (roles.length === 0) roles.push('user');
      return roles as string[];
    },
    enabled: !!user?.id || isDevelopmentMode,
  });

  // Fetch user profile for name
  const { data: profile } = useQuery({
    queryKey: ['profile-outbound', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch current outbound identity
  const { data: identity, isLoading } = useQuery({
    queryKey: ['outbound-identity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_outbound_identities')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return data as OutboundIdentity | null;
    },
    enabled: !!user?.id,
  });

  const allowedBrands = React.useMemo(
    () => getAllowedBrands(userRoles || ['user']),
    [userRoles]
  );

  // Auto-provision if no identity exists
  React.useEffect(() => {
    if (
      !isLoading &&
      !identity &&
      user?.id &&
      profile &&
      userRoles &&
      !autoProvisionedRef.current
    ) {
      autoProvisionedRef.current = true;
      const defaultKey = getDefaultBrandKey(userRoles);
      const firstName = (profile as any)?.first_name || '';
      const lastName = (profile as any)?.last_name || '';
      const email = generateFromEmail(defaultKey, firstName, lastName);
      const name = [firstName, lastName].filter(Boolean).join(' ') || (profile as any)?.display_name || '';

      supabase
        .from('user_outbound_identities')
        .insert({
          user_id: user.id,
          brand_key: defaultKey,
          from_email: email,
          display_name: name,
          is_active: true,
        } as any)
        .then(({ error }) => {
          if (!error) {
            queryClient.invalidateQueries({ queryKey: ['outbound-identity', user.id] });
          }
        });
    }
  }, [isLoading, identity, user?.id, profile, userRoles, queryClient]);

  // Sync form state from loaded identity
  React.useEffect(() => {
    if (identity) {
      setBrandKey(identity.brand_key);
      setDisplayName(identity.display_name);
      setFromEmail(identity.from_email);
      setHasChanges(false);
    }
  }, [identity]);

  // Update from_email when brand changes
  const handleBrandChange = (newKey: string) => {
    setBrandKey(newKey);
    const firstName = (profile as any)?.first_name || '';
    const lastName = (profile as any)?.last_name || '';
    setFromEmail(generateFromEmail(newKey, firstName, lastName));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Nicht authentifiziert');

      if (identity?.id) {
        // Update existing
        const { error } = await supabase
          .from('user_outbound_identities')
          .update({
            brand_key: brandKey,
            from_email: fromEmail,
            display_name: displayName,
          } as any)
          .eq('id', identity.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_outbound_identities')
          .insert({
            user_id: user.id,
            brand_key: brandKey,
            from_email: fromEmail,
            display_name: displayName,
            is_active: true,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-identity', user?.id] });
      setHasChanges(false);
      toast.success('Outbound-Kennung gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  if (isLoading) {
    return (
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-5 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentBrand = getBrandByKey(brandKey);

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Outbound-Kennung</h3>
            <p className="text-xs text-muted-foreground">
              Absender für alle System-E-Mails
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Brand Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Marke / Brand</Label>
            <Select value={brandKey} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedBrands.map((brand) => (
                  <SelectItem key={brand.brand_key} value={brand.brand_key}>
                    {brand.label} ({brand.domain})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Email (readonly) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Absender E-Mail</Label>
            <Input
              value={fromEmail}
              disabled
              className="font-mono text-xs bg-muted/40"
            />
            <p className="text-[11px] text-muted-foreground">
              Automatisch aus Brand-Vorlage generiert
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Anzeigename</Label>
            <Input
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Max Mustermann"
            />
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Diese Absenderkennung wird für <strong>alle</strong> Outbound-E-Mails im Portal
              verwendet (z.B. Serien-E-Mail, Sanierung/Ausschreibung). Antworten gehen an Ihr
              persönliches Postfach.
            </p>
          </div>

          {/* Upload-E-Mail Section */}
          <UploadEmailSection />

          {/* Save */}
          {hasChanges && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="gap-1.5"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Speichern
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
