import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Pencil, Plus, X } from 'lucide-react';
import {
  cardTitleClass,
  ConfirmDialog,
  inputClass,
  labelClass,
  Modal,
  operationalSecondaryBtnClass,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { AttendanceEventType, ContractType, Employee, LeaveType, LoanType } from '../../domain/types';
import { useAppStore } from '../../services/store';
import {
  addDaysISO,
  calculateTenureLabel,
  formatARS,
  formatDateAR,
  formatDateTimeAR,
  todayISO
} from '../../utils/formatters';

interface EmployeeProfileViewProps {
  employeeId: string;
  initialTab?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employeeId,
  initialTab,
  isModal = false,
  onClose
}) => {
  const {
    data,
    permissions,
    nav,
    navigate,
    updateEmployee,
    transferEmployeePosition,
    recordAttendanceEvent,
    createLeaveRequest,
    reviewLeaveRequest,
    addPerformanceEvaluation,
    addDisciplinaryAction,
    createLoanOrAdvance
  } = useAppStore();

  const employee = data.employees.find((e) => e.id === employeeId);
  const [activeTab, setActiveTab] = useState(initialTab ?? nav.selectedEmployeeTab ?? 'resumen');

  // Sync active tab when switching employees or initialTab changes
  useEffect(() => {
    setActiveTab(initialTab ?? 'resumen');
  }, [employeeId, initialTab]);

  // Edit Employee Modal (header Pencil button)
  const [editOpen, setEditOpen] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [pendingCloseParent, setPendingCloseParent] = useState(false);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDocCode, setEditDocCode] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [editContractType, setEditContractType] = useState<ContractType>('tiempo_indeterminado');
  const [editStatus, setEditStatus] = useState<Employee['status']>('activo');
  const [editWeeklySalary, setEditWeeklySalary] = useState(210000);

  const openEditModal = () => {
    if (!employee) return;
    setEditFirstName(employee.firstName);
    setEditLastName(employee.lastName);
    setEditDocCode(employee.fictionalDocCode);
    setEditEmail(employee.email);
    setEditPhone(employee.phone);
    setEditEmergencyName(employee.emergencyContactName);
    setEditEmergencyPhone(employee.emergencyContactPhone);
    setEditContractType(employee.contractType);
    setEditStatus(employee.status);
    setEditWeeklySalary(employee.weeklyBaseSalaryArs);
    setEditDirty(false);
    setEditOpen(true);
  };

  const requestCloseEdit = (alsoCloseParent = false) => {
    if (editDirty) {
      setPendingCloseParent(alsoCloseParent);
      setDiscardConfirmOpen(true);
    } else {
      setEditOpen(false);
      if (alsoCloseParent && onClose) onClose();
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !editFirstName.trim() || !editLastName.trim()) return;
    updateEmployee(employee.id, {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      fictionalDocCode: editDocCode.trim() || employee.fictionalDocCode,
      email: editEmail.trim() || employee.email,
      phone: editPhone.trim() || employee.phone,
      emergencyContactName: editEmergencyName.trim() || employee.emergencyContactName,
      emergencyContactPhone: editEmergencyPhone.trim() || employee.emergencyContactPhone,
      contractType: editContractType,
      status: editStatus,
      ...(permissions.canViewSalaryAndPayroll
        ? { weeklyBaseSalaryArs: Math.max(0, Number(editWeeklySalary) || employee.weeklyBaseSalaryArs) }
        : {})
    });
    setEditDirty(false);
    setEditOpen(false);
  };

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
  const [evalCategory, setEvalCategory] = useState<
    'evaluacion_periodica' | 'reconocimiento' | 'observacion_operativa'
  >('reconocimiento');
  const [evalScore, setEvalScore] = useState(5);
  const [evalSummary, setEvalSummary] = useState('');

  const [discOpen, setDiscOpen] = useState(false);
  const [discType, setDiscType] = useState<'llamado_atencion' | 'apercibimiento' | 'suspension'>(
    'llamado_atencion'
  );
  const [discReason, setDiscReason] = useState('');

  // Loan / Advance Modal (Scenario 9)
  const [loanOpen, setLoanOpen] = useState(false);
  const [loanType, setLoanType] = useState<LoanType>('adelanto');
  const [loanAmount, setLoanAmount] = useState(40000);
  const [loanInstallments, setLoanInstallments] = useState(1);
  const [loanNotes, setLoanNotes] = useState('');

  const anySubModalOpen =
    editOpen || transferOpen || attOpen || leaveOpen || evalOpen || discOpen || loanOpen || discardConfirmOpen;

  const handleRequestCloseModal = useCallback(() => {
    if (!onClose) return;
    if (editOpen && editDirty) {
      setPendingCloseParent(true);
      setDiscardConfirmOpen(true);
      return;
    }
    onClose();
  }, [onClose, editOpen, editDirty]);

  // Escape key handling for modal wrapper when no nested dialog is open
  useEffect(() => {
    if (!isModal || !onClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !anySubModalOpen) {
        e.stopPropagation();
        handleRequestCloseModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModal, onClose, anySubModalOpen, handleRequestCloseModal]);

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
          onClick={() => (onClose ? onClose() : navigate({ module: 'personal', section: 'directorio' }))}
          className={`${secondaryBtnClass} mt-4`}
        >
          Cerrar
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

  // Exact 10 concise single-word labels
  const tabs: Array<{ id: string; label: string; count?: number }> = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'datos', label: 'Contrato' },
    { id: 'trayectoria', label: 'Trayectoria', count: related.assignments.length },
    { id: 'asistencia', label: 'Asistencia', count: related.attendance.length },
    { id: 'vacaciones', label: 'Vacaciones', count: related.leaves.length },
    { id: 'desempeno', label: 'Desempeño' },
    { id: 'capacitaciones', label: 'Capacitaciones', count: related.trainings.length },
    ...(permissions.canViewSalaryAndPayroll
      ? [
          { id: 'prestamos', label: 'Préstamos', count: related.loans.length },
          { id: 'propinas', label: 'Liquidaciones' }
        ]
      : []),
    { id: 'documentacion', label: 'Documentación', count: related.docs.length }
  ];

  const resolvedActiveTab = tabs.some((t) => t.id === activeTab) ? activeTab : 'resumen';

  const statusTone =
    employee.status === 'activo'
      ? 'positive'
      : employee.status === 'licencia'
        ? 'warning'
        : 'danger';

  return (
    <div className={isModal ? 'flex flex-col h-full min-h-0' : 'space-y-5'}>
      {/* Sticky Profile Header */}
      <div
        className={
          isModal
            ? 'px-5 sm:px-6 pt-5 pb-4 border-b border-[#E6E2D8] bg-white shrink-0'
            : 'bg-white border border-[#E6E2D8] rounded-lg p-6'
        }
      >
        {!isModal && (
          <button
            type="button"
            onClick={() => navigate({ module: 'personal', section: 'directorio' })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E5851] hover:text-[#168B68] mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al directorio de personal
          </button>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5E5851]">
              <span className="font-mono font-semibold text-[#141210]">{employee.legajo}</span>
              <span aria-hidden="true">·</span>
              <span>ID Demo: {employee.fictionalDocCode}</span>
              <span aria-hidden="true">·</span>
              <StatusText
                label={employee.status === 'activo' ? 'Activo' : employee.status}
                tone={statusTone}
              />
            </div>

            <h2 className="mt-1 text-2xl sm:text-3xl font-editorial font-bold text-[#141210] tracking-tight leading-tight">
              {employee.firstName} {employee.lastName}
            </h2>

            <p className="mt-1 text-sm text-[#5E5851]">
              <strong className="text-[#141210] font-semibold">{related.position?.name}</strong> en{' '}
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  navigate({
                    module: 'organizacion',
                    section: 'organigrama',
                    selectedSectorId: employee.currentSectorId
                  });
                }}
                className="font-semibold text-[#1769C2] hover:underline cursor-pointer"
              >
                {related.sector?.name}
              </button>{' '}
              · Ingreso {formatDateAR(employee.hireDate)} ({calculateTenureLabel(employee.hireDate)})
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {permissions.canCreateOrTransferEmployee && (
              <button
                type="button"
                onClick={openEditModal}
                aria-label="Editar datos del colaborador"
                title="Editar legajo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#117053] bg-[#168B68]/[0.08] border border-[#168B68]/35 hover:bg-[#168B68]/[0.16] rounded-md transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}
            {isModal && onClose && (
              <button
                type="button"
                onClick={handleRequestCloseModal}
                aria-label="Cerrar legajo"
                className="p-2 text-[#5E5851] hover:text-[#141210] hover:bg-[#F2EFE9] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Operational Actions Row */}
        {(permissions.canCreateOrTransferEmployee || permissions.canManageStaffing) && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {permissions.canCreateOrTransferEmployee && (
              <button
                type="button"
                onClick={() => {
                  setNewSectorId(employee.currentSectorId);
                  setNewPositionId(employee.currentPositionId);
                  setTransferOpen(true);
                }}
                className={operationalSecondaryBtnClass}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
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
        )}

        {/* Adaptive Wrapping 10-Tab Bar (Zero Horizontal Scroll Cramping) */}
        <div
          role="tablist"
          aria-label="Secciones del legajo digital"
          className="mt-4 pt-3 border-t border-[#EFECE5] flex flex-wrap items-center gap-1.5"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === resolvedActiveTab;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#7C2D36] text-white'
                    : 'bg-[#F8F7F4] text-[#44403C] border border-[#E6E2D8] hover:bg-[#F2EFE9] hover:text-[#141210]'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1 font-mono text-[11px] tabular-nums ${isActive ? 'opacity-90' : 'text-[#6B635B]'}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Single-Column Vertical Body */}
      <div className={isModal ? 'flex-1 overflow-y-auto px-5 sm:px-6 py-5 bg-[#FAF9F6] space-y-5' : 'space-y-5'}>
        {/* TAB 1: RESUMEN (Strict Single-Column Vertical Flow: 1. Resumen del legajo digital → 2. Línea de tiempo laboral reciente) */}
        {resolvedActiveTab === 'resumen' && (
          <div className="space-y-5">
            <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-5">
              <h3 className={cardTitleClass}>Resumen del legajo digital</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#6B635B]">Sector actual</span>
                  <div className="mt-0.5 font-semibold text-[#141210]">{related.sector?.name}</div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Puesto titular</span>
                  <div className="mt-0.5 font-semibold text-[#141210]">{related.position?.name}</div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Supervisor directo</span>
                  <div className="mt-0.5 font-semibold text-[#141210]">
                    {related.supervisor
                      ? `${related.supervisor.firstName} ${related.supervisor.lastName}`
                      : 'Dirección'}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Vacaciones disponibles</span>
                  <div className="mt-0.5 font-mono font-bold text-base text-[#168B68]">
                    {availableVacationDays} días
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Checklists vinculados</span>
                  <div className="mt-0.5 font-mono font-bold text-base text-[#141210]">
                    {related.checklists.length}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Asignaciones históricas</span>
                  <div className="mt-0.5 font-mono font-bold text-base text-[#141210]">
                    {related.assignments.length}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFECE5]">
                <h4 className="text-xs font-semibold text-[#44403C] mb-2">Próximos turnos y recientes</h4>
                {related.shifts.length === 0 ? (
                  <p className="text-xs text-[#6B635B]">Sin turnos cargados recientemente.</p>
                ) : (
                  <div className="divide-y divide-[#F2EFE9]">
                    {related.shifts.slice(0, 4).map((sh) => (
                      <div key={sh.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-mono font-medium text-[#141210]">
                          {formatDateAR(sh.operationalDate)}
                        </span>
                        <span className="font-mono text-[#5E5851]">
                          {sh.startTime} – {sh.endTime}
                        </span>
                        <StatusText
                          label={sh.status.replace('_', ' ')}
                          tone={
                            sh.status === 'presente'
                              ? 'positive'
                              : sh.status.includes('ausente')
                                ? 'danger'
                                : 'neutral'
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6">
              <h3 className={`${cardTitleClass} pb-3 border-b border-[#EFECE5]`}>
                Línea de tiempo laboral reciente
              </h3>
              <div className="mt-4 space-y-3.5 border-l-2 border-[#E6E2D8] pl-4 text-xs">
                {related.assignments.map((asg) => {
                  const s = data.sectors.find((x) => x.id === asg.sectorId);
                  const p = data.positions.find((x) => x.id === asg.positionId);
                  return (
                    <div key={asg.id}>
                      <div className="font-mono text-[#6B635B]">
                        {formatDateAR(asg.startDate)}{' '}
                        {asg.endDate ? `→ ${formatDateAR(asg.endDate)}` : '→ Vigente'}
                      </div>
                      <div className="font-semibold text-[#141210] mt-0.5">
                        {p?.name} ({s?.name})
                      </div>
                      <div className="text-[#5E5851] mt-0.5">{asg.reason}</div>
                    </div>
                  );
                })}
                {related.attendance.slice(0, 4).map((att) => (
                  <div key={att.id}>
                    <div className="font-mono text-[#6B635B]">{formatDateAR(att.operationalDate)}</div>
                    <div className="font-semibold text-[#C83E43] mt-0.5">
                      Novedad: {att.eventType.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[#5E5851] mt-0.5">{att.notes}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: CONTRATO (Vertical single-column blocks) */}
        {resolvedActiveTab === 'datos' && (
          <div className="space-y-5">
            <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className={cardTitleClass}>Identidad y contacto</h3>
                {permissions.canCreateOrTransferEmployee && (
                  <button type="button" onClick={openEditModal} className={secondaryBtnClass}>
                    <Pencil className="w-3.5 h-3.5" />
                    Editar datos
                  </button>
                )}
              </div>
              <dl className="divide-y divide-[#F2EFE9] text-xs">
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Legajo único</dt>
                  <dd className="font-mono font-semibold text-[#141210]">{employee.legajo}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Identificador demo</dt>
                  <dd className="font-mono text-[#141210]">{employee.fictionalDocCode}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Correo electrónico</dt>
                  <dd className="text-[#141210]">{employee.email}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Teléfono</dt>
                  <dd className="font-mono text-[#141210]">{employee.phone}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Contacto de emergencia</dt>
                  <dd className="text-[#141210]">
                    {employee.emergencyContactName} ({employee.emergencyContactPhone})
                  </dd>
                </div>
              </dl>
            </section>

            <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-3">
              <h3 className={cardTitleClass}>Condiciones contractuales</h3>
              <dl className="divide-y divide-[#F2EFE9] text-xs">
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Fecha de ingreso</dt>
                  <dd className="font-mono text-[#141210]">{formatDateAR(employee.hireDate)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Tipo de contrato</dt>
                  <dd className="capitalize text-[#141210]">{employee.contractType.replace(/_/g, ' ')}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#6B635B]">Estado laboral</dt>
                  <dd className="capitalize font-semibold text-[#141210]">{employee.status}</dd>
                </div>
                {permissions.canViewSalaryAndPayroll ? (
                  <>
                    <div className="flex justify-between py-2">
                      <dt className="text-[#6B635B]">Referencia base semanal</dt>
                      <dd className="font-mono font-bold text-[#141210]">
                        {formatARS(employee.weeklyBaseSalaryArs)}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-[#6B635B]">Valor hora extra ref.</dt>
                      <dd className="font-mono text-[#141210]">{formatARS(employee.hourlyExtraRateArs)}</dd>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-xs text-[#6B635B] italic">
                    Información salarial restringida para el rol actual.
                  </div>
                )}
              </dl>
            </section>
          </div>
        )}

        {/* TAB 3: TRAYECTORIA */}
        {resolvedActiveTab === 'trayectoria' && (
          <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className={cardTitleClass}>Historial completo de asignaciones y traslados</h3>
                <p className="text-xs text-[#6B635B] mt-0.5">
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
                  <div
                    key={asg.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <StatusText
                          label={asg.active ? 'Asignación vigente' : 'Histórica'}
                          tone={asg.active ? 'positive' : 'neutral'}
                        />
                        <span className="text-[#6B635B]">· Tipo: {asg.assignmentType}</span>
                      </div>
                      <div className="mt-1 text-sm font-bold text-[#141210]">
                        {pos?.name} — {sec?.name}
                      </div>
                      <p className="text-xs text-[#5E5851] mt-0.5">{asg.reason}</p>
                    </div>
                    <div className="text-xs font-mono text-[#6B635B] sm:text-right shrink-0">
                      <div>
                        Desde: <strong className="text-[#141210]">{formatDateAR(asg.startDate)}</strong>
                      </div>
                      <div>
                        Hasta:{' '}
                        <strong className="text-[#141210]">
                          {asg.endDate ? formatDateAR(asg.endDate) : 'Actualidad'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 4: ASISTENCIA */}
        {resolvedActiveTab === 'asistencia' && (
          <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className={cardTitleClass}>
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
              <p className="text-xs text-[#6B635B]">No hay novedades registradas para este colaborador.</p>
            ) : (
              <div className="divide-y divide-[#F2EFE9]">
                {related.attendance.map((att) => (
                  <div
                    key={att.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-[#141210]">
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
                    <div className="text-[11px] text-[#6B635B] sm:text-right">
                      Registró: {att.registeredBy} · {formatDateTimeAR(att.registeredAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 5: VACACIONES */}
        {resolvedActiveTab === 'vacaciones' && (
          <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <span className="text-[#6B635B]">Corresponden</span>
                  <div className="font-mono text-lg font-bold text-[#141210]">
                    {related.vacBalance?.entitledDays ?? 14} d.
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Tomados</span>
                  <div className="font-mono text-lg font-bold text-[#141210]">
                    {related.vacBalance?.takenDays ?? 0} d.
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Aprobados pendientes</span>
                  <div className="font-mono text-lg font-bold text-[#D97706]">
                    {related.vacBalance?.approvedPendingDays ?? 0} d.
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Saldo disponible</span>
                  <div className="font-mono text-lg font-bold text-[#168B68]">
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
              {related.leaves.length === 0 ? (
                <p className="pt-4 text-xs text-[#6B635B]">Sin solicitudes de vacaciones o licencias.</p>
              ) : (
                related.leaves.map((lv) => (
                  <div
                    key={lv.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#141210] capitalize">
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
                          onClick={() =>
                            reviewLeaveRequest(lv.id, 'rechazada', 'No autorizada por cobertura.')
                          }
                          className={secondaryBtnClass}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* TAB 6: DESEMPEÑO (Vertical single-column blocks) */}
        {resolvedActiveTab === 'desempeno' && (
          <div className="space-y-5">
            <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className={cardTitleClass}>
                  Evaluaciones y reconocimientos ({related.evaluations.length})
                </h3>
                {permissions.canManageStaffing && (
                  <button
                    type="button"
                    onClick={() => setEvalOpen(true)}
                    className={operationalSecondaryBtnClass}
                  >
                    + Agregar
                  </button>
                )}
              </div>
              <div className="divide-y divide-[#F2EFE9]">
                {related.evaluations.length === 0 ? (
                  <p className="text-xs text-[#6B635B]">Sin evaluaciones registradas.</p>
                ) : (
                  related.evaluations.map((ev) => (
                    <div key={ev.id} className="py-3 text-xs space-y-1">
                      <div className="flex justify-between text-[#5E5851]">
                        <span className="font-semibold text-[#168B68] capitalize">
                          {ev.category.replace(/_/g, ' ')} {ev.score ? `· ${ev.score}/5` : ''}
                        </span>
                        <span className="font-mono">{formatDateAR(ev.operationalDate)}</span>
                      </div>
                      <p className="text-[#141210]">{ev.summary}</p>
                      <div className="text-[11px] text-[#6B635B]">Evaluó: {ev.evaluatorName}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className={cardTitleClass}>Medidas disciplinarias autorizadas</h3>
                {permissions.canViewDisciplinary && (
                  <button
                    type="button"
                    onClick={() => setDiscOpen(true)}
                    className={secondaryBtnClass}
                  >
                    + Registrar medida
                  </button>
                )}
              </div>
              {!permissions.canViewDisciplinary ? (
                <p className="text-xs text-[#6B635B]">
                  Sección restringida a Recursos Humanos y Dirección.
                </p>
              ) : related.disciplinary.length === 0 ? (
                <p className="text-xs text-[#6B635B]">Sin antecedentes disciplinarios registrados.</p>
              ) : (
                <div className="divide-y divide-[#F2EFE9]">
                  {related.disciplinary.map((d) => (
                    <div key={d.id} className="py-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <StatusText label={d.type.replace(/_/g, ' ')} tone="danger" />
                        <span className="font-mono text-[#6B635B]">{formatDateAR(d.operationalDate)}</span>
                      </div>
                      <p className="text-[#141210]">{d.reason}</p>
                      <div className="text-[11px] text-[#6B635B]">Autorizó: {d.authorizedBy}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 7: CAPACITACIONES */}
        {resolvedActiveTab === 'capacitaciones' && (
          <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-3">
            <h3 className={cardTitleClass}>
              Capacitaciones y reuniones ({related.trainings.length})
            </h3>
            {related.trainings.length === 0 ? (
              <p className="text-xs text-[#6B635B]">Sin capacitaciones asignadas todavía.</p>
            ) : (
              <div className="divide-y divide-[#F2EFE9]">
                {related.trainings.map(({ attendance, session }) => (
                  <div key={attendance.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#141210]">{session?.title}</div>
                      <div className="text-[#6B635B]">
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
          </section>
        )}

        {/* TAB 8: PRÉSTAMOS */}
        {resolvedActiveTab === 'prestamos' && permissions.canViewSalaryAndPayroll && (
          <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className={cardTitleClass}>Préstamos y adelantos ({related.loans.length})</h3>
              {permissions.canAuthorizeLoans && (
                <button type="button" onClick={() => setLoanOpen(true)} className={primaryBtnClass}>
                  <Plus className="w-4 h-4" />
                  Registrar adelanto / préstamo
                </button>
              )}
            </div>
            {related.loans.length === 0 ? (
              <p className="text-xs text-[#6B635B]">Sin adelantos ni préstamos activos.</p>
            ) : (
              <div className="divide-y divide-[#F2EFE9]">
                {related.loans.map((l) => {
                  const pendingAmount = l.installments
                    .filter((i) => i.status !== 'pagada')
                    .reduce((acc, i) => acc + i.amountArs, 0);
                  return (
                    <div
                      key={l.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#141210] capitalize">
                            {l.type} · {formatARS(l.amountArs)}
                          </span>
                          <StatusText
                            label={l.status}
                            tone={l.status === 'aprobado' || l.status === 'en_curso' ? 'positive' : 'warning'}
                          />
                        </div>
                        <div className="text-[#6B635B] mt-0.5">
                          Fecha {formatDateAR(l.grantDate)} · Autorizó: {l.authorizedBy} · {l.installmentsCount} cuota(s)
                        </div>
                        <p className="text-[#5E5851]">{l.notes}</p>
                      </div>
                      <div className="sm:text-right font-mono">
                        <div className="text-[#6B635B]">Saldo pendiente</div>
                        <div className="text-sm font-bold text-[#C83E43]">{formatARS(pendingAmount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 9: LIQUIDACIONES */}
        {resolvedActiveTab === 'propinas' && permissions.canViewSalaryAndPayroll && (
          <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-4">
            <h3 className={cardTitleClass}>Pre-liquidación semanal y propinas asignadas</h3>
            {related.payrollLines.map((line) => (
              <div
                key={line.id}
                className="p-4 bg-[#FAF9F6] border border-[#E6E2D8] rounded-md grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
              >
                <div>
                  <span className="text-[#6B635B]">Base semanal</span>
                  <div className="font-mono font-bold text-sm text-[#141210]">
                    {formatARS(line.baseWeeklyArs)}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Hs extra + Propinas</span>
                  <div className="font-mono font-bold text-sm text-[#168B68]">
                    +{formatARS(line.extraHoursAmountArs + line.tipsAmountArs)}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Adelantos / Cuotas</span>
                  <div className="font-mono font-bold text-sm text-[#C83E43]">
                    -{formatARS(line.advancesDeductionArs + line.loanInstallmentArs)}
                  </div>
                </div>
                <div>
                  <span className="text-[#6B635B]">Neto estimado ({line.paymentStatus})</span>
                  <div className="font-mono font-bold text-base text-[#1769C2]">
                    {formatARS(line.netEstimatedArs)}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* TAB 10: DOCUMENTACIÓN */}
        {resolvedActiveTab === 'documentacion' && (
          <section className="bg-white border border-[#E6E2D8] rounded-lg p-5 sm:p-6 space-y-3">
            <h3 className={cardTitleClass}>
              Manuales del sector y documentación asociada ({related.docs.length})
            </h3>
            {related.docs.length === 0 ? (
              <p className="text-xs text-[#6B635B]">Sin documentación adjunta en este sector.</p>
            ) : (
              <div className="divide-y divide-[#F2EFE9]">
                {related.docs.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#141210]">{doc.title}</div>
                      <div className="text-[#6B635B]">
                        {doc.fileName} · Versión {doc.version}
                      </div>
                    </div>
                    {doc.dataUrl && (
                      <a
                        href={doc.dataUrl}
                        download={doc.fileName}
                        className="text-[#1769C2] font-semibold hover:underline"
                      >
                        Descargar
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Edit Employee Modal (wired to header Pencil button) */}
      <Modal
        open={editOpen}
        onClose={() => requestCloseEdit(false)}
        title={`Editar legajo — ${employee.firstName} ${employee.lastName}`}
        subtitle={`Legajo ${employee.legajo} · Los cambios se guardan en el registro central de Personal.`}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                type="text"
                required
                value={editFirstName}
                onChange={(e) => {
                  setEditFirstName(e.target.value);
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Apellido *</label>
              <input
                type="text"
                required
                value={editLastName}
                onChange={(e) => {
                  setEditLastName(e.target.value);
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Identificador demo</label>
              <input
                type="text"
                value={editDocCode}
                onChange={(e) => {
                  setEditDocCode(e.target.value);
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Modalidad contractual</label>
              <select
                value={editContractType}
                onChange={(e) => {
                  setEditContractType(e.target.value as ContractType);
                  setEditDirty(true);
                }}
                className={inputClass}
              >
                <option value="tiempo_indeterminado">Tiempo indeterminado</option>
                <option value="temporada">Temporada</option>
                <option value="plazo_fijo">Plazo fijo</option>
                <option value="eventual">Eventual</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado laboral</label>
              <select
                value={editStatus}
                onChange={(e) => {
                  setEditStatus(e.target.value as Employee['status']);
                  setEditDirty(true);
                }}
                className={inputClass}
              >
                <option value="activo">Activo</option>
                <option value="licencia">En licencia</option>
                <option value="suspendido">Suspendido</option>
                <option value="egresado">Egresado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Correo electrónico</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => {
                  setEditPhone(e.target.value);
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contacto de emergencia</label>
              <input
                type="text"
                value={editEmergencyName}
                onChange={(e) => {
                  setEditEmergencyName(e.target.value);
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono de emergencia</label>
              <input
                type="text"
                value={editEmergencyPhone}
                onChange={(e) => {
                  setEditEmergencyPhone(e.target.value);
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
          </div>

          {permissions.canViewSalaryAndPayroll && (
            <div>
              <label className={labelClass}>Referencia base semanal (ARS)</label>
              <input
                type="number"
                min={50000}
                step={1000}
                value={editWeeklySalary}
                onChange={(e) => {
                  setEditWeeklySalary(Number(e.target.value));
                  setEditDirty(true);
                }}
                className={inputClass}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button
              type="button"
              onClick={() => requestCloseEdit(false)}
              className={secondaryBtnClass}
            >
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Unsaved Edit Changes Guard */}
      <ConfirmDialog
        open={discardConfirmOpen}
        title="¿Descartar cambios sin guardar?"
        description="Tenés modificaciones pendientes en el formulario de edición del colaborador. Si cerrás ahora, se perderán."
        confirmLabel="Descartar cambios"
        danger
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          setEditDirty(false);
          setEditOpen(false);
          if (pendingCloseParent && onClose) {
            setPendingCloseParent(false);
            onClose();
          }
        }}
        onCancel={() => {
          setDiscardConfirmOpen(false);
          setPendingCloseParent(false);
        }}
      />

      {/* Transfer Position Modal */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title={`Traslado / cambio de puesto — ${employee.firstName} ${employee.lastName}`}
        subtitle="La asignación actual se cierra con fecha fin y queda preservada en Trayectoria."
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
              <input
                type="date"
                required
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipo de novedad *</label>
              <select
                value={attType}
                onChange={(e) => setAttType(e.target.value as AttendanceEventType)}
                className={inputClass}
              >
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
              <input
                type="number"
                step="0.5"
                min={0.5}
                value={attHours}
                onChange={(e) => setAttHours(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          )}
          {attType === 'tardanza' && (
            <div>
              <label className={labelClass}>Minutos de tardanza</label>
              <input
                type="number"
                min={1}
                value={attMinutes}
                onChange={(e) => setAttMinutes(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea
              rows={2}
              value={attNotes}
              onChange={(e) => setAttNotes(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAttOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Guardar novedad
            </button>
          </div>
        </form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Solicitar vacaciones o licencia">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className={inputClass}
              >
                <option value="vacaciones">Vacaciones</option>
                <option value="enfermedad">Licencia médica</option>
                <option value="franco_compensatorio">Franco compensatorio</option>
                <option value="estudio">Estudio</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Días solicitados *</label>
              <input
                type="number"
                min={1}
                required
                value={leaveDays}
                onChange={(e) => setLeaveDays(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Desde *</label>
              <input
                type="date"
                required
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Hasta *</label>
              <input
                type="date"
                required
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Motivo</label>
            <textarea
              rows={2}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setLeaveOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Enviar solicitud
            </button>
          </div>
        </form>
      </Modal>

      {/* Evaluation Modal */}
      <Modal open={evalOpen} onClose={() => setEvalOpen(false)} title="Nuevo registro de desempeño">
        <form onSubmit={handleEvalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                value={evalCategory}
                onChange={(e) => setEvalCategory(e.target.value as typeof evalCategory)}
                className={inputClass}
              >
                <option value="reconocimiento">Reconocimiento positivo</option>
                <option value="evaluacion_periodica">Evaluación periódica</option>
                <option value="observacion_operativa">Observación operativa</option>
              </select>
            </div>
            {evalCategory === 'evaluacion_periodica' && (
              <div>
                <label className={labelClass}>Puntaje (1 a 5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  step="0.5"
                  value={evalScore}
                  onChange={(e) => setEvalScore(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Detalle *</label>
            <textarea
              rows={3}
              required
              value={evalSummary}
              onChange={(e) => setEvalSummary(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEvalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Disciplinary Action Modal */}
      <Modal open={discOpen} onClose={() => setDiscOpen(false)} title="Registrar medida disciplinaria autorizada">
        <form onSubmit={handleDiscSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Tipo de medida</label>
            <select
              value={discType}
              onChange={(e) => setDiscType(e.target.value as typeof discType)}
              className={inputClass}
            >
              <option value="llamado_atencion">Llamado de atención</option>
              <option value="apercibimiento">Apercibimiento formal</option>
              <option value="suspension">Suspensión</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Fundamento y documentación de respaldo *</label>
            <textarea
              rows={3}
              required
              value={discReason}
              onChange={(e) => setDiscReason(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDiscOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Asentar registro
            </button>
          </div>
        </form>
      </Modal>

      {/* Loan / Advance Modal */}
      <Modal open={loanOpen} onClose={() => setLoanOpen(false)} title="Registrar adelanto o préstamo">
        <form onSubmit={handleLoanSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as LoanType)}
                className={inputClass}
              >
                <option value="adelanto">Adelanto semanal</option>
                <option value="prestamo">Préstamo en cuotas</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Importe (ARS) *</label>
              <input
                type="number"
                min={1000}
                step={1000}
                required
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cuotas</label>
              <input
                type="number"
                min={1}
                max={12}
                disabled={loanType === 'adelanto'}
                value={loanType === 'adelanto' ? 1 : loanInstallments}
                onChange={(e) => setLoanInstallments(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea
              rows={2}
              value={loanNotes}
              onChange={(e) => setLoanNotes(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setLoanOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ==========================================
// RESPONSIVE EMPLOYEE PROFILE MODAL WRAPPER
// Centered large modal on desktop, full-screen sheet on mobile
// ==========================================
export const EmployeeProfileModal: React.FC<{
  employeeId: string;
  initialTab?: string;
  onClose: () => void;
}> = ({ employeeId, initialTab, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch sm:items-center justify-center bg-black/50 sm:p-4 lg:p-6 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Legajo digital del colaborador"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl bg-white sm:border sm:border-[#E6E2D8] sm:rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <EmployeeProfileView
          employeeId={employeeId}
          initialTab={initialTab}
          isModal
          onClose={onClose}
        />
      </div>
    </div>
  );
};
