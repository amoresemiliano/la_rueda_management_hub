import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, BarChart3, Plus, Scale } from 'lucide-react';
import {
  analyticsLinkClass,
  inputClass,
  KpiCard,
  labelClass,
  Modal,
  operationalSecondaryBtnClass,
  primaryBtnClass,
  secondaryBtnClass,
  sectionTitleClass,
  StatusText
} from '../../components/ui/Primitives';
import { InventoryMovementType, LossType, WasteReason } from '../../domain/types';
import { useAppStore } from '../../services/store';
import {
  formatARS,
  formatDateAR,
  formatDateTimeAR,
  formatNumberAR,
  formatPercent,
  todayISO
} from '../../utils/formatters';

const MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  entrada_compra: 'Entrada por compra',
  salida_consumo: 'Salida a sector',
  ajuste_manual: 'Ajuste manual',
  conteo_fisico: 'Conteo físico',
  transferencia: 'Transferencia de depósito',
  baja_desperdicio: 'Baja por desperdicio',
  merma_proceso: 'Merma de proceso'
};

const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  limpieza_desposte_proceso: 'Limpieza, desposte o porcionado (proceso)',
  descomposicion: 'Descomposición / alteración',
  vencimiento: 'Vencimiento',
  almacenamiento_incorrecto: 'Almacenamiento o frío incorrecto',
  sobreproduccion: 'Sobreproducción',
  error_preparacion: 'Error de preparación',
  producto_danado: 'Producto dañado / rotura',
  plato_devuelto: 'Plato devuelto por comensal',
  comanda_erronea: 'Comanda errónea',
  incidente_servicio: 'Incidente en servicio',
  otro: 'Otra causa documentada'
};

