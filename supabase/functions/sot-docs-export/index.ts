import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// ORCHESTRATOR: Calls 4 sub-functions in parallel and merges their ZIPs
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting modular documentation export...");
    console.log("Calling 4 sub-functions in parallel...");

    // Call all 4 sub-functions in parallel
    const [rfpResult, specsResult, modulesResult, appendixResult] = await Promise.all([
      supabase.functions.invoke('sot-docs-export-rfp'),
      supabase.functions.invoke('sot-docs-export-specs'),
      supabase.functions.invoke('sot-docs-export-modules'),
      supabase.functions.invoke('sot-docs-export-appendix'),
    ]);

    // Log results for debugging
    console.log("RFP result:", rfpResult.error ? `ERROR: ${rfpResult.error.message}` : `OK, ${rfpResult.data?.files?.length || 0} files`);
    console.log("Specs result:", specsResult.error ? `ERROR: ${specsResult.error.message}` : `OK, ${specsResult.data?.files?.length || 0} files`);
    console.log("Modules result:", modulesResult.error ? `ERROR: ${modulesResult.error.message}` : `OK, ${modulesResult.data?.files?.length || 0} files`);
    console.log("Appendix result:", appendixResult.error ? `ERROR: ${appendixResult.error.message}` : `OK, ${appendixResult.data?.files?.length || 0} files`);

    // Check for errors
    const errors: string[] = [];
    if (rfpResult.error) errors.push(`RFP: ${rfpResult.error.message}`);
    if (specsResult.error) errors.push(`Specs: ${specsResult.error.message}`);
    if (modulesResult.error) errors.push(`Modules: ${modulesResult.error.message}`);
    if (appendixResult.error) errors.push(`Appendix: ${appendixResult.error.message}`);

    if (errors.length === 4) {
      throw new Error(`All sub-functions failed: ${errors.join('; ')}`);
    }

    // Create master ZIP
    const masterZip = new JSZip();

    // Helper to merge sub-ZIP into master
    // deno-lint-ignore no-explicit-any
    const mergeSubZip = async (result: any, packageName: string): Promise<void> => {
      if (result.error || !result.data?.zipBase64) {
        console.warn(`Skipping ${packageName}: ${result.error?.message || 'no data'}`);
        return;
      }

      try {
        const subZip = await JSZip.loadAsync(result.data.zipBase64, { base64: true });
        const files = Object.keys(subZip.files);
        
        for (const filePath of files) {
          const file = subZip.files[filePath];
          if (!file.dir) {
            const content = await file.async('uint8array');
            masterZip.file(filePath, content);
            console.log(`Merged: ${filePath}`);
          }
        }
      } catch (e) {
        console.error(`Error merging ${packageName}:`, e);
        return;
      }
    };

    // Merge all sub-ZIPs
    await mergeSubZip(rfpResult, 'rfp');
    await mergeSubZip(specsResult, 'specs');
    await mergeSubZip(modulesResult, 'modules');
    await mergeSubZip(appendixResult, 'appendix');

    // Compute unique files so the UI count matches what is actually inside the ZIP
    const getUniqueFilePaths = () =>
      Object.keys(masterZip.files).filter((p) => !masterZip.files[p].dir);

    // Add master README (we'll overwrite once counts are final)
    const masterReadme = (fileCount: number) => `# System of a Town — Dokumentationspaket

**Generiert:** ${new Date().toISOString()}  
**Dateien:** ${fileCount}  
**Status:** RFP-Ready

---

## Paket-Struktur

| Ordner | Inhalt | Quelle |
|--------|--------|--------|
| \`/rfp\` | Executive Summary, Glossar, Scope | sot-docs-export-rfp |
| \`/spec\` | Frozen Specs, Platform, Module Contracts | sot-docs-export-specs |
| \`/docs/modules\` | MOD-01 bis MOD-20 Spezifikationen | sot-docs-export-modules |
| \`/appendix\` | Architecture Catalogs, Diagrams, Manifests | sot-docs-export-appendix |

## Leseempfehlung

**Für Business/Projektleitung:**
1. \`rfp/README.md\` — Executive Summary
2. \`rfp/GLOSSAR.md\` — Begriffsdefinitionen
3. \`rfp/SCOPE_AND_BOUNDARIES.md\` — Was ist in/out of scope

**Für Tech Lead/Agentur:**
1. \`spec/00_frozen/SOFTWARE_FOUNDATION.md\` — Technische Basis
2. \`spec/00_frozen/MODULE_BLUEPRINT.md\` — Modul-Architektur
3. \`docs/modules/MOD-04_IMMOBILIEN.md\` — SSOT-Modul
4. \`appendix/manifests/ROUTES_SUMMARY.md\` — Routing SSOT

---

*Generiert von System of a Town Platform*
`;

    // placeholder, will be overwritten with final count below
    masterZip.file('README.md', masterReadme(0));

    // Add generation metadata
    const metadataBase = {
      generated_at: new Date().toISOString(),
      version: "2.0.0",
      architecture: "modular-4-functions",
      packages: {
        rfp: { success: !rfpResult.error, files: rfpResult.data?.files?.length || 0 },
        specs: { success: !specsResult.error, files: specsResult.data?.files?.length || 0 },
        modules: { success: !modulesResult.error, files: modulesResult.data?.files?.length || 0 },
        appendix: { success: !appendixResult.error, files: appendixResult.data?.files?.length || 0 },
      },
      warnings: errors.length > 0 ? errors : undefined,
    };

    // placeholder, will be overwritten with final counts + file list
    masterZip.file('_metadata.json', JSON.stringify({ ...metadataBase, total_files: 0, files: [] }, null, 2));

    // Finalize counts + write accurate README + metadata
    const uniqueFilePaths = getUniqueFilePaths();
    const uniqueFileCount = uniqueFilePaths.length;
    masterZip.file('README.md', masterReadme(uniqueFileCount));

    const metadata = {
      ...metadataBase,
      total_files: uniqueFileCount,
      files: uniqueFilePaths,
    };
    masterZip.file('_metadata.json', JSON.stringify(metadata, null, 2));

    // Generate final ZIP (as bytes; avoids Blob issues/corruption in edge runtime)
    const zipBytes: Uint8Array = await masterZip.generateAsync({ type: 'uint8array' });
    console.log(`ZIP byte size: ${zipBytes.length}`);

    // Upload to storage
    // Use a unique filename per export to avoid caching issues when users download multiple times.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sot-docs-export-${stamp}.zip`;
    
    const { error: uploadError } = await supabase.storage
      .from('docs-export')
      .upload(filename, zipBytes, {
        contentType: 'application/zip',
        cacheControl: '0',
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload ZIP: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('docs-export')
      .getPublicUrl(filename);

    const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    console.log(`Export complete: ${urlData.publicUrl}`);
    console.log(`Total unique files: ${uniqueFileCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        url: cacheBustedUrl,
        public_url: urlData.publicUrl,
        file_count: uniqueFileCount,
        byte_size: zipBytes.length,
        packages: metadata.packages,
        generated_at: metadata.generated_at,
        warnings: metadata.warnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Export error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
