import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Calculator,
  Euro,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingDown,
  UserCheck,
  MapPin,
  ShieldAlert,
  Sparkles,
  Zap,
  Fuel,
  Search,
  SlidersHorizontal,
  ArrowRightLeft,
  HelpCircle,
  FileSpreadsheet,
  Award,
  Factory,
  Coins,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Filter,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table,
  ArrowUpCircle,
  ChevronRight,
  Eye,
  Sliders
} from 'lucide-react';
import { VEHICLES_DB } from './data/vehicles';
import {
  Vehicle,
  VehicleType,
  PaymentMode,
  LeonStrategy,
  BuyerProfile,
  IrpfCapRule,
  PriceFilterType,
  SortColumn,
  SortDirection
} from './types';
import {
  calcTramosEstatales2026,
  calcTramosCataluna2026,
  calcTramosAragon2026,
  calcularFiscalidadCompleta,
  formatEur,
  formatEurExact
} from './utils/taxEngine';

/**
 * Trade-offs de Arquitectura UI Responsive:
 * 1. Pestañas táctiles móviles frente a scroll vertical infinito: En pantallas < 768px condensamos las 3 columnas de 1.600px en tabs accesibles para reducir la fatiga táctil y mejorar la velocidad de interacción.
 * 2. Vista Dual en Catálogo (Mobile Cards vs Tabla Tradicional): Las tarjetas móviles ofrecen jerarquía visual táctil en pantallas estrechas sin perder la capacidad de consulta en formato hoja de cálculo tabular en pantallas grandes.
 * 3. Desglose regional "Cara a Cara": Sustituye tablas horizontales de 4 columnas en móviles por tarjetas paso a paso con comparativa lado a lado y contraste WCAG AA.
 */

