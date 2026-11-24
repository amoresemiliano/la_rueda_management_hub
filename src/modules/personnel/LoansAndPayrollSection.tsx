import React, { useMemo, useState } from 'react';
import { Check, Download, Plus, Search, X } from 'lucide-react';
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
import { Loan, LoanType } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { formatARS, formatDateAR, formatNumberAR, todayISO } from '../../utils/formatters';
import { generatePayrollSummaryPdf } from '../../utils/pdfGenerator';

const LOAN_STATUS_META: Record<Loan['status'], { label: string; tone: 'neutral' | 'warning' | 'positive' | 'danger' | 'accent' }> = {
  pendiente: { label: 'Pendiente autorización', tone: 'warning' },
  aprobado: { label: 'Aprobado (en pre-liquidación)', tone: 'positive' },
  en_curso: { label: 'En curso', tone: 'accent' },
  saldado: { label: 'Saldado', tone: 'neutral' },
  rechazado: { label: 'Rechazado', tone: 'danger' }
};

export const LoansSection: React.FC = () => {
  const {
    data,
    activeUser,
    permissions,
    navigate,
    createLoanOrAdvance,
    updateLoanStatus
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<'todos' | Loan['status']>('todos');
  const [typeFilter, setTypeFilter] = useState<'todos' | LoanType>('todos');
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [empId, setEmpId] = useState(data.employees[32]?.id ?? data.employees[0]?.id ?? '');
  const [loanType, setLoanType] = useState<LoanType>('adelanto');
  const [amountArs, setAmountArs] = useState(45000);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [grantDate, setGrantDate] = useState(todayISO());
  const [autoApprove, setAutoApprove] = useState(true);
  const [notes, setNotes] = useState('');

  const scopedLoans = useMemo(() => {
    return data.loans.filter((loan) => {
      if (!permissions.canViewAllEmployees) {
        const emp = data.employees.find((e) => e.id === loan.employeeId);
        const isSelf = activeUser.employeeId && loan.employeeId === activeUser.employeeId;
        const inManagedSector =
          emp && activeUser.managedSectorIds?.includes(emp.currentSectorId);
        if (!isSelf && !inManagedSector) return false;
      }
      if (statusFilter !== 'todos' && loan.status !== statusFilter) return false;
      if (typeFilter !== 'todos' && loan.type !== typeFilter) return false;
      return true;
    });
  }, [data.loans, data.employees, permissions.canViewAllEmployees, activeUser, statusFilter, typeFilter]);

  const totals = useMemo(() => {
    let activeBalance = 0;
    let includedInPayroll = 0;
    let pendingCount = 0;

    scopedLoans.forEach((l) => {
      if (l.status === 'pendiente') pendingCount += 1;
      if (l.status === 'aprobado' || l.status === 'en_curso') {
        l.installments.forEach((inst) => {
          if (inst.status !== 'pagada') activeBalance += inst.amountArs;
          if (inst.status === 'incluida_en_preliquidacion') includedInPayroll += inst.amountArs;
        });
      }
    });

    return { activeBalance, includedInPayroll, pendingCount };
  }, [scopedLoans]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || amountArs <= 0) return;
    const count = loanType === 'adelanto' ? 1 : Math.max(1, Math.min(24, Number(installmentsCount) || 1));
    createLoanOrAdvance({
      employeeId: empId,
      type: loanType,
      amountArs: Math.round(Number(amountArs)),
      installmentsCount: count,
      grantDate,
      autoApprove: permissions.canAuthorizeLoans && autoApprove,
      notes: notes.trim() || (loanType === 'adelanto' ? 'Adelanto de haberes semanal.' : 'Préstamo al personal en cuotas.')
    });
    setNotes('');
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Saldo activo por descontar"
          value={formatARS(totals.activeBalance)}
          subtitle="Cuotas pendientes e incluidas en pre-liquidación"
          sourceTag="Personal"
        />
        <KpiCard
          label="Incluido en pre-liquidación vigente"
          value={formatARS(totals.includedInPayroll)}
          subtitle="Sincronizado automáticamente con Propinas y Pre-liquidación"
          tone="warning"
          onClick={
            permissions.canViewSalaryAndPayroll
              ? () => navigate({ module: 'personal', section: 'preliquidacion' })
              : undefined
          }
        />
        <KpiCard
          label="Solicitudes pendientes de autorización"
          value={String(totals.pendingCount)}
          subtitle="Requieren aprobación de RRHH o Gerencia"
          tone={totals.pendingCount > 0 ? 'warning' : 'positive'}
        />
      </div>

      {/* Filter bar + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'todos' | LoanType)}
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-sm text-[#1C1917]"
          >
            <option value="todos">Todos los tipos</option>
            <option value="adelanto">Adelantos</option>
            <option value="prestamo">Préstamos en cuotas</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'todos' | Loan['status'])}
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-sm text-[#1C1917]"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="en_curso">En curso</option>
            <option value="saldado">Saldado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>

        {permissions.canAuthorizeLoans && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={primaryBtnClass}
          >
            <Plus className="w-4 h-4" />
            Registrar adelanto / préstamo
          </button>
        )}
      </div>

      {/* Loans Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#1C1917]">
            Registro de adelantos y préstamos al personal ({scopedLoans.length})
          </span>
          <span className="text-[11px] text-[#5E5851]">
            Al aprobar un adelanto o préstamo, su cuota aparece en la pre-liquidación semanal sin ejecutar pagos automáticos.
          </span>
        </div>

        {scopedLoans.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin adelantos ni préstamos para el filtro seleccionado"
              description="Registrá un nuevo adelanto o ajustá los filtros para ver los movimientos activos."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6E2D8] text-[#5E5851] bg-[#FAF9F6]">
                  <th className="py-3 px-4 font-medium">Colaborador</th>
                  <th className="py-3 px-4 font-medium">Tipo</th>
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium text-right">Monto total</th>
                  <th className="py-3 px-4 font-medium text-right">Cuotas</th>
                  <th className="py-3 px-4 font-medium text-right">Saldo pendiente</th>
                  <th className="py-3 px-4 font-medium">Autorizado por</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {scopedLoans.map((loan) => {
                  const emp = data.employees.find((e) => e.id === loan.employeeId);
                  const sec = data.sectors.find((s) => s.id === emp?.currentSectorId);
                  const paidCount = loan.installments.filter((i) => i.status === 'pagada').length;
                  const remainingBalance = loan.installments
                    .filter((i) => i.status !== 'pagada')
                    .reduce((acc, i) => acc + i.amountArs, 0);
                  const meta = LOAN_STATUS_META[loan.status];

                  return (
                    <tr key={loan.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate({
                              module: 'personal',
                              section: 'legajo',
                              selectedEmployeeId: loan.employeeId,
                              selectedEmployeeTab: 'prestamos'
                            })
                          }
                          className="font-semibold text-[#1C1917] hover:text-[#7C2D36] text-left cursor-pointer"
                        >
                          {emp ? `${emp.lastName}, ${emp.firstName}` : loan.employeeId}
                        </button>
                        <div className="text-[11px] text-[#5E5851]">
                          {emp?.legajo} · {sec?.name ?? '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#1C1917]">
                        {loan.type === 'adelanto' ? 'Adelanto' : 'Préstamo'}
                        {loan.notes && (
                          <div className="text-[11px] text-[#5E5851] max-w-[200px] truncate">
                            {loan.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E5851]">
                        {formatDateAR(loan.grantDate)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-[#1C1917]">
                        {formatARS(loan.amountArs)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right text-[#5E5851]">
                        {paidCount}/{loan.installmentsCount}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right font-medium text-[#1C1917]">
                        {loan.status === 'rechazado' ? '—' : formatARS(remainingBalance)}
                      </td>
                      <td className="py-3 px-4 text-[#5E5851]">{loan.authorizedBy}</td>
                      <td className="py-3 px-4">
                        <StatusText label={meta.label} tone={meta.tone} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {permissions.canAuthorizeLoans && loan.status === 'pendiente' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateLoanStatus(loan.id, 'aprobado')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-[#15803D] hover:bg-[#166534] rounded cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLoanStatus(loan.id, 'rechazado')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#B91C1C] border border-[#D6D0C4] hover:bg-[#F2EFE9] rounded cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              Rechazar
                            </button>
                          </div>
                        ) : permissions.canAuthorizeLoans &&
                          (loan.status === 'aprobado' || loan.status === 'en_curso') ? (
                          <button
                            type="button"
                            onClick={() => updateLoanStatus(loan.id, 'saldado')}
                            className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
                          >
                            Marcar saldado
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#8C847A]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Loan / Advance Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar adelanto o préstamo al personal"
        subtitle="Si se aprueba, la cuota vigente se incluye automáticamente en la pre-liquidación semanal sin ejecutar transferencias."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className={labelClass}>Colaborador *</label>
            <select
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className={inputClass}
              required
            >
              {data.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.lastName}, {e.firstName} ({e.legajo})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo *</label>
              <select
                value={loanType}
                onChange={(e) => {
                  const nextType = e.target.value as LoanType;
                  setLoanType(nextType);
                  if (nextType === 'adelanto') setInstallmentsCount(1);
                }}
                className={inputClass}
              >
                <option value="adelanto">Adelanto semanal (1 cuota)</option>
                <option value="prestamo">Préstamo en cuotas</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha de otorgamiento *</label>
              <input
                type="date"
                value={grantDate}
                onChange={(e) => setGrantDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Monto total (ARS) *</label>
              <input
                type="number"
                min={1000}
                step={500}
                value={amountArs}
                onChange={(e) => setAmountArs(Number(e.target.value))}
                className={`${inputClass} font-mono tabular-nums`}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Cantidad de cuotas semanales</label>
              <input
                type="number"
                min={1}
                max={24}
                disabled={loanType === 'adelanto'}
                value={loanType === 'adelanto' ? 1 : installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className={`${inputClass} font-mono tabular-nums disabled:bg-[#F2EFE9]`}
              />
            </div>
          </div>

          <div className="p-3 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md text-xs text-[#5E5851] flex items-center justify-between">
            <span>Cuota semanal estimada a descontar</span>
            <span className="font-mono tabular-nums font-semibold text-[#1C1917]">
              {formatARS(
                Math.round(
                  (Number(amountArs) || 0) /
                    (loanType === 'adelanto' ? 1 : Math.max(1, Number(installmentsCount) || 1))
                )
              )}
            </span>
          </div>

          <div>
            <label className={labelClass}>Observaciones / motivo</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Adelanto solicitado por el colaborador para descuento en semana actual."
              className={inputClass}
            />
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#1C1917] cursor-pointer">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="accent-[#7C2D36] mt-0.5 w-4 h-4 cursor-pointer"
            />
            <span>
              Aprobar ahora e incluir cuota en la pre-liquidación semanal vigente (no ejecuta pagos bancarios).
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setCreateOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Guardar registro
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ==========================================
// WEEKLY PAYROLL PREPARATION & TIPS SECTION
// ==========================================

export const PayrollPreparationSection: React.FC = () => {
  const {
    data,
    permissions,
    navigate,
    addPayrollAdjustment,
    updatePayrollLineReview,
    notify
  } = useAppStore();

  const activePeriod = data.payrollPeriods[0];
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('todos');
  const [onlyWithDeductions, setOnlyWithDeductions] = useState(false);

  // Adjustment modal
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjEmpId, setAdjEmpId] = useState(data.employees[0]?.id ?? '');
  const [adjConcept, setAdjConcept] = useState('');
  const [adjAmount, setAdjAmount] = useState(15000);
  const [adjNotes, setAdjNotes] = useState('');

  const periodLines = useMemo(() => {
    if (!activePeriod) return [];
    const q = search.trim().toLowerCase();
    return data.payrollPreparations.filter((line) => {
      if (line.payrollPeriodId !== activePeriod.id) return false;
      const emp = data.employees.find((e) => e.id === line.employeeId);
      if (!emp) return false;
      if (sectorFilter !== 'todos' && emp.currentSectorId !== sectorFilter) return false;
      if (onlyWithDeductions && line.advancesDeductionArs + line.loanInstallmentArs <= 0) {
        return false;
      }
      if (q && !`${emp.firstName} ${emp.lastName} ${emp.legajo}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [activePeriod, data.payrollPreparations, data.employees, sectorFilter, onlyWithDeductions, search]);

  const summary = useMemo(() => {
    return periodLines.reduce(
      (acc, l) => {
        acc.base += l.baseWeeklyArs;
        acc.extra += l.extraHoursAmountArs;
        acc.tips += l.tipsAmountArs;
        acc.deductions += l.advancesDeductionArs + l.loanInstallmentArs;
        acc.adjustments += l.otherAdjustmentsArs;
        acc.net += l.netEstimatedArs;
        if (l.reviewStatus === 'aprobado') acc.approvedCount += 1;
        return acc;
      },
      { base: 0, extra: 0, tips: 0, deductions: 0, adjustments: 0, net: 0, approvedCount: 0 }
    );
  }, [periodLines]);

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeriod || !adjEmpId || !adjConcept.trim()) return;
    addPayrollAdjustment({
      payrollPeriodId: activePeriod.id,
      employeeId: adjEmpId,
      concept: adjConcept.trim(),
      amountArs: Math.round(Number(adjAmount)),
      notes: adjNotes.trim() || undefined
    });
    setAdjConcept('');
    setAdjAmount(15000);
    setAdjNotes('');
    setAdjModalOpen(false);
  };

  const handleExportPdf = () => {
    if (!activePeriod) return;
    generatePayrollSummaryPdf(activePeriod, periodLines, data.employees);
    notify(`PDF de pre-liquidación ${activePeriod.code} descargado.`);
  };

  if (!permissions.canViewSalaryAndPayroll) {
    return (
      <EmptyState
        title="Acceso restringido a pre-liquidación"
        description="El rol activo no posee permisos para consultar montos salariales ni la pre-liquidación semanal."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Legal / Operational Scope Disclaimer */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#7C2D36]">
            Herramienta de gestión y pre-liquidación semanal — Sin ejecución automática de pagos
          </div>
          <p className="mt-1 text-xs text-[#5E5851] leading-relaxed">
            Consolida sueldo base de referencia, horas extra del parte semanal, propinas asignadas,
            cuotas de adelantos/préstamos aprobados y ajustes autorizados. No reemplaza la
            liquidación legal ni fiscal certificada ante ARCA/AFIP ni ejecuta transferencias bancarias.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAdjModalOpen(true)}
            className={secondaryBtnClass}
          >
            <Plus className="w-4 h-4" />
            Agregar ajuste
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className={primaryBtnClass}
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Period KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Neto estimado semanal"
          value={formatARS(summary.net)}
          subtitle={
            activePeriod
              ? `${activePeriod.label} (${formatDateAR(activePeriod.startDate)} al ${formatDateAR(activePeriod.endDate)})`
              : 'Período vigente'
          }
          sourceTag={`${periodLines.length} colab.`}
        />
        <KpiCard
          label="Horas extra + Propinas"
          value={formatARS(summary.extra + summary.tips)}
          subtitle={`Hs extra: ${formatARS(summary.extra)} · Propinas: ${formatARS(summary.tips)}`}
          tone="positive"
        />
        <KpiCard
          label="Descuentos adelantos y préstamos"
          value={formatARS(-summary.deductions)}
          subtitle="Derivado en vivo de préstamos/adelantos aprobados"
          tone={summary.deductions > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          label="Líneas aprobadas para revisión"
          value={`${summary.approvedCount} / ${periodLines.length}`}
          subtitle="Pago registrado siempre de forma manual fuera del sistema"
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-[#8C847A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por apellido, nombre o legajo..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-sm text-[#1C1917]"
          >
            <option value="todos">Todos los sectores</option>
            {data.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer px-2">
            <input
              type="checkbox"
              checked={onlyWithDeductions}
              onChange={(e) => setOnlyWithDeductions(e.target.checked)}
              className="accent-[#7C2D36] w-4 h-4 cursor-pointer"
            />
            Solo con descuentos de adelanto/préstamo
          </label>
        </div>
      </div>

      {/* Main Payroll Preparation Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1C1917]">
            Detalle de pre-liquidación — {activePeriod?.code}
          </span>
          <span className="text-[11px] font-mono text-[#5E5851]">
            Base + Hs Extra + Propinas + Ajustes − Adelantos/Préstamos = Neto Est.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E2D8] text-[#5E5851] bg-[#FAF9F6]">
                <th className="py-3 px-4 font-medium">Colaborador</th>
                <th className="py-3 px-3 font-medium text-right">Base sem.</th>
                <th className="py-3 px-3 font-medium text-right">Hs extra</th>
                <th className="py-3 px-3 font-medium text-right">Propinas</th>
                <th className="py-3 px-3 font-medium text-right">Adel./Prést.</th>
                <th className="py-3 px-3 font-medium text-right">Ajustes</th>
                <th className="py-3 px-3 font-medium text-right">Neto estimado</th>
                <th className="py-3 px-3 font-medium">Revisión</th>
                <th className="py-3 px-4 font-medium">Registro de pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {periodLines.map((line) => {
                const emp = data.employees.find((e) => e.id === line.employeeId);
                const sec = data.sectors.find((s) => s.id === emp?.currentSectorId);
                const totalDed = line.advancesDeductionArs + line.loanInstallmentArs;

                return (
                  <tr key={line.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            module: 'personal',
                            section: 'legajo',
                            selectedEmployeeId: line.employeeId,
                            selectedEmployeeTab: 'liquidacion'
                          })
                        }
                        className="font-semibold text-[#1C1917] hover:text-[#7C2D36] text-left cursor-pointer"
                      >
                        {emp ? `${emp.lastName}, ${emp.firstName}` : line.employeeId}
                      </button>
                      <div className="text-[11px] text-[#5E5851]">
                        {emp?.legajo} · {sec?.name ?? '—'}
                        {line.absencesCount > 0 && (
                          <span className="text-[#B45309]"> · {line.absencesCount} aus.</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-right text-[#1C1917]">
                      {formatARS(line.baseWeeklyArs)}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-right text-[#1C1917]">
                      <div>{formatARS(line.extraHoursAmountArs)}</div>
                      {line.extraHours > 0 && (
                        <div className="text-[10px] text-[#5E5851]">
                          {formatNumberAR(line.extraHours, 1)} hs
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-right text-[#15803D]">
                      {line.tipsAmountArs > 0 ? formatARS(line.tipsAmountArs) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-right text-[#B91C1C]">
                      {totalDed > 0 ? formatARS(-totalDed) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-right text-[#5E5851]">
                      {line.otherAdjustmentsArs !== 0 ? formatARS(line.otherAdjustmentsArs) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-[#1C1917]">
                      {formatARS(line.netEstimatedArs)}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={line.reviewStatus}
                        onChange={(e) =>
                          updatePayrollLineReview(line.id, {
                            reviewStatus: e.target.value as 'pendiente' | 'revisado' | 'aprobado'
                          })
                        }
                        className="rounded border border-[#D6D0C4] bg-white px-2 py-1 text-xs text-[#1C1917]"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="revisado">Revisado</option>
                        <option value="aprobado">Aprobado</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={line.paymentStatus}
                        onChange={(e) =>
                          updatePayrollLineReview(line.id, {
                            paymentStatus: e.target.value as 'no_ejecutado' | 'pagado_manual'
                          })
                        }
                        className="rounded border border-[#D6D0C4] bg-white px-2 py-1 text-xs text-[#1C1917]"
                      >
                        <option value="no_ejecutado">No ejecutado</option>
                        <option value="pagado_manual">Pagado manual (externo)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Authorized Payroll Adjustment Modal */}
      <Modal
        open={adjModalOpen}
        onClose={() => setAdjModalOpen(false)}
        title="Agregar ajuste autorizado en pre-liquidación"
        subtitle="Usá valores positivos para premios/reintegros o negativos para descuentos autorizados."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleAddAdjustment} className="space-y-4">
          <div>
            <label className={labelClass}>Colaborador *</label>
            <select
              value={adjEmpId}
              onChange={(e) => setAdjEmpId(e.target.value)}
              className={inputClass}
              required
            >
              {data.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.lastName}, {e.firstName} ({e.legajo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Concepto *</label>
            <input
              type="text"
              required
              value={adjConcept}
              onChange={(e) => setAdjConcept(e.target.value)}
              placeholder="Ej. Premio puntualidad / Reintegro viáticos / Descuento uniforme"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Monto (ARS) *</label>
            <input
              type="number"
              required
              step={500}
              value={adjAmount}
              onChange={(e) => setAdjAmount(Number(e.target.value))}
              className={`${inputClass} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea
              rows={2}
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAdjModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Aplicar ajuste
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
