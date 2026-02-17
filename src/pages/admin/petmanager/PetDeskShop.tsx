/**
 * Pet Desk — Shop Tab: Zone 1 Produkt-CRUD (4 Kategorien)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  usePetShopProducts,
  useCreateShopProduct,
  useUpdateShopProduct,
  useDeleteShopProduct,
  type PetShopProduct,
} from '@/hooks/usePetShopProducts';

const CATEGORIES = [
  { key: 'ernaehrung', label: 'Ernährung' },
  { key: 'lennox_tracker', label: 'Lennox Tracker' },
  { key: 'lennox_style', label: 'Lennox Style' },
  { key: 'fressnapf', label: 'Fressnapf' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

const EMPTY_FORM = {
  name: '',
  description: '',
  price_label: '',
  price_cents: '',
  image_url: '',
  external_url: '',
  badge: '',
  sub_category: '',
  sort_order: '0',
};

export default function PetDeskShop() {
  const [activeTab, setActiveTab] = useState<CategoryKey>('ernaehrung');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PetShopProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: products = [], isLoading } = usePetShopProducts(activeTab);
  const createProduct = useCreateShopProduct();
  const updateProduct = useUpdateShopProduct();
  const deleteProduct = useDeleteShopProduct();

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: PetShopProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price_label: p.price_label ?? '',
      price_cents: p.price_cents?.toString() ?? '',
      image_url: p.image_url ?? '',
      external_url: p.external_url ?? '',
      badge: p.badge ?? '',
      sub_category: p.sub_category ?? '',
      sort_order: p.sort_order?.toString() ?? '0',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      category: activeTab,
      name: form.name,
      description: form.description || null,
      price_label: form.price_label || null,
      price_cents: form.price_cents ? parseInt(form.price_cents) : null,
      image_url: form.image_url || null,
      external_url: form.external_url || null,
      badge: form.badge || null,
      sub_category: form.sub_category || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: editingProduct?.is_active ?? true,
    };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const toggleActive = (p: PetShopProduct) => {
    updateProduct.mutate({ id: p.id, is_active: !p.is_active });
  };

  const handleDelete = (p: PetShopProduct) => {
    if (confirm(`"${p.name}" wirklich löschen?`)) {
      deleteProduct.mutate(p.id);
    }
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5" />
            Shop & Produktverwaltung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as CategoryKey)}>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <TabsList>
                {CATEGORIES.map(c => (
                  <TabsTrigger key={c.key} value={c.key} className="text-xs">
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button size="sm" className="gap-1.5" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Produkt anlegen
              </Button>
            </div>

            {CATEGORIES.map(c => (
              <TabsContent key={c.key} value={c.key}>
                {isLoading ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">Lade Produkte…</div>
                ) : products.length === 0 ? (
                  <div className="py-12 text-center rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">Noch keine Produkte in „{c.label}".</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreate}>
                      <Plus className="h-4 w-4" /> Erstes Produkt anlegen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors"
                      >
                        {/* Thumbnail */}
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{p.name}</span>
                            {p.badge && <Badge variant="secondary" className="text-[10px]">{p.badge}</Badge>}
                            {!p.is_active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inaktiv</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {p.price_label && <span className="text-xs text-muted-foreground">{p.price_label}</span>}
                            {p.sub_category && <span className="text-xs text-muted-foreground">· {p.sub_category}</span>}
                            {p.external_url && (
                              <a href={p.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                <ExternalLink className="h-3 w-3" /> Link
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* ═══ Create/Edit Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Produktname" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Beschreibung</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Kurzbeschreibung" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Preis-Anzeige</Label>
                <Input value={form.price_label} onChange={e => set('price_label', e.target.value)} placeholder="3,89 €" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Preis (Cent)</Label>
                <Input type="number" value={form.price_cents} onChange={e => set('price_cents', e.target.value)} placeholder="389" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Bild-URL</Label>
              <Input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Externer Link (Shop/Affiliate)</Label>
              <Input value={form.external_url} onChange={e => set('external_url', e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Badge</Label>
                <Input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="Neu" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Sub-Kategorie</Label>
                <Input value={form.sub_category} onChange={e => set('sub_category', e.target.value)} placeholder="Nassfutter" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Sortierung</Label>
                <Input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!form.name || createProduct.isPending || updateProduct.isPending}>
              {editingProduct ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
