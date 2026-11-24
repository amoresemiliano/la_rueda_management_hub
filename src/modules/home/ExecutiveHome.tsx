import React, { useMemo } from 'react';
import { ArrowRight, Building2, Briefcase, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { KpiCard, StatusText } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import {
  addDaysISO,
  formatARS,
  formatDateAR,
  formatDateTimeAR,
  formatIntAR,
  formatPercent,
  todayISO
} from '../../utils/formatters';

export const ExecutiveHome: React.FC = () => {
  const { data, activeUser, permissions, navigate } = useAppStore();
  const today = todayISO();

  const metrics = useMemo(() => {
    const sevenDaysAgo = addDaysISO(today, -6);
    const recentSales = data.sales.filter(
      (s) => s.operationalDate >= sevenDaysAgo && s.operationalDate <= today
    );
    const revenue7d = recentSales.reduce((acc, s) => acc + s.totalRevenueArs, 0);
    const guests7d = recentSales.reduce((acc, s) => acc + s.guestsCount, 0);
    const avgGuestsPerDay = guests7d / 7;

    // Daily trend for chart
    const dailyMap = new Map<string, { date: string; facturacion: number; comensales: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = addDaysISO(today, -i);
      dailyMap.set(d, { date: formatDateAR(d).slice(0, 5), facturacion: 0, comensales: 0 });
    }
    recentSales.forEach((s) => {
      const entry = dailyMap.get(s.operationalDate);
      if (entry) {
        entry.facturacion += s.totalRevenueArs;
        entry.comensales += s.guestsCount;
      }
    });
    const chartData = Array.from(dailyMap.values());

    // Today staffing
    const todayShifts = data.shiftAssignments.filter((s) => s.operationalDate === today);
    const scheduledToday = todayShifts.filter(
      (s) => s.status === 'programado' || s.status === 'presente'
    ).length;
    const absencesToday = todayShifts.filter(
      (s) => s.status === 'ausente_justificado' || s.status === 'ausente_injustificado'
    ).length;

    // Checklists
    const submittedChecklists = data.checklistExecutions.filter(
      (c) => c.verificationStatus !== 'borrador'
    );
    const verifiedChecklists = data.checklistExecutions.filter(
      (c) => c.verificationStatus === 'verificado'
    );
    const verifiedRate =
      submittedChecklists.length > 0
        ? (verifiedChecklists.length / submittedChecklists.length) * 100
        : 0;
    const openDiscrepancies = data.discrepancies.filter((d) => d.status === 'abierta');

    // Purchases & Stock
    const pendingPurchases = data.purchaseRequests.filter(
      (r) => r.status === 'solicitado' || r.status === 'en_verificacion' || r.status === 'pendiente_aprobacion'
    );
    const criticalStock = data.products.filter((p) => p.active && p.currentStock < p.minStock);

    // Today forecast
    const todayForecast = data.demandForecasts.find((f) => f.operationalDate === today);

    // Waste 7d
    const waste7dArs = data.lossEvents
      .filter((l) => l.type === 'desperdicio' && l.operationalDate >= sevenDaysAgo)
      .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);

    return {
      revenue7d,
      avgGuestsPerDay,
      chartData,
      scheduledToday,
      absencesToday,
      verifiedRate,
      submittedCount: submittedChecklists.length,
      verifiedCount: verifiedChecklists.length,
      openDiscrepancies,
      pendingPurchases,
      criticalStock,
      todayForecast,
      waste7dArs
    };
  }, [data, today]);

  const sectorCoverageToday = useMemo(() => {
    return data.sectors
      .filter((s) => s.dailyMinHeadcount > 0)
      .map((sec) => {
        const shifts = data.shiftAssignments.filter(
          (sa) => sa.sectorId === sec.id && sa.operationalDate === today
        );
        const working = shifts.filter((s) => s.status === 'presente' || s.status === 'programado').length;
        const absent = shifts.filter(
          (s) => s.status === 'ausente_justificado' || s.status === 'ausente_injustificado'
        ).length;
        return {
          sector: sec,
          working,
          absent,
          shortfall: Math.max(0, sec.dailyMinHeadcount - working)
        };
      })
      .sort((a, b) => b.shortfall - a.shortfall || b.working - a.working);
  }, [data.sectors, data.shiftAssignments, today]);

  return (
    <div className="space-y-8">
      {/* Executive Welcome Header */}
      <section className="bg-white border border-[#E6E2D8] rounded-lg p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="text-xs text-[#5E5851] flex flex-wrap items-center gap-2">
              <span>{data.organization.location}</span>
              <span aria-hidden="true">·</span>
              <span>Capacidad simultánea: {data.organization.simultaneousCapacity} cubiertos</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Jornada {formatDateAR(today)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#7C2D36] font-medium">Modo demostración</span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-[#1C1917] tracking-tight">
              La Rueda 1975 — Centro de Gestión
            </h1>
            <p className="mt-2 text-sm text-[#5E5851] max-w-2xl leading-relaxed">
              Sesión activa como <strong className="text-[#1C1917] font-medium">{activeUser.name}</strong> ({activeUser.roleLabel}).
              Ecosistema unificado de Organización, Gestión y Personal con datos sintéticos trazables en tiempo real.
            </p>
          </div>

          {metrics.todayForecast && (
            <div className="lg:text-right border-t lg:border-t-0 lg:border-l border-[#E6E2D8] pt-4 lg:pt-0 lg:pl-6 shrink-0">
              <div className="text-xs text-[#5E5851]">Demanda esperada hoy</div>
              <div className="mt-1 text-2xl font-mono font-semibold tabular-nums text-[#1C1917]">
                {formatIntAR(metrics.todayForecast.expectedGuests)} comensales
              </div>
              <div className="mt-0.5 text-xs text-[#5E5851]">
                {metrics.todayForecast.confirmedReservations} reservas · {metrics.todayForecast.tourGroupsCount} grupos turísticos
              </div>
            </div>
          )}
        </div>

        {/* Quick Module Links */}
        <div className="mt-6 pt-5 border-t border-[#E6E2D8] grid grid-cols-1 md:grid-cols-3 gap-4">
          {permissions.canViewOrganization && (
            <button
              type="button"
              onClick={() => navigate({ module: 'organizacion', section: 'organigrama' })}
              className="group text-left p-4 rounded-md border border-[#E6E2D8] hover:border-[#7C2D36] bg-[#F8F7F4]/60 hover:bg-white transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
                  <Building2 className="w-4 h-4 text-[#7C2D36]" />
                  Organización
                </span>
                <ArrowRight className="w-4 h-4 text-[#5E5851] group-hover:text-[#7C2D36] transition-colors" />
              </div>
              <p className="mt-1.5 text-xs text-[#5E5851]">
                Quién hace qué, cuándo y cómo. Organigrama, turnos, checklists verificados y manuales.
              </p>
            </button>
          )}

          {permissions.canViewManagement && (
            <button
              type="button"
              onClick={() => navigate({ module: 'gestion', section: 'dashboard' })}
              className="group text-left p-4 rounded-md border border-[#E6E2D8] hover:border-[#7C2D36] bg-[#F8F7F4]/60 hover:bg-white transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
                  <Briefcase className="w-4 h-4 text-[#7C2D36]" />
                  Gestión
                </span>
                <ArrowRight className="w-4 h-4 text-[#5E5851] group-hover:text-[#7C2D36] transition-colors" />
              </div>
              <p className="mt-1.5 text-xs text-[#5E5851]">
                Ventas, ingeniería de menú, compras verificadas, inventarios, mermas e importación.
              </p>
            </button>
          )}

          {permissions.canViewPersonnel && (
            <button
              type="button"
              onClick={() => navigate({ module: 'personal', section: 'directorio' })}
              className="group text-left p-4 rounded-md border border-[#E6E2D8] hover:border-[#7C2D36] bg-[#F8F7F4]/60 hover:bg-white transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
                  <Users className="w-4 h-4 text-[#7C2D36]" />
                  Personal
                </span>
                <ArrowRight className="w-4 h-4 text-[#5E5851] group-hover:text-[#7C2D36] transition-colors" />
              </div>
              <p className="mt-1.5 text-xs text-[#5E5851]">
                {data.employees.length} legajos digitales, trayectoria histórica, asistencias, licencias y pre-liquidación.
              </p>
            </button>
          )}
        </div>
      </section>

      {/* Primary Derived KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {permissions.canViewFinancialMetrics ? (
          <KpiCard
            label="Facturación (últimos 7 días)"
            value={formatARS(metrics.revenue7d)}
            subtitle={`Promedio diario: ${formatIntAR(metrics.avgGuestsPerDay)} comensales`}
            sourceTag="Demo / MaxiRest"
            onClick={() => navigate({ module: 'gestion', section: 'ventas' })}
          />
        ) : (
          <KpiCard
            label="Dotación total registrada"
            value={`${data.employees.filter((e) => e.status !== 'egresado').length} personas`}
            subtitle={`${data.sectors.length} sectores operativos activos`}
            sourceTag="Personal"
            onClick={permissions.canViewPersonnel ? () => navigate({ module: 'personal', section: 'directorio' }) : undefined}
          />
        )}

        <KpiCard
          label="Dotación programada hoy"
          value={`${metrics.scheduledToday} / ${data.employees.length}`}
          subtitle={
            metrics.absencesToday > 0
              ? `${metrics.absencesToday} ausencia(s) registrada(s) hoy`
              : 'Sin ausencias registradas hoy'
          }
          tone={metrics.absencesToday > 0 ? 'warning' : 'positive'}
          sourceTag="Organización"
          onClick={() => navigate({ module: 'organizacion', section: 'dotacion' })}
        />

        <KpiCard
          label="Checklists verificados"
          value={formatPercent(metrics.verifiedRate, 0)}
          subtitle={`${metrics.verifiedCount} de ${metrics.submittedCount} enviados · ${metrics.openDiscrepancies.length} discrepancia(s)`}
          tone={metrics.openDiscrepancies.length > 0 ? 'warning' : 'positive'}
          sourceTag="Cumplimiento"
          onClick={() => navigate({ module: 'organizacion', section: 'checklists' })}
        />

        {permissions.canViewManagement ? (
          <KpiCard
            label="Compras y stock crítico"
            value={`${metrics.pendingPurchases.length} pedidos · ${metrics.criticalStock.length} ítems`}
            subtitle={`Desperdicios últimos 7 días: ${formatARS(metrics.waste7dArs)}`}
            tone={metrics.criticalStock.length > 5 ? 'warning' : 'default'}
            sourceTag="Gestión"
            onClick={() => navigate({ module: 'gestion', section: 'compras' })}
          />
        ) : (
          <KpiCard
            label="Licencias pendientes"
            value={`${data.leaveRequests.filter((l) => l.status === 'pendiente').length}`}
            subtitle="Solicitudes de vacaciones y francos"
            sourceTag="Personal"
            onClick={permissions.canViewPersonnel ? () => navigate({ module: 'personal', section: 'vacaciones' }) : undefined}
          />
        )}
      </section>

      {/* Main 2-Column Analytical & Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Sales Trend or Staffing Overview */}
        <div className="lg:col-span-7 space-y-6">
          {permissions.canViewFinancialMetrics && (
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EFECE5]">
                <div>
                  <h2 className="text-xl font-semibold text-[#1C1917]">
                    Facturación diaria — últimos 7 días
                  </h2>
                  <p className="text-xs text-[#5E5851]">
                    Derivado de registros de ventas sintéticas y lotes importados (ARS)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ module: 'gestion', section: 'dashboard' })}
                  className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Abrir tablero gerencial →
                </button>
              </div>
              <div className="mt-5 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.chartData} margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#5E5851' }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      formatter={(val: unknown, name: unknown) =>
                        name === 'facturacion'
                          ? [formatARS(Number(val)), 'Facturación']
                          : [`${val} comensales`, 'Comensales']
                      }
                      contentStyle={{
                        backgroundColor: '#181615',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#F8F7F4',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="facturacion" fill="#7C2D36" radius={[3, 3, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Today's Staffing by Sector */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#EFECE5]">
              <div>
                <h2 className="text-xl font-semibold text-[#1C1917]">Cobertura de dotación hoy</h2>
                <p className="text-xs text-[#5E5851]">
                  Comparativa de personal programado/presente frente al mínimo diario por sector
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ module: 'organizacion', section: 'dotacion' })}
                className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer whitespace-nowrap"
              >
                Gestionar turnos →
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EFECE5] text-left text-xs text-[#5E5851]">
                    <th className="py-2.5 font-medium">Sector</th>
                    <th className="py-2.5 font-medium text-right">Activos hoy</th>
                    <th className="py-2.5 font-medium text-right">Mínimo</th>
                    <th className="py-2.5 font-medium text-right">Ausencias</th>
                    <th className="py-2.5 font-medium text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9]">
                  {sectorCoverageToday.slice(0, 7).map((row) => (
                    <tr
                      key={row.sector.id}
                      onClick={() =>
                        navigate({
                          module: 'organizacion',
                          section: 'organigrama',
                          selectedSectorId: row.sector.id
                        })
                      }
                      className="hover:bg-[#F8F7F4] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-medium text-[#1C1917]">{row.sector.name}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">{row.working}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-[#5E5851]">
                        {row.sector.dailyMinHeadcount}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        {row.absent > 0 ? (
                          <span className="text-[#B91C1C] font-semibold">{row.absent}</span>
                        ) : (
                          <span className="text-[#8C847A]">0</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusText
                          label={row.shortfall > 0 ? `Faltan ${row.shortfall}` : 'Cubierto'}
                          tone={row.shortfall > 0 ? 'warning' : 'positive'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Pending Tasks, Alerts, & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pending Approvals & Critical Items */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#1C1917] pb-3 border-b border-[#EFECE5]">
              Pendientes y alertas prioritarias
            </h2>
            <div className="divide-y divide-[#F2EFE9]">
              {metrics.openDiscrepancies.map((disc) => (
                <div key={disc.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <StatusText label="Discrepancia abierta" tone="danger" />
                    <p className="mt-0.5 text-sm font-medium text-[#1C1917]">
                      {disc.disputedTaskLabel}
                    </p>
                    <p className="text-xs text-[#5E5851] mt-0.5">
                      Reportó {disc.reportedByName} · {formatDateTimeAR(disc.reportedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate({ module: 'organizacion', section: 'cumplimiento' })}
                    className="text-xs font-medium text-[#7C2D36] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Revisar
                  </button>
                </div>
              ))}

              {permissions.canViewManagement &&
                metrics.pendingPurchases.slice(0, 3).map((pr) => (
                  <div key={pr.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <StatusText
                        label={
                          pr.status === 'pendiente_aprobacion'
                            ? 'Aguarda aprobación de Gerencia'
                            : 'Aguarda verificación de Compras'
                        }
                        tone="warning"
                      />
                      <p className="mt-0.5 text-sm font-medium text-[#1C1917]">
                        {pr.code} · {pr.requestedByName} ({pr.lines.length} productos)
                      </p>
                      <p className="text-xs text-[#5E5851] mt-0.5">
                        Necesidad: {formatDateAR(pr.neededByDate)} · Prioridad {pr.priority}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          module: 'gestion',
                          section: 'compras',
                          selectedPurchaseRequestId: pr.id
                        })
                      }
                      className="text-xs font-medium text-[#7C2D36] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Gestionar
                    </button>
                  </div>
                ))}

              {permissions.canViewManagement && metrics.criticalStock.length > 0 && (
                <div className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <StatusText label="Stock crítico" tone="warning" />
                    <p className="mt-0.5 text-sm font-medium text-[#1C1917]">
                      {metrics.criticalStock.length} insumos por debajo del mínimo
                    </p>
                    <p className="text-xs text-[#5E5851] mt-0.5">
                      {metrics.criticalStock
                        .slice(0, 3)
                        .map((p) => `${p.name} (${p.currentStock}/${p.minStock} ${p.baseUnit})`)
                        .join(' · ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate({ module: 'gestion', section: 'inventario' })}
                    className="text-xs font-medium text-[#7C2D36] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Ver stock
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Cross-Module Activity Feed */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE5]">
              <h2 className="text-xl font-semibold text-[#1C1917]">Actividad reciente</h2>
              {permissions.canViewAdmin && (
                <button
                  type="button"
                  onClick={() => navigate({ module: 'administracion', section: 'auditoria' })}
                  className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
                >
                  Auditoría completa →
                </button>
              )}
            </div>
            <div className="divide-y divide-[#F2EFE9] mt-1">
              {data.auditEvents.slice(0, 6).map((evt) => (
                <div key={evt.id} className="py-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#5E5851]">
                    <span className="font-medium text-[#7C2D36] capitalize">{evt.module}</span>
                    <span className="font-mono tabular-nums">{formatDateTimeAR(evt.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#1C1917] leading-relaxed">{evt.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
