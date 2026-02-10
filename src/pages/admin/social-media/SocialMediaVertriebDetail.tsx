/**
 * Social Media Vertrieb Detail — Mandatsakte (Zone 1)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Image, Send, Pause, CheckCircle2, Users, CreditCard, Calendar, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function SocialMediaVertriebDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Mandat #{id?.slice(0, 6) || 'Demo'}</h1>
            <p className="text-sm text-muted-foreground">Partner-Mandatsakte</p>
          </div>
        </div>
        <Badge variant="default">Live</Badge>
      </div>

      {/* Mandatsdaten */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium">Mandatsdaten</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2"><Users className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><span className="text-xs text-muted-foreground">Partner</span><p className="font-medium">Max Berater GmbH</p></div></div>
            <div className="flex items-start gap-2"><CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><span className="text-xs text-muted-foreground">Budget</span><p className="font-medium">2.500 €</p></div></div>
            <div className="flex items-start gap-2"><Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><span className="text-xs text-muted-foreground">Laufzeit</span><p className="font-medium">01.03.–31.03.2026</p></div></div>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><span className="text-xs text-muted-foreground">Regionen</span><p className="font-medium">München</p></div></div>
          </div>
        </CardContent>
      </Card>

      {/* Creatives */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Creatives (5 Slots)</h3>
          <div className="grid grid-cols-5 gap-3">
            {['T1', 'T2', 'T3', 'T4', 'T5'].map((t) => (
              <div key={t} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
                <div className="h-14 w-full rounded bg-muted/50 mb-2" />
                <p className="text-xs font-medium">{t}</p>
                <Badge variant="secondary" className="text-[10px] mt-1">Generiert</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Plan */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Send className="h-4 w-4" /> Publishing Plan</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-xs text-muted-foreground">Plattform</span><p className="font-medium">Meta (Facebook + Instagram)</p></div>
            <div><span className="text-xs text-muted-foreground">Kaufy Accounts</span><p className="font-medium">Kaufy Page + Kaufy IG</p></div>
            <div><span className="text-xs text-muted-foreground">Status</span><Badge variant="default">Live</Badge></div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Genehmigen</Button>
            <Button variant="outline" size="sm" className="gap-1"><Send className="h-3 w-3" /> Veröffentlichen</Button>
            <Button variant="outline" size="sm" className="gap-1"><Pause className="h-3 w-3" /> Pausieren</Button>
          </div>
        </CardContent>
      </Card>

      {/* Abrechnung */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Abrechnung</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-xs text-muted-foreground">Payment</span><p className="font-medium">Bezahlt (2.500 €)</p></div>
            <div><span className="text-xs text-muted-foreground">Spend</span><p className="font-medium">1.240 €</p></div>
            <div><span className="text-xs text-muted-foreground">Verbleibend</span><p className="font-medium">1.260 €</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
