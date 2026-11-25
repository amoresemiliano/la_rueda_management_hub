import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { EmptyState, sectionTitleClass, StatusText } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { addDaysISO, formatARS, formatIntAR, formatPercent, todayISO } from '../../utils/formatters';
import {
  computeMenuEngineering,
  MENU_QUADRANT_META,
  MENU_QUADRANT_ORDER,
  MenuEngineeringRow,
  MenuQuadrant,
  MenuScatterPoint
} from '../../utils/menuEngineering';
import { MenuProductDetailModal } from './MenuProductDetailModal';

type QuadrantFilter = 'todos' | MenuQuadrant;

export const MenuEngineeringSection: React.FC = () => {
  const { data, nav } = useAppStore();

  const [periodDays, setPeriodDays] = useState<7 | 30>(nav.menuPeriodDays ?? 30);
  const [categoryFilter, setCategoryFilter] = useState(nav.menuCategoryFilter ?? 'todas');
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter>(
    (nav.menuQuadrantFilter as QuadrantFilter | undefined) ?? 'todos'
  );
  const [selectedRow, setSelectedRow] = useState<MenuEngineeringRow | null>(null);

  // Sync filters when arriving from Gestión → Ventas → Productos with context
  useEffect(() => {
    if (nav.menuPeriodDays) setPeriodDays(nav.menuPeriodDays);
    if (nav.menuCategoryFilter) setCategoryFilter(nav.menuCategoryFilter);
    if (nav.menuQuadrantFilter) setQuadrantFilter(nav.menuQuadrantFilter as QuadrantFilter);
  }, [nav.menuPeriodDays, nav.menuCategoryFilter, nav.menuQuadrantFilter]);

  const today = todayISO();
  const fromDate = addDaysISO(today, -(periodDays - 1));

  const analysis = useMemo(
    () => computeMenuEngineering(data.sales, data.menuItems, fromDate, today, categoryFilter),
    [data.sales, data.menuItems, fromDate, today, categoryFilter]
  );

  const categories = useMemo(
    () => Array.from(new Set(data.menuItems.map((m) => m.category))),
    [data.menuItems]
  );

  const filteredRows = useMemo(() => {
    if (quadrantFilter === 'todos') return analysis.rows;
    return analysis.rows.filter((r) => r.quadrant === quadrantFilter);
  }, [analysis.rows, quadrantFilter]);

  const handleScatterClick = (point: MenuScatterPoint) => {
    const matched = analysis.rows.find((r) => r.item.id === point.itemId);
    if (matched) setSelectedRow(matched);
  };

  const toggleQuadrant = (q: QuadrantFilter) => {
    setQuadrantFilter((prev) => (prev === q && q !== 'todos' ? 'todos' : q));
  };

  return (
    <div className="space-y-6">
      {/* Period & Category Controls */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriodDays(7)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
              periodDays === 7
                ? 'bg-[#1769C2] text-white'
                : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            onClick={() => setPeriodDays(30)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
              periodDays === 30
                ? 'bg-[#1769C2] text-white'
                : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
            }`}
          >
            Últimos 30 días
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-[#5E5851] hidden md:inline">
            Umbral popularidad (70%):{' '}
            <strong className="font-mono text-[#141210]">
              {formatPercent(analysis.popularityThresholdPct, 1)}
            </strong>{' '}
            · Margen promedio:{' '}
            <strong className="font-mono text-[#141210]">
              {formatARS(analysis.avgContributionMargin)}
            </strong>
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoría de carta"
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-1.5 text-xs text-[#1C1917]"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Clickable Quadrant Filter Cards */}
      <div
        role="group"
        aria-label="Filtrar cartera por clasificación de ingeniería de menú"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <button
          type="button"
          onClick={() => setQuadrantFilter('todos')}
          aria-pressed={quadrantFilter === 'todos'}
          className={`text-left rounded-lg p-4 border transition-all cursor-pointer ${
            quadrantFilter === 'todos'
              ? 'bg-[#1769C2]/[0.06] border-[#1769C2] ring-2 ring-[#1769C2]/20'
              : 'bg-white border-[#E6E2D8] hover:border-[#1769C2]/50 hover:bg-[#FAF9F6]'
          }`}
        >
          <div className="text-xs font-semibold text-[#5E5851]">Todos</div>
          <div className="mt-1.5 text-2xl font-mono font-bold tabular-nums text-[#1769C2]">
            {analysis.rows.length}
          </div>
          <div className="mt-1 text-[11px] text-[#6B635B]">Cartera completa</div>
        </button>

        {MENU_QUADRANT_ORDER.map((q) => {
          const meta = MENU_QUADRANT_META[q];
          const count = analysis.counts[q];
          const isActive = quadrantFilter === q;
          return (
            <button
              key={q}
              type="button"
              onClick={() => toggleQuadrant(q)}
              aria-pressed={isActive}
              className={`text-left rounded-lg p-4 border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1769C2]/[0.06] border-[#1769C2] ring-2 ring-[#1769C2]/20'
                  : 'bg-white border-[#E6E2D8] hover:border-[#1769C2]/50 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-[#141210] truncate">{meta.plural}</span>
              </div>
              <div
                className="mt-1.5 text-2xl font-mono font-bold tabular-nums"
                style={{ color: meta.color }}
              >
                {count}
              </div>
              <div className="mt-1 text-[11px] text-[#6B635B] truncate">{meta.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Interactive 4-Quadrant Scatter Matrix Chart */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFECE5]">
          <div>
            <h3 className={sectionTitleClass}>
              Matriz de Ingeniería de Menú (Matriz BCG gastronómica)
            </h3>
            <p className="text-xs text-[#6B635B] mt-0.5">
              Eje X: Popularidad (% de unidades) · Eje Y: Margen de contribución unitario (ARS). Hacé clic en cualquier punto para ver el detalle o usá los filtros superiores.
            </p>
          </div>
          {quadrantFilter !== 'todos' && (
            <button
              type="button"
              onClick={() => setQuadrantFilter('todos')}
              className="text-xs font-semibold text-[#1769C2] hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              Ver todos los cuadrantes
            </button>
          )}
        </div>

        {/* Clickable Matrix Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(['Estrella', 'Caballito', 'Rompecabezas', 'Perro'] as MenuQuadrant[]).map((q) => {
            const meta = MENU_QUADRANT_META[q];
            const isSelected = quadrantFilter === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => toggleQuadrant(q)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1769C2] text-white border-[#1769C2]'
                    : 'bg-[#FAF9F6] text-[#44403C] border-[#E6E2D8] hover:border-[#1769C2]/50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#FFFFFF' : meta.color }}
                  aria-hidden="true"
                />
                {meta.plural} ({analysis.counts[q]})
              </button>
            );
          })}
        </div>

        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 20, bottom: 16, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" />
              <XAxis
                type="number"
                dataKey="popularityPct"
                name="Popularidad"
                unit="%"
                tick={{ fontSize: 11, fill: '#5E5851' }}
              />
              <YAxis
                type="number"
                dataKey="contributionMargin"
                name="Margen"
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11, fill: '#5E5851' }}
                width={52}
              />
              <ReferenceLine
                x={analysis.popularityThresholdPct}
                stroke="#1769C2"
                strokeDasharray="4 4"
              />
              <ReferenceLine
                y={analysis.avgContributionMargin}
                stroke="#1769C2"
                strokeDasharray="4 4"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as MenuScatterPoint;
                  const meta = MENU_QUADRANT_META[p.quadrant];
                  return (
                    <div className="bg-[#181615] text-[#F8F7F4] rounded-md p-3 text-xs shadow-lg space-y-1">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[#C7BEB4]">
                        {meta.singular} · {p.category}
                      </div>
                      <div className="font-mono">
                        Popularidad: {p.popularityPct}% ({formatIntAR(p.units)} un.)
                      </div>
                      <div className="font-mono">
                        Margen unit.: {formatARS(p.contributionMargin)}
                      </div>
                      <div className="text-[11px] text-[#93C5FD]">Clic para ver detalle</div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={analysis.scatterPoints}
                onClick={(entry) => {
                  if (entry?.payload) {
                    handleScatterClick(entry.payload as MenuScatterPoint);
                  }
                }}
                cursor="pointer"
              >
                {analysis.scatterPoints.map((pt) => {
                  const dimmed = quadrantFilter !== 'todos' && pt.quadrant !== quadrantFilter;
                  return (
                    <Cell
                      key={pt.itemId}
                      fill={MENU_QUADRANT_META[pt.quadrant].color}
                      fillOpacity={dimmed ? 0.18 : 0.92}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtered Portfolio Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#141210]">
              Detalle de cartera de productos ({filteredRows.length} de {analysis.rows.length} platos)
            </h3>
            {quadrantFilter !== 'todos' && (
              <p className="text-[11px] text-[#1769C2] font-medium mt-0.5">
                Filtro activo: {MENU_QUADRANT_META[quadrantFilter].plural}
              </p>
            )}
          </div>
          {quadrantFilter !== 'todos' && (
            <button
              type="button"
              onClick={() => setQuadrantFilter('todos')}
              className="text-xs font-semibold text-[#1769C2] hover:underline cursor-pointer"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin productos en esta clasificación"
              description="No hay platos que coincidan con el filtro de cuadrante y categoría seleccionado en el período actual."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setQuadrantFilter('todos');
                    setCategoryFilter('todas');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1769C2] hover:bg-[#12549D] rounded-md cursor-pointer"
                >
                  Mostrar toda la cartera
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-left text-xs text-[#5E5851]">
                  <th className="py-2.5 px-4 font-semibold">Plato / Producto</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Unidades</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Facturación</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Precio venta</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Costo receta</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Margen unit.</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Pop. %</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Clasificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {filteredRows.map((r) => {
                  const meta = MENU_QUADRANT_META[r.quadrant];
                  return (
                    <tr
                      key={r.item.id}
                      onClick={() => setSelectedRow(r)}
                      className="hover:bg-[#F8F7F4] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-[#141210]">{r.item.name}</div>
                        <div className="text-[11px] text-[#6B635B]">
                          {r.item.code} · {r.item.category} · Costo:{' '}
                          {r.item.costReliability.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                        {formatIntAR(r.units)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#1769C2] font-semibold">
                        {formatARS(r.revenueArs)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {formatARS(r.item.sellingPriceArs)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5E5851]">
                        {r.item.recipeCostArs !== null ? formatARS(r.item.recipeCostArs) : 'No cargado'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                        {r.contributionMargin !== null ? formatARS(r.contributionMargin) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {formatPercent(r.popularityPct, 1)}
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

      <MenuProductDetailModal
        row={selectedRow}
        periodDays={periodDays}
        avgContributionMargin={analysis.avgContributionMargin}
        popularityThresholdPct={analysis.popularityThresholdPct}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
};
