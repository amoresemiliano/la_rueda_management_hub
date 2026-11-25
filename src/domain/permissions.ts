import { DemoRoleId, DemoUserProfile } from './types';

export const DEMO_USERS: DemoUserProfile[] = [
  {
    id: 'usr-vegen',
    roleId: 'admin_vegen',
    name: 'Administrador VEGEN',
    roleLabel: 'Administrador',
    title: 'Configuración y acceso integral',
    description:
      'Acceso completo a todos los módulos, auditoría, importación y datos de demostración.'
  },
  {
    id: 'usr-dir',
    roleId: 'direccion',
    name: 'Dirección La Rueda',
    roleLabel: 'Dirección',
    title: 'Dirección General',
    employeeId: 'emp-001',
    description:
      'Tableros ejecutivos, aprobaciones estratégicas, rentabilidad e indicadores consolidados.'
  },
  {
    id: 'usr-pablo',
    roleId: 'gerencia_pablo',
    name: 'Pablo Méndez',
    roleLabel: 'Operación',
    title: 'Gerencia Operativa',
    employeeId: 'emp-002',
    description:
      'Ventas, aprobación final de compras, inventarios, food cost, mermas y planificación de demanda.'
  },
  {
    id: 'usr-raquel',
    roleId: 'rrhh_raquel',
    name: 'Raquel Benítez',
    roleLabel: 'Recursos Humanos',
    title: 'Gestión de Personal y Organización',
    employeeId: 'emp-004',
    description:
      'Legajos, organigrama, dotación y turnos, procedimientos, licencias, disciplina y pre-liquidación.'
  },
  {
    id: 'usr-rene',
    roleId: 'compras_rene',
    name: 'René Giménez',
    roleLabel: 'Compras',
    title: 'Compras y Depósito',
    employeeId: 'emp-006',
    description:
      'Revisión de solicitudes, verificación física de stock, órdenes de compra y recepción de mercadería.'
  },
  {
    id: 'usr-sector',
    roleId: 'responsable_sector',
    name: 'Martín Duarte',
    roleLabel: 'Responsable de sector',
    title: 'Supervisión de sector',
    employeeId: 'emp-029',
    managedSectorIds: ['sec-salon', 'sec-barra'],
    description:
      'Dotación de su sector, verificación de checklists, registro de novedades y solicitudes de compra.'
  },
  {
    id: 'usr-colab',
    roleId: 'colaborador',
    name: 'Sofía Paredes',
    roleLabel: 'Colaborador',
    title: 'Equipo operativo',
    employeeId: 'emp-033',
    managedSectorIds: ['sec-salon'],
    description:
      'Ejecución de checklists propios, consulta de turnos, manuales vigentes y legajo personal autorizado.'
  }
];

export interface RolePermissions {
  canViewHome: boolean;
  canViewOrganization: boolean;
  canEditOrgStructure: boolean;
  canManageStaffing: boolean;
  canExecuteChecklists: boolean;
  canVerifyChecklists: boolean;
  canUploadDocuments: boolean;
  canViewManagement: boolean;
  canViewFinancialMetrics: boolean;
  canCreatePurchaseRequest: boolean;
  canVerifyPurchaseStock: boolean;
  canApprovePurchases: boolean;
  canReceiveGoods: boolean;
  canManageInventory: boolean;
  canRegisterLosses: boolean;
  canImportData: boolean;
  canViewPersonnel: boolean;
  canViewAllEmployees: boolean;
  canCreateOrTransferEmployee: boolean;
  canViewSalaryAndPayroll: boolean;
  canViewDisciplinary: boolean;
  canApproveLeaves: boolean;
  canAuthorizeLoans: boolean;
  canViewAnalytics: boolean;
  canViewAdmin: boolean;
}

