import { useState } from 'react';
import { useAuditReport } from './useAuditReports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, ChevronDown, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

interface Props {
  reportId: string;
  onBack: () => void;
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PASS: 'default',
  PASS_WITH_FIXES: 'secondary',
  FAIL: 'destructive',
};

export default function AuditReportDetail({ reportId, onBack }: Props) {
  const { data: report, isLoading } = useAuditReport(reportId);
  const [tocOpen, setTocOpen] = useState(true);

  if (isLoading || !report) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Extract headings for TOC
  const headings = (report.content_md || '').split('\n')
    .filter(line => /^#{2,3}\s/.test(line))
    .map(line => {
      const level = line.startsWith('###') ? 3 : 2;
      const text = line.replace(/^#{2,3}\s+/, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return { level, text, id };
    });

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      {/* Meta Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-lg">{report.title}</CardTitle>
            <Badge variant={STATUS_BADGE[report.status] || 'outline'}>{report.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
            <span>{format(new Date(report.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
            {report.repo_ref && <span className="font-mono">{report.repo_ref}</span>}
            {report.pr_url && (
              <a href={report.pr_url} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                PR <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* TOC */}
      {headings.length > 0 && (
        <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Inhaltsverzeichnis</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ul className="space-y-1 text-sm">
                  {headings.map((h, i) => (
                    <li key={i} className={h.level === 3 ? 'pl-4' : ''}>
                      <a href={`#${h.id}`} className="text-primary hover:underline">{h.text}</a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Markdown Content */}
      <Card>
        <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown
            components={{
              h2: ({ children, ...props }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return <h2 id={id} {...props}>{children}</h2>;
              },
              h3: ({ children, ...props }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return <h3 id={id} {...props}>{children}</h3>;
              },
            }}
          >
            {report.content_md}
          </ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  );
}
