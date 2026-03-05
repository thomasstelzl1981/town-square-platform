/**
 * R-4: ContextCardView — Read-only display card for a landlord context
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, User, MapPin, Link2, Pencil, Calculator } from 'lucide-react';
import { type LandlordContext, type ContextMember, formatAddress, formatCurrency } from './kontexteTypes';

interface ContextCardViewProps {
  ctx: LandlordContext;
  members: ContextMember[];
  propertyCount: number;
  onEdit: (ctx: LandlordContext) => void;
  onAssign: (ctx: { id: string; name: string }) => void;
}

export function ContextCardView({ ctx, members, propertyCount, onEdit, onAssign }: ContextCardViewProps) {
  const isPrivate = ctx.context_type === 'PRIVATE';
  
  return (
    <Card className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted shrink-0">
            {isPrivate ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base truncate">{ctx.name}</CardTitle>
              <Badge variant={isPrivate ? 'secondary' : 'default'} className="shrink-0">
                {isPrivate ? 'Privat' : 'Geschäftlich'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isPrivate && ctx.taxable_income_yearly ? (
                <>
                  <Calculator className="inline h-3 w-3 mr-1" />
                  {ctx.tax_rate_percent ?? 30}% Grenzsteuersatz · zVE {formatCurrency(ctx.taxable_income_yearly)} 
                  · {ctx.tax_assessment_type === 'SPLITTING' ? 'Splitting' : 'Einzel'}
                  {ctx.children_count && ctx.children_count > 0 && (
                    <span className="ml-1">· {ctx.children_count} Kind(er)</span>
                  )}
                </>
              ) : (
                <>
                  {ctx.tax_rate_percent ?? 30}% Steuersatz
                  {ctx.legal_form && ` · ${ctx.legal_form}`}
                </>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {isPrivate && members.length > 0 && (
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              {members.map(member => (
                <div key={member.id} className="text-sm p-2 bg-muted/40 rounded-md space-y-0.5">
                  <p className="font-medium truncate">{member.first_name} {member.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[member.birth_name && `geb. ${member.birth_name}`, member.tax_class && `Stkl. ${member.tax_class}`].filter(Boolean).join(' · ') || '–'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[member.profession, member.gross_income_yearly && formatCurrency(member.gross_income_yearly)].filter(Boolean).join(' · ') || '–'}
                  </p>
                  {member.ownership_share && (
                    <p className="text-xs font-medium text-primary">{member.ownership_share}%</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isPrivate && (
          <div className="border-t pt-3 space-y-1 text-sm">
            {(ctx.md_first_name || ctx.md_last_name || ctx.managing_director) && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">
                  GF: {ctx.md_first_name || ctx.md_last_name 
                    ? `${ctx.md_salutation ? ctx.md_salutation + ' ' : ''}${ctx.md_first_name || ''} ${ctx.md_last_name || ''}`.trim()
                    : ctx.managing_director}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate">
              {[
                ctx.registry_court && ctx.hrb_number && `${ctx.registry_court}, HRB ${ctx.hrb_number}`,
                !ctx.registry_court && ctx.hrb_number && `HRB: ${ctx.hrb_number}`,
                ctx.tax_number && `StNr: ${ctx.tax_number}`,
                ctx.ust_id && `USt-ID: ${ctx.ust_id}`,
              ].filter(Boolean).join(' · ') || '–'}
            </p>
          </div>
        )}

        {formatAddress(ctx) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatAddress(ctx)}</span>
          </div>
        )}

        <div className="border-t pt-3 space-y-2">
          <Badge variant="outline" className="text-xs">{propertyCount} Objekt(e) zugeordnet</Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(ctx)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />Bearbeiten
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onAssign({ id: ctx.id, name: ctx.name })}>
              <Link2 className="mr-1.5 h-3.5 w-3.5" />Zuordnen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
