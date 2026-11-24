import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialSeedDataset } from '../data/seedData';
import { DEMO_USERS, getPermissions, RolePermissions } from '../domain/permissions';
import {
  AppDataset,
  AppDocument,
  AttendanceEvent,
  AttendanceEventType,
  AuditEvent,
  CanonicalDataset,
  ChecklistAnswer,
  ChecklistExecution,
  ContractType,
  DemandForecast,
  DemoRoleId,
  DemoUserProfile,
  DisciplinaryAction,
  Discrepancy,
  Employee,
  EmployeeAssignment,
  Expense,
  GoodsReceipt,
  ImportBatch,
  ImportMappingProfile,
  ImportSourceProfile,
  InventoryMovement,
  InventoryMovementType,
  ISODate,
  LeaveRequest,
  LeaveType,
  Loan,
  LoanType,
  LossEvent,
  LossType,
  PayrollAdjustment,
  PayrollPreparationLine,
  PerformanceEvaluation,
  Position,
  Product,
  PurchaseOrder,
  PurchaseRequest,
  PurchaseRequestLine,
  Sale,
  Sector,
  ShiftAssignment,
  ShiftAssignmentStatus,
  TrainingSession,
  WasteReason
} from '../domain/types';
import { demoRepository } from '../repositories/demoRepository';
import { addDaysISO, createId, todayISO } from '../utils/formatters';

export type AppModule = 'inicio' | 'organizacion' | 'gestion' | 'personal' | 'administracion';

