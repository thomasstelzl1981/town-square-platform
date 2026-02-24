/**
 * ServiceDeskProductCRUD — Reusable CRUD component for service shop products
 * Pattern: Sub-tab sidebar (left) + product list with CRUD (right)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingBag, Plus, Pencil, Trash2, ExternalLink, Plug, WifiOff } from 'lucide-react';
import {
  useServiceShopProducts,
  useCreateServiceProduct,
  useUpdateServiceProduct,
  useDeleteServiceProduct,
  type ServiceShopProduct,
} from '@/hooks/useServiceShopProducts';

interface SubTab {
  key: string;
  label: string;
}

interface ServiceDeskProductCRUDProps {
  title: string;
  subTabs: SubTab[];
  shopKeyPrefix?: string;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  price_label: '',
  price_cents: '',
  image_url: '',
  external_url: '',
  affiliate_tag: '',
  affiliate_network: '',
  badge: '',
  sub_category: '',
  sort_order: '0',
};

export default function ServiceDeskProductCRUD({ title, subTabs, shopKeyPrefix = '' }: ServiceDeskProductCRUDProps) {
  const [activeTab, setActiveTab] = useState(subTabs[0]?.key ?? '');
  const shopKey = shopKeyPrefix ? `${shopKeyPrefix}-${activeTab}` : activeTab;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ServiceShopProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: products = [], isLoading } = useServiceShopProducts(shopKey);
  const createProduct = useCreateServiceProduct();
  const updateProduct = useUpdateServiceProduct();
  const deleteProduct = useDeleteServiceProduct();

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: ServiceShopProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price_label: p.price_label ?? '',
      price_cents: p.price_cents?.toString() ?? '',
      image_url: p.image_url ?? '',
      external_url: p.external_url ?? '',
      affiliate_tag: p.affiliate_tag ?? '',
      affiliate_network: p.affiliate_network ?? '',
      badge: p.badge ?? '',
      sub_category: p.sub_category ?? '',
      sort_order: p.sort_order?.toString() ?? '0',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      shop_key: shopKey,
      category: activeTab,
      name: form.name,
      description: form.description || null,
      price_label: form.price_label || null,
      price_cents: form.price_cents ? parseInt(form.price_cents) : null,
      image_url: form.image_url || null,
      external_url: form.external_url || null,
      affiliate_tag: form.affiliate_tag || null,
      affiliate_network: form.affiliate_network || null,
      badge: form.badge || null,
      sub_category: form.sub_category || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: editingProduct?.is_active ?? true,
      metadata: null,
    };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const toggleActive = (p: ServiceShopProduct) => {
    updateProduct.mutate({ id: p.id, is_active: !p.is_active });
  };

  const handleDelete = (p: ServiceShopProduct) => {
    if (confirm(`"${p.name}" wirklich löschen?`)) {
      deleteProduct.mutate(p.id);
    }
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const activeLabel = subTabs.find(t => t.key === activeTab)?.label ?? activeTab;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Sub-tab Sidebar */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              {subTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Product List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">{activeLabel}</h3>
                <Button size="sm" className="gap-1.5" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Produkt anlegen
                </Button>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Lade Produkte…</div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center rounded-lg border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Noch keine Produkte in „{activeLabel}".</p>
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
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{p.name}</span>
                          {p.badge && <Badge variant="secondary" className="text-[10px]">{p.badge}</Badge>}
                          {!p.is_active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inaktiv</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {p.price_label && <span className="text-xs text-muted-foreground">{p.price_label}</span>}
                          {p.affiliate_tag && <span className="text-xs text-muted-foreground">· Tag: {p.affiliate_tag}</span>}
                          {p.external_url && (
                            <a href={p.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                              <ExternalLink className="h-3 w-3" /> Link
                            </a>
                          )}
                        </div>
                      </div>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Config Placeholder */}
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <Plug className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Affiliate-Konfiguration</p>
            <p className="text-xs text-muted-foreground">AWIN/API-Anbindung wird später implementiert</p>
          </div>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            Nicht verbunden
          </Badge>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Affiliate-Tag</Label>
                <Input value={form.affiliate_tag} onChange={e => set('affiliate_tag', e.target.value)} placeholder="immoportal-21" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Affiliate-Netzwerk</Label>
                <Input value={form.affiliate_network} onChange={e => set('affiliate_network', e.target.value)} placeholder="amazon-partnernet" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Badge</Label>
                <Input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="Neu" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Sub-Kategorie</Label>
                <Input value={form.sub_category} onChange={e => set('sub_category', e.target.value)} placeholder="Outdoor" />
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
