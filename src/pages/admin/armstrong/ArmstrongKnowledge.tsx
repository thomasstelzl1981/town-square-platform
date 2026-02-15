/**
 * Armstrong Knowledge Base — Zone 1 Admin
 * 
 * Kuratierte Wissensdatenbank für deutsche Immobilienthemen.
 * 7 Kategorien: System, Immobilien, Steuern/Recht, Finanzierung, Vertrieb, Vorlagen, Research
 */
import React, { useState } from 'react';
import { BookOpen, Plus, Search, Filter, Eye, Loader2, ArrowLeft, CheckCircle, Clock, Edit2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { useArmstrongKnowledge, KnowledgeItem, KnowledgeStatus } from '@/hooks/useArmstrongKnowledge';
import { getAllCategories, getCategory, KB_CONFIDENCE_LEVELS } from '@/constants/armstrongKBTaxonomy';
import type { KBCategory } from '@/types/armstrong';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';

const categories = getAllCategories();

const statusBadgeConfig: Record<KnowledgeStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  draft: { variant: 'secondary', label: 'Entwurf' },
  review: { variant: 'default', label: 'In Prüfung' },
  published: { variant: 'outline', label: 'Veröffentlicht' },
  deprecated: { variant: 'destructive', label: 'Archiviert' },
};

export default function ArmstrongKnowledge() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<KBCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<KnowledgeStatus | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  const { items, stats, categoryCounts, isLoading, refetch } = useArmstrongKnowledge({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search || undefined,
  });

  const getCategoryIcon = (iconName: string): React.ElementType => {
    const icons: Record<string, React.ElementType> = {
      Settings: LucideIcons.Settings,
      Building2: LucideIcons.Building2,
      Scale: LucideIcons.Scale,
      Landmark: LucideIcons.Landmark,
      MessageSquare: LucideIcons.MessageSquare,
      FileText: LucideIcons.FileText,
      Search: LucideIcons.Search,
    };
    return icons[iconName] || BookOpen;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/armstrong">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Knowledge Base
            </h1>
            <p className="text-muted-foreground mt-1">
              Kuratierte Wissensdatenbank für deutsche Immobilienthemen
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Eintrag hinzufügen
        </Button>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.icon);
          const count = categoryCounts[category.code] || 0;
          return (
            <Card 
              key={category.code} 
              className={`cursor-pointer hover:border-primary transition-colors ${
                categoryFilter === category.code ? 'border-primary' : ''
              }`}
              onClick={() => setCategoryFilter(categoryFilter === category.code ? 'all' : category.code)}
            >
              <CardContent className="pt-4 pb-3 px-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg ${category.color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="font-medium text-sm">{category.label_de}</h3>
                <p className="text-xs text-muted-foreground">{count} Einträge</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Alle ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="published">
            Veröffentlicht ({stats.published})
          </TabsTrigger>
          <TabsTrigger value="review" className="relative">
            In Prüfung ({stats.review})
            {stats.review > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-status-warning" />
            )}
          </TabsTrigger>
          <TabsTrigger value="draft">
            Entwürfe ({stats.draft})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Wissensdatenbank durchsuchen..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as KnowledgeStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="published">Veröffentlicht</SelectItem>
                <SelectItem value="review">In Prüfung</SelectItem>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="deprecated">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Wissensbeiträge</CardTitle>
              <CardDescription>
                {items.length} Einträge gefunden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Keine Einträge vorhanden</h3>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    Erstellen Sie den ersten Wissenseintrag, um Armstrong mit 
                    domänenspezifischem Wissen zu erweitern.
                  </p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Eintrag erstellen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const category = getCategory(item.category) || { icon: 'BookOpen', label_de: item.category || 'Unbekannt', color: 'bg-gray-500', code: item.category };
                    const CategoryIcon = getCategoryIcon(category.icon);
                    const confidence = KB_CONFIDENCE_LEVELS[item.confidence] || { label_de: 'Unbekannt', color: 'bg-gray-400' };
                    
                    return (
                      <div 
                        key={item.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className={`h-10 w-10 rounded-lg ${category.color} flex items-center justify-center shrink-0`}>
                          <CategoryIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium">{item.title_de}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.summary_de || item.content.substring(0, 150) + '...'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={statusBadgeConfig[item.status].variant}>
                                {statusBadgeConfig[item.status].label}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="font-mono">{item.item_code}</span>
                            <span>{category.label_de}</span>
                            <span className={`flex items-center gap-1 ${confidence.color.replace('bg-', 'text-')}`}>
                              <span className={`h-2 w-2 rounded-full ${confidence.color}`} />
                              {confidence.label_de}
                            </span>
                            <span>v{item.version}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Filter auf "Veröffentlicht" anwenden...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review-Warteschlange</CardTitle>
              <CardDescription>
                Einträge, die auf Freigabe warten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.review === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-status-success/50 mb-4" />
                  <h3 className="text-lg font-medium">Alles geprüft!</h3>
                  <p className="text-muted-foreground mt-1">
                    Keine Einträge warten derzeit auf Freigabe.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">{stats.review} Einträge in Review</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Filter auf "Entwurf" anwenden...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeConfig[selectedItem.status].variant}>
                    {statusBadgeConfig[selectedItem.status].label}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{selectedItem.item_code}</span>
                </div>
                <DialogTitle className="text-xl">{selectedItem.title_de}</DialogTitle>
                <DialogDescription>
                  {selectedItem.summary_de}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Kategorie:</span>
                    <p className="font-medium">{getCategory(selectedItem.category).label_de}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Typ:</span>
                    <p className="font-medium capitalize">{selectedItem.content_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Konfidenz:</span>
                    <p className="font-medium">{KB_CONFIDENCE_LEVELS[selectedItem.confidence].label_de}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/30">
                  <h4 className="font-medium mb-2">Inhalt</h4>
                  <div className="prose prose-sm max-w-none text-foreground">
                    {selectedItem.content}
                  </div>
                </div>

                {selectedItem.sources && selectedItem.sources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Quellen</h4>
                    <ul className="text-sm space-y-1">
                      {selectedItem.sources.map((source, i) => (
                        <li key={i}>
                          {source.url ? (
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {source.title || source.url}
                            </a>
                          ) : (
                            source.title
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Erstellt: {format(new Date(selectedItem.created_at), 'dd.MM.yyyy', { locale: de })}
                    {selectedItem.published_at && (
                      <> · Veröffentlicht: {format(new Date(selectedItem.published_at), 'dd.MM.yyyy', { locale: de })}</>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Button>
                    {selectedItem.status === 'review' && (
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Freigeben
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
