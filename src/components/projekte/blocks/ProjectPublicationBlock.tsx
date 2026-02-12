/**
 * Project Publication Block (Block J)
 * Kaufy Integration & Landingpage
 * MOD-13 PROJEKTE
 * 
 * IMPORTANT: The Kaufy toggle here is READ-ONLY. 
 * Actual listing control (with listing_publications) lives in SalesApprovalSection (VertriebTab).
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  Globe, Sparkles, ExternalLink, Check, Copy, 
  Megaphone, BarChart3, Users, Eye, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DevProject } from '@/types/projekte';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProjectPublicationBlockProps {
  project: DevProject;
}

export function ProjectPublicationBlock({ project }: ProjectPublicationBlockProps) {
  const { updateProject } = useDevProjects();
  const [landingpageSlug, setLandingpageSlug] = useState(project.landingpage_slug || '');

  // Check if Vertriebsauftrag is active (required for Kaufy)
  const { data: salesRequest } = useQuery({
    queryKey: ['sales-desk-request-blockj', project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sales_desk_requests')
        .select('status')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!project.id,
  });

  const isVertriebActive = salesRequest?.status === 'approved';
  const isKaufyActive = project.kaufy_listed && isVertriebActive;

  const handleKaufyFeaturedToggle = async (checked: boolean) => {
    await updateProject.mutateAsync({
      id: project.id,
      kaufy_featured: checked,
    });
    toast.success(checked ? 'Premium-Platzierung aktiviert' : 'Premium-Platzierung deaktiviert');
  };

  const handleLandingpageToggle = async (checked: boolean) => {
    await updateProject.mutateAsync({
      id: project.id,
      landingpage_enabled: checked,
      landingpage_slug: checked ? (landingpageSlug || generateSlug(project.name)) : project.landingpage_slug,
    });
    toast.success(checked ? 'Landingpage aktiviert' : 'Landingpage deaktiviert');
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] || c))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const copyLandingpageUrl = () => {
    const url = `https://${project.landingpage_slug || generateSlug(project.name)}.kaufy.de`;
    navigator.clipboard.writeText(url);
    toast.success('URL kopiert');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>J. Veröffentlichung & Marketing</CardTitle>
        </div>
        <CardDescription>
          Vermarkten Sie Ihr Projekt über den Kaufy-Marktplatz und eigene Landingpages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Kaufy Free Listing — READ-ONLY, controlled via Vertrieb-Tab */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Kaufy Marktplatz</p>
                  <Badge variant="secondary">Kostenlos</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Projekt im Kaufy-Marktplatz listen
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isKaufyActive}
                      disabled
                      aria-label="Kaufy-Status (nur lesend)"
                    />
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[240px]">
                  <p className="text-xs">
                    Die Kaufy-Veröffentlichung wird über den <strong>Vertriebsauftrag</strong> im Reiter „Vertrieb" gesteuert, um die korrekte Listing-Struktur sicherzustellen.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {isKaufyActive ? (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Projekt ist auf Kaufy sichtbar
              </span>
              <Button variant="link" size="sm" className="ml-auto">
                <ExternalLink className="h-3 w-3 mr-1" />
                Ansehen
              </Button>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {!isVertriebActive
                  ? 'Aktivieren Sie zuerst den Vertriebsauftrag im Reiter „Vertrieb".'
                  : 'Schalten Sie die Kaufy-Veröffentlichung im Reiter „Vertrieb" frei.'}
              </span>
            </div>
          )}
        </div>

        {/* Premium Features */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Featured Placement */}
          <div className="p-4 border rounded-lg border-primary/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Premium-Platzierung</span>
                <Badge>200€/Monat</Badge>
              </div>
              <Switch
                checked={project.kaufy_featured || false}
                onCheckedChange={handleKaufyFeaturedToggle}
                disabled={!isKaufyActive}
              />
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Eye className="h-3 w-3" />
                Startseiten-Platzierung
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                Erweiterte Analytics
              </li>
            </ul>
          </div>

          {/* Landingpage */}
          <div className="p-4 border rounded-lg border-primary/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-medium">Projekt-Landingpage</span>
                <Badge>200€/Monat</Badge>
              </div>
              <Switch
                checked={project.landingpage_enabled || false}
                onCheckedChange={handleLandingpageToggle}
              />
            </div>
            {project.landingpage_enabled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={landingpageSlug || generateSlug(project.name)}
                    onChange={(e) => setLandingpageSlug(e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder="projekt-slug"
                  />
                  <span className="text-sm text-muted-foreground">.kaufy.de</span>
                  <Button variant="outline" size="icon" onClick={copyLandingpageUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Landingpage öffnen
                </Button>
              </div>
            ) : (
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  Eigene URL (projekt.kaufy.de)
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-3 w-3" />
                  Investment-Rechner
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Lead-Formular
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Social Leadgen (Coming Soon) */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-muted-foreground">Social Lead Generation</p>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatisierte Kampagnen auf Facebook, Instagram & Google
                </p>
              </div>
            </div>
            <Button variant="secondary" disabled>
              Bald verfügbar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
