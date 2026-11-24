import {
  AppDataset,
  AppDocument,
  AttendanceEvent,
  AuditEvent,
  ChecklistExecution,
  ChecklistTemplate,
  DemandForecast,
  DisciplinaryAction,
  Discrepancy,
  Employee,
  EmployeeAssignment,
  EmploymentContract,
  Expense,
  GoodsReceipt,
  ImportBatch,
  ImportMappingProfile,
  InventoryLocation,
  InventoryMovement,
  LeaveRequest,
  Loan,
  LossEvent,
  MenuItem,
  PayrollAdjustment,
  PayrollPeriod,
  PayrollPreparationLine,
  PerformanceEvaluation,
  Position,
  Procedure,
  ProcedureVersion,
  Product,
  ProductCategory,
  PurchaseOrder,
  PurchaseRequest,
  Sale,
  Sector,
  Shift,
  ShiftAssignment,
  Supplier,
  TipAllocation,
  TrainingAttendance,
  TrainingSession,
  VacationBalance
} from '../domain/types';
import { addDaysISO, todayISO } from '../utils/formatters';

function buildSeededDataUrl(title: string, bodyLines: string[]): string {
  const content = `${title}\n${'='.repeat(title.length)}\n\n${bodyLines.join('\n')}\n\n---\nDocumento sintético de demostración · La Rueda 1975 · VEGEN Digital`;
  const encoded = btoa(unescape(encodeURIComponent(content)));
  return `data:text/plain;charset=utf-8;base64,${encoded}`;
}

