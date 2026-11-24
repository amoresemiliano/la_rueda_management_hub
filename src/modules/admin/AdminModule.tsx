import React, { useMemo, useState } from 'react';
import {
  Check,
  Database,
  Download,
  History,
  RotateCcw,
  Search,
  Server,
  Shield,
  Sparkles,
  UserCheck
} from 'lucide-react';
import {
  ConfirmDialog,
  EmptyState,
  inputClass,
  KpiCard,
  primaryBtnClass,
  secondaryBtnClass,
  SectionHeader,
  SegmentedTabs,
  StatusText
} from '../../components/ui/Primitives';
import { DEMO_USERS, getPermissions, RolePermissions } from '../../domain/permissions';
import { AuditEvent } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { downloadTextFile, formatDateTimeAR } from '../../utils/formatters';

const PERMISSION_ROWS: Array<{ key: keyof RolePermissions; label: string }> = [
  { key: 'canEditOrgStructure', label: 'Editar organigrama, sectores y puestos' },
  { key: 'canManageStaffing', label: 'Gestionar dotación y turnos diarios' },
  { key: 'canExecuteChecklists', label: 'Ejecutar checklists digitales' },
  { key: 'canVerifyChecklists', label: 'Verificar checklists y reportar discrepancias' },
  { key: 'canUploadDocuments', label: 'Cargar manuales y documentos' },
  { key: 'canViewFinancialMetrics', label: 'Ver métricas gerenciales, ventas y costos' },
  { key: 'canVerifyPurchaseStock', label: 'Verificar stock físico en solicitudes (René)' },
  { key: 'canApprovePurchases', label: 'Aprobar compras y emitir órdenes (Pablo / Dirección)' },
  { key: 'canReceiveGoods', label: 'Registrar recepción de mercadería e inventario' },
  { key: 'canRegisterLosses', label: 'Registrar mermas de proceso y desperdicios' },
  { key: 'canImportData', label: 'Importar archivos CSV/XLSX (MaxiRest / Holistor)' },
  { key: 'canViewAllEmployees', label: 'Ver directorio completo de personal (65 colab.)' },
  { key: 'canCreateOrTransferEmployee', label: 'Dar de alta empleados y transferir puestos' },
  { key: 'canViewSalaryAndPayroll', label: 'Acceder a propinas y pre-liquidación semanal' },
  { key: 'canViewDisciplinary', label: 'Ver y registrar medidas disciplinarias' },
  { key: 'canApproveLeaves', label: 'Aprobar vacaciones y licencias' },
  { key: 'canAuthorizeLoans', label: 'Autorizar adelantos y préstamos' }
];

