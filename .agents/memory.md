# Memoria Local del Proyecto — Comparativa Eléctricos España 2026

## Decisiones Técnicas y Reglas del Proyecto
- **Filtros en Tabla Maestra**: Todos los filtros (marca, motorización, rango de precio, autonomía WLTP, elegibilidad Plan Auto+ y origen UE) se resuelven en memoria del cliente usando `useMemo` sin dependencias externas.
- **Selector de Rango de Precios**: Permite al usuario conmutar sobre qué precio desea acotar: PVP oficial, precio en factura con descuentos o desembolso neto final (Aragón o Cataluña).
- **Separación de Responsabilidades**: Los datos de vehículos se mantienen aislados en `src/data/vehicles.ts` y las fórmulas fiscales en `src/utils/taxEngine.ts` para permitir pruebas unitarias y mantenimiento sin ensuciar la interfaz en `App.tsx`.
- **Modo Oscuro**: La aplicación utiliza una paleta accesible `slate-950`, `slate-900`, `emerald-500`, `amber-400` y `indigo-400` garantizando contraste WCAG AA.
