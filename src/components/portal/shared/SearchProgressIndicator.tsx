import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface Phase {
  upTo: number;
  label: string;
}

interface SearchProgressIndicatorProps {
  elapsedSeconds: number;
  estimatedDuration?: number;
  phases?: Phase[];
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
}: SearchProgressIndicatorProps) {
  const progress = Math.min((elapsedSeconds / estimatedDuration) * 100, 98);
  const currentPhase = phases.find((p) => elapsedSeconds < p.upTo) || phases[phases.length - 1];

  return (
    <div className="space-y-2 py-4 px-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {currentPhase?.label}
        </span>
        <span className="tabular-nums font-medium">
          {elapsedSeconds}/~{estimatedDuration}s
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-[10px] text-muted-foreground">
        Bitte warten — Ergebnisse werden aus mehreren Quellen zusammengeführt.
      </p>
    </div>
  );
}
