/**
 * Social Media Kampagnen — Kaufy-eigene Kampagnen (Zone 1)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus, Filter } from 'lucide-react';

const demoCampaigns = [
  { name: 'Kaufy Brand Awareness Q1', platform: 'LinkedIn', type: 'organisch', status: 'live' },
  { name: 'Kapitalanlage Leads FB', platform: 'Facebook', type: 'paid', status: 'live' },
  { name: 'Instagram Story Serie', platform: 'Instagram', type: 'organisch', status: 'scheduled' },
  { name: 'Vermögensaufbau Kampagne', platform: 'Facebook', type: 'paid', status: 'ended' },
  { name: 'Partner-Recruitment LinkedIn', platform: 'LinkedIn', type: 'organisch', status: 'draft' },
];

export default function SocialMediaKampagnen() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Kaufy Kampagnen</h1>
            <p className="text-sm text-muted-foreground">Organische & bezahlte Kampagnen verwalten</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filter</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Kampagne erstellen</Button>
        </div>
      </div>

      <div className="space-y-3">
        {demoCampaigns.map((c, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.platform} · {c.type}</p>
                </div>
              </div>
              <Badge variant={c.status === 'live' ? 'default' : c.status === 'scheduled' ? 'secondary' : 'outline'}>
                {c.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
