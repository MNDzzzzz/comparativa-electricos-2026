const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runBrowserQA() {
  const screenshotDir = path.join(__dirname, '..', 'tests', 'e2e-screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  console.log('🚀 Iniciando Browser QA con Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:4173';
  console.log(`🌐 Navegando a ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 1. Captura de la pantalla inicial
  console.log('📸 1. Capturando estado inicial...');
  await page.screenshot({ path: path.join(screenshotDir, '01_initial_dashboard.png'), fullPage: false });

  // 2. Probar Filtro de Marca (Tesla)
  console.log('🔍 2. Probando filtro de marca (Tesla)...');
  await page.selectOption('select:has(option[value="Tesla"])', 'Tesla');
  await page.waitForTimeout(500);
  const badgeTextTesla = await page.locator('span:has-text("Mostrando")').first().innerText();
  console.log('   Resultado filtro Tesla:', badgeTextTesla);
  await page.screenshot({ path: path.join(screenshotDir, '02_filter_tesla.png'), fullPage: false });

  // 3. Probar Búsqueda de texto
  console.log('🔍 3. Probando búsqueda por texto ("Model 3")...');
  const searchInput = page.locator('input[placeholder*="Buscar por Seal"]');
  await searchInput.fill('Model 3');
  await page.waitForTimeout(500);
  const badgeTextSearch = await page.locator('span:has-text("Mostrando")').first().innerText();
  console.log('   Resultado búsqueda Model 3:', badgeTextSearch);
  await page.screenshot({ path: path.join(screenshotDir, '03_search_model3.png'), fullPage: false });

  // 4. Probar Restablecer Filtros
  console.log('🔄 4. Probando botón Limpiar Filtros...');
  const resetBtn = page.locator('button:has-text("Limpiar Filtros")');
  await resetBtn.click();
  await page.waitForTimeout(500);
  const badgeTextReset = await page.locator('span:has-text("Mostrando")').first().innerText();
  console.log('   Resultado tras limpiar filtros:', badgeTextReset);

  // 5. Probar Presets de Precio (< 20.000 €)
  console.log('💶 5. Probando preset de precio < 20.000 €...');
  const pricePresetBtn = page.locator('button:has-text("< 20.000 €")');
  await pricePresetBtn.click();
  await page.waitForTimeout(500);
  const badgeTextPrice = await page.locator('span:has-text("Mostrando")').first().innerText();
  console.log('   Resultado precio < 20.000 €:', badgeTextPrice);
  await page.screenshot({ path: path.join(screenshotDir, '04_filter_price_under_20k.png'), fullPage: false });

  // Limpiar filtros de nuevo
  await page.locator('button:has-text("Limpiar Filtros")').click();
  await page.waitForTimeout(300);

  // 6. Probar Selección de fila en la tabla
  console.log('🚗 6. Probando selección de vehículo desde la tabla...');
  // Hacemos scroll hasta la tabla
  await page.locator('#tabla-comparativa').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '05_table_master_view.png'), fullPage: false });

  // Clic en la segunda fila para seleccionarla
  const rows = page.locator('#tabla-comparativa tbody tr');
  const rowCount = await rows.count();
  console.log(`   Total filas visibles: ${rowCount}`);
  if (rowCount > 1) {
    await rows.nth(1).click();
    await page.waitForTimeout(500);
    console.log('   Fila 2 seleccionada.');
  }

  // Subir de nuevo a ver el bloque 1 actualizado
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '06_selected_car_updated.png'), fullPage: false });

  await browser.close();
  console.log('✅ Browser QA completado exitosamente con todas las capturas generadas.');
}

runBrowserQA().catch((err) => {
  console.error('❌ Error en Browser QA:', err);
  process.exit(1);
});