export interface AppNavigationState {
  module: AppModule;
  section: string;
  selectedEmployeeId?: string;
  selectedEmployeeTab?: string;
  selectedSectorId?: string;
  selectedPurchaseRequestId?: string;
  selectedExecutionId?: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppStoreContextValue {
  data: AppDataset;
  isLoading: boolean;
  storageBackendLabel: string;
  activeUser: DemoUserProfile;
  permissions: RolePermissions;
  nav: AppNavigationState;
  toasts: ToastItem[];
  navigate: (next: Partial<AppNavigationState>) => void;
  switchDemoRole: (roleId: DemoRoleId) => void;
  notify: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => Promise<void>;

  // Organization actions
  createSector: (input: { name: string; code: string; description: string; dailyMinHeadcount: number; managerEmployeeId?: string }) => void;
  updateSector: (sectorId: string, patch: Partial<Pick<Sector, 'name' | 'description' | 'dailyMinHeadcount' | 'managerEmployeeId'>>) => void;
  createPosition: (input: { sectorId: string; name: string; level: Position['level']; targetHeadcount: number; description: string }) => void;
  assignShift: (input: {
    employeeId: string;
    sectorId: string;
    positionId: string;
    temporaryPositionId?: string;
    shiftId: string;
    operationalDate: ISODate;
    startTime: string;
    endTime: string;
    status: ShiftAssignmentStatus;
    notes?: string;
  }) => void;
  saveChecklistExecution: (input: {
    executionId?: string;
    procedureId: string;
    shiftId: string;
    operationalDate: ISODate;
    assignedEmployeeId: string;
    performedByEmployeeId: string;
    answers: ChecklistAnswer[];
    observations?: string;
    submit: boolean;
  }) => string;
  verifyChecklistExecution: (executionId: string, note?: string) => void;
  disputeChecklistExecution: (input: {
    executionId: string;
    fieldId?: string;
    disputedTaskLabel: string;
    observation: string;
    evidenceNote?: string;
  }) => void;
  resolveDiscrepancy: (discrepancyId: string, resolution: string) => void;
  uploadDocument: (doc: Omit<AppDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;

  // Management actions
  createPurchaseRequest: (input: {
    sectorId: string;
    neededByDate: ISODate;
    priority: PurchaseRequest['priority'];
    observations?: string;
    submitNow: boolean;
    lines: Array<{ productId: string; requestedQty: number; notes?: string }>;
  }) => string;
  verifyPurchaseRequest: (
    requestId: string,
    verifiedLines: Array<{
      lineId: string;
      physicalVerifiedStock: number;
      verifiedQty: number;
      justification?: string;
    }>,
    sendToApproval: boolean,
    notes?: string
  ) => void;
  decidePurchaseRequest: (
    requestId: string,
    decision: 'aprobado' | 'rechazado',
    approvedLines: Array<{ lineId: string; approvedQty: number }>,
    notes?: string
  ) => void;
  generatePurchaseOrdersFromRequest: (requestId: string, deliveryInfo?: string) => PurchaseOrder[];
  receiveGoodsForOrder: (input: {
    orderId: string;
    receivedLines: Array<{ productId: string; receivedQty: number }>;
    discrepancyNotes?: string;
  }) => void;
  registerInventoryMovement: (input: {
    productId: string;
    type: InventoryMovementType;
    quantityDelta: number;
    locationId: string;
    destinationLocationId?: string;
    sectorId?: string;
    operationalDate: ISODate;
    notes: string;
  }) => void;
  registerLossEvent: (input: {
    productId: string;
    type: LossType;
    grossInputQty?: number;
    usableOutputQty?: number;
    lossQty?: number;
    reason: WasteReason;
    sectorId: string;
    operationalDate: ISODate;
    reportedByEmployeeId?: string;
    linkToInventory: boolean;
    notes?: string;
    evidenceNote?: string;
  }) => LossEvent;
  upsertDemandForecast: (input: Omit<DemandForecast, 'id' | 'updatedBy' | 'updatedAt'>) => void;
  commitDataImport: (input: {
    sourceProfile: ImportSourceProfile;
    dataset: CanonicalDataset;
    fileName: string;
    fileFingerprint: string;
    totalRows: number;
    newSales?: Sale[];
    newExpenses?: Expense[];
    newProducts?: Product[];
    skippedDuplicateRows: number;
    errorRows: number;
    warnings: string[];
    saveMapping?: { name: string; columnMap: Record<string, string> };
  }) => ImportBatch;

  // Personnel actions
  createEmployee: (input: {
    firstName: string;
    lastName: string;
    fictionalDocCode: string;
    email: string;
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    hireDate: ISODate;
    sectorId: string;
    positionId: string;
    supervisorEmployeeId?: string;
    contractType: ContractType;
    weeklyBaseSalaryArs: number;
  }) => Employee;
  transferEmployeePosition: (input: {
    employeeId: string;
    newSectorId: string;
    newPositionId: string;
    newSupervisorEmployeeId?: string;
    effectiveDate: ISODate;
    assignmentType: EmployeeAssignment['assignmentType'];
    reason: string;
  }) => void;
  recordAttendanceEvent: (input: {
    employeeId: string;
    sectorId: string;
    operationalDate: ISODate;
    eventType: AttendanceEventType;
    minutesLate?: number;
    extraHours?: number;
    justified?: boolean;
    notes: string;
  }) => void;
  createLeaveRequest: (input: {
    employeeId: string;
    type: LeaveType;
    startDate: ISODate;
    endDate: ISODate;
    daysRequested: number;
    reason: string;
  }) => void;
  reviewLeaveRequest: (requestId: string, decision: 'aprobada' | 'rechazada', reviewNotes?: string) => void;
  addPerformanceEvaluation: (input: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'evaluatorName'>) => void;
  addDisciplinaryAction: (input: Omit<DisciplinaryAction, 'id' | 'createdAt' | 'authorizedBy'>) => void;
  createTrainingSession: (input: Omit<TrainingSession, 'id'> & { participantIds: string[] }) => void;
  markTrainingAttendance: (attendanceId: string, status: 'inscripto' | 'asistio' | 'ausente') => void;
  createLoanOrAdvance: (input: {
    employeeId: string;
    type: LoanType;
    amountArs: number;
    installmentsCount: number;
    grantDate: ISODate;
    autoApprove: boolean;
    notes: string;
  }) => void;
  updateLoanStatus: (loanId: string, status: Loan['status']) => void;
  addPayrollAdjustment: (input: {
    payrollPeriodId: string;
    employeeId: string;
    concept: string;
    amountArs: number;
    notes?: string;
  }) => void;
  updatePayrollLineReview: (
    lineId: string,
    patch: Partial<Pick<PayrollPreparationLine, 'reviewStatus' | 'paymentStatus'>>
  ) => void;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

function recalculatePayrollForDataset(ds: AppDataset): PayrollPreparationLine[] {
  const activePeriodId = ds.payrollPeriods[0]?.id ?? 'pay-sem-actual';
  const existingMap = new Map(ds.payrollPreparations.map((p) => [`${p.payrollPeriodId}:${p.employeeId}`, p]));

  return ds.employees.map((emp) => {
    const prev = existingMap.get(`${activePeriodId}:${emp.id}`);
    const extraHours = ds.attendanceEvents
      .filter(
        (a) =>
          a.employeeId === emp.id &&
          (a.eventType === 'horas_extra' || a.eventType === 'franco_trabajado') &&
          a.status !== 'observado'
      )
      .reduce((acc, a) => acc + (a.extraHours ?? 0), 0);
    const extraHoursAmountArs = Math.round(extraHours * emp.hourlyExtraRateArs);
    const absencesCount = ds.attendanceEvents.filter(
      (a) =>
        a.employeeId === emp.id &&
        (a.eventType === 'ausencia_injustificada' || a.eventType === 'ausencia_justificada')
    ).length;
    const tipsAmountArs = ds.tipAllocations
      .filter((t) => t.employeeId === emp.id && t.payrollPeriodId === activePeriodId)
      .reduce((acc, t) => acc + t.amountArs, 0);
    const advancesDeductionArs = ds.loans
      .filter(
        (l) =>
          l.employeeId === emp.id &&
          l.type === 'adelanto' &&
          (l.status === 'aprobado' || l.status === 'en_curso')
      )
      .reduce(
        (acc, l) =>
          acc +
          l.installments
            .filter((i) => i.status === 'incluida_en_preliquidacion')
            .reduce((s, i) => s + i.amountArs, 0),
        0
      );
    const loanInstallmentArs = ds.loans
      .filter(
        (l) =>
          l.employeeId === emp.id &&
          l.type === 'prestamo' &&
          (l.status === 'aprobado' || l.status === 'en_curso')
      )
      .reduce(
        (acc, l) =>
          acc +
          l.installments
            .filter((i) => i.status === 'incluida_en_preliquidacion')
            .reduce((s, i) => s + i.amountArs, 0),
        0
      );
    const otherAdjustmentsArs = ds.payrollAdjustments
      .filter((a) => a.employeeId === emp.id && a.payrollPeriodId === activePeriodId)
      .reduce((acc, a) => acc + a.amountArs, 0);

    const netEstimatedArs =
      emp.weeklyBaseSalaryArs +
      extraHoursAmountArs +
      tipsAmountArs +
      otherAdjustmentsArs -
      advancesDeductionArs -
      loanInstallmentArs;

    return {
      id: prev?.id ?? `prep-${emp.id}`,
      payrollPeriodId: activePeriodId,
      employeeId: emp.id,
      baseWeeklyArs: emp.weeklyBaseSalaryArs,
      scheduledShiftsCount: prev?.scheduledShiftsCount ?? 6,
      absencesCount,
      extraHours,
      extraHoursAmountArs,
      tipsAmountArs,
      advancesDeductionArs,
      loanInstallmentArs,
      otherAdjustmentsArs,
      netEstimatedArs,
      reviewStatus: prev?.reviewStatus ?? 'pendiente',
      paymentStatus: prev?.paymentStatus ?? 'no_ejecutado',
      reviewedBy: prev?.reviewedBy,
      updatedAt: new Date().toISOString()
    };
  });
}

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppDataset>(() => createInitialSeedDataset());
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoleId, setActiveRoleId] = useState<DemoRoleId>(() => {
    try {
      const saved = localStorage.getItem('lr1975_demo_role') as DemoRoleId | null;
      if (saved && DEMO_USERS.some((u) => u.roleId === saved)) return saved;
    } catch {
      // ignore
    }
    return 'admin_vegen';
  });
  const [nav, setNav] = useState<AppNavigationState>({
    module: 'inicio',
    section: 'resumen'
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const activeUser = useMemo(
    () => DEMO_USERS.find((u) => u.roleId === activeRoleId) ?? DEMO_USERS[0],
    [activeRoleId]
  );
  const permissions = useMemo(() => getPermissions(activeRoleId), [activeRoleId]);

  const notify = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = createId('toast');
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load persisted IndexedDB state on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const persisted = await demoRepository.load();
        if (active && persisted && persisted.version === 1 && persisted.employees?.length > 0) {
          setData(persisted);
        } else if (active) {
          const seed = createInitialSeedDataset();
          setData(seed);
          await demoRepository.save(seed);
        }
      } catch {
        // Keep initial seed
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateAndPersist = useCallback(
    (
      updater: (prev: AppDataset) => AppDataset,
      audit?: Omit<AuditEvent, 'id' | 'timestamp' | 'actorId' | 'actorName' | 'actorRole'>
    ) => {
      setData((prev) => {
        let next = updater(prev);
        if (audit) {
          const auditEntry: AuditEvent = {
            id: createId('aud'),
            timestamp: new Date().toISOString(),
            actorId: activeUser.employeeId ?? activeUser.id,
            actorName: activeUser.name,
            actorRole: activeUser.roleId,
            ...audit
          };
          next = {
            ...next,
            auditEvents: [auditEntry, ...next.auditEvents]
          };
        }
        void demoRepository.save(next);
        return next;
      });
    },
    [activeUser]
  );

  const navigate = useCallback((next: Partial<AppNavigationState>) => {
    setNav((prev) => ({ ...prev, ...next }));
  }, []);

  const switchDemoRole = useCallback(
    (roleId: DemoRoleId) => {
      setActiveRoleId(roleId);
      try {
        localStorage.setItem('lr1975_demo_role', roleId);
      } catch {
        // ignore
      }
      const nextPerms = getPermissions(roleId);
      const user = DEMO_USERS.find((u) => u.roleId === roleId);
      // Ensure user doesn't remain on a forbidden module
      setNav((prev) => {
        if (prev.module === 'gestion' && !nextPerms.canViewManagement) {
          return { module: 'inicio', section: 'resumen' };
        }
        if (prev.module === 'personal' && !nextPerms.canViewPersonnel) {
          return { module: 'inicio', section: 'resumen' };
        }
        if (prev.module === 'administracion' && !nextPerms.canViewAdmin) {
          return { module: 'inicio', section: 'resumen' };
        }
        return prev;
      });
      notify(`Rol activo cambiado a: ${user?.roleLabel ?? roleId}`, 'info');
    },
    [notify]
  );

  const resetDemoData = useCallback(async () => {
    await demoRepository.clear();
    const fresh = createInitialSeedDataset();
    setData(fresh);
    await demoRepository.save(fresh);
    setNav({ module: 'inicio', section: 'resumen' });
    notify('Datos de demostración restablecidos al estado inicial.', 'info');
  }, [notify]);

  // ==========================================
  // ORGANIZATION MUTATIONS
  // ==========================================

  const createSector = useCallback(
    (input: { name: string; code: string; description: string; dailyMinHeadcount: number; managerEmployeeId?: string }) => {
      const id = createId('sec');
      const now = new Date().toISOString();
      const sector: Sector = {
        id,
        organizationId: data.organization.id,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description.trim(),
        dailyMinHeadcount: input.dailyMinHeadcount,
        managerEmployeeId: input.managerEmployeeId || undefined,
        active: true,
        createdAt: now,
        updatedAt: now
      };
      updateAndPersist(
        (prev) => ({ ...prev, sectors: [...prev.sectors, sector] }),
        {
          module: 'organizacion',
          entityType: 'Sector',
          entityId: id,
          action: 'SECTOR_CREADO',
          summary: `Se creó el sector "${sector.name}" (${sector.code}).`
        }
      );
      notify(`Sector "${sector.name}" creado.`);
    },
    [data.organization.id, updateAndPersist, notify]
  );

  const updateSector = useCallback(
    (sectorId: string, patch: Partial<Pick<Sector, 'name' | 'description' | 'dailyMinHeadcount' | 'managerEmployeeId'>>) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => ({
          ...prev,
          sectors: prev.sectors.map((s) => (s.id === sectorId ? { ...s, ...patch, updatedAt: now } : s))
        }),
        {
          module: 'organizacion',
          entityType: 'Sector',
          entityId: sectorId,
          action: 'SECTOR_ACTUALIZADO',
          summary: `Se actualizó la configuración del sector ${patch.name ?? sectorId}.`
        }
      );
      notify('Sector actualizado correctamente.');
    },
    [updateAndPersist, notify]
  );

  const createPosition = useCallback(
    (input: { sectorId: string; name: string; level: Position['level']; targetHeadcount: number; description: string }) => {
      const id = createId('pos');
      const now = new Date().toISOString();
      const pos: Position = {
        id,
        sectorId: input.sectorId,
        name: input.name.trim(),
        level: input.level,
        targetHeadcount: input.targetHeadcount,
        description: input.description.trim(),
        active: true,
        createdAt: now,
        updatedAt: now
      };
      updateAndPersist(
        (prev) => ({ ...prev, positions: [...prev.positions, pos] }),
        {
          module: 'organizacion',
          entityType: 'Position',
          entityId: id,
          action: 'PUESTO_CREADO',
          summary: `Se creó el puesto "${pos.name}" (dotación objetivo: ${pos.targetHeadcount}).`
        }
      );
      notify(`Puesto "${pos.name}" creado.`);
    },
    [updateAndPersist, notify]
  );

  const assignShift = useCallback(
    (input: {
      employeeId: string;
      sectorId: string;
      positionId: string;
      temporaryPositionId?: string;
      shiftId: string;
      operationalDate: ISODate;
      startTime: string;
      endTime: string;
      status: ShiftAssignmentStatus;
      notes?: string;
    }) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => {
          const emp = prev.employees.find((e) => e.id === input.employeeId);
          const existingIdx = prev.shiftAssignments.findIndex(
            (s) => s.employeeId === input.employeeId && s.operationalDate === input.operationalDate
          );
          let nextAssignments: ShiftAssignment[];
          let shiftAssignmentId: string;
          if (existingIdx >= 0) {
            shiftAssignmentId = prev.shiftAssignments[existingIdx].id;
            nextAssignments = prev.shiftAssignments.map((s, idx) =>
              idx === existingIdx
                ? {
                    ...s,
                    sectorId: input.sectorId,
                    positionId: input.positionId,
                    temporaryPositionId: input.temporaryPositionId || undefined,
                    shiftId: input.shiftId,
                    startTime: input.startTime,
                    endTime: input.endTime,
                    status: input.status,
                    notes: input.notes,
                    updatedAt: now,
                    updatedBy: activeUser.name
                  }
                : s
            );
          } else {
            shiftAssignmentId = createId('sa');
            nextAssignments = [
              ...prev.shiftAssignments,
              {
                id: shiftAssignmentId,
                employeeId: input.employeeId,
                sectorId: input.sectorId,
                positionId: input.positionId,
                temporaryPositionId: input.temporaryPositionId || undefined,
                shiftId: input.shiftId,
                operationalDate: input.operationalDate,
                startTime: input.startTime,
                endTime: input.endTime,
                status: input.status,
                notes: input.notes,
                createdAt: now,
                createdBy: activeUser.name,
                updatedAt: now,
                updatedBy: activeUser.name
              }
            ];
          }

          // Cross-module sync (Scenario 2): if status is absence, create an AttendanceEvent in Personal!
          let nextAttendance = prev.attendanceEvents;
          if (input.status === 'ausente_justificado' || input.status === 'ausente_injustificado') {
            const eventType: AttendanceEventType =
              input.status === 'ausente_justificado' ? 'ausencia_justificada' : 'ausencia_injustificada';
            const alreadyExists = prev.attendanceEvents.some(
              (a) =>
                a.employeeId === input.employeeId &&
                a.operationalDate === input.operationalDate &&
                a.eventType === eventType
            );
            if (!alreadyExists) {
              const newAtt: AttendanceEvent = {
                id: createId('att'),
                employeeId: input.employeeId,
                sectorId: input.sectorId,
                shiftAssignmentId,
                operationalDate: input.operationalDate,
                eventType,
                justified: input.status === 'ausente_justificado',
                notes: input.notes || `Registrado desde calendario de dotación (${emp?.firstName ?? ''} ${emp?.lastName ?? ''}).`,
                occurredAt: `${input.operationalDate}T${input.startTime}:00Z`,
                registeredAt: now,
                registeredBy: activeUser.name,
                status: 'registrado'
              };
              nextAttendance = [newAtt, ...prev.attendanceEvents];
            }
          }

          const updated: AppDataset = {
            ...prev,
            shiftAssignments: nextAssignments,
            attendanceEvents: nextAttendance
          };
          return {
            ...updated,
            payrollPreparations: recalculatePayrollForDataset(updated)
          };
        },
        {
          module: 'organizacion',
          entityType: 'ShiftAssignment',
          entityId: input.employeeId,
          action: 'TURNO_ASIGNADO',
          summary: `Asignación de turno (${input.status}) para fecha ${input.operationalDate}.`
        }
      );
      notify('Dotación actualizada y sincronizada con el legajo del colaborador.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const saveChecklistExecution = useCallback(
    (input: {
      executionId?: string;
      procedureId: string;
      shiftId: string;
      operationalDate: ISODate;
      assignedEmployeeId: string;
      performedByEmployeeId: string;
      answers: ChecklistAnswer[];
      observations?: string;
      submit: boolean;
    }): string => {
      const now = new Date().toISOString();
      const proc = data.procedures.find((p) => p.id === input.procedureId);
      const pv = data.procedureVersions.find((v) => v.id === proc?.currentVersionId);
      const execId = input.executionId ?? createId('chk-exec');

      updateAndPersist(
        (prev) => {
          const existing = prev.checklistExecutions.find((e) => e.id === execId);
          const performedEmp = prev.employees.find((e) => e.id === input.performedByEmployeeId);
          const perfName = performedEmp ? `${performedEmp.firstName} ${performedEmp.lastName}` : input.performedByEmployeeId;

          if (existing) {
            // Never silently edit a completed/verified checklist — append a traceable correction entry
            const wasSubmitted = existing.verificationStatus !== 'borrador';
            const newHistoryEntry = {
              id: createId('ch'),
              timestamp: now,
              actorId: activeUser.employeeId ?? activeUser.id,
              actorName: activeUser.name,
              action: wasSubmitted ? ('correccion_trazada' as const) : ('enviado' as const),
              note: wasSubmitted
                ? `Corrección trazada sobre checklist enviado. Realizado por: ${perfName}. ${input.observations ?? ''}`
                : `Checklist enviado. Realizado por: ${perfName}. Registrado por: ${activeUser.name}.`
            };
            const updated: ChecklistExecution = {
              ...existing,
              performedByEmployeeId: input.performedByEmployeeId,
              answers: input.answers,
              observations: input.observations,
              submittedAt: input.submit ? now : existing.submittedAt,
              verificationStatus: input.submit ? 'enviado' : existing.verificationStatus,
              history: [...existing.history, newHistoryEntry],
              updatedAt: now
            };
            return {
              ...prev,
              checklistExecutions: prev.checklistExecutions.map((e) => (e.id === execId ? updated : e))
            };
          }

          const created: ChecklistExecution = {
            id: execId,
            procedureId: input.procedureId,
            procedureVersionId: pv?.id ?? '',
            checklistTemplateId: pv?.checklistTemplateId ?? '',
            sectorId: proc?.sectorId ?? 'sec-salon',
            positionId: proc?.positionId ?? 'pos-mozo',
            shiftId: input.shiftId,
            operationalDate: input.operationalDate,
            assignedEmployeeId: input.assignedEmployeeId,
            performedByEmployeeId: input.performedByEmployeeId,
            registeredByUserId: activeUser.employeeId ?? activeUser.id,
            registeredByName: activeUser.name,
            submittedAt: input.submit ? now : undefined,
            verificationStatus: input.submit ? 'enviado' : 'borrador',
            answers: input.answers,
            observations: input.observations,
            history: [
              {
                id: createId('ch'),
                timestamp: now,
                actorId: activeUser.employeeId ?? activeUser.id,
                actorName: activeUser.name,
                action: 'enviado',
                note: input.submit
                  ? `Checklist enviado. Realizado por: ${perfName}. Registrado por: ${activeUser.name}.`
                  : `Borrador guardado por ${activeUser.name}.`
              }
            ],
            createdAt: now,
            updatedAt: now
          };

          return {
            ...prev,
            checklistExecutions: [created, ...prev.checklistExecutions]
          };
        },
        {
          module: 'organizacion',
          entityType: 'ChecklistExecution',
          entityId: execId,
          action: input.submit ? 'CHECKLIST_ENVIADO' : 'CHECKLIST_BORRADOR',
          summary: `${proc?.title ?? 'Checklist'} ${input.submit ? 'enviado a verificación' : 'guardado en borrador'}.`
        }
      );

      notify(input.submit ? 'Checklist enviado con trazabilidad de actores.' : 'Borrador de checklist guardado.');
      return execId;
    },
    [data.procedures, data.procedureVersions, activeUser, updateAndPersist, notify]
  );

  const verifyChecklistExecution = useCallback(
    (executionId: string, note?: string) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => ({
          ...prev,
          checklistExecutions: prev.checklistExecutions.map((ex) =>
            ex.id === executionId
              ? {
                  ...ex,
                  verificationStatus: 'verificado',
                  verifiedByUserId: activeUser.employeeId ?? activeUser.id,
                  verifiedByName: activeUser.name,
                  verifiedAt: now,
                  updatedAt: now,
                  history: [
                    ...ex.history,
                    {
                      id: createId('ch'),
                      timestamp: now,
                      actorId: activeUser.employeeId ?? activeUser.id,
                      actorName: activeUser.name,
                      action: 'verificado',
                      note: note || `Verificado conforme por ${activeUser.name}.`
                    }
                  ]
                }
              : ex
          )
        }),
        {
          module: 'organizacion',
          entityType: 'ChecklistExecution',
          entityId: executionId,
          action: 'CHECKLIST_VERIFICADO',
          summary: `Ejecución ${executionId} verificada por ${activeUser.name}.`
        }
      );
      notify('Checklist verificado y asentado en historial.');
    },
    [activeUser, updateAndPersist, notify]
  );

  const disputeChecklistExecution = useCallback(
    (input: {
      executionId: string;
      fieldId?: string;
      disputedTaskLabel: string;
      observation: string;
      evidenceNote?: string;
    }) => {
      const now = new Date().toISOString();
      const exec = data.checklistExecutions.find((e) => e.id === input.executionId);
      const discId = createId('disc');
      const newDisc: Discrepancy = {
        id: discId,
        executionId: input.executionId,
        sectorId: exec?.sectorId ?? 'sec-cocina',
        fieldId: input.fieldId,
        disputedTaskLabel: input.disputedTaskLabel,
        reportedByEmployeeId: activeUser.employeeId ?? activeUser.id,
        reportedByName: activeUser.name,
        reportedAt: now,
        observation: input.observation,
        evidenceNote: input.evidenceNote,
        status: 'abierta'
      };
      updateAndPersist(
        (prev) => ({
          ...prev,
          discrepancies: [newDisc, ...prev.discrepancies],
          checklistExecutions: prev.checklistExecutions.map((ex) =>
            ex.id === input.executionId
              ? {
                  ...ex,
                  verificationStatus: 'observado_discrepancia',
                  verifiedByUserId: activeUser.employeeId ?? activeUser.id,
                  verifiedByName: activeUser.name,
                  verifiedAt: now,
                  updatedAt: now,
                  history: [
                    ...ex.history,
                    {
                      id: createId('ch'),
                      timestamp: now,
                      actorId: activeUser.employeeId ?? activeUser.id,
                      actorName: activeUser.name,
                      action: 'discrepancia_reportada',
                      note: `Discrepancia en "${input.disputedTaskLabel}": ${input.observation}`
                    }
                  ]
                }
              : ex
          )
        }),
        {
          module: 'organizacion',
          entityType: 'Discrepancy',
          entityId: discId,
          action: 'DISCREPANCIA_REPORTADA',
          summary: `Discrepancia operativa registrada sobre "${input.disputedTaskLabel}".`
        }
      );
      notify('Discrepancia operativa registrada (no constituye sanción automática).', 'warning');
    },
    [data.checklistExecutions, activeUser, updateAndPersist, notify]
  );

  const resolveDiscrepancy = useCallback(
    (discrepancyId: string, resolution: string) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => ({
          ...prev,
          discrepancies: prev.discrepancies.map((d) =>
            d.id === discrepancyId
              ? {
                  ...d,
                  status: 'resuelta',
                  resolution,
                  verifiedByName: activeUser.name,
                  resolvedAt: now
                }
              : d
          )
        }),
        {
          module: 'organizacion',
          entityType: 'Discrepancy',
          entityId: discrepancyId,
          action: 'DISCREPANCIA_RESUELTA',
          summary: `Discrepancia ${discrepancyId} cerrada por ${activeUser.name}.`
        }
      );
      notify('Discrepancia marcada como resuelta.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const uploadDocument = useCallback(
    (docInput: Omit<AppDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
      const id = createId('doc');
      const now = new Date().toISOString();
      const newDoc: AppDocument = {
        ...docInput,
        id,
        uploadedAt: now,
        uploadedBy: activeUser.name
      };
      updateAndPersist(
        (prev) => ({ ...prev, documents: [newDoc, ...prev.documents] }),
        {
          module: 'organizacion',
          entityType: 'Document',
          entityId: id,
          action: 'DOCUMENTO_CARGADO',
          summary: `Documento "${newDoc.title}" (${newDoc.version}) cargado en repositorio local.`
        }
      );
      notify(`Documento "${newDoc.title}" guardado en biblioteca.`);
    },
    [activeUser.name, updateAndPersist, notify]
  );

  // ==========================================
  // MANAGEMENT MUTATIONS
  // ==========================================

  const createPurchaseRequest = useCallback(
    (input: {
      sectorId: string;
      neededByDate: ISODate;
      priority: PurchaseRequest['priority'];
      observations?: string;
      submitNow: boolean;
      lines: Array<{ productId: string; requestedQty: number; notes?: string }>;
    }): string => {
      const id = createId('pr');
      const now = new Date().toISOString();
      const seqNum = 143 + data.purchaseRequests.length;
      const code = `SC-2026-0${seqNum}`;
      const status = input.submitNow ? 'solicitado' : 'borrador';

      const builtLines: PurchaseRequestLine[] = input.lines.map((l) => {
        const prod = data.products.find((p) => p.id === l.productId);
        return {
          id: createId('prl'),
          productId: l.productId,
          unit: prod?.baseUnit ?? 'un',
          requestedQty: l.requestedQty,
          systemStockAtRequest: prod?.currentStock ?? 0,
          referenceUnitPriceArs: prod?.costReferenceArs ?? 0,
          supplierId: prod?.supplierId ?? 'sup-almacen',
          notes: l.notes
        };
      });

      const req: PurchaseRequest = {
        id,
        code,
        sectorId: input.sectorId,
        requestedByEmployeeId: activeUser.employeeId ?? activeUser.id,
        requestedByName: activeUser.name,
        operationalDate: todayISO(),
        neededByDate: input.neededByDate,
        priority: input.priority,
        status,
        lines: builtLines,
        observations: input.observations,
        transitions: [
          {
            id: createId('tr'),
            fromStatus: null,
            toStatus: status,
            actorId: activeUser.employeeId ?? activeUser.id,
            actorName: activeUser.name,
            actorRole: activeUser.roleLabel,
            timestamp: now,
            notes: input.observations || 'Solicitud creada desde plataforma digital.'
          }
        ],
        createdAt: now,
        updatedAt: now
      };

      updateAndPersist(
        (prev) => ({ ...prev, purchaseRequests: [req, ...prev.purchaseRequests] }),
        {
          module: 'gestion',
          entityType: 'PurchaseRequest',
          entityId: id,
          action: 'SOLICITUD_COMPRA_CREADA',
          summary: `Solicitud ${code} creada (${builtLines.length} ítems) en estado ${status}.`
        }
      );
      notify(`Solicitud ${code} registrada correctamente.`);
      return id;
    },
    [data.purchaseRequests.length, data.products, activeUser, updateAndPersist, notify]
  );

  const verifyPurchaseRequest = useCallback(
    (
      requestId: string,
      verifiedLines: Array<{
        lineId: string;
        physicalVerifiedStock: number;
        verifiedQty: number;
        justification?: string;
      }>,
      sendToApproval: boolean,
      notes?: string
    ) => {
      const now = new Date().toISOString();
      const targetStatus = sendToApproval ? 'pendiente_aprobacion' : 'verificado';
      updateAndPersist(
        (prev) => ({
          ...prev,
          purchaseRequests: prev.purchaseRequests.map((pr) => {
            if (pr.id !== requestId) return pr;
            const map = new Map(verifiedLines.map((v) => [v.lineId, v]));
            return {
              ...pr,
              status: targetStatus,
              updatedAt: now,
              lines: pr.lines.map((line) => {
                const v = map.get(line.id);
                return v
                  ? {
                      ...line,
                      physicalVerifiedStock: v.physicalVerifiedStock,
                      verifiedQty: v.verifiedQty,
                      justification: v.justification
                    }
                  : line;
              }),
              transitions: [
                ...pr.transitions,
                {
                  id: createId('tr'),
                  fromStatus: pr.status,
                  toStatus: targetStatus,
                  actorId: activeUser.employeeId ?? activeUser.id,
                  actorName: activeUser.name,
                  actorRole: activeUser.roleLabel,
                  timestamp: now,
                  notes: notes || 'Stock físico verificado y cantidades validadas.'
                }
              ]
            };
          })
        }),
        {
          module: 'gestion',
          entityType: 'PurchaseRequest',
          entityId: requestId,
          action: 'COMPRA_VERIFICADA',
          summary: `Verificación física de stock completada por ${activeUser.name} (${targetStatus}).`
        }
      );
      notify(
        sendToApproval
          ? 'Verificación registrada y solicitud elevada a aprobación de Gerencia.'
          : 'Verificación física de stock guardada.'
      );
    },
    [activeUser, updateAndPersist, notify]
  );

  const decidePurchaseRequest = useCallback(
    (
      requestId: string,
      decision: 'aprobado' | 'rechazado',
      approvedLines: Array<{ lineId: string; approvedQty: number }>,
      notes?: string
    ) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => ({
          ...prev,
          purchaseRequests: prev.purchaseRequests.map((pr) => {
            if (pr.id !== requestId) return pr;
            const map = new Map(approvedLines.map((a) => [a.lineId, a.approvedQty]));
            return {
              ...pr,
              status: decision,
              updatedAt: now,
              lines: pr.lines.map((line) => ({
                ...line,
                approvedQty: decision === 'aprobado' ? (map.get(line.id) ?? line.verifiedQty ?? line.requestedQty) : 0
              })),
              transitions: [
                ...pr.transitions,
                {
                  id: createId('tr'),
                  fromStatus: pr.status,
                  toStatus: decision,
                  actorId: activeUser.employeeId ?? activeUser.id,
                  actorName: activeUser.name,
                  actorRole: activeUser.roleLabel,
                  timestamp: now,
                  notes:
                    notes ||
                    (decision === 'aprobado'
                      ? 'Compra aprobada por Gerencia Operativa.'
                      : 'Solicitud rechazada.')
                }
              ]
            };
          })
        }),
        {
          module: 'gestion',
          entityType: 'PurchaseRequest',
          entityId: requestId,
          action: decision === 'aprobado' ? 'COMPRA_APROBADA' : 'COMPRA_RECHAZADA',
          summary: `Solicitud ${requestId} marcada como ${decision} por ${activeUser.name}.`
        }
      );
      notify(decision === 'aprobado' ? 'Solicitud aprobada. Lista para emitir órdenes por proveedor.' : 'Solicitud rechazada.', decision === 'aprobado' ? 'success' : 'warning');
    },
    [activeUser, updateAndPersist, notify]
  );

  const generatePurchaseOrdersFromRequest = useCallback(
    (requestId: string, deliveryInfo?: string): PurchaseOrder[] => {
      const pr = data.purchaseRequests.find((r) => r.id === requestId);
      if (!pr) return [];
      const now = new Date().toISOString();

      // Group approved lines by supplier
      const bySupplier = new Map<string, PurchaseRequestLine[]>();
      pr.lines.forEach((line) => {
        const qty = line.approvedQty ?? line.verifiedQty ?? line.requestedQty;
        if (qty <= 0) return;
        const list = bySupplier.get(line.supplierId) ?? [];
        list.push(line);
        bySupplier.set(line.supplierId, list);
      });

      const createdOrders: PurchaseOrder[] = [];
      let counter = data.purchaseOrders.length + 84;
      bySupplier.forEach((lines, supplierId) => {
        const po: PurchaseOrder = {
          id: createId('po'),
          orderNumber: `OC-2026-00${counter++}`,
          purchaseRequestId: pr.id,
          purchaseRequestCode: pr.code,
          supplierId,
          issueDate: todayISO(),
          deliveryInfo: deliveryInfo || 'Depósito La Rueda 1975 — Puerto Iguazú (08:00 a 12:00 hs)',
          authorizedByName: activeUser.name,
          status: 'enviada',
          lines: lines.map((l) => {
            const prod = data.products.find((p) => p.id === l.productId);
            return {
              id: createId('pol'),
              requestLineId: l.id,
              productId: l.productId,
              productName: prod?.name ?? l.productId,
              unit: l.unit,
              approvedQty: l.approvedQty ?? l.verifiedQty ?? l.requestedQty,
              receivedQty: 0,
              referenceUnitPriceArs: l.referenceUnitPriceArs ?? prod?.costReferenceArs ?? 0
            };
          }),
          notes: pr.observations,
          createdAt: now,
          updatedAt: now
        };
        createdOrders.push(po);
      });

      updateAndPersist(
        (prev) => ({
          ...prev,
          purchaseOrders: [...createdOrders, ...prev.purchaseOrders],
          purchaseRequests: prev.purchaseRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'enviado',
                  updatedAt: now,
                  transitions: [
                    ...r.transitions,
                    {
                      id: createId('tr'),
                      fromStatus: r.status,
                      toStatus: 'enviado',
                      actorId: activeUser.employeeId ?? activeUser.id,
                      actorName: activeUser.name,
                      actorRole: activeUser.roleLabel,
                      timestamp: now,
                      notes: `Emitidas ${createdOrders.length} orden(es): ${createdOrders.map((o) => o.orderNumber).join(', ')}.`
                    }
                  ]
                }
              : r
          )
        }),
        {
          module: 'gestion',
          entityType: 'PurchaseOrder',
          entityId: createdOrders[0]?.id ?? requestId,
          action: 'ORDENES_EMITIDAS',
          summary: `Se generaron ${createdOrders.length} orden(es) de compra desde ${pr.code}.`
        }
      );

      notify(`Generada(s) ${createdOrders.length} Orden(es) de Compra agrupadas por proveedor.`);
      return createdOrders;
    },
    [data.purchaseRequests, data.purchaseOrders.length, data.products, activeUser, updateAndPersist, notify]
  );

  const receiveGoodsForOrder = useCallback(
    (input: {
      orderId: string;
      receivedLines: Array<{ productId: string; receivedQty: number }>;
      discrepancyNotes?: string;
    }) => {
      const now = new Date().toISOString();
      const today = todayISO();
      updateAndPersist(
        (prev) => {
          const po = prev.purchaseOrders.find((o) => o.id === input.orderId);
          if (!po) return prev;
          const recMap = new Map(input.receivedLines.map((l) => [l.productId, l.receivedQty]));

          const newMovements: InventoryMovement[] = [];
          const receiptLines: GoodsReceipt['lines'] = [];
          const updatedProducts = prev.products.map((prod) => {
            const qty = recMap.get(prod.id);
            if (!qty || qty <= 0) return prod;
            const prevStock = prod.currentStock;
            const newStock = Number((prevStock + qty).toFixed(3));
            const movId = createId('mov');
            newMovements.push({
              id: movId,
              productId: prod.id,
              type: 'entrada_compra',
              quantityDelta: qty,
              unit: prod.baseUnit,
              previousStock: prevStock,
              newStock,
              locationId: prod.locationId,
              originReferenceType: 'purchase_order',
              originReferenceId: po.id,
              operationalDate: today,
              notes: `Recepción ${po.orderNumber}${input.discrepancyNotes ? ` — ${input.discrepancyNotes}` : ''}`,
              createdBy: activeUser.name,
              createdAt: now
            });
            const poLine = po.lines.find((pl) => pl.productId === prod.id);
            receiptLines.push({
              productId: prod.id,
              orderedQty: poLine?.approvedQty ?? qty,
              receivedQty: qty,
              inventoryMovementId: movId
            });
            return { ...prod, currentStock: newStock, updatedAt: now };
          });

          const updatedPoLines = po.lines.map((pl) => ({
            ...pl,
            receivedQty: Number((pl.receivedQty + (recMap.get(pl.productId) ?? 0)).toFixed(3))
          }));
          const isFullyReceived = updatedPoLines.every((pl) => pl.receivedQty >= pl.approvedQty);

          const receipt: GoodsReceipt = {
            id: createId('gr'),
            purchaseOrderId: po.id,
            purchaseRequestId: po.purchaseRequestId,
            receivedDate: today,
            receivedByName: activeUser.name,
            isPartial: !isFullyReceived,
            discrepancyNotes: input.discrepancyNotes,
            lines: receiptLines,
            createdAt: now
          };

          const updatedOrders = prev.purchaseOrders.map((o) =>
            o.id === po.id
              ? {
                  ...o,
                  status: isFullyReceived ? ('recibida' as const) : ('recibida_parcial' as const),
                  lines: updatedPoLines,
                  updatedAt: now
                }
              : o
          );

          const updatedRequests = prev.purchaseRequests.map((r) => {
            if (r.id !== po.purchaseRequestId) return r;
            const updatedReqLines = r.lines.map((rl) => {
              const delta = recMap.get(rl.productId) ?? 0;
              return delta > 0 ? { ...rl, receivedQty: (rl.receivedQty ?? 0) + delta } : rl;
            });
            const allOrdersReceived = updatedOrders
              .filter((o) => o.purchaseRequestId === r.id)
              .every((o) => o.status === 'recibida' || o.status === 'cerrada');
            const nextStatus = allOrdersReceived ? ('recibido' as const) : r.status;
            return {
              ...r,
              status: nextStatus,
              lines: updatedReqLines,
              updatedAt: now,
              transitions: [
                ...r.transitions,
                {
                  id: createId('tr'),
                  fromStatus: r.status,
                  toStatus: nextStatus,
                  actorId: activeUser.employeeId ?? activeUser.id,
                  actorName: activeUser.name,
                  actorRole: activeUser.roleLabel,
                  timestamp: now,
                  notes: `Recepción ${isFullyReceived ? 'completa' : 'parcial'} de ${po.orderNumber}. ${input.discrepancyNotes ?? ''}`
                }
              ]
            };
          });

          return {
            ...prev,
            products: updatedProducts,
            inventoryMovements: [...newMovements, ...prev.inventoryMovements],
            goodsReceipts: [receipt, ...prev.goodsReceipts],
            purchaseOrders: updatedOrders,
            purchaseRequests: updatedRequests
          };
        },
        {
          module: 'gestion',
          entityType: 'GoodsReceipt',
          entityId: input.orderId,
          action: 'MERCADERIA_RECIBIDA',
          summary: `Recepción registrada sobre orden ${input.orderId}; stock actualizado en inventario.`
        }
      );
      notify('Recepción asentada y stock actualizado con trazabilidad.');
    },
    [activeUser, updateAndPersist, notify]
  );

  const registerInventoryMovement = useCallback(
    (input: {
      productId: string;
      type: InventoryMovementType;
      quantityDelta: number;
      locationId: string;
      destinationLocationId?: string;
      sectorId?: string;
      operationalDate: ISODate;
      notes: string;
    }) => {
      const now = new Date().toISOString();
      const movId = createId('mov');
      updateAndPersist(
        (prev) => {
          const prod = prev.products.find((p) => p.id === input.productId);
          if (!prod) return prev;
          const prevStock = prod.currentStock;
          const newStock =
            input.type === 'conteo_fisico'
              ? Math.max(0, Number(input.quantityDelta.toFixed(3)))
              : Math.max(0, Number((prevStock + input.quantityDelta).toFixed(3)));
          const actualDelta = Number((newStock - prevStock).toFixed(3));

          const mov: InventoryMovement = {
            id: movId,
            productId: prod.id,
            type: input.type,
            quantityDelta: actualDelta,
            unit: prod.baseUnit,
            previousStock: prevStock,
            newStock,
            locationId: input.locationId,
            destinationLocationId: input.destinationLocationId,
            sectorId: input.sectorId,
            originReferenceType: 'manual',
            operationalDate: input.operationalDate,
            notes: input.notes,
            createdBy: activeUser.name,
            createdAt: now
          };

          return {
            ...prev,
            products: prev.products.map((p) =>
              p.id === prod.id
                ? { ...p, currentStock: newStock, locationId: input.destinationLocationId || p.locationId, updatedAt: now }
                : p
            ),
            inventoryMovements: [mov, ...prev.inventoryMovements]
          };
        },
        {
          module: 'gestion',
          entityType: 'InventoryMovement',
          entityId: movId,
          action: `INVENTARIO_${input.type.toUpperCase()}`,
          summary: `Movimiento ${input.type} registrado (${input.quantityDelta}).`
        }
      );
      notify('Movimiento de inventario registrado.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const registerLossEvent = useCallback(
    (input: {
      productId: string;
      type: LossType;
      grossInputQty?: number;
      usableOutputQty?: number;
      lossQty?: number;
      reason: WasteReason;
      sectorId: string;
      operationalDate: ISODate;
      reportedByEmployeeId?: string;
      linkToInventory: boolean;
      notes?: string;
      evidenceNote?: string;
    }): LossEvent => {
      const now = new Date().toISOString();
      const prod = data.products.find((p) => p.id === input.productId);
      const repEmp = data.employees.find((e) => e.id === input.reportedByEmployeeId);

      let lossQty = input.lossQty ?? 0;
      let lossPercentage: number | undefined;
      let yieldPercentage: number | undefined;

      if (input.type === 'merma' && input.grossInputQty && input.grossInputQty > 0 && input.usableOutputQty !== undefined) {
        lossQty = Number((input.grossInputQty - input.usableOutputQty).toFixed(3));
        lossPercentage = Number(((lossQty / input.grossInputQty) * 100).toFixed(2));
        yieldPercentage = Number(((input.usableOutputQty / input.grossInputQty) * 100).toFixed(2));
      }

      // Strictly do not calculate monetary impact without a known cost (Scenario 6!)
      const costRef = prod?.costReferenceArs ?? null;
      const estimatedImpactArs = costRef !== null ? Math.round(lossQty * costRef) : null;

      const lossId = createId('loss');
      const movId = input.linkToInventory ? createId('mov') : undefined;

      const event: LossEvent = {
        id: lossId,
        productId: input.productId,
        type: input.type,
        grossInputQty: input.grossInputQty,
        usableOutputQty: input.usableOutputQty,
        lossQty,
        lossPercentage,
        yieldPercentage,
        unit: prod?.baseUnit ?? 'kg',
        reason: input.reason,
        sectorId: input.sectorId,
        operationalDate: input.operationalDate,
        registeredByUserId: activeUser.employeeId ?? activeUser.id,
        registeredByName: activeUser.name,
        reportedByEmployeeId: input.reportedByEmployeeId,
        reportedByName: repEmp ? `${repEmp.firstName} ${repEmp.lastName}` : undefined,
        costReferenceArs: costRef,
        estimatedImpactArs,
        linkedInventoryMovementId: movId,
        notes: input.notes,
        evidenceNote: input.evidenceNote,
        createdAt: now
      };

      updateAndPersist(
        (prev) => {
          const targetProd = prev.products.find((p) => p.id === input.productId);
          let nextProducts = prev.products;
          let nextMovements = prev.inventoryMovements;

          if (input.linkToInventory && targetProd && movId) {
            const prevStock = targetProd.currentStock;
            const newStock = Math.max(0, Number((prevStock - lossQty).toFixed(3)));
            const movement: InventoryMovement = {
              id: movId,
              productId: targetProd.id,
              type: input.type === 'desperdicio' ? 'baja_desperdicio' : 'merma_proceso',
              quantityDelta: -lossQty,
              unit: targetProd.baseUnit,
              previousStock: prevStock,
              newStock,
              locationId: targetProd.locationId,
              sectorId: input.sectorId,
              originReferenceType: 'loss_event',
              originReferenceId: lossId,
              operationalDate: input.operationalDate,
              notes: `${input.type === 'desperdicio' ? 'Desperdicio' : 'Merma'} (${input.reason}): ${input.notes ?? ''}`,
              createdBy: activeUser.name,
              createdAt: now
            };
            nextProducts = prev.products.map((p) =>
              p.id === targetProd.id ? { ...p, currentStock: newStock, updatedAt: now } : p
            );
            nextMovements = [movement, ...prev.inventoryMovements];
          }

          return {
            ...prev,
            products: nextProducts,
            inventoryMovements: nextMovements,
            lossEvents: [event, ...prev.lossEvents]
          };
        },
        {
          module: 'gestion',
          entityType: 'LossEvent',
          entityId: lossId,
          action: input.type === 'desperdicio' ? 'DESPERDICIO_REGISTRADO' : 'MERMA_REGISTRADA',
          summary: `${input.type === 'desperdicio' ? 'Desperdicio' : 'Merma'} de ${lossQty} ${event.unit} de ${prod?.name ?? input.productId}${input.linkToInventory ? ' (vinculado 1:1 a inventario)' : ''}.`
        }
      );

      notify(
        input.linkToInventory
          ? `${input.type === 'desperdicio' ? 'Desperdicio' : 'Merma'} registrado y descontado de stock sin duplicación.`
          : `${input.type === 'desperdicio' ? 'Desperdicio' : 'Merma'} registrado en analítica.`
      );
      return event;
    },
    [data.products, data.employees, activeUser, updateAndPersist, notify]
  );

  const upsertDemandForecast = useCallback(
    (input: Omit<DemandForecast, 'id' | 'updatedBy' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => {
          const exists = prev.demandForecasts.find((f) => f.operationalDate === input.operationalDate);
          if (exists) {
            return {
              ...prev,
              demandForecasts: prev.demandForecasts.map((f) =>
                f.operationalDate === input.operationalDate
                  ? { ...f, ...input, updatedBy: activeUser.name, updatedAt: now }
                  : f
              )
            };
          }
          return {
            ...prev,
            demandForecasts: [
              ...prev.demandForecasts,
              { id: createId('fc'), ...input, updatedBy: activeUser.name, updatedAt: now }
            ].sort((a, b) => a.operationalDate.localeCompare(b.operationalDate))
          };
        },
        {
          module: 'gestion',
          entityType: 'DemandForecast',
          entityId: input.operationalDate,
          action: 'PLANIFICACION_ACTUALIZADA',
          summary: `Proyección para ${input.operationalDate}: ${input.expectedGuests} comensales esperados.`
        }
      );
      notify('Planificación operativa guardada.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const commitDataImport = useCallback(
    (input: {
      sourceProfile: ImportSourceProfile;
      dataset: CanonicalDataset;
      fileName: string;
      fileFingerprint: string;
      totalRows: number;
      newSales?: Sale[];
      newExpenses?: Expense[];
      newProducts?: Product[];
      skippedDuplicateRows: number;
      errorRows: number;
      warnings: string[];
      saveMapping?: { name: string; columnMap: Record<string, string> };
    }): ImportBatch => {
      const now = new Date().toISOString();
      const batchId = createId('imp');
      const importedCount =
        (input.newSales?.length ?? 0) + (input.newExpenses?.length ?? 0) + (input.newProducts?.length ?? 0);

      const batch: ImportBatch = {
        id: batchId,
        sourceProfile: input.sourceProfile,
        dataset: input.dataset,
        fileName: input.fileName,
        fileFingerprint: input.fileFingerprint,
        totalRows: input.totalRows,
        importedRows: importedCount,
        skippedDuplicateRows: input.skippedDuplicateRows,
        errorRows: input.errorRows,
        warnings: input.warnings,
        importedBy: activeUser.name,
        importedAt: now,
        status: input.warnings.length > 0 || input.errorRows > 0 ? 'completado_con_advertencias' : 'completado'
      };

      updateAndPersist(
        (prev) => {
          let nextMappings = prev.importMappings;
          if (input.saveMapping) {
            const profile: ImportMappingProfile = {
              id: createId('map'),
              name: input.saveMapping.name,
              sourceProfile: input.sourceProfile,
              dataset: input.dataset,
              columnMap: input.saveMapping.columnMap,
              createdAt: now
            };
            nextMappings = [profile, ...prev.importMappings];
          }

          // Deduplicate products by SKU if importing products
          let nextProducts = prev.products;
          if (input.newProducts && input.newProducts.length > 0) {
            const bySku = new Map(prev.products.map((p) => [p.sku.toUpperCase(), p]));
            input.newProducts.forEach((np) => {
              const existing = bySku.get(np.sku.toUpperCase());
              if (existing) {
                nextProducts = nextProducts.map((p) =>
                  p.id === existing.id
                    ? { ...p, currentStock: np.currentStock, minStock: np.minStock, costReferenceArs: np.costReferenceArs, updatedAt: now }
                    : p
                );
              } else {
                nextProducts = [np, ...nextProducts];
              }
            });
          }

          return {
            ...prev,
            sales: input.newSales ? [...prev.sales, ...input.newSales.map((s) => ({ ...s, importBatchId: batchId }))] : prev.sales,
            expenses: input.newExpenses ? [...input.newExpenses.map((e) => ({ ...e, importBatchId: batchId })), ...prev.expenses] : prev.expenses,
            products: nextProducts,
            importBatches: [batch, ...prev.importBatches],
            importMappings: nextMappings
          };
        },
        {
          module: 'gestion',
          entityType: 'ImportBatch',
          entityId: batchId,
          action: 'IMPORTACION_CONFIRMADA',
          summary: `Importación ${input.fileName} (${input.sourceProfile}): ${importedCount} registros nuevos, ${input.skippedDuplicateRows} duplicados omitidos.`
        }
      );

      notify(`Importación confirmada: ${importedCount} registro(s) incorporado(s).`);
      return batch;
    },
    [activeUser.name, updateAndPersist, notify]
  );

  // ==========================================
  // PERSONNEL MUTATIONS
  // ==========================================

  const createEmployee = useCallback(
    (input: {
      firstName: string;
      lastName: string;
      fictionalDocCode: string;
      email: string;
      phone: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      hireDate: ISODate;
      sectorId: string;
      positionId: string;
      supervisorEmployeeId?: string;
      contractType: ContractType;
      weeklyBaseSalaryArs: number;
    }): Employee => {
      const now = new Date().toISOString();
      const nextNum = data.employees.length + 1;
      const id = createId('emp');
      const legajo = `LEG-${1000 + nextNum}`;

      const emp: Employee = {
        id,
        legajo,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        fictionalDocCode: input.fictionalDocCode.trim() || `DEMO-ID-${40200 + nextNum}`,
        email: input.email.trim() || `${input.firstName.toLowerCase()}.${input.lastName.toLowerCase()}@demo-larueda1975.invalid`,
        phone: input.phone.trim() || '+54 9 3757 00-9999',
        emergencyContactName: input.emergencyContactName.trim() || 'Contacto Familiar Demo',
        emergencyContactPhone: input.emergencyContactPhone.trim() || '+54 9 3757 00-8888',
        hireDate: input.hireDate,
        status: 'activo',
        currentSectorId: input.sectorId,
        currentPositionId: input.positionId,
        supervisorEmployeeId: input.supervisorEmployeeId || undefined,
        contractType: input.contractType,
        weeklyBaseSalaryArs: input.weeklyBaseSalaryArs,
        hourlyExtraRateArs: Math.round((input.weeklyBaseSalaryArs / 44) * 1.5),
        createdAt: now,
        updatedAt: now
      };

      const assignment: EmployeeAssignment = {
        id: createId('asg'),
        employeeId: id,
        sectorId: input.sectorId,
        positionId: input.positionId,
        supervisorEmployeeId: input.supervisorEmployeeId || undefined,
        startDate: input.hireDate,
        assignmentType: 'titular',
        reason: 'Alta inicial en el ecosistema La Rueda 1975.',
        active: true,
        createdAt: now,
        createdBy: activeUser.name
      };

      const contract = {
        id: createId('ctr'),
        employeeId: id,
        contractType: input.contractType,
        startDate: input.hireDate,
        weeklyBaseSalaryArs: input.weeklyBaseSalaryArs,
        weeklyHours: 44,
        notes: 'Alta sintética registrada en demostración.',
        active: true,
        createdAt: now,
        createdBy: activeUser.name
      };

      const vacBalance = {
        employeeId: id,
        year: new Date().getFullYear(),
        entitledDays: 14,
        takenDays: 0,
        approvedPendingDays: 0
      };

      updateAndPersist(
        (prev) => {
          const nextDs: AppDataset = {
            ...prev,
            employees: [emp, ...prev.employees],
            employeeAssignments: [assignment, ...prev.employeeAssignments],
            contracts: [contract, ...prev.contracts],
            vacationBalances: [vacBalance, ...prev.vacationBalances]
          };
          return {
            ...nextDs,
            payrollPreparations: recalculatePayrollForDataset(nextDs)
          };
        },
        {
          module: 'personal',
          entityType: 'Employee',
          entityId: id,
          action: 'EMPLEADO_ALTA',
          summary: `Alta de ${emp.firstName} ${emp.lastName} (${emp.legajo}) asignado a sector y puesto.`
        }
      );

      notify(`${emp.firstName} ${emp.lastName} (${emp.legajo}) creado en Personal y Organización.`);
      return emp;
    },
    [data.employees.length, activeUser.name, updateAndPersist, notify]
  );

  const transferEmployeePosition = useCallback(
    (input: {
      employeeId: string;
      newSectorId: string;
      newPositionId: string;
      newSupervisorEmployeeId?: string;
      effectiveDate: ISODate;
      assignmentType: EmployeeAssignment['assignmentType'];
      reason: string;
    }) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => {
          const prevDay = addDaysISO(input.effectiveDate, -1);
          const updatedAssignments = prev.employeeAssignments.map((a) =>
            a.employeeId === input.employeeId && a.active
              ? { ...a, active: false, endDate: prevDay }
              : a
          );
          const newAssignment: EmployeeAssignment = {
            id: createId('asg'),
            employeeId: input.employeeId,
            sectorId: input.newSectorId,
            positionId: input.newPositionId,
            supervisorEmployeeId: input.newSupervisorEmployeeId || undefined,
            startDate: input.effectiveDate,
            assignmentType: input.assignmentType,
            reason: input.reason,
            active: true,
            createdAt: now,
            createdBy: activeUser.name
          };
          const updatedEmployees = prev.employees.map((e) =>
            e.id === input.employeeId
              ? {
                  ...e,
                  currentSectorId: input.newSectorId,
                  currentPositionId: input.newPositionId,
                  supervisorEmployeeId: input.newSupervisorEmployeeId || e.supervisorEmployeeId,
                  updatedAt: now
                }
              : e
          );
          return {
            ...prev,
            employees: updatedEmployees,
            employeeAssignments: [newAssignment, ...updatedAssignments]
          };
        },
        {
          module: 'personal',
          entityType: 'EmployeeAssignment',
          entityId: input.employeeId,
          action: 'TRASLADO_PUESTO',
          summary: `Cambio de puesto/sector registrado para ${input.employeeId} conservando trayectoria histórica.`
        }
      );
      notify('Traslado de puesto registrado. La asignación anterior permanece en el historial.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const recordAttendanceEvent = useCallback(
    (input: {
      employeeId: string;
      sectorId: string;
      operationalDate: ISODate;
      eventType: AttendanceEventType;
      minutesLate?: number;
      extraHours?: number;
      justified?: boolean;
      notes: string;
    }) => {
      const now = new Date().toISOString();
      const attId = createId('att');
      const evt: AttendanceEvent = {
        id: attId,
        employeeId: input.employeeId,
        sectorId: input.sectorId,
        operationalDate: input.operationalDate,
        eventType: input.eventType,
        minutesLate: input.minutesLate,
        extraHours: input.extraHours,
        justified: input.justified,
        notes: input.notes,
        occurredAt: `${input.operationalDate}T12:00:00Z`,
        registeredAt: now,
        registeredBy: activeUser.name,
        status: 'registrado'
      };
      updateAndPersist(
        (prev) => {
          // Also reflect absence in today's shiftAssignment if present
          const nextShifts =
            input.eventType === 'ausencia_justificada' || input.eventType === 'ausencia_injustificada'
              ? prev.shiftAssignments.map((s) =>
                  s.employeeId === input.employeeId && s.operationalDate === input.operationalDate
                    ? {
                        ...s,
                        status:
                          input.eventType === 'ausencia_justificada'
                            ? ('ausente_justificado' as const)
                            : ('ausente_injustificado' as const),
                        updatedAt: now,
                        updatedBy: activeUser.name
                      }
                    : s
                )
              : prev.shiftAssignments;

          const nextDs: AppDataset = {
            ...prev,
            attendanceEvents: [evt, ...prev.attendanceEvents],
            shiftAssignments: nextShifts
          };
          return {
            ...nextDs,
            payrollPreparations: recalculatePayrollForDataset(nextDs)
          };
        },
        {
          module: 'personal',
          entityType: 'AttendanceEvent',
          entityId: attId,
          action: 'NOVEDAD_ASISTENCIA',
          summary: `Novedad "${input.eventType}" registrada para fecha ${input.operationalDate}.`
        }
      );
      notify('Novedad de asistencia registrada y reflejada en dotación y pre-liquidación.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const createLeaveRequest = useCallback(
    (input: {
      employeeId: string;
      type: LeaveType;
      startDate: ISODate;
      endDate: ISODate;
      daysRequested: number;
      reason: string;
    }) => {
      const id = createId('lv');
      const now = new Date().toISOString();
      const req: LeaveRequest = {
        id,
        ...input,
        status: 'pendiente',
        requestedAt: now
      };
      updateAndPersist(
        (prev) => ({ ...prev, leaveRequests: [req, ...prev.leaveRequests] }),
        {
          module: 'personal',
          entityType: 'LeaveRequest',
          entityId: id,
          action: 'LICENCIA_SOLICITADA',
          summary: `Solicitud de ${input.type} (${input.daysRequested} días) creada.`
        }
      );
      notify('Solicitud de licencia registrada.');
    },
    [updateAndPersist, notify]
  );

  const reviewLeaveRequest = useCallback(
    (requestId: string, decision: 'aprobada' | 'rechazada', reviewNotes?: string) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => {
          const target = prev.leaveRequests.find((l) => l.id === requestId);
          if (!target) return prev;

          const nextRequests = prev.leaveRequests.map((l) =>
            l.id === requestId
              ? {
                  ...l,
                  status: decision,
                  reviewedBy: activeUser.name,
                  reviewedAt: now,
                  reviewNotes
                }
              : l
          );

          let nextBalances = prev.vacationBalances;
          if (decision === 'aprobada' && target.type === 'vacaciones') {
            nextBalances = prev.vacationBalances.map((b) =>
              b.employeeId === target.employeeId
                ? { ...b, approvedPendingDays: b.approvedPendingDays + target.daysRequested }
                : b
            );
          }

          return {
            ...prev,
            leaveRequests: nextRequests,
            vacationBalances: nextBalances
          };
        },
        {
          module: 'personal',
          entityType: 'LeaveRequest',
          entityId: requestId,
          action: decision === 'aprobada' ? 'LICENCIA_APROBADA' : 'LICENCIA_RECHAZADA',
          summary: `Solicitud de licencia ${requestId} ${decision} por ${activeUser.name}.`
        }
      );
      notify(`Licencia ${decision}. Saldo actualizado.`);
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const addPerformanceEvaluation = useCallback(
    (input: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'evaluatorName'>) => {
      const id = createId('eval');
      const entry: PerformanceEvaluation = {
        ...input,
        id,
        evaluatorName: activeUser.name,
        createdAt: new Date().toISOString()
      };
      updateAndPersist(
        (prev) => ({ ...prev, performanceEvaluations: [entry, ...prev.performanceEvaluations] }),
        {
          module: 'personal',
          entityType: 'PerformanceEvaluation',
          entityId: id,
          action: 'EVALUACION_REGISTRADA',
          summary: `Registro de desempeño (${input.category}) asentado en legajo.`
        }
      );
      notify('Registro de desempeño guardado.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const addDisciplinaryAction = useCallback(
    (input: Omit<DisciplinaryAction, 'id' | 'createdAt' | 'authorizedBy'>) => {
      const id = createId('disc-act');
      const entry: DisciplinaryAction = {
        ...input,
        id,
        authorizedBy: activeUser.name,
        createdAt: new Date().toISOString()
      };
      updateAndPersist(
        (prev) => ({ ...prev, disciplinaryActions: [entry, ...prev.disciplinaryActions] }),
        {
          module: 'personal',
          entityType: 'DisciplinaryAction',
          entityId: id,
          action: 'MEDIDA_DISCIPLINARIA',
          summary: `Medida disciplinaria autorizada (${input.type}) registrada en legajo.`
        }
      );
      notify('Registro disciplinario autorizado asentado.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const createTrainingSession = useCallback(
    (input: Omit<TrainingSession, 'id'> & { participantIds: string[] }) => {
      const id = createId('trn');
      const { participantIds, ...sessionFields } = input;
      const session: TrainingSession = { id, ...sessionFields };
      const attendances = participantIds.map((empId) => ({
        id: createId('ta'),
        trainingSessionId: id,
        employeeId: empId,
        status: 'inscripto' as const
      }));
      updateAndPersist(
        (prev) => ({
          ...prev,
          trainingSessions: [session, ...prev.trainingSessions],
          trainingAttendances: [...attendances, ...prev.trainingAttendances]
        }),
        {
          module: 'personal',
          entityType: 'TrainingSession',
          entityId: id,
          action: 'CAPACITACION_CREADA',
          summary: `Capacitación "${session.title}" programada con ${participantIds.length} participantes.`
        }
      );
      notify(`Capacitación "${session.title}" creada.`);
    },
    [updateAndPersist, notify]
  );

  const markTrainingAttendance = useCallback(
    (attendanceId: string, status: 'inscripto' | 'asistio' | 'ausente') => {
      updateAndPersist((prev) => ({
        ...prev,
        trainingAttendances: prev.trainingAttendances.map((t) =>
          t.id === attendanceId ? { ...t, status } : t
        )
      }));
      notify('Asistencia a capacitación actualizada.');
    },
    [updateAndPersist, notify]
  );

  const createLoanOrAdvance = useCallback(
    (input: {
      employeeId: string;
      type: LoanType;
      amountArs: number;
      installmentsCount: number;
      grantDate: ISODate;
      autoApprove: boolean;
      notes: string;
    }) => {
      const id = createId('loan');
      const now = new Date().toISOString();
      const count = Math.max(1, input.installmentsCount);
      const baseInstallment = Math.round(input.amountArs / count);
      const installments = Array.from({ length: count }, (_, idx) => ({
        installmentNumber: idx + 1,
        dueDate: addDaysISO(input.grantDate, (idx + 1) * 7),
        amountArs:
          idx === count - 1
            ? input.amountArs - baseInstallment * (count - 1)
            : baseInstallment,
        status:
          input.autoApprove && idx === 0
            ? ('incluida_en_preliquidacion' as const)
            : ('pendiente' as const)
      }));

      const loan: Loan = {
        id,
        employeeId: input.employeeId,
        type: input.type,
        amountArs: input.amountArs,
        currency: 'ARS',
        grantDate: input.grantDate,
        authorizedBy: input.autoApprove ? activeUser.name : 'Pendiente de autorización',
        status: input.autoApprove ? 'aprobado' : 'pendiente',
        installmentsCount: count,
        installments,
        notes: input.notes,
        createdAt: now
      };

      updateAndPersist(
        (prev) => {
          const nextDs: AppDataset = { ...prev, loans: [loan, ...prev.loans] };
          return {
            ...nextDs,
            payrollPreparations: recalculatePayrollForDataset(nextDs)
          };
        },
        {
          module: 'personal',
          entityType: 'Loan',
          entityId: id,
          action: input.autoApprove ? 'ADELANTO_APROBADO' : 'ADELANTO_SOLICITADO',
          summary: `${input.type === 'adelanto' ? 'Adelanto' : 'Préstamo'} por ARS ${input.amountArs} (${count} cuota/s).`
        }
      );
      notify(
        input.autoApprove
          ? 'Adelanto/préstamo aprobado e incluido en Pre-liquidación Semanal (sin ejecutar pago automático).'
          : 'Solicitud de adelanto/préstamo registrada.'
      );
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const updateLoanStatus = useCallback(
    (loanId: string, status: Loan['status']) => {
      updateAndPersist(
        (prev) => {
          const nextLoans = prev.loans.map((l) => {
            if (l.id !== loanId) return l;
            const nextInstallments =
              status === 'aprobado' || status === 'en_curso'
                ? l.installments.map((inst, idx) =>
                    idx === 0 && inst.status === 'pendiente'
                      ? { ...inst, status: 'incluida_en_preliquidacion' as const }
                      : inst
                  )
                : l.installments;
            return {
              ...l,
              status,
              authorizedBy: status === 'aprobado' ? activeUser.name : l.authorizedBy,
              installments: nextInstallments
            };
          });
          const nextDs: AppDataset = { ...prev, loans: nextLoans };
          return {
            ...nextDs,
            payrollPreparations: recalculatePayrollForDataset(nextDs)
          };
        },
        {
          module: 'personal',
          entityType: 'Loan',
          entityId: loanId,
          action: `PRESTAMO_${status.toUpperCase()}`,
          summary: `Estado de préstamo/adelanto ${loanId} actualizado a ${status}.`
        }
      );
      notify('Estado actualizado y sincronizado con pre-liquidación.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const addPayrollAdjustment = useCallback(
    (input: {
      payrollPeriodId: string;
      employeeId: string;
      concept: string;
      amountArs: number;
      notes?: string;
    }) => {
      const id = createId('padj');
      const adj: PayrollAdjustment = {
        id,
        ...input,
        authorizedBy: activeUser.name,
        createdAt: new Date().toISOString()
      };
      updateAndPersist(
        (prev) => {
          const nextDs: AppDataset = {
            ...prev,
            payrollAdjustments: [adj, ...prev.payrollAdjustments]
          };
          return {
            ...nextDs,
            payrollPreparations: recalculatePayrollForDataset(nextDs)
          };
        },
        {
          module: 'personal',
          entityType: 'PayrollAdjustment',
          entityId: id,
          action: 'AJUSTE_PRELIQUIDACION',
          summary: `Ajuste autorizado "${input.concept}" (${input.amountArs} ARS).`
        }
      );
      notify('Ajuste autorizado incorporado a la pre-liquidación.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const updatePayrollLineReview = useCallback(
    (lineId: string, patch: Partial<Pick<PayrollPreparationLine, 'reviewStatus' | 'paymentStatus'>>) => {
      const now = new Date().toISOString();
      updateAndPersist(
        (prev) => ({
          ...prev,
          payrollPreparations: prev.payrollPreparations.map((line) =>
            line.id === lineId
              ? { ...line, ...patch, reviewedBy: activeUser.name, updatedAt: now }
              : line
          )
        }),
        {
          module: 'personal',
          entityType: 'PayrollPreparation',
          entityId: lineId,
          action: 'PRELIQUIDACION_ACTUALIZADA',
          summary: `Estado de revisión/pago actualizado por ${activeUser.name}.`
        }
      );
      notify('Estado de pre-liquidación actualizado.');
    },
    [activeUser.name, updateAndPersist, notify]
  );

  const value: AppStoreContextValue = {
    data,
    isLoading,
    storageBackendLabel: demoRepository.getStorageBackendLabel(),
    activeUser,
    permissions,
    nav,
    toasts,
    navigate,
    switchDemoRole,
    notify,
    dismissToast,
    resetDemoData,
    createSector,
    updateSector,
    createPosition,
    assignShift,
    saveChecklistExecution,
    verifyChecklistExecution,
    disputeChecklistExecution,
    resolveDiscrepancy,
    uploadDocument,
    createPurchaseRequest,
    verifyPurchaseRequest,
    decidePurchaseRequest,
    generatePurchaseOrdersFromRequest,
    receiveGoodsForOrder,
    registerInventoryMovement,
    registerLossEvent,
    upsertDemandForecast,
    commitDataImport,
    createEmployee,
    transferEmployeePosition,
    recordAttendanceEvent,
    createLeaveRequest,
    reviewLeaveRequest,
    addPerformanceEvaluation,
    addDisciplinaryAction,
    createTrainingSession,
    markTrainingAttendance,
    createLoanOrAdvance,
    updateLoanStatus,
    addPayrollAdjustment,
    updatePayrollLineReview
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore debe utilizarse dentro de AppStoreProvider');
  return ctx;
}
