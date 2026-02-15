/**
 * ResearchLiveProgress — Beeindruckende Live-Fortschrittsanzeige
 * SVG-Fortschrittsring + horizontaler Balken + Timer + Provider-Status + Kontakt-Feed
 */
import { cn } from '@/lib/utils';
import { Globe, Database, Search, CheckCircle, Clock, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface ProviderStatus {
  id: string;
  label: string;
  icon: 'globe' | 'database' | 'search';
  status: string;
  isActive: boolean;
  isDone: boolean;
}

export interface LiveContact {
  id: string;
  firma: string;
  kontakt: string;
  rolle: string;
  email: string;
  stadt: string;
  score: number;
}

interface Props {
  progress: number;
  contactsFound: number;
  maxContacts: number;
  elapsedSeconds: number;
  providers: ProviderStatus[];
  contacts: LiveContact[];
  isComplete: boolean;
  phase: 'init' | 'running' | 'done';
}

const ICON_MAP = {
  globe: Globe,
  database: Database,
  search: Search,
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ResearchLiveProgress({
  progress,
  contactsFound,
  maxContacts,
  elapsedSeconds,
  providers,
  contacts,
  isComplete,
  phase,
}: Props) {
  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference - (circumference * Math.min(progress, 100)) / 100;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-6 space-y-6">
      {/* Phase: Init */}
      {phase === 'init' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-2 border-primary/30 flex items-center justify-center">
              <Search className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Recherche wird vorbereitet…</p>
        </div>
      )}

      {/* Phase: Running / Done */}
      {(phase === 'running' || phase === 'done') && (
        <>
          {/* Top Row: Ring + Stats */}
          <div className="flex items-start gap-6">
            {/* SVG Progress Ring */}
            <div className="relative shrink-0">
              <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                <circle
                  cx="64" cy="64" r="54"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  opacity="0.3"
                />
                <circle
                  cx="64" cy="64" r="54"
                  fill="none"
                  stroke={isComplete ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isComplete ? (
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
                    <span className="text-[10px] text-muted-foreground">Fortschritt</span>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <StatBox icon={<Users className="h-3.5 w-3.5" />} label="Kontakte" value={`${contactsFound} / ${maxContacts}`} highlight />
                <StatBox icon={<Clock className="h-3.5 w-3.5" />} label="Dauer" value={formatTime(elapsedSeconds)} />
                <StatBox icon={<Zap className="h-3.5 w-3.5" />} label="Credits" value={`${contactsFound}`} />
                <StatBox icon={<Search className="h-3.5 w-3.5" />} label="Status" value={isComplete ? 'Abgeschlossen' : 'Suche läuft…'} />
              </div>

              {/* Horizontal Progress Bar */}
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{contactsFound} gefunden</span>
                  <span>max. {maxContacts}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {providers.map(p => {
              const Icon = ICON_MAP[p.icon];
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all',
                    p.isDone
                      ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : p.isActive
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/30 bg-muted/20 opacity-50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground ml-1.5">{p.status}</span>
                  </div>
                  {p.isActive && !p.isDone && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                  )}
                  {p.isDone && (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Feed */}
          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Gefundene Kontakte
              </h4>
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {contacts.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/20 animate-fade-in"
                    style={{ animationDelay: `${Math.min(i * 80, 800)}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {c.kontakt.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{c.kontakt}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{c.rolle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="truncate">{c.firma}</span>
                        <span>•</span>
                        <span>{c.stadt}</span>
                      </div>
                    </div>
                    <Badge variant={c.score >= 80 ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                      {c.score}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/20">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={cn('text-xs font-semibold truncate', highlight && 'text-primary')}>{value}</p>
      </div>
    </div>
  );
}
