/**
 * BankSelectionCard — Kachel 2 oben: 4-Quellen-Grid für Bankauswahl
 * Extracted from FMEinreichung.tsx (R-1)
 */
import { Loader2, Building2, Search, Sparkles, Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SearchProgressIndicator } from '@/components/portal/shared/SearchProgressIndicator';
import { cn } from '@/lib/utils';
import type { SelectedBank } from './fmEinreichungTypes';
import { MAX_BANKS } from './fmEinreichungTypes';

interface BankSelectionCardProps {
  selectedId: string | null;
  selectedBanks: SelectedBank[];
  addBank: (bank: SelectedBank) => void;
  removeBank: (id: string) => void;
  // Kontaktbuch
  bankSearchQuery: string;
  setBankSearchQuery: (q: string) => void;
  filteredBankContacts: any[];
  // KI
  aiSearchInput: string;
  setAiSearchInput: (q: string) => void;
  searchBanks: () => void;
  researchEngine: any;
  // Manuell
  manualBankName: string;
  setManualBankName: (n: string) => void;
  manualBankEmail: string;
  setManualBankEmail: (e: string) => void;
  addManualBank: () => void;
}

export function BankSelectionCard({
  selectedId, selectedBanks, addBank, removeBank,
  bankSearchQuery, setBankSearchQuery, filteredBankContacts,
  aiSearchInput, setAiSearchInput, searchBanks, researchEngine,
  manualBankName, setManualBankName, manualBankEmail, setManualBankEmail, addManualBank,
}: BankSelectionCardProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quelle 1: Zone-1 Kontaktbuch */}
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Search className="h-3.5 w-3.5 text-primary" />
            Bankkontaktbuch (Zone 1)
          </div>
          <Input
            placeholder="Bank suchen..."
            value={bankSearchQuery}
            onChange={(e) => setBankSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {filteredBankContacts.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">Keine Banken gefunden</p>
            ) : (
              filteredBankContacts.slice(0, 12).map(bank => (
                <button
                  key={bank.id}
                  onClick={() => addBank({
                    id: bank.id,
                    name: bank.bank_name,
                    email: bank.contact_email || '',
                    source: 'kontaktbuch',
                  })}
                  disabled={selectedBanks.length >= MAX_BANKS || selectedBanks.some(b => b.email === bank.contact_email)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-primary/5 transition-colors disabled:opacity-40',
                    selectedBanks.some(b => b.email === bank.contact_email) && 'bg-primary/10'
                  )}
                >
                  <span className="font-medium">{bank.bank_name}</span>
                  {bank.contact_email && (
                    <span className="text-muted-foreground ml-1">— {bank.contact_email}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Quelle 2: KI-Suche */}
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            KI-Bankensuche
            {researchEngine.results.length > 0 && (
              <Badge variant="outline" className="text-[9px] ml-auto">{researchEngine.results.length} Treffer</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="PLZ, Ort oder Adresse eingeben…"
              value={aiSearchInput}
              onChange={(e) => setAiSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchBanks()}
              className="h-8 text-xs flex-1"
            />
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs shrink-0"
              onClick={() => searchBanks()}
              disabled={researchEngine.isSearching || !aiSearchInput.trim()}
            >
              {researchEngine.isSearching ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
              KI-Suche
            </Button>
          </div>

          {researchEngine.isSearching ? (
            <SearchProgressIndicator
              elapsedSeconds={researchEngine.elapsedSeconds}
              estimatedDuration={researchEngine.estimatedDuration}
              phases={[
                { upTo: 15, label: "Banken im Umkreis suchen…" },
                { upTo: 35, label: "Websites nach Kontaktdaten scannen…" },
                { upTo: 55, label: "Ergebnisse zusammenführen…" },
              ]}
            />
          ) : researchEngine.error ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-[10px] text-destructive">{researchEngine.error}</p>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => searchBanks()}>
                Erneut suchen
              </Button>
            </div>
          ) : researchEngine.results.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">
              {selectedId ? 'Suchbegriff eingeben und „KI-Suche" klicken' : 'Bitte zuerst eine Akte auswählen'}
            </p>
          ) : (
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {researchEngine.results.map((r: any, idx: number) => (
                <button
                  key={`engine_${idx}`}
                  onClick={() => addBank({
                    id: `engine_${idx}`,
                    name: r.name,
                    email: r.email || '',
                    source: 'ki',
                  })}
                  disabled={selectedBanks.length >= MAX_BANKS || selectedBanks.some(b => b.id === `engine_${idx}`)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors disabled:opacity-40"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-accent-foreground shrink-0" />
                    <span className="font-medium truncate">{r.name}</span>
                    <Plus className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
                  </div>
                  <div className="pl-5 text-[10px] text-muted-foreground truncate">{r.address || ''}</div>
                  {r.phone && (
                    <div className="pl-5 text-[10px] text-muted-foreground">{r.phone}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quelle 3: Manuelle Eingabe */}
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Plus className="h-3.5 w-3.5 text-primary" />
            Manuelle Eingabe
          </div>
          <Input
            placeholder="Bankname"
            value={manualBankName}
            onChange={(e) => setManualBankName(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder="E-Mail-Adresse"
            type="email"
            value={manualBankEmail}
            onChange={(e) => setManualBankEmail(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs w-full"
            onClick={addManualBank}
            disabled={selectedBanks.length >= MAX_BANKS}
          >
            <Plus className="h-3 w-3 mr-1" /> Hinzufügen
          </Button>
        </div>

        {/* Ausgewählte Banken (Sammlung) */}
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Ausgewählte Banken
            <Badge variant="outline" className="text-[9px] ml-auto">{selectedBanks.length}/{MAX_BANKS}</Badge>
          </div>
          {selectedBanks.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-6">
              Noch keine Banken ausgewählt. Wählen Sie bis zu {MAX_BANKS} Banken aus den anderen Quellen.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedBanks.map((bank, idx) => (
                <div key={bank.id} className="flex items-center gap-2 border rounded px-3 py-2 bg-muted/20">
                  <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{bank.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {bank.email || 'E-Mail wird im Entwurf ergänzt'}
                      <Badge variant="outline" className="text-[9px] ml-2">
                        {bank.source === 'kontaktbuch' ? 'Kontaktbuch' : bank.source === 'ki' ? 'KI' : 'Manuell'}
                      </Badge>
                    </div>
                  </div>
                  <button onClick={() => removeBank(bank.id)} className="hover:bg-destructive/20 rounded-full p-1 shrink-0">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
              {Array.from({ length: MAX_BANKS - selectedBanks.length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex items-center gap-2 border border-dashed rounded px-3 py-2">
                  <span className="text-xs font-bold text-muted-foreground/40 w-5">{selectedBanks.length + idx + 1}.</span>
                  <span className="text-[10px] text-muted-foreground/40 italic">Frei — Bank aus Suche oder KI wählen</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