const PERMISSION_MATRIX: Record<DemoRoleId, RolePermissions> = {
  admin_vegen: {
    canViewHome: true,
    canViewOrganization: true,
    canEditOrgStructure: true,
    canManageStaffing: true,
    canExecuteChecklists: true,
    canVerifyChecklists: true,
    canUploadDocuments: true,
    canViewManagement: true,
    canViewFinancialMetrics: true,
    canCreatePurchaseRequest: true,
    canVerifyPurchaseStock: true,
    canApprovePurchases: true,
    canReceiveGoods: true,
    canManageInventory: true,
    canRegisterLosses: true,
    canImportData: true,
    canViewPersonnel: true,
    canViewAllEmployees: true,
    canCreateOrTransferEmployee: true,
    canViewSalaryAndPayroll: true,
    canViewDisciplinary: true,
    canApproveLeaves: true,
    canAuthorizeLoans: true,
    canViewAnalytics: true,
    canViewAdmin: true
  },
  direccion: {
    canViewHome: true,
    canViewOrganization: true,
    canEditOrgStructure: true,
    canManageStaffing: false,
    canExecuteChecklists: false,
    canVerifyChecklists: true,
    canUploadDocuments: true,
    canViewManagement: true,
    canViewFinancialMetrics: true,
    canCreatePurchaseRequest: true,
    canVerifyPurchaseStock: false,
    canApprovePurchases: true,
    canReceiveGoods: false,
    canManageInventory: false,
    canRegisterLosses: false,
    canImportData: true,
    canViewPersonnel: true,
    canViewAllEmployees: true,
    canCreateOrTransferEmployee: false,
    canViewSalaryAndPayroll: true,
    canViewDisciplinary: true,
    canApproveLeaves: true,
    canAuthorizeLoans: true,
    canViewAnalytics: true,
    canViewAdmin: true
  },
  gerencia_pablo: {
    canViewHome: true,
    canViewOrganization: true,
    canEditOrgStructure: true,
    canManageStaffing: true,
    canExecuteChecklists: true,
    canVerifyChecklists: true,
    canUploadDocuments: true,
    canViewManagement: true,
    canViewFinancialMetrics: true,
    canCreatePurchaseRequest: true,
    canVerifyPurchaseStock: true,
    canApprovePurchases: true,
    canReceiveGoods: true,
    canManageInventory: true,
    canRegisterLosses: true,
    canImportData: true,
    canViewPersonnel: true,
    canViewAllEmployees: true,
    canCreateOrTransferEmployee: false,
    canViewSalaryAndPayroll: true,
    canViewDisciplinary: false,
    canApproveLeaves: true,
    canAuthorizeLoans: true,
    canViewAnalytics: true,
    canViewAdmin: false
  },
  rrhh_raquel: {
    canViewHome: true,
    canViewOrganization: true,
    canEditOrgStructure: true,
    canManageStaffing: true,
    canExecuteChecklists: true,
    canVerifyChecklists: true,
    canUploadDocuments: true,
    canViewManagement: false,
    canViewFinancialMetrics: false,
    canCreatePurchaseRequest: true,
    canVerifyPurchaseStock: false,
    canApprovePurchases: false,
    canReceiveGoods: false,
    canManageInventory: false,
    canRegisterLosses: false,
    canImportData: false,
    canViewPersonnel: true,
    canViewAllEmployees: true,
    canCreateOrTransferEmployee: true,
    canViewSalaryAndPayroll: true,
    canViewDisciplinary: true,
    canApproveLeaves: true,
    canAuthorizeLoans: true,
    canViewAnalytics: true,
    canViewAdmin: true
  },
  compras_rene: {
    canViewHome: true,
    canViewOrganization: true,
    canEditOrgStructure: false,
    canManageStaffing: false,
    canExecuteChecklists: true,
    canVerifyChecklists: false,
    canUploadDocuments: true,
    canViewManagement: true,
    canViewFinancialMetrics: false,
    canCreatePurchaseRequest: true,
    canVerifyPurchaseStock: true,
    canApprovePurchases: false,
    canReceiveGoods: true,
    canManageInventory: true,
    canRegisterLosses: true,
    canImportData: true,
    canViewPersonnel: false,
    canViewAllEmployees: false,
    canCreateOrTransferEmployee: false,
    canViewSalaryAndPayroll: false,
    canViewDisciplinary: false,
    canApproveLeaves: false,
    canAuthorizeLoans: false,
    canViewAnalytics: true,
    canViewAdmin: false
  },
  responsable_sector: {
    canViewHome: true,
    canViewOrganization: true,
    canEditOrgStructure: false,
    canManageStaffing: true,
    canExecuteChecklists: true,
    canVerifyChecklists: true,
    canUploadDocuments: false,
    canViewManagement: true,
    canViewFinancialMetrics: false,
    canCreatePurchaseRequest: true,
    canVerifyPurchaseStock: false,
    canApprovePurchases: false,
    canReceiveGoods: false,
    canManageInventory: false,
    canRegisterLosses: true,
    canImportData: false,
    canViewPersonnel: true,
    canViewAllEmployees: false,
    canCreateOrTransferEmployee: false,
    canViewSalaryAndPayroll: false,
    canViewDisciplinary: false,
    canApproveLeaves: false,
    canAuthorizeLoans: false,
    canViewAnalytics: true,
    canViewAdmin: false
  },
  colaborador: {
    canViewHome: true,
    canViewOrganization: true,
    canEditOrgStructure: false,
    canManageStaffing: false,
    canExecuteChecklists: true,
    canVerifyChecklists: false,
    canUploadDocuments: false,
    canViewManagement: false,
    canViewFinancialMetrics: false,
    canCreatePurchaseRequest: false,
    canVerifyPurchaseStock: false,
    canApprovePurchases: false,
    canReceiveGoods: false,
    canManageInventory: false,
    canRegisterLosses: false,
    canImportData: false,
    canViewPersonnel: true,
    canViewAllEmployees: false,
    canCreateOrTransferEmployee: false,
    canViewSalaryAndPayroll: false,
    canViewDisciplinary: false,
    canApproveLeaves: false,
    canAuthorizeLoans: false,
    canViewAnalytics: false,
    canViewAdmin: false
  }
};

export function getPermissions(roleId: DemoRoleId): RolePermissions {
  return PERMISSION_MATRIX[roleId];
}