export default function App() {
  // --- ESTADOS DE CONFIGURACIÓN GLOBAL ---
  const [selectedCarId, setSelectedCarId] = useState<string>('byd-dolphin-surf-boost');

  // Personalización de oferta comercial del concesionario
  const [customDiscountDelta, setCustomDiscountDelta] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CONTADO');

  // Opciones Plan Auto+ UE
  const [simulatePendingEuPlant, setSimulatePendingEuPlant] = useState<boolean>(false);

  // Gestión de vehículo antiguo y CAE (Ficha TRA050.P)
  const [leonStrategy, setLeonStrategy] = useState<LeonStrategy>('VENTA_PRIVADA_Y_CAE');
  const [leonSalePrice, setLeonSalePrice] = useState<number>(3500);

  // Gestión de Sueldo Bruto Anual y Titular de la Compra (IRPF)
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile>('YO_2026_18K');
  const [sueldoBruto, setSueldoBruto] = useState<number>(18000);
  const [irpfCapRule, setIrpfCapRule] = useState<IrpfCapRule>('ESTRICTO_ESTATAL');
  const [includeWallboxIrpf, setIncludeWallboxIrpf] = useState<boolean>(false);
  const [wallboxCost, setWallboxCost] = useState<number>(1400);

  // --- ESTADOS DE ADAPTACIÓN MÓVIL Y RESPONSIVE ---
  const [activeMobileConfigTab, setActiveMobileConfigTab] = useState<'car' | 'tax' | 'tradein'>('car');
  const [regionalBreakdownView, setRegionalBreakdownView] = useState<'cards' | 'table'>('cards');
  const [catalogViewMode, setCatalogViewMode] = useState<'cards' | 'table'>('cards');
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // --- ESTADOS DE FILTROS PARA EL CATÁLOGO MAESTRO ---
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [tableBrandFilter, setTableBrandFilter] = useState<string>('ALL');
  const [tableTypeFilter, setTableTypeFilter] = useState<string>('ALL');
  const [tablePriceTarget, setTablePriceTarget] = useState<PriceFilterType>('NETO_ARA');
  const [tablePricePreset, setTablePricePreset] = useState<string>('ALL');
  const [tableMinPrice, setTableMinPrice] = useState<number | ''>('');
  const [tableMaxPrice, setTableMaxPrice] = useState<number | ''>('');
  const [tableMinWltp, setTableMinWltp] = useState<number>(0);
  const [tableAutoPlusOnly, setTableAutoPlusOnly] = useState<boolean>(false);
  const [tableEuOnly, setTableEuOnly] = useState<boolean>(false);

  // Ordenación del catálogo
  const [sortColumn, setSortColumn] = useState<SortColumn>('netoAra');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Feedback de copiar enlace / compartir
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Detección inicial de ancho de pantalla para vistas por defecto óptimas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768) {
        setCatalogViewMode('table');
        setRegionalBreakdownView('table');
      } else {
        setCatalogViewMode('cards');
        setRegionalBreakdownView('cards');
      }
    }
  }, []);

  // Listener para el botón flotante (FAB) al hacer scroll hacia abajo
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 380) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Selector de perfil rápido de sueldo
  const handleSelectProfile = (profile: BuyerProfile) => {
    setBuyerProfile(profile);
    if (profile === 'YO_2026_18K') setSueldoBruto(18000);
    if (profile === 'YO_2027_33K') setSueldoBruto(33000);
    if (profile === 'PADRE_34K') setSueldoBruto(34000);
  };

  const handleSalaryChange = (val: number | string) => {
    setBuyerProfile('CUSTOM');
    setSueldoBruto(Number(val));
  };

  // Vehículo seleccionado actualmente para el desglose detallado
  const selectedCar = useMemo(
    () => VEHICLES_DB.find((c) => c.id === selectedCarId) || VEHICLES_DB[0],
    [selectedCarId]
  );

  // ============================================================================
  // MOTOR DE CÁLCULO INTEGRAL PARA CUALQUIER VEHÍCULO
  // ============================================================================
  const calculateVehicleScenario = (car: Vehicle, isSelectedCar = false) => {
    const extraNegociado = isSelectedCar ? customDiscountDelta : 0;

    // 1. Comprobación preliminar de elegibilidad por precio
    const dtoMarcaContado = car.brandCampaignContado + extraNegociado;
    const dtoFinanciacion = paymentMode === 'FINANCIADO' ? car.extraFinancingDiscount : 0;

    // Precio asumiendo los 1.000€ obligatorios del concesionario del Plan Auto+
    const tentativeInvoiceWithAutoPlus = car.pvp - dtoMarcaContado - 1000 - dtoFinanciacion;
    const tentativeBaseSinIva = tentativeInvoiceWithAutoPlus / 1.21;

    // El Plan Auto+ (RD 609/2026) y la DA 58ª LIRPF exigen base sin IVA <= 45.000€
    const isEligible45k = tentativeBaseSinIva <= 45000;

    // Descuento obligatorio de 1.000€ Auto+ solo si es elegible
    const mandatoryAutoPlusDealerDiscount = isEligible45k ? 1000 : 0;
    const totalCommercialDiscount = dtoMarcaContado + mandatoryAutoPlusDealerDiscount + dtoFinanciacion;

    const precioFacturaSinCae = Math.max(0, car.pvp - totalCommercialDiscount);
    const baseSinIva = precioFacturaSinCae / 1.21;

    // Umbral de 35.000€ sin IVA (42.350€ con IVA)
    const isUnder35k = baseSinIva <= 35000;
    const excessOver35kWithIva = baseSinIva > 35000 ? precioFacturaSinCae - 42350 : 0;

    // 2. Subvención Bruta Plan Auto+ (Máx 4.500€)
    let autoPlusElectrico = 0;
    let autoPlusEconomico = 0;
    let autoPlusMontajeUE = 0;
    let autoPlusBateriaUE = 0;

    if (isEligible45k) {
      // Criterio 1: Eléctrico (BEV 50% = 2.250€ | PHEV 25% = 1.125€)
      autoPlusElectrico = car.type === 'BEV' ? 2250 : 1125;
      // Criterio 2: Económico (<=35k s/IVA: 25% = 1.125€ | 35k-45k s/IVA: 15% = 675€)
      autoPlusEconomico = isUnder35k ? 1125 : 675;
      // Criterio 3: Europeo (Montaje UE 15% = 675€ | Batería UE 10% = 450€)
      const hasEuAssembly = car.euAssemblyDefault || (car.euPlantPending && simulatePendingEuPlant);
      const hasEuBattery = car.euBatteryDefault;
      autoPlusMontajeUE = hasEuAssembly ? 675 : 0;
      autoPlusBateriaUE = hasEuBattery ? 450 : 0;
    }

    const subvencionAutoPlusBruta =
      autoPlusElectrico + autoPlusEconomico + autoPlusMontajeUE + autoPlusBateriaUE;

    // 3. Certificado de Ahorro Energético (CAE - Ficha TRA050.P V 2.0)
    const caeAplicado = leonStrategy !== 'SIN_CAE' ? car.caeAmount : 0;

    // 4. Precio Final en Factura (Desembolso en Concesionario)
    const precioFacturaFinal = Math.max(0, precioFacturaSinCae - caeAplicado);

    // 5. Cálculo de Deducción del 15% en IRPF (DA 58ª LIRPF) y Tributación de la Ayuda
    const fiscal = calcularFiscalidadCompleta(sueldoBruto, subvencionAutoPlusBruta);

    // Base de deducción del 15% IRPF (máximo 20.000€, restando subvenciones públicas)
    const baseDeduccionCoche = isEligible45k
      ? Math.min(20000, Math.max(0, precioFacturaFinal - subvencionAutoPlusBruta))
      : 0;
    const deduccionTeoricaCoche = baseDeduccionCoche * 0.15; // Máx 3.000€

    const deduccionTeoricaWallbox = includeWallboxIrpf ? Math.min(4000, wallboxCost) * 0.15 : 0;
    const deduccionTeoricaTotal = deduccionTeoricaCoche + deduccionTeoricaWallbox;

    // Cuota límite de absorción según el sueldo bruto del comprador
    const limiteAbsorcionCat =
      irpfCapRule === 'ESTRICTO_ESTATAL'
        ? fiscal.cuotaEstatalSinAyuda
        : fiscal.cuotaTotalCatSinAyuda;
    const limiteAbsorcionAra =
      irpfCapRule === 'ESTRICTO_ESTATAL'
        ? fiscal.cuotaEstatalSinAyuda
        : fiscal.cuotaTotalAraSinAyuda;

    const deduccionRealCat = Math.min(deduccionTeoricaTotal, limiteAbsorcionCat);
    const deduccionRealAra = Math.min(deduccionTeoricaTotal, limiteAbsorcionAra);
    const deduccionPerdidaPorSueldoBajo = Math.max(0, deduccionTeoricaTotal - deduccionRealCat);

    // 6. Subvención Neta Plan Auto+ (tras descontar IRPF)
    const subvencionNetaCat = subvencionAutoPlusBruta - fiscal.impuestoSubvencionCat;
    const subvencionNetaAra = subvencionAutoPlusBruta - fiscal.impuestoSubvencionAra;

    // 7. Coste Real Neto del Vehículo (Sin contar venta privada de coche antiguo)
    const costeNetoSinLeonCat = precioFacturaFinal - subvencionNetaCat - deduccionRealCat;
    const costeNetoSinLeonAra = precioFacturaFinal - subvencionNetaAra - deduccionRealAra;

    // 8. Liquidez por venta de vehículo antiguo
    const ingresoVentaLeon = leonStrategy === 'VENTA_PRIVADA_Y_CAE' ? leonSalePrice : 0;

    // 9. Desembolso Neto de Bolsillo Final
    const desembolsoBolsilloCat = costeNetoSinLeonCat - ingresoVentaLeon;
    const desembolsoBolsilloAra = costeNetoSinLeonAra - ingresoVentaLeon;

    // Diferencia entre Aragón y Cataluña
    const ahorroAragonVsCataluna = desembolsoBolsilloCat - desembolsoBolsilloAra;

    return {
      car,
      isEligible45k,
      isUnder35k,
      excessOver35kWithIva,
      dtoMarcaContado,
      mandatoryAutoPlusDealerDiscount,
      dtoFinanciacion,
      totalCommercialDiscount,
      precioFacturaSinCae,
      baseSinIva,
      caeAplicado,
      precioFacturaFinal,
      autoPlusElectrico,
      autoPlusEconomico,
      autoPlusMontajeUE,
      autoPlusBateriaUE,
      subvencionAutoPlusBruta,
      fiscal,
      baseDeduccionCoche,
      deduccionTeoricaCoche,
      deduccionTeoricaWallbox,
      deduccionTeoricaTotal,
      deduccionRealCat,
      deduccionRealAra,
      deduccionPerdidaPorSueldoBajo,
      subvencionNetaCat,
      subvencionNetaAra,
      costeNetoSinLeonCat,
      costeNetoSinLeonAra,
      ingresoVentaLeon,
      desembolsoBolsilloCat,
      desembolsoBolsilloAra,
      ahorroAragonVsCataluna
    };
  };

  // Cálculo del coche activo actualmente
  const currentCalc = useMemo(
    () => calculateVehicleScenario(selectedCar, true),
    [
      selectedCar,
      customDiscountDelta,
      paymentMode,
      simulatePendingEuPlant,
      leonStrategy,
      leonSalePrice,
      sueldoBruto,
      irpfCapRule,
      includeWallboxIrpf,
      wallboxCost
    ]
  );

  // Comparativa rápida del mismo coche entre Sueldo <20k vs Sueldo Padre / 33k
  const comparison18k = useMemo(() => {
    const f18 = calcularFiscalidadCompleta(18000, currentCalc.subvencionAutoPlusBruta);
    const dedReal18 = Math.min(currentCalc.deduccionTeoricaTotal, f18.cuotaEstatalSinAyuda);
    return {
      cuotaEstatal: f18.cuotaEstatalSinAyuda,
      dedReal: dedReal18,
      impuestoAyudaCat: f18.impuestoSubvencionCat,
      impuestoAyudaAra: f18.impuestoSubvencionAra
    };
  }, [currentCalc]);

  const comparison34k = useMemo(() => {
    const f34 = calcularFiscalidadCompleta(34000, currentCalc.subvencionAutoPlusBruta);
    const dedReal34 = Math.min(currentCalc.deduccionTeoricaTotal, f34.cuotaEstatalSinAyuda);
    return {
      cuotaEstatal: f34.cuotaEstatalSinAyuda,
      dedReal: dedReal34,
      impuestoAyudaCat: f34.impuestoSubvencionCat,
      impuestoAyudaAra: f34.impuestoSubvencionAra
    };
  }, [currentCalc]);

  // Lista de marcas únicas en la base de datos
  const availableBrands = useMemo(() => {
    const brandsSet = new Set(VEHICLES_DB.map((v) => v.brand));
    return Array.from(brandsSet);
  }, []);

  // Manejador de presets de precio
  const handlePricePreset = (preset: string) => {
    setTablePricePreset(preset);
    if (preset === 'ALL') {
      setTableMinPrice('');
      setTableMaxPrice('');
    } else if (preset === 'UNDER_20K') {
      setTableMinPrice(0);
      setTableMaxPrice(20000);
    } else if (preset === '20K_30K') {
      setTableMinPrice(20000);
      setTableMaxPrice(30000);
    } else if (preset === '30K_40K') {
      setTableMinPrice(30000);
      setTableMaxPrice(40000);
    } else if (preset === '40K_50K') {
      setTableMinPrice(40000);
      setTableMaxPrice(50000);
    } else if (preset === 'OVER_50K') {
      setTableMinPrice(50000);
      setTableMaxPrice('');
    }
  };

  // Restablecer todos los filtros del catálogo
  const resetTableFilters = () => {
    setTableSearchQuery('');
    setTableBrandFilter('ALL');
    setTableTypeFilter('ALL');
    setTablePriceTarget('NETO_ARA');
    setTablePricePreset('ALL');
    setTableMinPrice('');
    setTableMaxPrice('');
    setTableMinWltp(0);
    setTableAutoPlusOnly(false);
    setTableEuOnly(false);
  };

  // Conteo de filtros activos para el badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (tableBrandFilter !== 'ALL') count++;
    if (tableTypeFilter !== 'ALL') count++;
    if (tablePricePreset !== 'ALL' || tableMinPrice !== '' || tableMaxPrice !== '') count++;
    if (tableMinWltp > 0) count++;
    if (tableAutoPlusOnly) count++;
    if (tableEuOnly) count++;
    return count;
  }, [
    tableBrandFilter,
    tableTypeFilter,
    tablePricePreset,
    tableMinPrice,
    tableMaxPrice,
    tableMinWltp,
    tableAutoPlusOnly,
    tableEuOnly
  ]);

  const hasActiveFilters = useMemo(() => {
    return (
      tableSearchQuery.trim() !== '' ||
      activeFilterCount > 0
    );
  }, [tableSearchQuery, activeFilterCount]);

  // Manejo de ordenación por columna
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // ============================================================================
  // FILTRADO Y ORDENACIÓN DE LOS MODELOS PARA EL CATÁLOGO MAESTRO
  // ============================================================================
  const processedModels = useMemo(() => {
    // 1. Calcular escenario para cada modelo con la configuración actual
    const withCalcs = VEHICLES_DB.map((car) => {
      const calc = calculateVehicleScenario(car, car.id === selectedCarId);
      return { car, calc };
    });

    // 2. Filtrar
    const filtered = withCalcs.filter(({ car, calc }) => {
      // Filtro de Marca
      if (tableBrandFilter !== 'ALL') {
        if (tableBrandFilter === 'OTRAS') {
          if (['BYD', 'Tesla'].includes(car.brand)) return false;
        } else if (car.brand !== tableBrandFilter) {
          return false;
        }
      }

      // Filtro de Tipo (BEV / PHEV)
      if (tableTypeFilter !== 'ALL' && car.type !== tableTypeFilter) {
        return false;
      }

      // Filtro de Búsqueda de texto
      if (tableSearchQuery.trim() !== '') {
        const query = tableSearchQuery.toLowerCase();
        const fullText = `${car.brand} ${car.model} ${car.trim}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      // Filtro de Autonomía WLTP mínima
      if (tableMinWltp > 0 && car.wltpKm < tableMinWltp) {
        return false;
      }

      // Filtro de Plan Auto+ (base sin IVA <= 45.000€)
      if (tableAutoPlusOnly && !calc.isEligible45k) {
        return false;
      }

      // Filtro de Fabricación en la UE
      if (tableEuOnly && !(car.euAssemblyDefault || car.euPlantPending)) {
        return false;
      }

      // Filtro por Rango de Precios
      let targetPrice = calc.desembolsoBolsilloAra;
      if (tablePriceTarget === 'PVP') targetPrice = car.pvp;
      if (tablePriceTarget === 'FACTURA') targetPrice = calc.precioFacturaFinal;
      if (tablePriceTarget === 'NETO_CAT') targetPrice = calc.desembolsoBolsilloCat;
      if (tablePriceTarget === 'NETO_ARA') targetPrice = calc.desembolsoBolsilloAra;

      if (tableMinPrice !== '' && targetPrice < Number(tableMinPrice)) {
        return false;
      }
      if (tableMaxPrice !== '' && targetPrice > Number(tableMaxPrice)) {
        return false;
      }

      return true;
    });

    // 3. Ordenar
    filtered.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortColumn) {
        case 'brand':
          valA = `${a.car.brand} ${a.car.model}`;
          valB = `${b.car.brand} ${b.car.model}`;
          break;
        case 'wltpKm':
          valA = a.car.wltpKm;
          valB = b.car.wltpKm;
          break;
        case 'pvp':
          valA = a.car.pvp;
          valB = b.car.pvp;
          break;
        case 'discount':
          valA = a.calc.totalCommercialDiscount;
          valB = b.calc.totalCommercialDiscount;
          break;
        case 'factura':
          valA = a.calc.precioFacturaFinal;
          valB = b.calc.precioFacturaFinal;
          break;
        case 'autoPlus':
          valA = a.calc.subvencionAutoPlusBruta;
          valB = b.calc.subvencionAutoPlusBruta;
          break;
        case 'netoCat':
          valA = a.calc.desembolsoBolsilloCat;
          valB = b.calc.desembolsoBolsilloCat;
          break;
        case 'netoAra':
        default:
          valA = a.calc.desembolsoBolsilloAra;
          valB = b.calc.desembolsoBolsilloAra;
          break;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return filtered;
  }, [
    tableBrandFilter,
    tableTypeFilter,
    tableSearchQuery,
    tableMinWltp,
    tableAutoPlusOnly,
    tableEuOnly,
    tablePriceTarget,
    tableMinPrice,
    tableMaxPrice,
    sortColumn,
    sortDirection,
    selectedCarId,
    customDiscountDelta,
    paymentMode,
    simulatePendingEuPlant,
    leonStrategy,
    leonSalePrice,
    sueldoBruto,
    irpfCapRule,
    includeWallboxIrpf,
    wallboxCost
  ]);

  const handleShareApp = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleSelectCar = (carId: string) => {
    setSelectedCarId(carId);
    setCustomDiscountDelta(0);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('tabla-comparativa');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-safe selection:bg-emerald-500 selection:text-slate-950">
      {/* =====================================================================
          CABECERA DUAL: COMPACTA EN MÓVIL (≤58px) Y COMPLETA EN ESCRITORIO
         ===================================================================== */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/95 border-b border-slate-800 shadow-md">
        {/* Vista Móvil (<768px): Header compacto de 56px de alto */}
        <div className="flex md:hidden items-center justify-between h-14 px-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                <span>Eléctricos 2026</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                  Auto+
                </span>
              </h1>
              <div className="text-[11px] text-emerald-400 font-semibold truncate">
                {selectedCar.brand} {selectedCar.model}
              </div>
            </div>
          </div>

          {/* Mini-KPI táctil y botón de compartir accesible (min 44x44px) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={scrollToTop}
              title="Ver análisis de este coche"
              className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-right min-h-[40px] flex flex-col justify-center"
            >
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Neto Mín.</span>
              <span className="text-xs font-extrabold text-white leading-tight">
                {formatEur(Math.min(currentCalc.desembolsoBolsilloCat, currentCalc.desembolsoBolsilloAra))}
              </span>
            </button>

            <button
              onClick={handleShareApp}
              title="Copiar enlace"
              aria-label="Compartir comparativa"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 flex items-center justify-center transition"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Vista Escritorio (≥768px): Header completo y espacioso */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
              <Calculator className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Calculadora de Vehículos Eléctricos 2026
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Plan Auto+ & IRPF (RD 609/2026)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Coste real neto en España · 53 Modelos oficiales (BYD, Tesla, MG...) · Comparativa Cataluña vs Aragón
              </p>
            </div>
          </div>

          {/* Resumen rápido y botón compartir */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between md:justify-end">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Modelo activo en análisis</div>
                <div className="text-sm font-bold text-emerald-400 truncate max-w-[190px]">
                  {selectedCar.brand} {selectedCar.model}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Neto Final Bolsillo</div>
                <div className="text-base font-extrabold text-white">
                  {formatEur(Math.min(currentCalc.desembolsoBolsilloCat, currentCalc.desembolsoBolsilloAra))}
                </div>
              </div>
            </div>

            <button
              onClick={handleShareApp}
              title="Copiar enlace para enviar a familiares o amigos"
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition shadow-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-300" />
                  <span>Compartir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        {/* =====================================================================
            BLOQUE 1: CONFIGURACIÓN EN 3 PESTAÑAS (MÓVIL) O 3 COLUMNAS (DESKTOP)
           ===================================================================== */}
        <section className="space-y-3">
          {/* Conmutador táctil segmentado de pestañas para móvil (<768px) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl md:hidden">
            <button
              type="button"
              onClick={() => setActiveMobileConfigTab('car')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition min-h-[44px] ${
                activeMobileConfigTab === 'car'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span className="truncate">1. Coche</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileConfigTab('tax')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition min-h-[44px] ${
                activeMobileConfigTab === 'tax'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">2. IRPF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMobileConfigTab('tradein')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition min-h-[44px] ${
                activeMobileConfigTab === 'tradein'
                  ? 'bg-cyan-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span className="truncate">3. CAE</span>
            </button>
          </div>

          {/* Rejilla de 3 bloques: en móvil condicional por pestaña, en desktop 12 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* -----------------------------------------------------------------
                COLUMNA 1: SELECCIÓN DE VEHÍCULO (5 cols)
               ----------------------------------------------------------------- */}
            <div
              className={`lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between ${
                activeMobileConfigTab === 'car' ? 'block' : 'hidden md:flex'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-bold text-sm sm:text-base text-white">
                      1. Selección de Coche ({VEHICLES_DB.length} Modelos)
                    </h2>
                  </div>
                  <button
                    onClick={scrollToCatalog}
                    className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    Ver Catálogo ↓
                  </button>
                </div>

                {/* Selector de marca con scroll horizontal táctil */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Filtrar por marca rápida:
                  </label>
                  <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1 -mx-1 px-1">
                    {[
                      { id: 'ALL', label: 'Todos' },
                      { id: 'BYD', label: 'BYD' },
                      { id: 'Tesla', label: 'Tesla' },
                      { id: 'MG', label: 'MG' },
                      { id: 'Leapmotor', label: 'Leapmotor' },
                      { id: 'Geely', label: 'Geely' },
                      { id: 'Omoda', label: 'Omoda' }
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          const firstMatch = VEHICLES_DB.find((v) =>
                            b.id === 'ALL' ? true : v.brand === b.id
                          );
                          if (firstMatch) {
                            setSelectedCarId(firstMatch.id);
                            setCustomDiscountDelta(0);
                          }
                        }}
                        className={`px-3 py-1.5 min-h-[40px] rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          selectedCar.brand === b.id || (b.id === 'ALL' && selectedCar.brand === 'BYD')
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desplegable de modelo y acabado con altura táctil accesible */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Elige el modelo y acabado a simular:
                  </label>
                  <select
                    value={selectedCarId}
                    onChange={(e) => {
                      setSelectedCarId(e.target.value);
                      setCustomDiscountDelta(0);
                    }}
                    className="w-full min-h-[44px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {['BYD', 'Tesla', 'MG', 'Leapmotor', 'Geely', 'Omoda'].map((brandName) => {
                      const groupCars = VEHICLES_DB.filter((v) => v.brand === brandName);
                      if (groupCars.length === 0) return null;
                      return (
                        <optgroup key={brandName} label={`=== ${brandName.toUpperCase()} ===`}>
                          {groupCars.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.brand} {c.model} {c.trim} — PVP: {formatEur(c.pvp)} ({c.type})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* Ficha técnica resumida del coche elegido */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedCar.type === 'BEV'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {selectedCar.type === 'BEV' ? (
                        <>
                          <Zap className="w-3.5 h-3.5" /> 100% Eléctrico (BEV)
                        </>
                      ) : (
                        <>
                          <Fuel className="w-3.5 h-3.5" /> Híbrido Enchufable (PHEV)
                        </>
                      )}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Autonomía EV: <strong className="text-slate-200">{selectedCar.wltpKm} km WLTP</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">PVP Oficial Tarifa:</span>
                      <span className="text-sm font-bold text-white">{formatEur(selectedCar.pvp)}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Base Factura Sin IVA:</span>
                      <span
                        className={`text-sm font-bold ${
                          !currentCalc.isEligible45k
                            ? 'text-rose-400'
                            : currentCalc.isUnder35k
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {formatEur(currentCalc.baseSinIva)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-1">
                    <Factory className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedCar.originNote}</span>
                  </div>

                  {/* Alerta especial si supera 45.000€ sin IVA */}
                  {!currentCalc.isEligible45k && (
                    <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Supera el tope de 45.000 € sin IVA (54.450 € con IVA):</strong> Queda excluido del Plan Auto+ (0 €) y de la deducción del 15% del IRPF (0 €).
                      </div>
                    </div>
                  )}

                  {/* Alerta de oportunidad en coches rozando 35.000€ s/IVA */}
                  {currentCalc.isEligible45k &&
                    !currentCalc.isUnder35k &&
                    currentCalc.excessOver35kWithIva <= 2500 && (
                      <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>¡Consejo de Concesionario!</strong> La factura supera el escalón de 35.000 € s/IVA por solo{' '}
                          <strong>{formatEurExact(currentCalc.excessOver35kWithIva)}</strong>. Si negocias ese descuento extra, tu ayuda Plan Auto+ sube en <strong>+450 €</strong>.
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Ajustes de Pago y Descuento Extra */}
              <div className="pt-4 mt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-300">Modalidad de Pago:</span>
                  <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('CONTADO')}
                      className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition ${
                        paymentMode === 'CONTADO'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Al Contado
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('FINANCIADO')}
                      className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition ${
                        paymentMode === 'FINANCIADO'
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Financiado (-{formatEur(selectedCar.extraFinancingDiscount)})
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Descuento extra negociado:</span>
                    <span className="font-bold text-emerald-400">
                      {customDiscountDelta >= 0 ? `+${formatEur(customDiscountDelta)}` : formatEur(customDiscountDelta)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1000"
                    max="3500"
                    step="50"
                    value={customDiscountDelta}
                    onChange={(e) => setCustomDiscountDelta(Number(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Toggle de Planta Europea en trámite */}
                {selectedCar.euPlantPending && (
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={simulatePendingEuPlant}
                      onChange={(e) => setSimulatePendingEuPlant(e.target.checked)}
                      className="rounded accent-emerald-500 w-5 h-5"
                    />
                    <span className="text-xs text-indigo-200">
                      Simular inclusión en <strong>Lista Blanca UE (+675 € Auto+)</strong> por ensamblaje europeo
                    </span>
                  </label>
                )}

                {/* Botón táctil para pasar a la siguiente pestaña en móvil */}
                <div className="pt-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveMobileConfigTab('tax')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition"
                  >
                    <span>Paso 2: Ajustar Sueldo e IRPF</span>
                    <ChevronRight className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* -----------------------------------------------------------------
                COLUMNA 2: SUELDO BRUTO ANUAL Y ESTRATEGIA IRPF (4 cols)
               ----------------------------------------------------------------- */}
            <div
              className={`lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between ${
                activeMobileConfigTab === 'tax' ? 'block' : 'hidden md:flex'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    <h2 className="font-bold text-sm sm:text-base text-white">2. Sueldo Bruto y Deducción IRPF</h2>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    Hasta 3.000 € IRPF
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  La deducción del 15% (hasta 3.000 €) solo se cobra si tu <strong>Cuota Íntegra Estatal</strong> en la Renta es suficientemente alta. Si ganas menos de 20.000 €, pierdes parte de la ayuda a menos que el coche se ponga a nombre de quien tenga mayores ingresos:
                </p>

                {/* 3 Botones de Escenario de Sueldo */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectProfile('YO_2026_18K')}
                    className={`w-full text-left p-3 min-h-[50px] rounded-xl border transition-all flex items-center justify-between ${
                      buyerProfile === 'YO_2026_18K'
                        ? 'bg-rose-500/15 border-rose-500 text-white shadow-lg shadow-rose-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">Sueldo Inicial / Parcial (18.000 €)</div>
                      <div className="text-[11px] text-slate-400">
                        Pierdes gran parte de los 3.000 € por falta de cuota fiscal
                      </div>
                    </div>
                    <span className="text-xs font-extrabold px-2 py-1 rounded bg-rose-500/20 text-rose-300 shrink-0 ml-2">
                      18.000 €
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectProfile('YO_2027_33K')}
                    className={`w-full text-left p-3 min-h-[50px] rounded-xl border transition-all flex items-center justify-between ${
                      buyerProfile === 'YO_2027_33K'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">Sueldo Medio España (33.000 €)</div>
                      <div className="text-[11px] text-slate-400">
                        Absorbe casi el 100% de la deducción estatal en Renta
                      </div>
                    </div>
                    <span className="text-xs font-extrabold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 shrink-0 ml-2">
                      33.000 €
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectProfile('PADRE_34K')}
                    className={`w-full text-left p-3 min-h-[50px] rounded-xl border transition-all flex items-center justify-between ${
                      buyerProfile === 'PADRE_34K'
                        ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">Sueldo Consolidado / Familiar (≥34.000 €)</div>
                      <div className="text-[11px] text-slate-400">
                        Recupera el 100% de los 3.000 € de IRPF al milímetro
                      </div>
                    </div>
                    <span className="text-xs font-extrabold px-2 py-1 rounded bg-indigo-500/30 text-indigo-200 shrink-0 ml-2">
                      34.000 €
                    </span>
                  </button>
                </div>

                {/* Slider de Sueldo Bruto Anual Exacto con Thumb táctil de 26px */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Sueldo Bruto Anual Exacto:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10000"
                        max="100000"
                        step="500"
                        value={sueldoBruto}
                        onChange={(e) => handleSalaryChange(e.target.value)}
                        className="w-24 min-h-[38px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs sm:text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-xs text-slate-400">€/año</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="12000"
                    max="65000"
                    step="500"
                    value={sueldoBruto}
                    onChange={(e) => handleSalaryChange(e.target.value)}
                    className="w-full cursor-pointer accent-amber-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>12.000 €</span>
                    <span>20.000 €</span>
                    <span>33.000 €</span>
                    <span>45.000 €</span>
                    <span>65.000 €</span>
                  </div>
                </div>
              </div>

              {/* Desglose de absorción fiscal */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Criterio límite deducción:</span>
                  <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                    <button
                      type="button"
                      onClick={() => setIrpfCapRule('ESTRICTO_ESTATAL')}
                      className={`px-2 py-2 min-h-[36px] rounded-lg text-[11px] font-semibold transition text-center ${
                        irpfCapRule === 'ESTRICTO_ESTATAL'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Solo Cuota Estatal
                    </button>
                    <button
                      type="button"
                      onClick={() => setIrpfCapRule('CUOTA_TOTAL')}
                      className={`px-2 py-2 min-h-[36px] rounded-lg text-[11px] font-semibold transition text-center ${
                        irpfCapRule === 'CUOTA_TOTAL'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cuota Total (Estatal+Auto)
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cuota Íntegra Estatal generada:</span>
                    <span className="font-bold text-slate-200">
                      {formatEurExact(currentCalc.fiscal.cuotaEstatalSinAyuda)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deducción 15% Teórica (máx 3.000 €):</span>
                    <span className="font-bold text-slate-200">
                      {formatEurExact(currentCalc.deduccionTeoricaTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="font-semibold text-emerald-400">Deducción Real que te devolverán:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      {formatEurExact(currentCalc.deduccionRealCat)}
                    </span>
                  </div>
                  {currentCalc.deduccionPerdidaPorSueldoBajo > 0 && (
                    <div className="flex justify-between text-rose-400 font-semibold pt-0.5">
                      <span>Dinero IRPF no devuelto por falta de cuota:</span>
                      <span>-{formatEurExact(currentCalc.deduccionPerdidaPorSueldoBajo)}</span>
                    </div>
                  )}
                </div>

                {/* Botón táctil para pasar a la siguiente pestaña en móvil */}
                <div className="pt-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveMobileConfigTab('tradein')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition"
                  >
                    <span>Paso 3: Coche Antiguo y CAE</span>
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* -----------------------------------------------------------------
                COLUMNA 3: VEHÍCULO ANTIGUO, CAE Y WALLBOX (3 cols)
               ----------------------------------------------------------------- */}
            <div
              className={`lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between ${
                activeMobileConfigTab === 'tradein' ? 'block' : 'hidden md:flex'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-cyan-400" />
                    <h2 className="font-bold text-sm sm:text-base text-white">3. Coche Antiguo & CAE (950 €)</h2>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-100 space-y-1">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0" /> Bonificación CAE (950 €)
                  </div>
                  <p className="text-cyan-200/90 leading-relaxed">
                    El Certificado CAE aporta 950 € de descuento directo en factura al sustituir tu vehículo antiguo de combustión.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    ¿Qué harás con tu coche de combustión?
                  </label>
                  {[
                    {
                      id: 'VENTA_PRIVADA_Y_CAE',
                      title: 'Vender Coche a Particular + CAE',
                      desc: 'Cobras 950 € CAE en factura + el dinero de la venta particular'
                    },
                    {
                      id: 'DESGUACE_Y_CAE',
                      title: 'Entregar al desguace o no vender',
                      desc: 'Cobras 950 € CAE en factura (sin ingreso por venta privada)'
                    },
                    {
                      id: 'SIN_CAE',
                      title: 'Sin Coche Antiguo / Sin CAE',
                      desc: 'Sin descuento de 950 € CAE ni vehículo a sustituir'
                    }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLeonStrategy(opt.id as LeonStrategy)}
                      className={`w-full text-left p-3 min-h-[50px] rounded-xl border transition-all ${
                        leonStrategy === opt.id
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-100">{opt.title}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {leonStrategy === 'VENTA_PRIVADA_Y_CAE' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Precio estimado venta coche antiguo:</span>
                      <span className="font-bold text-cyan-400">{formatEur(leonSalePrice)}</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="8000"
                      step="100"
                      value={leonSalePrice}
                      onChange={(e) => setLeonSalePrice(Number(e.target.value))}
                      className="w-full cursor-pointer accent-cyan-slider"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>1.000 €</span>
                      <span>3.500 € (Media)</span>
                      <span>8.000 €</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Opción de Cargador Wallbox */}
              <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer min-h-[40px]">
                  <input
                    type="checkbox"
                    checked={includeWallboxIrpf}
                    onChange={(e) => setIncludeWallboxIrpf(e.target.checked)}
                    className="rounded accent-emerald-500 w-5 h-5"
                  />
                  <span className="text-xs font-medium text-slate-300">
                    Añadir deducción 15% Cargador Wallbox
                  </span>
                </label>
                {includeWallboxIrpf && (
                  <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Coste de instalación (máx 4k):</span>
                    <span className="font-bold text-emerald-400">
                      {formatEur(wallboxCost)} (-{formatEur(wallboxCost * 0.15)} IRPF)
                    </span>
                  </div>
                )}

                {/* Botón táctil para saltar directamente al desglose en móvil */}
                <div className="pt-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('desglose-ccaa');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <span>Ver Comparativa Cataluña vs Aragón</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            BLOQUE 2: ALERTA COMPARATIVA DE SUELDOS (<20k vs 33k vs Familiar)
           ===================================================================== */}
        <section className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                <Scale className="w-5 h-5 shrink-0" />
                <span>
                  Clave Financiera: ¿Por qué el precio neto final cambia según quién figure en la factura?
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Con un sueldo bruto de <strong>{formatEur(sueldoBruto)}/año</strong>, tu cuota estatal en el IRPF te permite recuperar{' '}
                <strong>{formatEurExact(currentCalc.deduccionRealCat)}</strong> de la deducción del 15%. Si figuras tú o un familiar con ingresos desde 34.000 €/año, se aprovecha el 100% de los 3.000 € de rebaja fiscal.
              </p>
            </div>

            {/* Tarjetas comparativas instantáneas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div className="bg-slate-950/90 border border-rose-500/30 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400">Sueldo 18.000 €/año</div>
                <div className="text-sm font-extrabold text-rose-400 mt-0.5">
                  Cobras {formatEur(comparison18k.dedReal)} IRPF
                </div>
                <div className="text-[10px] text-slate-500">
                  Pierdes {formatEur(Math.max(0, currentCalc.deduccionTeoricaTotal - comparison18k.dedReal))}
                </div>
              </div>

              <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400">Sueldo 33.000 €/año</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  Cobras {formatEur(Math.min(currentCalc.deduccionTeoricaTotal, 2796))} IRPF
                </div>
                <div className="text-[10px] text-slate-500">
                  93% de deducción
                </div>
              </div>

              <div className="bg-slate-950/90 border border-indigo-400/40 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400">Sueldo ≥ 34.000 €/año</div>
                <div className="text-sm font-extrabold text-indigo-300 mt-0.5">
                  Cobras {formatEur(comparison34k.dedReal)} IRPF
                </div>
                <div className="text-[10px] text-slate-500">
                  100% Aprovechado
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            BLOQUE 3: DESGLOSE EXACTO CATALUÑA VS ARAGÓN (CON CONMUTADOR MÓVIL)
           ===================================================================== */}
        <section id="desglose-ccaa" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Cabecera del bloque con conmutador de vista táctil */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Desglose Exacto: Cataluña vs. Aragón
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vehículo:{' '}
                  <strong className="text-slate-200">
                    {selectedCar.brand} {selectedCar.model} {selectedCar.trim}
                  </strong>{' '}
                  · Sueldo: <strong className="text-amber-400">{formatEur(sueldoBruto)}/año</strong>
                </p>
              </div>

              {/* Selector de modo de vista: Tarjetas Cara a Cara vs Tabla Técnica */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setRegionalBreakdownView('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold transition ${
                    regionalBreakdownView === 'cards'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cara a Cara</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegionalBreakdownView('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold transition ${
                    regionalBreakdownView === 'table'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Tabla Técnica</span>
                </button>
              </div>
            </div>

            {/* Banner de diferencia fiscal entre ambas comunidades */}
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400">Diferencia fiscal en la compra: </span>
                <span className="font-bold text-emerald-400">
                  {currentCalc.ahorroAragonVsCataluna > 0
                    ? `Aragón es ${formatEurExact(currentCalc.ahorroAragonVsCataluna)} más barato en IRPF por menor escala autonómica`
                    : 'Mismo coste neto en ambas comunidades autónomas'}
                </span>
              </div>
            </div>
          </div>

          {/* VISTA 1: TARJETAS CARA A CARA (Optimizado para pantallas móviles y visualización limpia) */}
          {regionalBreakdownView === 'cards' ? (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Tarjeta 1: Desembolso Neto Final de Bolsillo (KPI Máximo) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-2 border-emerald-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Desembolso Neto Final de Bolsillo
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    Todo incluido
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Cataluña */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                    <div className="text-xs text-indigo-300 font-medium">Cataluña (Barcelona/Tarragona/Lleida/Girona)</div>
                    <div className="text-2xl font-black text-indigo-200">
                      {formatEurExact(currentCalc.desembolsoBolsilloCat)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Ahorro vs PVP: {formatEur(selectedCar.pvp - currentCalc.desembolsoBolsilloCat)}
                    </div>
                  </div>

                  {/* Aragón */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                    <div className="text-xs text-emerald-300 font-medium">Aragón (Zaragoza/Huesca/Teruel)</div>
                    <div className="text-2xl font-black text-emerald-400">
                      {formatEurExact(currentCalc.desembolsoBolsilloAra)}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-semibold">
                      {currentCalc.ahorroAragonVsCataluna > 0
                        ? `Ahorras ${formatEurExact(currentCalc.ahorroAragonVsCataluna)} extra en Aragón`
                        : `Ahorro vs PVP: ${formatEur(selectedCar.pvp - currentCalc.desembolsoBolsilloAra)}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid con las tarjetas desglosadas por concepto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tarjeta A: Factura en Concesionario */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span>1. Factura en Concesionario</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      {formatEur(currentCalc.precioFacturaFinal)}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">PVP Oficial Tarifa:</span>
                      <span className="font-semibold text-slate-200">{formatEur(selectedCar.pvp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Descuentos comerciales:</span>
                      <span className="font-semibold text-emerald-400">
                        -{formatEur(currentCalc.totalCommercialDiscount)}
                      </span>
                    </div>
                    {currentCalc.caeAplicado > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bonificación CAE (Ficha TRA050.P):</span>
                        <span className="font-semibold text-cyan-400">
                          -{formatEur(currentCalc.caeAplicado)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span>Base sin IVA:</span>
                      <span className="font-medium text-slate-300">{formatEur(currentCalc.baseSinIva)}</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta B: Subvención Plan Auto+ e IRPF */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span>2. Plan Auto+ (RD 609/2026)</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      -{formatEur(currentCalc.subvencionAutoPlusBruta)}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subvención Bruta asignada:</span>
                      <span className="font-semibold text-emerald-400">
                        {formatEur(currentCalc.subvencionAutoPlusBruta)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>IRPF Cataluña ({currentCalc.fiscal.tipoMarginalCat.toFixed(1)}%):</span>
                      <span className="font-semibold">
                        +{formatEurExact(currentCalc.fiscal.impuestoSubvencionCat)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-300">
                      <span>IRPF Aragón ({currentCalc.fiscal.tipoMarginalAra.toFixed(1)}%):</span>
                      <span className="font-semibold">
                        +{formatEurExact(currentCalc.fiscal.impuestoSubvencionAra)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/60 text-[11px] text-emerald-400 font-semibold">
                      <span>Subvención Neta (Aragón / Cataluña):</span>
                      <span>
                        {formatEur(currentCalc.subvencionNetaAra)} / {formatEur(currentCalc.subvencionNetaCat)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta C: Deducción 15% IRPF */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span>3. Deducción 15% IRPF (DA 58ª)</span>
                    <span className="text-amber-400 font-extrabold text-sm">
                      -{formatEurExact(currentCalc.deduccionRealCat)}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base máxima calculada:</span>
                      <span className="font-semibold text-slate-200">
                        {formatEur(currentCalc.baseDeduccionCoche)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deducción Teórica máx:</span>
                      <span className="font-semibold text-slate-200">
                        {formatEurExact(currentCalc.deduccionTeoricaTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Devolución Renta con tus {formatEur(sueldoBruto)}:</span>
                      <span>-{formatEurExact(currentCalc.deduccionRealCat)}</span>
                    </div>
                    {currentCalc.deduccionPerdidaPorSueldoBajo > 0 && (
                      <div className="flex justify-between text-[11px] text-rose-400 pt-0.5">
                        <span>Pérdida por falta de cuota:</span>
                        <span>-{formatEurExact(currentCalc.deduccionPerdidaPorSueldoBajo)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tarjeta D: Venta de Vehículo Antiguo */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="font-bold text-xs sm:text-sm text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span>4. Venta Coche Antiguo</span>
                    <span className="text-cyan-400 font-extrabold text-sm">
                      {currentCalc.ingresoVentaLeon > 0 ? `-${formatEur(currentCalc.ingresoVentaLeon)}` : '0 €'}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Modalidad seleccionada:</span>
                      <span className="font-semibold text-slate-200">
                        {leonStrategy === 'VENTA_PRIVADA_Y_CAE'
                          ? 'Venta a particular'
                          : leonStrategy === 'DESGUACE_Y_CAE'
                          ? 'Desguace / Sin venta'
                          : 'Sin coche a sustituir'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ingreso líquido estimado:</span>
                      <span className="font-semibold text-cyan-400">
                        {formatEur(currentCalc.ingresoVentaLeon)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      100% compatible con CAE y Auto+ sin incompatibilidad.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VISTA 2: TABLA TÉCNICA DETALLADA (Para escritorio o consulta avanzada) */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 sm:px-5 font-semibold">Concepto Económico / Fiscal</th>
                    <th className="py-3.5 px-4 sm:px-5 font-semibold text-right bg-indigo-950/20 border-l border-slate-800/80">
                      Cataluña (BCN / TAR / LLE / GIR)
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 font-semibold text-right bg-emerald-950/20 border-l border-slate-800/80">
                      Aragón (ZAZ / HUE / TER)
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 font-semibold text-right border-l border-slate-800/80">
                      Diferencia / Justificación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {/* 1. PVP Oficial */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 sm:px-5 font-medium text-slate-200">
                      1. PVP Oficial de Tarifa (con 21% IVA)
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-slate-200 bg-indigo-950/10 border-l border-slate-800/60">
                      {formatEur(selectedCar.pvp)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-slate-200 bg-emerald-950/10 border-l border-slate-800/60">
                      {formatEur(selectedCar.pvp)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs text-slate-400 border-l border-slate-800/60">
                      Tarifa oficial {selectedCar.brand}
                    </td>
                  </tr>

                  {/* 2. Descuento Comercial */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 sm:px-5 text-slate-300">
                      <div>2. Descuento Comercial Marca + 1.000 € Concesionario Auto+</div>
                      <div className="text-xs text-slate-500">
                        Campaña ({formatEur(currentCalc.dtoMarcaContado)}) + Auto+ ({formatEur(currentCalc.mandatoryAutoPlusDealerDiscount)})
                        {currentCalc.dtoFinanciacion > 0 && ` + Financiación (${formatEur(currentCalc.dtoFinanciacion)})`}
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-emerald-400 bg-indigo-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.totalCommercialDiscount)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-emerald-400 bg-emerald-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.totalCommercialDiscount)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs text-slate-400 border-l border-slate-800/60">
                      Base s/IVA: {formatEur(currentCalc.baseSinIva)}
                    </td>
                  </tr>

                  {/* 3. Bonificación CAE */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 sm:px-5 text-slate-300">
                      <div>3. Bonificación CAE en Factura (Ficha TRA050.P V 2.0)</div>
                      <div className="text-xs text-slate-500">
                        Por sustitución de vehículo de combustión antiguo
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-cyan-400 bg-indigo-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.caeAplicado)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-cyan-400 bg-emerald-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.caeAplicado)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs text-slate-400 border-l border-slate-800/60">
                      {currentCalc.caeAplicado > 0 ? 'Descuento directo en factura' : '0 € en PHEV / Sin CAE'}
                    </td>
                  </tr>

                  {/* 4. PRECIO EN FACTURA CONCESIONARIO */}
                  <tr className="bg-slate-950/80 font-bold text-white">
                    <td className="py-3.5 px-4 sm:px-5">
                      4. PRECIO A PAGAR EN FACTURA CONCESIONARIO ({paymentMode})
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-base bg-indigo-950/30 border-l border-slate-800">
                      {formatEur(currentCalc.precioFacturaFinal)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-base bg-emerald-950/30 border-l border-slate-800">
                      {formatEur(currentCalc.precioFacturaFinal)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-xs text-slate-300 border-l border-slate-800">
                      Idéntico en toda España
                    </td>
                  </tr>

                  {/* 5. Subvención Plan Auto+ Bruta */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 sm:px-5 text-slate-300">
                      <div>5. Subvención Estatal Plan Auto+ (RD 609/2026) — BRUTA</div>
                      <div className="text-xs text-slate-500">
                        Eléctrico: {formatEur(currentCalc.autoPlusElectrico)} + Económico: {formatEur(currentCalc.autoPlusEconomico)} + UE: {formatEur(currentCalc.autoPlusMontajeUE + currentCalc.autoPlusBateriaUE)}
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-emerald-400 bg-indigo-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.subvencionAutoPlusBruta)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-emerald-400 bg-emerald-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.subvencionAutoPlusBruta)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs text-slate-400 border-l border-slate-800/60">
                      Abono centralizado por el Estado
                    </td>
                  </tr>

                  {/* 6. Tributación IRPF de la Subvención */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 sm:px-5 text-slate-300">
                      <div>6. Impuesto IRPF por la Subvención Auto+ (Ganancia Patrimonial)</div>
                      <div className="text-xs text-slate-500">
                        Se liquida en la declaración de la Renta con tus {formatEur(sueldoBruto)} de sueldo
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-rose-400 bg-indigo-950/10 border-l border-slate-800/60">
                      +{formatEurExact(currentCalc.fiscal.impuestoSubvencionCat)}
                      <div className="text-[11px] text-slate-400">
                        (Tipo efec: {currentCalc.fiscal.tipoMarginalCat.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-rose-400 bg-emerald-950/10 border-l border-slate-800/60">
                      +{formatEurExact(currentCalc.fiscal.impuestoSubvencionAra)}
                      <div className="text-[11px] text-slate-400">
                        (Tipo efec: {currentCalc.fiscal.tipoMarginalAra.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs font-semibold text-emerald-400 border-l border-slate-800/60">
                      Aragón ahorra{' '}
                      {formatEurExact(
                        currentCalc.fiscal.impuestoSubvencionCat - currentCalc.fiscal.impuestoSubvencionAra
                      )}
                    </td>
                  </tr>

                  {/* 7. Subvención Neta Real */}
                  <tr className="hover:bg-slate-800/30 bg-slate-900/60">
                    <td className="py-3 px-4 sm:px-5 font-medium text-slate-200">
                      7. Ayuda Plan Auto+ NETA Real (tras descontar IRPF)
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-bold text-emerald-300 bg-indigo-950/10 border-l border-slate-800/60">
                      -{formatEurExact(currentCalc.subvencionNetaCat)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-bold text-emerald-300 bg-emerald-950/10 border-l border-slate-800/60">
                      -{formatEurExact(currentCalc.subvencionNetaAra)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs text-slate-400 border-l border-slate-800/60">
                      Dinero limpio al bolsillo
                    </td>
                  </tr>

                  {/* 8. Deducción 15% IRPF */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 sm:px-5 text-slate-300">
                      <div>8. Deducción 15% IRPF Vehículo Eléctrico (DA 58ª LIRPF)</div>
                      <div className="text-xs text-slate-500">
                        Teórica: {formatEurExact(currentCalc.deduccionTeoricaTotal)} · Limitada por cuota con {formatEur(sueldoBruto)}
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-amber-400 bg-indigo-950/10 border-l border-slate-800/60">
                      -{formatEurExact(currentCalc.deduccionRealCat)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-amber-400 bg-emerald-950/10 border-l border-slate-800/60">
                      -{formatEurExact(currentCalc.deduccionRealAra)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs border-l border-slate-800/60">
                      {currentCalc.deduccionPerdidaPorSueldoBajo > 0 ? (
                        <span className="text-rose-400 font-semibold">
                          Pierdes {formatEur(currentCalc.deduccionPerdidaPorSueldoBajo)} por cuota baja
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">100% Aprovechada</span>
                      )}
                    </td>
                  </tr>

                  {/* 9. Coste Real Neto */}
                  <tr className="bg-slate-950/70 font-bold text-slate-100">
                    <td className="py-3.5 px-4 sm:px-5">
                      9. COSTE REAL NETO DEL VEHÍCULO (Sin contar venta particular)
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-base bg-indigo-950/25 border-l border-slate-800">
                      {formatEurExact(currentCalc.costeNetoSinLeonCat)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-base bg-emerald-950/25 border-l border-slate-800">
                      {formatEurExact(currentCalc.costeNetoSinLeonAra)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right text-xs text-emerald-400 border-l border-slate-800">
                      Ahorro vs PVP:{' '}
                      {formatEur(selectedCar.pvp - currentCalc.costeNetoSinLeonAra)}
                    </td>
                  </tr>

                  {/* 10. Venta coche antiguo */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 sm:px-5 text-slate-300">
                      <div>10. Ingreso por Venta Privada de tu Coche Antiguo</div>
                      <div className="text-xs text-slate-500">
                        Venta a particular (100% compatible con CAE y Auto+)
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-cyan-400 bg-indigo-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.ingresoVentaLeon)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-semibold text-cyan-400 bg-emerald-950/10 border-l border-slate-800/60">
                      -{formatEur(currentCalc.ingresoVentaLeon)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right text-xs text-slate-400 border-l border-slate-800/60">
                      Liquidez directa en cuenta
                    </td>
                  </tr>

                  {/* 11. DESEMBOLSO NETO FINAL DE BOLSILLO */}
                  <tr className="bg-gradient-to-r from-slate-950 via-emerald-950/40 to-slate-950 border-t-2 border-emerald-500/40">
                    <td className="py-4 px-4 sm:px-5">
                      <div className="font-extrabold text-base text-white">
                        11. DESEMBOLSO NETO DE BOLSILLO FINAL (Todo incluido)
                      </div>
                      <div className="text-xs text-emerald-300">
                        Factura - Auto+ Neto - IRPF Real - Venta Vehículo Antiguo
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-right font-extrabold text-xl text-indigo-300 bg-indigo-950/30 border-l border-slate-800">
                      {formatEurExact(currentCalc.desembolsoBolsilloCat)}
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-right font-extrabold text-xl text-emerald-400 bg-emerald-950/30 border-l border-slate-800">
                      {formatEurExact(currentCalc.desembolsoBolsilloAra)}
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-right text-xs font-bold text-emerald-300 border-l border-slate-800">
                      En Aragón te ahorras {formatEurExact(currentCalc.ahorroAragonVsCataluna)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Comparativa de Ventajas Regionales de Uso (5 años) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 bg-slate-950/60 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <div className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                <Award className="w-4 h-4" /> Ventajas de Uso en CATALUÑA (5 años)
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>
                  • <strong>Peajes EcoviaT (C-32, C-16):</strong>{' '}
                  {selectedCar.type === 'BEV' ? (
                    <span className="text-emerald-400 font-semibold">
                      75% de descuento en peajes de la Generalitat (~300-600 €/año de ahorro si usas C-32/C-16).
                    </span>
                  ) : (
                    <span className="text-amber-300">
                      Los PHEV ya NO tienen el 75% en EcoviaT en 2026 (solo BEV puros).
                    </span>
                  )}
                </li>
                <li>
                  • <strong>Impuesto de Circulación (IVTM Barcelona):</strong> Bonificación del 75% durante los primeros 5 años en Etiqueta CERO.
                </li>
                <li>
                  • <strong>Zona Azul (AREA Barcelona):</strong> En 2026 los etiqueta CERO pagan tarifa reducida (~1,15 €/h tras perder gratuidad total).
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                <Award className="w-4 h-4" /> Ventajas de Uso en ARAGÓN (5 años)
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>
                  • <strong>Menor tributación en IRPF por el Plan Auto+:</strong> Escala autonómica más baja (9,5% a 15% en tramos medios vs 10,5% a 16% en Cataluña).
                </li>
                <li>
                  • <strong>Impuesto de Circulación (IVTM Zaragoza):</strong> Bonificación del 75% <strong>indefinida (de por vida)</strong> para BEV 100% eléctricos.
                </li>
                <li>
                  • <strong>Zona Azul ESRO Zaragoza:</strong> <strong>100% GRATIS</strong> durante todo 2026 para Etiqueta CERO (y 50% bonificado en 2027).
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================================
            BLOQUE 4: CATÁLOGO MAESTRO (53 MODELOS) CON VISTA DUAL
           ===================================================================== */}
        <section id="tabla-comparativa" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* BARRA SUPERIOR DE LA TABLA Y TITULAR */}
          <div className="p-4 sm:p-5 border-b border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Catálogo y Comparador Maestro ({VEHICLES_DB.length} Modelos)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filtra por precio, marca o autonomía. Selecciona cualquier modelo para recalcular el análisis superior.
                </p>
              </div>

              {/* Conmutador de Vista (Tarjetas vs Tabla) y contador */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Conmutador visual Vista Tarjetas vs Tabla */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCatalogViewMode('cards')}
                    title="Vista Tarjetas móviles"
                    className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold transition ${
                      catalogViewMode === 'cards'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogViewMode('table')}
                    title="Vista Tabla completa"
                    className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold transition ${
                      catalogViewMode === 'table'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Tabla</span>
                  </button>
                </div>

                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  {processedModels.length} de {VEHICLES_DB.length}
                </span>

                {hasActiveFilters && (
                  <button
                    onClick={resetTableFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* BARRA DE FILTROS: Buscador siempre visible + Botón colapsable para filtros avanzados */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {/* Buscador de texto siempre accesible */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar por Seal, Dolphin, Model 3, MG4..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="w-full min-h-[44px] bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  {tableSearchQuery && (
                    <button
                      onClick={() => setTableSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white p-1"
                      aria-label="Borrar búsqueda"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Botón táctil para expandir/ocultar filtros avanzados con badge */}
                <button
                  type="button"
                  onClick={() => setFiltersExpanded((prev) => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-xs font-bold transition whitespace-nowrap ${
                    filtersExpanded || activeFilterCount > 0
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {filtersExpanded ? 'Ocultar Filtros' : 'Filtros Avanzados'}
                  </span>
                  <span className="sm:hidden">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                      {activeFilterCount}
                    </span>
                  )}
                  {filtersExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Selector horizontal táctil de marcas (siempre visible para filtrado ultrarrápido) */}
              <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1 -mx-1 px-1">
                {[
                  { id: 'ALL', label: 'Todas las marcas' },
                  { id: 'BYD', label: 'BYD (30)' },
                  { id: 'Tesla', label: 'Tesla (12)' },
                  { id: 'Leapmotor', label: 'Leapmotor (5)' },
                  { id: 'Geely', label: 'Geely (3)' },
                  { id: 'Omoda', label: 'Omoda (2)' },
                  { id: 'MG', label: 'MG (1)' },
                  { id: 'OTRAS', label: 'Otras marcas' }
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setTableBrandFilter(b.id)}
                    className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      tableBrandFilter === b.id
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* PANEL DE FILTROS AVANZADOS (Colapsable en móvil y desktop) */}
              {filtersExpanded && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                    {/* Filtro por Motorización (BEV / PHEV) */}
                    <div className="sm:col-span-1 lg:col-span-6 flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Motorización:</span>
                      <select
                        value={tableTypeFilter}
                        onChange={(e) => setTableTypeFilter(e.target.value)}
                        className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                      >
                        <option value="ALL">Todos (BEV Eléctrico + PHEV)</option>
                        <option value="BEV">Solo 100% Eléctricos (BEV)</option>
                        <option value="PHEV">Solo Híbridos Enchufables (PHEV)</option>
                      </select>
                    </div>

                    {/* Autonomía mínima */}
                    <div className="sm:col-span-1 lg:col-span-6 flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Autonomía mínima WLTP:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { km: 0, label: 'Todas' },
                          { km: 300, label: '≥300' },
                          { km: 400, label: '≥400' },
                          { km: 500, label: '≥500' }
                        ].map((opt) => (
                          <button
                            key={opt.km}
                            type="button"
                            onClick={() => setTableMinWltp(opt.km)}
                            className={`py-2 min-h-[44px] rounded-xl font-bold text-xs transition ${
                              tableMinWltp === opt.km
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RANGOS DE PRECIOS */}
                  <div className="border-t border-slate-800/80 pt-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-300">Tipo de precio a filtrar:</span>
                        <select
                          value={tablePriceTarget}
                          onChange={(e) => setTablePriceTarget(e.target.value as PriceFilterType)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 min-h-[38px]"
                        >
                          <option value="NETO_ARA">Precio Neto Final (Aragón)</option>
                          <option value="NETO_CAT">Precio Neto Final (Cataluña)</option>
                          <option value="FACTURA">Precio en Factura Concesionario</option>
                          <option value="PVP">PVP Oficial Tarifa</option>
                        </select>
                      </div>

                      {/* Inputs manuales Min y Max */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Entre:</span>
                        <input
                          type="number"
                          placeholder="Mín €"
                          value={tableMinPrice}
                          onChange={(e) => {
                            setTablePricePreset('CUSTOM');
                            setTableMinPrice(e.target.value === '' ? '' : Number(e.target.value));
                          }}
                          className="w-24 min-h-[38px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-white focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-400">y</span>
                        <input
                          type="number"
                          placeholder="Máx €"
                          value={tableMaxPrice}
                          onChange={(e) => {
                            setTablePricePreset('CUSTOM');
                            setTableMaxPrice(e.target.value === '' ? '' : Number(e.target.value));
                          }}
                          className="w-24 min-h-[38px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-white focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-400">€</span>
                      </div>
                    </div>

                    {/* Presets de precio */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { id: 'ALL', label: 'Cualquier Precio' },
                        { id: 'UNDER_20K', label: '< 20.000 €' },
                        { id: '20K_30K', label: '20k - 30k €' },
                        { id: '30K_40K', label: '30k - 40k €' },
                        { id: '40K_50K', label: '40k - 50k €' },
                        { id: 'OVER_50K', label: '> 50.000 €' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePricePreset(p.id)}
                          className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold transition ${
                            tablePricePreset === p.id
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CONDICIONES UE Y PLAN AUTO+ */}
                  <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer min-h-[40px]">
                      <input
                        type="checkbox"
                        checked={tableAutoPlusOnly}
                        onChange={(e) => setTableAutoPlusOnly(e.target.checked)}
                        className="rounded accent-emerald-500 w-5 h-5"
                      />
                      <span className="text-slate-200">Solo elegibles Plan Auto+ (&le;45k s/IVA)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer min-h-[40px]">
                      <input
                        type="checkbox"
                        checked={tableEuOnly}
                        onChange={(e) => setTableEuOnly(e.target.checked)}
                        className="rounded accent-indigo-500 w-5 h-5"
                      />
                      <span className="text-slate-200">Solo con fabricación UE (+675 €)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================
              RENDERIZADO DUAL DEL CATÁLOGO: TARJETAS MÓVILES VS TABLA TRADICIONAL
             =================================================================== */}
          {catalogViewMode === 'cards' ? (
            /* VISTA DE TARJETAS MÓVILES (Mobile Cards) */
            <div className="p-4 sm:p-5">
              {processedModels.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Search className="w-8 h-8 mx-auto text-slate-500" />
                  <div className="text-sm font-semibold text-slate-300">
                    No se encontró ningún modelo con los filtros actuales
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Prueba a ampliar el rango de precios, borrar el texto de búsqueda o pulsar en Restablecer Filtros.
                  </p>
                  <button
                    onClick={resetTableFilters}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-md min-h-[44px]"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processedModels.map(({ car, calc }) => {
                    const isSelected = car.id === selectedCarId;

                    return (
                      <div
                        key={car.id}
                        onClick={() => handleSelectCar(car.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                            : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Cabecera de la tarjeta con marca, modelo y badges */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-white">
                                  {car.brand} {car.model}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold">
                                    Activo
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">{car.trim}</div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                car.type === 'BEV'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {car.type === 'BEV' ? '100% Eléctrico' : 'Híbrido Enchufable'}
                            </span>
                          </div>

                          {/* Especificaciones clave: Autonomía y Origen */}
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-200 font-semibold">
                              <Zap className="w-3 h-3 text-emerald-400" />
                              {car.wltpKm} km WLTP
                            </span>

                            {car.euAssemblyDefault ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-[11px]">
                                🇪🇺 Ensamblado UE
                              </span>
                            ) : car.euPlantPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px]">
                                ⏳ Planta UE trámite
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
                                🇨🇳 Importado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fila de precios preliminares */}
                        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">PVP:</span>
                            <span className="font-semibold text-slate-300">{formatEur(car.pvp)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Descuentos:</span>
                            <span className="font-semibold text-emerald-400">
                              -{formatEur(calc.totalCommercialDiscount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Factura:</span>
                            <span className="font-bold text-white">{formatEur(calc.precioFacturaFinal)}</span>
                          </div>
                        </div>

                        {/* Bloque destacado con desembolso neto final (Cataluña vs Aragón) */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-indigo-300 font-medium">Neto Cataluña:</span>
                            <span className="text-sm font-bold text-indigo-200">
                              {formatEur(calc.desembolsoBolsilloCat)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                            <span className="text-emerald-400 font-bold">Neto Aragón:</span>
                            <span className="text-base font-black text-emerald-400">
                              {formatEur(calc.desembolsoBolsilloAra)}
                            </span>
                          </div>

                          {calc.ahorroAragonVsCataluna > 0 && (
                            <div className="text-[10px] text-emerald-300 text-right">
                              En Aragón ahorras {formatEurExact(calc.ahorroAragonVsCataluna)}
                            </div>
                          )}
                        </div>

                        {/* Botón táctil para seleccionar este coche (mínimo 44px) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCar(car.id);
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition min-h-[44px] ${
                            isSelected
                              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Modelo Activo en Simulación</span>
                            </>
                          ) : (
                            <>
                              <Car className="w-4 h-4" />
                              <span>Seleccionar para Desglose Fiscal</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VISTA DE TABLA TRADICIONAL COMPLETA (11 Columnas con ordenación) */
            <div className="overflow-x-auto max-h-[720px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 shadow-md">
                  <tr>
                    <th
                      onClick={() => handleSort('brand')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Marca y Modelo</span>
                        {sortColumn === 'brand' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>

                    <th className="py-3.5 px-2 text-center select-none">Tipo</th>

                    <th
                      onClick={() => handleSort('wltpKm')}
                      className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>WLTP</span>
                        {sortColumn === 'wltpKm' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('pvp')}
                      className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>PVP Oficial</span>
                        {sortColumn === 'pvp' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('discount')}
                      className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Dto. Marca</span>
                        {sortColumn === 'discount' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>

                    <th className="py-3.5 px-3 text-right select-none">CAE</th>

                    <th
                      onClick={() => handleSort('factura')}
                      className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-white font-bold">Precio Factura</span>
                        {sortColumn === 'factura' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('autoPlus')}
                      className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-emerald-400">Plan Auto+</span>
                        {sortColumn === 'autoPlus' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>

                    <th className="py-3.5 px-3 text-right text-amber-400 select-none">IRPF 15%</th>

                    <th
                      onClick={() => handleSort('netoCat')}
                      className="py-3.5 px-4 text-right bg-indigo-950/40 text-indigo-200 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Neto Cataluña</span>
                        {sortColumn === 'netoCat' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-300" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-300" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('netoAra')}
                      className="py-3.5 px-4 text-right bg-emerald-950/40 text-emerald-300 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-extrabold">Neto Aragón</span>
                        {sortColumn === 'netoAra' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {processedModels.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 space-y-3">
                        <Search className="w-8 h-8 mx-auto text-slate-500" />
                        <div className="text-sm font-semibold text-slate-300">
                          No se encontró ningún modelo con los filtros actuales
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Prueba a ampliar el rango de precios, borrar el texto de búsqueda o pulsar en Restablecer Filtros.
                        </p>
                        <button
                          onClick={resetTableFilters}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-md min-h-[44px]"
                        >
                          Restablecer Filtros
                        </button>
                      </td>
                    </tr>
                  ) : (
                    processedModels.map(({ car, calc }) => {
                      const isSelected = car.id === selectedCarId;

                      return (
                        <tr
                          key={car.id}
                          onClick={() => handleSelectCar(car.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/20 font-medium'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${
                                  isSelected ? 'bg-emerald-400 scale-125' : 'bg-slate-700'
                                }`}
                              />
                              <div>
                                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                  <span>{car.brand} {car.model}</span>
                                  {isSelected && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-semibold">
                                      Activo
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">{car.trim}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                car.type === 'BEV'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              {car.type}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right font-medium text-slate-300">
                            {car.wltpKm} km
                          </td>

                          <td className="py-3.5 px-3 text-right text-slate-300">
                            {formatEur(car.pvp)}
                          </td>

                          <td className="py-3.5 px-3 text-right text-emerald-400">
                            -{formatEur(calc.totalCommercialDiscount)}
                          </td>

                          <td className="py-3.5 px-3 text-right text-cyan-400">
                            {calc.caeAplicado > 0 ? `-${formatEur(calc.caeAplicado)}` : '0 €'}
                          </td>

                          <td className="py-3.5 px-3 text-right font-bold text-white">
                            {formatEur(calc.precioFacturaFinal)}
                            {!calc.isEligible45k && (
                              <span className="block text-[10px] text-rose-400 font-normal">
                                &gt;45k s/IVA (Sin ayuda)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right font-semibold text-emerald-400">
                            {calc.subvencionAutoPlusBruta > 0
                              ? `-${formatEur(calc.subvencionAutoPlusBruta)}`
                              : '0 €'}
                          </td>

                          <td className="py-3.5 px-3 text-right font-semibold text-amber-400">
                            {calc.deduccionRealCat > 0
                              ? `-${formatEur(calc.deduccionRealCat)}`
                              : '0 €'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-indigo-300 bg-indigo-950/20">
                            {formatEur(calc.desembolsoBolsilloCat)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 bg-emerald-950/20">
                            {formatEur(calc.desembolsoBolsilloAra)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* =======================================================================
          BOTÓN FLOTANTE MÓVIL (FAB) PARA VOLVER ARRIBA / VER COCHE SELECCIONADO
         ======================================================================= */}
      {showScrollTop && (
        <aside
          aria-label="Acciones rápidas móviles"
          className="fixed bottom-5 right-4 z-40 md:hidden flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Volver arriba al análisis detallado"
            className="flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/40 hover:bg-emerald-400 active:scale-95 transition"
          >
            <Car className="w-4 h-4" />
            <span className="truncate max-w-[130px]">
              {selectedCar.brand} {selectedCar.model}
            </span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* PIE DE PÁGINA EXPLICATIVO */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 text-center text-xs text-slate-500 space-y-2">
        <p>
          Calculadora desarrollada según el Real Decreto 609/2026 (Plan Auto+ España) y la Disposición Adicional 58ª de la Ley del IRPF.
        </p>
        <p>
          Datos de tarifas oficiales, campañas comerciales de marca y fichas CAE (TRA050.P). Diseñado para consulta entre familiares y particulares.
        </p>
      </footer>
    </div>
  );
}
