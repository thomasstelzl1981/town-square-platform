/**
 * Contract Generator Utility
 * 
 * Loads agreement templates, replaces placeholders with variables,
 * and stores generated contracts as DMS documents.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ContractVariables {
  [key: string]: string | number | undefined;
}

export interface GeneratedContract {
  templateId: string;
  templateCode: string;
  templateVersion: number;
  title: string;
  content: string;
}

export interface StoredContract {
  documentId: string;
  consentId: string;
  commissionId: string;
}

/**
 * Load an agreement template by code and replace placeholders with variables.
 */
export async function generateContract(
  templateCode: string,
  variables: ContractVariables
): Promise<GeneratedContract> {
  const { data: template, error } = await supabase
    .from('agreement_templates')
    .select('*')
    .eq('code', templateCode)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !template) {
    throw new Error(`Template '${templateCode}' not found: ${error?.message}`);
  }

  let content = template.content;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    content = content.split(placeholder).join(String(value ?? ''));
  }

  return {
    templateId: template.id,
    templateCode: template.code,
    templateVersion: template.version,
    title: template.title,
    content,
  };
}

/**
 * Calculate platform fee (30% of gross commission).
 */
export function calculatePlatformFee(grossCommission: number, sharePct: number = 30): {
  platformFee: number;
  netCommission: number;
} {
  const platformFee = grossCommission * (sharePct / 100);
  const netCommission = grossCommission - platformFee;
  return { platformFee, netCommission };
}

/**
 * Store a contract for service activation (no commission).
 * Used for: Postservice, Storage upgrades, etc.
 */
export async function storeServiceContract(params: {
  tenantId: string;
  userId: string;
  contract: GeneratedContract;
  referenceId: string;
  referenceType: string;
}): Promise<{ documentId: string; consentId: string }> {
  const { tenantId, userId, contract, referenceId, referenceType } = params;

  // 1. Store contract as DMS document
  const contractBlob = new Blob([contract.content], { type: 'text/plain' });
  const fileName = `${contract.templateCode}_${referenceId}_${Date.now()}.txt`;
  const storagePath = `${tenantId}/MOD_03/contracts/${fileName}`;

  let documentId: string | undefined;
  const { error: uploadError } = await supabase.storage
    .from('tenant-documents')
    .upload(storagePath, contractBlob);

  if (!uploadError) {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        tenant_id: tenantId,
        name: `${contract.title} - ${new Date().toLocaleDateString('de-DE')}`,
        file_path: storagePath,
        mime_type: 'text/plain',
        size_bytes: contractBlob.size,
        uploaded_by: userId,
        public_id: `CONTRACT-${Date.now()}`,
        doc_type: 'contract',
        source: 'system',
        scope: 'tenant',
      })
      .select('id')
      .single();

    if (!docError && doc) {
      documentId = doc.id;
    }
  }

  // 2. Create user consent
  const { data: consent, error: consentError } = await supabase
    .from('user_consents')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      template_id: contract.templateId,
      template_version: contract.templateVersion,
      status: 'accepted' as const,
      consented_at: new Date().toISOString(),
      metadata: {
        reference_id: referenceId,
        reference_type: referenceType,
        contract_document_id: documentId,
      },
    } as any)
    .select('id')
    .single();

  if (consentError || !consent) {
    throw new Error(`Failed to create consent: ${consentError?.message}`);
  }

  return {
    documentId: documentId || '',
    consentId: consent.id,
  };
}

/**
 * Store a generated contract in the DMS and create consent + commission records.
 * Returns IDs for all created records.
 */
export async function storeContractAndCreateRecords(params: {
  tenantId: string;
  userId: string;
  contract: GeneratedContract;
  liableUserId: string;
  liableRole: string;
  grossCommission: number;
  grossCommissionPct: number;
  platformFee: number;
  referenceId: string;
  referenceType: string;
  commissionType: string;
  contactId?: string;
  pipelineId?: string;
}): Promise<StoredContract> {
  const {
    tenantId,
    userId,
    contract,
    liableUserId,
    liableRole,
    grossCommission,
    grossCommissionPct,
    platformFee,
    referenceId,
    referenceType,
    commissionType,
    contactId,
    pipelineId,
  } = params;

  // 1. Store contract as DMS document
  const contractBlob = new Blob([contract.content], { type: 'text/plain' });
  const fileName = `${contract.templateCode}_${referenceId}_${Date.now()}.txt`;
  const storagePath = `${tenantId}/MOD_03/contracts/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('tenant-documents')
    .upload(storagePath, contractBlob);

  // If bucket doesn't exist or upload fails, we still proceed (document optional)
  let documentId: string | undefined;
  if (!uploadError) {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        tenant_id: tenantId,
        name: `${contract.title} - ${new Date().toLocaleDateString('de-DE')}`,
        file_path: storagePath,
        mime_type: 'text/plain',
        size_bytes: contractBlob.size,
        uploaded_by: userId,
        public_id: `CONTRACT-${Date.now()}`,
        doc_type: 'contract',
        source: 'system',
        scope: 'tenant',
      })
      .select('id')
      .single();

    if (!docError && doc) {
      documentId = doc.id;
    }
  }

  // 2. Create user consent
  const { data: consent, error: consentError } = await supabase
    .from('user_consents')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      template_id: contract.templateId,
      template_version: contract.templateVersion,
      status: 'accepted' as const,
      consented_at: new Date().toISOString(),
      metadata: {
        reference_id: referenceId,
        reference_type: referenceType,
        contract_document_id: documentId,
      },
    } as any)
    .select('id')
    .single();

  if (consentError || !consent) {
    throw new Error(`Failed to create consent: ${consentError?.message}`);
  }

  // 3. Create commission record
  const { data: commission, error: commissionError } = await supabase
    .from('commissions')
    .insert({
      tenant_id: tenantId,
      pipeline_id: pipelineId || null,
      contact_id: contactId || null,
      agreement_consent_id: consent.id,
      amount: grossCommission,
      percentage: grossCommissionPct,
      status: 'pending',
      commission_type: commissionType,
      liable_user_id: liableUserId,
      liable_role: liableRole,
      gross_commission: grossCommission,
      platform_share_pct: 30,
      platform_fee: platformFee,
      reference_id: referenceId,
      reference_type: referenceType,
      contract_document_id: documentId || null,
    } as any)
    .select('id')
    .single();

  if (commissionError || !commission) {
    throw new Error(`Failed to create commission: ${commissionError?.message}`);
  }

  return {
    documentId: documentId || '',
    consentId: consent.id,
    commissionId: commission.id,
  };
}
