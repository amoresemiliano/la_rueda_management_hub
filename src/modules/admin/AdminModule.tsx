import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  History,
  Lock,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  UserCheck
} from 'lucide-react';
import {
  cardTitleClass,
  ConfirmDialog,
  EmptyState,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  SectionHeader,
  sectionTitleClass,
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
  { key: 'canVerifyPurchaseStock', label: 'Verificar stock físico en solicitudes (Compras)' },
  { key: 'canApprovePurchases', label: 'Aprobar compras y emitir órdenes (Operación / Dirección)' },
  { key: 'canReceiveGoods', label: 'Registrar recepción de mercadería e inventario' },
  { key: 'canRegisterLosses', label: 'Registrar mermas de proceso y desperdicios' },
  { key: 'canImportData', label: 'Importar archivos CSV/XLSX (MaxiRest / Holistor)' },
  { key: 'canViewAllEmployees', label: 'Ver directorio completo de personal (65 colab.)' },
  { key: 'canCreateOrTransferEmployee', label: 'Dar de alta empleados y transferir puestos' },
  { key: 'canViewSalaryAndPayroll', label: 'Acceder a propinas y pre-liquidación semanal' },
  { key: 'canViewDisciplinary', label: 'Ver y registrar medidas disciplinarias' },
  { key: 'canApproveLeaves', label: 'Aprobar vacaciones y licencias' },
  { key: 'canAuthorizeLoans', label: 'Autorizar adelantos y préstamos' },
  { key: 'canViewAnalytics', label: 'Acceder al módulo Analítica (BI centralizado)' }
];

