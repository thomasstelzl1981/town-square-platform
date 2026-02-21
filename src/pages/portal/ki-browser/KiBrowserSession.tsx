import { Globe, Play, Square, CheckCircle, XCircle, Search, ExternalLink, Loader2, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { useKiBrowser, type KiBrowserStep } from '@/hooks/useKiBrowser';
import ReactMarkdown from 'react-markdown';

function StepBadge({ status, riskLevel }: { status: string; riskLevel: string }) {
  if (status === 'blocked') return <Badge variant="destructive" className="text-xs">Blockiert</Badge>;
  if (status === 'rejected') return <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">Abgelehnt</Badge>;
  if (status === 'completed') return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Erledigt</Badge>;
  if (status === 'approved') return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-xs">Genehmigt</Badge>;
  if (status === 'proposed') {
    if (riskLevel === 'safe_auto') return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Auto</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-xs">Bestätigung</Badge>;
  }
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

const KiBrowserSession = () => {
  const [urlInput, setUrlInput] = useState('');
  const [summaryText, setSummaryText] = useState<string | null>(null);

  const {
    session,
    steps,
    loading,
    fetchedContent,
    startSession,
    closeSession,
    fetchUrl,
    extractContent,
    summarize,
    proposeStep,
    approveStep,
    rejectStep,
    resetSession,
  } = useKiBrowser();

  const isActive = session?.status === 'active';

  const handleStartSession = async () => {
    await startSession('Manuelle Recherche');
  };

  const handleStopSession = async () => {
    await closeSession();
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    setSummaryText(null);
    await fetchUrl(url);
  };

  const handleExtract = async () => {
    if (!fetchedContent?.artifact_id) return;
    await extractContent(fetchedContent.artifact_id);
  };

  const handleSummarize = async () => {
    if (!fetchedContent?.artifact_id) return;
    const result = await summarize(fetchedContent.artifact_id);
    if (result) setSummaryText(result.summary);
  };

  const pendingSteps = steps.filter(s => s.status === 'proposed' && s.risk_level === 'confirm_needed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browser Session</h1>
          <p className="text-muted-foreground mt-1">Armstrong navigiert kontrolliert im Web.</p>
        </div>
        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={handleStartSession} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Session starten
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleStopSession} disabled={loading}>
              <Square className="h-4 w-4 mr-2" />
              Session beenden
            </Button>
          )}
          {session && session.status !== 'active' && (
            <Button variant="outline" onClick={resetSession}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Neue Session
            </Button>
          )}
        </div>
      </div>

      {/* Session Info Bar */}
      {session && (
        <div className="flex gap-2 flex-wrap text-xs">
          <Badge variant="outline" className={isActive ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-muted'}>
            {isActive ? 'Aktiv' : session.status === 'completed' ? 'Abgeschlossen' : session.status}
          </Badge>
          <Badge variant="outline">Steps: {steps.length} / {session.max_steps}</Badge>
          <Badge variant="outline">Ablauf: {new Date(session.expires_at).toLocaleTimeString('de-DE')}</Badge>
        </div>
      )}

      {!session || session.status === 'completed' || session.status === 'expired' ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              {session?.status === 'completed' ? 'Session abgeschlossen' : session?.status === 'expired' ? 'Session abgelaufen' : 'Keine aktive Session'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Starten Sie eine neue Session, um Armstrong im Web navigieren zu lassen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: URL Input + Step Proposals */}
          <div className="space-y-4">
            {/* URL Input */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  URL abrufen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com oder Suchbegriff..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                    disabled={loading}
                  />
                  <Button onClick={handleFetchUrl} disabled={loading || !urlInput.trim()} size="sm">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
                {fetchedContent && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleExtract} disabled={loading}>
                      <FileText className="h-3 w-3 mr-1" />
                      Extrahieren
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleSummarize} disabled={loading}>
                      <FileText className="h-3 w-3 mr-1" />
                      Zusammenfassen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            {pendingSteps.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-amber-800">
                    Bestätigung erforderlich ({pendingSteps.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between p-2 rounded-md bg-amber-50/50 border border-amber-100">
                      <div className="text-sm">
                        <span className="font-medium">{step.kind}</span>
                        {step.rationale && <span className="text-muted-foreground ml-2">— {step.rationale}</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-green-700" onClick={() => approveStep(step.id)} disabled={loading}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => rejectStep(step.id)} disabled={loading}>
                          <XCircle className="h-3 w-3 mr-1" />
                          Nein
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Summary Output */}
            {summaryText && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Zusammenfassung</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[300px]">
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>{summaryText}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Browser View */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Browser-Ansicht</CardTitle>
                <Badge variant="outline">Phase 1: Text-Modus</Badge>
              </div>
              {fetchedContent?.title && (
                <p className="text-sm font-medium text-foreground mt-1">{fetchedContent.title}</p>
              )}
              {fetchedContent?.description && (
                <p className="text-xs text-muted-foreground">{fetchedContent.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {!fetchedContent ? (
                <div className="bg-muted rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Geben Sie eine URL ein, um Webinhalte abzurufen.
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-4">
                    {/* Text content */}
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="text-xs whitespace-pre-wrap font-mono text-foreground leading-relaxed">
                        {fetchedContent.text_content?.slice(0, 3000)}
                        {(fetchedContent.text_content?.length ?? 0) > 3000 && '\n\n... (gekürzt)'}
                      </pre>
                    </div>

                    {/* Links */}
                    {fetchedContent.links?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Links ({fetchedContent.links.length})</h4>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {fetchedContent.links.slice(0, 20).map((link, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs group">
                              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                {link.text || link.href}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Step Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isActive ? 'Noch keine Schritte ausgeführt.' : 'Starten Sie eine Session, um die Timeline zu sehen.'}
            </p>
          ) : (
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 text-sm">
                  <span className="text-muted-foreground font-mono w-6 text-right shrink-0">#{step.step_number}</span>
                  <span className="font-medium w-24 shrink-0">{step.kind}</span>
                  <StepBadge status={step.status} riskLevel={step.risk_level} />
                  {step.url_after && (
                    <span className="text-xs text-muted-foreground truncate">{step.url_after}</span>
                  )}
                  {step.duration_ms != null && (
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">{step.duration_ms}ms</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KiBrowserSession;
