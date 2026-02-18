/**
 * Lazy-loaded jsPDF wrapper — saves ~250KB from initial bundle.
 * Usage: const jsPDF = await getJsPDF();
 */
let jspdfModule: typeof import('jspdf').default | null = null;

export async function getJsPDF() {
  if (!jspdfModule) {
    const mod = await import('jspdf');
    jspdfModule = mod.default;
  }
  return jspdfModule;
}
