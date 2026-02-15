/**
 * MarketReportSheet — Sheet overlay for AI-generated market reports (streaming markdown)
 */
import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface MarketReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  functionName: string;
  requestBody?: Record<string, unknown>;
}

export function MarketReportSheet({
  open,
  onOpenChange,
  title,
  description,
  functionName,
  requestBody = {},
}: MarketReportSheetProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    setContent('');
    setHasGenerated(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast.error('Rate-Limit erreicht. Bitte versuchen Sie es später erneut.');
          setIsLoading(false);
          return;
        }
        if (resp.status === 402) {
          toast.error('Credits aufgebraucht. Bitte laden Sie Ihr Konto auf.');
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setContent(accumulated);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error('Market report error:', err);
      toast.error('Bericht konnte nicht generiert werden');
      if (!content) setContent('❌ Der Bericht konnte nicht generiert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  }, [functionName, requestBody, content]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen && !hasGenerated) {
      generateReport();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateReport}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Neu generieren
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 p-6">
          {isLoading && !content && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">KI-Bericht wird generiert…</p>
            </div>
          )}
          {content && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
              {isLoading && <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
