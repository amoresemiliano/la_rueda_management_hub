export type ISODate = string; // YYYY-MM-DD
export type ISOTimestamp = string; // ISO 8601

export type DemoRoleId =
  | 'admin_vegen'
  | 'direccion'
  | 'gerencia_pablo'
  | 'rrhh_raquel'
  | 'compras_rene'
  | 'responsable_sector'
  | 'colaborador';

export interface DemoUserProfile {
  id: string;
  roleId: DemoRoleId;
  name: string;
  roleLabel: string;
  title: string;
  employeeId?: string;
  managedSectorIds?: string[];
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  foundedYear: number;
  location: string;
  simultaneousCapacity: number;
  currency: 'ARS';
  timezone: string;
}

// ==========================================
// MODULE 1: ORGANIZACIÓN
// ==========================================

export interface Sector {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string;
  managerEmployeeId?: string;
  dailyMinHeadcount: number;
  active: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Position {
  id: string;
  sectorId: string;
  name: string;
  level: 'direccion' | 'gerencia' | 'encargado' | 'supervisor' | 'operativo' | 'apoyo';
  targetHeadcount: number;
  description: string;
  active: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export type ShiftType = 'manana' | 'mediodia' | 'noche' | 'cortado' | 'administrativo';

export interface Shift {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // HH:mm 24h
  endTime: string; // HH:mm 24h
}

export type ShiftAssignmentStatus =
  | 'programado'
  | 'presente'
  | 'franco'
  | 'ausente_justificado'
  | 'ausente_injustificado'
  | 'licencia';

export interface ShiftAssignment {
  id: string;
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
  createdAt: ISOTimestamp;
  createdBy: string;
  updatedAt: ISOTimestamp;
  updatedBy: string;
}

export type ChecklistFieldType =
  | 'checkbox'
  | 'number'
  | 'time'
  | 'date'
  | 'text'
  | 'select'
  | 'temperature'
  | 'product'
  | 'evidence';

export interface ChecklistField {
  id: string;
  label: string;
  type: ChecklistFieldType;
  required: boolean;
  unit?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  helperText?: string;
}

export interface Procedure {
  id: string;
  code: string;
  title: string;
  sectorId: string;
  positionId: string;
  frequency: 'diaria' | 'por_turno' | 'semanal' | 'mensual';
  shiftType?: ShiftType;
  currentVersionId: string;
  active: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface ProcedureVersion {
  id: string;
  procedureId: string;
  versionNumber: string;
  summary: string;
  approvedBy: string;
  approvedAt: ISOTimestamp;
  checklistTemplateId: string;
}

export interface ChecklistTemplate {
  id: string;
  procedureId: string;
  versionNumber: string;
  title: string;
  fields: ChecklistField[];
}

export interface ChecklistAnswer {
  fieldId: string;
  value: string | number | boolean | null;
  observation?: string;
  evidenceFileName?: string;
}

export type VerificationStatus =
  | 'borrador'
  | 'enviado'
  | 'verificado'
  | 'observado_discrepancia';

export interface ChecklistCorrectionEntry {
  id: string;
  timestamp: ISOTimestamp;
  actorId: string;
  actorName: string;
  action: 'enviado' | 'verificado' | 'discrepancia_reportada' | 'correccion_trazada';
  note: string;
}

export interface ChecklistExecution {
  id: string;
  procedureId: string;
  procedureVersionId: string;
  checklistTemplateId: string;
  sectorId: string;
  positionId: string;
  shiftId: string;
  operationalDate: ISODate;
  assignedEmployeeId: string; // Asignado
  performedByEmployeeId?: string; // Realizado
  registeredByUserId: string; // Registrado
  registeredByName: string;
  submittedAt?: ISOTimestamp;
  verificationStatus: VerificationStatus;
  verifiedByUserId?: string; // Verificado
  verifiedByName?: string;
  verifiedAt?: ISOTimestamp;
  answers: ChecklistAnswer[];
  observations?: string;
  history: ChecklistCorrectionEntry[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export type DiscrepancyStatus = 'abierta' | 'en_revision' | 'resuelta';

export interface Discrepancy {
  id: string;
  executionId: string;
  sectorId: string;
  fieldId?: string;
  disputedTaskLabel: string;
  reportedByEmployeeId: string;
  reportedByName: string;
  reportedAt: ISOTimestamp;
  observation: string;
  evidenceNote?: string;
  status: DiscrepancyStatus;
  resolution?: string;
  verifiedByName?: string;
  resolvedAt?: ISOTimestamp;
}

export type DocumentCategory =
  | 'manual_operativo'
  | 'procedimiento'
  | 'seguridad_higiene'
  | 'induccion'
  | 'rrhh_politica'
  | 'legajo_empleado';

export interface AppDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  sectorId?: string;
  positionId?: string;
  procedureId?: string;
  employeeId?: string;
  version: string;
  approvalStatus: 'vigente' | 'en_revision' | 'historico';
  approvedBy?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string; // Stored in IndexedDB for genuine uploaded/demo files
  summary: string;
  allowedRoles: DemoRoleId[];
  uploadedAt: ISOTimestamp;
  uploadedBy: string;
}

// ==========================================
// MODULE 3: PERSONAL
// ==========================================

export type EmployeeStatus = 'activo' | 'licencia' | 'suspendido' | 'egresado';
export type ContractType =
  | 'tiempo_indeterminado'
  | 'temporada'
  | 'plazo_fijo'
  | 'eventual'
  | 'pasantia';

export interface Employee {
  id: string;
  legajo: string; // e.g. LEG-1001
  firstName: string;
  lastName: string;
  fictionalDocCode: string; // Synthetic non-real identifier e.g. DEMO-ID-1001
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hireDate: ISODate;
  status: EmployeeStatus;
  currentSectorId: string;
  currentPositionId: string;
  supervisorEmployeeId?: string;
  contractType: ContractType;
  weeklyBaseSalaryArs: number; // Synthetic reference
  hourlyExtraRateArs: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface EmploymentContract {
  id: string;
  employeeId: string;
  contractType: ContractType;
  startDate: ISODate;
  endDate?: ISODate;
  weeklyBaseSalaryArs: number;
  weeklyHours: number;
  notes: string;
  active: boolean;
  createdAt: ISOTimestamp;
  createdBy: string;
}

export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  sectorId: string;
  positionId: string;
  supervisorEmployeeId?: string;
  startDate: ISODate;
  endDate?: ISODate;
  assignmentType: 'titular' | 'temporal' | 'reemplazo';
  reason: string;
  active: boolean;
  createdAt: ISOTimestamp;
  createdBy: string;
}

export type AttendanceEventType =
  | 'asistencia'
  | 'tardanza'
  | 'ausencia_justificada'
  | 'ausencia_injustificada'
  | 'horas_extra'
  | 'franco_trabajado'
  | 'franco_compensatorio';

export interface AttendanceEvent {
  id: string;
  employeeId: string;
  sectorId: string;
  shiftAssignmentId?: string;
  operationalDate: ISODate;
  eventType: AttendanceEventType;
  minutesLate?: number;
  extraHours?: number;
  justified?: boolean;
  notes: string;
  occurredAt: ISOTimestamp;
  registeredAt: ISOTimestamp;
  registeredBy: string;
  approvedBy?: string;
  status: 'registrado' | 'aprobado' | 'observado';
}

export type LeaveType =
  | 'vacaciones'
  | 'enfermedad'
  | 'estudio'
  | 'personal'
  | 'franco_compensatorio';

export type LeaveStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'tomada';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: ISODate;
  endDate: ISODate;
  daysRequested: number;
  status: LeaveStatus;
  reason: string;
  requestedAt: ISOTimestamp;
  reviewedBy?: string;
  reviewedAt?: ISOTimestamp;
  reviewNotes?: string;
}

export interface VacationBalance {
  employeeId: string;
  year: number;
  entitledDays: number;
  takenDays: number;
  approvedPendingDays: number;
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  operationalDate: ISODate;
  evaluatorName: string;
  category: 'evaluacion_periodica' | 'reconocimiento' | 'observacion_operativa';
  score?: number; // 1-5 optional
  summary: string;
  strengths?: string;
  improvementPlan?: string;
  createdAt: ISOTimestamp;
}

export interface DisciplinaryAction {
  id: string;
  employeeId: string;
  operationalDate: ISODate;
  type: 'llamado_atencion' | 'apercibimiento' | 'suspension';
  daysSuspended?: number;
  reason: string;
  authorizedBy: string;
  supportingDocRef?: string;
  createdAt: ISOTimestamp;
}

export interface TrainingSession {
  id: string;
  title: string;
  topic: string;
  instructor: string;
  scheduledDate: ISODate;
  durationHours: number;
  sectorIds: string[];
  status: 'programada' | 'completada';
}

export interface TrainingAttendance {
  id: string;
  trainingSessionId: string;
  employeeId: string;
  status: 'inscripto' | 'asistio' | 'ausente';
  notes?: string;
}

export type LoanType = 'adelanto' | 'prestamo';

export interface LoanInstallment {
  installmentNumber: number;
  dueDate: ISODate;
  amountArs: number;
  status: 'pendiente' | 'incluida_en_preliquidacion' | 'pagada';
  paidAt?: ISODate;
}

export interface Loan {
  id: string;
  employeeId: string;
  type: LoanType;
  amountArs: number;
  currency: 'ARS';
  grantDate: ISODate;
  authorizedBy: string;
  status: 'pendiente' | 'aprobado' | 'en_curso' | 'saldado' | 'rechazado';
  installmentsCount: number;
  installments: LoanInstallment[];
  notes: string;
  createdAt: ISOTimestamp;
}

export interface TipAllocation {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  sectorId: string;
  amountArs: number;
  operationalDate: ISODate;
  notes?: string;
}

export interface PayrollPeriod {
  id: string;
  code: string; // e.g. SEM-2026-47
  label: string;
  startDate: ISODate;
  endDate: ISODate;
  status: 'abierto' | 'en_revision' | 'aprobado_preliquidacion' | 'pagado_registrado';
}

export interface PayrollAdjustment {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  concept: string;
  amountArs: number; // positive addition or negative deduction
  authorizedBy: string;
  notes?: string;
  createdAt: ISOTimestamp;
}

export interface PayrollPreparationLine {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  baseWeeklyArs: number;
  scheduledShiftsCount: number;
  absencesCount: number;
  extraHours: number;
  extraHoursAmountArs: number;
  tipsAmountArs: number;
  advancesDeductionArs: number;
  loanInstallmentArs: number;
  otherAdjustmentsArs: number;
  netEstimatedArs: number;
  reviewStatus: 'pendiente' | 'revisado' | 'aprobado';
  paymentStatus: 'no_ejecutado' | 'pagado_manual';
  reviewedBy?: string;
  updatedAt: ISOTimestamp;
}

// ==========================================
// MODULE 2: GESTIÓN
// ==========================================

export type ProductCategoryId =
  | 'carnes'
  | 'pescados_mariscos'
  | 'lacteos'
  | 'verduras'
  | 'mercaderia_general'
  | 'limpieza'
  | 'lavanderia'
  | 'bebidas'
  | 'barra'
  | 'insumos_produccion';

export interface ProductCategory {
  id: ProductCategoryId;
  name: string;
  defaultSectorId: string;
}

export interface Supplier {
  id: string;
  name: string;
  categoryIds: ProductCategoryId[];
  fictionalTaxCode: string; // Synthetic demo CUIT-DEMO
  contactName: string;
  demoPhone: string;
  demoEmail: string;
  deliveryDays: string;
  leadTimeDays: number;
  active: boolean;
}

export interface InventoryLocation {
  id: string;
  name: string;
  sectorId: string;
  temperatureRange?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: ProductCategoryId;
  subcategory: string;
  baseUnit: 'kg' | 'lt' | 'un' | 'gr' | 'ml' | 'bot' | 'pack';
  purchaseUnit: string;
  conversionFactor: number;
  minStock: number;
  currentStock: number;
  costReferenceArs: number | null; // null allows testing Scenario 6 without known cost
  supplierId: string;
  locationId: string;
  active: boolean;
  updatedAt: ISOTimestamp;
}

export type PurchaseRequestStatus =
  | 'borrador'
  | 'solicitado'
  | 'en_verificacion'
  | 'verificado'
  | 'pendiente_aprobacion'
  | 'aprobado'
  | 'rechazado'
  | 'enviado'
  | 'recibido'
  | 'cerrado';

export interface PurchaseRequestLine {
  id: string;
  productId: string;
  unit: string;
  requestedQty: number;
  systemStockAtRequest: number;
  physicalVerifiedStock?: number;
  verifiedQty?: number;
  approvedQty?: number;
  receivedQty?: number;
  referenceUnitPriceArs?: number;
  supplierId: string;
  justification?: string;
  notes?: string;
}

export interface PurchaseTransition {
  id: string;
  fromStatus: PurchaseRequestStatus | null;
  toStatus: PurchaseRequestStatus;
  actorId: string;
  actorName: string;
  actorRole: string;
  timestamp: ISOTimestamp;
  notes?: string;
}

export interface PurchaseRequest {
  id: string;
  code: string; // e.g. SC-2026-0142
  sectorId: string;
  requestedByEmployeeId: string;
  requestedByName: string;
  operationalDate: ISODate;
  neededByDate: ISODate;
  priority: 'normal' | 'alta' | 'urgente';
  status: PurchaseRequestStatus;
  lines: PurchaseRequestLine[];
  observations?: string;
  transitions: PurchaseTransition[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export type PurchaseOrderStatus = 'emitida' | 'enviada' | 'recibida_parcial' | 'recibida' | 'cerrada';

export interface PurchaseOrderLine {
  id: string;
  requestLineId: string;
  productId: string;
  productName: string;
  unit: string;
  approvedQty: number;
  receivedQty: number;
  referenceUnitPriceArs: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // e.g. OC-2026-0084
  purchaseRequestId: string;
  purchaseRequestCode: string;
  supplierId: string;
  issueDate: ISODate;
  deliveryInfo: string;
  authorizedByName: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  notes?: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  purchaseRequestId: string;
  receivedDate: ISODate;
  receivedByName: string;
  isPartial: boolean;
  discrepancyNotes?: string;
  lines: {
    productId: string;
    orderedQty: number;
    receivedQty: number;
    inventoryMovementId: string;
  }[];
  createdAt: ISOTimestamp;
}

export type InventoryMovementType =
  | 'entrada_compra'
  | 'salida_consumo'
  | 'ajuste_manual'
  | 'conteo_fisico'
  | 'transferencia'
  | 'baja_desperdicio'
  | 'merma_proceso';

export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantityDelta: number; // positive or negative
  unit: string;
  previousStock: number;
  newStock: number;
  locationId: string;
  destinationLocationId?: string;
  sectorId?: string;
  originReferenceType?: 'purchase_order' | 'loss_event' | 'manual' | 'import';
  originReferenceId?: string;
  operationalDate: ISODate;
  notes: string;
  createdBy: string;
  createdAt: ISOTimestamp;
}

export type LossType = 'merma' | 'desperdicio';

export type WasteReason =
  | 'descomposicion'
  | 'vencimiento'
  | 'almacenamiento_incorrecto'
  | 'sobreproduccion'
  | 'error_preparacion'
  | 'producto_danado'
  | 'plato_devuelto'
  | 'comanda_erronea'
  | 'incidente_servicio'
  | 'limpieza_desposte_proceso'
  | 'otro';

export interface LossEvent {
  id: string;
  productId: string;
  type: LossType;
  grossInputQty?: number; // For merma
  usableOutputQty?: number; // For merma
  lossQty: number;
  lossPercentage?: number; // For merma
  yieldPercentage?: number; // For merma
  unit: string;
  reason: WasteReason;
  sectorId: string;
  operationalDate: ISODate;
  registeredByUserId: string;
  registeredByName: string;
  reportedByEmployeeId?: string;
  reportedByName?: string;
  costReferenceArs: number | null;
  estimatedImpactArs: number | null; // Strictly null when cost unknown
  linkedInventoryMovementId?: string;
  notes?: string;
  evidenceNote?: string;
  createdAt: ISOTimestamp;
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  category: 'Parrilla' | 'Entradas' | 'Pescados de Río' | 'Pastas y Cocina' | 'Postres' | 'Vinos y Barra';
  sectorId: string;
  sellingPriceArs: number;
  recipeCostArs: number | null; // null triggers "Datos insuficientes"
  costReliability: 'verificado' | 'estimado' | 'sin_datos';
  active: boolean;
}

export interface SaleLine {
  menuItemId: string;
  quantity: number;
  unitPriceArs: number;
  lineTotalArs: number;
}

export interface Sale {
  id: string;
  operationalDate: ISODate;
  shiftType: 'mediodia' | 'noche';
  ticketsCount: number;
  guestsCount: number;
  coversSold: number;
  totalRevenueArs: number;
  lines: SaleLine[];
  source: 'demo_seed' | 'import_maxirest' | 'import_holistor' | 'import_csv';
  importBatchId?: string;
  fingerprint?: string;
}

export interface Expense {
  id: string;
  operationalDate: ISODate;
  category: string;
  supplierName: string;
  description: string;
  amountArs: number;
  source: 'demo_seed' | 'import_holistor' | 'manual';
  importBatchId?: string;
}

export type ImportSourceProfile = 'maxirest' | 'holistor' | 'etiquetera' | 'otro';
export type CanonicalDataset =
  | 'sales'
  | 'products'
  | 'purchases'
  | 'inventory_movements'
  | 'expenses';

export interface ImportMappingProfile {
  id: string;
  name: string;
  sourceProfile: ImportSourceProfile;
  dataset: CanonicalDataset;
  columnMap: Record<string, string>; // canonicalField -> sourceColumnHeader
  createdAt: ISOTimestamp;
}

export interface ImportBatch {
  id: string;
  sourceProfile: ImportSourceProfile;
  dataset: CanonicalDataset;
  fileName: string;
  fileFingerprint: string;
  totalRows: number;
  importedRows: number;
  skippedDuplicateRows: number;
  errorRows: number;
  warnings: string[];
  importedBy: string;
  importedAt: ISOTimestamp;
  status: 'completado' | 'completado_con_advertencias';
}

export interface DemandForecast {
  id: string;
  operationalDate: ISODate;
  expectedGuests: number;
  confirmedReservations: number;
  tourGroupsCount: number;
  specialEvents: string;
  isHoliday: boolean;
  demandNotes: string;
  updatedBy: string;
  updatedAt: ISOTimestamp;
}

export interface AuditEvent {
  id: string;
  timestamp: ISOTimestamp;
  module: 'organizacion' | 'gestion' | 'personal' | 'administracion';
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  actorId: string;
  actorName: string;
  actorRole: DemoRoleId;
}

export interface AppDataset {
  version: number;
  organization: Organization;
  sectors: Sector[];
  positions: Position[];
  shifts: Shift[];
  shiftAssignments: ShiftAssignment[];
  procedures: Procedure[];
  procedureVersions: ProcedureVersion[];
  checklistTemplates: ChecklistTemplate[];
  checklistExecutions: ChecklistExecution[];
  discrepancies: Discrepancy[];
  documents: AppDocument[];
  employees: Employee[];
  contracts: EmploymentContract[];
  employeeAssignments: EmployeeAssignment[];
  attendanceEvents: AttendanceEvent[];
  leaveRequests: LeaveRequest[];
  vacationBalances: VacationBalance[];
  performanceEvaluations: PerformanceEvaluation[];
  disciplinaryActions: DisciplinaryAction[];
  trainingSessions: TrainingSession[];
  trainingAttendances: TrainingAttendance[];
  loans: Loan[];
  tipAllocations: TipAllocation[];
  payrollPeriods: PayrollPeriod[];
  payrollAdjustments: PayrollAdjustment[];
  payrollPreparations: PayrollPreparationLine[];
  productCategories: ProductCategory[];
  suppliers: Supplier[];
  inventoryLocations: InventoryLocation[];
  products: Product[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  inventoryMovements: InventoryMovement[];
  lossEvents: LossEvent[];
  menuItems: MenuItem[];
  sales: Sale[];
  expenses: Expense[];
  importBatches: ImportBatch[];
  importMappings: ImportMappingProfile[];
  demandForecasts: DemandForecast[];
  auditEvents: AuditEvent[];
}
