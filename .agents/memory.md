# Memoria Local del Proyecto — Comparativa Eléctricos España 2026

## Decisiones Técnicas y Reglas del Proyecto
- **Filtros en Tabla Maestra**: Todos los filtros (marca, motorización, rango de precio, autonomía WLTP, elegibilidad Plan Auto+ y origen UE) se resuelven en memoria del cliente usando `useMemo` sin dependencias externas.
- **Selector de Rango de Precios**: Permite al usuario conmutar sobre qué precio desea acotar: PVP oficial, precio en factura con descuentos o desembolso neto final (Aragón o Cataluña).
- **Separación de Responsabilidades**: Los datos de vehículos se mantienen aislados en `src/data/vehicles.ts` y las fórmulas fiscales en `src/utils/taxEngine.ts` para permitir pruebas unitarias y mantenimiento sin ensuciar la interfaz en `App.tsx`.
- **Modo Oscuro**: La aplicación utiliza una paleta accesible `slate-950`, `slate-900`, `emerald-500`, `amber-400` y `indigo-400` garantizando contraste WCAG AA.
- **Diseño Mobile-First y Vista Dual**:
  - En pantallas `< 768px`, el Catálogo Maestro de 53 modelos activa por defecto la **Vista Tarjetas Móviles (Cards View)** para evitar el scroll horizontal forzado, con la opción de alternar a **Vista Tabla**.
  - Los 3 bloques de configuración iniciales en móvil se agrupan en un **Segmented Control Táctil** (`[🚗 Coche] [💼 IRPF] [♻️ CAE]`) reduciendo el scroll vertical en un 70%.
  - El desglose autonómico en móvil ofrece vista **Cara a Cara** en tarjetas apiladas.
  - El header móvil es compacto ($\le 58\text{px}$) e incorpora una mini-barra de KPI con el vehículo activo.
  - Touch targets $\ge 44\text{px}$ en todos los botones e inputs interactivos (WCAG 2.5.5).
