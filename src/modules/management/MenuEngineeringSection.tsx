import React, { useMemo, useState } from 'react';
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
import { KpiCard, StatusText } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { addDaysISO, formatARS, formatIntAR, formatPercent, todayISO } from '../../utils/formatters';

type MenuQuadrant =
  | 'Estrella'
  | 'Caballo de batalla'
  | 'Rompecabezas'
  | 'Perro'
  | 'Datos insuficientes';

const QUADRANT_COLORS: Record<MenuQuadrant, string> = {
  Estrella: '#15803D',
  'Caballo de batalla': '#9A6B3F',
  Rompecabezas: '#7C2D36',
  Perro: '#6B7280',
  'Datos insuficientes': '#B45309'
};

export const MenuEngineeringSection: React.FC = () => {
  const { data } = useAppStore();
  const [periodDays, setPeriodDays] = useState<7 | 30>(30);
  const [categoryFilter, setCategoryFilter] = useState('todas');

  const today = todayISO();
  const fromDate = addDaysISO(today, -(periodDays - 1));

  const analysis = useMemo(() => {
    const periodSales = data.sales.filter(
      (s) => s.operationalDate >= fromDate && s.operationalDate <= today
    );
    const unitsMap = new Map<string, number>();
    periodSales.forEach((sale) => {
      sale.lines.forEach((line) => {
        unitsMap.set(line.menuItemId, (unitsMap.get(line.menuItemId) ?? 0) + line.quantity);
      });
    });

    const items = data.menuItems.filter(
      (m) => m.active && (categoryFilter === 'todas' || m.category === categoryFilter)
    );

    // Classic Kasavana & Smith Hospitality Menu Engineering:
    // Popularity benchmark = (100% / N) * 0.70
    // Weighted average contribution margin computed ONLY on items with reliable/estimated recipe cost
    const totalUnits = items.reduce((acc, m) => acc + (unitsMap.get(m.id) ?? 0), 0);
    const costedItems = items.filter((m) => m.recipeCostArs !== null && m.costReliability !== 'sin_datos');
    const totalCostedUnits = costedItems.reduce((acc, m) => acc + (unitsMap.get(m.id) ?? 0), 0);
    const totalContribution = costedItems.reduce((acc, m) => {
      const units = unitsMap.get(m.id) ?? 0;
      const cm = m.sellingPriceArs - (m.recipeCostArs ?? 0);
      return acc + cm * units;
    }, 0);

    const avgContributionMargin = totalCostedUnits > 0 ? totalContribution / totalCostedUnits : 0;
    const popularityThresholdPct = items.length > 0 ? (100 / items.length) * 0.7 : 0;

    const rows = items.map((m) => {
      const units = unitsMap.get(m.id) ?? 0;
      const popularityPct = totalUnits > 0 ? (units / totalUnits) * 100 : 0;
      const hasReliableCost = m.recipeCostArs !== null && m.costReliability !== 'sin_datos';
      const contributionMargin = hasReliableCost ? m.sellingPriceArs - (m.recipeCostArs ?? 0) : null;
      const foodCostPct =
        hasReliableCost && m.sellingPriceArs > 0
          ? ((m.recipeCostArs ?? 0) / m.sellingPriceArs) * 100
          : null;

      let quadrant: MenuQuadrant = 'Datos insuficientes';
      if (hasReliableCost && contributionMargin !== null) {
        const highPop = popularityPct >= popularityThresholdPct;
        const highMargin = contributionMargin >= avgContributionMargin;
        if (highPop && highMargin) quadrant = 'Estrella';
        else if (highPop && !highMargin) quadrant = 'Caballo de batalla';
        else if (!highPop && highMargin) quadrant = 'Rompecabezas';
        else quadrant = 'Perro';
      }

      return {
        item: m,
        units,
        popularityPct,
        contributionMargin,
        foodCostPct,
        totalMarginArs: contributionMargin !== null ? contributionMargin * units : null,
        quadrant
      };
    });

    const scatterPoints = rows
      .filter((r) => r.quadrant !== 'Datos insuficientes' && r.contributionMargin !== null)
      .map((r) => ({
        name: r.item.name,
        category: r.item.category,
        popularityPct: Number(r.popularityPct.toFixed(2)),
        contributionMargin: r.contributionMargin ?? 0,
        units: r.units,
        quadrant: r.quadrant
      }));

    return {
      rows: rows.sort((a, b) => b.units - a.units),
      scatterPoints,
      avgContributionMargin,
      popularityThresholdPct,
      counts: {
        Estrella: rows.filter((r) => r.quadrant === 'Estrella').length,
        'Caballo de batalla': rows.filter((r) => r.quadrant === 'Caballo de batalla').length,
        Rompecabezas: rows.filter((r) => r.quadrant === 'Rompecabezas').length,
        Perro: rows.filter((r) => r.quadrant === 'Perro').length,
        'Datos insuficientes': rows.filter((r) => r.quadrant === 'Datos insuficientes').length
      }
    };
  }, [data.sales, data.menuItems, fromDate, today, categoryFilter]);

  const categories = Array.from(new Set(data.menuItems.map((m) => m.category)));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriodDays(7)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              periodDays === 7 ? 'bg-[#7C2D36] text-white' : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8]'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            onClick={() => setPeriodDays(30)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              periodDays === 30 ? 'bg-[#7C2D36] text-white' : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8]'
            }`}
          >
            Últimos 30 días
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#5E5851] hidden md:inline">
            Umbral popularidad (70%): <strong className="font-mono">{formatPercent(analysis.popularityThresholdPct, 1)}</strong> · Margen promedio:{' '}
            <strong className="font-mono">{formatARS(analysis.avgContributionMargin)}</strong>
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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

      {/* Quadrant Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Estrellas" value={String(analysis.counts.Estrella)} subtitle="Alta pop. · Alto margen" tone="positive" />
        <KpiCard label="Caballos de batalla" value={String(analysis.counts['Caballo de batalla'])} subtitle="Alta pop. · Bajo margen" />
        <KpiCard label="Rompecabezas" value={String(analysis.counts.Rompecabezas)} subtitle="Baja pop. · Alto margen" />
        <KpiCard label="Perros" value={String(analysis.counts.Perro)} subtitle="Baja pop. · Bajo margen" tone="warning" />
        <KpiCard
          label="Datos insuficientes"
          value={String(analysis.counts['Datos insuficientes'])}
          subtitle="Sin costo de receta confiable"
          tone={analysis.counts['Datos insuficientes'] > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Scatter Matrix Chart */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFECE5]">
          <div>
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Matriz de Ingeniería de Menú (Matriz BCG adaptada a gastronomía)
            </h3>
            <p className="text-xs text-[#5E5851]">
              Eje X: Popularidad (% de unidades) · Eje Y: Margen de contribución unitario (ARS). Los platos sin costo verificado/estimado se excluyen del cuadrante.
            </p>
          </div>
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
                stroke="#7C2D36"
                strokeDasharray="4 4"
              />
              <ReferenceLine
                y={analysis.avgContributionMargin}
                stroke="#7C2D36"
                strokeDasharray="4 4"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof analysis.scatterPoints)[0];
                  return (
                    <div className="bg-[#181615] text-[#F8F7F4] rounded-md p-3 text-xs shadow-lg space-y-1">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[#C7BEB4]">
                        {p.quadrant} · {p.category}
                      </div>
                      <div className="font-mono">Popularidad: {p.popularityPct}% ({p.units} un.)</div>
                      <div className="font-mono">Margen unit.: {formatARS(p.contributionMargin)}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={analysis.scatterPoints}>
                {analysis.scatterPoints.map((pt, idx) => (
                  <Cell key={idx} fill={QUADRANT_COLORS[pt.quadrant]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Menu Portfolio Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4]">
          <h3 className="text-sm font-semibold text-[#1C1917]">
            Detalle de cartera de productos ({analysis.rows.length} platos)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E2D8] text-left text-xs text-[#5E5851]">
                <th className="py-2.5 px-4 font-medium">Plato / Ítem</th>
                <th className="py-2.5 px-4 font-medium text-right">Unidades</th>
                <th className="py-2.5 px-4 font-medium text-right">Precio venta</th>
                <th className="py-2.5 px-4 font-medium text-right">Costo receta</th>
                <th className="py-2.5 px-4 font-medium text-right">Margen unit.</th>
                <th className="py-2.5 px-4 font-medium text-right">Pop. %</th>
                <th className="py-2.5 px-4 font-medium text-right">Clasificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {analysis.rows.map((r) => (
                <tr key={r.item.id} className="hover:bg-[#F8F7F4]">
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-[#1C1917]">{r.item.name}</div>
                    <div className="text-[11px] text-[#5E5851]">
                      {r.item.code} · {r.item.category} · Costo: {r.item.costReliability.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{formatIntAR(r.units)}</td>
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
                    <StatusText
                      label={r.quadrant}
                      tone={
                        r.quadrant === 'Estrella'
                          ? 'positive'
                          : r.quadrant === 'Rompecabezas'
                            ? 'accent'
                            : r.quadrant === 'Datos insuficientes' || r.quadrant === 'Perro'
                              ? 'warning'
                              : 'neutral'
                      }
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
