/**
 * ScopeDefinitionPanel — Slimmed down: no own header, no back/next navigation
 * Renders description input + AI generator (left) and cost estimate (right) in FORM_GRID,
 * then full-width LV table and scope description below.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DictationButton } from '@/components/shared/DictationButton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Upload, FileText, Sparkles,
  ChevronDown, Save, Loader2
} from 'lucide-react';
import { AIProcessingOverlay } from '@/components/shared/AIProcessingOverlay';
import { SmartDropZone } from '@/components/shared/SmartDropZone';
import { ServiceCase, useUpdateServiceCase } from '@/hooks/useServiceCases';
import { LineItemsEditor, LineItem } from './LineItemsEditor';
import { CostEstimateCard } from './CostEstimateCard';
import { DMSDocumentSelector, SelectedDocument } from './DMSDocumentSelector';
import { RoomAnalysisDisplay, RoomAnalysis } from './RoomAnalysisDisplay';
import { toast } from 'sonner';
import { DESIGN } from '@/config/designManifest';

interface ScopeDefinitionPanelProps {
  serviceCase: ServiceCase;
}

export function ScopeDefinitionPanel({ serviceCase }: ScopeDefinitionPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingFromDescription, setIsGeneratingFromDescription] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  const [userDescription, setUserDescription] = useState(serviceCase.description || '');
  
  const parseLineItems = (items: unknown): LineItem[] => {
    if (!Array.isArray(items)) return [];
    return items.filter((item): item is LineItem => 
      typeof item === 'object' && item !== null && 
      'id' in item && 'position' in item && 'description' in item
    );
  };
  
  const parseSelectedDocuments = (docs: unknown): SelectedDocument[] => {
    if (!Array.isArray(docs)) return [];
    return docs.filter((doc): doc is SelectedDocument => 
      typeof doc === 'object' && doc !== null && 
      'id' in doc && 'name' in doc && 'path' in doc
    );
  };
  
  const [lineItems, setLineItems] = useState<LineItem[]>(
    parseLineItems(serviceCase.scope_line_items)
  );
  const [scopeDescription, setScopeDescription] = useState(serviceCase.scope_description || '');
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>(
    parseSelectedDocuments(serviceCase.scope_attachments)
  );
  const [roomAnalysis, setRoomAnalysis] = useState<RoomAnalysis | null>(null);
  
  const [costEstimates, setCostEstimates] = useState<{
    min: number | null;
    mid: number | null;
    max: number | null;
  }>({
    min: serviceCase.cost_estimate_min,
    mid: serviceCase.cost_estimate_mid,
    max: serviceCase.cost_estimate_max,
  });
  
  const updateCase = useUpdateServiceCase();
  const hasLineItems = lineItems.length > 0;

  // ========== Generate from description ==========
  const handleGenerateFromDescription = async () => {
    if (!userDescription.trim()) {
      toast.error('Bitte beschreiben Sie zuerst, was saniert werden soll');
      return;
    }
    
    setIsGeneratingFromDescription(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-renovation-scope-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            service_case_id: serviceCase.id,
            action: 'generate_from_description',
            description: userDescription,
            category: serviceCase.category,
            property_address: serviceCase.property?.address,
            unit_info: serviceCase.unit?.unit_number,
            area_sqm: (serviceCase.unit as any)?.area_sqm,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generierung fehlgeschlagen');
      }
      
      const result = await response.json();
      
      if (result.room_analysis) setRoomAnalysis(result.room_analysis);
      if (result.line_items) setLineItems(result.line_items);
      if (result.scope_description) setScopeDescription(result.scope_description);
      if (result.cost_estimate_min) {
        setCostEstimates({
          min: result.cost_estimate_min,
          mid: result.cost_estimate_mid,
          max: result.cost_estimate_max,
        });
      }
      
      await updateCase.mutateAsync({
        id: serviceCase.id,
        description: userDescription,
        scope_status: 'draft',
        scope_source: 'ai_generated',
        scope_line_items: result.line_items || [],
        scope_description: result.scope_description || '',
        ...(result.cost_estimate_min ? {
          cost_estimate_min: result.cost_estimate_min,
          cost_estimate_mid: result.cost_estimate_mid,
          cost_estimate_max: result.cost_estimate_max,
        } : {}),
      });
      
      toast.success('Leistungsverzeichnis aus Beschreibung generiert');
    } catch (error) {
      console.error('Generate from description error:', error);
      toast.error(error instanceof Error ? error.message : 'Generierung fehlgeschlagen');
    } finally {
      setIsGeneratingFromDescription(false);
    }
  };

  // Handle AI analysis (from documents)
  const handleStartAIAnalysis = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Bitte wählen Sie mindestens ein Dokument aus');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-renovation-scope-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            service_case_id: serviceCase.id,
            action: 'analyze_and_generate',
            document_ids: selectedDocuments.map(d => d.id),
            category: serviceCase.category,
            property_address: serviceCase.property?.address,
            unit_info: serviceCase.unit?.unit_number,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analyse fehlgeschlagen');
      }
      
      const result = await response.json();
      
      if (result.room_analysis) setRoomAnalysis(result.room_analysis);
      if (result.line_items) setLineItems(result.line_items);
      if (result.scope_description) setScopeDescription(result.scope_description);
      
      await updateCase.mutateAsync({
        id: serviceCase.id,
        scope_status: 'draft',
        scope_source: 'ai_generated',
        scope_line_items: result.line_items || [],
        scope_description: result.scope_description || '',
      });
      
      toast.success('KI-Analyse abgeschlossen');
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Analyse fehlgeschlagen');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle cost estimation
  const handleEstimateCosts = async () => {
    if (lineItems.length === 0) {
      toast.error('Bitte erstellen Sie zuerst ein Leistungsverzeichnis');
      return;
    }
    
    setIsEstimating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-renovation-scope-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            service_case_id: serviceCase.id,
            action: 'estimate_costs',
            line_items: lineItems,
            category: serviceCase.category,
            location: serviceCase.property?.city,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kostenschätzung fehlgeschlagen');
      }
      
      const result = await response.json();
      
      setCostEstimates({
        min: result.cost_estimate_min,
        mid: result.cost_estimate_mid,
        max: result.cost_estimate_max,
      });
      
      await updateCase.mutateAsync({
        id: serviceCase.id,
        cost_estimate_min: result.cost_estimate_min,
        cost_estimate_mid: result.cost_estimate_mid,
        cost_estimate_max: result.cost_estimate_max,
      });
      
      toast.success('Kostenschätzung berechnet');
    } catch (error) {
      console.error('Cost estimation error:', error);
      toast.error(error instanceof Error ? error.message : 'Kostenschätzung fehlgeschlagen');
    } finally {
      setIsEstimating(false);
    }
  };
  
  // Handle save
  const handleSave = async () => {
    try {
      await updateCase.mutateAsync({
        id: serviceCase.id,
        description: userDescription,
        scope_description: scopeDescription,
        scope_line_items: lineItems as unknown as Record<string, unknown>[],
        scope_attachments: selectedDocuments as unknown as Record<string, unknown>[],
        scope_status: 'draft',
      });
      toast.success('Änderungen gespeichert', { duration: 2000 });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  return (
    <div className={DESIGN.SPACING.SECTION}>
      {/* ── Row 1: Description + Cost Estimate (2-col) ── */}
      <div className={DESIGN.FORM_GRID.FULL}>
        {/* Left: Description + AI generator */}
        <div className={DESIGN.SPACING.CARD}>
          <div className="flex items-center justify-between">
            <h4 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Was soll saniert werden?</h4>
            <DictationButton onTranscript={(text) => setUserDescription(prev => prev + (prev ? ' ' : '') + text)} />
          </div>
          <Textarea
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            placeholder="z.B. Bad komplett sanieren: neue Fliesen, neue Armaturen, Dusche statt Wanne..."
            rows={4}
          />
          {isGeneratingFromDescription ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">KI erstellt Leistungsverzeichnis...</p>
                <p className={DESIGN.TYPOGRAPHY.HINT}>Positionen und Kostenschätzung werden generiert</p>
              </div>
            </div>
          ) : hasLineItems ? (
            <Button variant="outline" size="sm" onClick={handleGenerateFromDescription} disabled={!userDescription.trim()}>
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Erneut generieren
            </Button>
          ) : (
            <Button onClick={handleGenerateFromDescription} disabled={!userDescription.trim()}>
              <Sparkles className="mr-2 h-4 w-4" />
              Leistungsverzeichnis generieren
            </Button>
          )}
        </div>

        {/* Right: Cost Estimate */}
        <CostEstimateCard
          min={costEstimates.min}
          mid={costEstimates.mid}
          max={costEstimates.max}
          onEstimate={handleEstimateCosts}
          isEstimating={isEstimating}
          hasLineItems={hasLineItems}
        />
      </div>

      {/* ── Room Analysis (if available) ── */}
      {roomAnalysis && <RoomAnalysisDisplay analysis={roomAnalysis} />}
      
      {/* ── Full-width: Leistungsverzeichnis ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Leistungsverzeichnis</span>
            {hasLineItems && <Badge variant="secondary">{lineItems.length} Positionen</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsEditor items={lineItems} onChange={setLineItems} category={serviceCase.category} />
        </CardContent>
      </Card>

      {/* ── Full-width: Beschreibung für Ausschreibung ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Beschreibung für Ausschreibung</CardTitle>
            <DictationButton onTranscript={(text) => setScopeDescription(prev => prev + (prev ? ' ' : '') + text)} />
          </div>
          <CardDescription className={DESIGN.TYPOGRAPHY.HINT}>Professionelle Beschreibung — wird von der KI erstellt und kann angepasst werden</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={scopeDescription}
            onChange={(e) => setScopeDescription(e.target.value)}
            placeholder="Wird automatisch aus dem Leistungsverzeichnis generiert..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* ── Weitere Optionen (DMS/Upload) — collapsible ── */}
      <Collapsible open={showMoreOptions} onOpenChange={setShowMoreOptions}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
            <ChevronDown className={`h-4 w-4 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} />
            Weitere Optionen (DMS-Dokumente, Upload)
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="ai">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai" className="gap-2">
                    <Bot className="h-4 w-4" />
                    KI aus Dokumenten
                  </TabsTrigger>
                  <TabsTrigger value="external" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Eigenes LV hochladen
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="ai" className="mt-4 space-y-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">KI analysiert Ihre Unterlagen</p>
                        <p className={DESIGN.TYPOGRAPHY.MUTED}>
                          Wählen Sie Grundrisse und Fotos aus dem DMS. Die KI erkennt Räume, 
                          Ausstattung und Zustand und erstellt ein strukturiertes Leistungsverzeichnis.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <DMSDocumentSelector
                    propertyId={serviceCase.property_id}
                    selectedDocuments={selectedDocuments}
                    onSelectionChange={setSelectedDocuments}
                  />
                  
                  <AIProcessingOverlay
                    active={isAnalyzing}
                    steps={[
                      { label: 'Dokumente werden gelesen' },
                      { label: 'Räume & Ausstattung erkannt' },
                      { label: 'Leistungsverzeichnis wird erstellt' },
                    ]}
                    currentStep={isAnalyzing ? 1 : 0}
                    headline="KI analysiert Unterlagen…"
                    variant="violet"
                  />
                  
                  {!isAnalyzing && (
                    <Button 
                      onClick={handleStartAIAnalysis}
                      disabled={selectedDocuments.length === 0}
                      className="w-full"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      KI-Analyse starten
                    </Button>
                  )}
                </TabsContent>
                
                <TabsContent value="external" className="mt-4 space-y-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">Externes Leistungsverzeichnis</p>
                        <p className={DESIGN.TYPOGRAPHY.MUTED}>
                          Laden Sie ein vorhandenes LV als PDF hoch.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <SmartDropZone
                    onFiles={(files) => {
                      toast.info('Upload-Verarbeitung wird implementiert');
                    }}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                    }}
                    formatsLabel="PDF, Excel"
                    variant="violet"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      
      {/* ── Save Button ── */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleSave} disabled={updateCase.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>
      </div>
    </div>
  );
}
