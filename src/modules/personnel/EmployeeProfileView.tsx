import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Plus } from 'lucide-react';
import {
  inputClass,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  SegmentedTabs,
  StatusText
} from '../../components/ui/Primitives';
import { AttendanceEventType, LeaveType, LoanType } from '../../domain/types';
import { useAppStore } from '../../services/store';
import {
  addDaysISO,
  calculateTenureLabel,
  formatARS,
  formatDateAR,
  formatDateTimeAR,
  todayISO
} from '../../utils/formatters';

export const EmployeeProfileView: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const {
    data,
    permissions,
    nav,
    navigate,
    transferEmployeePosition,
    recordAttendanceEvent,
    createLeaveRequest,
    reviewLeaveRequest,
    addPerformanceEvaluation,
    addDisciplinaryAction,
    createLoanOrAdvance
  } = useAppStore();

  const employee = data.employees.find((e) => e.id === employeeId);
  const [activeTab, setActiveTab] = useState(nav.selectedEmployeeTab ?? 'resumen');

  // Transfer Modal (Scenario 7)
  const [transferOpen, setTransferOpen] = useState(false);
  const [newSectorId, setNewSectorId] = useState(employee?.currentSectorId ?? 'sec-salon');
  const [newPositionId, setNewPositionId] = useState(employee?.currentPositionId ?? 'pos-mozo');
  const [transferDate, setTransferDate] = useState(todayISO());
  const [transferType, setTransferType] = useState<'titular' | 'temporal' | 'reemplazo'>('titular');
  const [transferReason, setTransferReason] = useState('');

  // Attendance Event Modal
  const [attOpen, setAttOpen] = useState(false);
  const [attDate, setAttDate] = useState(todayISO());
  const [attType, setAttType] = useState<AttendanceEventType>('ausencia_injustificada');
  const [attHours, setAttHours] = useState(2);
  const [attMinutes, setAttMinutes] = useState(15);
  const [attNotes, setAttNotes] = useState('');

  // Leave Modal
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('vacaciones');
  const [leaveStart, setLeaveStart] = useState(addDaysISO(todayISO(), 7));
  const [leaveEnd, setLeaveEnd] = useState(addDaysISO(todayISO(), 13));
  const [leaveDays, setLeaveDays] = useState(7);
  const [leaveReason, setLeaveReason] = useState('');

  // Evaluation / Disciplinary Modal
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalCategory, setEvalCategory] = useState<'evaluacion_periodica' | 'reconocimiento' | 'observacion_operativa'>('reconocimiento');
  const [evalScore, setEvalScore] = useState(5);
  const [evalSummary, setEvalSummary] = useState('');

  const [discOpen, setDiscOpen] = useState(false);
  const [discType, setDiscType] = useState<'llamado_atencion' | 'apercibimiento' | 'suspension'>('llamado_atencion');
  const [discReason, setDiscReason] = useState('');

  // Loan / Advance Modal (Scenario 9)
  const [loanOpen, setLoanOpen] = useState(false);
  const [loanType, setLoanType] = useState<LoanType>('adelanto');
  const [loanAmount, setLoanAmount] = useState(40000);
  const [loanInstallments, setLoanInstallments] = useState(1);
  const [loanNotes, setLoanNotes] = useState('');

  const related = useMemo(() => {
    if (!employee) return null;
    const sector = data.sectors.find((s) => s.id === employee.currentSectorId);
    const position = data.positions.find((p) => p.id === employee.currentPositionId);
    const supervisor = data.employees.find((e) => e.id === employee.supervisorEmployeeId);
    const assignments = data.employeeAssignments
      .filter((a) => a.employeeId === employee.id)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
    const shifts = data.shiftAssignments
      .filter((s) => s.employeeId === employee.id)
      .sort((a, b) => b.operationalDate.localeCompare(a.operationalDate));
    const attendance = data.attendanceEvents
      .filter((a) => a.employeeId === employee.id)
      .sort((a, b) => b.operationalDate.localeCompare(a.operationalDate));
    const vacBalance = data.vacationBalances.find((v) => v.employeeId === employee.id);
    const leaves = data.leaveRequests
      .filter((l) => l.employeeId === employee.id)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    const evaluations = data.performanceEvaluations.filter((p) => p.employeeId === employee.id);
    const disciplinary = data.disciplinaryActions.filter((d) => d.employeeId === employee.id);
    const trainings = data.trainingAttendances
      .filter((ta) => ta.employeeId === employee.id)
      .map((ta) => ({
        attendance: ta,
        session: data.trainingSessions.find((ts) => ts.id === ta.trainingSessionId)
      }));
    const loans = data.loans.filter((l) => l.employeeId === employee.id);
    const tips = data.tipAllocations.filter((t) => t.employeeId === employee.id);
    const payrollLines = data.payrollPreparations.filter((p) => p.employeeId === employee.id);
    const docs = data.documents.filter(
      (d) => d.employeeId === employee.id || d.sectorId === employee.currentSectorId
    );
    const checklists = data.checklistExecutions.filter(
      (c) => c.assignedEmployeeId === employee.id || c.performedByEmployeeId === employee.id
    );

    return {
      sector,
      position,
      supervisor,
      assignments,
      shifts,
      attendance,
      vacBalance,
      leaves,
      evaluations,
      disciplinary,
      trainings,
      loans,
      tips,
      payrollLines,
      docs,
      checklists
    };
  }, [data, employee]);

  if (!employee || !related) {
    return (
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-8 text-center">
        <p className="text-sm text-[#5E5851]">Colaborador no encontrado.</p>
        <button
          type="button"
          onClick={() => navigate({ module: 'personal', section: 'directorio' })}
          className={`${secondaryBtnClass} mt-4`}
        >
          Volver al directorio
        </button>
      </div>
    );
  }

  const availableVacationDays = related.vacBalance
    ? related.vacBalance.entitledDays -
      related.vacBalance.takenDays -
      related.vacBalance.approvedPendingDays
    : 0;

  const transferSectorPositions = data.positions.filter((p) => p.sectorId === newSectorId);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferReason.trim() || !newPositionId) return;
    const sec = data.sectors.find((s) => s.id === newSectorId);
    transferEmployeePosition({
      employeeId: employee.id,
      newSectorId,
      newPositionId,
      newSupervisorEmployeeId: sec?.managerEmployeeId,
      effectiveDate: transferDate,
      assignmentType: transferType,
      reason: transferReason.trim()
    });
    setTransferReason('');
    setTransferOpen(false);
    setActiveTab('trayectoria');
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordAttendanceEvent({
      employeeId: employee.id,
      sectorId: employee.currentSectorId,
      operationalDate: attDate,
      eventType: attType,
      extraHours: attType === 'horas_extra' || attType === 'franco_trabajado' ? attHours : undefined,
      minutesLate: attType === 'tardanza' ? attMinutes : undefined,
      justified: attType === 'ausencia_justificada',
      notes: attNotes.trim() || `Novedad ${attType} registrada en legajo.`
    });
    setAttNotes('');
    setAttOpen(false);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeaveRequest({
      employeeId: employee.id,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      daysRequested: Math.max(1, Number(leaveDays) || 1),
      reason: leaveReason.trim() || 'Solicitud registrada desde legajo.'
    });
    setLeaveReason('');
    setLeaveOpen(false);
  };

  const handleEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalSummary.trim()) return;
    addPerformanceEvaluation({
      employeeId: employee.id,
      operationalDate: todayISO(),
      category: evalCategory,
      score: evalCategory === 'evaluacion_periodica' ? evalScore : undefined,
      summary: evalSummary.trim()
    });
    setEvalSummary('');
    setEvalOpen(false);
  };

  const handleDiscSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discReason.trim()) return;
    addDisciplinaryAction({
      employeeId: employee.id,
      operationalDate: todayISO(),
      type: discType,
      reason: discReason.trim()
    });
    setDiscReason('');
    setDiscOpen(false);
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loanAmount <= 0) return;
    createLoanOrAdvance({
      employeeId: employee.id,
      type: loanType,
      amountArs: Number(loanAmount),
      installmentsCount: loanType === 'adelanto' ? 1 : Math.max(1, Number(loanInstallments)),
      grantDate: todayISO(),
      autoApprove: permissions.canAuthorizeLoans,
      notes: loanNotes.trim() || 'Registrado desde legajo digital.'
    });
    setLoanNotes('');
    setLoanOpen(false);
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'datos', label: 'Datos y contrato' },
    { id: 'trayectoria', label: 'Trayectoria laboral', count: related.assignments.length },
    { id: 'asistencia', label: 'Asistencia y novedades', count: related.attendance.length },
    { id: 'vacaciones', label: 'Vacaciones y licencias', count: related.leaves.length },
    { id: 'desempeno', label: 'Desempeño y disciplina' },
    { id: 'capacitaciones', label: 'Capacitaciones', count: related.trainings.length },
    ...(permissions.canViewSalaryAndPayroll
      ? [
          { id: 'prestamos', label: 'Préstamos y adelantos', count: related.loans.length },
          { id: 'propinas', label: 'Propinas y liquidaciones' }
        ]
      : []),
    { id: 'documentacion', label: 'Documentación', count: related.docs.length }
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Profile Header */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
        <button
          type="button"
          onClick={() => navigate({ module: 'personal', section: 'directorio' })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E5851] hover:text-[#7C2D36] mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al directorio de personal
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5E5851]">
              <span className="font-mono font-semibold text-[#1C1917]">{employee.legajo}</span>
              <span>·</span>
              <span>ID Demo: {employee.fictionalDocCode}</span>
              <span>·</span>
              <StatusText
                label={employee.status === 'activo' ? 'Activo' : employee.status}
                tone={employee.status === 'activo' ? 'positive' : 'warning'}
              />
            </div>
            <h2 className="mt-1 text-3xl font-editorial font-semibold text-[#1C1917]">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="mt-1 text-sm text-[#5E5851]">
              <strong className="text-[#7C2D36] font-medium">{related.position?.name}</strong> en{' '}
              <button
                type="button"
                onClick={() =>
                  navigate({
                    module: 'organizacion',
                    section: 'organigrama',
                    selectedSectorId: employee.currentSectorId
                  })
                }
                className="underline hover:text-[#7C2D36] cursor-pointer"
              >
                {related.sector?.name}
              </button>{' '}
              · Ingreso {formatDateAR(employee.hireDate)} ({calculateTenureLabel(employee.hireDate)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {permissions.canCreateOrTransferEmployee && (
              <button
                type="button"
                onClick={() => {
                  setNewSectorId(employee.currentSectorId);
                  setNewPositionId(employee.currentPositionId);
                  setTransferOpen(true);
                }}
                className={secondaryBtnClass}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Registrar traslado / ascenso
              </button>
            )}
            {permissions.canManageStaffing && (
              <button type="button" onClick={() => setAttOpen(true)} className={primaryBtnClass}>
                <Plus className="w-4 h-4" />
                Registrar novedad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 10-Tab Profile Navigation */}
      <SegmentedTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      {/* TAB 1: RESUMEN */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-5">
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Resumen del legajo digital
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#5E5851]">Sector actual</span>
                <div className="mt-0.5 font-semibold text-[#1C1917]">{related.sector?.name}</div>
              </div>
              <div>
                <span className="text-[#5E5851]">Puesto titular</span>
                <div className="mt-0.5 font-semibold text-[#1C1917]">{related.position?.name}</div>
              </div>
              <div>
                <span className="text-[#5E5851]">Supervisor directo</span>
                <div className="mt-0.5 font-semibold text-[#1C1917]">
                  {related.supervisor
                    ? `${related.supervisor.firstName} ${related.supervisor.lastName}`
                    : 'Dirección'}
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Vacaciones disponibles</span>
                <div className="mt-0.5 font-mono font-semibold text-base text-[#15803D]">
                  {availableVacationDays} días
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Checklists vinculados</span>
                <div className="mt-0.5 font-mono font-semibold text-base text-[#1C1917]">
                  {related.checklists.length}
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Asignaciones históricas</span>
                <div className="mt-0.5 font-mono font-semibold text-base text-[#1C1917]">
                  {related.assignments.length}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EFECE5]">
              <h4 className="text-xs font-semibold text-[#5E5851] mb-2">Próximos turnos y recientes</h4>
              <div className="divide-y divide-[#F2EFE9]">
                {related.shifts.slice(0, 4).map((sh) => (
                  <div key={sh.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-mono">{formatDateAR(sh.operationalDate)}</span>
                    <span className="font-mono text-[#5E5851]">
                      {sh.startTime} – {sh.endTime}
                    </span>
                    <StatusText
                      label={sh.status.replace('_', ' ')}
                      tone={sh.status === 'presente' ? 'positive' : sh.status.includes('ausente') ? 'danger' : 'neutral'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#E6E2D8] rounded-lg p-6">
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917] pb-3 border-b border-[#EFECE5]">
              Línea de tiempo laboral reciente
            </h3>
            <div className="mt-3 space-y-3 border-l border-[#D6D0C4] pl-4 text-xs">
              {related.assignments.map((asg) => {
                const s = data.sectors.find((x) => x.id === asg.sectorId);
                const p = data.positions.find((x) => x.id === asg.positionId);
                return (
                  <div key={asg.id}>
                    <div className="font-mono text-[#5E5851]">
                      {formatDateAR(asg.startDate)} {asg.endDate ? `→ ${formatDateAR(asg.endDate)}` : '→ Vigente'}
                    </div>
                    <div className="font-semibold text-[#1C1917]">
                      {p?.name} ({s?.name})
                    </div>
                    <div className="text-[#5E5851]">{asg.reason}</div>
                  </div>
                );
              })}
              {related.attendance.slice(0, 3).map((att) => (
                <div key={att.id}>
                  <div className="font-mono text-[#5E5851]">{formatDateAR(att.operationalDate)}</div>
                  <div className="font-semibold text-[#7C2D36]">
                    Novedad: {att.eventType.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[#5E5851]">{att.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATOS Y CONTRATO */}
      {activeTab === 'datos' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Identidad y contacto (sintéticos)
            </h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Legajo único</dt>
                <dd className="font-mono font-semibold">{employee.legajo}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Identificador demo</dt>
                <dd className="font-mono">{employee.fictionalDocCode}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Correo electrónico</dt>
                <dd>{employee.email}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Teléfono</dt>
                <dd className="font-mono">{employee.phone}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Contacto de emergencia</dt>
                <dd>
                  {employee.emergencyContactName} ({employee.emergencyContactPhone})
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Condiciones contractuales
            </h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Fecha de ingreso</dt>
                <dd className="font-mono">{formatDateAR(employee.hireDate)}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Tipo de contrato</dt>
                <dd className="capitalize">{employee.contractType.replace(/_/g, ' ')}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                <dt className="text-[#5E5851]">Estado laboral</dt>
                <dd className="capitalize font-medium">{employee.status}</dd>
              </div>
              {permissions.canViewSalaryAndPayroll ? (
                <>
                  <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                    <dt className="text-[#5E5851]">Referencia base semanal (demo)</dt>
                    <dd className="font-mono font-semibold text-[#1C1917]">
                      {formatARS(employee.weeklyBaseSalaryArs)}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F2EFE9]">
                    <dt className="text-[#5E5851]">Valor hora extra ref. (demo)</dt>
                    <dd className="font-mono">{formatARS(employee.hourlyExtraRateArs)}</dd>
                  </div>
                </>
              ) : (
                <div className="py-2 text-xs text-[#5E5851] italic">
                  Información salarial restringida para el rol actual.
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* TAB 3: TRAYECTORIA LABORAL (Scenario 7) */}
      {activeTab === 'trayectoria' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                Historial completo de asignaciones y traslados
              </h3>
              <p className="text-xs text-[#5E5851]">
                Cada cambio de puesto o sector conserva intacta la asignación anterior con fechas de vigencia.
              </p>
            </div>
            {permissions.canCreateOrTransferEmployee && (
              <button
                type="button"
                onClick={() => setTransferOpen(true)}
                className={primaryBtnClass}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Nuevo traslado / puesto
              </button>
            )}
          </div>

          <div className="divide-y divide-[#F2EFE9]">
            {related.assignments.map((asg) => {
              const sec = data.sectors.find((s) => s.id === asg.sectorId);
              const pos = data.positions.find((p) => p.id === asg.positionId);
              return (
                <div key={asg.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <StatusText
                        label={asg.active ? 'Asignación vigente' : 'Histórica'}
                        tone={asg.active ? 'positive' : 'neutral'}
                      />
                      <span className="text-[#5E5851]">· Tipo: {asg.assignmentType}</span>
                    </div>
                    <div className="mt-1 text-base font-semibold text-[#1C1917]">
                      {pos?.name} — {sec?.name}
                    </div>
                    <p className="text-xs text-[#5E5851] mt-0.5">{asg.reason}</p>
                  </div>
                  <div className="text-xs font-mono text-[#5E5851] sm:text-right shrink-0">
                    <div>
                      Desde: <strong className="text-[#1C1917]">{formatDateAR(asg.startDate)}</strong>
                    </div>
                    <div>
                      Hasta:{' '}
                      <strong className="text-[#1C1917]">
                        {asg.endDate ? formatDateAR(asg.endDate) : 'Actualidad'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ASISTENCIA Y NOVEDADES */}
      {activeTab === 'asistencia' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Asistencias, ausencias, tardanzas y horas extra ({related.attendance.length})
            </h3>
            {permissions.canManageStaffing && (
              <button type="button" onClick={() => setAttOpen(true)} className={primaryBtnClass}>
                <Plus className="w-4 h-4" />
                Registrar novedad
              </button>
            )}
          </div>
          {related.attendance.length === 0 ? (
            <p className="text-xs text-[#5E5851]">No hay novedades registradas para este colaborador.</p>
          ) : (
            <div className="divide-y divide-[#F2EFE9]">
              {related.attendance.map((att) => (
                <div key={att.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#1C1917]">
                        {formatDateAR(att.operationalDate)}
                      </span>
                      <StatusText
                        label={att.eventType.replace(/_/g, ' ')}
                        tone={
                          att.eventType.includes('ausencia')
                            ? 'danger'
                            : att.eventType === 'tardanza'
                              ? 'warning'
                              : 'positive'
                        }
                      />
                      {att.extraHours && <span className="font-mono">+{att.extraHours} hs</span>}
                      {att.minutesLate && <span className="font-mono">{att.minutesLate} min</span>}
                    </div>
                    <p className="mt-1 text-[#5E5851]">{att.notes}</p>
                  </div>
                  <div className="text-[11px] text-[#5E5851] sm:text-right">
                    Registró: {att.registeredBy} · {formatDateTimeAR(att.registeredAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: VACACIONES Y LICENCIAS */}
      {activeTab === 'vacaciones' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-[#5E5851]">Corresponden</span>
                <div className="font-mono text-lg font-semibold">
                  {related.vacBalance?.entitledDays ?? 14} d.
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Tomados</span>
                <div className="font-mono text-lg font-semibold">
                  {related.vacBalance?.takenDays ?? 0} d.
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Aprobados pendientes</span>
                <div className="font-mono text-lg font-semibold text-[#B45309]">
                  {related.vacBalance?.approvedPendingDays ?? 0} d.
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Saldo disponible</span>
                <div className="font-mono text-lg font-semibold text-[#15803D]">
                  {availableVacationDays} d.
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setLeaveOpen(true)} className={primaryBtnClass}>
              <Plus className="w-4 h-4" />
              Nueva solicitud
            </button>
          </div>

          <div className="divide-y divide-[#F2EFE9] border-t border-[#EFECE5]">
            {related.leaves.map((lv) => (
              <div key={lv.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1C1917] capitalize">
                      {lv.type.replace('_', ' ')} ({lv.daysRequested} días)
                    </span>
                    <StatusText
                      label={lv.status}
                      tone={
                        lv.status === 'aprobada'
                          ? 'positive'
                          : lv.status === 'rechazada'
                            ? 'danger'
                            : 'warning'
                      }
                    />
                  </div>
                  <div className="mt-0.5 text-[#5E5851] font-mono">
                    {formatDateAR(lv.startDate)} al {formatDateAR(lv.endDate)}
                  </div>
                  <p className="mt-0.5 text-[#5E5851]">{lv.reason}</p>
                </div>

                {lv.status === 'pendiente' && permissions.canApproveLeaves && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => reviewLeaveRequest(lv.id, 'aprobada', 'Aprobada desde legajo.')}
                      className={primaryBtnClass}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewLeaveRequest(lv.id, 'rechazada', 'No autorizada por cobertura.')}
                      className={secondaryBtnClass}
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DESEMPEÑO Y DISCIPLINA (Strictly distinct record types) */}
      {activeTab === 'desempeno' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                Evaluaciones y reconocimientos ({related.evaluations.length})
              </h3>
              {permissions.canManageStaffing && (
                <button type="button" onClick={() => setEvalOpen(true)} className={secondaryBtnClass}>
                  + Agregar
                </button>
              )}
            </div>
            <div className="divide-y divide-[#F2EFE9]">
              {related.evaluations.length === 0 ? (
                <p className="text-xs text-[#5E5851]">Sin evaluaciones registradas.</p>
              ) : (
                related.evaluations.map((ev) => (
                  <div key={ev.id} className="py-3 text-xs space-y-1">
                    <div className="flex justify-between text-[#5E5851]">
                      <span className="font-semibold text-[#15803D] capitalize">
                        {ev.category.replace(/_/g, ' ')} {ev.score ? `· ${ev.score}/5` : ''}
                      </span>
                      <span className="font-mono">{formatDateAR(ev.operationalDate)}</span>
                    </div>
                    <p className="text-[#1C1917]">{ev.summary}</p>
                    <div className="text-[11px] text-[#5E5851]">Evaluó: {ev.evaluatorName}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                Medidas disciplinarias autorizadas
              </h3>
              {permissions.canViewDisciplinary && (
                <button type="button" onClick={() => setDiscOpen(true)} className={secondaryBtnClass}>
                  + Registrar medida
                </button>
              )}
            </div>
            {!permissions.canViewDisciplinary ? (
              <p className="text-xs text-[#5E5851]">
                Sección restringida a Recursos Humanos y Dirección.
              </p>
            ) : related.disciplinary.length === 0 ? (
              <p className="text-xs text-[#5E5851]">Sin antecedentes disciplinarios registrados.</p>
            ) : (
              <div className="divide-y divide-[#F2EFE9]">
                {related.disciplinary.map((d) => (
                  <div key={d.id} className="py-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <StatusText label={d.type.replace(/_/g, ' ')} tone="danger" />
                      <span className="font-mono text-[#5E5851]">{formatDateAR(d.operationalDate)}</span>
                    </div>
                    <p className="text-[#1C1917]">{d.reason}</p>
                    <div className="text-[11px] text-[#5E5851]">Autorizó: {d.authorizedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: CAPACITACIONES */}
      {activeTab === 'capacitaciones' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
            Capacitaciones y reuniones ({related.trainings.length})
          </h3>
          {related.trainings.length === 0 ? (
            <p className="text-xs text-[#5E5851]">Sin capacitaciones asignadas todavía.</p>
          ) : (
            <div className="divide-y divide-[#F2EFE9]">
              {related.trainings.map(({ attendance, session }) => (
                <div key={attendance.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#1C1917]">{session?.title}</div>
                    <div className="text-[#5E5851]">
                      Instructor: {session?.instructor} · Fecha: {formatDateAR(session?.scheduledDate)}
                    </div>
                  </div>
                  <StatusText
                    label={attendance.status}
                    tone={attendance.status === 'asistio' ? 'positive' : 'neutral'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: PRÉSTAMOS Y ADELANTOS */}
      {activeTab === 'prestamos' && permissions.canViewSalaryAndPayroll && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Préstamos y adelantos ({related.loans.length})
            </h3>
            {permissions.canAuthorizeLoans && (
              <button type="button" onClick={() => setLoanOpen(true)} className={primaryBtnClass}>
                <Plus className="w-4 h-4" />
                Registrar adelanto / préstamo
              </button>
            )}
          </div>
          {related.loans.length === 0 ? (
            <p className="text-xs text-[#5E5851]">Sin adelantos ni préstamos activos.</p>
          ) : (
            <div className="divide-y divide-[#F2EFE9]">
              {related.loans.map((l) => {
                const pendingAmount = l.installments
                  .filter((i) => i.status !== 'pagada')
                  .reduce((acc, i) => acc + i.amountArs, 0);
                return (
                  <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1C1917] capitalize">
                          {l.type} · {formatARS(l.amountArs)}
                        </span>
                        <StatusText
                          label={l.status}
                          tone={l.status === 'aprobado' || l.status === 'en_curso' ? 'positive' : 'warning'}
                        />
                      </div>
                      <div className="text-[#5E5851] mt-0.5">
                        Fecha {formatDateAR(l.grantDate)} · Autorizó: {l.authorizedBy} · {l.installmentsCount} cuota(s)
                      </div>
                      <p className="text-[#5E5851]">{l.notes}</p>
                    </div>
                    <div className="sm:text-right font-mono">
                      <div className="text-[#5E5851]">Saldo pendiente</div>
                      <div className="text-sm font-semibold text-[#7C2D36]">{formatARS(pendingAmount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: PROPINAS Y LIQUIDACIONES */}
      {activeTab === 'propinas' && permissions.canViewSalaryAndPayroll && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
            Pre-liquidación semanal y propinas asignadas
          </h3>
          {related.payrollLines.map((line) => (
            <div key={line.id} className="p-4 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[#5E5851]">Base semanal</span>
                <div className="font-mono font-semibold text-sm">{formatARS(line.baseWeeklyArs)}</div>
              </div>
              <div>
                <span className="text-[#5E5851]">Hs extra + Propinas</span>
                <div className="font-mono font-semibold text-sm text-[#15803D]">
                  +{formatARS(line.extraHoursAmountArs + line.tipsAmountArs)}
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Adelantos / Cuotas</span>
                <div className="font-mono font-semibold text-sm text-[#B91C1C]">
                  -{formatARS(line.advancesDeductionArs + line.loanInstallmentArs)}
                </div>
              </div>
              <div>
                <span className="text-[#5E5851]">Neto estimado ({line.paymentStatus})</span>
                <div className="font-mono font-semibold text-base text-[#7C2D36]">
                  {formatARS(line.netEstimatedArs)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 10: DOCUMENTACIÓN */}
      {activeTab === 'documentacion' && (
        <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
            Manuales del sector y documentación asociada ({related.docs.length})
          </h3>
          <div className="divide-y divide-[#F2EFE9]">
            {related.docs.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#1C1917]">{doc.title}</div>
                  <div className="text-[#5E5851]">
                    {doc.fileName} · Versión {doc.version}
                  </div>
                </div>
                {doc.dataUrl && (
                  <a
                    href={doc.dataUrl}
                    download={doc.fileName}
                    className="text-[#7C2D36] font-medium hover:underline"
                  >
                    Descargar
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Position Modal (Scenario 7) */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title={`Traslado / cambio de puesto — ${employee.firstName} ${employee.lastName}`}
        subtitle="La asignación actual se cierra con fecha fin y queda preservada en Trayectoria Laboral."
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nuevo sector *</label>
              <select
                value={newSectorId}
                onChange={(e) => {
                  const sid = e.target.value;
                  setNewSectorId(sid);
                  const fp = data.positions.find((p) => p.sectorId === sid);
                  if (fp) setNewPositionId(fp.id);
                }}
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
              <label className={labelClass}>Nuevo puesto *</label>
              <select
                value={newPositionId}
                onChange={(e) => setNewPositionId(e.target.value)}
                className={inputClass}
              >
                {transferSectorPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha de vigencia *</label>
              <input
                type="date"
                required
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipo de asignación</label>
              <select
                value={transferType}
                onChange={(e) => setTransferType(e.target.value as 'titular' | 'temporal' | 'reemplazo')}
                className={inputClass}
              >
                <option value="titular">Titular</option>
                <option value="temporal">Temporal</option>
                <option value="reemplazo">Reemplazo</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Motivo del traslado / promoción *</label>
            <textarea
              rows={2}
              required
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Ej. Promoción por desempeño sobresaliente / reorganización de temporada."
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setTransferOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Confirmar traslado
            </button>
          </div>
        </form>
      </Modal>

      {/* Attendance Event Modal */}
      <Modal open={attOpen} onClose={() => setAttOpen(false)} title="Registrar novedad de asistencia">
        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha operativa *</label>
              <input type="date" required value={attDate} onChange={(e) => setAttDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tipo de novedad *</label>
              <select value={attType} onChange={(e) => setAttType(e.target.value as AttendanceEventType)} className={inputClass}>
                <option value="ausencia_injustificada">Ausencia injustificada</option>
                <option value="ausencia_justificada">Ausencia justificada</option>
                <option value="tardanza">Llegada tarde</option>
                <option value="horas_extra">Horas extra</option>
                <option value="franco_trabajado">Franco trabajado</option>
                <option value="franco_compensatorio">Franco compensatorio</option>
              </select>
            </div>
          </div>
          {(attType === 'horas_extra' || attType === 'franco_trabajado') && (
            <div>
              <label className={labelClass}>Cantidad de horas</label>
              <input type="number" step="0.5" min={0.5} value={attHours} onChange={(e) => setAttHours(Number(e.target.value))} className={inputClass} />
            </div>
          )}
          {attType === 'tardanza' && (
            <div>
              <label className={labelClass}>Minutos de tardanza</label>
              <input type="number" min={1} value={attMinutes} onChange={(e) => setAttMinutes(Number(e.target.value))} className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea rows={2} value={attNotes} onChange={(e) => setAttNotes(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAttOpen(false)} className={secondaryBtnClass}>Cancelar</button>
            <button type="submit" className={primaryBtnClass}>Guardar novedad</button>
          </div>
        </form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Solicitar vacaciones o licencia">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className={inputClass}>
                <option value="vacaciones">Vacaciones</option>
                <option value="enfermedad">Licencia médica</option>
                <option value="franco_compensatorio">Franco compensatorio</option>
                <option value="estudio">Estudio</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Días solicitados *</label>
              <input type="number" min={1} required value={leaveDays} onChange={(e) => setLeaveDays(Number(e.target.value))} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Desde *</label>
              <input type="date" required value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hasta *</label>
              <input type="date" required value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Motivo</label>
            <textarea rows={2} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setLeaveOpen(false)} className={secondaryBtnClass}>Cancelar</button>
            <button type="submit" className={primaryBtnClass}>Enviar solicitud</button>
          </div>
        </form>
      </Modal>

      {/* Evaluation Modal */}
      <Modal open={evalOpen} onClose={() => setEvalOpen(false)} title="Nuevo registro de desempeño">
        <form onSubmit={handleEvalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Categoría</label>
              <select value={evalCategory} onChange={(e) => setEvalCategory(e.target.value as typeof evalCategory)} className={inputClass}>
                <option value="reconocimiento">Reconocimiento positivo</option>
                <option value="evaluacion_periodica">Evaluación periódica</option>
                <option value="observacion_operativa">Observación operativa</option>
              </select>
            </div>
            {evalCategory === 'evaluacion_periodica' && (
              <div>
                <label className={labelClass}>Puntaje (1 a 5)</label>
                <input type="number" min={1} max={5} step="0.5" value={evalScore} onChange={(e) => setEvalScore(Number(e.target.value))} className={inputClass} />
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Detalle *</label>
            <textarea rows={3} required value={evalSummary} onChange={(e) => setEvalSummary(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEvalOpen(false)} className={secondaryBtnClass}>Cancelar</button>
            <button type="submit" className={primaryBtnClass}>Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Disciplinary Action Modal */}
      <Modal open={discOpen} onClose={() => setDiscOpen(false)} title="Registrar medida disciplinaria autorizada">
        <form onSubmit={handleDiscSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Tipo de medida</label>
            <select value={discType} onChange={(e) => setDiscType(e.target.value as typeof discType)} className={inputClass}>
              <option value="llamado_atencion">Llamado de atención</option>
              <option value="apercibimiento">Apercibimiento formal</option>
              <option value="suspension">Suspensión</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Fundamento y documentación de respaldo *</label>
            <textarea rows={3} required value={discReason} onChange={(e) => setDiscReason(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDiscOpen(false)} className={secondaryBtnClass}>Cancelar</button>
            <button type="submit" className={primaryBtnClass}>Asentar registro</button>
          </div>
        </form>
      </Modal>

      {/* Loan / Advance Modal (Scenario 9) */}
      <Modal open={loanOpen} onClose={() => setLoanOpen(false)} title="Registrar adelanto o préstamo">
        <form onSubmit={handleLoanSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={loanType} onChange={(e) => setLoanType(e.target.value as LoanType)} className={inputClass}>
                <option value="adelanto">Adelanto semanal</option>
                <option value="prestamo">Préstamo en cuotas</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Importe (ARS) *</label>
              <input type="number" min={1000} step={1000} required value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cuotas</label>
              <input type="number" min={1} max={12} disabled={loanType === 'adelanto'} value={loanType === 'adelanto' ? 1 : loanInstallments} onChange={(e) => setLoanInstallments(Number(e.target.value))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea rows={2} value={loanNotes} onChange={(e) => setLoanNotes(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setLoanOpen(false)} className={secondaryBtnClass}>Cancelar</button>
            <button type="submit" className={primaryBtnClass}>Registrar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
