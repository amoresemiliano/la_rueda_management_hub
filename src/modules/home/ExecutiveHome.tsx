import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { analyticsLinkClass, KpiCard, sectionTitleClass, StatusText } from '../../components/ui/Primitives';
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

const LOGO_SRC = '/assets/aistudio/logo_la_rueda_transparent.png';

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
    const tickets7d = recentSales.reduce((acc, s) => acc + s.ticketsCount, 0);
    const avgGuestsPerDay = guests7d / 7;
    const avgTicket7d = tickets7d > 0 ? revenue7d / tickets7d : 0;

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
    const pendingVerificationChecklists = data.checklistExecutions.filter(
      (c) => c.verificationStatus === 'enviado'
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

    // Leaves
    const pendingLeaves = data.leaveRequests.filter((l) => l.status === 'pendiente');

    // Today forecast
    const todayForecast = data.demandForecasts.find((f) => f.operationalDate === today);

    // Waste & Merma 7d
    const waste7dArs = data.lossEvents
      .filter((l) => l.type === 'desperdicio' && l.operationalDate >= sevenDaysAgo)
      .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);
    const merma7dArs = data.lossEvents
      .filter((l) => l.type === 'merma' && l.operationalDate >= sevenDaysAgo)
      .reduce((acc, l) => acc + (l.estimatedImpactArs ?? 0), 0);

    return {
      revenue7d,
      avgGuestsPerDay,
      avgTicket7d,
      chartData,
      scheduledToday,
      absencesToday,
      verifiedRate,
      submittedCount: submittedChecklists.length,
      verifiedCount: verifiedChecklists.length,
      pendingVerifCount: pendingVerificationChecklists.length,
      openDiscrepancies,
      pendingPurchases,
      criticalStock,
      pendingLeaves,
      todayForecast,
      waste7dArs,
      merma7dArs
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
    <div className="space-y-6">
      {/* Clean Executive Header (Redundant module shortcut cards removed) */}
      <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={LOGO_SRC}
              alt="Logo Restaurant La Rueda 1975"
              className="w-16 h-16 object-contain shrink-0 drop-shadow-xs"
            />
            <div>
              <div className="text-xs text-[#6B635B] flex flex-wrap items-center gap-2">
                <span>{data.organization.location}</span>
                <span aria-hidden="true">·</span>
                <span>{data.organization.simultaneousCapacity} cubiertos</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{formatDateAR(today)}</span>
              </div>
              <h1 className="mt-1 text-3xl sm:text-[2.2rem] font-editorial font-bold text-[#141210] tracking-tight leading-[1.12]">
                Resumen Ejecutivo
              </h1>
              <p className="mt-1 text-sm text-[#6B635B]">
                Sesión activa:{' '}
                <strong className="text-[#141210] font-semibold">
                  {activeUser.roleId === 'admin_vegen' ? 'Administrador VEGEN' : activeUser.roleLabel}
                </strong>
              </p>
            </div>
          </div>

          {metrics.todayForecast && (
            <button
              type="button"
              onClick={() =>
                permissions.canViewFinancialMetrics
                  ? navigate({ module: 'gestion', section: 'planificacion' })
                  : navigate({ module: 'organizacion', section: 'dotacion' })
              }
              className="text-left lg:text-right border-t lg:border-t-0 lg:border-l border-[#E6E2D8] pt-4 lg:pt-0 lg:pl-6 shrink-0 cursor-pointer group"
            >
              <div className="text-xs font-semibold text-[#5E5851]">Comensales esperados hoy</div>
              <div className="mt-1 text-2xl sm:text-[1.9rem] font-mono font-bold tabular-nums leading-none text-[#1769C2] group-hover:text-[#12549D] transition-colors">
                {formatIntAR(metrics.todayForecast.expectedGuests)} comensales
              </div>
              <div className="mt-1.5 text-xs text-[#6B635B]">
                {metrics.todayForecast.confirmedReservations} reservas · {metrics.todayForecast.tourGroupsCount} grupos turísticos
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Primary Interactive KPI Overview (Single click/tap with preserved filter context) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {permissions.canViewFinancialMetrics && (
          <KpiCard
            label="Facturación (7 días)"
            value={formatARS(metrics.revenue7d)}
            subtitle={`Ticket prom. ${formatARS(metrics.avgTicket7d)} · ${formatIntAR(metrics.avgGuestsPerDay)} com./día`}
            tone="info"
            sourceTag="Analítica · Ventas"
            onClick={() =>
              navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'ventas' })
            }
          />
        )}

        <KpiCard
          label="Dotación programada hoy"
          value={`${metrics.scheduledToday} / ${data.employees.length}`}
          subtitle="Planilla diaria de turnos"
          tone="positive"
          sourceTag="Organización"
          onClick={() => navigate({ module: 'organizacion', section: 'dotacion' })}
        />

        <KpiCard
          label="Ausencias hoy"
          value={String(metrics.absencesToday)}
          subtitle={
            metrics.absencesToday > 0
              ? 'Sincronizadas con parte de asistencia'
              : 'Sin ausencias registradas en la jornada'
          }
          tone={metrics.absencesToday > 0 ? 'danger' : 'positive'}
          sourceTag="Personal"
          onClick={() =>
            permissions.canViewPersonnel
              ? navigate({ module: 'personal', section: 'asistencia' })
              : navigate({ module: 'organizacion', section: 'dotacion' })
          }
        />

        <KpiCard
          label="Checklists y verificaciones"
          value={`${formatPercent(metrics.verifiedRate, 0)} verif.`}
          subtitle={`${metrics.pendingVerifCount} pendiente(s) de verificación · ${metrics.openDiscrepancies.length} discrepancia(s)`}
          tone={metrics.pendingVerifCount > 0 || metrics.openDiscrepancies.length > 0 ? 'warning' : 'positive'}
          sourceTag="Procedimientos"
          onClick={() =>
            navigate({
              module: 'organizacion',
              section: 'checklists',
              checklistStatusFilter: metrics.pendingVerifCount > 0 ? 'enviado' : 'todos'
            })
          }
        />

        {permissions.canViewManagement && (
          <KpiCard
            label="Compras pendientes"
            value={`${metrics.pendingPurchases.length} solicitud(es)`}
            subtitle="En verificación de Compras o aprobación Gerencia"
            tone={metrics.pendingPurchases.length > 0 ? 'warning' : 'positive'}
            sourceTag="Gestión · Compras"
            onClick={() => navigate({ module: 'gestion', section: 'compras' })}
          />
        )}

        {permissions.canManageInventory && (
          <KpiCard
            label="Stock crítico"
            value={`${metrics.criticalStock.length} insumos`}
            subtitle="Por debajo del mínimo operativo"
            tone={metrics.criticalStock.length > 0 ? 'danger' : 'positive'}
            sourceTag="Gestión · Inventarios"
            onClick={() =>
              navigate({
                module: 'gestion',
                section: 'inventario',
                inventoryOnlyCritical: true
              })
            }
          />
        )}

        {permissions.canViewManagement && (
          <KpiCard
            label="Mermas y desperdicios (7d)"
            value={formatARS(metrics.waste7dArs)}
            subtitle={`Desperdicio evitable · Merma proceso: ${formatARS(metrics.merma7dArs)}`}
            tone={metrics.waste7dArs > 50000 ? 'danger' : 'warning'}
            sourceTag="Analítica · Mermas"
            onClick={() =>
              permissions.canViewAnalytics
                ? navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'mermas' })
                : navigate({ module: 'gestion', section: 'mermas' })
            }
          />
        )}

        {permissions.canViewPersonnel && (
          <KpiCard
            label="Licencias pendientes"
            value={String(metrics.pendingLeaves.length)}
            subtitle="Solicitudes de vacaciones y francos"
            tone={metrics.pendingLeaves.length > 0 ? 'warning' : 'positive'}
            sourceTag="Personal · Vacaciones"
            onClick={() => navigate({ module: 'personal', section: 'vacaciones' })}
          />
        )}
      </section>

      {/* Main 2-Column Lower Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Sales Snapshot + Today's Staffing Coverage */}
        <div className="lg:col-span-7 space-y-6">
          {permissions.canViewFinancialMetrics && (
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EFECE5]">
                <div>
                  <h2 className={sectionTitleClass}>
                    Facturación diaria — últimos 7 días
                  </h2>
                  <p className="text-xs text-[#6B635B] mt-0.5">
                    Tendencias, categorías e ingeniería de menú disponibles en Analítica
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate({ module: 'analitica', section: 'gestion', analyticsSubTab: 'ventas' })
                  }
                  className={analyticsLinkClass}
                >
                  Abrir Analítica de Gestión →
                </button>
              </div>
              <div className="mt-5 h-56 w-full">
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
                    <Bar dataKey="facturacion" fill="#1769C2" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Today's Staffing by Sector */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#EFECE5]">
              <div>
                <h2 className={sectionTitleClass}>Cobertura de dotación hoy</h2>
                <p className="text-xs text-[#6B635B] mt-0.5">
                  Personal programado frente al mínimo diario por sector
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ module: 'organizacion', section: 'dotacion' })}
                className="text-xs font-semibold text-[#168B68] hover:text-[#117053] hover:underline cursor-pointer whitespace-nowrap"
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

        {/* Right 5 cols: Pending Tasks, Alerts & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
            <h2 className={`${sectionTitleClass} pb-3 border-b border-[#EFECE5]`}>
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
                    <p className="text-xs text-[#6B635B] mt-0.5">
                      Reportó {disc.reportedByName} · {formatDateTimeAR(disc.reportedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      permissions.canViewAnalytics
                        ? navigate({ module: 'analitica', section: 'discrepancias' })
                        : navigate({ module: 'organizacion', section: 'checklists' })
                    }
                    className={permissions.canViewAnalytics ? analyticsLinkClass : 'text-xs font-semibold text-[#168B68] hover:text-[#117053] hover:underline whitespace-nowrap shrink-0 cursor-pointer'}
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
                      className="text-xs font-semibold text-[#168B68] hover:text-[#117053] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Gestionar
                    </button>
                  </div>
                ))}

              {permissions.canManageInventory && metrics.criticalStock.length > 0 && (
                <div className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <StatusText label="Stock crítico" tone="danger" />
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
                    onClick={() =>
                      navigate({
                        module: 'gestion',
                        section: 'inventario',
                        inventoryOnlyCritical: true
                      })
                    }
                    className="text-xs font-semibold text-[#168B68] hover:text-[#117053] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Ver stock
                  </button>
                </div>
              )}

              {permissions.canViewManagement && metrics.waste7dArs > 0 && (
                <div className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <StatusText label="Pérdidas y desperdicios (7d)" tone="warning" />
                    <p className="mt-0.5 text-sm font-medium text-[#1C1917]">
                      Desperdicio: {formatARS(metrics.waste7dArs)} · Merma: {formatARS(metrics.merma7dArs)}
                    </p>
                    <p className="text-xs text-[#5E5851] mt-0.5">
                      Impacto acumulado con baja trazable en inventario
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        module: 'analitica',
                        section: 'gestion',
                        analyticsSubTab: 'mermas'
                      })
                    }
                    className={analyticsLinkClass}
                  >
                    Analizar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Cross-Module Activity Feed */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE5]">
              <h2 className={sectionTitleClass}>Actividad reciente</h2>
              {permissions.canViewAnalytics && (
                <button
                  type="button"
                  onClick={() => navigate({ module: 'analitica', section: 'auditoria' })}
                  className={analyticsLinkClass}
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
