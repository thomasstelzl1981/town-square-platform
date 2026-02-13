import { useState } from 'react';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { TAB_CONFIG, TOPIC_LABELS, TOPICS, type FortbildungTab, type FortbildungTopic } from '@/services/fortbildung/types';
import { useAdminFortbildungItems, useUpdateFortbildungItem, useDeleteFortbildungItem, useCreateFortbildungItem, useReorderFortbildungItems } from '@/hooks/useAdminFortbildung';
import AdminFortbildungDrawer from './AdminFortbildungDrawer';

const TABS = Object.keys(TAB_CONFIG) as FortbildungTab[];

export default function AdminFortbildung() {
  const [activeTab, setActiveTab] = useState<FortbildungTab>('books');
  const [activeTopic, setActiveTopic] = useState<FortbildungTopic | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);

  const { data: items = [], isLoading } = useAdminFortbildungItems(activeTab, activeTopic);
  const createMutation = useCreateFortbildungItem();
  const updateMutation = useUpdateFortbildungItem();
  const deleteMutation = useDeleteFortbildungItem();

  const handleToggleActive = (id: string, is_active: boolean) => {
    updateMutation.mutate({ id, is_active }, {
      onError: () => toast.error('Fehler beim Aktualisieren'),
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Eintrag gelöscht'),
      onError: () => toast.error('Fehler beim Löschen'),
    });
  };

  const handleSave = (data: Record<string, any>) => {
    const { id, ...rest } = data;
    if (id) {
      updateMutation.mutate({ id, ...rest }, {
        onSuccess: () => { toast.success('Gespeichert'); setDrawerOpen(false); },
        onError: () => toast.error('Fehler beim Speichern'),
      });
    } else {
      createMutation.mutate(rest, {
        onSuccess: () => { toast.success('Angelegt'); setDrawerOpen(false); },
        onError: () => toast.error('Fehler beim Anlegen'),
      });
    }
  };

  const openCreate = () => { setEditItem(null); setDrawerOpen(true); };
  const openEdit = (item: Record<string, any>) => { setEditItem(item); setDrawerOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fortbildung verwalten</h1>
          <p className="text-muted-foreground text-sm">Kuratierte Inhalte für Bücher, Fortbildungen, Vorträge und Kurse</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Neuer Eintrag</Button>
      </div>

      {/* Tab Filter */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FortbildungTab)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>{TAB_CONFIG[t].label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Topic Filter */}
      <div className="flex gap-2">
        <Badge
          variant={!activeTopic ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveTopic(undefined)}
        >Alle</Badge>
        {TOPICS.map((t) => (
          <Badge
            key={t}
            variant={activeTopic === t ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveTopic(t)}
          >{TOPIC_LABELS[t]}</Badge>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 p-2"></th>
              <th className="text-left p-2">Titel</th>
              <th className="text-left p-2 hidden md:table-cell">Autor/Kanal</th>
              <th className="text-left p-2 hidden lg:table-cell">Provider</th>
              <th className="text-left p-2 hidden lg:table-cell">Topic</th>
              <th className="text-left p-2 hidden md:table-cell">Preis</th>
              <th className="w-16 p-2">Aktiv</th>
              <th className="w-24 p-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Laden…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Keine Einträge</td></tr>
            ) : items.map((item: any) => (
              <tr key={item.id} className="border-b hover:bg-muted/30">
                <td className="p-2 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                <td className="p-2 font-medium">{item.title}</td>
                <td className="p-2 hidden md:table-cell text-muted-foreground">{item.author_or_channel || '–'}</td>
                <td className="p-2 hidden lg:table-cell"><Badge variant="outline">{item.provider}</Badge></td>
                <td className="p-2 hidden lg:table-cell"><Badge variant="secondary">{TOPIC_LABELS[item.topic as FortbildungTopic] || item.topic}</Badge></td>
                <td className="p-2 hidden md:table-cell">{item.price_text || '–'}</td>
                <td className="p-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(v) => handleToggleActive(item.id, v)}
                  />
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                          <AlertDialogDescription>"{item.title}" wird unwiderruflich gelöscht.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Löschen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminFortbildungDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        item={editItem}
        onSave={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