export const InventorySection: React.FC = () => {
  const { data, permissions, nav, registerInventoryMovement } = useAppStore();
  const [subView, setSubView] = useState<'catalogo' | 'movimientos'>('catalogo');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [onlyCritical, setOnlyCritical] = useState(Boolean(nav.inventoryOnlyCritical));

  useEffect(() => {
    if (nav.inventoryOnlyCritical !== undefined) {
      setOnlyCritical(nav.inventoryOnlyCritical);
    }
  }, [nav.inventoryOnlyCritical]);

  // Movement modal
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [productId, setProductId] = useState(data.products[0]?.id ?? '');
  const [movType, setMovType] = useState<InventoryMovementType>('salida_consumo');
  const [qtyInput, setQtyInput] = useState<number>(5);
  const [sectorId, setSectorId] = useState('sec-cocina');
  const [destLocationId, setDestLocationId] = useState('');
  const [movDate, setMovDate] = useState(todayISO());
  const [movNotes, setMovNotes] = useState('');

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter((p) => {
      if (categoryFilter !== 'todas' && p.categoryId !== categoryFilter) return false;
      if (onlyCritical && p.currentStock >= p.minStock) return false;
      if (q && !`${p.name} ${p.sku} ${p.subcategory}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.products, search, categoryFilter, onlyCritical]);

  const totalValuation = useMemo(
    () =>
      data.products.reduce(
        (acc, p) => acc + (p.costReferenceArs !== null ? p.currentStock * p.costReferenceArs : 0),
        0
      ),
    [data.products]
  );
  const criticalCount = data.products.filter((p) => p.active && p.currentStock < p.minStock).length;

  const selectedProduct = data.products.find((p) => p.id === productId);

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !movNotes.trim()) return;
    let delta = Number(qtyInput);
    if (movType === 'salida_consumo') {
      delta = -Math.abs(delta);
    } else if (movType === 'entrada_compra') {
      delta = Math.abs(delta);
    }
    registerInventoryMovement({
      productId: selectedProduct.id,
      type: movType,
      quantityDelta: delta,
      locationId: selectedProduct.locationId,
      destinationLocationId: movType === 'transferencia' ? destLocationId || undefined : undefined,
      sectorId,
      operationalDate: movDate,
      notes: movNotes.trim()
    });
    setMovNotes('');
    setMovModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Catálogo activo"
          value={`${data.products.length} insumos`}
          subtitle={`${data.productCategories.length} rubros gastronómicos`}
        />
        <KpiCard
          label="Existencias valorizadas"
          value={formatARS(totalValuation)}
          subtitle="Calculado sobre productos con costo de referencia"
        />
        <KpiCard
          label="Productos bajo stock mínimo"
          value={String(criticalCount)}
          subtitle="Requieren reposición o verificación física"
          tone={criticalCount > 0 ? 'warning' : 'positive'}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('catalogo')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md cursor-pointer ${
              subView === 'catalogo'
                ? 'bg-[#181615] text-white'
                : 'bg-white text-[#5E5851] border border-[#E6E2D8]'
            }`}
          >
            Catálogo de productos ({data.products.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('movimientos')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md cursor-pointer ${
              subView === 'movimientos'
                ? 'bg-[#181615] text-white'
                : 'bg-white text-[#5E5851] border border-[#E6E2D8]'
            }`}
          >
            Historial de movimientos ({data.inventoryMovements.length})
          </button>
        </div>

        {permissions.canManageInventory && (
          <button type="button" onClick={() => setMovModalOpen(true)} className={primaryBtnClass}>
            <ArrowDownUp className="w-4 h-4" />
            Registrar movimiento / conteo
          </button>
        )}
      </div>

      {subView === 'catalogo' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#E6E2D8] bg-[#F8F7F4] flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto o SKU..."
              className={`${inputClass} max-w-xs`}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-xs text-[#1C1917]"
            >
              <option value="todas">Todas las categorías</option>
              {data.productCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={onlyCritical}
                onChange={(e) => setOnlyCritical(e.target.checked)}
                className="accent-[#7C2D36] cursor-pointer"
              />
              Solo stock crítico ({criticalCount})
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6E2D8] text-left text-xs text-[#5E5851]">
                  <th className="py-2.5 px-4 font-medium">Producto / SKU</th>
                  <th className="py-2.5 px-4 font-medium">Categoría y depósito</th>
                  <th className="py-2.5 px-4 font-medium text-right">Stock actual</th>
                  <th className="py-2.5 px-4 font-medium text-right">Mínimo</th>
                  <th className="py-2.5 px-4 font-medium text-right">Costo Ref.</th>
                  <th className="py-2.5 px-4 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {filteredProducts.map((p) => {
                  const cat = data.productCategories.find((c) => c.id === p.categoryId);
                  const loc = data.inventoryLocations.find((l) => l.id === p.locationId);
                  const isLow = p.currentStock < p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-[#F8F7F4]">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-[#1C1917]">{p.name}</div>
                        <div className="text-[11px] font-mono text-[#5E5851]">
                          {p.sku} · Compra: {p.purchaseUnit}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-xs">
                        <div className="text-[#1C1917]">{cat?.name}</div>
                        <div className="text-[11px] text-[#5E5851]">{loc?.name}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                        {formatNumberAR(p.currentStock, 1)} {p.baseUnit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5E5851]">
                        {formatNumberAR(p.minStock, 1)} {p.baseUnit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5E5851]">
                        {p.costReferenceArs !== null ? formatARS(p.costReferenceArs) : 'Sin costo'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <StatusText
                          label={isLow ? 'Bajo mínimo' : 'Normal'}
                          tone={isLow ? 'danger' : 'positive'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subView === 'movimientos' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] text-xs font-semibold text-[#1C1917]">
            Trazabilidad de movimientos — origen preservado (compra, consumo, conteo, merma, desperdicio o ajuste)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6E2D8] text-left text-xs text-[#5E5851]">
                  <th className="py-2.5 px-4 font-medium">Fecha</th>
                  <th className="py-2.5 px-4 font-medium">Producto</th>
                  <th className="py-2.5 px-4 font-medium">Tipo / Origen</th>
                  <th className="py-2.5 px-4 font-medium text-right">Variación</th>
                  <th className="py-2.5 px-4 font-medium text-right">Saldo final</th>
                  <th className="py-2.5 px-4 font-medium">Responsable y notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {data.inventoryMovements.map((m) => {
                  const prod = data.products.find((p) => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-[#F8F7F4]">
                      <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap">
                        {formatDateAR(m.operationalDate)}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#1C1917]">
                        {prod?.name ?? m.productId}
                      </td>
                      <td className="py-2.5 px-4 text-xs">
                        <div className="font-medium text-[#1C1917]">{MOVEMENT_LABELS[m.type]}</div>
                        {m.originReferenceId && (
                          <div className="text-[11px] font-mono text-[#5E5851]">
                            Ref: {m.originReferenceId}
                          </div>
                        )}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold ${
                          m.quantityDelta >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'
                        }`}
                      >
                        {m.quantityDelta > 0 ? '+' : ''}
                        {formatNumberAR(m.quantityDelta, 2)} {m.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {formatNumberAR(m.newStock, 2)} {m.unit}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#5E5851]">
                        <strong className="text-[#1C1917]">{m.createdBy}</strong> · {m.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Inventory Movement Modal */}
      <Modal
        open={movModalOpen}
        onClose={() => setMovModalOpen(false)}
        title="Registrar movimiento de inventario"
        subtitle="Un ajuste o conteo físico conserva su origen diferenciado y nunca se confunde con compra ni desperdicio."
      >
        <form onSubmit={handleSaveMovement} className="space-y-4">
          <div>
            <label className={labelClass}>Producto *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={inputClass}
            >
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Stock actual: {p.currentStock} {p.baseUnit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de movimiento *</label>
              <select
                value={movType}
                onChange={(e) => setMovType(e.target.value as InventoryMovementType)}
                className={inputClass}
              >
                <option value="salida_consumo">Salida de stock a sector</option>
                <option value="entrada_compra">Entrada de stock</option>
                <option value="conteo_fisico">Conteo físico (establecer stock real)</option>
                <option value="ajuste_manual">Ajuste manual (+/-)</option>
                <option value="transferencia">Transferencia de ubicación</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                {movType === 'conteo_fisico'
                  ? `Stock contado real (${selectedProduct?.baseUnit ?? ''}) *`
                  : `Cantidad (${selectedProduct?.baseUnit ?? ''}) *`}
              </label>
              <input
                type="number"
                step="any"
                required
                value={qtyInput}
                onChange={(e) => setQtyInput(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sector involucrado</label>
              <select
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                className={inputClass}
              >
                {data.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha operativa</label>
              <input
                type="date"
                value={movDate}
                onChange={(e) => setMovDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {movType === 'transferencia' && (
            <div>
              <label className={labelClass}>Ubicación destino</label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar depósito destino...</option>
                {data.inventoryLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Motivo / observaciones *</label>
            <textarea
              rows={2}
              required
              value={movNotes}
              onChange={(e) => setMovNotes(e.target.value)}
              placeholder="Ej. Retiro para despacho nocturno de Parrilla."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setMovModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Registrar movimiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ==========================================
// DEDICATED MERMAS Y DESPERDICIOS INTERFACE (Scenarios 5 & 6)
// ==========================================
export const WasteLossSection: React.FC = () => {
  const { data, permissions, navigate, registerLossEvent } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<'todos' | LossType>('todos');
  const [modalType, setModalType] = useState<LossType | null>(null);

  // Registration Form State
  const [productId, setProductId] = useState('prod-langostinos');
  const [grossInputQty, setGrossInputQty] = useState<number>(2);
  const [usableOutputQty, setUsableOutputQty] = useState<number>(1.7);
  const [wasteQty, setWasteQty] = useState<number>(3);
  const [reason, setReason] = useState<WasteReason>('descomposicion');
  const [sectorId, setSectorId] = useState('sec-cocina');
  const [opDate, setOpDate] = useState(todayISO());
  const [reportedByEmpId, setReportedByEmpId] = useState('');
  const [linkToInventory, setLinkToInventory] = useState(true);
  const [notes, setNotes] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');

  const selectedProd = data.products.find((p) => p.id === productId);

  const openModal = (t: LossType) => {
    setModalType(t);
    if (t === 'merma') {
      setProductId('prod-lomo');
      setGrossInputQty(2);
      setUsableOutputQty(1.7);
      setReason('limpieza_desposte_proceso');
      setSectorId('sec-parrilla');
    } else {
      setProductId('prod-langostinos');
      setWasteQty(3);
      setReason('descomposicion');
      setSectorId('sec-cocina');
    }
    setOpDate(todayISO());
    setLinkToInventory(true);
    setNotes('');
    setEvidenceNote('');
  };

  // Live preview for Merma (Scenario 6: 2 kg -> 1.7 kg = 0.3 kg loss, 15%, 85% yield)
  const mermaPreview = useMemo(() => {
    const gross = Number(grossInputQty) || 0;
    const usable = Number(usableOutputQty) || 0;
    const loss = Math.max(0, Number((gross - usable).toFixed(3)));
    const lossPct = gross > 0 ? (loss / gross) * 100 : 0;
    const yieldPct = gross > 0 ? (usable / gross) * 100 : 0;
    const cost = selectedProd?.costReferenceArs ?? null;
    const impact = cost !== null ? Math.round(loss * cost) : null;
    return { loss, lossPct, yieldPct, cost, impact };
  }, [grossInputQty, usableOutputQty, selectedProd]);

  const wastePreviewImpact = useMemo(() => {
    const cost = selectedProd?.costReferenceArs ?? null;
    return cost !== null ? Math.round((Number(wasteQty) || 0) * cost) : null;
  }, [wasteQty, selectedProd]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType || !selectedProd) return;
    if (modalType === 'merma') {
      if (grossInputQty <= 0 || usableOutputQty < 0 || usableOutputQty > grossInputQty) {
        return;
      }
      registerLossEvent({
        productId,
        type: 'merma',
        grossInputQty,
        usableOutputQty,
        reason,
        sectorId,
        operationalDate: opDate,
        reportedByEmployeeId: reportedByEmpId || undefined,
        linkToInventory,
        notes: notes.trim() || undefined,
        evidenceNote: evidenceNote.trim() || undefined
      });
    } else {
      if (wasteQty <= 0) return;
      registerLossEvent({
        productId,
        type: 'desperdicio',
        lossQty: wasteQty,
        reason,
        sectorId,
        operationalDate: opDate,
        reportedByEmployeeId: reportedByEmpId || undefined,
        linkToInventory,
        notes: notes.trim() || undefined,
        evidenceNote: evidenceNote.trim() || undefined
      });
    }
    setModalType(null);
  };

  const analytics = useMemo(() => {
    const mermas = data.lossEvents.filter((l) => l.type === 'merma');
    const desperdicios = data.lossEvents.filter((l) => l.type === 'desperdicio');
    const mermaValue = mermas.reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);
    const desperdicioValue = desperdicios.reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);
    const avgYield =
      mermas.length > 0
        ? mermas.reduce((acc, l) => acc + (l.yieldPercentage ?? 0), 0) / mermas.length
        : null;

    return {
      mermaCount: mermas.length,
      desperdicioCount: desperdicios.length,
      mermaValue,
      desperdicioValue,
      avgYield
    };
  }, [data.lossEvents]);

  const filteredEvents = data.lossEvents.filter(
    (l) => typeFilter === 'todos' || l.type === typeFilter
  );

  return (
    <div className="space-y-6">
      {/* Action Header (Mobile-friendly primary registration buttons) */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={sectionTitleClass}>
            Control diferenciado de Mermas y Desperdicios
          </h2>
          <p className="text-xs text-[#6B635B] mt-1">
            La <strong>Merma</strong> mide rendimiento de limpieza/desposte; el{' '}
            <strong>Desperdicio</strong> registra pérdidas evitables con baja trazable 1:1 en inventario.
          </p>
        </div>

        {permissions.canRegisterLosses && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button type="button" onClick={() => openModal('merma')} className={operationalSecondaryBtnClass}>
              <Scale className="w-4 h-4" />
              Registrar Merma
            </button>
            <button type="button" onClick={() => openModal('desperdicio')} className={primaryBtnClass}>
              <Plus className="w-4 h-4" />
              Registrar Desperdicio
            </button>
          </div>
        )}
      </div>

      {/* Separated KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Desperdicio evitable (total)"
          value={formatARS(analytics.desperdicioValue)}
          subtitle={`${analytics.desperdicioCount} evento(s) anormal(es) registrado(s)`}
          tone={analytics.desperdicioValue > 0 ? 'danger' : 'positive'}
        />
        <KpiCard
          label="Merma normal de proceso"
          value={formatARS(analytics.mermaValue)}
          subtitle={`${analytics.mermaCount} registros de desposte/limpieza (separados)`}
        />
        <KpiCard
          label="Rendimiento promedio de merma"
          value={analytics.avgYield !== null ? formatPercent(analytics.avgYield, 1) : '—'}
          subtitle="Porcentaje aprovechable sobre bruto"
          tone="positive"
        />
        <KpiCard
          label="Vínculo con inventario"
          value={`${data.lossEvents.filter((l) => l.linkedInventoryMovementId).length} / ${data.lossEvents.length}`}
          subtitle="Eventos con baja trazable única (sin duplicar)"
        />
      </div>

      {/* Operational Log (Detailed economic sector comparison chart moved to Analítica / Gestión / Mermas) */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E6E2D8] bg-[#F8F7F4] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#1C1917]">
              Registro cronológico de pérdidas ({filteredEvents.length})
            </span>
            {permissions.canViewAnalytics && (
              <button
                type="button"
                onClick={() =>
                  navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'mermas' })
                }
                className={analyticsLinkClass}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Ver análisis económico en Analítica →
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
              {(['todos', 'desperdicio', 'merma'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#7C2D36] text-white font-medium'
                      : 'bg-white text-[#5E5851] border border-[#E6E2D8]'
                  }`}
                >
                  {t === 'todos' ? 'Todos' : t === 'desperdicio' ? 'Solo Desperdicios' : 'Solo Mermas'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#F2EFE9]">
            {filteredEvents.map((ev) => {
              const prod = data.products.find((p) => p.id === ev.productId);
              const sec = data.sectors.find((s) => s.id === ev.sectorId);
              return (
                <div key={ev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <StatusText
                        label={ev.type === 'desperdicio' ? 'DESPERDICIO' : 'MERMA DE PROCESO'}
                        tone={ev.type === 'desperdicio' ? 'danger' : 'warning'}
                      />
                      <span className="text-[#5E5851]">· {sec?.name}</span>
                      <span className="font-mono text-[#5E5851]">· {formatDateAR(ev.operationalDate)}</span>
                      {ev.linkedInventoryMovementId && (
                        <span className="text-[11px] font-mono text-[#15803D]">
                          · Stock descontado ({ev.linkedInventoryMovementId})
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-[#1C1917]">
                      {prod?.name ?? ev.productId} — {formatNumberAR(ev.lossQty, 2)} {ev.unit}
                    </div>
                    {ev.type === 'merma' && ev.grossInputQty !== undefined && (
                      <div className="text-xs font-mono text-[#5E5851]">
                        Bruto: {formatNumberAR(ev.grossInputQty, 2)} {ev.unit} → Aprovechable:{' '}
                        {formatNumberAR(ev.usableOutputQty ?? 0, 2)} {ev.unit} · Merma:{' '}
                        <strong>{formatPercent(ev.lossPercentage ?? 0, 1)}</strong> · Rendimiento:{' '}
                        <strong className="text-[#15803D]">{formatPercent(ev.yieldPercentage ?? 0, 1)}</strong>
                      </div>
                    )}
                    <div className="text-xs text-[#5E5851]">
                      Causa: {WASTE_REASON_LABELS[ev.reason]} · Registró: {ev.registeredByName}
                      {ev.notes ? ` · "${ev.notes}"` : ''}
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-sm font-mono font-semibold tabular-nums text-[#1C1917]">
                      {ev.estimatedImpactArs !== null
                        ? formatARS(ev.estimatedImpactArs)
                        : 'Sin costo conocido'}
                    </div>
                    <div className="text-[11px] font-mono text-[#5E5851]">
                      {formatDateTimeAR(ev.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      {/* Registration Modal (Merma vs Desperdicio) */}
      <Modal
        open={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'merma'
            ? 'Registrar Merma de Proceso (Rendimiento)'
            : 'Registrar Desperdicio (Pérdida evitable)'
        }
        subtitle={
          modalType === 'merma'
            ? 'Ingresá cantidad bruta y cantidad aprovechable para calcular pérdida y rendimiento automáticamente.'
            : 'Registrá deterioro, vencimiento, devolución o incidente con vinculación única a inventario.'
        }
      >
        {modalType && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelClass}>Producto *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={inputClass}
              >
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.baseUnit}) — Stock: {p.currentStock}{' '}
                    {p.costReferenceArs === null ? '[Sin costo de ref.]' : `· Ref. ${formatARS(p.costReferenceArs)}`}
                  </option>
                ))}
              </select>
            </div>

            {modalType === 'merma' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Cantidad bruta ingresada ({selectedProd?.baseUnit}) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0.01}
                      required
                      value={grossInputQty}
                      onChange={(e) => setGrossInputQty(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Cantidad neta aprovechable ({selectedProd?.baseUnit}) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      max={grossInputQty}
                      required
                      value={usableOutputQty}
                      onChange={(e) => setUsableOutputQty(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Live Calculation Preview Box */}
                <div className="p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#5E5851]">Merma calculada</span>
                    <div className="font-mono font-semibold text-sm text-[#1C1917]">
                      {formatNumberAR(mermaPreview.loss, 2)} {selectedProd?.baseUnit}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5E5851]">% Merma</span>
                    <div className="font-mono font-semibold text-sm text-[#B45309]">
                      {formatPercent(mermaPreview.lossPct, 1)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5E5851]">% Rendimiento</span>
                    <div className="font-mono font-semibold text-sm text-[#15803D]">
                      {formatPercent(mermaPreview.yieldPct, 1)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5E5851]">Impacto económico</span>
                    <div className="font-mono font-semibold text-sm text-[#1C1917]">
                      {mermaPreview.impact !== null
                        ? formatARS(mermaPreview.impact)
                        : 'Sin costo conocido'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Cantidad desperdiciada ({selectedProd?.baseUnit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0.01}
                    required
                    value={wasteQty}
                    onChange={(e) => setWasteQty(Number(e.target.value))}
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] font-mono text-[#5E5851]">
                    Impacto estimado:{' '}
                    {wastePreviewImpact !== null ? formatARS(wastePreviewImpact) : 'Sin costo conocido'}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Motivo del desperdicio *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as WasteReason)}
                    className={inputClass}
                  >
                    <option value="descomposicion">Descomposición / mal estado</option>
                    <option value="vencimiento">Vencimiento</option>
                    <option value="almacenamiento_incorrecto">Almacenamiento incorrecto</option>
                    <option value="sobreproduccion">Sobreproducción</option>
                    <option value="error_preparacion">Error de preparación</option>
                    <option value="producto_danado">Producto dañado</option>
                    <option value="plato_devuelto">Plato devuelto</option>
                    <option value="comanda_erronea">Comanda errónea</option>
                    <option value="incidente_servicio">Incidente de servicio</option>
                    <option value="otro">Otra causa</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Sector *</label>
                <select
                  value={sectorId}
                  onChange={(e) => setSectorId(e.target.value)}
                  className={inputClass}
                >
                  {data.sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fecha operativa *</label>
                <input
                  type="date"
                  required
                  value={opDate}
                  onChange={(e) => setOpDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Reportado por (opcional)</label>
                <select
                  value={reportedByEmpId}
                  onChange={(e) => setReportedByEmpId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Usuario en sesión</option>
                  {data.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.lastName}, {e.firstName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 border border-[#E6E2D8] rounded-md bg-[#F8F7F4] text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={linkToInventory}
                onChange={(e) => setLinkToInventory(e.target.checked)}
                className="accent-[#7C2D36] mt-0.5 cursor-pointer"
              />
              <span>
                <strong className="text-[#1C1917]">Descontar del inventario mediante movimiento único trazable</strong>
                <span className="block text-[#5E5851] mt-0.5">
                  Vincula esta pérdida 1:1 con el stock actual ({selectedProd?.currentStock} {selectedProd?.baseUnit}) evitando doble conteo.
                </span>
              </span>
            </label>

            <div>
              <label className={labelClass}>Observaciones</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalle del lote, cámara o circunstancia..."
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
              <button type="button" onClick={() => setModalType(null)} className={secondaryBtnClass}>
                Cancelar
              </button>
              <button type="submit" className={primaryBtnClass}>
                Confirmar registro
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
