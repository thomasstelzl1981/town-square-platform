/**
 * AdminKiOfficeRecherche — Contact Research & Lead Generation
 * Apollo search, website scraping, and bulk import
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminResearch, type ApolloContact, type ApolloSearchParams } from '@/hooks/useAdminResearch';
import { toast } from 'sonner';
import {
  Search,
  Download,
  Users,
  Building2,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Briefcase,
  ArrowRight
} from 'lucide-react';

const INDUSTRIES = [
  'Immobilienmakler',
  'Hausverwaltung',
  'Bauträger',
  'Finanzberatung',
  'Versicherung',
  'Rechtsanwaltskanzlei',
  'Steuerberatung',
  'Handwerk',
];

const REGIONS = [
  'Hamburg',
  'Schleswig-Holstein',
  'Niedersachsen',
  'Bremen',
  'Berlin',
  'Nordrhein-Westfalen',
  'Bayern',
  'Baden-Württemberg',
];

const TITLES = [
  'Geschäftsführer',
  'Inhaber',
  'Managing Director',
  'CEO',
  'Vertriebsleiter',
  'Sales Manager',
];

const CATEGORIES = ['Partner', 'Makler', 'Eigentümer', 'Bank', 'Handwerker', 'Sonstige'];

interface SearchForm {
  industries: string[];
  regions: string[];
  titles: string[];
  keywords: string;
}

const emptyForm: SearchForm = {
  industries: [],
  regions: [],
  titles: [],
  keywords: '',
};

export default function AdminKiOfficeRecherche() {
  const { jobs, isLoading, startApolloSearch, importContacts } = useAdminResearch();
  
  const [form, setForm] = useState<SearchForm>(emptyForm);
  const [results, setResults] = useState<ApolloContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [importCategory, setImportCategory] = useState('Partner');
  const [importTags, setImportTags] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (form.industries.length === 0 && form.regions.length === 0 && !form.keywords) {
      toast.error('Bitte mindestens ein Suchkriterium angeben');
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSelectedContacts(new Set());

    try {
      const params: ApolloSearchParams = {
        industries: form.industries,
        regions: form.regions,
        titles: form.titles,
        keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()) : undefined,
      };

      const result = await startApolloSearch.mutateAsync(params);
      setResults(result.contacts || []);
      
      if (result.contacts?.length > 0) {
        toast.success(`${result.contacts.length} Kontakte gefunden`);
      } else {
        toast.info('Keine Kontakte gefunden');
      }
    } catch (error) {
      toast.error('Suche fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsSearching(false);
    }
  };

  const toggleContact = (id: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContacts(newSet);
  };

  const selectAll = () => {
    if (selectedContacts.size === results.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(results.map(c => c.id)));
    }
  };

  const handleImport = async () => {
    if (selectedContacts.size === 0) {
      toast.error('Keine Kontakte ausgewählt');
      return;
    }

    const contactsToImport = results.filter(c => selectedContacts.has(c.id));
    const tags = importTags ? importTags.split(',').map(t => t.trim()).filter(Boolean) : [];

    try {
      const result = await importContacts.mutateAsync({
        contacts: contactsToImport,
        category: importCategory,
        tags,
      });

      toast.success(`${result.imported_count} Kontakte importiert`);
      setSelectedContacts(new Set());
    } catch (error) {
      toast.error('Import fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) 
      ? arr.filter(i => i !== item)
      : [...arr, item];
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kontakt-Recherche</h1>
        <p className="text-muted-foreground">
          Leads finden und in die Kontaktdatenbank importieren
        </p>
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Apollo-Suche
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Search Form */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Suchkriterien</CardTitle>
                <CardDescription>
                  Definieren Sie Ihre Zielgruppe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Branchen</Label>
                  <div className="flex flex-wrap gap-1">
                    {INDUSTRIES.map((ind) => (
                      <Badge
                        key={ind}
                        variant={form.industries.includes(ind) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setForm({ 
                          ...form, 
                          industries: toggleArrayItem(form.industries, ind) 
                        })}
                      >
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Regionen</Label>
                  <div className="flex flex-wrap gap-1">
                    {REGIONS.map((reg) => (
                      <Badge
                        key={reg}
                        variant={form.regions.includes(reg) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setForm({ 
                          ...form, 
                          regions: toggleArrayItem(form.regions, reg) 
                        })}
                      >
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Jobtitel</Label>
                  <div className="flex flex-wrap gap-1">
                    {TITLES.map((title) => (
                      <Badge
                        key={title}
                        variant={form.titles.includes(title) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setForm({ 
                          ...form, 
                          titles: toggleArrayItem(form.titles, title) 
                        })}
                      >
                        {title}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Keywords (optional)</Label>
                  <Input
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="z.B. Immobilien, Makler"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Suche starten
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Ergebnisse</CardTitle>
                    <CardDescription>
                      {results.length > 0 
                        ? `${results.length} Kontakte gefunden, ${selectedContacts.size} ausgewählt`
                        : 'Starten Sie eine Suche, um Kontakte zu finden'}
                    </CardDescription>
                  </div>
                  {results.length > 0 && (
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      {selectedContacts.size === results.length ? 'Alle abwählen' : 'Alle auswählen'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Ergebnisse</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {results.map((contact) => (
                          <div
                            key={contact.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedContacts.has(contact.id) 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => toggleContact(contact.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedContacts.has(contact.id)}
                                onCheckedChange={() => toggleContact(contact.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {contact.first_name} {contact.last_name}
                                  </span>
                                  {contact.title && (
                                    <Badge variant="outline" className="text-xs">
                                      {contact.title}
                                    </Badge>
                                  )}
                                </div>
                                {contact.company && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {contact.company}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  {contact.email && <span>{contact.email}</span>}
                                  {contact.city && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {contact.city}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Import Section */}
                    {selectedContacts.size > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-xs">Kategorie</Label>
                            <Select value={importCategory} onValueChange={setImportCategory}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Tags (kommagetrennt)</Label>
                            <Input
                              value={importTags}
                              onChange={(e) => setImportTags(e.target.value)}
                              placeholder="z.B. hamburg, neu"
                              className="h-8"
                            />
                          </div>
                          <div className="pt-4">
                            <Button onClick={handleImport} disabled={importContacts.isPending}>
                              {importContacts.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              {selectedContacts.size} importieren
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recherche-Verlauf</CardTitle>
              <CardDescription>
                Letzte 50 Recherche-Aufträge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : jobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Recherchen durchgeführt
                </p>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">
                            {job.job_type === 'apollo_search' ? 'Apollo-Suche' : 'Website-Scrape'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={job.status === 'completed' ? 'default' : 'outline'}>
                          {job.results_count || 0} Ergebnisse
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
