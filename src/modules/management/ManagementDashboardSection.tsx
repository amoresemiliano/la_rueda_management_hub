import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  analyticsLinkClass,
  inputClass,
  KpiCard,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  sectionTitleClass,
  StatusText
} from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import {
  addDaysISO,
  formatARS,
  formatDateAR,
  formatIntAR,
  formatPercent,
  todayISO
} from '../../utils/formatters';

type PeriodPreset = 'hoy' | 'ayer' | '7d' | '30d' | 'custom';

export const ManagementDashboardSection: React.FC<{ mode: 'dashboard' | 'ventas' }> = ({ mode }) => {
  const { data, navigate } = useAppStore();
  const today = todayISO();

  const [preset, setPreset] = useState<PeriodPreset>('7d');
  const [customFrom, setCustomFrom] = useState(addDaysISO(today, -14));
  const [customTo, setCustomTo] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState('todas');

  const dateRange = useMemo(() => {
    if (preset === 'hoy') return { from: today, to: today };
    if (preset === 'ayer') {
      const y = addDaysISO(today, -1);
      return { from: y, to: y };
    }
    if (preset === '7d') return { from: addDaysISO(today, -6), to: today };
    if (preset === '30d') return { from: addDaysISO(today, -29), to: today };
    return { from: customFrom, to: customTo };
  }, [preset, today, customFrom, customTo]);

  const analytics = useMemo(() => {
    const menuMap = new Map(data.menuItems.map((m) => [m.id, m]));
    const periodSales = data.sales.filter(
      (s) => s.operationalDate >= dateRange.from && s.operationalDate <= dateRange.to
    );

    let totalRevenue = 0;
    let totalGuests = 0;
    let totalCovers = 0;
    let totalTickets = 0;
    let estimatedFoodCost = 0;
    let revenueWithKnownCost = 0;

    const byDate = new Map<
      string,
      { iso: string; label: string; facturacion: number; comensales: number; mediodia: number; noche: number }
    >();
    const byCategory = new Map<string, { category: string; revenue: number; units: number }>();
    const byProduct = new Map<
      string,
      { id: string; name: string; category: string; units: number; revenue: number }
    >();

    periodSales.forEach((sale) => {
      const filteredLines =
        categoryFilter === 'todas'
          ? sale.lines
          : sale.lines.filter((l) => menuMap.get(l.menuItemId)?.category === categoryFilter);

      const saleRev =
        categoryFilter === 'todas'
          ? sale.totalRevenueArs
          : filteredLines.reduce((acc, l) => acc + l.lineTotalArs, 0);

      totalRevenue += saleRev;
      totalGuests += sale.guestsCount;
      totalCovers += sale.coversSold;
      totalTickets += sale.ticketsCount;

      const dEntry = byDate.get(sale.operationalDate) ?? {
        iso: sale.operationalDate,
        label: formatDateAR(sale.operationalDate).slice(0, 5),
        facturacion: 0,
        comensales: 0,
        mediodia: 0,
        noche: 0
      };
      dEntry.facturacion += saleRev;
      dEntry.comensales += sale.guestsCount;
      if (sale.shiftType === 'mediodia') dEntry.mediodia += saleRev;
      else dEntry.noche += saleRev;
      byDate.set(sale.operationalDate, dEntry);

      filteredLines.forEach((line) => {
        const item = menuMap.get(line.menuItemId);
        if (!item) return;
        if (item.recipeCostArs !== null) {
          estimatedFoodCost += item.recipeCostArs * line.quantity;
          revenueWithKnownCost += line.lineTotalArs;
        }
        const cEntry = byCategory.get(item.category) ?? {
          category: item.category,
          revenue: 0,
          units: 0
        };
        cEntry.revenue += line.lineTotalArs;
        cEntry.units += line.quantity;
        byCategory.set(item.category, cEntry);

        const pEntry = byProduct.get(item.id) ?? {
          id: item.id,
          name: item.name,
          category: item.category,
          units: 0,
          revenue: 0
        };
        pEntry.units += line.quantity;
        pEntry.revenue += line.lineTotalArs;
        byProduct.set(item.id, pEntry);
      });
    });

    const foodCostPct =
      revenueWithKnownCost > 0 ? (estimatedFoodCost / revenueWithKnownCost) * 100 : null;
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    const avgPerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0;

    // Inventory & Losses in period
    const inventoryValuation = data.products.reduce(
      (acc, p) => acc + (p.costReferenceArs ? p.currentStock * p.costReferenceArs : 0),
      0
    );
    const criticalProducts = data.products.filter((p) => p.active && p.currentStock < p.minStock);

    const periodLosses = data.lossEvents.filter(
      (l) => l.operationalDate >= dateRange.from && l.operationalDate <= dateRange.to
    );
    const mermasArs = periodLosses
      .filter((l) => l.type === 'merma')
      .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);
    const desperdiciosArs = periodLosses
      .filter((l) => l.type === 'desperdicio')
      .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);

    const periodPurchasesArs = data.purchaseOrders
      .filter((o) => o.issueDate >= dateRange.from && o.issueDate <= dateRange.to)
      .reduce(
        (acc, o) =>
          acc + o.lines.reduce((s, l) => s + l.approvedQty * l.referenceUnitPriceArs, 0),
        0
      );

    const todayStaffCount = data.shiftAssignments.filter(
      (s) => s.operationalDate === today && (s.status === 'presente' || s.status === 'programado')
    ).length;

    const trendSeries = Array.from(byDate.values()).sort((a, b) => a.iso.localeCompare(b.iso));
    const categoryRanking = Array.from(byCategory.values()).sort((a, b) => b.revenue - a.revenue);
    const productRanking = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalGuests,
      totalCovers,
      totalTickets,
      avgTicket,
      avgPerGuest,
      estimatedFoodCost,
      foodCostPct,
      inventoryValuation,
      criticalProductsCount: criticalProducts.length,
      mermasArs,
      desperdiciosArs,
      periodPurchasesArs,
      todayStaffCount,
      trendSeries,
      categoryRanking,
      productRanking
    };
  }, [data, dateRange, categoryFilter, today]);

  const categories = Array.from(new Set(data.menuItems.map((m) => m.category)));

  return (
    <div className="space-y-6">
      {/* Period & Category Filter Bar */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'hoy', label: 'Hoy' },
              { id: 'ayer', label: 'Ayer' },
              { id: '7d', label: 'Últimos 7 días' },
              { id: '30d', label: 'Últimos 30 días' },
              { id: 'custom', label: 'Período personalizado' }
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setPreset(btn.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                preset === btn.id
                  ? 'bg-[#7C2D36] text-white'
                  : 'bg-[#F8F7F4] text-[#5E5851] hover:text-[#1C1917] border border-[#E6E2D8]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {preset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded border border-[#D6D0C4] px-2 py-1 text-xs"
              />
              <span>a</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded border border-[#D6D0C4] px-2 py-1 text-xs"
              />
            </div>
          )}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-1.5 text-xs text-[#1C1917]"
          >
            <option value="todas">Todas las categorías de carta</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Facturación del período"
          value={formatARS(analytics.totalRevenue)}
          subtitle={`${formatDateAR(dateRange.from)} al ${formatDateAR(dateRange.to)}`}
          sourceTag="Importado / Demo"
        />
        <KpiCard
          label="Comensales y cubiertos"
          value={`${formatIntAR(analytics.totalGuests)} com.`}
          subtitle={`${formatIntAR(analytics.totalCovers)} cubiertos · Capacidad simultánea: 250`}
          sourceTag="MaxiRest / Demo"
        />
        <KpiCard
          label="Ticket y gasto por comensal"
          value={formatARS(analytics.avgTicket)}
          subtitle={`Promedio por comensal: ${formatARS(analytics.avgPerGuest)} (${formatIntAR(analytics.totalTickets)} mesas)`}
          sourceTag="Calculado"
        />
        <KpiCard
          label="Food cost estimado"
          value={analytics.foodCostPct !== null ? formatPercent(analytics.foodCostPct, 1) : 'Sin datos'}
          subtitle={`Costo mercadería: ${formatARS(analytics.estimatedFoodCost)} (sobre platos con receta)`}
          tone={
            analytics.foodCostPct !== null && analytics.foodCostPct > 35 ? 'warning' : 'positive'
          }
          sourceTag="Estimado receta"
        />
      </div>

      {mode === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Existencias valorizadas"
            value={formatARS(analytics.inventoryValuation)}
            subtitle={`${analytics.criticalProductsCount} productos bajo stock mínimo`}
            tone={analytics.criticalProductsCount > 5 ? 'warning' : 'default'}
            sourceTag="Inventario"
            onClick={() => navigate({ module: 'gestion', section: 'inventario' })}
          />
          <KpiCard
            label="Órdenes de compra período"
            value={formatARS(analytics.periodPurchasesArs)}
            subtitle={`${data.purchaseRequests.filter((r) => r.status === 'pendiente_aprobacion').length} solicitud(es) aguardando aprobación`}
            sourceTag="Compras"
            onClick={() => navigate({ module: 'gestion', section: 'compras' })}
          />
          <KpiCard
            label="Desperdicios (pérdida evitable)"
            value={formatARS(analytics.desperdiciosArs)}
            subtitle={`Merma de proceso aparte: ${formatARS(analytics.mermasArs)}`}
            tone={analytics.desperdiciosArs > 50000 ? 'danger' : 'warning'}
            sourceTag="Mermas y Desp."
            onClick={() =>
              navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'mermas' })
            }
          />
          <KpiCard
            label="Dotación prevista hoy"
            value={`${analytics.todayStaffCount} personas`}
            subtitle="Vinculado al calendario de Organización"
            sourceTag="Organización"
            onClick={() => navigate({ module: 'organizacion', section: 'dotacion' })}
          />
        </div>
      )}

      {/* Interactive Trend & Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E6E2D8] rounded-lg p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFECE5]">
            <div>
              <h3 className={sectionTitleClass}>
                Evolución diaria de facturación (Mediodía vs Noche)
              </h3>
              <p className="text-xs text-[#6B635B] mt-0.5">
                Responde al filtro de fechas y categoría; incorpora lotes importados en vivo
              </p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trendSeries} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 11, fill: '#5E5851' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                />
                <Tooltip
                  formatter={(v: unknown) => formatARS(Number(v))}
                  contentStyle={{
                    backgroundColor: '#181615',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#F8F7F4',
                    fontSize: '12px'
                  }}
                />
                <Line type="monotone" dataKey="facturacion" name="Total diario" stroke="#7C2D36" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="noche" name="Turno Noche" stroke="#1C1917" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="mediodia" name="Turno Mediodía" stroke="#9A6B3F" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E6E2D8] rounded-lg p-6">
          <div className="pb-3 border-b border-[#EFECE5]">
            <h3 className={sectionTitleClass}>
              Facturación por categoría de carta
            </h3>
            <p className="text-xs text-[#6B635B] mt-0.5">Ranking comparativo en ARS del período</p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryRanking} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 11, fill: '#5E5851' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#1C1917' }} width={112} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: unknown) => formatARS(Number(v))} />
                <Bar dataKey="revenue" name="Facturación" fill="#9A6B3F" radius={[0, 3, 3, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Sales Ranking Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1C1917]">
            Ranking de productos vendidos ({analytics.productRanking.length} ítems)
          </h3>
          <button
            type="button"
            onClick={() =>
              navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'menu' })
            }
            className={analyticsLinkClass}
          >
            Ver ingeniería de menú →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E2D8] text-left text-xs text-[#5E5851]">
                <th className="py-2.5 px-4 font-medium">Producto</th>
                <th className="py-2.5 px-4 font-medium">Categoría</th>
                <th className="py-2.5 px-4 font-medium text-right">Unidades</th>
                <th className="py-2.5 px-4 font-medium text-right">Facturación</th>
                <th className="py-2.5 px-4 font-medium text-right">Participación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {analytics.productRanking.map((p) => {
                const share = analytics.totalRevenue > 0 ? (p.revenue / analytics.totalRevenue) * 100 : 0;
                return (
                  <tr key={p.id} className="hover:bg-[#F8F7F4]">
                    <td className="py-2.5 px-4 font-medium text-[#1C1917]">{p.name}</td>
                    <td className="py-2.5 px-4 text-xs text-[#5E5851]">{p.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{formatIntAR(p.units)}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                      {formatARS(p.revenue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5E5851]">
                      {formatPercent(share, 1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DEMAND FORECASTING & OPERATIONAL PLANNING (Pablo)
// ==========================================
export const DemandForecastSection: React.FC = () => {
  const { data, upsertDemandForecast, navigate } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [opDate, setOpDate] = useState(todayISO());
  const [expectedGuests, setExpectedGuests] = useState(320);
  const [confirmedReservations, setConfirmedReservations] = useState(140);
  const [tourGroupsCount, setTourGroupsCount] = useState(2);
  const [specialEvents, setSpecialEvents] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [demandNotes, setDemandNotes] = useState('');

  const criticalStock = data.products.filter((p) => p.active && p.currentStock < p.minStock);

  const openEdit = (fc?: (typeof data.demandForecasts)[0]) => {
    setOpDate(fc?.operationalDate ?? addDaysISO(todayISO(), 4));
    setExpectedGuests(fc?.expectedGuests ?? 320);
    setConfirmedReservations(fc?.confirmedReservations ?? 140);
    setTourGroupsCount(fc?.tourGroupsCount ?? 2);
    setSpecialEvents(fc?.specialEvents ?? '');
    setIsHoliday(fc?.isHoliday ?? false);
    setDemandNotes(fc?.demandNotes ?? '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    upsertDemandForecast({
      operationalDate: opDate,
      expectedGuests: Number(expectedGuests) || 0,
      confirmedReservations: Number(confirmedReservations) || 0,
      tourGroupsCount: Number(tourGroupsCount) || 0,
      specialEvents: specialEvents.trim() || 'Servicio regular',
      isHoliday,
      demandNotes: demandNotes.trim()
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
            Planificación operativa y demanda esperada
          </h3>
          <p className="text-xs text-[#5E5851] mt-0.5">
            Cálculo transparente basado en expectativas ingresadas por gerencia, reservas, grupos turísticos y alertas reales de stock. Sin algoritmos opacos.
          </p>
        </div>
        <button type="button" onClick={() => openEdit()} className={primaryBtnClass}>
          Registrar / editar jornada
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-3">
          {data.demandForecasts.map((fc) => {
            const shiftsForDay = data.shiftAssignments.filter(
              (s) => s.operationalDate === fc.operationalDate && (s.status === 'programado' || s.status === 'presente')
            ).length;
            const estTurnover = fc.expectedGuests / data.organization.simultaneousCapacity;
            return (
              <div key={fc.id} className="bg-white border border-[#E6E2D8] rounded-lg p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#5E5851]">
                      <span className="font-mono font-semibold text-[#1C1917]">
                        {formatDateAR(fc.operationalDate)}
                      </span>
                      {fc.isHoliday && (
                        <>
                          <span aria-hidden="true">·</span>
                          <StatusText label="Feriado / Alta temporada" tone="accent" />
                        </>
                      )}
                    </div>
                    <h4 className="mt-1 text-base font-semibold text-[#1C1917]">{fc.specialEvents}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(fc)}
                    className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
                  >
                    Editar planificación
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F2EFE9] text-xs">
                  <div>
                    <span className="text-[#5E5851]">Comensales esperados</span>
                    <div className="mt-0.5 font-mono font-semibold text-base tabular-nums text-[#1C1917]">
                      {formatIntAR(fc.expectedGuests)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5E5851]">Reservas / Grupos</span>
                    <div className="mt-0.5 font-mono font-semibold text-base tabular-nums text-[#1C1917]">
                      {fc.confirmedReservations} · {fc.tourGroupsCount} gr.
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5E5851]">Rotación est. (cap. 250)</span>
                    <div className="mt-0.5 font-mono font-semibold text-base tabular-nums text-[#7C2D36]">
                      {estTurnover.toFixed(2)}x
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5E5851]">Dotación asignada</span>
                    <div className="mt-0.5 font-mono font-semibold text-base tabular-nums text-[#1C1917]">
                      {shiftsForDay > 0 ? `${shiftsForDay} pers.` : 'Sin cargar'}
                    </div>
                  </div>
                </div>

                {fc.demandNotes && (
                  <p className="mt-3 text-xs text-[#5E5851] bg-[#F8F7F4] rounded p-2.5">
                    {fc.demandNotes}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Critical Stock Alerts Context */}
        <div className="lg:col-span-4 bg-white border border-[#E6E2D8] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFECE5]">
            <h4 className="text-sm font-semibold text-[#1C1917]">
              Alertas de stock crítico ({criticalStock.length})
            </h4>
            <button
              type="button"
              onClick={() => navigate({ module: 'gestion', section: 'compras' })}
              className="text-xs text-[#7C2D36] hover:underline cursor-pointer"
            >
              Ir a compras →
            </button>
          </div>
          <div className="divide-y divide-[#F2EFE9] mt-1 max-h-96 overflow-y-auto">
            {criticalStock.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-medium text-[#1C1917] truncate">{p.name}</div>
                  <div className="text-[#5E5851]">Mínimo: {p.minStock} {p.baseUnit}</div>
                </div>
                <span className="font-mono font-semibold tabular-nums text-[#B91C1C] shrink-0">
                  {p.currentStock} {p.baseUnit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Planificación diaria de demanda">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                  className="accent-[#7C2D36] w-4 h-4"
                />
                Feriado / Fin de semana largo
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Comensales esperados *</label>
              <input
                type="number"
                min={0}
                required
                value={expectedGuests}
                onChange={(e) => setExpectedGuests(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Reservas confirmadas</label>
              <input
                type="number"
                min={0}
                value={confirmedReservations}
                onChange={(e) => setConfirmedReservations(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Grupos turísticos</label>
              <input
                type="number"
                min={0}
                value={tourGroupsCount}
                onChange={(e) => setTourGroupsCount(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Eventos especiales</label>
            <input
              type="text"
              value={specialEvents}
              onChange={(e) => setSpecialEvents(e.target.value)}
              placeholder="Ej. Cena contingente Cataratas 50 pax"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Notas operativas para compras y salón</label>
            <textarea
              rows={2}
              value={demandNotes}
              onChange={(e) => setDemandNotes(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Guardar proyección
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
