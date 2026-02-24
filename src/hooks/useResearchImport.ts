/**
 * useResearchImport — Kontaktbuch-Import mit Engine-basierter Dedupe + Normalisierung
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeContact, calcConfidence, findDedupeMatches, normalizePhone } from '@/engines/marketDirectory/engine';
import { toast } from 'sonner';

export function useResearchImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      resultIds,
      duplicatePolicy = 'skip',
    }: {
      orderId: string;
      resultIds: string[];
      duplicatePolicy?: 'skip' | 'update';
    }) => {
      // 1. Load selected results
      const { data: results, error: resErr } = await supabase
        .from('soat_search_results')
        .select('*')
        .eq('order_id', orderId)
        .in('id', resultIds);
      if (resErr) throw resErr;
      if (!results?.length) throw new Error('Keine importierbaren Ergebnisse gefunden');

      // 2. Get tenant_id from user's org
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
      const tenantId = (profile as any)?.org_id;
      if (!tenantId) throw new Error('Keine Organisation zugeordnet');

      // 3. Load existing contacts for dedupe pool
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id, email, phone, first_name, last_name, company, postal_code, street')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .limit(1000);

      const dedupePool = (existingContacts || []).map((c: any) => ({
        id: c.id,
        email: c.email,
        phone: c.phone,
        firstName: c.first_name,
        lastName: c.last_name,
        company: c.company,
        postalCode: c.postal_code,
        street: c.street,
        domain: undefined,
      }));

      let importedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      for (const result of results as any[]) {
        // 4. Normalize via engine
        const normResult = normalizeContact({
          salutation: result.salutation,
          first_name: result.first_name,
          last_name: result.last_name,
          company_name: result.company_name,
          contact_person_name: result.contact_person_name,
          phone: result.phone,
          email: result.email,
          website_url: result.website_url,
          address_line: result.address_line,
          postal_code: result.postal_code,
          city: result.city,
        });
        const n = normResult.normalized;

        // 5. Dedupe check
        const matches = findDedupeMatches(
          { email: n.email, phoneE164: n.phoneE164, domain: n.domain, firstName: n.firstName, lastName: n.lastName, company: n.company, postalCode: n.postalCode, street: n.street },
          dedupePool,
        );

        const conf = calcConfidence(n, 1);
        const displayName = [n.firstName, n.lastName].filter(Boolean).join(' ') || n.company || 'Unbekannt';

        if (matches.length > 0) {
          if (duplicatePolicy === 'update') {
            // Update existing contact with new data (fill empty fields only)
            const existingId = matches[0].existingContactId;
            const updateData: Record<string, any> = {};
            if (n.email) updateData.email = n.email;
            if (n.phoneE164) updateData.phone = n.phoneE164;
            if (n.firstName) updateData.first_name = n.firstName;
            if (n.lastName) updateData.last_name = n.lastName;
            if (n.company) updateData.company = n.company;
            if (n.city) updateData.city = n.city;
            if (n.postalCode) updateData.postal_code = n.postalCode;
            if (n.street) updateData.street = n.street;
            if (n.salutation) updateData.salutation = n.salutation;
            updateData.confidence_score = Math.round(conf.score * 100);
            updateData.updated_at = new Date().toISOString();

            await supabase.from('contacts').update(updateData).eq('id', existingId);
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // 6. Insert new contact
          const { error: insertErr } = await supabase.from('contacts').insert({
            tenant_id: tenantId,
            salutation: n.salutation || null,
            first_name: n.firstName || null,
            last_name: n.lastName || null,
            email: n.email || null,
            phone: n.phoneE164 || null,
            company: n.company || null,
            street: n.street || null,
            postal_code: n.postalCode || null,
            city: n.city || null,
            category: result.category || 'Sonstige',
            confidence_score: Math.round(conf.score * 100),
            quality_status: 'approved',
          } as any);

          if (insertErr) {
            console.error(`Import-Fehler für ${displayName}:`, insertErr.message);
            continue;
          }
          importedCount++;
        }

        // 7. Mark result as imported
        await supabase
          .from('soat_search_results')
          .update({ validation_state: 'imported' } as any)
          .eq('id', result.id);
      }

      return { importedCount, skippedCount, updatedCount };
    },
    onSuccess: (data) => {
      const parts: string[] = [];
      if (data.importedCount > 0) parts.push(`${data.importedCount} importiert`);
      if (data.updatedCount > 0) parts.push(`${data.updatedCount} aktualisiert`);
      if (data.skippedCount > 0) parts.push(`${data.skippedCount} Duplikate übersprungen`);
      toast.success(parts.join(', ') || 'Import abgeschlossen');

      queryClient.invalidateQueries({ queryKey: ['soat-search-results'] });
      queryClient.invalidateQueries({ queryKey: ['soat-search-orders'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
