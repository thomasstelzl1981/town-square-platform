import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGoldenPathSeeds } from "@/hooks/useGoldenPathSeeds";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Database, Loader2, ShieldAlert, Sparkles } from "lucide-react";

const COUNT_KEYS = [
  "properties",
  "units",
  "loans",
  "leases",
  "contacts",
  "documents",
  "storage_nodes",
  "document_links",
  "landlord_contexts",
  "context_members",
  "tile_activations",
] as const;

export function GoldenPathSeedsPanel() {
  const queryClient = useQueryClient();
  const { activeTenantId, activeOrganization, isDevelopmentMode } = useAuth();

  const { runSeeds, isSeeding, lastResult, isSeedAllowed } = useGoldenPathSeeds(
    activeTenantId ?? undefined,
    activeOrganization?.name,
    activeOrganization?.org_type,
    isDevelopmentMode
  );

  const handleRunSeeds = async () => {
    const result = await runSeeds();

    if (result.success) {
      toast.success("Golden Path Seeds erfolgreich ausgeführt", {
        description: `Kontakte: ${result.after.contacts} | Objekte: ${result.after.properties} | Dokumente: ${result.after.documents}`,
      });

      // Refresh common queries so UI reflects new demo data
      queryClient.invalidateQueries();
    } else {
      toast.error(`Seed-Fehler: ${result.error || "Unbekannter Fehler"}`);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {isSeedAllowed ? (
            <Sparkles className="h-4 w-4 text-primary" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-destructive" />
          )}
          Golden Path Demo-Daten
        </CardTitle>
        <CardDescription>
          Erstellt/aktualisiert den Demo-Datensatz (Kontakte, Immobilie+Einheiten, Finanzierung, Dokumente, Ordnerstruktur).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
          tenant_id: {activeTenantId ? `${activeTenantId.slice(0, 8)}…` : "(none)"} | org: {activeOrganization?.name || "(none)"} | type:{" "}
          {activeOrganization?.org_type || "(none)"} | devMode: {isDevelopmentMode ? "true" : "false"}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunSeeds}
            disabled={isSeeding || !isSeedAllowed}
            className="gap-2"
            variant={isSeedAllowed ? "default" : "secondary"}
          >
            {isSeeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Seeds erstellen/aktualisieren
          </Button>

          {lastResult?.success && <Badge variant="default">Zuletzt erfolgreich</Badge>}
          {lastResult && !lastResult.success && <Badge variant="destructive">Fehler</Badge>}
        </div>

        {lastResult?.success && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Tabelle</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead className="text-right">Δ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COUNT_KEYS.map((key) => {
                  const before = lastResult.before[key] || 0;
                  const after = lastResult.after[key] || 0;
                  const delta = after - before;
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs">{key}</TableCell>
                      <TableCell className="text-right font-mono">{before}</TableCell>
                      <TableCell className="text-right font-mono">{after}</TableCell>
                      <TableCell className="text-right font-mono">
                        {delta > 0 ? (
                          <span className="text-primary">+{delta}</span>
                        ) : delta === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-destructive">{delta}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {lastResult && !lastResult.success && (
          <div className="text-sm text-destructive">{lastResult.error}</div>
        )}
      </CardContent>
    </Card>
  );
}
