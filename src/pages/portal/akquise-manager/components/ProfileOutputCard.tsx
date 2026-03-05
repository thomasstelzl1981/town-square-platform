import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, BookOpen, CheckCircle2 } from 'lucide-react';
import { ProfileRow, formatPriceRange } from '@/components/akquise/ProfileRow';
import type { ExtractedProfile } from './types';

interface Props {
  profileGenerated: boolean;
  profileData: ExtractedProfile | null;
  clientName: string;
  setClientName: (v: string) => void;
  profileTextLong: string;
  setProfileTextLong: (v: string) => void;
  onApplyProfile: () => void;
  onOpenContactBook: () => void;
}

export function ProfileOutputCard({
  profileGenerated, profileData,
  clientName, setClientName,
  profileTextLong, setProfileTextLong,
  onApplyProfile, onOpenContactBook,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Ankaufsprofil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mandanten-Eingabe */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mandant / Kunde</Label>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onOpenContactBook}>
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Kontaktbuch
            </Button>
          </div>
          <Textarea
            placeholder="Name, Firma, Kontaktdaten des Mandanten eingeben oder aus dem Kontaktbuch übernehmen…"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            rows={6}
            className="text-sm"
          />
        </div>

        {!profileGenerated ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Profil wird nach KI-Analyse hier angezeigt</p>
            <p className="text-xs mt-1">Geben Sie links einen Freitext ein und klicken Sie "Generieren"</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y rounded-lg border">
              <ProfileRow label="Suchgebiet" value={profileData?.region || '–'} />
              <ProfileRow label="Asset-Fokus" value={profileData?.asset_focus?.join(', ') || '–'} />
              <ProfileRow label="Investitionsrahmen" value={formatPriceRange(profileData?.price_min, profileData?.price_max)} />
              <ProfileRow label="Zielrendite" value={profileData?.yield_target ? `${profileData.yield_target}%` : '–'} />
              <ProfileRow label="Ausschlüsse" value={profileData?.exclusions || '–'} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Freitext-Zusammenfassung (editierbar)</Label>
              <Textarea
                value={profileTextLong}
                onChange={e => setProfileTextLong(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>

            <Button className="w-full" variant="default" onClick={onApplyProfile}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Ankaufsprofil übernehmen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
