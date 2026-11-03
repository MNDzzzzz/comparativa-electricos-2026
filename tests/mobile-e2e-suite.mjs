/**
 * Suite de Pruebas E2E para Navegadores Móviles y Responsive
 * Comparativa Eléctricos España 2026
 *
 * Trade-offs de Arquitectura de Testing:
 * 1. Playwright Node.js API directa frente a CLI de test runner: Permite orquestar aserciones detalladas
 *    y capturas de pantalla de evidencia estructuradas con un único script reproducible sin dependencias externas pesadas.
 * 2. Pruebas multi-dispositivo secuenciales: Permite evaluar minuciosamente las diferencias de layout entre
 *    viewports móviles estrechos (360px), estándares (390px), tablets (768px) y desktop (1280px).
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
const SCREENSHOT_DIR = path.resolve(__dirname, 'e2e-screenshots', 'mobile');

// Asegurar existencia del directorio de capturas
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Configuración de Dispositivos de Prueba
const DEVICES = {
  iPhone14: {
    name: 'iPhone 14 (iOS Mobile)',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  },
  AndroidStandard: {
    name: 'Android Estándar (360x800)',
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  },
  TabletIPad: {
    name: 'Tablet iPad (768x1024)',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  },
  DesktopRef: {
    name: 'Desktop Referencia (1280x800)',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

const results = [];

function recordResult(testName, passed, details = '', screenshot = '') {
  results.push({ testName, passed, details, screenshot });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusIcon}: [${testName}] ${details}`);
}

async function runMobileQASuite() {
  console.log('======================================================================');
  console.log('Iniciando Suite de Verificación QA Mobile - Comparativa Eléctricos 2026');
  console.log(`URL de prueba: ${BASE_URL}`);
  console.log(`Directorio de capturas: ${SCREENSHOT_DIR}`);
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // =========================================================================
    // BLOQUE 1: PRUEBAS EN IPHONE 14 (390 x 844 px)
    // =========================================================================
    console.log('--- Probando en iPhone 14 (390 x 844 px) ---');
    const ctxIphone = await browser.newContext(DEVICES.iPhone14);
    const pageIphone = await ctxIphone.newPage();

    // 1.1 Carga inicial y verificación de header compacto
    await pageIphone.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Verificación de altura del Header móvil (<= 58px)
    const mobileHeader = pageIphone.locator('header > div.flex.md\\:hidden');
    await mobileHeader.waitFor({ state: 'visible', timeout: 5000 });
    const headerBox = await mobileHeader.boundingBox();
    const isHeaderCompact = headerBox && headerBox.height <= 58;

    recordResult(
      'iPhone 14 - Header Móvil Compacto (<= 58px)',
      isHeaderCompact,
      `Altura real medida: ${headerBox ? headerBox.height.toFixed(1) : 0}px (máximo permitido: 58px)`
    );

    // Mini-KPI bar presente y contiene valor monetario
    const miniKpi = mobileHeader.locator('button[title*="Ver análisis"]');
    const miniKpiText = await miniKpi.innerText();
    const hasValidKpi = miniKpiText.includes('NETO MÍN.') && miniKpiText.includes('€');
    recordResult(
      'iPhone 14 - Mini-KPI Bar en Header',
      hasValidKpi,
      `Texto detectado en Mini-KPI: "${miniKpiText.replace(/\n/g, ' ')}"`
    );

    // Botón de compartir accesible (>= 44x44px)
    const shareBtn = mobileHeader.locator('button[aria-label="Compartir comparativa"]');
    const shareBox = await shareBtn.boundingBox();
    const isShareAccessible = shareBox && shareBox.width >= 44 && shareBox.height >= 44;
    recordResult(
      'iPhone 14 - Botón Compartir Accesible (>= 44x44px)',
      isShareAccessible,
      `Dimensiones táctiles del botón: ${shareBox ? `${shareBox.width.toFixed(0)}x${shareBox.height.toFixed(0)}px` : 'N/A'}`
    );

    // Clic en botón compartir para verificar interacción táctil
    await shareBtn.click();
    await pageIphone.waitForTimeout(300);

    // Captura 1: Header móvil y Pestaña 1 (Coche) activa
    const shot1 = '01_iphone14_header_kpi_tab1_coche.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot1),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Header y Tab Coche', true, 'Captura guardada', shot1);

    // 1.2 Pestañas táctiles de configuración: Alternar a IRPF
    const tabIrpf = pageIphone.locator('button:has-text("2. IRPF")');
    await tabIrpf.click();
    await pageIphone.waitForTimeout(300);

    // Verificar que el bloque de IRPF es visible (título: "2. Sueldo Bruto y Deducción IRPF")
    const irpfSectionHeading = pageIphone.locator('text=2. Sueldo Bruto y Deducción IRPF');
    const isIrpfVisible = await irpfSectionHeading.isVisible();
    recordResult(
      'iPhone 14 - Transición Pestaña 2 (IRPF)',
      isIrpfVisible,
      'Sección de Sueldo Bruto y Deducción IRPF desplegada correctamente'
    );

    // Captura 2: Pestaña IRPF activa
    const shot2 = '02_iphone14_tab2_irpf_sueldo.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot2),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Pestaña IRPF', true, 'Captura guardada', shot2);

    // 1.3 Pestañas táctiles de configuración: Alternar a CAE / Chatarreo
    const tabCae = pageIphone.locator('button:has-text("3. CAE")');
    await tabCae.click();
    await pageIphone.waitForTimeout(300);

    // Título en App.tsx: "3. Coche Antiguo & CAE (950 €)"
    const caeSectionHeading = pageIphone.locator('text=3. Coche Antiguo & CAE');
    const isCaeVisible = await caeSectionHeading.isVisible();
    recordResult(
      'iPhone 14 - Transición Pestaña 3 (CAE)',
      isCaeVisible,
      'Sección de Bonificación CAE y Vehículo Antiguo desplegada'
    );

    // Captura 3: Pestaña CAE activa
    const shot3 = '03_iphone14_tab3_cae_wallbox.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot3),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Pestaña CAE', true, 'Captura guardada', shot3);

    // Regresar a la pestaña 1
    const tabCoche = pageIphone.locator('button:has-text("1. Coche")');
    await tabCoche.click();
    await pageIphone.waitForTimeout(200);

    // 1.4 Desglose autonómico en modo "Cara a Cara"
    const desgloseSection = pageIphone.locator('#desglose-ccaa');
    await desgloseSection.scrollIntoViewIfNeeded();
    await pageIphone.waitForTimeout(400);

    // Verificar selector de modo Cara a Cara activo por defecto en móvil
    const btnCaraACara = desgloseSection.locator('button:has-text("Cara a Cara")');
    const caraACaraClass = await btnCaraACara.getAttribute('class');
    const isCaraACaraActive = caraACaraClass && caraACaraClass.includes('bg-emerald-500');
    recordResult(
      'iPhone 14 - Desglose Cara a Cara Activo por Defecto',
      Boolean(isCaraACaraActive),
      'El modo de tarjetas "Cara a Cara" está seleccionado automáticamente en móvil'
    );

    // Comprobar ausencia de scroll horizontal no deseado
    const hasHorizontalOverflow = await pageIphone.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    recordResult(
      'iPhone 14 - Ausencia de Scroll Horizontal Forzado',
      !hasHorizontalOverflow,
      `ScrollWidth: ${await pageIphone.evaluate(() => document.documentElement.scrollWidth)}px vs Viewport: 390px`
    );

    // Captura 4: Desglose Cara a Cara
    const shot4 = '04_iphone14_desglose_cara_a_cara.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot4),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Desglose Cara a Cara', true, 'Captura guardada', shot4);

    // 1.5 Catálogo Maestro: Vista Tarjetas (Cards View) táctil por defecto
    const catalogoSection = pageIphone.locator('#tabla-comparativa');
    await catalogoSection.scrollIntoViewIfNeeded();
    await pageIphone.waitForTimeout(400);

    // Botón Tarjetas activo por defecto
    const btnTarjetas = catalogoSection.locator('button[title*="Vista Tarjetas"]');
    const tarjetasClass = await btnTarjetas.getAttribute('class');
    const isCardsModeDefault = tarjetasClass && tarjetasClass.includes('bg-emerald-500');
    recordResult(
      'iPhone 14 - Catálogo Vista Tarjetas por Defecto',
      Boolean(isCardsModeDefault),
      'El catálogo presenta la vista tarjetas optimizada para dedos'
    );

    // Contar tarjetas renderizadas (debe ser 53 sin filtros)
    const carCards = catalogoSection.locator('.grid > div.cursor-pointer');
    const cardCount = await carCards.count();
    recordResult(
      'iPhone 14 - Total Tarjetas Iniciales (53 Modelos)',
      cardCount === 53,
      `Se encontraron exactamente ${cardCount} tarjetas de modelos en catálogo`
    );

    // Captura 5: Catálogo Tarjetas por defecto
    const shot5 = '05_iphone14_catalogo_cards_default.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot5),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Catálogo Tarjetas', true, 'Captura guardada', shot5);

    // 1.6 Desplegar y probar el Panel de Filtros Colapsable
    const btnFiltros = catalogoSection.locator('button:has-text("Filtros")');
    await btnFiltros.click();
    await pageIphone.waitForTimeout(300);

    // Comprobar que el panel avanzado de filtros se abre buscando la etiqueta "Motorización:"
    const motorizacionLabel = catalogoSection.locator('text=Motorización:');
    const isFilterPanelOpen = await motorizacionLabel.isVisible();
    recordResult(
      'iPhone 14 - Despliegue Panel de Filtros Colapsable',
      isFilterPanelOpen,
      'El panel de filtros avanzados se desplegó tras hacer tap'
    );

    // Captura 6: Filtros avanzados desplegados
    const shot6 = '06_iphone14_filtros_avanzados_desplegados.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot6),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Filtros Avanzados', true, 'Captura guardada', shot6);

    // 1.7 Probar filtrado rápido por marca (Tesla)
    const btnTesla = catalogoSection.locator('button:has-text("Tesla (12)")');
    await btnTesla.click();
    await pageIphone.waitForTimeout(300);

    // Verificar conteo de tarjetas filtradas (12 de Tesla)
    const teslaCardCount = await carCards.count();
    recordResult(
      'iPhone 14 - Filtrado por Marca Tesla (12 modelos)',
      teslaCardCount === 12,
      `Se muestran ${teslaCardCount} tarjetas tras filtrar por Tesla`
    );

    // Captura 7: Filtro Tesla aplicado
    const shot7 = '07_iphone14_filtro_tesla_aplicado.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot7),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Filtro Tesla', true, 'Captura guardada', shot7);

    // 1.8 Selección de un vehículo desde una tarjeta móvil y actualización de la app
    // Colapsar filtros avanzados para tener las tarjetas visibles cómodamente
    await btnFiltros.click();
    await pageIphone.waitForTimeout(300);

    // Elegir la primera tarjeta visible de Tesla (Model 3)
    const firstTeslaCard = carCards.first();
    await firstTeslaCard.scrollIntoViewIfNeeded();

    const selectBtn = firstTeslaCard.locator('button:has-text("Seleccionar para Desglose Fiscal")');
    await selectBtn.click();
    await pageIphone.waitForTimeout(400);

    // Verificar que la tarjeta ahora tiene el estado activo
    const teslaCardText = await firstTeslaCard.innerText();
    const isTeslaSelected =
      teslaCardText.includes('Modelo Activo en Simulación') && teslaCardText.includes('Activo');
    recordResult(
      'iPhone 14 - Selección de Coche desde Tarjeta Móvil',
      isTeslaSelected,
      'La tarjeta cambió a estado seleccionado ("Activo / Modelo Activo en Simulación")'
    );

    // Verificar actualización en el Mini-KPI del header superior
    await pageIphone.evaluate(() => window.scrollTo(0, 0));
    await pageIphone.waitForTimeout(300);

    const updatedHeaderCar = await mobileHeader.locator('.text-\\[11px\\].text-emerald-400').innerText();
    const isHeaderUpdated = updatedHeaderCar.includes('Tesla');
    recordResult(
      'iPhone 14 - Header Mini-KPI Sincronizado con Selección',
      isHeaderUpdated,
      `Header móvil muestra el coche seleccionado: "${updatedHeaderCar}"`
    );

    // Captura 8: Coche seleccionado actualizado
    const shot8 = '08_iphone14_coche_seleccionado_update.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot8),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Selección Sincronizada', true, 'Captura guardada', shot8);

    // 1.9 Alternar a Vista Tabla en iPhone 14
    await catalogoSection.scrollIntoViewIfNeeded();
    const btnTabla = catalogoSection.locator('button[title*="Vista Tabla"]');
    await btnTabla.click();
    await pageIphone.waitForTimeout(300);

    const masterTable = catalogoSection.locator('table');
    const isTableRendered = await masterTable.isVisible();
    recordResult(
      'iPhone 14 - Alternancia a Vista Tabla',
      isTableRendered,
      'La tabla maestra se renderiza al pulsar el conmutador "Tabla"'
    );

    // Captura 9: Vista Tabla en iPhone 14
    const shot9 = '09_iphone14_catalogo_tabla_view.png';
    await pageIphone.screenshot({
      path: path.join(SCREENSHOT_DIR, shot9),
      fullPage: false
    });
    recordResult('iPhone 14 - Captura Vista Tabla Móvil', true, 'Captura guardada', shot9);

    await ctxIphone.close();

    // =========================================================================
    // BLOQUE 2: PRUEBAS EN ANDROID ESTÁNDAR (360 x 800 px)
    // =========================================================================
    console.log('\n--- Probando en Android Estándar (360 x 800 px) ---');
    const ctxAndroid = await browser.newContext(DEVICES.AndroidStandard);
    const pageAndroid = await ctxAndroid.newPage();

    await pageAndroid.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Verificación de cabecera en pantalla muy estrecha (360px)
    const androidHeader = pageAndroid.locator('header > div.flex.md\\:hidden');
    const androidHeaderBox = await androidHeader.boundingBox();
    const isAndroidHeaderCompact = androidHeaderBox && androidHeaderBox.height <= 58;
    recordResult(
      'Android 360px - Header Móvil Compacto (<= 58px)',
      isAndroidHeaderCompact,
      `Altura: ${androidHeaderBox ? androidHeaderBox.height.toFixed(1) : 0}px en viewport 360px`
    );

    // Captura 10: Overview en Android 360px
    const shot10 = '10_android360_header_cards_overview.png';
    await pageAndroid.screenshot({
      path: path.join(SCREENSHOT_DIR, shot10),
      fullPage: false
    });
    recordResult('Android 360px - Captura Inicial Overview', true, 'Captura guardada', shot10);

    // Scroll al desglose Cara a Cara en Android 360px
    const androidDesglose = pageAndroid.locator('#desglose-ccaa');
    await androidDesglose.scrollIntoViewIfNeeded();
    await pageAndroid.waitForTimeout(300);

    const androidOverflow = await pageAndroid.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    recordResult(
      'Android 360px - Sin Desbordamiento Horizontal en 360px',
      !androidOverflow,
      `ScrollWidth: ${await pageAndroid.evaluate(() => document.documentElement.scrollWidth)}px en viewport de 360px`
    );

    // Captura 11: Desglose Cara a Cara en Android 360px
    const shot11 = '11_android360_desglose_cara_a_cara.png';
    await pageAndroid.screenshot({
      path: path.join(SCREENSHOT_DIR, shot11),
      fullPage: false
    });
    recordResult('Android 360px - Captura Desglose Cara a Cara', true, 'Captura guardada', shot11);

    // Filtros activos en Android 360px
    const androidCatalogo = pageAndroid.locator('#tabla-comparativa');
    await androidCatalogo.scrollIntoViewIfNeeded();

    const androidBtnLeapmotor = androidCatalogo.locator('button:has-text("Leapmotor (5)")');
    await androidBtnLeapmotor.click();
    await pageAndroid.waitForTimeout(300);

    const androidLeapCards = await androidCatalogo.locator('.grid > div.cursor-pointer').count();
    recordResult(
      'Android 360px - Filtrado por Marca Leapmotor (5 modelos)',
      androidLeapCards === 5,
      `Se visualizan correctamente ${androidLeapCards} tarjetas de Leapmotor`
    );

    // Captura 12: Tarjetas Leapmotor filtradas en Android
    const shot12 = '12_android360_filtro_activos_tarjeta.png';
    await pageAndroid.screenshot({
      path: path.join(SCREENSHOT_DIR, shot12),
      fullPage: false
    });
    recordResult('Android 360px - Captura Tarjetas Leapmotor', true, 'Captura guardada', shot12);

    await ctxAndroid.close();

    // =========================================================================
    // BLOQUE 3: PRUEBAS EN TABLET / IPAD (768 x 1024 px)
    // =========================================================================
    console.log('\n--- Probando en Tablet / iPad (768 x 1024 px) ---');
    const ctxTablet = await browser.newContext(DEVICES.TabletIPad);
    const pageTablet = await ctxTablet.newPage();

    await pageTablet.goto(BASE_URL, { waitUntil: 'networkidle' });

    // En >= 768px, el header de escritorio se activa
    const tabletDesktopHeader = pageTablet.locator('header > div.hidden.md\\:flex');
    const isTabletDesktopHeaderVisible = await tabletDesktopHeader.isVisible();
    recordResult(
      'Tablet 768px - Header de Escritorio Completo Activo',
      isTabletDesktopHeaderVisible,
      'En 768px se presenta la cabecera completa con título extendido y KPIs'
    );

    // En 768px, el bloque de configuración responsive está presente
    const configGrid = pageTablet.locator('main > section:first-of-type div.grid.grid-cols-1.lg\\:grid-cols-12');
    const isConfigVisible = await configGrid.isVisible();
    recordResult(
      'Tablet 768px - Configuración Multicolumna Visible',
      isConfigVisible,
      'Estructura de configuración responsive adaptada para tablet'
    );

    // Captura 13: Tablet iPad Overview
    const shot13 = '13_tablet_ipad_overview.png';
    await pageTablet.screenshot({
      path: path.join(SCREENSHOT_DIR, shot13),
      fullPage: false
    });
    recordResult('Tablet 768px - Captura Overview iPad', true, 'Captura guardada', shot13);

    await ctxTablet.close();

    // =========================================================================
    // BLOQUE 4: PRUEBAS EN DESKTOP DE REFERENCIA (1280 x 800 px)
    // =========================================================================
    console.log('\n--- Probando en Desktop de Referencia (1280 x 800 px) ---');
    const ctxDesktop = await browser.newContext(DEVICES.DesktopRef);
    const pageDesktop = await ctxDesktop.newPage();

    await pageDesktop.goto(BASE_URL, { waitUntil: 'networkidle' });

    // En Desktop (1280px), la vista tabla está seleccionada por defecto
    const desktopCatalogo = pageDesktop.locator('#tabla-comparativa');
    await desktopCatalogo.scrollIntoViewIfNeeded();

    const desktopBtnTabla = desktopCatalogo.locator('button[title*="Vista Tabla"]');
    const desktopTablaClass = await desktopBtnTabla.getAttribute('class');
    const isDesktopTableDefault = desktopTablaClass && desktopTablaClass.includes('bg-emerald-500');
    recordResult(
      'Desktop 1280px - Vista Tabla por Defecto en Pantalla Grande',
      Boolean(isDesktopTableDefault),
      'El catálogo presenta la tabla comparativa completa por defecto en desktop'
    );

    // Captura 14: Desktop Referencia
    const shot14 = '14_desktop_referencia_overview.png';
    await pageDesktop.screenshot({
      path: path.join(SCREENSHOT_DIR, shot14),
      fullPage: false
    });
    recordResult('Desktop 1280px - Captura Desktop Referencia', true, 'Captura guardada', shot14);

    await ctxDesktop.close();
  } finally {
    await browser.close();
  }

  // ===========================================================================
  // RESUMEN FINAL DE EJECUCIÓN
  // ===========================================================================
  console.log('\n======================================================================');
  console.log('RESUMEN DE PRUEBAS AUTOMATIZADAS MOBILE QA');
  console.log('======================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total pruebas: ${total} | Aprobadas: ${passed} | Fallidas: ${failed}`);
  console.log(`Tasa de éxito: ${((passed / total) * 100).toFixed(1)}%`);

  // Guardar archivo JSON de resultados
  const reportPath = path.join(SCREENSHOT_DIR, 'test-results.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total,
        passed,
        failed,
        successRate: `${((passed / total) * 100).toFixed(1)}%`,
        results
      },
      null,
      2
    )
  );
  console.log(`Resultados guardados en: ${reportPath}`);

  if (failed > 0) {
    console.error('ALERTA: Se detectaron pruebas fallidas.');
    process.exitCode = 1;
  } else {
    console.log('¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
  }
}

runMobileQASuite().catch((err) => {
  console.error('Error fatal durante la ejecución de la suite de pruebas:', err);
  process.exit(1);
});
