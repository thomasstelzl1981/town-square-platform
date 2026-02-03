import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    let totalFiles = 0;

    // Helper to merge sub-ZIP into master
    // deno-lint-ignore no-explicit-any
    const mergeSubZip = async (result: any, packageName: string): Promise<number> => {
      if (result.error || !result.data?.zipBase64) {
        console.warn(`Skipping ${packageName}: ${result.error?.message || 'no data'}`);
        return 0;
      }

      try {
        const subZip = await JSZip.loadAsync(result.data.zipBase64, { base64: true });
        const files = Object.keys(subZip.files);
        
        for (const filePath of files) {
          const file = subZip.files[filePath];
          if (!file.dir) {
            const content = await file.async('string');
            masterZip.file(filePath, content);
            console.log(`Merged: ${filePath}`);
          }
        }
        
        return files.filter((f: string) => !subZip.files[f].dir).length;
      } catch (e) {
        console.error(`Error merging ${packageName}:`, e);
        return 0;
      }
    };

    // Merge all sub-ZIPs
    totalFiles += await mergeSubZip(rfpResult, 'rfp');
    totalFiles += await mergeSubZip(specsResult, 'specs');
    totalFiles += await mergeSubZip(modulesResult, 'modules');
    totalFiles += await mergeSubZip(appendixResult, 'appendix');

    // Add master README
    const masterReadme = `# System of a Town — Dokumentationspaket

**Generiert:** ${new Date().toISOString()}  
**Dateien:** ${totalFiles}  
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

    masterZip.file('README.md', masterReadme);
    totalFiles++;

    // Add generation metadata
    const metadata = {
      generated_at: new Date().toISOString(),
      version: "2.0.0",
      architecture: "modular-4-functions",
      packages: {
        rfp: { success: !rfpResult.error, files: rfpResult.data?.files?.length || 0 },
        specs: { success: !specsResult.error, files: specsResult.data?.files?.length || 0 },
        modules: { success: !modulesResult.error, files: modulesResult.data?.files?.length || 0 },
        appendix: { success: !appendixResult.error, files: appendixResult.data?.files?.length || 0 },
      },
      total_files: totalFiles,
      warnings: errors.length > 0 ? errors : undefined,
    };

    masterZip.file('_metadata.json', JSON.stringify(metadata, null, 2));
    totalFiles++;

    // Generate final ZIP
    const zipBlob = await masterZip.generateAsync({ type: 'blob' });
    const zipArrayBuffer = await zipBlob.arrayBuffer();
    const zipUint8Array = new Uint8Array(zipArrayBuffer);

    // Upload to storage
    const filename = `sot-docs-export-${new Date().toISOString().split('T')[0]}.zip`;
    
    const { error: uploadError } = await supabase.storage
      .from('docs-export')
      .upload(filename, zipUint8Array, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload ZIP: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('docs-export')
      .getPublicUrl(filename);

    console.log(`Export complete: ${urlData.publicUrl}`);
    console.log(`Total files: ${totalFiles}`);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        url: urlData.publicUrl,
        file_count: totalFiles,
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
