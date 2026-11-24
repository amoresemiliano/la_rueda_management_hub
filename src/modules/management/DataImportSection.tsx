import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SAMPLE_IMPORT_TEMPLATES } from '../../data/sampleTemplates';
import {
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { CanonicalDataset, Expense, ImportSourceProfile, Product, Sale } from '../../domain/types';
import { useAppStore } from '../../services/store';
import {
  createFingerprint,
  createId,
  downloadTextFile,
  formatARS,
  formatDateTimeAR,
  parseArgentineDate,
  parseArgentineNumber
} from '../../utils/formatters';

interface CanonicalFieldSpec {
  key: string;
  label: string;
  required: boolean;
}

const DATASET_FIELDS: Record<CanonicalDataset, CanonicalFieldSpec[]> = {
  sales: [
    { key: 'operationalDate', label: 'Fecha operativa (DD/MM/YYYY o YYYY-MM-DD)', required: true },
    { key: 'totalRevenueArs', label: 'Facturación total (ARS)', required: true },
    { key: 'guestsCount', label: 'Comensales', required: true },
    { key: 'coversSold', label: 'Cubiertos vendidos', required: false },
    { key: 'ticketsCount', label: 'Cantidad de comandas / tickets', required: false },
    { key: 'shiftType', label: 'Turno (mediodia / noche)', required: false },
    { key: 'externalId', label: 'ID único externo / Lote (recomendado)', required: false }
  ],
  expenses: [
    { key: 'operationalDate', label: 'Fecha comprobante', required: true },
    { key: 'category', label: 'Rubro / Categoría', required: true },
    { key: 'supplierName', label: 'Proveedor', required: true },
    { key: 'description', label: 'Detalle / Comprobante', required: false },
    { key: 'amountArs', label: 'Importe total (ARS)', required: true }
  ],
  products: [
    { key: 'sku', label: 'SKU / Código', required: true },
    { key: 'name', label: 'Nombre de producto', required: true },
    { key: 'categoryId', label: 'Categoría', required: false },
    { key: 'baseUnit', label: 'Unidad base (kg, lt, un)', required: false },
    { key: 'minStock', label: 'Stock mínimo', required: false },
    { key: 'currentStock', label: 'Stock actual', required: true },
    { key: 'costReferenceArs', label: 'Costo de referencia (ARS)', required: false }
  ],
  purchases: [
    { key: 'operationalDate', label: 'Fecha', required: true },
    { key: 'supplierName', label: 'Proveedor', required: true },
    { key: 'amountArs', label: 'Importe', required: true }
  ],
  inventory_movements: [
    { key: 'operationalDate', label: 'Fecha', required: true },
    { key: 'sku', label: 'SKU', required: true },
    { key: 'quantityDelta', label: 'Cantidad', required: true }
  ]
};

export const DataImportSection: React.FC = () => {
  const { data, commitDataImport, notify } = useAppStore();

  const [sourceProfile, setSourceProfile] = useState<ImportSourceProfile>('maxirest');
  const [dataset, setDataset] = useState<CanonicalDataset>('sales');
  const [fileName, setFileName] = useState('');
  const [fileFingerprint, setFileFingerprint] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [saveProfileName, setSaveProfileName] = useState('');
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);

  const canonicalFields = DATASET_FIELDS[dataset];

  const autoMapColumns = (detectedHeaders: string[], targetDataset: CanonicalDataset) => {
    const map: Record<string, string> = {};
    const lowerMap = new Map(detectedHeaders.map((h) => [h.toLowerCase().trim(), h]));

    // Try saved profile first
    const saved = data.importMappings.find(
      (m) => m.sourceProfile === sourceProfile && m.dataset === targetDataset
    );
    if (saved) {
      Object.entries(saved.columnMap).forEach(([k, col]) => {
        if (detectedHeaders.includes(col)) map[k] = col;
      });
    }

    const hints: Record<string, string[]> = {
      operationalDate: ['fecha', 'fecha_comprobante', 'date', 'dia'],
      totalRevenueArs: ['facturacion_ars', 'facturacion', 'total', 'importe', 'venta'],
      guestsCount: ['comensales', 'pax', 'clientes', 'guests'],
      coversSold: ['cubiertos', 'platos'],
      ticketsCount: ['comandas', 'tickets', 'mesas'],
      shiftType: ['turno', 'shift'],
      externalId: ['id_lote', 'id', 'comprobante', 'lote', 'codigo'],
      category: ['rubro', 'categoria', 'category'],
      supplierName: ['proveedor', 'supplier'],
      description: ['detalle', 'descripcion', 'concepto'],
      amountArs: ['importe_total', 'importe', 'monto', 'total'],
      sku: ['sku', 'codigo'],
      name: ['nombre', 'producto'],
      categoryId: ['categoria', 'rubro'],
      baseUnit: ['unidad', 'um'],
      minStock: ['stock_minimo', 'minimo'],
      currentStock: ['stock_actual', 'stock'],
      costReferenceArs: ['costo_ref_ars', 'costo']
    };

    DATASET_FIELDS[targetDataset].forEach((field) => {
      if (map[field.key]) return;
      const candidates = hints[field.key] ?? [field.key.toLowerCase()];
      for (const c of candidates) {
        const hit = lowerMap.get(c);
        if (hit) {
          map[field.key] = hit;
          break;
        }
      }
    });

    setColumnMap(map);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder('utf-8');
      const isTextLike = /\.(csv|txt)$/i.test(file.name);

      let rows: Record<string, unknown>[] = [];
      let detectedHeaders: string[] = [];

      if (isTextLike) {
        const rawText = textDecoder.decode(buffer);
        const firstLine = rawText.split(/\r?\n/)[0] ?? '';
        const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
        const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          notify('El archivo no contiene filas de datos.', 'warning');
          return;
        }
        detectedHeaders = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
        rows = lines.slice(1).map((line) => {
          const vals = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
          const obj: Record<string, unknown> = {};
          detectedHeaders.forEach((h, idx) => {
            obj[h] = vals[idx] ?? '';
          });
          return obj;
        });
        setFileFingerprint(createFingerprint(`${file.name}:${rawText}`));
      } else {
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        detectedHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
        setFileFingerprint(createFingerprint(`${file.name}:${JSON.stringify(rows.slice(0, 50))}`));
      }

      if (detectedHeaders.length === 0) {
        notify('No se pudieron detectar columnas en el archivo.', 'error');
        return;
      }

      setFileName(file.name);
      setHeaders(detectedHeaders);
      setRawRows(rows);
      autoMapColumns(detectedHeaders, dataset);
      setStep('map');
    } catch {
      notify('Error al leer el archivo. Verificá que sea CSV, XLSX o TXT válido.', 'error');
    }
  };

  // Validate & normalize preview rows
  const validationPreview = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const existingSaleFps = new Set(data.sales.map((s) => s.fingerprint).filter(Boolean));
    const existingBatchFps = new Set(data.importBatches.map((b) => b.fileFingerprint));

    if (fileFingerprint && existingBatchFps.has(fileFingerprint)) {
      warnings.push(
        'Este mismo archivo ya fue importado anteriormente (coincidencia de huella digital). Los registros duplicados serán omitidos.'
      );
    }

    if (dataset === 'sales' && !columnMap.externalId) {
      warnings.push(
        'Advertencia de riesgo de duplicación: el archivo no mapeó un identificador externo único (ID_Lote). Se usará fecha + turno + monto como huella aproximada.'
      );
    }

    const normalizedSales: Sale[] = [];
    const normalizedExpenses: Expense[] = [];
    const normalizedProducts: Product[] = [];
    let skippedDuplicateRows = 0;
    let errorRows = 0;

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      if (dataset === 'sales') {
        const opDate = parseArgentineDate(row[columnMap.operationalDate]);
        const rev = parseArgentineNumber(row[columnMap.totalRevenueArs]);
        const guests = parseArgentineNumber(row[columnMap.guestsCount]);
        const covers = columnMap.coversSold ? parseArgentineNumber(row[columnMap.coversSold]) : { value: guests.value, ambiguous: false };
        const tickets = columnMap.ticketsCount ? parseArgentineNumber(row[columnMap.ticketsCount]) : { value: null, ambiguous: false };

        if (!opDate) {
          errors.push(`Fila ${rowNum}: Fecha inválida o ausente.`);
          errorRows++;
          return;
        }
        if (rev.ambiguous || guests.ambiguous) {
          errors.push(`Fila ${rowNum}: Número ambiguo detectado (no se reinterpreta silenciosamente).`);
          errorRows++;
          return;
        }
        if (rev.value === null || guests.value === null) {
          errors.push(`Fila ${rowNum}: Facturación o Comensales faltantes.`);
          errorRows++;
          return;
        }

        const shiftRaw = String(row[columnMap.shiftType] ?? 'noche').toLowerCase();
        const shiftType: 'mediodia' | 'noche' = shiftRaw.includes('medio') ? 'mediodia' : 'noche';
        const extId = columnMap.externalId ? String(row[columnMap.externalId] ?? '').trim() : '';
        const fp = extId
          ? `ext-${sourceProfile}-${extId}`
          : createFingerprint(`sale-${opDate}-${shiftType}-${rev.value}-${guests.value}`);

        if (existingSaleFps.has(fp) || normalizedSales.some((s) => s.fingerprint === fp)) {
          skippedDuplicateRows++;
          return;
        }

        normalizedSales.push({
          id: createId('sale-imp'),
          operationalDate: opDate,
          shiftType,
          ticketsCount: tickets.value ? Math.round(tickets.value) : Math.max(1, Math.round(guests.value / 2.7)),
          guestsCount: Math.round(guests.value),
          coversSold: covers.value ? Math.round(covers.value) : Math.round(guests.value),
          totalRevenueArs: rev.value,
          lines: [],
          source:
            sourceProfile === 'maxirest'
              ? 'import_maxirest'
              : sourceProfile === 'holistor'
                ? 'import_holistor'
                : 'import_csv',
          fingerprint: fp
        });
      } else if (dataset === 'expenses') {
        const opDate = parseArgentineDate(row[columnMap.operationalDate]);
        const amount = parseArgentineNumber(row[columnMap.amountArs]);
        const cat = String(row[columnMap.category] ?? '').trim();
        const sup = String(row[columnMap.supplierName] ?? '').trim();
        const desc = String(row[columnMap.description] ?? '').trim();

        if (!opDate || amount.value === null || amount.ambiguous || !cat || !sup) {
          errors.push(`Fila ${rowNum}: Faltan campos requeridos o formato numérico ambiguo.`);
          errorRows++;
          return;
        }

        const duplicateExp = data.expenses.some(
          (e) =>
            e.operationalDate === opDate &&
            e.supplierName === sup &&
            e.amountArs === amount.value &&
            e.description === (desc || cat)
        );
        if (duplicateExp) {
          skippedDuplicateRows++;
          return;
        }

        normalizedExpenses.push({
          id: createId('exp-imp'),
          operationalDate: opDate,
          category: cat,
          supplierName: sup,
          description: desc || cat,
          amountArs: amount.value,
          source: 'import_holistor'
        });
      } else if (dataset === 'products') {
        const sku = String(row[columnMap.sku] ?? '').trim();
        const name = String(row[columnMap.name] ?? '').trim();
        const stock = parseArgentineNumber(row[columnMap.currentStock]);
        const minSt = columnMap.minStock ? parseArgentineNumber(row[columnMap.minStock]) : { value: 5, ambiguous: false };
        const cost = columnMap.costReferenceArs ? parseArgentineNumber(row[columnMap.costReferenceArs]) : { value: null, ambiguous: false };

        if (!sku || !name || stock.value === null || stock.ambiguous) {
          errors.push(`Fila ${rowNum}: SKU, Nombre o Stock actual inválido.`);
          errorRows++;
          return;
        }

        normalizedProducts.push({
          id: createId('prod-imp'),
          sku,
          name,
          categoryId: 'insumos_produccion',
          subcategory: 'Importado',
          baseUnit: 'un',
          purchaseUnit: 'un',
          conversionFactor: 1,
          minStock: minSt.value ?? 5,
          currentStock: stock.value,
          costReferenceArs: cost.value,
          supplierId: 'sup-almacen',
          locationId: 'loc-secos',
          active: true,
          updatedAt: new Date().toISOString()
        });
      }
    });

    return {
      errors,
      warnings,
      normalizedSales,
      normalizedExpenses,
      normalizedProducts,
      skippedDuplicateRows,
      errorRows
    };
  }, [rawRows, columnMap, dataset, sourceProfile, fileFingerprint, data.sales, data.expenses, data.importBatches]);

  const handleConfirmImport = () => {
    const batch = commitDataImport({
      sourceProfile,
      dataset,
      fileName,
      fileFingerprint,
      totalRows: rawRows.length,
      newSales: dataset === 'sales' ? validationPreview.normalizedSales : undefined,
      newExpenses: dataset === 'expenses' ? validationPreview.normalizedExpenses : undefined,
      newProducts: dataset === 'products' ? validationPreview.normalizedProducts : undefined,
      skippedDuplicateRows: validationPreview.skippedDuplicateRows,
      errorRows: validationPreview.errorRows,
      warnings: validationPreview.warnings,
      saveMapping: saveProfileName.trim()
        ? { name: saveProfileName.trim(), columnMap }
        : undefined
    });
    setLastBatchId(batch.id);
    setStep('done');
  };

  const resetWizard = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setColumnMap({});
    setSaveProfileName('');
  };

  const lastBatch = data.importBatches.find((b) => b.id === lastBatchId);

  return (
    <div className="space-y-6">
      {/* Sample Templates Download Bar */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFECE5]">
          <div>
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Centro de Importación de Datos (CSV, XLSX, TXT)
            </h3>
            <p className="text-xs text-[#5E5851]">
              Compatible con MaxiRest, Holistor y etiqueteras mediante mapeo flexible de columnas, validación argentina y deduplicación por huella.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_IMPORT_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md flex flex-col justify-between gap-2.5">
              <div>
                <div className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#7C2D36] shrink-0" />
                  {tpl.label}
                </div>
                <p className="mt-1 text-[11px] text-[#5E5851] leading-snug">{tpl.description}</p>
              </div>
              <button
                type="button"
                onClick={() => downloadTextFile(tpl.fileName, tpl.buildContent())}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar plantilla de ejemplo
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Import Workspace */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-xs border-b border-[#EFECE5] pb-3">
          {[
            { id: 'upload', label: '1. Origen y archivo' },
            { id: 'map', label: '2. Mapeo de columnas' },
            { id: 'preview', label: '3. Validación y vista previa' },
            { id: 'done', label: '4. Resultado' }
          ].map((s) => (
            <span
              key={s.id}
              className={
                step === s.id ? 'font-semibold text-[#7C2D36]' : 'text-[#8C847A]'
              }
            >
              {s.label}
            </span>
          ))}
        </div>

        {step === 'upload' && (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Perfil de sistema origen *</label>
                <select
                  value={sourceProfile}
                  onChange={(e) => setSourceProfile(e.target.value as ImportSourceProfile)}
                  className={inputClass}
                >
                  <option value="maxirest">MaxiRest</option>
                  <option value="holistor">Holistor</option>
                  <option value="etiquetera">Etiquetera / Ticketera</option>
                  <option value="otro">Otro archivo autorizado</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Conjunto de datos destino *</label>
                <select
                  value={dataset}
                  onChange={(e) => setDataset(e.target.value as CanonicalDataset)}
                  className={inputClass}
                >
                  <option value="sales">Ventas diarias / turnos</option>
                  <option value="expenses">Gastos y comprobantes</option>
                  <option value="products">Productos y referencias de stock</option>
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-[#D6D0C4] rounded-lg p-6 text-center bg-[#F8F7F4]">
              <Upload className="w-6 h-6 text-[#7C2D36] mx-auto" />
              <p className="mt-2 text-sm font-medium text-[#1C1917]">
                Seleccioná un archivo CSV, XLSX o TXT
              </p>
              <p className="mt-1 text-xs text-[#5E5851]">
                Podés descargar cualquiera de las plantillas de arriba y subirla aquí para probar la actualización en vivo del tablero gerencial.
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="mt-4 inline-block text-xs text-[#5E5851] file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#7C2D36] file:text-white file:font-medium hover:file:bg-[#632129] file:cursor-pointer"
              />
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[#5E5851]">
                Archivo: <strong className="text-[#1C1917]">{fileName}</strong> ·{' '}
                <strong className="font-mono">{rawRows.length}</strong> filas detectadas ·{' '}
                <strong className="font-mono">{headers.length}</strong> columnas
              </div>
              <button type="button" onClick={resetWizard} className="text-xs text-[#7C2D36] hover:underline cursor-pointer">
                Cambiar archivo
              </button>
            </div>

            {/* Raw Preview (First 3 rows) */}
            <div className="overflow-x-auto border border-[#E6E2D8] rounded">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F8F7F4] border-b border-[#E6E2D8] text-left">
                    {headers.map((h) => (
                      <th key={h} className="py-2 px-3 font-medium text-[#5E5851]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9]">
                  {rawRows.slice(0, 3).map((r, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="py-2 px-3 font-mono text-[#1C1917]">
                          {String(r[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Column Mapping Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {canonicalFields.map((field) => (
                <div key={field.key} className="p-3 border border-[#E6E2D8] rounded-md">
                  <label className={labelClass}>
                    {field.label} {field.required && <span className="text-[#B91C1C]">*</span>}
                  </label>
                  <select
                    value={columnMap[field.key] ?? ''}
                    onChange={(e) =>
                      setColumnMap((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">— No mapear —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="max-w-md">
              <label className={labelClass}>Guardar este perfil de mapeo para futuras importaciones (opcional)</label>
              <input
                type="text"
                value={saveProfileName}
                onChange={(e) => setSaveProfileName(e.target.value)}
                placeholder="Ej. Exportación semanal MaxiRest Caja 1"
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
              <button type="button" onClick={resetWizard} className={secondaryBtnClass}>
                Volver
              </button>
              <button type="button" onClick={() => setStep('preview')} className={primaryBtnClass}>
                Validar y previsualizar registros
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#F8F7F4] border border-[#E6E2D8] rounded">
                <div className="text-[#5E5851]">Filas leídas</div>
                <div className="mt-0.5 text-lg font-mono font-semibold">{rawRows.length}</div>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-[#E6E2D8] rounded">
                <div className="text-[#5E5851]">Nuevos válidos</div>
                <div className="mt-0.5 text-lg font-mono font-semibold text-[#15803D]">
                  {dataset === 'sales'
                    ? validationPreview.normalizedSales.length
                    : dataset === 'expenses'
                      ? validationPreview.normalizedExpenses.length
                      : validationPreview.normalizedProducts.length}
                </div>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-[#E6E2D8] rounded">
                <div className="text-[#5E5851]">Duplicados omitidos</div>
                <div className="mt-0.5 text-lg font-mono font-semibold text-[#B45309]">
                  {validationPreview.skippedDuplicateRows}
                </div>
              </div>
              <div className="p-3 bg-[#F8F7F4] border border-[#E6E2D8] rounded">
                <div className="text-[#5E5851]">Errores / ambiguos</div>
                <div className="mt-0.5 text-lg font-mono font-semibold text-[#B91C1C]">
                  {validationPreview.errorRows}
                </div>
              </div>
            </div>

            {validationPreview.warnings.length > 0 && (
              <div className="p-3.5 border border-[#B45309]/40 bg-[#B45309]/5 rounded-md space-y-1">
                {validationPreview.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-[#B45309] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}

            {validationPreview.errors.length > 0 && (
              <div className="p-3.5 border border-[#B91C1C]/40 bg-[#B91C1C]/5 rounded-md space-y-1">
                {validationPreview.errors.slice(0, 6).map((err, i) => (
                  <p key={i} className="text-xs text-[#B91C1C]">
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Normalized Sales Preview */}
            {dataset === 'sales' && validationPreview.normalizedSales.length > 0 && (
              <div className="overflow-x-auto border border-[#E6E2D8] rounded">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F4] border-b border-[#E6E2D8] text-left">
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Turno</th>
                      <th className="py-2 px-3 text-right">Comensales</th>
                      <th className="py-2 px-3 text-right">Facturación ARS</th>
                      <th className="py-2 px-3">Huella deduplicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EFE9]">
                    {validationPreview.normalizedSales.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 px-3 font-mono">{s.operationalDate}</td>
                        <td className="py-2 px-3">{s.shiftType}</td>
                        <td className="py-2 px-3 text-right font-mono">{s.guestsCount}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {formatARS(s.totalRevenueArs, true)}
                        </td>
                        <td className="py-2 px-3 font-mono text-[#5E5851]">{s.fingerprint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
              <button type="button" onClick={() => setStep('map')} className={secondaryBtnClass}>
                Ajustar mapeo
              </button>
              <button type="button" onClick={handleConfirmImport} className={primaryBtnClass}>
                Confirmar importación
              </button>
            </div>
          </div>
        )}

        {step === 'done' && lastBatch && (
          <div className="p-5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md space-y-3">
            <div className="flex items-center gap-2 text-[#15803D] font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Importación registrada ({lastBatch.id})
            </div>
            <p className="text-xs text-[#1C1917]">
              Archivo <strong>{lastBatch.fileName}</strong>: {lastBatch.importedRows} registro(s) incorporado(s),{' '}
              {lastBatch.skippedDuplicateRows} duplicado(s) omitido(s), {lastBatch.errorRows} fila(s) con error.
              Los tableros de Gestión ya reflejan los datos actualizados.
            </p>
            <button type="button" onClick={resetWizard} className={secondaryBtnClass}>
              Realizar otra importación
            </button>
          </div>
        )}
      </div>

      {/* Import History Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] text-xs font-semibold text-[#1C1917]">
          Historial de lotes importados ({data.importBatches.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E2D8] text-left text-xs text-[#5E5851]">
                <th className="py-2.5 px-4 font-medium">Fecha y hora</th>
                <th className="py-2.5 px-4 font-medium">Archivo / Origen</th>
                <th className="py-2.5 px-4 font-medium text-right">Importados</th>
                <th className="py-2.5 px-4 font-medium text-right">Duplicados</th>
                <th className="py-2.5 px-4 font-medium text-right">Errores</th>
                <th className="py-2.5 px-4 font-medium text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {data.importBatches.map((b) => (
                <tr key={b.id}>
                  <td className="py-2.5 px-4 font-mono text-xs">{formatDateTimeAR(b.importedAt)}</td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-[#1C1917] text-xs">{b.fileName}</div>
                    <div className="text-[11px] text-[#5E5851]">
                      {b.sourceProfile.toUpperCase()} · {b.dataset} · Por {b.importedBy}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#15803D] font-semibold">
                    {b.importedRows}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#B45309]">
                    {b.skippedDuplicateRows}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#B91C1C]">
                    {b.errorRows}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <StatusText
                      label={b.status === 'completado' ? 'Completado' : 'Con advertencias'}
                      tone={b.status === 'completado' ? 'positive' : 'warning'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