export function createInitialSeedDataset(): AppDataset {
  const today = todayISO();
  const nowIso = new Date().toISOString();

  const organization = {
    id: 'org-la-rueda-1975',
    name: 'La Rueda 1975',
    foundedYear: 1975,
    location: 'Puerto Iguazú, Misiones, Argentina',
    simultaneousCapacity: 250,
    currency: 'ARS' as const,
    timezone: 'America/Argentina/Buenos_Aires'
  };

  // 1. SECTORS (12)
  const sectors: Sector[] = [
    {
      id: 'sec-direccion',
      organizationId: organization.id,
      name: 'Dirección',
      code: 'DIR',
      description: 'Conducción estratégica, gerencia operativa y definición de estándares hospitalarios.',
      managerEmployeeId: 'emp-001',
      dailyMinHeadcount: 2,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-admin',
      organizationId: organization.id,
      name: 'Administración y Finanzas',
      code: 'ADM',
      description: 'Facturación, conciliaciones bancarias, pagos a proveedores y control administrativo.',
      managerEmployeeId: 'emp-003',
      dailyMinHeadcount: 2,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-rrhh',
      organizationId: organization.id,
      name: 'Recursos Humanos',
      code: 'RRHH',
      description: 'Legajos, dotación, turnos, capacitaciones, licencias y pre-liquidación semanal.',
      managerEmployeeId: 'emp-004',
      dailyMinHeadcount: 1,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-compras',
      organizationId: organization.id,
      name: 'Compras',
      code: 'COM',
      description: 'Gestión de solicitudes internas, verificación de existencias y órdenes a proveedores.',
      managerEmployeeId: 'emp-006',
      dailyMinHeadcount: 1,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-deposito',
      organizationId: organization.id,
      name: 'Depósito y Almacén',
      code: 'DEP',
      description: 'Recepción de mercadería, cámaras de frío, control de vencimientos y entregas a sectores.',
      managerEmployeeId: 'emp-007',
      dailyMinHeadcount: 2,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-cocina',
      organizationId: organization.id,
      name: 'Cocina',
      code: 'COC',
      description: 'Producción diaria, pescados de río, pastas artesanales, guarniciones y despacho caliente.',
      managerEmployeeId: 'emp-010',
      dailyMinHeadcount: 9,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-parrilla',
      organizationId: organization.id,
      name: 'Parrilla',
      code: 'PAR',
      description: 'Fuegos, maduración y cocción de cortes vacunos tradicionales argentinos.',
      managerEmployeeId: 'emp-020',
      dailyMinHeadcount: 4,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-pasteleria',
      organizationId: organization.id,
      name: 'Pastelería y Postres',
      code: 'PAS',
      description: 'Panificación casera, postres regionales misioneros y despacho dulce.',
      managerEmployeeId: 'emp-025',
      dailyMinHeadcount: 3,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-salon',
      organizationId: organization.id,
      name: 'Salón y Servicio',
      code: 'SAL',
      description: 'Atención a 250 cubiertos simultáneos, recepción de comensales y servicio de mesa.',
      managerEmployeeId: 'emp-029',
      dailyMinHeadcount: 14,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-caja',
      organizationId: organization.id,
      name: 'Caja',
      code: 'CAJ',
      description: 'Apertura y cierre de cajas, facturación en MaxiRest, cobros en moneda local y tarjetas.',
      managerEmployeeId: 'emp-049',
      dailyMinHeadcount: 2,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-barra',
      organizationId: organization.id,
      name: 'Barra',
      code: 'BAR',
      description: 'Cava de vinos argentinos, coctelería clásica, cafetería y despacho de bebidas.',
      managerEmployeeId: 'emp-053',
      dailyMinHeadcount: 3,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'sec-limpieza',
      organizationId: organization.id,
      name: 'Limpieza y Lavandería',
      code: 'LIM',
      description: 'Bacha, saneamiento de cocina y salones, mantelería y uniformes.',
      managerEmployeeId: 'emp-058',
      dailyMinHeadcount: 5,
      active: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: nowIso
    }
  ];

  // 2. POSITIONS (33)
  const positions: Position[] = [
    { id: 'pos-dir-gral', sectorId: 'sec-direccion', name: 'Director General', level: 'direccion', targetHeadcount: 1, description: 'Dirección societaria y visión estratégica.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-ger-op', sectorId: 'sec-direccion', name: 'Gerente Operativo', level: 'gerencia', targetHeadcount: 1, description: 'Control integral de ventas, costos, compras y operación diaria.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-jefe-adm', sectorId: 'sec-admin', name: 'Jefe de Administración', level: 'encargado', targetHeadcount: 1, description: 'Supervisión contable y tesorería.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-aux-adm', sectorId: 'sec-admin', name: 'Analista Administrativo', level: 'operativo', targetHeadcount: 1, description: 'Carga de comprobantes y conciliaciones.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-resp-rrhh', sectorId: 'sec-rrhh', name: 'Responsable de RRHH', level: 'encargado', targetHeadcount: 1, description: 'Gestión de personal, legajos, licencias y turnos.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-asist-rrhh', sectorId: 'sec-rrhh', name: 'Asistente de Personal', level: 'operativo', targetHeadcount: 1, description: 'Seguimiento de novedades y parte semanal.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-enc-compras', sectorId: 'sec-compras', name: 'Encargado de Compras', level: 'encargado', targetHeadcount: 1, description: 'Verificación de pedidos, cotizaciones y emisión de órdenes.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-enc-dep', sectorId: 'sec-deposito', name: 'Encargado de Depósito', level: 'encargado', targetHeadcount: 1, description: 'Control de cámaras, recepción y despacho interno.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-op-dep', sectorId: 'sec-deposito', name: 'Auxiliar de Almacén', level: 'operativo', targetHeadcount: 2, description: 'Orden de stock, rotación FIFO y pesaje.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-chef', sectorId: 'sec-cocina', name: 'Jefe de Cocina', level: 'encargado', targetHeadcount: 1, description: 'Dirección culinaria, recetas y control de calidad.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-sous-chef', sectorId: 'sec-cocina', name: 'Subjefe de Cocina', level: 'supervisor', targetHeadcount: 2, description: 'Coordinación de turnos mediodía y noche.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-cocinero', sectorId: 'sec-cocina', name: 'Cocinero de Partida', level: 'operativo', targetHeadcount: 5, description: 'Elaboración de platos calientes, pescados y pastas.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-ayud-coc', sectorId: 'sec-cocina', name: 'Ayudante de Cocina', level: 'apoyo', targetHeadcount: 4, description: 'Mise en place, limpieza de vegetales y soporte.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-maestro-par', sectorId: 'sec-parrilla', name: 'Maestro Parrillero', level: 'encargado', targetHeadcount: 1, description: 'Punto de carnes, manejo de brasas y desposte.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-parrillero', sectorId: 'sec-parrilla', name: 'Parrillero', level: 'operativo', targetHeadcount: 3, description: 'Despacho continuo de cortes a las brasas.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-ayud-par', sectorId: 'sec-parrilla', name: 'Ayudante de Parrilla', level: 'apoyo', targetHeadcount: 2, description: 'Preparación de carbón, leña y guarniciones de fuego.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-jefe-pas', sectorId: 'sec-pasteleria', name: 'Encargado de Pastelería', level: 'encargado', targetHeadcount: 1, description: 'Planificación de producción dulce y panera.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-pastelero', sectorId: 'sec-pasteleria', name: 'Pastelero', level: 'operativo', targetHeadcount: 3, description: 'Producción y emplatado de postres.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-enc-salon', sectorId: 'sec-salon', name: 'Encargado de Salón', level: 'encargado', targetHeadcount: 1, description: 'Liderazgo de servicio, reservas VIP y estándares de sala.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-sup-salon', sectorId: 'sec-salon', name: 'Supervisor de Salón', level: 'supervisor', targetHeadcount: 2, description: 'Asignación de plazas y supervisión de despacho.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-mozo', sectorId: 'sec-salon', name: 'Mozo', level: 'operativo', targetHeadcount: 11, description: 'Atención personalizada en salón principal y galería.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-comis', sectorId: 'sec-salon', name: 'Comis', level: 'apoyo', targetHeadcount: 5, description: 'Fajinado, transporte de platos y soporte de plazas.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-host', sectorId: 'sec-salon', name: 'Host / Recepción', level: 'operativo', targetHeadcount: 2, description: 'Bienvenida multilingüe, lista de espera y asignación de mesas.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-apoyo-sal', sectorId: 'sec-salon', name: 'Personal de Apoyo', level: 'apoyo', targetHeadcount: 2, description: 'Refuerzo en eventos, grupos turísticos y fines de semana.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-enc-caja', sectorId: 'sec-caja', name: 'Encargado de Caja', level: 'encargado', targetHeadcount: 1, description: 'Arqueos, fondo fijo y control de cierres diarios.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-cajero', sectorId: 'sec-caja', name: 'Cajero', level: 'operativo', targetHeadcount: 3, description: 'Adición de mesas, cobros y cierre de turno.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-jefe-barra', sectorId: 'sec-barra', name: 'Jefe de Barra y Cava', level: 'encargado', targetHeadcount: 1, description: 'Carta de vinos, inventario de barra y coctelería.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-bartender', sectorId: 'sec-barra', name: 'Bartender / Cafetero', level: 'operativo', targetHeadcount: 4, description: 'Despacho de tragos, vinos y cafetería.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-enc-limp', sectorId: 'sec-limpieza', name: 'Encargado de Limpieza', level: 'encargado', targetHeadcount: 1, description: 'Saneamiento integral, lavandería e insumos.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-bachero', sectorId: 'sec-limpieza', name: 'Bachero / Saneamiento', level: 'operativo', targetHeadcount: 5, description: 'Lavado de vajilla, cristalería y limpieza profunda.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso },
    { id: 'pos-lavanderia', sectorId: 'sec-limpieza', name: 'Operario de Lavandería', level: 'operativo', targetHeadcount: 2, description: 'Planchado y cuidado de mantelería y servilletas.', active: true, createdAt: '2025-01-10T09:00:00Z', updatedAt: nowIso }
  ];

  // 3. SHIFTS (5)
  const shifts: Shift[] = [
    { id: 'sh-admin', name: 'Administrativo', type: 'administrativo', startTime: '08:30', endTime: '17:00' },
    { id: 'sh-manana', name: 'Mañana / Producción', type: 'manana', startTime: '07:30', endTime: '15:30' },
    { id: 'sh-mediodia', name: 'Servicio Mediodía', type: 'mediodia', startTime: '10:30', endTime: '16:30' },
    { id: 'sh-noche', name: 'Servicio Noche', type: 'noche', startTime: '18:00', endTime: '00:30' },
    { id: 'sh-cortado', name: 'Turno Cortado', type: 'cortado', startTime: '11:00', endTime: '23:30' }
  ];

  // 4. 65 SYNTHETIC EMPLOYEES (Invented names & safe fictional IDs)
  const rawEmployeeSpecs: Array<[string, string, string, string, string, string, number, string?]> = [
    // [firstName, lastName, sectorId, positionId, hireDate, contractType, weeklyBaseSalaryArs, supervisorId]
    ['Ernesto', 'Villalba', 'sec-direccion', 'pos-dir-gral', '2004-03-01', 'tiempo_indeterminado', 520000],
    ['Pablo', 'Méndez', 'sec-direccion', 'pos-ger-op', '2016-05-12', 'tiempo_indeterminado', 440000, 'emp-001'],
    ['Silvia', 'Castañeda', 'sec-admin', 'pos-jefe-adm', '2014-08-04', 'tiempo_indeterminado', 340000, 'emp-001'],
    ['Raquel', 'Benítez', 'sec-rrhh', 'pos-resp-rrhh', '2018-02-15', 'tiempo_indeterminado', 330000, 'emp-001'],
    ['Luciana', 'Ferreyra', 'sec-rrhh', 'pos-asist-rrhh', '2022-07-01', 'tiempo_indeterminado', 235000, 'emp-004'],
    ['René', 'Giménez', 'sec-compras', 'pos-enc-compras', '2017-04-10', 'tiempo_indeterminado', 310000, 'emp-002'],
    ['Héctor', 'Almirón', 'sec-deposito', 'pos-enc-dep', '2019-09-02', 'tiempo_indeterminado', 265000, 'emp-006'],
    ['Damián', 'Ríos', 'sec-deposito', 'pos-op-dep', '2023-03-14', 'tiempo_indeterminado', 205000, 'emp-007'],
    ['Matías', 'Correa', 'sec-admin', 'pos-aux-adm', '2021-11-08', 'tiempo_indeterminado', 245000, 'emp-003'],
    // Cocina (10)
    ['Gustavo', 'Pereyra', 'sec-cocina', 'pos-chef', '2015-06-20', 'tiempo_indeterminado', 375000, 'emp-002'],
    ['Valeria', 'Sosa', 'sec-cocina', 'pos-sous-chef', '2019-01-14', 'tiempo_indeterminado', 305000, 'emp-010'],
    ['Rodrigo', 'Ledesma', 'sec-cocina', 'pos-sous-chef', '2020-08-03', 'tiempo_indeterminado', 298000, 'emp-010'],
    ['Camilo', 'Báez', 'sec-cocina', 'pos-cocinero', '2021-04-19', 'tiempo_indeterminado', 252000, 'emp-011'],
    ['Nadia', 'Ojeda', 'sec-cocina', 'pos-cocinero', '2021-10-05', 'tiempo_indeterminado', 248000, 'emp-011'],
    ['Federico', 'Ponce', 'sec-cocina', 'pos-cocinero', '2022-05-22', 'tiempo_indeterminado', 245000, 'emp-012'],
    ['Ailén', 'Quiroga', 'sec-cocina', 'pos-cocinero', '2023-02-01', 'tiempo_indeterminado', 242000, 'emp-012'],
    ['Braian', 'Gómez', 'sec-cocina', 'pos-cocinero', '2023-08-15', 'tiempo_indeterminado', 240000, 'emp-011'],
    ['Yamila', 'Acosta', 'sec-cocina', 'pos-ayud-coc', '2024-01-10', 'tiempo_indeterminado', 198000, 'emp-011'],
    ['Nahuel', 'Ibarra', 'sec-cocina', 'pos-ayud-coc', '2024-05-03', 'temporada', 192000, 'emp-012'],
    // Parrilla (5)
    ['Ramón', 'Cardozo', 'sec-parrilla', 'pos-maestro-par', '2012-11-12', 'tiempo_indeterminado', 345000, 'emp-010'],
    ['Cristian', 'Vera', 'sec-parrilla', 'pos-parrillero', '2019-07-08', 'tiempo_indeterminado', 268000, 'emp-020'],
    ['Esteban', 'Molina', 'sec-parrilla', 'pos-parrillero', '2021-09-14', 'tiempo_indeterminado', 262000, 'emp-020'],
    ['Darío', 'Leguizamón', 'sec-parrilla', 'pos-parrillero', '2023-01-20', 'tiempo_indeterminado', 255000, 'emp-020'],
    ['Lucas', 'Romero', 'sec-parrilla', 'pos-ayud-par', '2024-04-01', 'temporada', 198000, 'emp-020'],
    // Pastelería (4)
    ['Mónica', 'Escobar', 'sec-pasteleria', 'pos-jefe-pas', '2017-09-05', 'tiempo_indeterminado', 300000, 'emp-010'],
    ['Florencia', 'Medina', 'sec-pasteleria', 'pos-pastelero', '2021-03-11', 'tiempo_indeterminado', 240000, 'emp-025'],
    ['Agustina', 'Rojas', 'sec-pasteleria', 'pos-pastelero', '2022-11-18', 'tiempo_indeterminado', 236000, 'emp-025'],
    ['Celeste', 'Cáceres', 'sec-pasteleria', 'pos-pastelero', '2024-02-05', 'plazo_fijo', 228000, 'emp-025'],
    // Salón y Servicio (20)
    ['Martín', 'Duarte', 'sec-salon', 'pos-enc-salon', '2015-03-16', 'tiempo_indeterminado', 340000, 'emp-002'],
    ['Carolina', 'Núñez', 'sec-salon', 'pos-sup-salon', '2018-06-11', 'tiempo_indeterminado', 285000, 'emp-029'],
    ['Sebastián', 'Domínguez', 'sec-salon', 'pos-sup-salon', '2019-10-21', 'tiempo_indeterminado', 282000, 'emp-029'],
    ['Alejandro', 'Silva', 'sec-salon', 'pos-mozo', '2018-08-01', 'tiempo_indeterminado', 238000, 'emp-030'],
    ['Sofía', 'Paredes', 'sec-salon', 'pos-mozo', '2020-02-10', 'tiempo_indeterminado', 235000, 'emp-030'],
    ['Nicolás', 'Herrera', 'sec-salon', 'pos-mozo', '2020-11-16', 'tiempo_indeterminado', 234000, 'emp-030'],
    ['Julieta', 'Aguirre', 'sec-salon', 'pos-mozo', '2021-06-07', 'tiempo_indeterminado', 232000, 'emp-030'],
    ['Franco', 'Peralta', 'sec-salon', 'pos-mozo', '2021-09-20', 'tiempo_indeterminado', 230000, 'emp-031'],
    ['Romina', 'Vega', 'sec-salon', 'pos-mozo', '2022-01-17', 'tiempo_indeterminado', 230000, 'emp-031'],
    ['Ezequiel', 'Maidana', 'sec-salon', 'pos-mozo', '2022-04-04', 'tiempo_indeterminado', 228000, 'emp-031'],
    ['Belén', 'Cabrera', 'sec-salon', 'pos-mozo', '2022-09-12', 'tiempo_indeterminado', 228000, 'emp-031'],
    ['Joaquín', 'Sánchez', 'sec-salon', 'pos-mozo', '2023-03-01', 'tiempo_indeterminado', 225000, 'emp-030'],
    ['Micaela', 'Torres', 'sec-salon', 'pos-mozo', '2023-07-15', 'tiempo_indeterminado', 225000, 'emp-031'],
    ['Gonzalo', 'Bustos', 'sec-salon', 'pos-comis', '2023-11-01', 'tiempo_indeterminado', 190000, 'emp-030'],
    ['Camila', 'Navarro', 'sec-salon', 'pos-comis', '2024-01-22', 'tiempo_indeterminado', 188000, 'emp-030'],
    ['Tomás', 'Godoy', 'sec-salon', 'pos-comis', '2024-03-11', 'temporada', 185000, 'emp-031'],
    ['Abril', 'Vázquez', 'sec-salon', 'pos-comis', '2024-06-03', 'temporada', 185000, 'emp-031'],
    ['Daniela', 'Keller', 'sec-salon', 'pos-host', '2021-05-03', 'tiempo_indeterminado', 240000, 'emp-029'],
    ['Valentina', 'Rivas', 'sec-salon', 'pos-host', '2023-04-17', 'tiempo_indeterminado', 232000, 'emp-029'],
    ['Ignacio', 'Peña', 'sec-salon', 'pos-apoyo-sal', '2024-08-01', 'eventual', 180000, 'emp-031'],
    // Caja (4)
    ['Patricia', 'Salinas', 'sec-caja', 'pos-enc-caja', '2016-10-03', 'tiempo_indeterminado', 295000, 'emp-003'],
    ['Mariana', 'Lugo', 'sec-caja', 'pos-cajero', '2020-09-07', 'tiempo_indeterminado', 242000, 'emp-049'],
    ['Gisela', 'Morales', 'sec-caja', 'pos-cajero', '2022-03-21', 'tiempo_indeterminado', 238000, 'emp-049'],
    ['Leandro', 'Funes', 'sec-caja', 'pos-cajero', '2023-09-11', 'tiempo_indeterminado', 234000, 'emp-049'],
    // Barra (5)
    ['Facundo', 'Alvarez', 'sec-barra', 'pos-jefe-barra', '2018-04-02', 'tiempo_indeterminado', 298000, 'emp-029'],
    ['Diego', 'Paz', 'sec-barra', 'pos-bartender', '2020-12-01', 'tiempo_indeterminado', 244000, 'emp-053'],
    ['Melina', 'Ortiz', 'sec-barra', 'pos-bartender', '2022-02-14', 'tiempo_indeterminado', 240000, 'emp-053'],
    ['Lautaro', 'Serrano', 'sec-barra', 'pos-bartender', '2023-06-05', 'tiempo_indeterminado', 236000, 'emp-053'],
    ['Ramiro', 'Chávez', 'sec-barra', 'pos-bartender', '2024-03-04', 'temporada', 230000, 'emp-053'],
    // Limpieza y Lavandería (8)
    ['Norma', 'Delgado', 'sec-limpieza', 'pos-enc-limp', '2016-02-01', 'tiempo_indeterminado', 260000, 'emp-002'],
    ['Miriam', 'Zarza', 'sec-limpieza', 'pos-bachero', '2019-05-13', 'tiempo_indeterminado', 198000, 'emp-058'],
    ['Oscar', 'Barrios', 'sec-limpieza', 'pos-bachero', '2021-01-18', 'tiempo_indeterminado', 196000, 'emp-058'],
    ['Kevin', 'Roldán', 'sec-limpieza', 'pos-bachero', '2022-08-08', 'tiempo_indeterminado', 194000, 'emp-058'],
    ['Jésica', 'Arias', 'sec-limpieza', 'pos-bachero', '2023-05-02', 'tiempo_indeterminado', 192000, 'emp-058'],
    ['Rubén', 'Caballero', 'sec-limpieza', 'pos-bachero', '2024-02-19', 'temporada', 190000, 'emp-058'],
    ['Graciela', 'Bogado', 'sec-limpieza', 'pos-lavanderia', '2018-11-05', 'tiempo_indeterminado', 208000, 'emp-058'],
    ['Elena', 'Avalos', 'sec-limpieza', 'pos-lavanderia', '2022-06-20', 'tiempo_indeterminado', 202000, 'emp-058']
  ];

  const employees: Employee[] = rawEmployeeSpecs.map((spec, idx) => {
    const num = idx + 1;
    const id = `emp-${String(num).padStart(3, '0')}`;
    const legajo = `LEG-${1000 + num}`;
    const [firstName, lastName, currentSectorId, currentPositionId, hireDate, contractType, weeklyBaseSalaryArs, supervisorEmployeeId] = spec;
    const status = num === 37 ? 'licencia' : num === 62 ? 'licencia' : 'activo';
    const slug = `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    return {
      id,
      legajo,
      firstName,
      lastName,
      fictionalDocCode: `DEMO-ID-${40100 + num}`,
      email: `${slug}@demo-larueda1975.invalid`,
      phone: `+54 9 3757 00-${String(1000 + num).slice(-4)}`,
      emergencyContactName: `Contacto Familiar Demo ${num}`,
      emergencyContactPhone: `+54 9 3757 00-${String(5000 + num).slice(-4)}`,
      hireDate,
      status,
      currentSectorId,
      currentPositionId,
      supervisorEmployeeId,
      contractType: contractType as Employee['contractType'],
      weeklyBaseSalaryArs,
      hourlyExtraRateArs: Math.round((weeklyBaseSalaryArs / 44) * 1.5),
      createdAt: `${hireDate}T09:00:00Z`,
      updatedAt: nowIso
    };
  });

  // Contracts & Assignments (including historical promotions/transfers!)
  const contracts: EmploymentContract[] = employees.map((emp) => ({
    id: `ctr-${emp.id}`,
    employeeId: emp.id,
    contractType: emp.contractType,
    startDate: emp.hireDate,
    weeklyBaseSalaryArs: emp.weeklyBaseSalaryArs,
    weeklyHours: 44,
    notes: 'Contrato sintético de demostración.',
    active: true,
    createdAt: emp.createdAt,
    createdBy: 'Raquel Benítez'
  }));

  const employeeAssignments: EmployeeAssignment[] = [];
  employees.forEach((emp) => {
    // Add historical prior assignments for selected staff to demonstrate real trajectory
    if (emp.id === 'emp-033') {
      // Sofía Paredes started as Comis before becoming Mozo
      employeeAssignments.push({
        id: 'asg-hist-033',
        employeeId: emp.id,
        sectorId: 'sec-salon',
        positionId: 'pos-comis',
        supervisorEmployeeId: 'emp-029',
        startDate: '2020-02-10',
        endDate: '2021-08-31',
        assignmentType: 'titular',
        reason: 'Ingreso inicial en salón como comis.',
        active: false,
        createdAt: '2020-02-10T09:00:00Z',
        createdBy: 'Raquel Benítez'
      });
      employeeAssignments.push({
        id: 'asg-curr-033',
        employeeId: emp.id,
        sectorId: emp.currentSectorId,
        positionId: emp.currentPositionId,
        supervisorEmployeeId: emp.supervisorEmployeeId,
        startDate: '2021-09-01',
        assignmentType: 'titular',
        reason: 'Promoción a Moza por evaluación sobresaliente de servicio.',
        active: true,
        createdAt: '2021-09-01T09:00:00Z',
        createdBy: 'Raquel Benítez'
      });
    } else if (emp.id === 'emp-013') {
      // Camilo Báez transferred from Parrilla Ayudante to Cocina Cocinero
      employeeAssignments.push({
        id: 'asg-hist-013',
        employeeId: emp.id,
        sectorId: 'sec-parrilla',
        positionId: 'pos-ayud-par',
        supervisorEmployeeId: 'emp-020',
        startDate: '2021-04-19',
        endDate: '2022-11-30',
        assignmentType: 'titular',
        reason: 'Ingreso inicial en sector Parrilla.',
        active: false,
        createdAt: '2021-04-19T09:00:00Z',
        createdBy: 'Raquel Benítez'
      });
      employeeAssignments.push({
        id: 'asg-curr-013',
        employeeId: emp.id,
        sectorId: emp.currentSectorId,
        positionId: emp.currentPositionId,
        supervisorEmployeeId: emp.supervisorEmployeeId,
        startDate: '2022-12-01',
        assignmentType: 'titular',
        reason: 'Traslado y ascenso a Cocinero de Partida en Cocina Principal.',
        active: true,
        createdAt: '2022-12-01T09:00:00Z',
        createdBy: 'Raquel Benítez'
      });
    } else if (emp.id === 'emp-030') {
      employeeAssignments.push({
        id: 'asg-hist-030',
        employeeId: emp.id,
        sectorId: 'sec-salon',
        positionId: 'pos-mozo',
        supervisorEmployeeId: 'emp-029',
        startDate: '2018-06-11',
        endDate: '2022-04-30',
        assignmentType: 'titular',
        reason: 'Desempeño inicial como Moza titular.',
        active: false,
        createdAt: '2018-06-11T09:00:00Z',
        createdBy: 'Raquel Benítez'
      });
      employeeAssignments.push({
        id: 'asg-curr-030',
        employeeId: emp.id,
        sectorId: emp.currentSectorId,
        positionId: emp.currentPositionId,
        supervisorEmployeeId: emp.supervisorEmployeeId,
        startDate: '2022-05-01',
        assignmentType: 'titular',
        reason: 'Promoción a Supervisora de Salón.',
        active: true,
        createdAt: '2022-05-01T09:00:00Z',
        createdBy: 'Raquel Benítez'
      });
    } else {
      employeeAssignments.push({
        id: `asg-curr-${emp.id}`,
        employeeId: emp.id,
        sectorId: emp.currentSectorId,
        positionId: emp.currentPositionId,
        supervisorEmployeeId: emp.supervisorEmployeeId,
        startDate: emp.hireDate,
        assignmentType: 'titular',
        reason: 'Asignación inicial de puesto.',
        active: true,
        createdAt: emp.createdAt,
        createdBy: 'Raquel Benítez'
      });
    }
  });

  // 5. SHIFT ASSIGNMENTS (Today & Yesterday & Tomorrow for active staffing views)
  const shiftAssignments: ShiftAssignment[] = [];
  const shiftDays = [addDaysISO(today, -1), today, addDaysISO(today, 1)];
  shiftDays.forEach((day, dIdx) => {
    employees.forEach((emp, idx) => {
      let shiftId = 'sh-mediodia';
      let startTime = '10:30';
      let endTime = '16:30';
      if (['sec-direccion', 'sec-admin', 'sec-rrhh', 'sec-compras', 'sec-deposito'].includes(emp.currentSectorId)) {
        shiftId = 'sh-admin';
        startTime = '08:30';
        endTime = '17:00';
      } else if (idx % 3 === 0) {
        shiftId = 'sh-noche';
        startTime = '18:00';
        endTime = '00:30';
      } else if (idx % 5 === 0) {
        shiftId = 'sh-manana';
        startTime = '07:30';
        endTime = '15:30';
      }

      let status: ShiftAssignment['status'] = day === today ? 'presente' : 'programado';
      if (emp.status === 'licencia') {
        status = 'licencia';
      } else if ((idx + dIdx) % 7 === 0) {
        status = 'franco';
      } else if (day === today && (emp.id === 'emp-019' || emp.id === 'emp-043')) {
        status = 'ausente_injustificado';
      } else if (day === today && emp.id === 'emp-024') {
        status = 'ausente_justificado';
      } else if (day === today && shiftId === 'sh-noche') {
        status = 'programado';
      }

      shiftAssignments.push({
        id: `sa-${day}-${emp.id}`,
        employeeId: emp.id,
        sectorId: emp.currentSectorId,
        positionId: emp.currentPositionId,
        shiftId,
        operationalDate: day,
        startTime,
        endTime,
        status,
        notes: status === 'ausente_justificado' ? 'Certificado médico presentado en RRHH.' : undefined,
        createdAt: `${addDaysISO(day, -2)}T12:00:00Z`,
        createdBy: 'Raquel Benítez',
        updatedAt: nowIso,
        updatedBy: 'Raquel Benítez'
      });
    });
  });

  // 6. PROCEDURES & CHECKLIST TEMPLATES (7 rich templates)
  const procedures: Procedure[] = [
    {
      id: 'proc-caja-apertura',
      code: 'PRO-CAJ-01',
      title: 'Apertura de Caja y Arqueo de Fondo Fijo',
      sectorId: 'sec-caja',
      positionId: 'pos-cajero',
      frequency: 'por_turno',
      shiftType: 'mediodia',
      currentVersionId: 'pv-caja-ap-v2',
      active: true,
      createdAt: '2025-03-01T10:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'proc-camaras-frio',
      code: 'PRO-COC-02',
      title: 'Verificación de Cámaras Frigoríficas y Cadena de Frío',
      sectorId: 'sec-cocina',
      positionId: 'pos-sous-chef',
      frequency: 'por_turno',
      shiftType: 'manana',
      currentVersionId: 'pv-camaras-v3',
      active: true,
      createdAt: '2025-02-15T10:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'proc-limpieza-freezers',
      code: 'PRO-LIM-03',
      title: 'Limpieza y Sanitización de Freezers y Mesadas',
      sectorId: 'sec-limpieza',
      positionId: 'pos-bachero',
      frequency: 'diaria',
      shiftType: 'noche',
      currentVersionId: 'pv-freezers-v1',
      active: true,
      createdAt: '2025-04-10T10:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'proc-parrilla-apertura',
      code: 'PRO-PAR-01',
      title: 'Apertura de Parrilla, Encendido de Fuegos y Control de Cortes',
      sectorId: 'sec-parrilla',
      positionId: 'pos-maestro-par',
      frequency: 'por_turno',
      shiftType: 'mediodia',
      currentVersionId: 'pv-parrilla-v2',
      active: true,
      createdAt: '2025-03-20T10:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'proc-salon-apertura',
      code: 'PRO-SAL-01',
      title: 'Puesta a Punto de Salón (250 Cubiertos) y Reservas',
      sectorId: 'sec-salon',
      positionId: 'pos-sup-salon',
      frequency: 'por_turno',
      shiftType: 'mediodia',
      currentVersionId: 'pv-salon-v2',
      active: true,
      createdAt: '2025-03-25T10:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'proc-barra-stock',
      code: 'PRO-BAR-02',
      title: 'Verificación de Inventario de Barra y Cava de Vinos',
      sectorId: 'sec-barra',
      positionId: 'pos-jefe-barra',
      frequency: 'diaria',
      shiftType: 'noche',
      currentVersionId: 'pv-barra-v1',
      active: true,
      createdAt: '2025-05-01T10:00:00Z',
      updatedAt: nowIso
    },
    {
      id: 'proc-pasteleria-prod',
      code: 'PRO-PAS-01',
      title: 'Control de Producción Diaria de Pastelería y Panificación',
      sectorId: 'sec-pasteleria',
      positionId: 'pos-jefe-pas',
      frequency: 'diaria',
      shiftType: 'manana',
      currentVersionId: 'pv-pas-v1',
      active: true,
      createdAt: '2025-05-12T10:00:00Z',
      updatedAt: nowIso
    }
  ];

  const procedureVersions: ProcedureVersion[] = [
    { id: 'pv-caja-ap-v2', procedureId: 'proc-caja-apertura', versionNumber: 'v2.1', summary: 'Incorpora registro de fondo fijo en ARS, estado de POS y hora exacta de apertura.', approvedBy: 'Silvia Castañeda', approvedAt: '2026-02-01T10:00:00Z', checklistTemplateId: 'tpl-caja-ap' },
    { id: 'pv-camaras-v3', procedureId: 'proc-camaras-frio', versionNumber: 'v3.0', summary: 'Rangos térmicos estrictos para cámara de carnes, pescados y lácteos.', approvedBy: 'Gustavo Pereyra', approvedAt: '2026-01-20T10:00:00Z', checklistTemplateId: 'tpl-camaras' },
    { id: 'pv-freezers-v1', procedureId: 'proc-limpieza-freezers', versionNumber: 'v1.4', summary: 'Protocolo de descongelado superficial, desinfección y retiro de escarcha.', approvedBy: 'Norma Delgado', approvedAt: '2026-03-05T10:00:00Z', checklistTemplateId: 'tpl-freezers' },
    { id: 'pv-parrilla-v2', procedureId: 'proc-parrilla-apertura', versionNumber: 'v2.0', summary: 'Stock de quebracho, limpieza de grilla y verificación de cortes principales.', approvedBy: 'Ramón Cardozo', approvedAt: '2026-02-14T10:00:00Z', checklistTemplateId: 'tpl-parrilla' },
    { id: 'pv-salon-v2', procedureId: 'proc-salon-apertura', versionNumber: 'v2.2', summary: 'Mantelería, fajinado, sanitarios y confirmación de grupos turísticos.', approvedBy: 'Martín Duarte', approvedAt: '2026-04-02T10:00:00Z', checklistTemplateId: 'tpl-salon' },
    { id: 'pv-barra-v1', procedureId: 'proc-barra-stock', versionNumber: 'v1.2', summary: 'Control de etiquetas abiertas, temperatura de cava y stock de destilados.', approvedBy: 'Facundo Alvarez', approvedAt: '2026-03-18T10:00:00Z', checklistTemplateId: 'tpl-barra' },
    { id: 'pv-pas-v1', procedureId: 'proc-pasteleria-prod', versionNumber: 'v1.1', summary: 'Rotulado con fecha de elaboración, vencimientos y porcionado de postres.', approvedBy: 'Mónica Escobar', approvedAt: '2026-03-22T10:00:00Z', checklistTemplateId: 'tpl-pasteleria' }
  ];

  const checklistTemplates: ChecklistTemplate[] = [
    {
      id: 'tpl-caja-ap',
      procedureId: 'proc-caja-apertura',
      versionNumber: 'v2.1',
      title: 'Checklist de Apertura de Caja',
      fields: [
        { id: 'f-caj-1', label: 'Monto efectivo contado en fondo fijo (ARS)', type: 'number', required: true, unit: 'ARS', helperText: 'Registrar el importe exacto verificado físicamente.' },
        { id: 'f-caj-2', label: 'Hora exacta de apertura del turno en MaxiRest', type: 'time', required: true },
        { id: 'f-caj-3', label: 'Terminales Posnet / Mercado Pago con batería y papel térmico', type: 'checkbox', required: true },
        { id: 'f-caj-4', label: 'Estado de cambio chico en caja', type: 'select', required: true, options: ['Suficiente', 'Ajustado — requiere reposición', 'Insuficiente'] },
        { id: 'f-caj-5', label: 'Observaciones de traspaso de turno anterior', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-camaras',
      procedureId: 'proc-camaras-frio',
      versionNumber: 'v3.0',
      title: 'Control Térmico de Cámaras Frigoríficas',
      fields: [
        { id: 'f-cam-1', label: 'Temperatura Cámara 1 — Carnes', type: 'temperature', required: true, unit: '°C', minValue: 0, maxValue: 4, helperText: 'Rango óptimo: 0°C a 4°C' },
        { id: 'f-cam-2', label: 'Temperatura Cámara 2 — Pescados y Mariscos', type: 'temperature', required: true, unit: '°C', minValue: -1, maxValue: 2, helperText: 'Rango óptimo: -1°C a 2°C' },
        { id: 'f-cam-3', label: 'Temperatura Freezer de Congelados', type: 'temperature', required: true, unit: '°C', minValue: -22, maxValue: -18, helperText: 'Rango óptimo: -18°C o inferior' },
        { id: 'f-cam-4', label: 'Insumo crítico revisado por rotulado FIFO', type: 'product', required: true },
        { id: 'f-cam-5', label: 'Burletes y cierres herméticos en buen estado', type: 'checkbox', required: true },
        { id: 'f-cam-6', label: 'Observaciones o desvíos detectados', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-freezers',
      procedureId: 'proc-limpieza-freezers',
      versionNumber: 'v1.4',
      title: 'Limpieza de Freezers y Mesadas de Cocina',
      fields: [
        { id: 'f-frz-1', label: 'Limpieza de freezer de pescados completada', type: 'checkbox', required: true },
        { id: 'f-frz-2', label: 'Sanitización de mesadas de acero inoxidable', type: 'checkbox', required: true },
        { id: 'f-frz-3', label: 'Hora de finalización del saneamiento', type: 'time', required: true },
        { id: 'f-frz-4', label: 'Evidencia fotográfica / referencia de control', type: 'evidence', required: false },
        { id: 'f-frz-5', label: 'Observaciones para el turno entrante', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-parrilla',
      procedureId: 'proc-parrilla-apertura',
      versionNumber: 'v2.0',
      title: 'Apertura de Parrilla y Stock de Cortes',
      fields: [
        { id: 'f-par-1', label: 'Limpieza de hierros y grasera verificada', type: 'checkbox', required: true },
        { id: 'f-par-2', label: 'Bolsas de carbón de quebracho disponibles', type: 'number', required: true, unit: 'bolsas' },
        { id: 'f-par-3', label: 'Corte principal verificado en cámara de despacho', type: 'product', required: true },
        { id: 'f-par-4', label: 'Temperatura heladera bajo mesada parrilla', type: 'temperature', required: true, unit: '°C', minValue: 1, maxValue: 5 },
        { id: 'f-par-5', label: 'Observaciones de mise en place', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-salon',
      procedureId: 'proc-salon-apertura',
      versionNumber: 'v2.2',
      title: 'Puesta a Punto de Salón Principal y Galería',
      fields: [
        { id: 'f-sal-1', label: 'Cubiertos armados listos para servicio', type: 'number', required: true, unit: 'cubiertos' },
        { id: 'f-sal-2', label: 'Mantelería planchada y cristalería fajinada sin manchas', type: 'checkbox', required: true },
        { id: 'f-sal-3', label: 'Sanitarios de clientes revisados y provistos', type: 'checkbox', required: true },
        { id: 'f-sal-4', label: 'Estado de reservas de grupos turísticos', type: 'select', required: true, options: ['Sin grupos confirmados', '1 a 2 grupos', '3 o más grupos (alta demanda)'] },
        { id: 'f-sal-5', label: 'Observaciones de servicio', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-barra',
      procedureId: 'proc-barra-stock',
      versionNumber: 'v1.2',
      title: 'Verificación de Barra y Cava de Vinos',
      fields: [
        { id: 'f-bar-1', label: 'Temperatura de Cava de Vinos Tintos', type: 'temperature', required: true, unit: '°C', minValue: 14, maxValue: 17 },
        { id: 'f-bar-2', label: 'Botellas de Malbec Reserva disponibles en exhibición', type: 'number', required: true, unit: 'botellas' },
        { id: 'f-bar-3', label: 'Máquina de café purgada y calibrada', type: 'checkbox', required: true },
        { id: 'f-bar-4', label: 'Observaciones de faltantes', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-pasteleria',
      procedureId: 'proc-pasteleria-prod',
      versionNumber: 'v1.1',
      title: 'Producción Diaria de Pastelería',
      fields: [
        { id: 'f-pas-1', label: 'Porciones de Flan Casero producidas', type: 'number', required: true, unit: 'porciones' },
        { id: 'f-pas-2', label: 'Fecha de vencimiento rotulada en todos los lotes', type: 'checkbox', required: true },
        { id: 'f-pas-3', label: 'Fecha de control de lote', type: 'date', required: true },
        { id: 'f-pas-4', label: 'Observaciones de producción', type: 'text', required: false }
      ]
    }
  ];

  // Historical & today checklist executions (explicitly separating Asignado / Realizado / Registrado / Verificado)
  const checklistExecutions: ChecklistExecution[] = [
    {
      id: 'chk-exec-001',
      procedureId: 'proc-caja-apertura',
      procedureVersionId: 'pv-caja-ap-v2',
      checklistTemplateId: 'tpl-caja-ap',
      sectorId: 'sec-caja',
      positionId: 'pos-cajero',
      shiftId: 'sh-mediodia',
      operationalDate: today,
      assignedEmployeeId: 'emp-050',
      performedByEmployeeId: 'emp-050',
      registeredByUserId: 'emp-050',
      registeredByName: 'Mariana Lugo',
      submittedAt: `${today}T10:38:00Z`,
      verificationStatus: 'verificado',
      verifiedByUserId: 'emp-049',
      verifiedByName: 'Patricia Salinas',
      verifiedAt: `${today}T10:52:00Z`,
      answers: [
        { fieldId: 'f-caj-1', value: 185000 },
        { fieldId: 'f-caj-2', value: '10:35' },
        { fieldId: 'f-caj-3', value: true },
        { fieldId: 'f-caj-4', value: 'Suficiente' },
        { fieldId: 'f-caj-5', value: 'Fondo fijo coincide con cierre nocturno anterior.' }
      ],
      observations: 'Apertura en tiempo y forma.',
      history: [
        { id: 'ch-1', timestamp: `${today}T10:38:00Z`, actorId: 'emp-050', actorName: 'Mariana Lugo', action: 'enviado', note: 'Checklist completado y enviado a verificación.' },
        { id: 'ch-2', timestamp: `${today}T10:52:00Z`, actorId: 'emp-049', actorName: 'Patricia Salinas', action: 'verificado', note: 'Arqueo verificado conforme en caja principal.' }
      ],
      createdAt: `${today}T10:30:00Z`,
      updatedAt: `${today}T10:52:00Z`
    },
    {
      id: 'chk-exec-002',
      procedureId: 'proc-camaras-frio',
      procedureVersionId: 'pv-camaras-v3',
      checklistTemplateId: 'tpl-camaras',
      sectorId: 'sec-cocina',
      positionId: 'pos-sous-chef',
      shiftId: 'sh-manana',
      operationalDate: today,
      assignedEmployeeId: 'emp-011',
      performedByEmployeeId: 'emp-013', // Realizado por otro colaborador distinto al asignado!
      registeredByUserId: 'emp-011',
      registeredByName: 'Valeria Sosa',
      submittedAt: `${today}T08:15:00Z`,
      verificationStatus: 'enviado',
      answers: [
        { fieldId: 'f-cam-1', value: 2.4 },
        { fieldId: 'f-cam-2', value: 1.8 },
        { fieldId: 'f-cam-3', value: -19.2 },
        { fieldId: 'f-cam-4', value: 'prod-langostinos' },
        { fieldId: 'f-cam-5', value: true },
        { fieldId: 'f-cam-6', value: 'Cámara 2 estabilizada luego de reposición matutina.' }
      ],
      observations: 'Pendiente verificación de Jefe de Cocina.',
      history: [
        { id: 'ch-3', timestamp: `${today}T08:15:00Z`, actorId: 'emp-011', actorName: 'Valeria Sosa', action: 'enviado', note: 'Registrado por Valeria Sosa; medición física realizada por Camilo Báez.' }
      ],
      createdAt: `${today}T08:05:00Z`,
      updatedAt: `${today}T08:15:00Z`
    },
    {
      id: 'chk-exec-003',
      procedureId: 'proc-limpieza-freezers',
      procedureVersionId: 'pv-freezers-v1',
      checklistTemplateId: 'tpl-freezers',
      sectorId: 'sec-limpieza',
      positionId: 'pos-bachero',
      shiftId: 'sh-noche',
      operationalDate: addDaysISO(today, -1),
      assignedEmployeeId: 'emp-060',
      performedByEmployeeId: 'emp-060',
      registeredByUserId: 'emp-060',
      registeredByName: 'Oscar Barrios',
      submittedAt: `${addDaysISO(today, -1)}T23:55:00Z`,
      verificationStatus: 'observado_discrepancia',
      verifiedByUserId: 'emp-011',
      verifiedByName: 'Valeria Sosa',
      verifiedAt: `${today}T07:45:00Z`,
      answers: [
        { fieldId: 'f-frz-1', value: true },
        { fieldId: 'f-frz-2', value: true },
        { fieldId: 'f-frz-3', value: '23:50' },
        { fieldId: 'f-frz-5', value: 'Se realizó repaso general antes del cierre.' }
      ],
      observations: 'Discrepancia reportada por turno mañana al recibir el sector.',
      history: [
        { id: 'ch-4', timestamp: `${addDaysISO(today, -1)}T23:55:00Z`, actorId: 'emp-060', actorName: 'Oscar Barrios', action: 'enviado', note: 'Declaró limpieza de freezers completada.' },
        { id: 'ch-5', timestamp: `${today}T07:45:00Z`, actorId: 'emp-011', actorName: 'Valeria Sosa', action: 'discrepancia_reportada', note: 'Turno entrante detectó escarcha y restos sin retirar en freezer de pescados.' }
      ],
      createdAt: `${addDaysISO(today, -1)}T23:40:00Z`,
      updatedAt: `${today}T07:45:00Z`
    },
    {
      id: 'chk-exec-004',
      procedureId: 'proc-salon-apertura',
      procedureVersionId: 'pv-salon-v2',
      checklistTemplateId: 'tpl-salon',
      sectorId: 'sec-salon',
      positionId: 'pos-sup-salon',
      shiftId: 'sh-mediodia',
      operationalDate: today,
      assignedEmployeeId: 'emp-030',
      performedByEmployeeId: 'emp-030',
      registeredByUserId: 'emp-030',
      registeredByName: 'Carolina Núñez',
      submittedAt: `${today}T11:10:00Z`,
      verificationStatus: 'verificado',
      verifiedByUserId: 'emp-029',
      verifiedByName: 'Martín Duarte',
      verifiedAt: `${today}T11:22:00Z`,
      answers: [
        { fieldId: 'f-sal-1', value: 250 },
        { fieldId: 'f-sal-2', value: true },
        { fieldId: 'f-sal-3', value: true },
        { fieldId: 'f-sal-4', value: '3 o más grupos (alta demanda)' },
        { fieldId: 'f-sal-5', value: 'Salón principal y galería armados al 100%.' }
      ],
      observations: 'Listo para recibir contingentes de Cataratas.',
      history: [
        { id: 'ch-6', timestamp: `${today}T11:10:00Z`, actorId: 'emp-030', actorName: 'Carolina Núñez', action: 'enviado', note: 'Armado de 250 cubiertos informado.' },
        { id: 'ch-7', timestamp: `${today}T11:22:00Z`, actorId: 'emp-029', actorName: 'Martín Duarte', action: 'verificado', note: 'Recorrida visual aprobada.' }
      ],
      createdAt: `${today}T10:50:00Z`,
      updatedAt: `${today}T11:22:00Z`
    },
    {
      id: 'chk-exec-005',
      procedureId: 'proc-parrilla-apertura',
      procedureVersionId: 'pv-parrilla-v2',
      checklistTemplateId: 'tpl-parrilla',
      sectorId: 'sec-parrilla',
      positionId: 'pos-maestro-par',
      shiftId: 'sh-mediodia',
      operationalDate: today,
      assignedEmployeeId: 'emp-020',
      performedByEmployeeId: 'emp-021',
      registeredByUserId: 'emp-020',
      registeredByName: 'Ramón Cardozo',
      submittedAt: `${today}T10:45:00Z`,
      verificationStatus: 'enviado',
      answers: [
        { fieldId: 'f-par-1', value: true },
        { fieldId: 'f-par-2', value: 14 },
        { fieldId: 'f-par-3', value: 'prod-ojo-bife' },
        { fieldId: 'f-par-4', value: 3.1 },
        { fieldId: 'f-par-5', value: 'Fuego iniciado a las 10:15.' }
      ],
      observations: 'Pendiente verificación de gerencia operativa.',
      history: [
        { id: 'ch-8', timestamp: `${today}T10:45:00Z`, actorId: 'emp-020', actorName: 'Ramón Cardozo', action: 'enviado', note: 'Registrado por Ramón Cardozo; preparación realizada por Cristian Vera.' }
      ],
      createdAt: `${today}T10:25:00Z`,
      updatedAt: `${today}T10:45:00Z`
    }
  ];

  const discrepancies: Discrepancy[] = [
    {
      id: 'disc-001',
      executionId: 'chk-exec-003',
      sectorId: 'sec-limpieza',
      fieldId: 'f-frz-1',
      disputedTaskLabel: 'Limpieza de freezer de pescados completada',
      reportedByEmployeeId: 'emp-011',
      reportedByName: 'Valeria Sosa',
      reportedAt: `${today}T07:45:00Z`,
      observation: 'Al iniciar turno mañana se constató escarcha acumulada y junta sin higienizar en freezer 2.',
      evidenceNote: 'Registro operativo verificado junto a encargada de limpieza.',
      status: 'abierta'
    },
    {
      id: 'disc-002',
      executionId: 'chk-exec-001',
      sectorId: 'sec-barra',
      disputedTaskLabel: 'Reposición de hielo y cristalería en barra norte',
      reportedByEmployeeId: 'emp-053',
      reportedByName: 'Facundo Alvarez',
      reportedAt: `${addDaysISO(today, -2)}T18:10:00Z`,
      observation: 'Faltaron 2 cajones de copas fajinadas al inicio del turno noche.',
      status: 'resuelta',
      resolution: 'Se reforzó la coordinación de traspaso entre turnos mediodía y noche sin novedad posterior.',
      verifiedByName: 'Martín Duarte',
      resolvedAt: `${addDaysISO(today, -1)}T11:30:00Z`
    }
  ];

  // 7. DIGITAL MANUALS & DOCUMENTS
  const documents: AppDocument[] = [
    {
      id: 'doc-001',
      title: 'Manual de Hospitalidad y Servicio de Salón — La Rueda 1975',
      category: 'manual_operativo',
      sectorId: 'sec-salon',
      positionId: 'pos-mozo',
      procedureId: 'proc-salon-apertura',
      version: 'v3.2',
      approvalStatus: 'vigente',
      approvedBy: 'Ernesto Villalba',
      fileName: 'Manual_Hospitalidad_Salon_v3.2_DEMO.txt',
      mimeType: 'text/plain',
      sizeBytes: 1420,
      dataUrl: buildSeededDataUrl('MANUAL DE HOSPITALIDAD Y SERVICIO DE SALÓN — LA RUEDA 1975', [
        '1. Recepción cálida y multilingüe (español, portugués e inglés).',
        '2. Estándar de armado para 250 cubiertos simultáneos.',
        '3. Secuencia de toma de comanda en MaxiRest y tiempos máximos de despacho.',
        '4. Gestión de reclamos y coordinación con encargado de salón.'
      ]),
      summary: 'Guía integral de estándares de atención en mesa, tiempos de servicio y protocolo de hospitalidad.',
      allowedRoles: ['admin_vegen', 'direccion', 'gerencia_pablo', 'rrhh_raquel', 'responsable_sector', 'colaborador'],
      uploadedAt: '2026-01-15T14:00:00Z',
      uploadedBy: 'Raquel Benítez'
    },
    {
      id: 'doc-002',
      title: 'Protocolo de Cadena de Frío, Cámaras y Trazabilidad BPM',
      category: 'seguridad_higiene',
      sectorId: 'sec-cocina',
      positionId: 'pos-sous-chef',
      procedureId: 'proc-camaras-frio',
      version: 'v3.0',
      approvalStatus: 'vigente',
      approvedBy: 'Gustavo Pereyra',
      fileName: 'Protocolo_Cadena_Frio_BPM_v3.0_DEMO.txt',
      mimeType: 'text/plain',
      sizeBytes: 1280,
      dataUrl: buildSeededDataUrl('PROTOCOLO DE CADENA DE FRÍO Y BUENAS PRÁCTICAS', [
        'Cámara Carnes: 0°C a 4°C.',
        'Cámara Pescados de Río y Mariscos: -1°C a 2°C.',
        'Freezers Congelados: -18°C o inferior.',
        'Rotulado obligatorio: producto, fecha ingreso, fecha vencimiento y responsable.'
      ]),
      summary: 'Rangos térmicos obligatorios, control de vencimientos FIFO y plan de contingencia ante desvíos.',
      allowedRoles: ['admin_vegen', 'direccion', 'gerencia_pablo', 'rrhh_raquel', 'compras_rene', 'responsable_sector', 'colaborador'],
      uploadedAt: '2026-02-02T11:30:00Z',
      uploadedBy: 'Gustavo Pereyra'
    },
    {
      id: 'doc-003',
      title: 'Instructivo de Apertura, Arqueo y Cierre de Caja',
      category: 'procedimiento',
      sectorId: 'sec-caja',
      positionId: 'pos-cajero',
      procedureId: 'proc-caja-apertura',
      version: 'v2.1',
      approvalStatus: 'vigente',
      approvedBy: 'Silvia Castañeda',
      fileName: 'Instructivo_Caja_Arqueo_v2.1_DEMO.txt',
      mimeType: 'text/plain',
      sizeBytes: 1120,
      dataUrl: buildSeededDataUrl('INSTRUCTIVO DE CAJA Y ARQUEO', [
        'Conteo físico obligatorio del fondo fijo al iniciar turno.',
        'Conciliación de lote Posnet, QR y efectivo al cierre.',
        'Registro obligatorio de diferencias antes de entregar el turno.'
      ]),
      summary: 'Procedimiento de control de efectivo, conciliación de medios de pago y reporte de diferencias.',
      allowedRoles: ['admin_vegen', 'direccion', 'gerencia_pablo', 'rrhh_raquel', 'responsable_sector'],
      uploadedAt: '2026-02-10T09:15:00Z',
      uploadedBy: 'Silvia Castañeda'
    },
    {
      id: 'doc-004',
      title: 'Política Interna de Licencias, Francos y Adelantos',
      category: 'rrhh_politica',
      sectorId: 'sec-rrhh',
      version: 'v1.5',
      approvalStatus: 'vigente',
      approvedBy: 'Raquel Benítez',
      fileName: 'Politica_RRHH_Licencias_Adelantos_v1.5_DEMO.txt',
      mimeType: 'text/plain',
      sizeBytes: 1340,
      dataUrl: buildSeededDataUrl('POLÍTICA INTERNA DE RRHH — LA RUEDA 1975', [
        'Solicitud de vacaciones con al menos 15 días de anticipación.',
        'Presentación de certificados médicos dentro de las 24 hs.',
        'Adelantos semanales sujetos a autorización expresa de RRHH y Administración.'
      ]),
      summary: 'Lineamientos de solicitud de vacaciones, justificación de ausencias y política de adelantos.',
      allowedRoles: ['admin_vegen', 'direccion', 'gerencia_pablo', 'rrhh_raquel', 'responsable_sector', 'colaborador'],
      uploadedAt: '2026-03-01T16:00:00Z',
      uploadedBy: 'Raquel Benítez'
    },
    {
      id: 'doc-005',
      title: 'Guía de Compras, Verificación Física y Recepción de Proveedores',
      category: 'procedimiento',
      sectorId: 'sec-compras',
      version: 'v2.0',
      approvalStatus: 'vigente',
      approvedBy: 'Pablo Méndez',
      fileName: 'Guia_Compras_Verificacion_v2.0_DEMO.txt',
      mimeType: 'text/plain',
      sizeBytes: 1200,
      dataUrl: buildSeededDataUrl('GUÍA DE COMPRAS Y RECEPCIÓN DE MERCADERÍA', [
        'Paso 1: Solicitud digital del sector con justificación.',
        'Paso 2: Verificación física de existencia en depósito por Compras (René).',
        'Paso 3: Aprobación final por Gerencia Operativa (Pablo).',
        'Paso 4: Recepción con pesaje y control de remito.'
      ]),
      summary: 'Circuito formal de aprobación de compras sin omitir la verificación física de stock.',
      allowedRoles: ['admin_vegen', 'direccion', 'gerencia_pablo', 'compras_rene', 'responsable_sector'],
      uploadedAt: '2026-03-14T10:00:00Z',
      uploadedBy: 'Pablo Méndez'
    }
  ];

  // 8. PRODUCT CATEGORIES (10)
  const productCategories: ProductCategory[] = [
    { id: 'carnes', name: 'Carnes', defaultSectorId: 'sec-parrilla' },
    { id: 'pescados_mariscos', name: 'Pescados y mariscos', defaultSectorId: 'sec-cocina' },
    { id: 'lacteos', name: 'Lácteos', defaultSectorId: 'sec-cocina' },
    { id: 'verduras', name: 'Verduras', defaultSectorId: 'sec-cocina' },
    { id: 'mercaderia_general', name: 'Mercadería general', defaultSectorId: 'sec-deposito' },
    { id: 'limpieza', name: 'Limpieza', defaultSectorId: 'sec-limpieza' },
    { id: 'lavanderia', name: 'Lavandería', defaultSectorId: 'sec-limpieza' },
    { id: 'bebidas', name: 'Bebidas', defaultSectorId: 'sec-barra' },
    { id: 'barra', name: 'Barra', defaultSectorId: 'sec-barra' },
    { id: 'insumos_produccion', name: 'Insumos de producción', defaultSectorId: 'sec-pasteleria' }
  ];

  // 9. SUPPLIERS (7 synthetic suppliers)
  const suppliers: Supplier[] = [
    { id: 'sup-carnes', name: 'Frigorífico del Litoral (Demo)', categoryIds: ['carnes'], fictionalTaxCode: 'CUIT-DEMO-30-70001001-9', contactName: 'Carlos Aguirre (Demo)', demoPhone: '+54 9 3757 00-9001', demoEmail: 'ventas@frigorifico-demo.invalid', deliveryDays: 'Lun, Mié, Vie', leadTimeDays: 1, active: true },
    { id: 'sup-pescados', name: 'Pescadería Paraná y Atlántico (Demo)', categoryIds: ['pescados_mariscos'], fictionalTaxCode: 'CUIT-DEMO-30-70001002-7', contactName: 'Estela Benítez (Demo)', demoPhone: '+54 9 3757 00-9002', demoEmail: 'pedidos@parana-demo.invalid', deliveryDays: 'Mar, Jue, Sáb', leadTimeDays: 1, active: true },
    { id: 'sup-lacteos', name: 'Distribuidora Láctea Misiones (Demo)', categoryIds: ['lacteos', 'insumos_produccion'], fictionalTaxCode: 'CUIT-DEMO-30-70001003-5', contactName: 'Jorge Ramírez (Demo)', demoPhone: '+54 9 3757 00-9003', demoEmail: 'lacteos@misiones-demo.invalid', deliveryDays: 'Lun, Jue', leadTimeDays: 2, active: true },
    { id: 'sup-verduras', name: 'Mercado Productores Iguazú (Demo)', categoryIds: ['verduras'], fictionalTaxCode: 'CUIT-DEMO-30-70001004-3', contactName: 'Marta Silva (Demo)', demoPhone: '+54 9 3757 00-9004', demoEmail: 'huerta@iguazu-demo.invalid', deliveryDays: 'Todos los días', leadTimeDays: 1, active: true },
    { id: 'sup-almacen', name: 'Mayorista Gastronómico Selva (Demo)', categoryIds: ['mercaderia_general', 'insumos_produccion'], fictionalTaxCode: 'CUIT-DEMO-30-70001005-1', contactName: 'Sergio López (Demo)', demoPhone: '+54 9 3757 00-9005', demoEmail: 'mayorista@selva-demo.invalid', deliveryDays: 'Mar, Vie', leadTimeDays: 2, active: true },
    { id: 'sup-bebidas', name: 'Bodegas y Bebidas del Norte (Demo)', categoryIds: ['bebidas', 'barra'], fictionalTaxCode: 'CUIT-DEMO-30-70001006-8', contactName: 'Andrea Morales (Demo)', demoPhone: '+54 9 3757 00-9006', demoEmail: 'vinos@norte-demo.invalid', deliveryDays: 'Mié, Sáb', leadTimeDays: 2, active: true },
    { id: 'sup-higiene', name: 'Química Institucional Iguazú (Demo)', categoryIds: ['limpieza', 'lavanderia'], fictionalTaxCode: 'CUIT-DEMO-30-70001007-6', contactName: 'Luis Romero (Demo)', demoPhone: '+54 9 3757 00-9007', demoEmail: 'higiene@quimica-demo.invalid', deliveryDays: 'Lun, Vie', leadTimeDays: 2, active: true }
  ];

  // 10. INVENTORY LOCATIONS (6)
  const inventoryLocations: InventoryLocation[] = [
    { id: 'loc-cam-carnes', name: 'Cámara Frigorífica 1 (Carnes)', sectorId: 'sec-deposito', temperatureRange: '0°C a 4°C' },
    { id: 'loc-cam-pescados', name: 'Cámara Frigorífica 2 (Pescados y Mariscos)', sectorId: 'sec-deposito', temperatureRange: '-1°C a 2°C' },
    { id: 'loc-cam-lacteos', name: 'Cámara 3 (Lácteos y Verduras)', sectorId: 'sec-deposito', temperatureRange: '2°C a 6°C' },
    { id: 'loc-secos', name: 'Depósito de Secos y Almacén', sectorId: 'sec-deposito', temperatureRange: 'Ambiente 18°C' },
    { id: 'loc-cava', name: 'Cava de Vinos y Depósito Barra', sectorId: 'sec-barra', temperatureRange: '14°C a 16°C' },
    { id: 'loc-higiene', name: 'Pañol de Limpieza y Lavandería', sectorId: 'sec-limpieza', temperatureRange: 'Ambiente' }
  ];

  // 11. 90 INVENTORY PRODUCTS (rich realistic catalog across all 10 categories)
  const productSpecs: Array<[string, string, Product['categoryId'], string, Product['baseUnit'], string, number, number, number, number | null, string, string]> = [
    // [id, name, categoryId, subcat, baseUnit, purchaseUnit, conv, minStock, currStock, costRef, supId, locId]
    // Carnes (12)
    ['prod-ojo-bife', 'Ojo de bife novillo', 'carnes', 'Cortes Parrilla', 'kg', 'kg', 1, 35, 28, 14800, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-lomo', 'Lomo vacuno novillo', 'carnes', 'Cortes Parrilla', 'kg', 'kg', 1, 25, 32, 16900, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-bife-chorizo', 'Bife de chorizo', 'carnes', 'Cortes Parrilla', 'kg', 'kg', 1, 40, 48, 13900, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-asado-tira', 'Asado de tira centro', 'carnes', 'Cortes Parrilla', 'kg', 'kg', 1, 45, 52, 11400, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-vacio', 'Vacío novillo especial', 'carnes', 'Cortes Parrilla', 'kg', 'kg', 1, 30, 22, 12600, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-entrana', 'Entraña fina', 'carnes', 'Cortes Parrilla', 'kg', 'kg', 1, 18, 12, 15200, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-bondiola', 'Bondiola de cerdo', 'carnes', 'Cerdo', 'kg', 'kg', 1, 20, 26, 8900, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-matambrito', 'Matambrito de cerdo', 'carnes', 'Cerdo', 'kg', 'kg', 1, 15, 19, 10200, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-pollo-suprema', 'Suprema de pollo fresca', 'carnes', 'Aves', 'kg', 'kg', 1, 25, 34, 6800, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-chorizo-criollo', 'Chorizo criollo puro cerdo', 'carnes', 'Achuras', 'kg', 'kg', 1, 20, 29, 7600, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-morcilla', 'Morcilla bombón artesanal', 'carnes', 'Achuras', 'kg', 'kg', 1, 12, 16, 6900, 'sup-carnes', 'loc-cam-carnes'],
    ['prod-molleja', 'Molleja de corazón', 'carnes', 'Achuras', 'kg', 'kg', 1, 10, 7, 17400, 'sup-carnes', 'loc-cam-carnes'],
    // Pescados y mariscos (9)
    ['prod-surubi', 'Surubí de río en postas', 'pescados_mariscos', 'Pescados de Río', 'kg', 'kg', 1, 25, 29, 14200, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-dorado', 'Dorado del Paraná despinado', 'pescados_mariscos', 'Pescados de Río', 'kg', 'kg', 1, 20, 14, 15600, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-pacu', 'Pacú de criadero misionero', 'pescados_mariscos', 'Pescados de Río', 'kg', 'kg', 1, 18, 22, 12900, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-salmon', 'Salmón rosado fresco', 'pescados_mariscos', 'Pescados de Mar', 'kg', 'kg', 1, 15, 11, 24500, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-langostinos', 'Langostinos pelados IQF (Camarones)', 'pescados_mariscos', 'Mariscos', 'kg', 'kg', 1, 15, 19, 22800, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-calamar', 'Tubo de calamar limpio', 'pescados_mariscos', 'Mariscos', 'kg', 'kg', 1, 12, 15, 13400, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-mejillones', 'Mejillones media valva', 'pescados_mariscos', 'Mariscos', 'kg', 'kg', 1, 8, 10, 11800, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-trucha', 'Filet de trucha patagónica', 'pescados_mariscos', 'Pescados de Río', 'kg', 'kg', 1, 10, 12, 16200, 'sup-pescados', 'loc-cam-pescados'],
    ['prod-corte-especial-sc', 'Corte de prueba sin costo de referencia', 'carnes', 'Ensayo Cocina', 'kg', 'kg', 1, 5, 10, null, 'sup-carnes', 'loc-cam-carnes'],
    // Lácteos (10)
    ['prod-crema', 'Crema de leche doble 39%', 'lacteos', 'Cremas', 'lt', 'bidón 5lt', 5, 20, 16, 5400, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-manteca', 'Manteca calidad extra', 'lacteos', 'Grasas', 'kg', 'pan 5kg', 5, 15, 22, 8200, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-queso-azul', 'Queso azul tipo Roquefort', 'lacteos', 'Quesos', 'kg', 'horma', 1, 8, 6, 13600, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-provolone', 'Queso Provolone estacionado', 'lacteos', 'Quesos', 'kg', 'horma', 1, 14, 18, 12400, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-parmesano', 'Queso Reggianito estacionado', 'lacteos', 'Quesos', 'kg', 'horma', 1, 12, 15, 14900, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-muzzarella', 'Muzzarella hilada en barra', 'lacteos', 'Quesos', 'kg', 'barra 4kg', 4, 20, 28, 7900, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-leche', 'Leche entera larga vida', 'lacteos', 'Leches', 'lt', 'caja 12lt', 12, 36, 48, 1650, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-dulce-leche', 'Dulce de leche repostero', 'lacteos', 'Dulces', 'kg', 'pote 10kg', 10, 15, 19, 4800, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-ricota', 'Ricota fresca entera', 'lacteos', 'Quesos', 'kg', 'kg', 1, 10, 12, 5200, 'sup-lacteos', 'loc-cam-lacteos'],
    ['prod-huevos', 'Huevos frescos tamaño grande', 'lacteos', 'Granja', 'un', 'maple 30un', 30, 300, 420, 210, 'sup-lacteos', 'loc-cam-lacteos'],
    // Verduras (12)
    ['prod-papa', 'Papa negra seleccionada', 'verduras', 'Tubérculos', 'kg', 'bolsa 20kg', 20, 80, 110, 1150, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-mandioca', 'Mandioca fresca misionera', 'verduras', 'Regionales', 'kg', 'bolsa 15kg', 15, 45, 58, 1300, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-tomate', 'Tomate redondo primera', 'verduras', 'Hortalizas', 'kg', 'cajón 18kg', 18, 30, 22, 2400, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-lechuga', 'Lechuga criolla y mantecosa', 'verduras', 'Hojas', 'kg', 'jaula 8kg', 8, 16, 19, 2800, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-rucula', 'Rúcula fresca hidropónica', 'verduras', 'Hojas', 'un', 'atado', 1, 25, 18, 950, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-cebolla', 'Cebolla morada y blanca', 'verduras', 'Bulbos', 'kg', 'bolsa 18kg', 18, 40, 54, 1250, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-morron', 'Morrón rojo seleccionado', 'verduras', 'Hortalizas', 'kg', 'cajón 10kg', 10, 15, 18, 3900, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-zapallo', 'Zapallo cabutia', 'verduras', 'Hortalizas', 'kg', 'kg', 1, 25, 31, 1400, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-palmito', 'Palmitos misioneros enteros', 'verduras', 'Regionales', 'un', 'frasco 800g', 1, 24, 30, 5600, 'sup-verduras', 'loc-secos'],
    ['prod-limon', 'Limón amarillo fresco', 'verduras', 'Cítricos', 'kg', 'cajón 18kg', 18, 25, 32, 1600, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-ajo', 'Ajo colorado', 'verduras', 'Condimentos', 'kg', 'kg', 1, 6, 9, 7800, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-perejil', 'Perejil y cilantro fresco', 'verduras', 'Hierbas', 'un', 'atado', 1, 15, 20, 750, 'sup-verduras', 'loc-cam-lacteos'],
    // Mercadería general (12)
    ['prod-aceite-oliva', 'Aceite de oliva virgen extra Mendoza', 'mercaderia_general', 'Aceites', 'lt', 'bidón 5lt', 5, 25, 19, 13800, 'sup-almacen', 'loc-secos'],
    ['prod-aceite-girasol', 'Aceite de girasol alto oleico', 'mercaderia_general', 'Aceites', 'lt', 'bidón 10lt', 10, 60, 75, 2650, 'sup-almacen', 'loc-secos'],
    ['prod-harina-0000', 'Harina de trigo 0000', 'mercaderia_general', 'Harinas', 'kg', 'bolsa 25kg', 25, 50, 75, 1100, 'sup-almacen', 'loc-secos'],
    ['prod-semolin', 'Semolín para pastas artesanales', 'mercaderia_general', 'Harinas', 'kg', 'bolsa 10kg', 10, 20, 28, 1950, 'sup-almacen', 'loc-secos'],
    ['prod-arroz-carnaroli', 'Arroz Carnaroli para risotto', 'mercaderia_general', 'Granos', 'kg', 'pack 5kg', 5, 15, 22, 3400, 'sup-almacen', 'loc-secos'],
    ['prod-sal-parrillera', 'Sal entrefina parrillera', 'mercaderia_general', 'Condimentos', 'kg', 'bolsa 25kg', 25, 25, 40, 850, 'sup-almacen', 'loc-secos'],
    ['prod-pimienta', 'Pimienta negra en grano', 'mercaderia_general', 'Condimentos', 'kg', 'kg', 1, 3, 4.5, 16500, 'sup-almacen', 'loc-secos'],
    ['prod-carbon', 'Carbón de quebracho blanco', 'mercaderia_general', 'Combustible', 'un', 'bolsa 10kg', 1, 40, 26, 6200, 'sup-almacen', 'loc-secos'],
    ['prod-aceto', 'Aceto balsámico reducido', 'mercaderia_general', 'Aderezos', 'lt', 'botella 1lt', 1, 8, 12, 7400, 'sup-almacen', 'loc-secos'],
    ['prod-aceitunas', 'Aceitunas verdes descarozadas', 'mercaderia_general', 'Conservas', 'kg', 'balde 5kg', 5, 10, 14, 5900, 'sup-almacen', 'loc-secos'],
    ['prod-tomate-trit', 'Tomate pelado italiano en lata', 'mercaderia_general', 'Conservas', 'un', 'lata 2.5kg', 1, 18, 24, 6400, 'sup-almacen', 'loc-secos'],
    ['prod-alcaparras', 'Alcaparras en vinagre', 'mercaderia_general', 'Conservas', 'kg', 'frasco 1kg', 1, 3, 4, 14200, 'sup-almacen', 'loc-secos'],
    // Bebidas (10)
    ['prod-agua-sin', 'Agua mineral sin gas 500ml', 'bebidas', 'Sin Alcohol', 'bot', 'pack 12un', 12, 180, 240, 920, 'sup-bebidas', 'loc-cava'],
    ['prod-agua-con', 'Agua mineral con gas 500ml', 'bebidas', 'Sin Alcohol', 'bot', 'pack 12un', 12, 120, 156, 940, 'sup-bebidas', 'loc-cava'],
    ['prod-gaseosa-cola', 'Gaseosa línea cola vidrio 350ml', 'bebidas', 'Sin Alcohol', 'bot', 'cajón 24un', 24, 168, 144, 1180, 'sup-bebidas', 'loc-cava'],
    ['prod-gaseosa-lima', 'Gaseosa lima limón 350ml', 'bebidas', 'Sin Alcohol', 'bot', 'cajón 24un', 24, 96, 120, 1150, 'sup-bebidas', 'loc-cava'],
    ['prod-tonica', 'Agua tónica premium 200ml', 'bebidas', 'Sin Alcohol', 'bot', 'pack 24un', 24, 72, 88, 1320, 'sup-bebidas', 'loc-cava'],
    ['prod-cerveza-rubia', 'Cerveza rubia tirada barril 30lt', 'bebidas', 'Cervezas', 'lt', 'barril 30lt', 30, 90, 60, 3100, 'sup-bebidas', 'loc-cava'],
    ['prod-cerveza-ipa', 'Cerveza artesanal misionera IPA 500ml', 'bebidas', 'Cervezas', 'bot', 'caja 12un', 12, 48, 66, 2600, 'sup-bebidas', 'loc-cava'],
    ['prod-jugo-naranja', 'Jugo exprimido base naranja', 'bebidas', 'Jugos', 'lt', 'lt', 1, 20, 26, 2400, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-cafe-grano', 'Café en grano tostado italiano', 'bebidas', 'Cafetería', 'kg', 'paquete 1kg', 1, 14, 18, 28500, 'sup-bebidas', 'loc-cava'],
    ['prod-yerba-te', 'Té en hebras y yerba misionera', 'bebidas', 'Infusiones', 'un', 'caja 50un', 1, 10, 15, 6800, 'sup-almacen', 'loc-cava'],
    // Barra & Cava (10)
    ['prod-malbec-res', 'Malbec Reserva Valle de Uco 750ml', 'barra', 'Vinos Tintos', 'bot', 'caja 6un', 6, 48, 36, 11200, 'sup-bebidas', 'loc-cava'],
    ['prod-malbec-gran', 'Gran Malbec Luján de Cuyo 750ml', 'barra', 'Vinos Tintos', 'bot', 'caja 6un', 6, 24, 30, 22400, 'sup-bebidas', 'loc-cava'],
    ['prod-cabernet', 'Cabernet Franc Patagonia 750ml', 'barra', 'Vinos Tintos', 'bot', 'caja 6un', 6, 24, 28, 13800, 'sup-bebidas', 'loc-cava'],
    ['prod-torrontes', 'Torrontés Cafayate 750ml', 'barra', 'Vinos Blancos', 'bot', 'caja 6un', 6, 24, 26, 9600, 'sup-bebidas', 'loc-cava'],
    ['prod-chardonnay', 'Chardonnay Roble 750ml', 'barra', 'Vinos Blancos', 'bot', 'caja 6un', 6, 18, 22, 12100, 'sup-bebidas', 'loc-cava'],
    ['prod-espumante', 'Espumante Extra Brut Champenoise', 'barra', 'Espumantes', 'bot', 'caja 6un', 6, 24, 20, 14500, 'sup-bebidas', 'loc-cava'],
    ['prod-fernet', 'Aperitivo Fernet 750ml', 'barra', 'Aperitivos', 'bot', 'caja 6un', 6, 12, 15, 11900, 'sup-bebidas', 'loc-cava'],
    ['prod-gin', 'Gin artesanal botánicos del litoral', 'barra', 'Destilados', 'bot', 'botella 750ml', 1, 10, 13, 18200, 'sup-bebidas', 'loc-cava'],
    ['prod-aperol', 'Aperitivo bitter naranja 750ml', 'barra', 'Aperitivos', 'bot', 'caja 6un', 6, 10, 12, 12600, 'sup-bebidas', 'loc-cava'],
    ['prod-cachaca', 'Cachaça artesanal para caipirinha', 'barra', 'Destilados', 'bot', 'botella 1lt', 1, 12, 14, 10400, 'sup-bebidas', 'loc-cava'],
    // Insumos de producción (6)
    ['prod-chocolate', 'Chocolate cobertura semiamargo 70%', 'insumos_produccion', 'Pastelería', 'kg', 'bolsa 5kg', 5, 10, 8, 19800, 'sup-almacen', 'loc-secos'],
    ['prod-azucar', 'Azúcar blanca refinada', 'insumos_produccion', 'Pastelería', 'kg', 'bolsa 25kg', 25, 40, 55, 1280, 'sup-almacen', 'loc-secos'],
    ['prod-vainilla', 'Chauchas y extracto natural de vainilla', 'insumos_produccion', 'Pastelería', 'lt', 'botella 1lt', 1, 2, 3, 24000, 'sup-almacen', 'loc-secos'],
    ['prod-maracuya', 'Pulpa de maracuyá misionero', 'insumos_produccion', 'Pastelería', 'kg', 'pack 2kg', 2, 12, 15, 7400, 'sup-verduras', 'loc-cam-lacteos'],
    ['prod-frutos-rojos', 'Mix de frutos rojos congelados', 'insumos_produccion', 'Pastelería', 'kg', 'bolsa 2.5kg', 2.5, 10, 13, 9800, 'sup-verduras', 'loc-cam-pescados'],
    ['prod-film', 'Film adherente gastronómico 45cm', 'insumos_produccion', 'Descartables', 'un', 'rollo 600m', 1, 6, 9, 14200, 'sup-almacen', 'loc-secos'],
    // Limpieza (5)
    ['prod-detergente', 'Detergente concentrado vajilla', 'limpieza', 'Cocina', 'lt', 'bidón 20lt', 20, 40, 32, 1850, 'sup-higiene', 'loc-higiene'],
    ['prod-desengrasante', 'Desengrasante alcalino parrillas', 'limpieza', 'Cocina', 'lt', 'bidón 10lt', 10, 20, 25, 2400, 'sup-higiene', 'loc-higiene'],
    ['prod-lavandina', 'Hipoclorito de sodio certificado', 'limpieza', 'Saneamiento', 'lt', 'bidón 10lt', 10, 30, 38, 980, 'sup-higiene', 'loc-higiene'],
    ['prod-sanitizante', 'Amonio cuaternario grado alimenticio', 'limpieza', 'Saneamiento', 'lt', 'bidón 5lt', 5, 15, 19, 3600, 'sup-higiene', 'loc-higiene'],
    ['prod-papel-hig', 'Papel higiénico institucional bobina', 'limpieza', 'Salón', 'un', 'pack 8un', 8, 24, 30, 1950, 'sup-higiene', 'loc-higiene'],
    // Lavandería (4)
    ['prod-jabon-ropa', 'Jabón líquido industrial mantelería', 'lavanderia', 'Lavado', 'lt', 'bidón 20lt', 20, 40, 28, 2200, 'sup-higiene', 'loc-higiene'],
    ['prod-quitamanchas', 'Quitamanchas enzimático vino tinto', 'lavanderia', 'Tratamiento', 'lt', 'bidón 5lt', 5, 10, 14, 4900, 'sup-higiene', 'loc-higiene'],
    ['prod-suavizante', 'Suavizante textil neutro', 'lavanderia', 'Lavado', 'lt', 'bidón 20lt', 20, 20, 26, 1650, 'sup-higiene', 'loc-higiene'],
    ['prod-apresto', 'Apresto para servilletas y manteles', 'lavanderia', 'Planchado', 'lt', 'bidón 5lt', 5, 10, 12, 3100, 'sup-higiene', 'loc-higiene']
  ];

  const products: Product[] = productSpecs.map((p, idx) => ({
    id: p[0],
    sku: `LR-${String(101 + idx)}`,
    name: p[1],
    categoryId: p[2],
    subcategory: p[3],
    baseUnit: p[4],
    purchaseUnit: p[5],
    conversionFactor: p[6],
    minStock: p[7],
    currentStock: p[8],
    costReferenceArs: p[9],
    supplierId: p[10],
    locationId: p[11],
    active: true,
    updatedAt: nowIso
  }));

  // 12. PURCHASE REQUESTS (5 requests in distinct states)
  const purchaseRequests: PurchaseRequest[] = [
    {
      id: 'pr-001',
      code: 'SC-2026-0141',
      sectorId: 'sec-parrilla',
      requestedByEmployeeId: 'emp-020',
      requestedByName: 'Ramón Cardozo',
      operationalDate: today,
      neededByDate: addDaysISO(today, 1),
      priority: 'alta',
      status: 'pendiente_aprobacion',
      observations: 'Refuerzo de cortes vacunos para fin de semana largo y contingentes confirmados.',
      lines: [
        {
          id: 'prl-001-a',
          productId: 'prod-ojo-bife',
          unit: 'kg',
          requestedQty: 45,
          systemStockAtRequest: 28,
          physicalVerifiedStock: 26,
          verifiedQty: 40,
          referenceUnitPriceArs: 14800,
          supplierId: 'sup-carnes',
          justification: 'Stock físico verificado en Cámara 1: 26 kg. Se ajusta a 40 kg según proyección.'
        },
        {
          id: 'prl-001-b',
          productId: 'prod-vacio',
          unit: 'kg',
          requestedQty: 30,
          systemStockAtRequest: 22,
          physicalVerifiedStock: 22,
          verifiedQty: 25,
          referenceUnitPriceArs: 12600,
          supplierId: 'sup-carnes',
          justification: 'Stock confirmado en cámara; 25 kg cubren 4 días de servicio.'
        },
        {
          id: 'prl-001-c',
          productId: 'prod-carbon',
          unit: 'un',
          requestedQty: 40,
          systemStockAtRequest: 26,
          physicalVerifiedStock: 24,
          verifiedQty: 35,
          referenceUnitPriceArs: 6200,
          supplierId: 'sup-almacen',
          justification: 'Quedan 24 bolsas utilizables en depósito.'
        }
      ],
      transitions: [
        { id: 'tr-1', fromStatus: null, toStatus: 'solicitado', actorId: 'emp-020', actorName: 'Ramón Cardozo', actorRole: 'Maestro Parrillero', timestamp: `${today}T08:20:00Z`, notes: 'Pedido generado desde sector Parrilla.' },
        { id: 'tr-2', fromStatus: 'solicitado', toStatus: 'en_verificacion', actorId: 'emp-006', actorName: 'René Giménez', actorRole: 'Compras — René', timestamp: `${today}T09:05:00Z`, notes: 'Iniciada verificación física en Cámara 1 y depósito.' },
        { id: 'tr-3', fromStatus: 'en_verificacion', toStatus: 'pendiente_aprobacion', actorId: 'emp-006', actorName: 'René Giménez', actorRole: 'Compras — René', timestamp: `${today}T09:42:00Z`, notes: 'Cantidades ajustadas tras conteo físico. Elevado a Pablo Méndez.' }
      ],
      createdAt: `${today}T08:20:00Z`,
      updatedAt: `${today}T09:42:00Z`
    },
    {
      id: 'pr-002',
      code: 'SC-2026-0142',
      sectorId: 'sec-cocina',
      requestedByEmployeeId: 'emp-010',
      requestedByName: 'Gustavo Pereyra',
      operationalDate: today,
      neededByDate: addDaysISO(today, 1),
      priority: 'urgente',
      status: 'solicitado',
      observations: 'Reposición de pescados de río, crema y queso azul bajo stock mínimo.',
      lines: [
        { id: 'prl-002-a', productId: 'prod-dorado', unit: 'kg', requestedQty: 22, systemStockAtRequest: 14, referenceUnitPriceArs: 15600, supplierId: 'sup-pescados' },
        { id: 'prl-002-b', productId: 'prod-salmon', unit: 'kg', requestedQty: 14, systemStockAtRequest: 11, referenceUnitPriceArs: 24500, supplierId: 'sup-pescados' },
        { id: 'prl-002-c', productId: 'prod-crema', unit: 'lt', requestedQty: 25, systemStockAtRequest: 16, referenceUnitPriceArs: 5400, supplierId: 'sup-lacteos' },
        { id: 'prl-002-d', productId: 'prod-queso-azul', unit: 'kg', requestedQty: 8, systemStockAtRequest: 6, referenceUnitPriceArs: 13600, supplierId: 'sup-lacteos' }
      ],
      transitions: [
        { id: 'tr-4', fromStatus: null, toStatus: 'solicitado', actorId: 'emp-010', actorName: 'Gustavo Pereyra', actorRole: 'Jefe de Cocina', timestamp: `${today}T10:15:00Z`, notes: 'Requiere verificación física urgente por alta salida de Surubí y Dorado.' }
      ],
      createdAt: `${today}T10:15:00Z`,
      updatedAt: `${today}T10:15:00Z`
    },
    {
      id: 'pr-003',
      code: 'SC-2026-0139',
      sectorId: 'sec-barra',
      requestedByEmployeeId: 'emp-053',
      requestedByName: 'Facundo Alvarez',
      operationalDate: addDaysISO(today, -1),
      neededByDate: today,
      priority: 'normal',
      status: 'enviado',
      observations: 'Reposición semanal de cava Malbec Reserva y barriles de cerveza.',
      lines: [
        { id: 'prl-003-a', productId: 'prod-malbec-res', unit: 'bot', requestedQty: 36, systemStockAtRequest: 36, physicalVerifiedStock: 34, verifiedQty: 36, approvedQty: 36, referenceUnitPriceArs: 11200, supplierId: 'sup-bebidas' },
        { id: 'prl-003-b', productId: 'prod-cerveza-rubia', unit: 'lt', requestedQty: 90, systemStockAtRequest: 60, physicalVerifiedStock: 60, verifiedQty: 90, approvedQty: 60, referenceUnitPriceArs: 3100, supplierId: 'sup-bebidas', justification: 'Aprobados 2 barriles (60 lt) por espacio en cámara.' }
      ],
      transitions: [
        { id: 'tr-5', fromStatus: null, toStatus: 'solicitado', actorId: 'emp-053', actorName: 'Facundo Alvarez', actorRole: 'Jefe de Barra', timestamp: `${addDaysISO(today, -1)}T11:00:00Z` },
        { id: 'tr-6', fromStatus: 'solicitado', toStatus: 'pendiente_aprobacion', actorId: 'emp-006', actorName: 'René Giménez', actorRole: 'Compras — René', timestamp: `${addDaysISO(today, -1)}T13:15:00Z`, notes: 'Stock verificado en cava.' },
        { id: 'tr-7', fromStatus: 'pendiente_aprobacion', toStatus: 'aprobado', actorId: 'emp-002', actorName: 'Pablo Méndez', actorRole: 'Gerencia operativa — Pablo', timestamp: `${addDaysISO(today, -1)}T15:30:00Z`, notes: 'Aprobado con ajuste de barriles a 60 lt.' },
        { id: 'tr-8', fromStatus: 'aprobado', toStatus: 'enviado', actorId: 'emp-006', actorName: 'René Giménez', actorRole: 'Compras — René', timestamp: `${addDaysISO(today, -1)}T16:05:00Z`, notes: 'Orden OC-2026-0083 emitida a Bodegas y Bebidas del Norte.' }
      ],
      createdAt: `${addDaysISO(today, -1)}T11:00:00Z`,
      updatedAt: `${addDaysISO(today, -1)}T16:05:00Z`
    },
    {
      id: 'pr-004',
      code: 'SC-2026-0136',
      sectorId: 'sec-limpieza',
      requestedByEmployeeId: 'emp-058',
      requestedByName: 'Norma Delgado',
      operationalDate: addDaysISO(today, -3),
      neededByDate: addDaysISO(today, -1),
      priority: 'normal',
      status: 'cerrado',
      observations: 'Reposición quincenal de detergente y jabón de lavandería.',
      lines: [
        { id: 'prl-004-a', productId: 'prod-detergente', unit: 'lt', requestedQty: 40, systemStockAtRequest: 12, physicalVerifiedStock: 12, verifiedQty: 40, approvedQty: 40, receivedQty: 40, referenceUnitPriceArs: 1850, supplierId: 'sup-higiene' },
        { id: 'prl-004-b', productId: 'prod-jabon-ropa', unit: 'lt', requestedQty: 40, systemStockAtRequest: 8, physicalVerifiedStock: 8, verifiedQty: 40, approvedQty: 40, receivedQty: 40, referenceUnitPriceArs: 2200, supplierId: 'sup-higiene' }
      ],
      transitions: [
        { id: 'tr-9', fromStatus: null, toStatus: 'solicitado', actorId: 'emp-058', actorName: 'Norma Delgado', actorRole: 'Encargada de Limpieza', timestamp: `${addDaysISO(today, -3)}T09:00:00Z` },
        { id: 'tr-10', fromStatus: 'solicitado', toStatus: 'aprobado', actorId: 'emp-002', actorName: 'Pablo Méndez', actorRole: 'Gerencia operativa — Pablo', timestamp: `${addDaysISO(today, -3)}T14:20:00Z` },
        { id: 'tr-11', fromStatus: 'aprobado', toStatus: 'cerrado', actorId: 'emp-007', actorName: 'Héctor Almirón', actorRole: 'Encargado de Depósito', timestamp: `${addDaysISO(today, -1)}T10:15:00Z`, notes: 'Recepción completa sin diferencias.' }
      ],
      createdAt: `${addDaysISO(today, -3)}T09:00:00Z`,
      updatedAt: `${addDaysISO(today, -1)}T10:15:00Z`
    }
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-001',
      orderNumber: 'OC-2026-0083',
      purchaseRequestId: 'pr-003',
      purchaseRequestCode: 'SC-2026-0139',
      supplierId: 'sup-bebidas',
      issueDate: addDaysISO(today, -1),
      deliveryInfo: 'Depósito La Rueda 1975 — Av. Córdoba 28, Puerto Iguazú (08:00 a 12:00 hs)',
      authorizedByName: 'Pablo Méndez',
      status: 'enviada',
      lines: [
        { id: 'pol-1', requestLineId: 'prl-003-a', productId: 'prod-malbec-res', productName: 'Malbec Reserva Valle de Uco 750ml', unit: 'bot', approvedQty: 36, receivedQty: 0, referenceUnitPriceArs: 11200 },
        { id: 'pol-2', requestLineId: 'prl-003-b', productId: 'prod-cerveza-rubia', productName: 'Cerveza rubia tirada barril 30lt', unit: 'lt', approvedQty: 60, receivedQty: 0, referenceUnitPriceArs: 3100 }
      ],
      notes: 'Entregar con remito valorizado y lote legible.',
      createdAt: `${addDaysISO(today, -1)}T16:05:00Z`,
      updatedAt: `${addDaysISO(today, -1)}T16:05:00Z`
    },
    {
      id: 'po-002',
      orderNumber: 'OC-2026-0081',
      purchaseRequestId: 'pr-004',
      purchaseRequestCode: 'SC-2026-0136',
      supplierId: 'sup-higiene',
      issueDate: addDaysISO(today, -3),
      deliveryInfo: 'Depósito La Rueda 1975 — Acceso Proveedores',
      authorizedByName: 'Pablo Méndez',
      status: 'cerrada',
      lines: [
        { id: 'pol-3', requestLineId: 'prl-004-a', productId: 'prod-detergente', productName: 'Detergente concentrado vajilla', unit: 'lt', approvedQty: 40, receivedQty: 40, referenceUnitPriceArs: 1850 },
        { id: 'pol-4', requestLineId: 'prl-004-b', productId: 'prod-jabon-ropa', productName: 'Jabón líquido industrial mantelería', unit: 'lt', approvedQty: 40, receivedQty: 40, referenceUnitPriceArs: 2200 }
      ],
      createdAt: `${addDaysISO(today, -3)}T15:00:00Z`,
      updatedAt: `${addDaysISO(today, -1)}T10:15:00Z`
    }
  ];

  const goodsReceipts: GoodsReceipt[] = [
    {
      id: 'gr-001',
      purchaseOrderId: 'po-002',
      purchaseRequestId: 'pr-004',
      receivedDate: addDaysISO(today, -1),
      receivedByName: 'Héctor Almirón',
      isPartial: false,
      lines: [
        { productId: 'prod-detergente', orderedQty: 40, receivedQty: 40, inventoryMovementId: 'mov-001' },
        { productId: 'prod-jabon-ropa', orderedQty: 40, receivedQty: 40, inventoryMovementId: 'mov-002' }
      ],
      createdAt: `${addDaysISO(today, -1)}T10:15:00Z`
    }
  ];

  // 13. INVENTORY MOVEMENTS & LOSS EVENTS (strictly separated Merma vs Desperdicio, 1:1 movement link)
  const inventoryMovements: InventoryMovement[] = [
    {
      id: 'mov-001',
      productId: 'prod-detergente',
      type: 'entrada_compra',
      quantityDelta: 40,
      unit: 'lt',
      previousStock: 12,
      newStock: 52,
      locationId: 'loc-higiene',
      sectorId: 'sec-limpieza',
      originReferenceType: 'purchase_order',
      originReferenceId: 'po-002',
      operationalDate: addDaysISO(today, -1),
      notes: 'Recepción OC-2026-0081 sin diferencias.',
      createdBy: 'Héctor Almirón',
      createdAt: `${addDaysISO(today, -1)}T10:15:00Z`
    },
    {
      id: 'mov-002',
      productId: 'prod-jabon-ropa',
      type: 'entrada_compra',
      quantityDelta: 40,
      unit: 'lt',
      previousStock: 8,
      newStock: 48,
      locationId: 'loc-higiene',
      sectorId: 'sec-limpieza',
      originReferenceType: 'purchase_order',
      originReferenceId: 'po-002',
      operationalDate: addDaysISO(today, -1),
      notes: 'Recepción OC-2026-0081.',
      createdBy: 'Héctor Almirón',
      createdAt: `${addDaysISO(today, -1)}T10:15:00Z`
    },
    {
      id: 'mov-003',
      productId: 'prod-lomo',
      type: 'merma_proceso',
      quantityDelta: -1.8,
      unit: 'kg',
      previousStock: 33.8,
      newStock: 32,
      locationId: 'loc-cam-carnes',
      sectorId: 'sec-parrilla',
      originReferenceType: 'loss_event',
      originReferenceId: 'loss-001',
      operationalDate: addDaysISO(today, -1),
      notes: 'Merma normal por limpieza de cordón y grasa en desposte de lomo (12 kg bruto → 10,2 kg neto).',
      createdBy: 'Ramón Cardozo',
      createdAt: `${addDaysISO(today, -1)}T11:20:00Z`
    },
    {
      id: 'mov-004',
      productId: 'prod-tomate',
      type: 'baja_desperdicio',
      quantityDelta: -3.5,
      unit: 'kg',
      previousStock: 25.5,
      newStock: 22,
      locationId: 'loc-cam-lacteos',
      sectorId: 'sec-cocina',
      originReferenceType: 'loss_event',
      originReferenceId: 'loss-002',
      operationalDate: addDaysISO(today, -2),
      notes: 'Baja por maduración excesiva en cajón de cámara 3.',
      createdBy: 'Valeria Sosa',
      createdAt: `${addDaysISO(today, -2)}T09:10:00Z`
    },
    {
      id: 'mov-005',
      productId: 'prod-surubi',
      type: 'merma_proceso',
      quantityDelta: -2.1,
      unit: 'kg',
      previousStock: 31.1,
      newStock: 29,
      locationId: 'loc-cam-pescados',
      sectorId: 'sec-cocina',
      originReferenceType: 'loss_event',
      originReferenceId: 'loss-003',
      operationalDate: today,
      notes: 'Merma de limpieza y porcionado de postas de surubí (14 kg bruto → 11,9 kg aprovechable).',
      createdBy: 'Camilo Báez',
      createdAt: `${today}T09:30:00Z`
    },
    {
      id: 'mov-006',
      productId: 'prod-ojo-bife',
      type: 'salida_consumo',
      quantityDelta: -18,
      unit: 'kg',
      previousStock: 46,
      newStock: 28,
      locationId: 'loc-cam-carnes',
      sectorId: 'sec-parrilla',
      originReferenceType: 'manual',
      operationalDate: addDaysISO(today, -1),
      notes: 'Retiro programado para despacho mediodía y noche.',
      createdBy: 'Héctor Almirón',
      createdAt: `${addDaysISO(today, -1)}T10:00:00Z`
    },
    {
      id: 'mov-007',
      productId: 'prod-crema',
      type: 'baja_desperdicio',
      quantityDelta: -2,
      unit: 'lt',
      previousStock: 18,
      newStock: 16,
      locationId: 'loc-cam-lacteos',
      sectorId: 'sec-pasteleria',
      originReferenceType: 'loss_event',
      originReferenceId: 'loss-004',
      operationalDate: addDaysISO(today, -3),
      notes: 'Bidón abierto fuera de fecha de uso en heladera de pastelería.',
      createdBy: 'Mónica Escobar',
      createdAt: `${addDaysISO(today, -3)}T14:25:00Z`
    }
  ];

  const lossEvents: LossEvent[] = [
    {
      id: 'loss-001',
      productId: 'prod-lomo',
      type: 'merma',
      grossInputQty: 12,
      usableOutputQty: 10.2,
      lossQty: 1.8,
      lossPercentage: 15,
      yieldPercentage: 85,
      unit: 'kg',
      reason: 'limpieza_desposte_proceso',
      sectorId: 'sec-parrilla',
      operationalDate: addDaysISO(today, -1),
      registeredByUserId: 'emp-020',
      registeredByName: 'Ramón Cardozo',
      reportedByEmployeeId: 'emp-021',
      reportedByName: 'Cristian Vera',
      costReferenceArs: 16900,
      estimatedImpactArs: 30420,
      linkedInventoryMovementId: 'mov-003',
      notes: 'Rendimiento dentro del estándar histórico de limpieza de lomo (85%).',
      createdAt: `${addDaysISO(today, -1)}T11:20:00Z`
    },
    {
      id: 'loss-002',
      productId: 'prod-tomate',
      type: 'desperdicio',
      lossQty: 3.5,
      unit: 'kg',
      reason: 'descomposicion',
      sectorId: 'sec-cocina',
      operationalDate: addDaysISO(today, -2),
      registeredByUserId: 'emp-011',
      registeredByName: 'Valeria Sosa',
      reportedByEmployeeId: 'emp-018',
      reportedByName: 'Yamila Acosta',
      costReferenceArs: 2400,
      estimatedImpactArs: 8400,
      linkedInventoryMovementId: 'mov-004',
      notes: 'Cajón recibido con excesiva maduración no rotado a tiempo.',
      createdAt: `${addDaysISO(today, -2)}T09:10:00Z`
    },
    {
      id: 'loss-003',
      productId: 'prod-surubi',
      type: 'merma',
      grossInputQty: 14,
      usableOutputQty: 11.9,
      lossQty: 2.1,
      lossPercentage: 15,
      yieldPercentage: 85,
      unit: 'kg',
      reason: 'limpieza_desposte_proceso',
      sectorId: 'sec-cocina',
      operationalDate: today,
      registeredByUserId: 'emp-013',
      registeredByName: 'Camilo Báez',
      reportedByEmployeeId: 'emp-013',
      reportedByName: 'Camilo Báez',
      costReferenceArs: 14200,
      estimatedImpactArs: 29820,
      linkedInventoryMovementId: 'mov-005',
      notes: 'Limpieza de piel y espinas para servicio de mediodía.',
      createdAt: `${today}T09:30:00Z`
    },
    {
      id: 'loss-004',
      productId: 'prod-crema',
      type: 'desperdicio',
      lossQty: 2,
      unit: 'lt',
      reason: 'vencimiento',
      sectorId: 'sec-pasteleria',
      operationalDate: addDaysISO(today, -3),
      registeredByUserId: 'emp-025',
      registeredByName: 'Mónica Escobar',
      reportedByEmployeeId: 'emp-026',
      reportedByName: 'Florencia Medina',
      costReferenceArs: 5400,
      estimatedImpactArs: 10800,
      linkedInventoryMovementId: 'mov-007',
      notes: 'Se refuerza control FIFO en heladera de producción.',
      createdAt: `${addDaysISO(today, -3)}T14:25:00Z`
    },
    {
      id: 'loss-005',
      productId: 'prod-ojo-bife',
      type: 'desperdicio',
      lossQty: 0.9,
      unit: 'kg',
      reason: 'plato_devuelto',
      sectorId: 'sec-salon',
      operationalDate: addDaysISO(today, -4),
      registeredByUserId: 'emp-029',
      registeredByName: 'Martín Duarte',
      reportedByEmployeeId: 'emp-035',
      reportedByName: 'Julieta Aguirre',
      costReferenceArs: 14800,
      estimatedImpactArs: 13320,
      notes: '2 platos devueltos por punto de cocción no coincidente con comanda.',
      createdAt: `${addDaysISO(today, -4)}T21:40:00Z`
    }
  ];

  // 14. MENU ITEMS (16 items for Menu Engineering — including 2 with null cost -> "Datos insuficientes")
  const menuItems: MenuItem[] = [
    { id: 'menu-01', code: 'PAR-01', name: 'Ojo de Bife a las Brasas (450g)', category: 'Parrilla', sectorId: 'sec-parrilla', sellingPriceArs: 34500, recipeCostArs: 9800, costReliability: 'verificado', active: true },
    { id: 'menu-02', code: 'PAR-02', name: 'Bife de Chorizo La Rueda (420g)', category: 'Parrilla', sectorId: 'sec-parrilla', sellingPriceArs: 32900, recipeCostArs: 9100, costReliability: 'verificado', active: true },
    { id: 'menu-03', code: 'PAR-03', name: 'Parrillada Tradicional (2 personas)', category: 'Parrilla', sectorId: 'sec-parrilla', sellingPriceArs: 58000, recipeCostArs: 23500, costReliability: 'verificado', active: true },
    { id: 'menu-04', code: 'PES-01', name: 'Surubí del Paraná al Roquefort', category: 'Pescados de Río', sectorId: 'sec-cocina', sellingPriceArs: 36800, recipeCostArs: 10900, costReliability: 'verificado', active: true },
    { id: 'menu-05', code: 'PES-02', name: 'Dorado Grillado a la Manteca Negra', category: 'Pescados de Río', sectorId: 'sec-cocina', sellingPriceArs: 38200, recipeCostArs: 11200, costReliability: 'verificado', active: true },
    { id: 'menu-06', code: 'PES-03', name: 'Pacú Despinado con Mandioca Frita', category: 'Pescados de Río', sectorId: 'sec-cocina', sellingPriceArs: 35400, recipeCostArs: 9400, costReliability: 'estimado', active: true },
    { id: 'menu-07', code: 'ENT-01', name: 'Empanadas Cortadas a Cuchillo (2 un)', category: 'Entradas', sectorId: 'sec-cocina', sellingPriceArs: 9800, recipeCostArs: 3900, costReliability: 'verificado', active: true },
    { id: 'menu-08', code: 'ENT-02', name: 'Provoleta de la Casa con Orégano Fresco', category: 'Entradas', sectorId: 'sec-parrilla', sellingPriceArs: 15200, recipeCostArs: 5400, costReliability: 'verificado', active: true },
    { id: 'menu-09', code: 'ENT-03', name: 'Ensalada de Palmitos Misioneros y Palta', category: 'Entradas', sectorId: 'sec-cocina', sellingPriceArs: 16900, recipeCostArs: 6900, costReliability: 'estimado', active: true },
    { id: 'menu-10', code: 'PAS-01', name: 'Sorrentinos Caseros de Jamón y Muzzarella', category: 'Pastas y Cocina', sectorId: 'sec-cocina', sellingPriceArs: 24500, recipeCostArs: 7200, costReliability: 'verificado', active: true },
    { id: 'menu-11', code: 'PAS-02', name: 'Risotto de Hongos de Pino y Langostinos', category: 'Pastas y Cocina', sectorId: 'sec-cocina', sellingPriceArs: 33900, recipeCostArs: 14600, costReliability: 'estimado', active: true },
    { id: 'menu-12', code: 'POS-01', name: 'Flan Casero Mixto con Dulce de Leche', category: 'Postres', sectorId: 'sec-pasteleria', sellingPriceArs: 10500, recipeCostArs: 2800, costReliability: 'verificado', active: true },
    { id: 'menu-13', code: 'POS-02', name: 'Mousse de Maracuyá Misionero', category: 'Postres', sectorId: 'sec-pasteleria', sellingPriceArs: 11800, recipeCostArs: 3200, costReliability: 'verificado', active: true },
    { id: 'menu-14', code: 'VIN-01', name: 'Malbec Reserva Valle de Uco (Botella)', category: 'Vinos y Barra', sectorId: 'sec-barra', sellingPriceArs: 31500, recipeCostArs: 11200, costReliability: 'verificado', active: true },
    { id: 'menu-15', code: 'COC-99', name: 'Sugerencia del Chef — Pesca del Día', category: 'Pescados de Río', sectorId: 'sec-cocina', sellingPriceArs: 39500, recipeCostArs: null, costReliability: 'sin_datos', active: true },
    { id: 'menu-16', code: 'BAR-99', name: 'Cóctel de Autor Selva Misionera', category: 'Vinos y Barra', sectorId: 'sec-barra', sellingPriceArs: 13200, recipeCostArs: null, costReliability: 'sin_datos', active: true }
  ];

  // 15. 30 DAYS OF COHERENT SALES (derived from MenuItems so all KPIs & charts match!)
  const sales: Sale[] = [];
  const baseWeights: Record<string, number> = {
    'menu-01': 26, // Estrella
    'menu-02': 24, // Estrella
    'menu-03': 9,  // Rompecabezas (high margin, lower units)
    'menu-04': 22, // Estrella
    'menu-05': 11, // Rompecabezas
    'menu-06': 10, // Rompecabezas
    'menu-07': 42, // Caballo de batalla (high units, lower margin)
    'menu-08': 28, // Caballo de batalla
    'menu-09': 8,  // Perro
    'menu-10': 25, // Caballo de batalla
    'menu-11': 7,  // Perro
    'menu-12': 31, // Caballo de batalla
    'menu-13': 12, // Perro
    'menu-14': 27, // Estrella
    'menu-15': 6,  // Datos insuficientes
    'menu-16': 14  // Datos insuficientes
  };

  for (let d = 29; d >= 0; d--) {
    const opDate = addDaysISO(today, -d);
    const dayOfWeek = new Date(`${opDate}T12:00:00Z`).getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const multiplier = isWeekend ? 1.28 : 0.88 + ((d * 7) % 19) * 0.012;

    (['mediodia', 'noche'] as const).forEach((shiftType) => {
      const shiftFactor = shiftType === 'noche' ? 0.62 : 0.38;
      const lines = menuItems.map((item, iIdx) => {
        const rawQty = (baseWeights[item.id] ?? 10) * multiplier * shiftFactor;
        const jitter = ((d + iIdx * 3) % 5) - 2;
        const qty = Math.max(1, Math.round(rawQty + jitter * 0.4));
        return {
          menuItemId: item.id,
          quantity: qty,
          unitPriceArs: item.sellingPriceArs,
          lineTotalArs: qty * item.sellingPriceArs
        };
      });
      const totalRevenueArs = lines.reduce((acc, l) => acc + l.lineTotalArs, 0);
      const mainCovers = lines
        .filter((l) => ['menu-01', 'menu-02', 'menu-03', 'menu-04', 'menu-05', 'menu-06', 'menu-10', 'menu-11', 'menu-15'].includes(l.menuItemId))
        .reduce((acc, l) => acc + (l.menuItemId === 'menu-03' ? l.quantity * 2 : l.quantity), 0);
      const guestsCount = Math.min(245, Math.max(45, Math.round(mainCovers * 1.06)));
      const ticketsCount = Math.max(18, Math.round(guestsCount / 2.75));

      sales.push({
        id: `sale-${opDate}-${shiftType}`,
        operationalDate: opDate,
        shiftType,
        ticketsCount,
        guestsCount,
        coversSold: mainCovers,
        totalRevenueArs,
        lines,
        source: d > 7 ? 'import_maxirest' : 'demo_seed',
        fingerprint: `seed-${opDate}-${shiftType}`
      });
    });
  }

  // 16. EXPENSES
  const expenses: Expense[] = [
    { id: 'exp-001', operationalDate: addDaysISO(today, -2), category: 'Mercadería — Carnes', supplierName: 'Frigorífico del Litoral (Demo)', description: 'Reposición semanal cortes parrilla', amountArs: 3280000, source: 'import_holistor' },
    { id: 'exp-002', operationalDate: addDaysISO(today, -3), category: 'Mercadería — Pescados', supplierName: 'Pescadería Paraná y Atlántico (Demo)', description: 'Surubí, dorado y langostinos', amountArs: 1640000, source: 'import_holistor' },
    { id: 'exp-003', operationalDate: addDaysISO(today, -4), category: 'Bebidas y Cava', supplierName: 'Bodegas y Bebidas del Norte (Demo)', description: 'Reposición cava Malbec y gaseosas', amountArs: 1890000, source: 'import_holistor' },
    { id: 'exp-004', operationalDate: addDaysISO(today, -5), category: 'Verdulería y Lácteos', supplierName: 'Mercado Productores Iguazú (Demo)', description: 'Frutas, verduras frescas y quesos', amountArs: 1120000, source: 'demo_seed' },
    { id: 'exp-005', operationalDate: addDaysISO(today, -6), category: 'Servicios y Mantenimiento', supplierName: 'Energía y Gas Misiones (Demo)', description: 'Consumo mensual estimado cámaras y cocina', amountArs: 980000, source: 'import_holistor' },
    { id: 'exp-006', operationalDate: addDaysISO(today, -1), category: 'Limpieza y Lavandería', supplierName: 'Química Institucional Iguazú (Demo)', description: 'OC-2026-0081 insumos saneamiento', amountArs: 162000, source: 'demo_seed' }
  ];

  // 17. ATTENDANCE EVENTS, LEAVE REQUESTS, VACATION BALANCES, PERFORMANCE, DISCIPLINARY, TRAININGS, LOANS, PAYROLL
  const attendanceEvents: AttendanceEvent[] = [
    { id: 'att-001', employeeId: 'emp-019', sectorId: 'sec-cocina', shiftAssignmentId: `sa-${today}-emp-019`, operationalDate: today, eventType: 'ausencia_injustificada', justified: false, notes: 'No se presentó al turno mañana sin aviso previo.', occurredAt: `${today}T07:30:00Z`, registeredAt: `${today}T08:10:00Z`, registeredBy: 'Valeria Sosa', status: 'registrado' },
    { id: 'att-002', employeeId: 'emp-043', sectorId: 'sec-salon', shiftAssignmentId: `sa-${today}-emp-043`, operationalDate: today, eventType: 'ausencia_injustificada', justified: false, notes: 'Ausencia al inicio de armado de salón.', occurredAt: `${today}T10:30:00Z`, registeredAt: `${today}T10:55:00Z`, registeredBy: 'Martín Duarte', status: 'registrado' },
    { id: 'att-003', employeeId: 'emp-024', sectorId: 'sec-parrilla', shiftAssignmentId: `sa-${today}-emp-024`, operationalDate: today, eventType: 'ausencia_justificada', justified: true, notes: 'Presentó constancia médica por 24 hs.', occurredAt: `${today}T10:00:00Z`, registeredAt: `${today}T10:20:00Z`, registeredBy: 'Raquel Benítez', approvedBy: 'Raquel Benítez', status: 'aprobado' },
    { id: 'att-004', employeeId: 'emp-033', sectorId: 'sec-salon', operationalDate: addDaysISO(today, -1), eventType: 'horas_extra', extraHours: 2.5, notes: 'Extensión de turno por cena de grupo turístico de 60 comensales.', occurredAt: `${addDaysISO(today, -1)}T23:30:00Z`, registeredAt: `${today}T09:00:00Z`, registeredBy: 'Martín Duarte', approvedBy: 'Raquel Benítez', status: 'aprobado' },
    { id: 'att-005', employeeId: 'emp-013', sectorId: 'sec-cocina', operationalDate: addDaysISO(today, -1), eventType: 'horas_extra', extraHours: 2, notes: 'Despacho extendido cocina caliente.', occurredAt: `${addDaysISO(today, -1)}T23:45:00Z`, registeredAt: `${today}T09:15:00Z`, registeredBy: 'Gustavo Pereyra', approvedBy: 'Raquel Benítez', status: 'aprobado' },
    { id: 'att-006', employeeId: 'emp-034', sectorId: 'sec-salon', operationalDate: addDaysISO(today, -2), eventType: 'tardanza', minutesLate: 25, notes: 'Ingreso 25 minutos tarde al turno mediodía.', occurredAt: `${addDaysISO(today, -2)}T10:55:00Z`, registeredAt: `${addDaysISO(today, -2)}T11:10:00Z`, registeredBy: 'Carolina Núñez', status: 'registrado' },
    { id: 'att-007', employeeId: 'emp-021', sectorId: 'sec-parrilla', operationalDate: addDaysISO(today, -3), eventType: 'franco_trabajado', extraHours: 6, notes: 'Cobertura en domingo de alta ocupación. Queda franco compensatorio pendiente.', occurredAt: `${addDaysISO(today, -3)}T11:00:00Z`, registeredAt: `${addDaysISO(today, -3)}T18:00:00Z`, registeredBy: 'Ramón Cardozo', approvedBy: 'Raquel Benítez', status: 'aprobado' }
  ];

  const vacationBalances: VacationBalance[] = employees.map((emp, idx) => {
    const years = Math.max(0, new Date().getFullYear() - new Date(emp.hireDate).getFullYear());
    const entitledDays = years >= 10 ? 28 : years >= 5 ? 21 : 14;
    const takenDays = idx % 4 === 0 ? 7 : idx % 5 === 0 ? 4 : 0;
    const approvedPendingDays = emp.id === 'emp-037' ? 7 : emp.id === 'emp-062' ? 5 : 0;
    return {
      employeeId: emp.id,
      year: new Date().getFullYear(),
      entitledDays,
      takenDays,
      approvedPendingDays
    };
  });

  const leaveRequests: LeaveRequest[] = [
    { id: 'lv-001', employeeId: 'emp-033', type: 'vacaciones', startDate: addDaysISO(today, 14), endDate: addDaysISO(today, 20), daysRequested: 7, status: 'pendiente', reason: 'Vacaciones anuales programadas.', requestedAt: `${addDaysISO(today, -1)}T15:00:00Z` },
    { id: 'lv-002', employeeId: 'emp-014', type: 'vacaciones', startDate: addDaysISO(today, 21), endDate: addDaysISO(today, 27), daysRequested: 7, status: 'pendiente', reason: 'Solicitud período familiar.', requestedAt: `${today}T09:10:00Z` },
    { id: 'lv-003', employeeId: 'emp-037', type: 'vacaciones', startDate: addDaysISO(today, -2), endDate: addDaysISO(today, 4), daysRequested: 7, status: 'aprobada', reason: 'Licencia anual ordinaria.', requestedAt: `${addDaysISO(today, -18)}T11:00:00Z`, reviewedBy: 'Raquel Benítez', reviewedAt: `${addDaysISO(today, -15)}T14:00:00Z`, reviewNotes: 'Aprobada con cobertura de salón confirmada.' },
    { id: 'lv-004', employeeId: 'emp-062', type: 'enfermedad', startDate: addDaysISO(today, -1), endDate: addDaysISO(today, 3), daysRequested: 5, status: 'aprobada', reason: 'Reposo médico certificado.', requestedAt: `${addDaysISO(today, -1)}T08:30:00Z`, reviewedBy: 'Raquel Benítez', reviewedAt: `${addDaysISO(today, -1)}T09:00:00Z` },
    { id: 'lv-005', employeeId: 'emp-021', type: 'franco_compensatorio', startDate: addDaysISO(today, 5), endDate: addDaysISO(today, 5), daysRequested: 1, status: 'pendiente', reason: 'Compensación por franco trabajado domingo anterior.', requestedAt: `${today}T10:00:00Z` }
  ];

  const performanceEvaluations: PerformanceEvaluation[] = [
    { id: 'eval-001', employeeId: 'emp-033', operationalDate: addDaysISO(today, -20), evaluatorName: 'Martín Duarte', category: 'reconocimiento', score: 5, summary: 'Excelente atención en portugués e inglés a mesas VIP; comentarios sobresalientes de comensales.', strengths: 'Proactividad, conocimiento de carta de vinos y velocidad de servicio.', createdAt: `${addDaysISO(today, -20)}T16:00:00Z` },
    { id: 'eval-002', employeeId: 'emp-013', operationalDate: addDaysISO(today, -35), evaluatorName: 'Gustavo Pereyra', category: 'evaluacion_periodica', score: 4.5, summary: 'Sólida transición a Cocinero de Partida. Mantiene orden de plaza y control de mermas.', strengths: 'Disciplina de mise en place y trabajo en equipo.', improvementPlan: 'Profundizar liderazgo en picos de despacho nocturno.', createdAt: `${addDaysISO(today, -35)}T15:00:00Z` },
    { id: 'eval-003', employeeId: 'emp-050', operationalDate: addDaysISO(today, -15), evaluatorName: 'Patricia Salinas', category: 'evaluacion_periodica', score: 4.8, summary: 'Cierres de caja sin diferencias durante 30 jornadas consecutivas.', createdAt: `${addDaysISO(today, -15)}T13:00:00Z` }
  ];

  const disciplinaryActions: DisciplinaryAction[] = [
    { id: 'disc-act-001', employeeId: 'emp-034', operationalDate: addDaysISO(today, -12), type: 'llamado_atencion', reason: 'Reiteración de llegadas tarde al turno mediodía sin aviso previo (3 eventos en 15 días).', authorizedBy: 'Raquel Benítez', supportingDocRef: 'ACTA-DEMO-2026-014', createdAt: `${addDaysISO(today, -12)}T12:00:00Z` }
  ];

  const trainingSessions: TrainingSession[] = [
    { id: 'trn-001', title: 'Manipulación Segura de Alimentos y BPM (Misiones)', topic: 'Seguridad e Higiene', instructor: 'Lic. Andrea Morales (Ext. Demo)', scheduledDate: addDaysISO(today, -10), durationHours: 3, sectorIds: ['sec-cocina', 'sec-parrilla', 'sec-pasteleria'], status: 'completada' },
    { id: 'trn-002', title: 'Maridaje de Vinos Argentinos y Venta Sugestiva', topic: 'Hospitalidad y Cava', instructor: 'Facundo Alvarez', scheduledDate: addDaysISO(today, 4), durationHours: 2, sectorIds: ['sec-salon', 'sec-barra'], status: 'programada' },
    { id: 'trn-003', title: 'Uso de Checklists Digitales y Control de Mermas (VEGEN)', topic: 'Transformación Digital', instructor: 'Raquel Benítez / VEGEN', scheduledDate: addDaysISO(today, 7), durationHours: 1.5, sectorIds: ['sec-cocina', 'sec-salon', 'sec-caja', 'sec-compras'], status: 'programada' }
  ];

  const trainingAttendances: TrainingAttendance[] = [
    { id: 'ta-1', trainingSessionId: 'trn-001', employeeId: 'emp-010', status: 'asistio' },
    { id: 'ta-2', trainingSessionId: 'trn-001', employeeId: 'emp-011', status: 'asistio' },
    { id: 'ta-3', trainingSessionId: 'trn-001', employeeId: 'emp-013', status: 'asistio' },
    { id: 'ta-4', trainingSessionId: 'trn-001', employeeId: 'emp-020', status: 'asistio' },
    { id: 'ta-5', trainingSessionId: 'trn-001', employeeId: 'emp-025', status: 'asistio' },
    { id: 'ta-6', trainingSessionId: 'trn-002', employeeId: 'emp-029', status: 'inscripto' },
    { id: 'ta-7', trainingSessionId: 'trn-002', employeeId: 'emp-033', status: 'inscripto' },
    { id: 'ta-8', trainingSessionId: 'trn-002', employeeId: 'emp-034', status: 'inscripto' },
    { id: 'ta-9', trainingSessionId: 'trn-003', employeeId: 'emp-033', status: 'inscripto' },
    { id: 'ta-10', trainingSessionId: 'trn-003', employeeId: 'emp-050', status: 'inscripto' }
  ];

  const loans: Loan[] = [
    {
      id: 'loan-001',
      employeeId: 'emp-033',
      type: 'adelanto',
      amountArs: 45000,
      currency: 'ARS',
      grantDate: addDaysISO(today, -2),
      authorizedBy: 'Raquel Benítez',
      status: 'aprobado',
      installmentsCount: 1,
      installments: [
        { installmentNumber: 1, dueDate: addDaysISO(today, 2), amountArs: 45000, status: 'incluida_en_preliquidacion' }
      ],
      notes: 'Adelanto semanal autorizado para descontar en pre-liquidación vigente.',
      createdAt: `${addDaysISO(today, -2)}T11:30:00Z`
    },
    {
      id: 'loan-002',
      employeeId: 'emp-021',
      type: 'prestamo',
      amountArs: 240000,
      currency: 'ARS',
      grantDate: addDaysISO(today, -20),
      authorizedBy: 'Pablo Méndez',
      status: 'en_curso',
      installmentsCount: 4,
      installments: [
        { installmentNumber: 1, dueDate: addDaysISO(today, -13), amountArs: 60000, status: 'pagada', paidAt: addDaysISO(today, -13) },
        { installmentNumber: 2, dueDate: addDaysISO(today, -6), amountArs: 60000, status: 'pagada', paidAt: addDaysISO(today, -6) },
        { installmentNumber: 3, dueDate: addDaysISO(today, 2), amountArs: 60000, status: 'incluida_en_preliquidacion' },
        { installmentNumber: 4, dueDate: addDaysISO(today, 9), amountArs: 60000, status: 'pendiente' }
      ],
      notes: 'Préstamo personal en 4 cuotas semanales sin interés.',
      createdAt: `${addDaysISO(today, -20)}T14:00:00Z`
    },
    {
      id: 'loan-003',
      employeeId: 'emp-015',
      type: 'adelanto',
      amountArs: 35000,
      currency: 'ARS',
      grantDate: today,
      authorizedBy: 'Pendiente',
      status: 'pendiente',
      installmentsCount: 1,
      installments: [
        { installmentNumber: 1, dueDate: addDaysISO(today, 2), amountArs: 35000, status: 'pendiente' }
      ],
      notes: 'Solicitud de adelanto semanal en espera de autorización.',
      createdAt: `${today}T09:50:00Z`
    }
  ];

  // 18. WEEKLY PAYROLL PERIOD & PREPARATION
  const payrollPeriods: PayrollPeriod[] = [
    {
      id: 'pay-sem-actual',
      code: 'SEM-ACTUAL',
      label: `Semana operativa (${addDaysISO(today, -4)} al ${addDaysISO(today, 2)})`,
      startDate: addDaysISO(today, -4),
      endDate: addDaysISO(today, 2),
      status: 'en_revision'
    }
  ];

  const tipAllocations: TipAllocation[] = employees
    .filter((e) => ['sec-salon', 'sec-barra', 'sec-cocina', 'sec-parrilla', 'sec-pasteleria'].includes(e.currentSectorId))
    .map((e, idx) => ({
      id: `tip-${e.id}`,
      payrollPeriodId: 'pay-sem-actual',
      employeeId: e.id,
      sectorId: e.currentSectorId,
      amountArs: e.currentSectorId === 'sec-salon' ? 54000 + (idx % 4) * 3500 : 32000 + (idx % 3) * 2500,
      operationalDate: today,
      notes: 'Distribución semanal sintética de propinas por punto de sector.'
    }));

  const payrollAdjustments: PayrollAdjustment[] = [
    {
      id: 'padj-001',
      payrollPeriodId: 'pay-sem-actual',
      employeeId: 'emp-029',
      concept: 'Adicional coordinación eventos grupales',
      amountArs: 28000,
      authorizedBy: 'Pablo Méndez',
      notes: 'Aprobado por Gerencia Operativa.',
      createdAt: `${today}T10:00:00Z`
    }
  ];

  const payrollPreparations: PayrollPreparationLine[] = employees.map((emp) => {
    const empExtra = attendanceEvents
      .filter((a) => a.employeeId === emp.id && a.eventType === 'horas_extra' && a.status === 'aprobado')
      .reduce((acc, a) => acc + (a.extraHours ?? 0), 0);
    const extraHoursAmountArs = Math.round(empExtra * emp.hourlyExtraRateArs);
    const absencesCount = attendanceEvents.filter(
      (a) => a.employeeId === emp.id && (a.eventType === 'ausencia_injustificada' || a.eventType === 'ausencia_justificada')
    ).length;
    const tipsAmountArs = tipAllocations
      .filter((t) => t.employeeId === emp.id && t.payrollPeriodId === 'pay-sem-actual')
      .reduce((acc, t) => acc + t.amountArs, 0);
    const advancesDeductionArs = loans
      .filter((l) => l.employeeId === emp.id && l.type === 'adelanto' && (l.status === 'aprobado' || l.status === 'en_curso'))
      .reduce((acc, l) => acc + l.installments.filter((i) => i.status === 'incluida_en_preliquidacion').reduce((s, i) => s + i.amountArs, 0), 0);
    const loanInstallmentArs = loans
      .filter((l) => l.employeeId === emp.id && l.type === 'prestamo' && (l.status === 'aprobado' || l.status === 'en_curso'))
      .reduce((acc, l) => acc + l.installments.filter((i) => i.status === 'incluida_en_preliquidacion').reduce((s, i) => s + i.amountArs, 0), 0);
    const otherAdjustmentsArs = payrollAdjustments
      .filter((a) => a.employeeId === emp.id && a.payrollPeriodId === 'pay-sem-actual')
      .reduce((acc, a) => acc + a.amountArs, 0);
    const netEstimatedArs =
      emp.weeklyBaseSalaryArs +
      extraHoursAmountArs +
      tipsAmountArs +
      otherAdjustmentsArs -
      advancesDeductionArs -
      loanInstallmentArs;

    return {
      id: `prep-${emp.id}`,
      payrollPeriodId: 'pay-sem-actual',
      employeeId: emp.id,
      baseWeeklyArs: emp.weeklyBaseSalaryArs,
      scheduledShiftsCount: 6,
      absencesCount,
      extraHours: empExtra,
      extraHoursAmountArs,
      tipsAmountArs,
      advancesDeductionArs,
      loanInstallmentArs,
      otherAdjustmentsArs,
      netEstimatedArs,
      reviewStatus: emp.id === 'emp-033' || emp.id === 'emp-021' ? 'revisado' : 'pendiente',
      paymentStatus: 'no_ejecutado',
      reviewedBy: emp.id === 'emp-033' ? 'Raquel Benítez' : undefined,
      updatedAt: nowIso
    };
  });

  // 19. DEMAND FORECASTS (Next 5 days for Pablo)
  const demandForecasts: DemandForecast[] = [
    { id: 'fc-0', operationalDate: today, expectedGuests: 340, confirmedReservations: 165, tourGroupsCount: 3, specialEvents: 'Cena agencia turística Cataratas (60 pax)', isHoliday: false, demandNotes: 'Alta rotación esperada en turno noche. Reforzar parrilla y salón.', updatedBy: 'Pablo Méndez', updatedAt: nowIso },
    { id: 'fc-1', operationalDate: addDaysISO(today, 1), expectedGuests: 390, confirmedReservations: 210, tourGroupsCount: 4, specialEvents: 'Evento corporativo salón galería (45 pax)', isHoliday: false, demandNotes: 'Verificar stock de Ojo de Bife, Surubí y Malbec Reserva antes de las 11:00.', updatedBy: 'Pablo Méndez', updatedAt: nowIso },
    { id: 'fc-2', operationalDate: addDaysISO(today, 2), expectedGuests: 460, confirmedReservations: 280, tourGroupsCount: 5, specialEvents: 'Fin de semana pico turismo regional', isHoliday: true, demandNotes: 'Doble turno completo previsto en salón principal y galería.', updatedBy: 'Pablo Méndez', updatedAt: nowIso },
    { id: 'fc-3', operationalDate: addDaysISO(today, 3), expectedGuests: 295, confirmedReservations: 130, tourGroupsCount: 2, specialEvents: 'Servicio regular', isHoliday: false, demandNotes: 'Jornada de reposición de cámaras y control físico semanal.', updatedBy: 'Pablo Méndez', updatedAt: nowIso }
  ];

  // 20. IMPORT HISTORY & SAVED MAPPINGS
  const importMappings: ImportMappingProfile[] = [
    {
      id: 'map-maxirest-ventas',
      name: 'MaxiRest — Resumen Diario de Ventas (Demo)',
      sourceProfile: 'maxirest',
      dataset: 'sales',
      columnMap: {
        operationalDate: 'Fecha',
        shiftType: 'Turno',
        ticketsCount: 'Comandas',
        guestsCount: 'Comensales',
        coversSold: 'Cubiertos',
        totalRevenueArs: 'Facturacion_ARS',
        externalId: 'ID_Lote'
      },
      createdAt: '2026-02-15T10:00:00Z'
    },
    {
      id: 'map-holistor-gastos',
      name: 'Holistor — Comprobantes y Gastos (Demo)',
      sourceProfile: 'holistor',
      dataset: 'expenses',
      columnMap: {
        operationalDate: 'Fecha_Comprobante',
        category: 'Rubro',
        supplierName: 'Proveedor',
        description: 'Detalle',
        amountArs: 'Importe_Total'
      },
      createdAt: '2026-02-20T10:00:00Z'
    }
  ];

  const importBatches: ImportBatch[] = [
    {
      id: 'imp-001',
      sourceProfile: 'maxirest',
      dataset: 'sales',
      fileName: 'maxirest_ventas_sinteticas_ultimos22d.csv',
      fileFingerprint: 'fp-seed-maxirest-001',
      totalRows: 44,
      importedRows: 44,
      skippedDuplicateRows: 0,
      errorRows: 0,
      warnings: ['Datos sintéticos iniciales para demostración de tablero gerencial.'],
      importedBy: 'Pablo Méndez',
      importedAt: `${addDaysISO(today, -1)}T18:30:00Z`,
      status: 'completado'
    },
    {
      id: 'imp-002',
      sourceProfile: 'holistor',
      dataset: 'expenses',
      fileName: 'holistor_gastos_operativos_demo.csv',
      fileFingerprint: 'fp-seed-holistor-002',
      totalRows: 4,
      importedRows: 4,
      skippedDuplicateRows: 0,
      errorRows: 0,
      warnings: [],
      importedBy: 'Silvia Castañeda',
      importedAt: `${addDaysISO(today, -2)}T16:10:00Z`,
      status: 'completado'
    }
  ];

  // 21. APPEND-ONLY AUDIT EVENTS
  const auditEvents: AuditEvent[] = [
    { id: 'aud-001', timestamp: `${today}T11:22:00Z`, module: 'organizacion', entityType: 'ChecklistExecution', entityId: 'chk-exec-004', action: 'VERIFICADO', summary: 'Martín Duarte verificó Puesta a Punto de Salón (250 cubiertos).', actorId: 'emp-029', actorName: 'Martín Duarte', actorRole: 'responsable_sector' },
    { id: 'aud-002', timestamp: `${today}T10:52:00Z`, module: 'organizacion', entityType: 'ChecklistExecution', entityId: 'chk-exec-001', action: 'VERIFICADO', summary: 'Patricia Salinas verificó Apertura de Caja ($ 185.000 fondo fijo).', actorId: 'emp-049', actorName: 'Patricia Salinas', actorRole: 'responsable_sector' },
    { id: 'aud-003', timestamp: `${today}T10:15:00Z`, module: 'gestion', entityType: 'PurchaseRequest', entityId: 'pr-002', action: 'SOLICITADO', summary: 'Gustavo Pereyra envió solicitud SC-2026-0142 (4 insumos de Cocina).', actorId: 'emp-010', actorName: 'Gustavo Pereyra', actorRole: 'responsable_sector' },
    { id: 'aud-004', timestamp: `${today}T09:42:00Z`, module: 'gestion', entityType: 'PurchaseRequest', entityId: 'pr-001', action: 'VERIFICADO_STOCK', summary: 'René Giménez verificó existencias físicas de SC-2026-0141 y la elevó a Pablo Méndez.', actorId: 'emp-006', actorName: 'René Giménez', actorRole: 'compras_rene' },
    { id: 'aud-005', timestamp: `${today}T09:30:00Z`, module: 'gestion', entityType: 'LossEvent', entityId: 'loss-003', action: 'MERMA_REGISTRADA', summary: 'Camilo Báez registró merma de proceso de Surubí (14 kg → 11,9 kg · 85% rendimiento).', actorId: 'emp-013', actorName: 'Camilo Báez', actorRole: 'colaborador' },
    { id: 'aud-006', timestamp: `${today}T07:45:00Z`, module: 'organizacion', entityType: 'Discrepancy', entityId: 'disc-001', action: 'DISCREPANCIA_ABIERTA', summary: 'Valeria Sosa reportó discrepancia en limpieza de freezer de pescados del turno noche.', actorId: 'emp-011', actorName: 'Valeria Sosa', actorRole: 'responsable_sector' }
  ];

  return {
    version: 1,
    organization,
    sectors,
    positions,
    shifts,
    shiftAssignments,
    procedures,
    procedureVersions,
    checklistTemplates,
    checklistExecutions,
    discrepancies,
    documents,
    employees,
    contracts,
    employeeAssignments,
    attendanceEvents,
    leaveRequests,
    vacationBalances,
    performanceEvaluations,
    disciplinaryActions,
    trainingSessions,
    trainingAttendances,
    loans,
    tipAllocations,
    payrollPeriods,
    payrollAdjustments,
    payrollPreparations,
    productCategories,
    suppliers,
    inventoryLocations,
    products,
    purchaseRequests,
    purchaseOrders,
    goodsReceipts,
    inventoryMovements,
    lossEvents,
    menuItems,
    sales,
    expenses,
    importBatches,
    importMappings,
    demandForecasts,
    auditEvents
  };
}
