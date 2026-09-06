'use client';

// التقاط عنصر DOM وتصديره PDF — مع معالجة ألوان CSS الحديثة (oklch/color()) لمنع انهيار html2canvas.

function toRgb(str: string, ctx: CanvasRenderingContext2D | null): string {
  if (!str || typeof str !== 'string') return str;
  if (!str.includes('oklch') && !str.includes('color(') && !str.includes('oklab')) return str;
  if (!ctx) return str.replace(/(oklch|oklab|color)\([^)]+\)/gi, 'rgb(0, 70, 155)');
  return str.replace(/(oklch|oklab|color)\([^)]+\)/gi, (m) => {
    try {
      ctx.fillStyle = '#ffffff';
      ctx.fillStyle = m;
      return ctx.fillStyle;
    } catch {
      return 'rgb(0, 70, 155)';
    }
  });
}

export async function elementToPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, jspdfMod] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const JsPDF = (jspdfMod as any).jsPDF || (jspdfMod as any).default;

  const canvas = await html2canvas(el, {
    useCORS: true,
    allowTaint: true,
    scale: 2.5,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (doc: Document) => {
      const helper = doc.createElement('canvas');
      const ctx = helper.getContext('2d');
      const view = doc.defaultView || window;
      if (view?.getComputedStyle) {
        const orig = view.getComputedStyle.bind(view);
        view.getComputedStyle = function (e: Element, p?: string | null) {
          const cs = orig(e, p ?? undefined);
          return new Proxy(cs, {
            get(t, prop: any) {
              if (prop === 'getPropertyValue') {
                return (name: string) => toRgb(t.getPropertyValue(name), ctx);
              }
              return (t as any)[prop];
            },
          });
        } as any;
      }
    },
  });

  const img = canvas.toDataURL('image/png');
  const pdf = new JsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pw / canvas.width, ph / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(img, 'PNG', (pw - w) / 2, (ph - h) / 2, w, h);
  pdf.save(filename);
}
