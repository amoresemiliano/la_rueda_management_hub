import { addDaysISO, formatDateAR, todayISO } from '../utils/formatters';

export interface SampleTemplateDef {
  id: string;
  label: string;
  sourceProfile: 'maxirest' | 'holistor' | 'etiquetera' | 'otro';
  dataset: 'sales' | 'expenses' | 'products';
  fileName: string;
  description: string;
  buildContent: () => string;
}

export const SAMPLE_IMPORT_TEMPLATES: SampleTemplateDef[] = [
  {
    id: 'tpl-maxirest-sales',
    label: 'Plantilla Ventas MaxiRest (CSV sintético)',
    sourceProfile: 'maxirest',
    dataset: 'sales',
    fileName: 'ejemplo_maxirest_ventas_larueda_demo.csv',
    description:
      'Incluye fecha DD/MM/YYYY, turno, comandas, comensales, cubiertos, facturación en formato argentino y código de lote para deduplicación.',
    buildContent: () => {
      const d1 = formatDateAR(addDaysISO(todayISO(), 1));
      const d2 = formatDateAR(addDaysISO(todayISO(), 2));
      return [
        'ID_Lote;Fecha;Turno;Comandas;Comensales;Cubiertos;Facturacion_ARS',
        `MR-DEMO-9001;${d1};mediodia;52;142;134;4.850.200,00`,
        `MR-DEMO-9002;${d1};noche;74;214;205;7.620.500,50`,
        `MR-DEMO-9003;${d2};mediodia;58;164;155;5.410.800,00`,
        `MR-DEMO-9004;${d2};noche;81;232;221;8.390.150,00`
      ].join('\n');
    }
  },
  {
    id: 'tpl-holistor-expenses',
    label: 'Plantilla Gastos Holistor (CSV sintético)',
    sourceProfile: 'holistor',
    dataset: 'expenses',
    fileName: 'ejemplo_holistor_gastos_larueda_demo.csv',
    description:
      'Comprobantes de compras y egresos operativos con importes en ARS y separadores decimales argentinos.',
    buildContent: () => {
      const d0 = formatDateAR(todayISO());
      return [
        'Fecha_Comprobante;Rubro;Proveedor;Detalle;Importe_Total',
        `${d0};Mercadería — Carnes;Frigorífico del Litoral (Demo);Remito sintético R-00412;1.450.000,00`,
        `${d0};Bebidas y Cava;Bodegas y Bebidas del Norte (Demo);Reposición vinos Malbec;820.500,00`,
        `${d0};Mantenimiento;Refrigeración Iguazú (Demo);Service preventivo cámara 2;295.000,00`
      ].join('\n');
    }
  },
  {
    id: 'tpl-ticketera-products',
    label: 'Plantilla Actualización de Stock / Productos (CSV)',
    sourceProfile: 'etiquetera',
    dataset: 'products',
    fileName: 'ejemplo_catalogo_productos_demo.csv',
    description:
      'Alta o actualización de referencia de costo y stock mínimo para productos de depósito.',
    buildContent: () =>
      [
        'SKU;Nombre;Categoria;Unidad;Stock_Minimo;Stock_Actual;Costo_Ref_ARS',
        'LR-950;Salsa Criolla Envasada Demo;insumos_produccion;lt;10;14;4.200,00',
        'LR-951;Pan de Campo Artesanal Demo;insumos_produccion;kg;15;22;3.150,50'
      ].join('\n')
  }
];
