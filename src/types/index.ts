export type VehicleType = 'BEV' | 'PHEV';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  trim: string;
  type: VehicleType;
  wltpKm: number;
  pvp: number;
  brandCampaignContado: number;
  extraFinancingDiscount: number;
  caeAmount: number;
  euAssemblyDefault: boolean;
  euPlantPending: boolean;
  euBatteryDefault: boolean;
  originNote: string;
}

export type PaymentMode = 'CONTADO' | 'FINANCIADO';
export type LeonStrategy = 'VENTA_PRIVADA_Y_CAE' | 'DESGUACE_Y_CAE' | 'SIN_CAE';
export type BuyerProfile = 'YO_2026_18K' | 'YO_2027_33K' | 'PADRE_38K' | 'CUSTOM';
export type IrpfCapRule = 'ESTRICTO_ESTATAL' | 'CUOTA_TOTAL';

export interface FiscalResult {
  segSocial: number;
  rnt: number;
  reduccionArt20: number;
  blgSinAyuda: number;
  cuotaEstatalSinAyuda: number;
  cuotaCatSinAyuda: number;
  cuotaAraSinAyuda: number;
  cuotaTotalCatSinAyuda: number;
  cuotaTotalAraSinAyuda: number;
  impuestoSubvencionCat: number;
  impuestoSubvencionAra: number;
  tipoMarginalCat: number;
  tipoMarginalAra: number;
}

export interface ScenarioCalculation {
  dtoMarcaContado: number;
  dtoFinanciacion: number;
  mandatoryAutoPlusDealerDiscount: number;
  totalCommercialDiscount: number;
  precioFacturaSinCae: number;
  baseSinIva: number;
  isEligible45k: boolean;
  isUnder35k: boolean;
  excessOver35kWithIva: number;
  autoPlusElectrico: number;
  autoPlusEconomico: number;
  autoPlusMontajeUE: number;
  autoPlusBateriaUE: number;
  subvencionAutoPlusBruta: number;
  caeAplicado: number;
  precioFacturaFinal: number;
  fiscal: FiscalResult;
  baseDeduccionCoche: number;
  deduccionTeoricaCoche: number;
  deduccionTeoricaWallbox: number;
  deduccionTeoricaTotal: number;
  limiteAbsorcionCat: number;
  limiteAbsorcionAra: number;
  deduccionRealCat: number;
  deduccionRealAra: number;
  deduccionPerdidaPorSueldoBajo: number;
  subvencionNetaRealCat: number;
  subvencionNetaRealAra: number;
  valorSeatLeonEfectivo: number;
  ahorroTotalRealCat: number;
  ahorroTotalRealAra: number;
  desembolsoBolsilloCat: number;
  desembolsoBolsilloAra: number;
  ahorroAragonVsCataluna: number;
}

export type PriceFilterType = 'PVP' | 'FACTURA' | 'NETO_CAT' | 'NETO_ARA';
export type SortColumn = 'brand' | 'wltpKm' | 'pvp' | 'discount' | 'factura' | 'autoPlus' | 'netoCat' | 'netoAra';
export type SortDirection = 'asc' | 'desc';
