/**
 * MOD-08 Favoriten Tab
 * Display and manage saved investment favorites
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Heart, Building2, MapPin, TrendingUp, MoreVertical, 
  Calculator, FileText, Edit2, Trash2, ExternalLink, Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useInvestmentFavorites, 
  useUpdateFavoriteNotes, 
  useRemoveFavorite,
  type FavoriteWithListing,
  type SearchParams
} from '@/hooks/useInvestmentFavorites';

export default function FavoritenTab() {
  const navigate = useNavigate();
  const { data: favorites = [], isLoading } = useInvestmentFavorites();
  const updateNotes = useUpdateFavoriteNotes();
  const removeFavorite = useRemoveFavorite();

  const [editingFavorite, setEditingFavorite] = useState<FavoriteWithListing | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const formatCurrency = (value: number | null) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const handleOpenEdit = (favorite: FavoriteWithListing) => {
    setEditingFavorite(favorite);
    setEditNotes(favorite.notes || '');
  };

  const handleSaveNotes = () => {
    if (editingFavorite) {
      updateNotes.mutate({ favoriteId: editingFavorite.id, notes: editNotes });
      setEditingFavorite(null);
    }
  };

  const handleRemove = (favoriteId: string) => {
    removeFavorite.mutate(favoriteId);
  };

  const handleToSimulation = (favoriteId: string) => {
    navigate(`/portal/investments/simulation?add=${favoriteId}`);
  };

  const handleToFinancing = (favoriteId: string) => {
    navigate(`/portal/finanzierung/anfrage?from=favorite&id=${favoriteId}`);
  };

  const getSourceLabel = (source: string | null) => {
    switch (source) {
      case 'platform': return 'Plattform';
      case 'kaufy': return 'Kaufy Import';
      case 'external': return 'Extern';
      default: return 'Suche';
    }
  };

  const getSearchParamsLabel = (params: SearchParams | null) => {
    if (!params) return null;
    const parts = [];
    if (params.zve) parts.push(`${(params.zve / 1000).toFixed(0)}k zVE`);
    if (params.equity) parts.push(`${(params.equity / 1000).toFixed(0)}k EK`);
    return parts.join(' · ');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meine Favoriten</h1>
          <p className="text-muted-foreground">
            Ihre vorgemerkten Investmentobjekte
          </p>
        </div>
        <Button variant="outline" disabled className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Kaufy Sync
          <Badge variant="secondary" className="text-xs">Bald</Badge>
        </Button>
      </div>

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine Favoriten vorhanden</h3>
            <p className="text-muted-foreground mb-4">
              Durchsuchen Sie Objekte und merken Sie interessante vor.
            </p>
            <Button onClick={() => navigate('/portal/investments/suche')}>
              Zur Objektsuche
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {favorites.map((favorite) => (
            <Card key={favorite.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Image Placeholder */}
                  <div className="w-32 md:w-48 bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {favorite.title || favorite.listing?.title || 'Objekt'}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {getSourceLabel(favorite.source)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {favorite.location || favorite.listing?.properties?.city || '–'}
                          </span>
                          {favorite.listing?.properties?.total_area_sqm && (
                            <span>{favorite.listing.properties.total_area_sqm} m²</span>
                          )}
                          {favorite.listing?.properties?.property_type && (
                            <span>{favorite.listing.properties.property_type}</span>
                          )}
                        </div>

                        <p className="text-lg font-bold">
                          {formatCurrency(favorite.price || favorite.listing?.asking_price || null)}
                        </p>

                        {/* Search Params */}
                        {getSearchParamsLabel(favorite.search_params as SearchParams) && (
                          <p className="text-xs text-muted-foreground">
                            Berechnet mit: {getSearchParamsLabel(favorite.search_params as SearchParams)}
                          </p>
                        )}

                        {/* Calculated Burden */}
                        {favorite.calculated_burden !== null && (
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium",
                            favorite.calculated_burden <= 0 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            <TrendingUp className="w-3 h-3" />
                            {favorite.calculated_burden <= 0 ? '+' : ''}
                            {formatCurrency(Math.abs(favorite.calculated_burden))}/Mo
                          </div>
                        )}

                        {/* Notes */}
                        {favorite.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {favorite.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToSimulation(favorite.id)}>
                            <Calculator className="w-4 h-4 mr-2" />
                            Zur Simulation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToFinancing(favorite.id)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Anfrage stellen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenEdit(favorite)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          {favorite.external_listing_url && (
                            <DropdownMenuItem asChild>
                              <a href={favorite.external_listing_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Original öffnen
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRemove(favorite.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Entfernen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button 
                        size="sm" 
                        onClick={() => handleToSimulation(favorite.id)}
                        className="gap-2"
                      >
                        <Calculator className="w-4 h-4" />
                        Zur Simulation hinzufügen
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleToFinancing(favorite.id)}
                      >
                        Anfrage stellen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Für eine aktive Objektsuche durch einen Akquise-Manager 
            erstellen Sie ein{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm"
              onClick={() => navigate('/portal/investments/mandat')}
            >
              Suchmandat
            </Button>.
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingFavorite} onOpenChange={() => setEditingFavorite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Favorit bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notizen</label>
              <Textarea
                placeholder="Ihre Notizen zu diesem Objekt..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFavorite(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateNotes.isPending}>
              {updateNotes.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