const FUTURE_AI_ROADMAP = [
  {
    id: 'ai-demanda',
    title: 'Pronóstico de demanda turística',
    area: 'Planificación y dotación',
    description:
      'Cruce del histórico de cubiertos MaxiRest con estacionalidad de Cataratas del Iguazú, feriados argentinos y brasileños y pronóstico climático para anticipar refuerzos por turno.'
  },
  {
    id: 'ai-mermas',
    title: 'Detección temprana de desvíos de merma',
    area: 'Cocina, parrilla e inventarios',
    description:
      'Alertas automáticas cuando el rendimiento de cortes de parrilla o pescados de río se aleja de su banda histórica habitual por turno o proveedor.'
  },
  {
    id: 'ai-compras',
    title: 'Sugerencia de compras y reposición',
    area: 'Compras y abastecimiento',
    description:
      'Borradores sugeridos de solicitudes de compra en función del stock mínimo, el plazo de entrega por proveedor y el nivel de reservas confirmadas.'
  },
  {
    id: 'ai-manuales',
    title: 'Asistente documental sobre manuales',
    area: 'Organización y capacitación',
    description:
      'Consulta en lenguaje natural sobre procedimientos vigentes y manuales de puesto para agilizar la inducción de personal nuevo y resolver dudas en servicio.'
  }
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
    { id: 'automatizaciones', label: 'Automatizaciones' }
  ];

  // Backward-compatible section mapping in case any link navigates to legacy ids
  const normalizedSection =
    nav.section === 'arquitectura' ? 'automatizaciones' : nav.section;
  const activeTab = tabs.some((t) => t.id === normalizedSection) ? normalizedSection : 'roles';

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
    downloadTextFile(
      `LaRueda1975_Respaldo_${new Date().toISOString().slice(0, 10)}.json`,
      json,
      'application/json;charset=utf-8'
    );
    notify('Copia JSON local del entorno descargada.');
  };

  const handleConfirmReset = async () => {
    setResetConfirmOpen(false);
    await resetDemoData();
  };

  if (!permissions.canViewAdmin) {
    return (
      <EmptyState
        title="Acceso restringido a Configuración"
        description="Solo Administrador, Dirección o Recursos Humanos pueden consultar usuarios, permisos, auditoría y automatizaciones."
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Configuración"
        subtitle="Gestión de perfiles operativos, trazabilidad de auditoría y hoja de ruta de automatizaciones."
      />

      <SegmentedTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={(section) => navigate({ module: 'administracion', section })}
      />

      {/* TAB 1: USUARIOS Y ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#1769C2] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5E5851] leading-relaxed">
              <strong className="text-[#141210]">Control de acceso por perfil:</strong>{' '}
              Podés alternar entre los 7 roles operativos para evaluar las pantallas y permisos
              habilitados para cada área. El perfil{' '}
              <strong className="text-[#141210]">Administrador VEGEN</strong> permanece protegido
              contra edición o eliminación accidental.
            </div>
          </div>

          {/* Interactive Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DEMO_USERS.map((u) => {
              const isActive = u.roleId === activeUser.roleId;
              const isProtectedAdmin = u.roleId === 'admin_vegen';
              return (
                <div
                  key={u.id}
                  className={`bg-white border rounded-lg p-5 flex flex-col justify-between gap-4 ${
                    isActive ? 'border-[#168B68] bg-[#168B68]/[0.02]' : 'border-[#E6E2D8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cardTitleClass}>{u.roleLabel}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {isProtectedAdmin && (
                          <span
                            title="Perfil de administración protegido contra modificación o baja"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C2D36]"
                          >
                            <Lock className="w-3 h-3" />
                            Protegido
                          </span>
                        )}
                        {isActive && <StatusText label="Activo" tone="positive" />}
                      </div>
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#5E5851]">{u.title}</div>
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
              <h3 className="text-sm font-bold text-[#141210]">
                Matriz de permisos por perfil operativo
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                    <th className="py-3 px-4 font-semibold min-w-[240px]">Capacidad / Permiso</th>
                    {DEMO_USERS.map((u) => (
                      <th key={u.roleId} className="py-3 px-2.5 font-semibold text-center whitespace-nowrap">
                        {u.roleLabel}
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
                              <Check className="w-4 h-4 text-[#168B68] mx-auto" />
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

          {/* Discreet Authorized Admin Utility Strip (preserves demo export/reset without standalone tab) */}
          {activeUser.roleId === 'admin_vegen' && (
            <div className="bg-[#FAF9F6] border border-[#E6E2D8] rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#5E5851]">
                <span className="font-semibold text-[#141210]">Mantenimiento del entorno local</span>
                <span className="mx-2 text-[#C7C0B5]">·</span>
                <span>Persistencia: {storageBackendLabel}</span>
                <span className="mx-2 text-[#C7C0B5]">·</span>
                <span>
                  {data.employees.length} legajos · {data.products.length} insumos ·{' '}
                  {data.auditEvents.length} eventos
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button type="button" onClick={handleExportSnapshot} className={secondaryBtnClass}>
                  <Download className="w-3.5 h-3.5" />
                  Exportar respaldo JSON
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#C83E43] bg-white border border-[#C83E43]/35 hover:bg-[#C83E43]/[0.06] rounded-md transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restablecer entorno inicial
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDITORÍA DE ACTIVIDAD */}
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
              <option value="administracion">Configuración</option>
            </select>
          </div>

          <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#141210] flex items-center gap-2">
                <History className="w-4 h-4 text-[#1769C2]" />
                Registro de auditoría de solo anexado ({filteredAudit.length} eventos)
              </span>
              <span className="text-xs text-[#5E5851]">
                Cada operación genera una traza inmutable con fecha, actor y rol
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                    <th className="py-3 px-4 font-semibold">Fecha y hora</th>
                    <th className="py-3 px-4 font-semibold">Módulo</th>
                    <th className="py-3 px-4 font-semibold">Acción</th>
                    <th className="py-3 px-4 font-semibold">Actor</th>
                    <th className="py-3 px-4 font-semibold">Resumen operativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9]">
                  {filteredAudit.slice(0, 100).map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 px-4 font-mono tabular-nums text-[#5E5851] whitespace-nowrap">
                        {formatDateTimeAR(ev.timestamp)}
                      </td>
                      <td className="py-3 px-4 capitalize text-[#5E5851]">{ev.module}</td>
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-[#1769C2] whitespace-nowrap">
                        {ev.action}
                      </td>
                      <td className="py-3 px-4 text-[#1C1917] whitespace-nowrap">
                        <div className="font-medium">{ev.actorName}</div>
                        <div className="text-[11px] text-[#5E5851]">{ev.actorRole}</div>
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

      {/* TAB 3: AUTOMATIZACIONES (Clean roadmap — technical Bluehost architecture panel removed) */}
      {activeTab === 'automatizaciones' && (
        <div className="space-y-6">
          {/* Operational vs Conceptual Scope Clarity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#168B68] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#141210]">
                  Operativo hoy (cálculo determinista)
                </div>
                <p className="text-xs text-[#5E5851] leading-relaxed">
                  Todos los tableros, alertas de stock mínimo, matriz de ingeniería de menú,
                  sincronización entre dotación y asistencia y cálculos de pre-liquidación operan con
                  reglas deterministas auditables sobre los datos cargados.
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#141210]">
                  Hoja de ruta conceptual (no activo aún)
                </div>
                <p className="text-xs text-[#5E5851] leading-relaxed">
                  Las capacidades asistidas por IA listadas a continuación representan una etapa
                  posterior planificada sobre histórico consolidado. Esta versión no ejecuta modelos
                  predictivos ni genera estimaciones automáticas sintéticas.
                </p>
              </div>
            </div>
          </div>

          {/* Futuras capacidades asistidas por IA */}
          <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EFECE5]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#1769C2] shrink-0" />
                <div>
                  <h2 className={sectionTitleClass}>Futuras capacidades asistidas por IA</h2>
                  <p className="text-xs text-[#6B635B] mt-0.5">
                    Roadmap conceptual de automatizaciones inteligentes para próximas fases
                  </p>
                </div>
              </div>
              <StatusText label="Planificado · Fase futura" tone="warning" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FUTURE_AI_ROADMAP.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#FAF9F6] border border-[#E6E2D8] rounded-lg flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cardTitleClass}>{item.title}</h3>
                      <StatusText label="Conceptual" tone="neutral" />
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-[#1769C2]">
                      {item.area}
                    </div>
                    <p className="mt-2 text-xs text-[#5E5851] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetConfirmOpen}
        title="¿Restablecer todos los datos iniciales?"
        description="Se borrarán las modificaciones locales guardadas en el navegador y se restaurará el conjunto inicial de La Rueda 1975 (65 empleados, 90 insumos, compras, checklists y ventas base)."
        confirmLabel="Sí, restablecer ahora"
        danger
        onConfirm={handleConfirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
};
