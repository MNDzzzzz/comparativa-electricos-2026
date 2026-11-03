# AGENTS.md — Comparativa Eléctricos España 2026

## 1. Visión General del Proyecto
Calculadora web interactiva para calcular el coste real de adquisición de un vehículo eléctrico en España (vigencia 2026), considerando:
- **Plan Auto+ (RD 609/2026)**: Subvención directa de hasta 4.500€ con criterios de motorización (BEV vs PHEV), precio (<35k€ y 35k-45k€ sin IVA) y origen de fabricación/batería en la UE (+675€ / +450€).
- **Deducción IRPF del 15% (DA 58ª LIRPF)**: Hasta 3.000€ sobre base máxima de 20.000€, condicionada a la cuota íntegra estatal según el sueldo bruto anual del comprador.
- **Certificado de Ahorro Energético (CAE - TRA050.P)**: 950€ de bonificación directa en factura al sustituir un vehículo antiguo de combustión, compatible con venta particular.
- **Comparativa Autonómica**: Cataluña (Barcelona, Girona, Lleida, Tarragona) vs Aragón (Zaragoza, Huesca, Teruel), detallando la escala autonómica del IRPF al tributar la subvención y ventajas de uso a 5 años (peajes EcoviaT vs bonificaciones IVTM/ESRO).

## 2. Stack Tecnológico (0€ Budget)
- **Framework**: React 18 + Vite (SPA estática)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS (Dark Mode por defecto, WCAG AA)
- **Iconos**: Lucide React
- **Despliegue Objetivo**: Vercel / Cloudflare Pages / Netlify (Free Tier)

## 3. Estructura de Directorios
```
├── src/
│   ├── data/
│   │   └── vehicles.ts       # Base de datos oficial de 53 modelos (BYD, Tesla, MG, Leapmotor, Geely, Omoda)
│   ├── types/
│   │   └── index.ts          # Interfaces de vehículos, fiscalidad y filtros
│   ├── utils/
│   │   └── taxEngine.ts      # Motor de cálculo IRPF 2026 (Estatal, Cataluña, Aragón) y formateadores
│   ├── App.tsx               # Componente principal con comparador y tabla maestra con filtros
│   ├── main.tsx              # Punto de entrada React
│   └── index.css             # Directivas Tailwind y estilos de scrollbar
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 4. Guía de Ejecución Local
```bash
npm install
npm run dev      # Servidor local en http://localhost:3000
npm run build    # Compilación para producción (genera /dist)
npm run preview  # Previsualización del build de producción
```