export const AdminModule: React.FC = () => {
  const {
    data,
    activeUser,
    permissions,
    nav,
    navigate,
    switchDemoRole,
    resetDemoData,
    storageBackendLabel,
    notify
  } = useAppStore();

  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState<'todos' | AuditEvent['module']>('todos');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const tabs = [
    { id: 'roles', label: 'Usuarios y roles', count: DEMO_USERS.length },
    { id: 'auditoria', label: 'Auditoría de actividad', count: data.auditEvents.length },
    { id: 'arquitectura', label: 'Integración Bluehost e IA' },
    { id: 'demo', label: 'Datos de demostración' }
  ];

  const activeTab = tabs.some((t) => t.id === nav.section) ? nav.section : 'roles';

  const filteredAudit = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return data.auditEvents.filter((ev) => {
      if (auditModuleFilter !== 'todos' && ev.module !== auditModuleFilter) return false;
      if (!q) return true;
      return `${ev.action} ${ev.summary} ${ev.actorName} ${ev.entityType} ${ev.entityId}`
        .toLowerCase()
        .includes(q);
    });
  }, [data.auditEvents, auditModuleFilter, auditSearch]);

  const handleExportSnapshot = () => {
    const json = JSON.stringify(data, null, 2);
    downloadTextFile(`LaRueda1975_DemoSnapshot_${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json;charset=utf-8');
    notify('Copia JSON local de datos de demostración descargada.');
  };

  const handleConfirmReset = async () => {
    setResetConfirmOpen(false);
    await resetDemoData();
  };

  if (!permissions.canViewAdmin) {
    return (
      <EmptyState
        title="Acceso restringido al módulo Administración"
        description="Solo Administrador VEGEN, Dirección o RRHH — Raquel pueden visualizar la matriz de roles, auditoría y gestión de demostración."
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Administración y Arquitectura"
        subtitle="Control de roles de demostración, auditoría trazable de acciones, especificación de integración futura en Bluehost (PHP/MySQL) y reinicio del entorno demo."
      />

      <SegmentedTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={(section) => navigate({ module: 'administracion', section })}
      />

      {/* TAB 1: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#7C2D36] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5E5851] leading-relaxed">
              <strong className="text-[#1C1917]">Seguridad de demostración vs. producción:</strong>{' '}
              El selector de rol permite evaluar las vistas y restricciones operativas de cada perfil
              en el navegador. Los controles en cliente tienen fines exclusivamente demostrativos; en
              la implementación productiva sobre Bluehost (PHP + MySQL/MariaDB), todas las reglas
              RBAC y sesiones se validarán obligatoriamente del lado del servidor.
            </div>
          </div>

          {/* Interactive Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DEMO_USERS.map((u) => {
              const isActive = u.roleId === activeUser.roleId;
              return (
                <div
                  key={u.id}
                  className={`bg-white border rounded-lg p-5 flex flex-col justify-between gap-4 ${
                    isActive ? 'border-[#7C2D36] bg-[#7C2D36]/[0.02]' : 'border-[#E6E2D8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#1C1917]">{u.roleLabel}</span>
                      {isActive && <StatusText label="Rol activo" tone="accent" />}
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#5E5851]">
                      {u.name} · {u.title}
                    </div>
                    <p className="mt-2 text-xs text-[#5E5851] leading-relaxed">{u.description}</p>
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={() => switchDemoRole(u.roleId)}
                      className={isActive ? `${secondaryBtnClass} w-full` : `${primaryBtnClass} w-full`}
                    >
                      <UserCheck className="w-4 h-4" />
                      {isActive ? 'Perfil actualmente activo' : 'Cambiar a este rol'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Permissions Matrix */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4]">
              <span className="text-xs font-semibold text-[#1C1917]">
                Matriz de permisos por perfil operativo
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                    <th className="py-3 px-4 font-medium min-w-[240px]">Capacidad / Permiso</th>
                    {DEMO_USERS.map((u) => (
                      <th key={u.roleId} className="py-3 px-2.5 font-medium text-center whitespace-nowrap">
                        {u.roleLabel.split(' — ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9]">
                  {PERMISSION_ROWS.map((row) => (
                    <tr key={row.key} className="hover:bg-[#FAF9F6]">
                      <td className="py-2.5 px-4 text-[#1C1917]">{row.label}</td>
                      {DEMO_USERS.map((u) => {
                        const allowed = getPermissions(u.roleId)[row.key];
                        return (
                          <td key={u.roleId} className="py-2.5 px-2.5 text-center">
                            {allowed ? (
                              <Check className="w-4 h-4 text-[#15803D] mx-auto" />
                            ) : (
                              <span className="text-[#C7C0B5]">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG */}
      {activeTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8C847A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Buscar por acción, actor, entidad o detalle..."
                className={`${inputClass} pl-9`}
              />
            </div>

            <select
              value={auditModuleFilter}
              onChange={(e) => setAuditModuleFilter(e.target.value as 'todos' | AuditEvent['module'])}
              className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-sm text-[#1C1917]"
            >
              <option value="todos">Todos los módulos</option>
              <option value="organizacion">Organización</option>
              <option value="gestion">Gestión</option>
              <option value="personal">Personal</option>
              <option value="administracion">Administración</option>
            </select>
          </div>

          <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
                <History className="w-4 h-4 text-[#7C2D36]" />
                Registro de auditoría de solo anexado ({filteredAudit.length} eventos)
              </span>
              <span className="text-[11px] text-[#5E5851]">
                Cada operación genera una traza inmutable con fecha, actor y rol
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                    <th className="py-3 px-4 font-medium">Fecha y hora</th>
                    <th className="py-3 px-4 font-medium">Módulo</th>
                    <th className="py-3 px-4 font-medium">Acción</th>
                    <th className="py-3 px-4 font-medium">Actor</th>
                    <th className="py-3 px-4 font-medium">Resumen operativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9]">
                  {filteredAudit.slice(0, 100).map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E5851] whitespace-nowrap">
                        {formatDateTimeAR(ev.timestamp)}
                      </td>
                      <td className="py-3 px-4 capitalize text-[#5E5851]">{ev.module}</td>
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-[#7C2D36] whitespace-nowrap">
                        {ev.action}
                      </td>
                      <td className="py-3 px-4 text-[#1C1917] whitespace-nowrap">
                        <div>{ev.actorName}</div>
                        <div className="text-[10px] text-[#5E5851]">{ev.actorRole}</div>
                      </td>
                      <td className="py-3 px-4 text-[#1C1917]">{ev.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FUTURE BLUEHOST PHP/MYSQL + AI ARCHITECTURE */}
      {activeTab === 'arquitectura' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-[#7C2D36]" />
                <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                  Arquitectura objetivo: Bluehost (PHP + MySQL / MariaDB)
                </h3>
              </div>
              <p className="text-xs text-[#5E5851] leading-relaxed">
                Esta demostración opera íntegramente en el navegador mediante el patrón{' '}
                <span className="font-mono text-[#1C1917]">IDataRepository</span> (IndexedDB),
                desacoplado de la UI para migrar sin reescribir pantallas hacia una API REST PHP 8.2+
                sobre Bluehost con base de datos relacional MySQL/MariaDB.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md">
                  <div className="font-semibold text-[#1C1917]">1. Autenticación y RBAC en servidor</div>
                  <p className="mt-1 text-[#5E5851]">
                    Sesiones HTTP-only + tokens CSRF o JWT rotativos, contraseñas con{' '}
                    <span className="font-mono">password_hash(PASSWORD_ARGON2ID)</span>, validación
                    de permisos por endpoint y restricción de datos salariales/disciplinarios por rol.
                  </p>
                </div>
                <div className="p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md">
                  <div className="font-semibold text-[#1C1917]">2. Esquema relacional e integridad referencial</div>
                  <p className="mt-1 text-[#5E5851]">
                    Tablas normalizadas (<span className="font-mono">sectors</span>,{' '}
                    <span className="font-mono">positions</span>,{' '}
                    <span className="font-mono">employees</span>,{' '}
                    <span className="font-mono">employee_assignments</span>,{' '}
                    <span className="font-mono">checklist_executions</span>,{' '}
                    <span className="font-mono">purchase_requests</span>,{' '}
                    <span className="font-mono">purchase_orders</span>,{' '}
                    <span className="font-mono">inventory_movements</span>,{' '}
                    <span className="font-mono">loss_events</span>,{' '}
                    <span className="font-mono">import_batches</span>,{' '}
                    <span className="font-mono">audit_events</span>) con claves foráneas, transacciones
                    ACID y restricción <span className="font-mono">UNIQUE</span> en fingerprints de importación.
                  </p>
                </div>
                <div className="p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md">
                  <div className="font-semibold text-[#1C1917]">3. Archivos y cargas seguras</div>
                  <p className="mt-1 text-[#5E5851]">
                    Almacenamiento de manuales y legajos fuera del directorio público{' '}
                    <span className="font-mono">public_html</span>, descarga autenticada vía PHP
                    stream, validación estricta de MIME/tamaño y respaldo diario automatizado.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#9A6B3F]" />
                <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                  Futuras capacidades asistidas por IA (Roadmap conceptual)
                </h3>
              </div>
              <p className="text-xs text-[#5E5851] leading-relaxed">
                <strong className="text-[#1C1917]">Nota de transparencia:</strong> Esta demostración
                NO ejecuta modelos de IA ni inventa predicciones sintéticas. Toda la analítica actual
                proviene de fórmulas deterministas sobre datos reales/importados. En una fase
                posterior, sobre el histórico consolidado en MySQL, podrán habilitarse:
              </p>

              <ul className="space-y-2.5 text-xs text-[#5E5851]">
                <li className="p-3 bg-[#FAF9F6] border border-[#E6E2D8] rounded-md">
                  <span className="font-semibold text-[#1C1917]">Pronóstico de demanda turística:</span>{' '}
                  cruce de histórico de cubiertos MaxiRest con estacionalidad de Cataratas del Iguazú,
                  feriados argentinos/brasileños y clima.
                </li>
                <li className="p-3 bg-[#FAF9F6] border border-[#E6E2D8] rounded-md">
                  <span className="font-semibold text-[#1C1917]">Detección temprana de desvíos de merma:</span>{' '}
                  alertas cuando el rendimiento de cortes de parrilla o pescados de río se aleja de su
                  banda histórica por turno.
                </li>
                <li className="p-3 bg-[#FAF9F6] border border-[#E6E2D8] rounded-md">
                  <span className="font-semibold text-[#1C1917]">Sugerencia de compras y reposición:</span>{' '}
                  borradores automáticos de solicitudes basados en stock mínimo, lead time de
                  proveedores y reservas confirmadas.
                </li>
                <li className="p-3 bg-[#FAF9F6] border border-[#E6E2D8] rounded-md">
                  <span className="font-semibold text-[#1C1917]">Asistente documental sobre manuales:</span>{' '}
                  consulta en lenguaje natural de procedimientos vigentes por puesto para inducción de
                  personal nuevo.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEMO PERSISTENCE & RESET */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Motor de persistencia local"
              value={storageBackendLabel}
              subtitle="Sobrevive recargas de navegador en este dispositivo"
              tone="positive"
            />
            <KpiCard
              label="Personal registrado"
              value={String(data.employees.length)}
              subtitle={`${data.sectors.length} sectores · ${data.positions.length} puestos`}
            />
            <KpiCard
              label="Productos y compras"
              value={String(data.products.length)}
              subtitle={`${data.purchaseRequests.length} solicitudes · ${data.purchaseOrders.length} OC`}
            />
            <KpiCard
              label="Eventos de auditoría"
              value={String(data.auditEvents.length)}
              subtitle={`${data.lossEvents.length} mermas/desperdicios · ${data.importBatches.length} importaciones`}
            />
          </div>

          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-[#7C2D36] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-[#1C1917]">
                  Gestión de datos de demostración (100% sintéticos)
                </h3>
                <p className="mt-1 text-xs text-[#5E5851] leading-relaxed max-w-3xl">
                  Todos los cambios que realices (altas de personal, turnos, checklists, solicitudes y
                  órdenes de compra, mermas, adelantos e importaciones CSV/XLSX) se persisten
                  automáticamente en el navegador mediante IndexedDB. Podés descargar una copia JSON o
                  restablecer el entorno al estado semilla original en cualquier momento.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#EFECE5]">
              <button type="button" onClick={handleExportSnapshot} className={secondaryBtnClass}>
                <Download className="w-4 h-4" />
                Exportar estado actual (JSON)
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Restablecer datos de demostración
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetConfirmOpen}
        title="¿Restablecer todos los datos de demostración?"
        description="Se borrarán las modificaciones locales guardadas en IndexedDB y se restaurará el conjunto sintético inicial de La Rueda 1975 (65 empleados, 90 productos, compras, checklists y ventas base)."
        confirmLabel="Sí, restablecer ahora"
        danger
        onConfirm={handleConfirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
};
