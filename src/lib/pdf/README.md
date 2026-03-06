# PDF CI-A — SoT Business Premium

## How to build a new PDF Template

### 1. Create template file

```
src/lib/pdf/templates/myTemplateV1.ts
```

### 2. Import CI-Kit primitives

```typescript
import { getJsPDF } from '@/lib/lazyJspdf';
import {
  PAGE, drawCover, drawSectionTitle, drawKpiRow, drawTable,
  drawInfoCard, drawBodyText, addFootersToAllPages, ensurePageBreak,
  EUR, PCT
} from '@/lib/pdf';
```

### 3. Build template function

```typescript
export async function generateMyReport(data: MyData): Promise<void> {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Page 1: Cover
  let y = drawCover(doc, { title: 'My Report', subtitle: data.name });

  // Page 2+: Content
  doc.addPage();
  y = drawSectionTitle(doc, PAGE.MARGIN_TOP + 8, 'Overview');
  y = drawKpiRow(doc, y, [
    { label: 'Total', value: EUR(data.total) },
    { label: 'Count', value: String(data.count) },
  ]);
  y = drawTable(doc, y, {
    headers: ['Name', 'Value'],
    rows: data.items.map(i => [i.name, EUR(i.value)]),
    colWidths: [100, 76],
    alignRight: [1],
  });

  // Footers on all pages
  addFootersToAllPages(doc, { confidential: true });

  doc.save('my-report.pdf');
}
```

### 4. Register in registry

Add entry to `src/lib/pdf/templates/registry.ts`:

```typescript
{ key: 'MY_REPORT_V1', label: 'My Report', module: 'MOD-XX', type: 'B', pageLimit: 8, status: 'active' }
```

### CI Variants

| CI | Usage | Files |
|----|-------|-------|
| **CI-A** (this) | 95% of PDFs | `pdfCiKit.ts` |
| **CI-B** | DIN 5008 Brief | `letterPdf.ts` (MOD-02) |
| **CI-C** | Juristisch/Notar | `generateLegalDocumentPdf` (MOD-01) |

### Rules

1. **No freestyle headers** — use `drawCiHeader` / `drawCover`
2. **No chart placeholders** — use table/KPI or PNG snapshot
3. **Respect page grid** — all content within `PAGE.MARGIN_*`
4. **Respect `pageLimit`** — use Appendix Light + QR if data overflows
5. **All colors from `pdfCiTokens.ts`** — no magic RGB values
