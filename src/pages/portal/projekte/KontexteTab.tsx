/**
 * Kontexte Tab - Developer Context Management
 * MOD-13 PROJEKTE
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Star, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDeveloperContexts } from '@/hooks/useDeveloperContexts';
import { CreateDeveloperContextDialog } from '@/components/projekte';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import type { DeveloperContext } from '@/types/projekte';

export default function KontexteTab() {
  const { contexts, isLoading, setDefaultContext, deleteContext } = useDeveloperContexts();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return <LoadingState />;
  }

  if (contexts.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Keine Verkäufer-Gesellschaften"
          description="Legen Sie eine Gesellschaft an, um Projekte zu verwalten."
          action={{ label: 'Gesellschaft anlegen', onClick: () => setCreateOpen(true) }}
        />
        <CreateDeveloperContextDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  const handleSetDefault = async (ctx: DeveloperContext) => {
    if (!ctx.is_default) {
      await setDefaultContext.mutateAsync(ctx.id);
    }
  };

  const handleDelete = async (ctx: DeveloperContext) => {
    if (confirm(`"${ctx.name}" wirklich löschen?`)) {
      await deleteContext.mutateAsync(ctx.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Verkäufer-Gesellschaften</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Bauträger- und Aufteiler-Gesellschaften
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Gesellschaft
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contexts.map((ctx) => (
          <Card key={ctx.id} className={ctx.is_default ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{ctx.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!ctx.is_default && (
                    <DropdownMenuItem onClick={() => handleSetDefault(ctx)}>
                      <Star className="mr-2 h-4 w-4" />
                      Als Standard setzen
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(ctx)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-2">
              {ctx.is_default && (
                <Badge variant="secondary" className="mb-2">
                  <Star className="mr-1 h-3 w-3" />
                  Standard
                </Badge>
              )}
              
              <div className="text-sm text-muted-foreground space-y-1">
                {ctx.legal_form && <p>Rechtsform: {ctx.legal_form}</p>}
                {ctx.managing_director && <p>GF: {ctx.managing_director}</p>}
                {ctx.city && (
                  <p>
                    {ctx.street} {ctx.house_number}, {ctx.postal_code} {ctx.city}
                  </p>
                )}
                {ctx.ust_id && <p>USt-ID: {ctx.ust_id}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateDeveloperContextDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
