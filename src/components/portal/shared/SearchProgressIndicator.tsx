import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Phase {
  upTo: number;
  label: string;
}

interface SearchProgressIndicatorProps {
  elapsedSeconds: number;
  estimatedDuration?: number;
  phases?: Phase[];
  /** When true, after estimatedDuration the bar keeps going with an "extended search" message */
  openEnded?: boolean;
}

const DEFAULT_PHASES: Phase[] = [
  { upTo: 15, label: "Google Places durchsuchen…" },
  { upTo: 35, label: "Websites nach E-Mails scannen…" },
  { upTo: 55, label: "Ergebnisse zusammenführen…" },
];

export function SearchProgressIndicator({
  elapsedSeconds,
  estimatedDuration = 55,
  phases = DEFAULT_PHASES,
  openEnded = true,
}: SearchProgressIndicatorProps) {
  const isOvertime = elapsedSeconds > estimatedDuration;

  // Before estimatedDuration: linear 0→98%. After: logarithmic crawl 98→99.5%
  let progress: number;
  if (!isOvertime) {
    progress = Math.min((elapsedSeconds / estimatedDuration) * 100, 98);
  } else {
    const overtime = elapsedSeconds - estimatedDuration;
    // Asymptotic approach: 98 + 1.5 * (1 - 1/(1 + overtime/30))
    progress = 98 + 1.5 * (1 - 1 / (1 + overtime / 30));
  }

  // Phase label
  let phaseLabel: string;
  if (isOvertime && openEnded) {
    phaseLabel = "Erweiterte Suche — Ergebnisse werden weiter gesammelt…";
  } else {
    const currentPhase = phases.find((p) => elapsedSeconds < p.upTo) || phases[phases.length - 1];
    phaseLabel = currentPhase?.label || "Suche läuft…";
  }

  // Timer display: show actual elapsed / estimated (or just elapsed when overtime)
  const timerDisplay = isOvertime
    ? `${elapsedSeconds}s (> ~${estimatedDuration}s geschätzt)`
    : `${elapsedSeconds}/~${estimatedDuration}s`;

  return (
    <div className="space-y-2 py-4 px-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {phaseLabel}
        </span>
        <span className="tabular-nums font-medium">
          {timerDisplay}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-[10px] text-muted-foreground">
        {isOvertime && openEnded
          ? "Die Suche dauert etwas länger als erwartet — die Quellen liefern noch Daten."
          : "Bitte warten — Ergebnisse werden aus mehreren Quellen zusammengeführt."}
      </p>
    </div>
  );
}
