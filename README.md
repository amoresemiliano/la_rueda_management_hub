# La Rueda 1975 — Management Hub (VEGEN Digital)

Plataforma operativa y gerencial de demostración para **La Rueda 1975** (Puerto Iguazú, Misiones, Argentina · ~65 colaboradores · 250 cubiertos simultáneos), construida en **React + TypeScript + Vite + Tailwind CSS**, lista para despliegue en **Vercel** y diseñada con desacoplamiento de repositorio para futura integración con **Bluehost (PHP + MySQL/MariaDB)**.

> **Modo demostración:** Todos los registros (personas, legajos `DEMO-ID-*`, proveedores `CUIT-DEMO-*`, precios, ventas y sueldos) son **100% sintéticos** y se persisten localmente en el navegador vía **IndexedDB** (con respaldo en `localStorage`).

---

## Módulos implementados

1. **Inicio (Dashboard Ejecutivo):** KPIs en tiempo real derivados del estado único, gráfico de ventas 7 días, cobertura de dotación del día, alertas operativas accionables y actividad reciente.
2. **Organización:**
   - Organigrama interactivo por sectores y puestos con enlace directo a legajos.
   - Calendario de dotación y turnos (incluye puestos temporales, detección de déficit mínimo y sincronización automática de ausencias con Personal).
   - Motor de procedimientos y checklists digitales con trazabilidad explícita de 4 actores (`Asignado / Realizado / Registrado / Verificado`), historial inmutable sin sobrescritura silenciosa y gestión de discrepancias operativas.
   - Biblioteca digital de manuales con carga real de archivos locales en IndexedDB (límite 2 MB en demo), vista previa y descarga.
3. **Gestión:**
   - Dashboard gerencial, análisis de ventas y comensales, y planificación transparente de demanda (reservas, grupos turísticos, feriados).
   - Ingeniería de menú (matriz BCG de 4 cuadrantes) con clasificación explícita `"Datos insuficientes"` para platos sin costo de receta verificado.
   - Circuito digital de compras de 10 estados: Solicitud de sector → Verificación física de stock (René) → Aprobación gerencial (Pablo) → Generación automática de Órdenes de Compra por proveedor → Descarga real de **PDF (`jsPDF`)**, impresión, enlaces preparados de WhatsApp/Email y Recepción de mercadería con impacto automático en inventario.
   - Catálogo de inventario (90 insumos sintéticos), movimientos y módulo dedicado de **Mermas de proceso vs. Desperdicios**, con enlace 1:1 a movimientos de stock (cero doble conteo) y manejo seguro de productos sin costo de referencia (`costReferenceArs: null`).
   - Centro de Importación de Datos (CSV, XLSX, TXT) con mapeo de columnas, perfiles MaxiRest/Holistor, parseo argentino de fechas y números, detección de duplicados por fingerprint y plantillas descargables.
4. **Personal:**
   - Directorio de 65 colaboradores sintéticos y **Legajo Digital de 10 pestañas**.
   - Transferencia de puesto/sector conservando historial completo de asignaciones previas.
   - Parte semanal digital de novedades (horas extra, tardanzas, ausencias, francos compensatorios).
   - Vacaciones y licencias con descuento automático de saldo al aprobar.
   - Registro separado de desempeño/reconocimientos y medidas disciplinarias, además de capacitaciones.
   - Préstamos y adelantos al personal sincronizados con la **Pre-liquidación semanal y propinas** (exportable a PDF, con descargo explícito de herramienta de gestión sin ejecución automática de pagos).
5. **Administración:**
   - Selector interactivo de 7 roles de demostración y matriz de permisos.
   - Registro de auditoría de solo anexado.
   - Especificación de arquitectura futura Bluehost PHP/MySQL y roadmap conceptual de IA.
   - Exportación JSON del estado local y botón **Restablecer datos de demostración**.

---

## Implementado en Demo vs. Limitaciones del Entorno Demo

| Capacidad | Estado en Demo | Producción futura (Bluehost PHP/MySQL) |
|---|---|---|
| Persistencia entre recargas | Real (IndexedDB local en navegador) | Base relacional MySQL/MariaDB con backups diarios |
| Generación de PDF (OC y Pre-liquidación) | Real en cliente (`jsPDF`) | Generación server-side archivada y firmada |
| Importación CSV / XLSX / TXT + deduplicación | Real en cliente (`xlsx` + fingerprint) | Importador por lotes PHP con transacciones ACID |
| Carga de documentos / manuales | Real en IndexedDB (tope 2 MB) | Almacenamiento privado fuera de `public_html` |
| Envío WhatsApp / Email de OC | Abre mensaje preformateado (adjunto PDF manual) | Despacho SMTP / WhatsApp Business API con PDF adjunto |
| Roles y permisos (RBAC) | En cliente (fines demostrativos) | Sesiones HTTP-only + validación estricta en servidor |
| Modelos de IA / predicción automática | No activo (analítica determinista) | Roadmap conceptual documentado en Administración |

---

## Especificación de arquitectura futura (Bluehost PHP + MySQL/MariaDB)

La capa de acceso a datos implementa la interfaz `IDataRepository` (`src/repositories/demoRepository.ts`), permitiendo reemplazar `IndexedDBDemoRepository` por un `HttpApiRepository` contra una API REST PHP 8.2+ sin reescribir la interfaz:

- **Endpoints REST sugeridos:** `/api/v1/auth`, `/api/v1/sectors`, `/api/v1/positions`, `/api/v1/employees`, `/api/v1/shift-assignments`, `/api/v1/checklists`, `/api/v1/discrepancies`, `/api/v1/documents`, `/api/v1/products`, `/api/v1/purchase-requests`, `/api/v1/purchase-orders`, `/api/v1/goods-receipts`, `/api/v1/inventory-movements`, `/api/v1/loss-events`, `/api/v1/imports`, `/api/v1/loans`, `/api/v1/payroll-periods`, `/api/v1/audit-events`.
- **Integridad relacional:** Claves foráneas estrictas, tabla de historial `employee_assignments`, relación 1:1 opcional entre `loss_events` e `inventory_movements`, y `UNIQUE(file_fingerprint)` / `UNIQUE(row_fingerprint)` para idempotencia de importaciones.
- **Seguridad:** Contraseñas con `PASSWORD_ARGON2ID`, prepared statements PDO, autorización server-side por rol y auditoría append-only en cada mutación.

---

## Desarrollo local y despliegue en Vercel

```bash
npm install
npm run dev
npm run build
```

El archivo `vercel.json` incluye las reglas de rewrite SPA necesarias para despliegue directo en Vercel.

---

*Tecnología y transformación digital por VEGEN.*
