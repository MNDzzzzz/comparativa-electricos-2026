# ⚡ Calculadora de Vehículos Eléctricos España 2026
> **Simulador de Coste Real Neto con Plan Auto+ (RD 609/2026), Deducción IRPF del 15% y Bonificación CAE.**  
> Comparativa fiscal y de uso a 5 años entre **Cataluña** (Barcelona, Tarragona, Lleida, Girona) y **Aragón** (Zaragoza, Huesca, Teruel).

---

## 🎯 ¿Para qué sirve esta web?
Comprar un coche eléctrico en España en 2026 no se limita al PVP oficial que ves en el configurador de la marca. Existen múltiples ayudas, incentivos y desgravaciones que reducen drásticamente el desembolso final, pero que dependen del sueldo de quien compra el coche y de la comunidad autónoma donde tributa.

Esta calculadora permite a cualquier particular, amigo o familiar conocer en segundos:
1. **Precio Factura en Concesionario:** Tras descontar las campañas oficiales de marca, los 1.000 € obligatorios del concesionario por el Plan Auto+, posibles descuentos por financiación y los 950 € del Certificado de Ahorro Energético (CAE).
2. **Subvención Estatal Plan Auto+ (RD 609/2026):** Hasta **4.500 €** de ayuda directa según motorización (BEV vs PHEV), precio sin IVA (tramo <35k € o 35k-45k €) y origen de ensamblaje o batería en la Unión Europea (+675 € / +450 €).
3. **Deducción del 15% en el IRPF (DA 58ª LIRPF):** Hasta **3.000 €** de devolución en la declaración de la Renta, calculada con la **Cuota Íntegra Estatal real** según el sueldo bruto anual del comprador.
4. **Hachazo Fiscal Autonómico:** La subvención del Plan Auto+ tributa como ganancia patrimonial no exenta. En Cataluña se paga más IRPF por la ayuda que en Aragón debido a sus tramos autonómicos.
5. **Venta Privada del Coche Antiguo + CAE:** Cómo vender un vehículo usado a otro particular cobrando el importe íntegro de mercado y además beneficiarse de los 950 € del CAE (sin necesidad de achatarrar).

---

## 🔍 Novedad: Sistema Integral de Filtros en la Tabla Maestra (53 Modelos)

En la parte inferior de la web encontrarás el **Catálogo y Comparador Maestro**, que incluye la gama completa 2026 de **BYD** (30 versiones), **Tesla** (12 versiones), **MG** (6 versiones), **Leapmotor**, **Geely** y **Omoda**.

### Filtros disponibles:
- **Filtro de Marcas:** Selecciona rápidamente una marca (BYD, Tesla, MG, Leapmotor, Geely, Omoda) o visualízalas todas juntas.
- **Rango de Precios Interactivo:**
  - Elige sobre qué concepto quieres filtrar:
    - *Precio Neto Final en Aragón* (el coste real más bajo).
    - *Precio Neto Final en Cataluña*.
    - *Precio Factura en Concesionario*.
    - *PVP Oficial de Tarifa*.
  - Presets de 1 clic: `< 20.000 €`, `20.000 € - 30.000 €`, `30.000 € - 40.000 €`, `40.000 € - 50.000 €`, `> 50.000 €`.
  - Inputs manuales de **Precio Mínimo (€)** y **Precio Máximo (€)** para búsquedas exactas.
- **Tipo de Motorización:**
  - *Todos los modelos* (BEV + PHEV).
  - *Solo 100% Eléctricos (BEV)*.
  - *Solo Híbridos Enchufables (PHEV)*.
- **Autonomía WLTP Mínima:** Filtra coches con `≥ 300 km`, `≥ 400 km` o `≥ 500 km` de autonomía homologada.
- **Filtros Normativos:**
  - *Solo elegibles Plan Auto+:* Excluye automáticamente vehículos con precio base superior a 45.000 € sin IVA.
  - *Solo con fabricación en la UE:* Muestra modelos que suman los +675 € del incentivo industrial europeo.
- **Buscador en Vivo:** Escribe cualquier palabra clave (ej. `Seal`, `Model 3`, `Long Range`, `Comfort`, `Standard`).
- **Ordenación por Columnas:** Haz clic en cualquier cabecera (Marca, Autonomía WLTP, PVP, Factura, Neto Aragón, Neto Cataluña) para ordenar de menor a mayor o viceversa.
- **Selección Rápida:** Haz clic sobre cualquier fila de la tabla para que se cargue arriba en los bloques detallados de cálculo y análisis fiscal.

---

## 🚀 Cómo Publicar la Web Gratis (0€ Budget) para Enviarla a Familiares y Amigos

El proyecto está construido sobre **Vite + React + Tailwind CSS**, generando archivos estáticos HTML/JS/CSS ultra ligeros y optimizados en la carpeta `dist/`.

### Opción A: Despliegue en Vercel (Recomendado, 2 minutos)
1. Sube este repositorio a tu cuenta de GitHub:
   ```bash
   git add .
   git commit -m "feat: calculadora vehiculos electricos espana 2026 con filtros avanzados"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/comparativa-electricos-2026.git
   git push -u origin main
   ```
2. Entra en [vercel.com](https://vercel.com) e inicia sesión gratis con GitHub.
3. Pulsa en **"Add New Project"** e importa tu repositorio.
4. Deja la configuración por defecto (Framework Preset: **Vite**, Build Command: `npm run build`, Output Directory: `dist`).
5. Haz clic en **"Deploy"**. En 30 segundos tendrás un enlace público HTTPS (ej. `https://comparativa-electricos-2026.vercel.app`) para compartir por WhatsApp.

### Opción B: Despliegue directo por terminal con Vercel CLI (Sin Git)
```bash
npx vercel
```
Sigue los 3 pasos interactivos que pide la terminal y te devolverá la URL pública en vivo.

### Opción C: Despliegue en Cloudflare Pages
1. Compila el proyecto localmente:
   ```bash
   npm run build
   ```
2. Entra en [dash.cloudflare.com](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages**.
3. Arrastra la carpeta `dist/` generada y pulsa **Deploy site**. Tendrás tu web en un dominio `.pages.dev` gratuito de por vida.

---

## 💻 Ejecución y Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo local
npm run dev
# Abrir http://localhost:3000

# 3. Comprobar tipado estricto
npx tsc --noEmit

# 4. Compilar para producción
npm run build

# 5. Previsualizar la compilación de producción
npm run preview
```

---

## 🏛️ Marco Legal y Criterios Fiscales Aplicados (2026)
- **Plan Auto+ (RD 609/2026):** Subvención estatal máxima de 4.500 € (50% motorización BEV, 25% precio ≤35k € s/IVA, 15% montaje UE, 10% batería UE). Exclusión total a vehículos cuya base imponible supere los 45.000 € sin IVA.
- **Deducción 15% IRPF (DA 58ª Ley IRPF):** Base máxima 20.000 € (restando subvenciones públicas concedidas). Condicionada a la Cuota Íntegra Estatal del ejercicio fiscal 2026 según los rendimientos netos del trabajo (Art. 19 y Art. 20 LIRPF).
- **Certificado CAE (Ficha TRA050.P):** Bonificación privada de 950 € en la factura del concesionario por sustitución voluntaria de vehículo de combustión.
- **Escalas Autonómicas de IRPF:** Cataluña (10,5% a 21,5% hasta 53.407 €) vs Aragón (9,5% a 20,5% hasta 52.500 €).
