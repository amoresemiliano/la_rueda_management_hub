import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import { analyticsLinkClass, KpiCard, sectionTitleClass, StatusText } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import {
  addDaysISO,
  formatARS,
  formatDateAR,
  formatIntAR,
  formatPercent,
  todayISO
} from '../../utils/formatters';

export const AnalyticsOverviewSection: React.FC = () => {
  const { data, permissions, navigate } = useAppStore();
  const today = todayISO();
  const [periodDays, setPeriodDays] = useState<7 | 30>(7);
  const [sectorFilter, setSectorFilter] = useState('todos');

  const fromDate = addDaysISO(today, -(periodDays - 1));

  const overview = useMemo(() => {
    // Sales (Gestión)
    const periodSales = data.sales.filter(
      (s) => s.operationalDate >= fromDate && s.operationalDate <= today
    );
    const totalRevenue = periodSales.reduce((acc, s) => acc + s.totalRevenueArs, 0);
    const totalGuests = periodSales.reduce((acc, s) => acc + s.guestsCount, 0);
    const totalTickets = periodSales.reduce((acc, s) => acc + s.ticketsCount, 0);
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

    // Losses (Gestión)
    const periodLosses = data.lossEvents.filter(
      (l) =>
        l.operationalDate >= fromDate &&
        l.operationalDate <= today &&
        (sectorFilter === 'todos' || l.sectorId === sectorFilter)
    );
    const wasteArs = periodLosses
      .filter((l) => l.type === 'desperdicio')
      .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);
    const mermaArs = periodLosses
      .filter((l) => l.type === 'merma')
      .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);

    // Inventory & Purchases
    const criticalStock = data.products.filter((p) => p.active && p.currentStock < p.minStock);
    const pendingPurchases = data.purchaseRequests.filter(
      (r) => r.status === 'solicitado' || r.status === 'en_verificacion' || r.status === 'pendiente_aprobacion'
    );

    // Checklists & Discrepancies (Organización)
    const scopedExecs = data.checklistExecutions.filter(
      (c) => sectorFilter === 'todos' || c.sectorId === sectorFilter
    );
    const submittedExecs = scopedExecs.filter((c) => c.verificationStatus !== 'borrador');
    const verifiedExecs = scopedExecs.filter((c) => c.verificationStatus === 'verificado');
    const verifiedRate =
      submittedExecs.length > 0 ? (verifiedExecs.length / submittedExecs.length) * 100 : 0;
    const openDiscrepancies = data.discrepancies.filter(
      (d) => d.status !== 'resuelta' && (sectorFilter === 'todos' || d.sectorId === sectorFilter)
    );

    // Staffing & Personnel
    const activeEmployees = data.employees.filter(
      (e) => e.status !== 'egresado' && (sectorFilter === 'todos' || e.currentSectorId === sectorFilter)
    );
    const periodAbsences = data.attendanceEvents.filter(
      (a) =>
        a.operationalDate >= fromDate &&
        a.operationalDate <= today &&
        (a.eventType === 'ausencia_injustificada' || a.eventType === 'ausencia_justificada') &&
        (sectorFilter === 'todos' || a.sectorId === sectorFilter)
    ).length;

    // Cross-sector health comparison
    const sectorHealth = data.sectors
      .filter((s) => sectorFilter === 'todos' || s.id === sectorFilter)
      .map((s) => {
        const emps = data.employees.filter((e) => e.currentSectorId === s.id && e.status !== 'egresado').length;
        const todayShifts = data.shiftAssignments.filter(
          (sa) =>
            sa.sectorId === s.id &&
            sa.operationalDate === today &&
            (sa.status === 'presente' || sa.status === 'programado')
        ).length;
        const secExecs = data.checklistExecutions.filter((c) => c.sectorId === s.id);
        const secVerif = secExecs.filter((c) => c.verificationStatus === 'verificado').length;
        const secDisc = data.discrepancies.filter((d) => d.sectorId === s.id && d.status !== 'resuelta').length;
        const secWaste = data.lossEvents
          .filter((l) => l.sectorId === s.id && l.type === 'desperdicio' && l.operationalDate >= fromDate)
          .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);

        return {
          id: s.id,
          code: s.code,
          name: s.name,
          emps,
          todayShifts,
          minHeadcount: s.dailyMinHeadcount,
          coveragePct: s.dailyMinHeadcount > 0 ? Math.min(100, Math.round((todayShifts / s.dailyMinHeadcount) * 100)) : 100,
          checklistsVerif: secVerif,
          checklistsTotal: secExecs.length,
          openDisc: secDisc,
          wasteArs: secWaste
        };
      });

    // Daily sales series
    const dailyMap = new Map<string, { label: string; facturacion: number; comensales: number }>();
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = addDaysISO(today, -i);
      dailyMap.set(d, { label: formatDateAR(d).slice(0, 5), facturacion: 0, comensales: 0 });
    }
    periodSales.forEach((s) => {
      const row = dailyMap.get(s.operationalDate);
      if (row) {
        row.facturacion += s.totalRevenueArs;
        row.comensales += s.guestsCount;
      }
    });

    return {
      totalRevenue,
      totalGuests,
      avgTicket,
      wasteArs,
      mermaArs,
      criticalStockCount: criticalStock.length,
      pendingPurchasesCount: pendingPurchases.length,
      verifiedRate,
      verifiedCount: verifiedExecs.length,
      submittedCount: submittedExecs.length,
      openDiscrepanciesCount: openDiscrepancies.length,
      activeEmployeesCount: activeEmployees.length,
      periodAbsences,
      sectorHealth,
      salesTrend: Array.from(dailyMap.values())
    };
  }, [data, fromDate, today, periodDays, sectorFilter]);

  return (
    <div className="space-y-6">
      {/* Shared Period & Sector Filter Bar */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriodDays(7)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
              periodDays === 7 ? 'bg-[#1769C2] text-white' : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            onClick={() => setPeriodDays(30)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
              periodDays === 30 ? 'bg-[#1769C2] text-white' : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8] hover:bg-[#F2EFE9]'
            }`}
          >
            Últimos 30 días
          </button>
          <span className="text-xs font-mono text-[#5E5851] hidden md:inline ml-2">
            {formatDateAR(fromDate)} – {formatDateAR(today)}
          </span>
        </div>

        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-md border border-[#D6D0C4] bg-white px-3 py-1.5 text-xs text-[#1C1917]"
        >
          <option value="todos">Todos los sectores ({data.sectors.length})</option>
          {data.sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Unified Cross-Module KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {permissions.canViewFinancialMetrics && (
          <KpiCard
            label={`Facturación (${periodDays}d)`}
            value={formatARS(overview.totalRevenue)}
            subtitle={`${formatIntAR(overview.totalGuests)} comensales · Ticket prom. ${formatARS(overview.avgTicket)}`}
            tone="info"
            sourceTag="Gestión"
            onClick={() => navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'ventas' })}
          />
        )}

        <KpiCard
          label="Cumplimiento verificado"
          value={formatPercent(overview.verifiedRate, 0)}
          subtitle={`${overview.verifiedCount}/${overview.submittedCount} checklists · ${overview.openDiscrepanciesCount} discrepancia(s)`}
          tone={overview.openDiscrepanciesCount > 0 ? 'warning' : 'positive'}
          sourceTag="Organización"
          onClick={() => navigate({ module: 'analitica', section: 'organizacion' })}
        />

        {permissions.canViewManagement && (
          <KpiCard
            label={`Desperdicio evitable (${periodDays}d)`}
            value={formatARS(overview.wasteArs)}
            subtitle={`Merma de proceso aparte: ${formatARS(overview.mermaArs)} · ${overview.criticalStockCount} bajo mínimo`}
            tone={overview.wasteArs > 50000 ? 'danger' : 'warning'}
            sourceTag="Gestión"
            onClick={() => navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'mermas' })}
          />
        )}

        {permissions.canViewPersonnel && (
          <KpiCard
            label="Dotación y ausentismo"
            value={`${overview.activeEmployeesCount} colab.`}
            subtitle={`${overview.periodAbsences} ausencia(s) en últimos ${periodDays} días`}
            tone={overview.periodAbsences > 3 ? 'warning' : 'default'}
            sourceTag="Personal"
            onClick={() => navigate({ module: 'analitica', section: 'personal' })}
          />
        )}
      </div>

      {/* Comparative Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {permissions.canViewFinancialMetrics && (
          <div className="lg:col-span-7 bg-white border border-[#E6E2D8] rounded-lg p-6">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFECE5]">
              <div>
                <h3 className={sectionTitleClass}>
                  Tendencia de facturación ({periodDays} días)
                </h3>
                <p className="text-xs text-[#6B635B] mt-0.5">
                  Ventas base y lotes importados consolidados
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'ventas' })}
                className={analyticsLinkClass}
              >
                Ver analítica de Gestión
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.salesTrend} margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 11, fill: '#5E5851' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatARS(Number(val)), 'Facturación']}
                    contentStyle={{
                      backgroundColor: '#181615',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#F8F7F4',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="facturacion" fill="#1769C2" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={`${permissions.canViewFinancialMetrics ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white border border-[#E6E2D8] rounded-lg p-6`}>
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFECE5]">
            <div>
              <h3 className={sectionTitleClass}>
                Cobertura de dotación hoy por sector (%)
              </h3>
              <p className="text-xs text-[#6B635B] mt-0.5">Personal activo frente al mínimo diario</p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ module: 'analitica', section: 'organizacion' })}
              className={analyticsLinkClass}
            >
              Organización
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.sectorHealth.filter((s) => s.minHeadcount > 0)} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(val: unknown) => [`${val}%`, 'Cobertura']} />
                <Bar dataKey="coveragePct" fill="#9A6B3F" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Consolidated Sector Scorecard Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1C1917]">
            Tablero comparativo por sector (Organización · Gestión · Personal)
          </span>
          <span className="text-[11px] text-[#5E5851]">
            Fuente única sincronizada en vivo
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                <th className="py-2.5 px-4 font-medium">Sector</th>
                <th className="py-2.5 px-4 font-medium text-right">Dotación total</th>
                <th className="py-2.5 px-4 font-medium text-right">Cobertura hoy</th>
                <th className="py-2.5 px-4 font-medium text-right">Checklists verif.</th>
                <th className="py-2.5 px-4 font-medium text-right">Discrepancias abiertas</th>
                {permissions.canViewManagement && (
                  <th className="py-2.5 px-4 font-medium text-right">Desperdicio ({periodDays}d)</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {overview.sectorHealth.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-2.5 px-4 font-medium text-[#1C1917]">
                    {row.name} <span className="font-mono text-[#8C847A]">({row.code})</span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.emps}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {row.todayShifts}/{row.minHeadcount}{' '}
                    <StatusText
                      label={`(${row.coveragePct}%)`}
                      tone={row.coveragePct >= 100 ? 'positive' : 'warning'}
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {row.checklistsVerif}/{row.checklistsTotal}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    <StatusText
                      label={String(row.openDisc)}
                      tone={row.openDisc > 0 ? 'danger' : 'positive'}
                    />
                  </td>
                  {permissions.canViewManagement && (
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#1C1917]">
                      {row.wasteArs > 0 ? formatARS(row.wasteArs) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
