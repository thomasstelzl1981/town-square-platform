/**
 * Lazy-loaded XLSX wrapper — saves ~400KB from initial bundle.
 * Usage: const XLSX = await getXlsx();
 */
let xlsxModule: typeof import('xlsx') | null = null;

export async function getXlsx() {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
}
