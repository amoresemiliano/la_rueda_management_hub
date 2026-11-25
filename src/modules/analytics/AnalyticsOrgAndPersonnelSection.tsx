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
import { Eye, History, Search } from 'lucide-react';
import {
  EmptyState,
  inputClass,
  KpiCard,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { AuditEvent, ChecklistExecution, DiscrepancyStatus } from '../../domain/types';
import { useAppStore } from '../../services/store';
import {
  formatARS,
  formatDateAR,
  formatDateTimeAR,
  formatNumberAR,
  formatPercent,
  todayISO
} from '../../utils/formatters';

// ==========================================
// 1. ANALÍTICA / ORGANIZACIÓN
// ==========================================
export const AnalyticsOrganizationSection: React.FC = () => {
  const { data, navigate } = useAppStore();
  const today = todayISO();

  const metrics = useMemo(() => {
    const totalExec = data.checklistExecutions.length;
    const submitted = data.checklistExecutions.filter((e) => e.verificationStatus !== 'borrador');
    const verified = data.checklistExecutions.filter((e) => e.verificationStatus === 'verificado');
    const pendingVerif = data.checklistExecutions.filter((e) => e.verificationStatus === 'enviado');
    const openDisc = data.discrepancies.filter((d) => d.status !== 'resuelta');

    // Procedures without execution today
    const executedProcIdsToday = new Set(
      data.checklistExecutions
        .filter((e) => e.operationalDate === today && e.verificationStatus !== 'borrador')
        .map((e) => e.procedureId)
    );
    const pendingProceduresToday = data.procedures.filter(
      (p) => p.active && (p.frequency === 'diaria' || p.frequency === 'por_turno') && !executedProcIdsToday.has(p.id)
    );

    const todayShifts = data.shiftAssignments.filter((s) => s.operationalDate === today);
    const plannedCount = todayShifts.filter((s) => s.status !== 'franco' && s.status !== 'licencia').length;
    const activeCount = todayShifts.filter((s) => s.status === 'presente' || s.status === 'programado').length;
    const unfilledCount = data.sectors.reduce((acc, s) => {
      const working = todayShifts.filter(
        (sh) => sh.sectorId === s.id && (sh.status === 'presente' || sh.status === 'programado')
      ).length;
      return acc + Math.max(0, s.dailyMinHeadcount - working);
    }, 0);

    const bySector = data.sectors.map((s) => {
      const secExecs = data.checklistExecutions.filter((e) => e.sectorId === s.id);
      const secVerified = secExecs.filter((e) => e.verificationStatus === 'verificado').length;
      const secPending = secExecs.filter((e) => e.verificationStatus === 'enviado').length;
      const secDisc = data.discrepancies.filter((d) => d.sectorId === s.id).length;
      const working = todayShifts.filter(
        (sh) => sh.sectorId === s.id && (sh.status === 'presente' || sh.status === 'programado')
      ).length;
      return {
        id: s.id,
        sector: s.code,
        sectorName: s.name,
        verificadas: secVerified,
        pendientes: secPending,
        discrepancias: secDisc,
        working,
        minHeadcount: s.dailyMinHeadcount,
        shortfall: Math.max(0, s.dailyMinHeadcount - working)
      };
    });

    return {
      completionRate: totalExec > 0 ? (submitted.length / totalExec) * 100 : 0,
      verifiedRate: submitted.length > 0 ? (verified.length / submitted.length) * 100 : 0,
      pendingVerifCount: pendingVerif.length,
      openDiscCount: openDisc.length,
      pendingProceduresToday,
      plannedCount,
      activeCount,
      unfilledCount,
      bySector
    };
  }, [data, today]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tasa de verificación"
          value={formatPercent(metrics.verifiedRate, 0)}
          subtitle={`${metrics.pendingVerifCount} checklist(s) pendientes de verificación`}
          tone={metrics.verifiedRate >= 70 ? 'positive' : 'warning'}
          onClick={() => navigate({ module: 'organizacion', section: 'checklists', checklistStatusFilter: 'enviado' })}
        />
        <KpiCard
          label="Procedimientos diarios pendientes hoy"
          value={String(metrics.pendingProceduresToday.length)}
          subtitle={`Sobre ${data.procedures.filter((p) => p.active).length} procedimientos activos`}
          tone={metrics.pendingProceduresToday.length > 0 ? 'warning' : 'positive'}
          onClick={() => navigate({ module: 'organizacion', section: 'checklists' })}
        />
        <KpiCard
          label="Turnos sin cubrir hoy"
          value={metrics.unfilledCount > 0 ? `${metrics.unfilledCount} puesto(s)` : 'Cubierto'}
          subtitle={`Activos hoy: ${metrics.activeCount} / planificados ${metrics.plannedCount}`}
          tone={metrics.unfilledCount > 0 ? 'danger' : 'positive'}
          onClick={() => navigate({ module: 'organizacion', section: 'dotacion' })}
        />
        <KpiCard
          label="Discrepancias abiertas"
          value={String(metrics.openDiscCount)}
          subtitle={`${data.discrepancies.length} históricas registradas`}
          tone={metrics.openDiscCount > 0 ? 'danger' : 'positive'}
          onClick={() => navigate({ module: 'analitica', section: 'discrepancias' })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg p-6">
          <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
            Cumplimiento y discrepancias por sector
          </h3>
          <p className="text-xs text-[#5E5851]">
            Verificaciones conformes, pendientes y desvíos reportados
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.bySector.filter((s) => s.verificadas + s.pendientes + s.discrepancias > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip />
                <Bar dataKey="verificadas" name="Verificados" fill="#15803D" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pendientes" name="Pend. verif." fill="#9A6B3F" radius={[3, 3, 0, 0]} />
                <Bar dataKey="discrepancias" name="Discrepancias" fill="#B91C1C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1C1917]">
              Cobertura operativa y procedimientos por sector
            </span>
            <button
              type="button"
              onClick={() => navigate({ module: 'organizacion', section: 'dotacion' })}
              className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
            >
              Gestionar dotación →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                  <th className="py-2.5 px-4 font-medium">Sector</th>
                  <th className="py-2.5 px-3 font-medium text-right">Dotación hoy</th>
                  <th className="py-2.5 px-3 font-medium text-right">Verificados</th>
                  <th className="py-2.5 px-4 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {metrics.bySector.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-medium text-[#1C1917]">{row.sectorName}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {row.working}/{row.minHeadcount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {row.verificadas}
                    </td>
                    <td className="py-2.5 px-4 text-right">
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
    </div>
  );
};

// ==========================================
// 2. ANALÍTICA / PERSONAL (Permission-controlled, privacy-safe)
// ==========================================
export const AnalyticsPersonnelSection: React.FC = () => {
  const { data, permissions, navigate } = useAppStore();

  const metrics = useMemo(() => {
    const activeEmps = data.employees.filter((e) => e.status !== 'egresado');
    const bySector = data.sectors
      .map((s) => {
        const emps = activeEmps.filter((e) => e.currentSectorId === s.id);
        const absences = data.attendanceEvents.filter(
          (a) =>
            a.sectorId === s.id &&
            (a.eventType === 'ausencia_injustificada' || a.eventType === 'ausencia_justificada')
        ).length;
        const lates = data.attendanceEvents.filter(
          (a) => a.sectorId === s.id && a.eventType === 'tardanza'
        ).length;
        const extraHours = data.attendanceEvents
          .filter((a) => a.sectorId === s.id && (a.eventType === 'horas_extra' || a.eventType === 'franco_trabajado'))
          .reduce((acc, a) => acc + (a.extraHours ?? 0), 0);

        return {
          id: s.id,
          code: s.code,
          name: s.name,
          headcount: emps.length,
          absences,
          lates,
          extraHours
        };
      })
      .filter((r) => r.headcount > 0)
      .sort((a, b) => b.headcount - a.headcount);

    const totalAbsences = bySector.reduce((a, b) => a + b.absences, 0);
    const totalLates = bySector.reduce((a, b) => a + b.lates, 0);
    const totalExtraHours = bySector.reduce((a, b) => a + b.extraHours, 0);

    // Vacation utilization aggregate
    const vacEntitled = data.vacationBalances.reduce((a, b) => a + b.entitledDays, 0);
    const vacTaken = data.vacationBalances.reduce((a, b) => a + b.takenDays + b.approvedPendingDays, 0);
    const vacUtilPct = vacEntitled > 0 ? (vacTaken / vacEntitled) * 100 : 0;

    // Training participation
    const totalEnrollments = data.trainingAttendances.length;
    const attendedCount = data.trainingAttendances.filter((t) => t.status === 'asistio').length;
    const trainingRate = totalEnrollments > 0 ? (attendedCount / totalEnrollments) * 100 : 0;

    // Aggregate payroll (only rendered when canViewSalaryAndPayroll)
    const payrollNetTotal = data.payrollPreparations.reduce((a, b) => a + b.netEstimatedArs, 0);
    const payrollTipsTotal = data.payrollPreparations.reduce((a, b) => a + b.tipsAmountArs, 0);
    const payrollAdvancesTotal = data.payrollPreparations.reduce(
      (a, b) => a + b.advancesDeductionArs + b.loanInstallmentArs,
      0
    );

    return {
      totalActive: activeEmps.length,
      bySector,
      totalAbsences,
      totalLates,
      totalExtraHours,
      vacUtilPct,
      vacTaken,
      vacEntitled,
      trainingRate,
      attendedCount,
      totalEnrollments,
      payrollNetTotal,
      payrollTipsTotal,
      payrollAdvancesTotal
    };
  }, [data]);

  if (!permissions.canViewPersonnel || !permissions.canViewAllEmployees) {
    return (
      <EmptyState
        title="Indicadores globales de Personal restringidos"
        description="Por privacidad del personal, los indicadores agregados de dotación, ausentismo y pre-liquidación están habilitados para RRHH, Gerencia y Dirección."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Dotación activa total"
          value={`${metrics.totalActive} pers.`}
          subtitle={`${data.sectors.length} sectores operativos`}
          onClick={() => navigate({ module: 'personal', section: 'directorio' })}
        />
        <KpiCard
          label="Ausencias y tardanzas"
          value={`${metrics.totalAbsences} aus. · ${metrics.totalLates} tard.`}
          subtitle={`${formatNumberAR(metrics.totalExtraHours, 1)} horas extra registradas`}
          tone={metrics.totalAbsences > 4 ? 'warning' : 'default'}
          onClick={() => navigate({ module: 'personal', section: 'asistencia' })}
        />
        <KpiCard
          label="Uso de vacaciones"
          value={formatPercent(metrics.vacUtilPct, 0)}
          subtitle={`${metrics.vacTaken} de ${metrics.vacEntitled} días tomados/aprobados`}
          onClick={() => navigate({ module: 'personal', section: 'vacaciones' })}
        />
        <KpiCard
          label="Participación capacitaciones"
          value={formatPercent(metrics.trainingRate, 0)}
          subtitle={`${metrics.attendedCount} asistencias sobre ${metrics.totalEnrollments} inscripciones`}
          tone="positive"
          onClick={() => navigate({ module: 'personal', section: 'desempeno' })}
        />
      </div>

      {permissions.canViewSalaryAndPayroll && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Neto estimado pre-liquidación"
            value={formatARS(metrics.payrollNetTotal)}
            subtitle="Agregado semanal (no reemplaza liquidación legal)"
            onClick={() => navigate({ module: 'personal', section: 'preliquidacion' })}
          />
          <KpiCard
            label="Propinas consolidadas"
            value={formatARS(metrics.payrollTipsTotal)}
            subtitle="Período semanal vigente"
            tone="positive"
          />
          <KpiCard
            label="Descuentos por adelantos y cuotas"
            value={formatARS(metrics.payrollAdvancesTotal)}
            subtitle="Sincronizado desde Préstamos y adelantos"
            onClick={() => navigate({ module: 'personal', section: 'prestamos' })}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg p-6">
          <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
            Distribución de dotación por sector
          </h3>
          <p className="text-xs text-[#5E5851]">
            Colaboradores activos vinculados al organigrama vigente
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.bySector} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#1C1917' }} width={132} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: unknown) => [`${v} colaboradores`, 'Dotación']} />
                <Bar dataKey="headcount" fill="#7C2D36" radius={[0, 3, 3, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4]">
            <span className="text-xs font-semibold text-[#1C1917]">
              Indicadores agregados de asistencia por sector (sin puntajes individuales)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                  <th className="py-2.5 px-4 font-medium">Sector</th>
                  <th className="py-2.5 px-3 font-medium text-right">Dotación</th>
                  <th className="py-2.5 px-3 font-medium text-right">Ausencias</th>
                  <th className="py-2.5 px-3 font-medium text-right">Tardanzas</th>
                  <th className="py-2.5 px-4 font-medium text-right">Hs extra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {metrics.bySector.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-medium text-[#1C1917]">{row.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.headcount}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#B91C1C]">
                      {row.absences}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#B45309]">
                      {row.lates}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatNumberAR(row.extraHours, 1)} hs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. ANALÍTICA / DISCREPANCIAS (Centralized Monitoring + Linked Execution Inspection)
// ==========================================
export const AnalyticsDiscrepanciesSection: React.FC = () => {
  const { data, permissions, resolveDiscrepancy, navigate } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<'todas' | DiscrepancyStatus>('todas');
  const [sectorFilter, setSectorFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [inspectExecution, setInspectExecution] = useState<ChecklistExecution | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.discrepancies.filter((d) => {
      if (statusFilter !== 'todas' && d.status !== statusFilter) return false;
      if (sectorFilter !== 'todos' && d.sectorId !== sectorFilter) return false;
      if (q && !`${d.disputedTaskLabel} ${d.observation} ${d.reportedByName}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data.discrepancies, statusFilter, sectorFilter, search]);

  const recurringBySector = useMemo(() => {
    return data.sectors
      .map((s) => {
        const list = data.discrepancies.filter((d) => d.sectorId === s.id);
        return {
          sector: s.code,
          name: s.name,
          abiertas: list.filter((d) => d.status !== 'resuelta').length,
          resueltas: list.filter((d) => d.status === 'resuelta').length,
          total: list.length
        };
      })
      .filter((r) => r.total > 0);
  }, [data.sectors, data.discrepancies]);

  const empName = (id?: string) => {
    if (!id) return '—';
    const e = data.employees.find((item) => item.id === id);
    return e ? `${e.firstName} ${e.lastName} (${e.legajo})` : id;
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolutionText.trim()) return;
    resolveDiscrepancy(resolvingId, resolutionText.trim());
    setResolvingId(null);
    setResolutionText('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Discrepancias abiertas"
          value={String(data.discrepancies.filter((d) => d.status !== 'resuelta').length)}
          subtitle="Requieren seguimiento y cierre operativo"
          tone={data.discrepancies.some((d) => d.status !== 'resuelta') ? 'danger' : 'positive'}
        />
        <KpiCard
          label="Resueltas históricamente"
          value={String(data.discrepancies.filter((d) => d.status === 'resuelta').length)}
          subtitle="Con trazabilidad de acción correctiva"
          tone="positive"
        />
        <KpiCard
          label="Sectores con hallazgos"
          value={String(recurringBySector.length)}
          subtitle="Nunca genera sanción automática en Personal"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-[#8C847A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarea, observación o reportante..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'todas' | DiscrepancyStatus)}
          className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-xs text-[#1C1917]"
        >
          <option value="todas">Todos los estados</option>
          <option value="abierta">Abiertas</option>
          <option value="en_revision">En revisión</option>
          <option value="resuelta">Resueltas</option>
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-xs text-[#1C1917]"
        >
          <option value="todos">Todos los sectores</option>
          {data.sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4]">
            <span className="text-xs font-semibold text-[#1C1917]">
              Seguimiento centralizado de discrepancias ({filtered.length})
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Sin discrepancias para los filtros aplicados"
                description="Ajustá el filtro de estado o sector para revisar el historial completo."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#F2EFE9]">
              {filtered.map((d) => {
                const sec = data.sectors.find((s) => s.id === d.sectorId);
                const linkedExec = data.checklistExecutions.find((e) => e.id === d.executionId);
                return (
                  <div key={d.id} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <StatusText
                          label={d.status === 'resuelta' ? 'Resuelta' : 'Abierta'}
                          tone={d.status === 'resuelta' ? 'positive' : 'danger'}
                        />
                        <span className="text-[#5E5851]">· {sec?.name}</span>
                        <span className="font-mono text-[#5E5851]">· {formatDateTimeAR(d.reportedAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {linkedExec && (
                          <button
                            type="button"
                            onClick={() => setInspectExecution(linkedExec)}
                            className="inline-flex items-center gap-1 text-xs text-[#1C1917] hover:text-[#7C2D36] font-medium cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver checklist origen
                          </button>
                        )}
                        {d.status !== 'resuelta' && permissions.canVerifyChecklists && (
                          <button
                            type="button"
                            onClick={() => setResolvingId(d.id)}
                            className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#1C1917]">{d.disputedTaskLabel}</div>
                    <p className="text-xs text-[#5E5851]">{d.observation}</p>
                    <div className="text-[11px] text-[#5E5851]">
                      Reportó: <strong className="text-[#1C1917]">{d.reportedByName}</strong>
                      {d.evidenceNote && ` · Evidencia: ${d.evidenceNote}`}
                      {linkedExec && ` · Ejecución: ${linkedExec.id}`}
                    </div>
                    {d.resolution && (
                      <div className="pt-2 border-t border-[#F2EFE9] text-xs text-[#15803D]">
                        <strong>Resolución ({d.verifiedByName}):</strong> {d.resolution}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-[#E6E2D8] rounded-lg p-5">
          <h4 className="text-sm font-semibold text-[#1C1917]">Recurrencia por sector</h4>
          <p className="text-xs text-[#5E5851] mt-0.5">Comparativa de hallazgos abiertos y cerrados</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recurringBySector}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="abiertas" name="Abiertas" fill="#B91C1C" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resueltas" name="Resueltas" fill="#15803D" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resolve Discrepancy Modal */}
      <Modal
        open={!!resolvingId}
        onClose={() => setResolvingId(null)}
        title="Registrar resolución de discrepancia"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className={labelClass}>Acción correctiva / resolución *</label>
            <textarea
              rows={3}
              required
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Ej. Se realizó saneamiento inmediato y se reforzó la lista de verificación."
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setResolvingId(null)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Cerrar discrepancia
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspect Linked Original Checklist Modal */}
      <Modal
        open={!!inspectExecution}
        onClose={() => setInspectExecution(null)}
        title="Registro original de checklist vinculado"
        subtitle={
          inspectExecution
            ? `ID ${inspectExecution.id} · Fecha ${formatDateAR(inspectExecution.operationalDate)}`
            : ''
        }
        maxWidthClass="max-w-2xl"
      >
        {inspectExecution && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md">
              <div>
                <div className="text-[#5E5851]">Asignado</div>
                <div className="font-semibold text-[#1C1917] mt-0.5">{empName(inspectExecution.assignedEmployeeId)}</div>
              </div>
              <div>
                <div className="text-[#5E5851]">Realizado por</div>
                <div className="font-semibold text-[#1C1917] mt-0.5">{empName(inspectExecution.performedByEmployeeId)}</div>
              </div>
              <div>
                <div className="text-[#5E5851]">Registrado por</div>
                <div className="font-semibold text-[#1C1917] mt-0.5">{inspectExecution.registeredByName}</div>
              </div>
              <div>
                <div className="text-[#5E5851]">Verificado por</div>
                <div className="font-semibold text-[#1C1917] mt-0.5">{inspectExecution.verifiedByName ?? 'Pendiente'}</div>
              </div>
            </div>

            <div className="space-y-2 border-l border-[#D6D0C4] pl-3">
              {inspectExecution.history.map((h) => (
                <div key={h.id}>
                  <span className="font-mono text-[#5E5851]">{formatDateTimeAR(h.timestamp)}</span>{' '}
                  · <strong className="text-[#1C1917]">{h.actorName}</strong> ·{' '}
                  <span className="text-[#7C2D36]">{h.action.replace('_', ' ')}</span>
                  <p className="text-[#1C1917] mt-0.5">{h.note}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EFECE5]">
              <button
                type="button"
                onClick={() => {
                  const exId = inspectExecution.id;
                  setInspectExecution(null);
                  navigate({ module: 'organizacion', section: 'checklists', selectedExecutionId: exId });
                }}
                className={primaryBtnClass}
              >
                Abrir en Procedimientos
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==========================================
// 4. ANALÍTICA / AUDITORÍA Y ACTIVIDAD
// ==========================================
export const AnalyticsAuditSection: React.FC = () => {
  const { data } = useAppStore();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<'todos' | AuditEvent['module']>('todos');
  const [actorFilter, setActorFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState('todos');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const actors = useMemo(
    () => Array.from(new Set(data.auditEvents.map((e) => e.actorName))).sort(),
    [data.auditEvents]
  );
  const actions = useMemo(
    () => Array.from(new Set(data.auditEvents.map((e) => e.action))).sort(),
    [data.auditEvents]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.auditEvents.filter((ev) => {
      if (moduleFilter !== 'todos' && ev.module !== moduleFilter) return false;
      if (actorFilter !== 'todos' && ev.actorName !== actorFilter) return false;
      if (actionFilter !== 'todos' && ev.action !== actionFilter) return false;
      const evDate = ev.timestamp.slice(0, 10);
      if (fromDate && evDate < fromDate) return false;
      if (toDate && evDate > toDate) return false;
      if (q && !`${ev.action} ${ev.summary} ${ev.actorName} ${ev.entityType} ${ev.entityId}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data.auditEvents, moduleFilter, actorFilter, actionFilter, fromDate, toDate, search]);

  return (
    <div className="space-y-4">
      {/* Multi-facet Filter Bar */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-[#8C847A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar entidad, sector o detalle..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value as 'todos' | AuditEvent['module'])}
          className={inputClass}
        >
          <option value="todos">Todos los módulos</option>
          <option value="organizacion">Organización</option>
          <option value="gestion">Gestión</option>
          <option value="personal">Personal</option>
          <option value="administracion">Administración</option>
        </select>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className={inputClass}
        >
          <option value="todos">Todos los usuarios</option>
          {actors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={inputClass}
        >
          <option value="todos">Todos los eventos</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="Fecha desde"
            className="w-full rounded-md border border-[#D6D0C4] bg-white px-2 py-2 text-xs text-[#1C1917]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="Fecha hasta"
            className="w-full rounded-md border border-[#D6D0C4] bg-white px-2 py-2 text-xs text-[#1C1917]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
            <History className="w-4 h-4 text-[#7C2D36]" />
            Trazabilidad de actividad ({filtered.length} eventos)
          </span>
          <span className="text-[11px] text-[#5E5851]">
            Registro inmutable compartido con toda la plataforma
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                <th className="py-2.5 px-4 font-medium">Fecha y hora</th>
                <th className="py-2.5 px-4 font-medium">Módulo / Entidad</th>
                <th className="py-2.5 px-4 font-medium">Evento</th>
                <th className="py-2.5 px-4 font-medium">Usuario / Rol</th>
                <th className="py-2.5 px-4 font-medium">Detalle del cambio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {filtered.slice(0, 120).map((ev) => (
                <tr key={ev.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-2.5 px-4 font-mono tabular-nums text-[#5E5851] whitespace-nowrap">
                    {formatDateTimeAR(ev.timestamp)}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="capitalize font-medium text-[#1C1917]">{ev.module}</div>
                    <div className="text-[10px] font-mono text-[#5E5851]">
                      {ev.entityType} · {ev.entityId}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-[#7C2D36] whitespace-nowrap">
                    {ev.action}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <div className="text-[#1C1917]">{ev.actorName}</div>
                    <div className="text-[10px] text-[#5E5851]">{ev.actorRole}</div>
                  </td>
                  <td className="py-2.5 px-4 text-[#1C1917]">{ev.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
