import { FiscalResult } from '../types';

// ============================================================================
// FUNCIONES MATEMÁTICAS DE CÁLCULO IRPF 2026 (ESTATAL, CATALUÑA Y ARAGÓN)
// ============================================================================

export function calcTramosEstatales2026(base: number): number {
  if (base <= 0) return 0;
  const brackets = [
    { limit: 12450, rate: 0.095 },
    { limit: 20200, rate: 0.12 },
    { limit: 35200, rate: 0.15 },
    { limit: 60000, rate: 0.185 },
    { limit: Infinity, rate: 0.225 }
  ];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (base > prev) {
      const taxable = Math.min(base, b.limit) - prev;
      tax += taxable * b.rate;
      prev = b.limit;
    } else break;
  }
  return tax;
}

export function calcTramosCataluna2026(base: number): number {
  if (base <= 0) return 0;
  const brackets = [
    { limit: 12500, rate: 0.105 },
    { limit: 22000, rate: 0.125 },
    { limit: 33000, rate: 0.16 },
    { limit: 53407, rate: 0.19 },
    { limit: Infinity, rate: 0.215 }
  ];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (base > prev) {
      const taxable = Math.min(base, b.limit) - prev;
      tax += taxable * b.rate;
      prev = b.limit;
    } else break;
  }
  return tax;
}

export function calcTramosAragon2026(base: number): number {
  if (base <= 0) return 0;
  const brackets = [
    { limit: 13072.5, rate: 0.095 },
    { limit: 21210, rate: 0.12 },
    { limit: 36960, rate: 0.15 },
    { limit: 52500, rate: 0.185 },
    { limit: Infinity, rate: 0.205 }
  ];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (base > prev) {
      const taxable = Math.min(base, b.limit) - prev;
      tax += taxable * b.rate;
      prev = b.limit;
    } else break;
  }
  return tax;
}

export function calcularFiscalidadCompleta(sueldoBruto: number, subvencionBruta: number): FiscalResult {
  // 1. Seguridad Social (6,50% trabajador incl. MEI 2026)
  const segSocial = sueldoBruto * 0.065;
  // 2. Rendimiento Neto del Trabajo (restando 2.000€ otros gastos Art. 19)
  const rnt = Math.max(0, sueldoBruto - segSocial - 2000);

  // 3. Reducción por obtención de rendimientos del trabajo (Art. 20 LIRPF vigente 2026)
  let reduccionArt20 = 0;
  if (rnt <= 14852) {
    reduccionArt20 = 7302;
  } else if (rnt <= 17673.52) {
    reduccionArt20 = 7302 - 1.75 * (rnt - 14852);
  } else if (rnt <= 19747.5) {
    reduccionArt20 = 2364.34 - 1.14 * (rnt - 17673.52);
  } else {
    reduccionArt20 = 0;
  }

  // 4. Base Liquidable General (Solo Sueldo)
  const blgSinAyuda = Math.max(0, rnt - reduccionArt20);

  // 5. Cuotas Íntegras sin la subvención (Mínimo personal 5.550€)
  const minEstatal = 5550 * 0.095; // 527,25€
  const minCat = 5550 * 0.105; // 582,75€
  const minAra = 5550 * 0.095; // 527,25€

  const cuotaEstatalSinAyuda = Math.max(0, calcTramosEstatales2026(blgSinAyuda) - minEstatal);
  const cuotaCatSinAyuda = Math.max(0, calcTramosCataluna2026(blgSinAyuda) - minCat);
  const cuotaAraSinAyuda = Math.max(0, calcTramosAragon2026(blgSinAyuda) - minAra);

  const cuotaTotalCatSinAyuda = cuotaEstatalSinAyuda + cuotaCatSinAyuda;
  const cuotaTotalAraSinAyuda = cuotaEstatalSinAyuda + cuotaAraSinAyuda;

  // 6. Base Liquidable General sumando la Subvención Plan Auto+ (Ganancia Patrimonial no exenta)
  const blgConAyuda = blgSinAyuda + subvencionBruta;

  const cuotaEstatalConAyuda = Math.max(0, calcTramosEstatales2026(blgConAyuda) - minEstatal);
  const cuotaCatConAyuda = Math.max(0, calcTramosCataluna2026(blgConAyuda) - minCat);
  const cuotaAraConAyuda = Math.max(0, calcTramosAragon2026(blgConAyuda) - minAra);

  const cuotaTotalCatConAyuda = cuotaEstatalConAyuda + cuotaCatConAyuda;
  const cuotaTotalAraConAyuda = cuotaEstatalConAyuda + cuotaAraConAyuda;

  // 7. Impuesto exacto que se lleva Hacienda por la Subvención Auto+ en cada CCAA
  const impuestoSubvencionCat = Math.max(0, cuotaTotalCatConAyuda - cuotaTotalCatSinAyuda);
  const impuestoSubvencionAra = Math.max(0, cuotaTotalAraConAyuda - cuotaTotalAraSinAyuda);

  const tipoMarginalCat = subvencionBruta > 0 ? (impuestoSubvencionCat / subvencionBruta) * 100 : 0;
  const tipoMarginalAra = subvencionBruta > 0 ? (impuestoSubvencionAra / subvencionBruta) * 100 : 0;

  return {
    segSocial,
    rnt,
    reduccionArt20,
    blgSinAyuda,
    cuotaEstatalSinAyuda,
    cuotaCatSinAyuda,
    cuotaAraSinAyuda,
    cuotaTotalCatSinAyuda,
    cuotaTotalAraSinAyuda,
    impuestoSubvencionCat,
    impuestoSubvencionAra,
    tipoMarginalCat,
    tipoMarginalAra
  };
}

// Formateador de moneda en Euros
export const formatEur = (val: number): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(Math.round(val));

export const formatEurExact = (val: number): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
