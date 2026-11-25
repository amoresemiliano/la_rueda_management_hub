import React, { useMemo, useState } from 'react';
import { BarChart3, Search, Upload } from 'lucide-react';
import {
  analyticsBtnClass,
  EmptyState,
  inputClass,
  KpiCard,
  primaryBtnClass,
  sectionTitleClass,
  StatusText
} from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { addDaysISO, formatARS, formatDateAR, formatIntAR, todayISO } from '../../utils/formatters';
import {
  computeMenuEngineering,
  MENU_QUADRANT_META,
  MENU_QUADRANT_ORDER,
  MenuEngineeringRow,
  MenuQuadrant
} from '../../utils/menuEngineering';
import { MenuProductDetailModal } from './MenuProductDetailModal';

type SalesSubView = 'cierres' | 'productos';
type ProductSortBy = 'units' | 'revenue' | 'margin';
type QuadrantFilter = 'todos' | MenuQuadrant;

export const OperationalSalesSection: React.FC = () => {
  const { data, permissions, navigate } = useAppStore();
  const today = todayISO();

  // Internal 2-view toggle: Cierres de ventas vs Productos
  const [subView, setSubView] = useState<SalesSubView>('cierres');

  // Cierres filters
  const [sourceFilter, setSourceFilter] = useState<'todos' | 'importados' | 'base'>('todos');
  const [shiftFilter, setShiftFilter] = useState<'todos' | 'mediodia' | 'noche'>('todos');

  // Productos commercial listing filters
  const [productPeriodDays, setProductPeriodDays] = useState<7 | 30>(30);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('todas');
  const [productQuadrant, setProductQuadrant] = useState<QuadrantFilter>('todos');
  const [productSort, setProductSort] = useState<ProductSortBy>('units');
  const [selectedProductRow, setSelectedProductRow] = useState<MenuEngineeringRow | null>(null);

  const recentSales = useMemo(() => {
    const cutoff = addDaysISO(today, -29);
    return data.sales
      .filter((s) => {
        if (s.operationalDate < cutoff) return false;
        if (shiftFilter !== 'todos' && s.shiftType !== shiftFilter) return false;
        if (sourceFilter === 'importados' && s.source === 'demo_seed') return false;
        if (sourceFilter === 'base' && s.source !== 'demo_seed') return false;
        return true;
      })
      .sort((a, b) => b.operationalDate.localeCompare(a.operationalDate));
  }, [data.sales, today, shiftFilter, sourceFilter]);

  const totals = useMemo(() => {
    const rev = recentSales.reduce((a, b) => a + b.totalRevenueArs, 0);
    const guests = recentSales.reduce((a, b) => a + b.guestsCount, 0);
    const tickets = recentSales.reduce((a, b) => a + b.ticketsCount, 0);
    const importedCount = data.sales.filter((s) => s.source !== 'demo_seed').length;
    return { rev, guests, tickets, avgTicket: tickets > 0 ? rev / tickets : 0, importedCount };
  }, [recentSales, data.sales]);

  // Single-source-of-truth Menu Engineering & Sales-Line Product Aggregation
  const productFromDate = addDaysISO(today, -(productPeriodDays - 1));
  const productAnalysis = useMemo(
    () =>
      computeMenuEngineering(data.sales, data.menuItems, productFromDate, today, productCategory),
    [data.sales, data.menuItems, productFromDate, today, productCategory]
  );

  const productCategories = useMemo(
    () => Array.from(new Set(data.menuItems.map((m) => m.category))),
    [data.menuItems]
  );

  const visibleProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = productAnalysis.rows.filter((r) => {
      if (productQuadrant !== 'todos' && r.quadrant !== productQuadrant) return false;
      if (q) {
        const hay = `${r.item.name} ${r.item.code} ${r.item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (productSort === 'revenue') return b.revenueArs - a.revenueArs || b.units - a.units;
      if (productSort === 'margin') {
        const am = a.contributionMargin ?? -Infinity;
        const bm = b.contributionMargin ?? -Infinity;
        return bm - am || b.units - a.units;
      }
      return b.units - a.units || b.revenueArs - a.revenueArs;
    });
  }, [productAnalysis.rows, productQuadrant, productSearch, productSort]);

  const openMenuEngineering = (quadrantOverride?: QuadrantFilter) => {
    navigate({
      module: 'analitica',
      section: 'gestion',
      analyticsSubTab: 'menu',
      menuPeriodDays: productPeriodDays,
      menuCategoryFilter: productCategory,
      menuQuadrantFilter: quadrantOverride ?? productQuadrant
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Operational + Analytical Actions */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={sectionTitleClass}>Ventas y desempeño de carta</h2>
          <p className="text-xs text-[#6B635B] mt-1">
            Consultá los cierres diarios por turno o el ranking comercial de productos vendidos y accedé directo a Ingeniería de menú.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {permissions.canImportData && (
            <button
              type="button"
              onClick={() => navigate({ module: 'gestion', section: 'importacion' })}
              className={primaryBtnClass}
            >
              <Upload className="w-4 h-4" />
              Importar ventas
            </button>
          )}
          {permissions.canViewAnalytics && (
            <button
              type="button"
              onClick={() => openMenuEngineering()}
              className={analyticsBtnClass}
            >
              <BarChart3 className="w-4 h-4" />
              Ingeniería de menú
            </button>
          )}
        </div>
      </div>

      {/* Internal View Switcher: Cierres de ventas / Productos */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Vistas de Ventas"
          className="inline-flex items-center gap-1.5 bg-white border border-[#E6E2D8] rounded-lg p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'cierres'}
            onClick={() => setSubView('cierres')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subView === 'cierres'
                ? 'bg-[#7C2D36] text-white'
                : 'text-[#5E5851] hover:text-[#141210] hover:bg-[#F8F7F4]'
            }`}
          >
            Cierres de ventas ({recentSales.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'productos'}
            onClick={() => setSubView('productos')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subView === 'productos'
                ? 'bg-[#7C2D36] text-white'
                : 'text-[#5E5851] hover:text-[#141210] hover:bg-[#F8F7F4]'
            }`}
          >
            Productos ({productAnalysis.rows.length})
          </button>
        </div>

        {subView === 'cierres' && permissions.canViewAnalytics && (
          <button
            type="button"
            onClick={() =>
              navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'ventas' })
            }
            className="text-xs font-semibold text-[#1769C2] hover:text-[#12549D] hover:underline cursor-pointer"
          >
            Ver analítica histórica de ventas →
          </button>
        )}
      </div>

      {/* VIEW A: CIERRES DE VENTAS (Preserved intact) */}
      {subView === 'cierres' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Facturación listada (30d)"
              value={formatARS(totals.rev)}
              subtitle={`${recentSales.length} cierres de turno`}
              tone="info"
            />
            <KpiCard
              label="Comensales registrados"
              value={formatIntAR(totals.guests)}
              subtitle={`${formatIntAR(totals.tickets)} mesas / tickets`}
            />
            <KpiCard
              label="Ticket promedio"
              value={formatARS(totals.avgTicket)}
              subtitle="Calculado sobre registros visibles"
              tone="positive"
            />
            <KpiCard
              label="Registros importados"
              value={String(totals.importedCount)}
              subtitle={`${data.importBatches.length} lote(s) cargados`}
              tone={totals.importedCount > 0 ? 'positive' : 'default'}
            />
          </div>

          <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E6E2D8] bg-[#F8F7F4] flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold text-[#141210]">
                Libro de cierres diarios ({recentSales.length} registros)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value as 'todos' | 'mediodia' | 'noche')}
                  className="rounded-md border border-[#D6D0C4] bg-white px-2.5 py-1.5 text-xs text-[#1C1917]"
                >
                  <option value="todos">Todos los turnos</option>
                  <option value="mediodia">Mediodía</option>
                  <option value="noche">Noche</option>
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) =>
                    setSourceFilter(e.target.value as 'todos' | 'importados' | 'base')
                  }
                  className="rounded-md border border-[#D6D0C4] bg-white px-2.5 py-1.5 text-xs text-[#1C1917]"
                >
                  <option value="todos">Todos los orígenes</option>
                  <option value="importados">Solo importados</option>
                  <option value="base">Base demostración</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                    <th className="py-2.5 px-4 font-semibold">Fecha</th>
                    <th className="py-2.5 px-4 font-semibold">Turno</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Tickets</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Comensales</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Facturación</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9]">
                  {recentSales.slice(0, 40).map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-2.5 px-4 font-mono tabular-nums text-[#1C1917]">
                        {formatDateAR(s.operationalDate)}
                      </td>
                      <td className="py-2.5 px-4 capitalize text-[#1C1917]">{s.shiftType}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {formatIntAR(s.ticketsCount)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {formatIntAR(s.guestsCount)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#1769C2]">
                        {formatARS(s.totalRevenueArs)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <StatusText
                          label={
                            s.source === 'demo_seed'
                              ? 'Demo base'
                              : s.source.replace('import_', 'Import ')
                          }
                          tone={s.source === 'demo_seed' ? 'neutral' : 'positive'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW B: PRODUCTOS (Commercial Sales-Line Ranking + Direct Menu Engineering Entry) */}
      {subView === 'productos' && (
        <div className="space-y-5">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label={`Unidades vendidas (${productPeriodDays}d)`}
              value={formatIntAR(productAnalysis.totalUnits)}
              subtitle="Calculado desde líneas de venta"
              tone="positive"
            />
            <KpiCard
              label={`Facturación de carta (${productPeriodDays}d)`}
              value={formatARS(productAnalysis.totalRevenueArs)}
              subtitle={`${productAnalysis.rows.length} productos activos`}
              tone="info"
            />
            <KpiCard
              label="Estrellas y Caballitos"
              value={`${productAnalysis.counts.Estrella + productAnalysis.counts.Caballito}`}
              subtitle={`${productAnalysis.counts.Estrella} Estrellas · ${productAnalysis.counts.Caballito} Caballitos`}
              tone="positive"
              onClick={() => openMenuEngineering('Estrella')}
            />
            <KpiCard
              label="Margen promedio ponderado"
              value={formatARS(productAnalysis.avgContributionMargin)}
              subtitle="Solo sobre platos con receta costeada"
            />
          </div>

          {/* Search, Period, Category & Sort Controls */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[210px] max-w-sm">
                  <Search className="w-4 h-4 text-[#736B63] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto, código o categoría..."
                    className={`${inputClass} pl-9`}
                  />
                </div>

                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setProductPeriodDays(7)}
                    className={`px-3 py-2 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                      productPeriodDays === 7
                        ? 'bg-[#1769C2] text-white'
                        : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
                    }`}
                  >
                    7 días
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductPeriodDays(30)}
                    className={`px-3 py-2 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                      productPeriodDays === 30
                        ? 'bg-[#1769C2] text-white'
                        : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
                    }`}
                  >
                    30 días
                  </button>
                </div>

                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  aria-label="Filtrar por categoría"
                  className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-xs text-[#1C1917]"
                >
                  <option value="todas">Todas las categorías</option>
                  {productCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={productSort}
                  onChange={(e) => setProductSort(e.target.value as ProductSortBy)}
                  aria-label="Ordenar productos"
                  className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-xs text-[#1C1917]"
                >
                  <option value="units">Ordenar: Más vendidos</option>
                  <option value="revenue">Ordenar: Mayor facturación</option>
                  <option value="margin">Ordenar: Mayor margen unit.</option>
                </select>
              </div>
            </div>

            {/* Interactive Classification Filter Row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EFECE5]">
              <button
                type="button"
                onClick={() => setProductQuadrant('todos')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  productQuadrant === 'todos'
                    ? 'bg-[#1769C2] text-white'
                    : 'bg-[#F8F7F4] text-[#44403C] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
                }`}
              >
                Todos ({productAnalysis.rows.length})
              </button>
              {MENU_QUADRANT_ORDER.map((q) => {
                const meta = MENU_QUADRANT_META[q];
                const isSelected = productQuadrant === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() =>
                      setProductQuadrant((prev) => (prev === q ? 'todos' : q))
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1769C2] text-white'
                        : 'bg-[#F8F7F4] text-[#44403C] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#FFFFFF' : meta.color }}
                      aria-hidden="true"
                    />
                    {meta.plural} ({productAnalysis.counts[q]})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Ranking Table */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E6E2D8] bg-[#F8F7F4] flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#141210]">
                Ranking comercial de productos ({visibleProducts.length} de {productAnalysis.rows.length})
              </span>
              <span className="text-[11px] text-[#6B635B]">
                Hacé clic en un producto para ver su ficha comercial completa
              </span>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Sin productos coincidentes"
                  description="No se encontraron platos vendidos para los filtros aplicados. Probá restablecer la búsqueda o cambiar la clasificación."
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch('');
                        setProductCategory('todas');
                        setProductQuadrant('todos');
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1769C2] hover:bg-[#12549D] rounded-md cursor-pointer"
                    >
                      Restablecer filtros
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                      <th className="py-2.5 px-4 font-semibold">Producto</th>
                      <th className="py-2.5 px-4 font-semibold">Categoría</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Unidades vendidas</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Facturación</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Precio venta</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Costo receta</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Margen unit.</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Clasificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EFE9]">
                    {visibleProducts.map((r) => {
                      const meta = MENU_QUADRANT_META[r.quadrant];
                      return (
                        <tr
                          key={r.item.id}
                          onClick={() => setSelectedProductRow(r)}
                          className="hover:bg-[#F8F7F4] cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-[#141210]">{r.item.name}</div>
                            <div className="text-[11px] font-mono text-[#6B635B]">{r.item.code}</div>
                          </td>
                          <td className="py-2.5 px-4 text-[#5E5851]">{r.item.category}</td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-[#141210]">
                            {formatIntAR(r.units)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#1769C2]">
                            {formatARS(r.revenueArs)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                            {formatARS(r.item.sellingPriceArs)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5E5851]">
                            {r.item.recipeCostArs !== null ? formatARS(r.item.recipeCostArs) : 'No cargado'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#168B68]">
                            {r.contributionMargin !== null ? formatARS(r.contributionMargin) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <StatusText label={meta.singular} tone={meta.tone} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <MenuProductDetailModal
        row={selectedProductRow}
        periodDays={productPeriodDays}
        avgContributionMargin={productAnalysis.avgContributionMargin}
        popularityThresholdPct={productAnalysis.popularityThresholdPct}
        onClose={() => setSelectedProductRow(null)}
        onOpenMenuEngineering={
          permissions.canViewAnalytics
            ? () => {
                const q = selectedProductRow?.quadrant ?? productQuadrant;
                setSelectedProductRow(null);
                openMenuEngineering(q);
              }
            : undefined
        }
      />
    </div>
  );
};
