/**
 * IntakeChecklistGrid — Shows required documents per module from storageManifest.
 * Displays which document types are needed with a progress indicator.
 */

import { STORAGE_MANIFEST } from '@/config/storageManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

const MODULES_WITH_CHECKLISTS = ['MOD_04', 'MOD_07', 'MOD_17', 'MOD_19'] as const;

export function IntakeChecklistGrid() {
  const modulesWithDocs = MODULES_WITH_CHECKLISTS.map((code) => STORAGE_MANIFEST[code]).filter(
    (m) => m && m.required_docs.length > 0,
  );

  if (modulesWithDocs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Benötigte Unterlagen
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modulesWithDocs.map((mod) => (
          <Card key={mod.module_code}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">{mod.root_name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {mod.required_docs.map((doc) => (
                <div key={doc.name} className="flex items-center gap-2 text-xs">
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                  <span className="text-muted-foreground">{doc.name}</span>
                </div>
              ))}
              <div className="pt-1">
                <Progress value={0} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  0 von {mod.required_docs.length} vorhanden
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
