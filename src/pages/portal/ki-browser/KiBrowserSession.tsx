import { Globe, Play, Square, CheckCircle, XCircle, Search, ExternalLink, Loader2, FileText, ArrowRight, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { useKiBrowser } from '@/hooks/useKiBrowser';
import ReactMarkdown from 'react-markdown';

const KiBrowserSession = () => {
  const [urlInput, setUrlInput] = useState('');
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const {
    session,
    steps,
    loading,
    fetchedContent,
    startSession,
    closeSession,
    fetchUrl,
    summarize,
    approveStep,
    rejectStep,
    resetSession,
  } = useKiBrowser();

  const isActive = session?.status === 'active';

  const handleStartSession = async () => {
    await startSession('Manuelle Recherche');
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    setSummaryText(null);
    await fetchUrl(url);
  };

  const handleSummarize = async () => {
    if (!fetchedContent?.artifact_id) return;
    const result = await summarize(fetchedContent.artifact_id);
    if (result) setSummaryText(result.summary);
  };

  const pendingSteps = steps.filter(s => s.status === 'proposed' && s.risk_level === 'confirm_needed');

  // No session — show start screen
  if (!session || session.status === 'completed' || session.status === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Globe className="h-16 w-16 text-muted-foreground/30" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {session?.status === 'completed' ? 'Session abgeschlossen' : session?.status === 'expired' ? 'Session abgelaufen' : 'KI-Browser'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Armstrong navigiert kontrolliert im Web. Starten Sie eine Session, um Webinhalte abzurufen und analysieren zu lassen.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleStartSession} disabled={loading} size="lg">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Session starten
          </Button>
          {session && (
            <Button variant="outline" onClick={resetSession} size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Active session — fullscreen browser layout
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-6 -mt-6">
      {/* Top URL Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        {/* Session status */}
        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 text-xs shrink-0">
          Aktiv
        </Badge>
        <Badge variant="outline" className="text-xs shrink-0">
          {steps.length}/{session.max_steps}
        </Badge>

        {/* URL bar */}
        <div className="flex-1 flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm bg-background"
              placeholder="URL eingeben..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
              disabled={loading}
            />
          </div>
          <Button size="sm" className="h-8 px-3" onClick={handleFetchUrl} disabled={loading || !urlInput.trim()}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Actions */}
        {fetchedContent && (
          <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={handleSummarize} disabled={loading}>
            <FileText className="h-3 w-3 mr-1" />
            Zusammenfassen
          </Button>
        )}

        <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive shrink-0" onClick={closeSession} disabled={loading}>
          <Square className="h-3 w-3 mr-1" />
          Beenden
        </Button>
      </div>

      {/* Pending approval toast bar */}
      {pendingSteps.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-200 shrink-0">
          <span className="text-xs font-medium text-amber-800">Bestätigung erforderlich:</span>
          {pendingSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-1 text-xs">
              <span className="font-medium">{step.kind}</span>
              <Button size="sm" variant="ghost" className="h-6 px-1.5 text-green-700" onClick={() => approveStep(step.id)} disabled={loading}>
                <CheckCircle className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive" onClick={() => rejectStep(step.id)} disabled={loading}>
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {!fetchedContent ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Geben Sie eine URL ein, um Webinhalte abzurufen.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 max-w-4xl mx-auto">
              {/* Page header */}
              {fetchedContent.title && (
                <div className="border-b border-border pb-3">
                  <h2 className="text-lg font-semibold text-foreground">{fetchedContent.title}</h2>
                  {fetchedContent.description && (
                    <p className="text-sm text-muted-foreground mt-1">{fetchedContent.description}</p>
                  )}
                </div>
              )}

              {/* Summary */}
              {summaryText && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-primary mb-2">KI-Zusammenfassung</h3>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown>{summaryText}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Text content */}
              <div className="bg-muted/50 rounded-lg p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground leading-relaxed">
                  {fetchedContent.text_content?.slice(0, 5000)}
                  {(fetchedContent.text_content?.length ?? 0) > 5000 && '\n\n... (gekürzt)'}
                </pre>
              </div>

              {/* Links */}
              {fetchedContent.links?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Links ({fetchedContent.links.length})</h4>
                  <div className="grid gap-1">
                    {fetchedContent.links.slice(0, 30).map((link, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
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
      </div>

      {/* Bottom timeline bar */}
      <div className="border-t border-border bg-muted/20 shrink-0">
        <button
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowTimeline(!showTimeline)}
        >
          <span>Timeline ({steps.length} Steps)</span>
          {showTimeline ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>
        {showTimeline && steps.length > 0 && (
          <div className="px-3 pb-2 max-h-40 overflow-y-auto space-y-1">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 text-xs py-0.5">
                <span className="text-muted-foreground font-mono w-5 text-right">#{step.step_number}</span>
                <span className="font-medium w-20">{step.kind}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {step.status}
                </Badge>
                {step.url_after && <span className="text-muted-foreground truncate">{step.url_after}</span>}
                {step.duration_ms != null && <span className="text-muted-foreground ml-auto">{step.duration_ms}ms</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KiBrowserSession;
