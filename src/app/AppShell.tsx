import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { DEMO_USERS } from '../domain/permissions';
import { AppModule, useAppStore } from '../services/store';
import { formatDateAR, todayISO } from '../utils/formatters';
import { ToastContainer } from '../components/ui/Primitives';
import { EmployeeProfileModal } from '../modules/personnel/EmployeeProfileView';

const LOGO_SRC = '/assets/aistudio/logo_la_rueda_transparent.png';

interface NavGroup {
  module: AppModule;
  label: string;
  icon: React.FC<{ className?: string }>;
  visible: boolean;
  sections: { id: string; label: string }[];
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data,
    activeUser,
    permissions,
    nav,
    employeeModal,
    navigate,
    closeEmployeeProfile,
    switchDemoRole,
    toasts,
    dismissToast
  } = useAppStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<AppModule>(nav.module);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        module: 'inicio',
        label: 'Inicio',
        icon: LayoutDashboard,
        visible: permissions.canViewHome,
        sections: [{ id: 'resumen', label: 'Resumen ejecutivo' }]
      },
      {
        module: 'organizacion',
        label: 'Organización',
        icon: Building2,
        visible: permissions.canViewOrganization,
        sections: [
          { id: 'organigrama', label: 'Organigrama' },
          { id: 'dotacion', label: 'Dotación' },
          { id: 'checklists', label: 'Procedimientos' },
          { id: 'manuales', label: 'Manuales' }
        ]
      },
      {
        module: 'gestion',
        label: 'Gestión',
        icon: Briefcase,
        visible: permissions.canViewManagement,
        sections: [
          ...(permissions.canViewFinancialMetrics ? [{ id: 'ventas', label: 'Ventas' }] : []),
          { id: 'compras', label: 'Compras' },
          ...(permissions.canManageInventory ? [{ id: 'inventario', label: 'Inventarios' }] : []),
          ...(permissions.canRegisterLosses
            ? [{ id: 'mermas', label: 'Mermas y desperdicios' }]
            : []),
          ...(permissions.canViewFinancialMetrics
            ? [{ id: 'planificacion', label: 'Planificación' }]
            : []),
          ...(permissions.canImportData ? [{ id: 'importacion', label: 'Importación' }] : [])
        ]
      },
      {
        module: 'personal',
        label: 'Personal',
        icon: Users,
        visible: permissions.canViewPersonnel,
        sections: [
          { id: 'directorio', label: 'Legajos' },
          { id: 'asistencia', label: 'Asistencia' },
          { id: 'vacaciones', label: 'Vacaciones' },
          { id: 'desempeno', label: 'Desempeño' },
          { id: 'prestamos', label: 'Adelantos' },
          ...(permissions.canViewSalaryAndPayroll
            ? [{ id: 'preliquidacion', label: 'Liquidación' }]
            : [])
        ]
      },
      {
        module: 'analitica',
        label: 'Analítica',
        icon: BarChart3,
        visible: permissions.canViewAnalytics,
        sections: [
          { id: 'resumen', label: 'Resumen general' },
          { id: 'organizacion', label: 'Organización' },
          ...(permissions.canViewManagement || permissions.canViewFinancialMetrics
            ? [{ id: 'gestion', label: 'Gestión' }]
            : []),
          ...(permissions.canViewPersonnel && permissions.canViewAllEmployees
            ? [{ id: 'personal', label: 'Personal' }]
            : []),
          { id: 'discrepancias', label: 'Discrepancias' },
          { id: 'auditoria', label: 'Auditoría y actividad' }
        ]
      }
    ],
    [permissions]
  );

  // Real operational alerts derived from store
  const operationalAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      detail: string;
      severity: 'danger' | 'warning' | 'info';
      onClick: () => void;
    }> = [];

    const openDiscrepancies = data.discrepancies.filter((d) => d.status === 'abierta');
    if (openDiscrepancies.length > 0 && permissions.canViewAnalytics) {
      alerts.push({
        id: 'al-disc',
        title: `${openDiscrepancies.length} discrepancia(s) operativa(s) abierta(s)`,
        detail: openDiscrepancies[0].disputedTaskLabel,
        severity: 'danger',
        onClick: () => {
          navigate({ module: 'analitica', section: 'discrepancias' });
          setAlertsOpen(false);
        }
      });
    }

    const pendingApprovals = data.purchaseRequests.filter(
      (r) => r.status === 'pendiente_aprobacion' || r.status === 'solicitado'
    );
    if (pendingApprovals.length > 0 && permissions.canViewManagement) {
      alerts.push({
        id: 'al-pr',
        title: `${pendingApprovals.length} solicitud(es) de compra en curso`,
        detail: `Incluye ${pendingApprovals[0].code} (${pendingApprovals[0].status.replace('_', ' ')})`,
        severity: 'warning',
        onClick: () => {
          navigate({
            module: 'gestion',
            section: 'compras',
            selectedPurchaseRequestId: pendingApprovals[0].id
          });
          setAlertsOpen(false);
        }
      });
    }

    const criticalProducts = data.products.filter((p) => p.active && p.currentStock < p.minStock);
    if (criticalProducts.length > 0 && permissions.canManageInventory) {
      alerts.push({
        id: 'al-stock',
        title: `${criticalProducts.length} productos bajo stock mínimo`,
        detail: criticalProducts
          .slice(0, 3)
          .map((p) => p.name)
          .join(', '),
        severity: 'warning',
        onClick: () => {
          navigate({
            module: 'gestion',
            section: 'inventario',
            inventoryOnlyCritical: true
          });
          setAlertsOpen(false);
        }
      });
    }

    const pendingLeaves = data.leaveRequests.filter((l) => l.status === 'pendiente');
    if (pendingLeaves.length > 0 && permissions.canViewPersonnel) {
      alerts.push({
        id: 'al-lv',
        title: `${pendingLeaves.length} solicitud(es) de licencia pendiente(s)`,
        detail: 'Requiere revisión de RRHH / Dirección',
        severity: 'info',
        onClick: () => {
          navigate({ module: 'personal', section: 'vacaciones' });
          setAlertsOpen(false);
        }
      });
    }

    return alerts;
  }, [data, permissions, navigate]);

  // Global live search across all entities
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: Array<{
      id: string;
      category: string;
      title: string;
      subtitle: string;
      onSelect: () => void;
    }> = [];

    if (permissions.canViewPersonnel) {
      data.employees
        .filter((e) => {
          if (!permissions.canViewAllEmployees && activeUser.employeeId && e.id !== activeUser.employeeId) {
            if (!activeUser.managedSectorIds?.includes(e.currentSectorId)) return false;
          }
          return `${e.firstName} ${e.lastName} ${e.legajo}`.toLowerCase().includes(q);
        })
        .slice(0, 5)
        .forEach((e) => {
          const sec = data.sectors.find((s) => s.id === e.currentSectorId);
          const pos = data.positions.find((p) => p.id === e.currentPositionId);
          results.push({
            id: `sr-${e.id}`,
            category: 'Personal',
            title: `${e.lastName}, ${e.firstName} (${e.legajo})`,
            subtitle: `${pos?.name ?? '—'} · ${sec?.name ?? '—'}`,
            onSelect: () => {
              navigate({
                module: 'personal',
                section: 'legajo',
                selectedEmployeeId: e.id,
                selectedEmployeeTab: 'resumen'
              });
              setSearchOpen(false);
              setSearchQuery('');
            }
          });
        });
    }

    if (permissions.canViewManagement) {
      data.products
        .filter((p) => `${p.name} ${p.sku} ${p.subcategory}`.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((p) => {
          results.push({
            id: `sr-${p.id}`,
            category: 'Inventarios',
            title: `${p.name} (${p.sku})`,
            subtitle: `Stock: ${p.currentStock} ${p.baseUnit} · Mín: ${p.minStock} ${p.baseUnit}`,
            onSelect: () => {
              navigate({ module: 'gestion', section: 'inventario', inventoryOnlyCritical: false });
              setSearchOpen(false);
              setSearchQuery('');
            }
          });
        });

      data.purchaseRequests
        .filter((r) => `${r.code} ${r.requestedByName} ${r.observations ?? ''}`.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((r) => {
          results.push({
            id: `sr-${r.id}`,
            category: 'Compras',
            title: `${r.code} — ${r.requestedByName}`,
            subtitle: `Estado: ${r.status.replace('_', ' ')} · ${r.lines.length} ítems`,
            onSelect: () => {
              navigate({
                module: 'gestion',
                section: 'compras',
                selectedPurchaseRequestId: r.id
              });
              setSearchOpen(false);
              setSearchQuery('');
            }
          });
        });
    }

    if (permissions.canViewOrganization) {
      data.procedures
        .filter((p) => `${p.title} ${p.code}`.toLowerCase().includes(q))
        .slice(0, 4)
        .forEach((p) => {
          results.push({
            id: `sr-${p.id}`,
            category: 'Procedimientos',
            title: `${p.code} — ${p.title}`,
            subtitle: `Frecuencia: ${p.frequency}`,
            onSelect: () => {
              navigate({ module: 'organizacion', section: 'checklists' });
              setSearchOpen(false);
              setSearchQuery('');
            }
          });
        });
    }

    return results;
  }, [searchQuery, data, permissions, activeUser, navigate]);

  const currentGroup = navGroups.find((g) => g.module === nav.module);
  const currentModuleLabel =
    nav.module === 'administracion' ? 'Configuración' : currentGroup?.label ?? 'Inicio';
  const currentSectionLabel =
    nav.module === 'administracion'
      ? nav.section === 'auditoria'
        ? 'Auditoría de actividad'
        : nav.section === 'automatizaciones' || nav.section === 'arquitectura'
          ? 'Automatizaciones'
          : 'Usuarios y roles'
      : currentGroup?.sections.find((s) => s.id === nav.section)?.label ??
        (nav.section === 'legajo' ? 'Legajos' : nav.section);

  const handleSelectNav = (module: AppModule, section: string) => {
    navigate({
      module,
      section,
      inventoryOnlyCritical: undefined,
      checklistStatusFilter: undefined
    });
    setExpandedGroup(module);
    setMobileMenuOpen(false);
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#181615] text-[#F5F2EC] select-none">
      {/* Brand Header with Authentic La Rueda 1975 Logo */}
      <div className="px-4 py-4 border-b border-[#2C2825] flex items-center justify-between gap-2">
        {!sidebarCollapsed || isMobile ? (
          <button
            type="button"
            onClick={() => handleSelectNav('inicio', 'resumen')}
            className="flex items-center gap-3 text-left group cursor-pointer min-w-0"
          >
            <img
              src={LOGO_SRC}
              alt="Logo Restaurant La Rueda 1975"
              className="w-10 h-10 object-contain shrink-0 rounded-full"
            />
            <div className="min-w-0">
              <div className="font-editorial text-xl font-semibold tracking-tight text-white leading-none truncate">
                La Rueda 1975
              </div>
              <div className="mt-1 text-[11px] text-[#A89F95] tracking-wide truncate">
                Puerto Iguazú
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSelectNav('inicio', 'resumen')}
            className="mx-auto cursor-pointer"
            title="La Rueda 1975"
          >
            <img
              src={LOGO_SRC}
              alt="La Rueda 1975"
              className="w-9 h-9 object-contain rounded-full"
            />
          </button>
        )}

        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
            className="p-2 text-[#A89F95] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            className="p-1.5 text-[#A89F95] hover:text-white rounded hover:bg-[#262320] cursor-pointer shrink-0"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Primary 5-Module Navigation Tree */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" aria-label="Navegación principal">
        {navGroups
          .filter((g) => g.visible)
          .map((group) => {
            const Icon = group.icon;
            const isActiveModule = nav.module === group.module;
            const isExpanded = expandedGroup === group.module || isActiveModule;
            const hasMultiple = group.sections.length > 1;

            return (
              <div key={group.module}>
                {group.module === 'analitica' && (
                  <div className="my-2.5 border-t border-[#2C2825]" aria-hidden="true" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (hasMultiple && (!sidebarCollapsed || isMobile)) {
                      if (expandedGroup === group.module && isActiveModule) {
                        setExpandedGroup('inicio');
                      } else {
                        setExpandedGroup(group.module);
                        if (!isActiveModule) {
                          handleSelectNav(group.module, group.sections[0].id);
                        }
                      }
                    } else {
                      handleSelectNav(group.module, group.sections[0].id);
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    isActiveModule
                      ? group.module === 'analitica'
                        ? 'bg-[#1769C2] text-white'
                        : 'bg-[#7C2D36] text-white'
                      : 'text-[#D6CFC5] hover:bg-[#262320] hover:text-white'
                  }`}
                  title={sidebarCollapsed && !isMobile ? group.label : undefined}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {(!sidebarCollapsed || isMobile) && (
                      <span className="truncate whitespace-nowrap">{group.label}</span>
                    )}
                  </span>
                  {(!sidebarCollapsed || isMobile) && hasMultiple && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {(!sidebarCollapsed || isMobile) && hasMultiple && isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l border-[#332E2A] space-y-0.5">
                    {group.sections.map((sec) => {
                      const activeSec =
                        isActiveModule &&
                        (nav.section === sec.id || (sec.id === 'directorio' && nav.section === 'legajo'));
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => handleSelectNav(group.module, sec.id)}
                          className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap truncate ${
                            activeSec
                              ? 'text-white bg-[#2B2724]'
                              : 'text-[#A89F95] hover:text-white hover:bg-[#23201D]'
                          }`}
                        >
                          {sec.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* Discreet Utility Link for Admin / Demo Controls */}
      {permissions.canViewAdmin && (
        <div className="border-t border-[#2C2825] px-3 py-3">
          <button
            type="button"
            onClick={() => handleSelectNav('administracion', 'roles')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              nav.module === 'administracion'
                ? 'bg-[#2B2724] text-white'
                : 'text-[#A89F95] hover:text-white hover:bg-[#23201D]'
            }`}
            title={sidebarCollapsed && !isMobile ? 'Configuración' : undefined}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            {(!sidebarCollapsed || isMobile) && (
              <span className="truncate whitespace-nowrap">Configuración</span>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F7F4] text-[#1C1917]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-200 no-print ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl">{renderSidebarContent(true)}</div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E6E2D8] px-4 lg:px-8 flex items-center justify-between gap-3 lg:gap-5 no-print">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir navegación"
              className="lg:hidden p-2 -ml-2 text-[#1C1917] hover:bg-[#F2EFE9] rounded-md cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Ubicación actual" className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
              <span className="text-[#6B635B] whitespace-nowrap">{currentModuleLabel}</span>
              <span className="text-[#C7C0B5]" aria-hidden="true">/</span>
              <span className="text-[#1C1917] font-semibold truncate max-w-[130px] sm:max-w-[200px]">
                {currentSectionLabel}
              </span>
            </nav>
          </div>

          {/* Enlarged Prominent Search Bar (Desktop/Tablet inline, Mobile trigger) */}
          <div className="hidden md:block relative flex-1 max-w-md xl:max-w-lg">
            <Search className="w-4 h-4 text-[#736B63] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                setAlertsOpen(false);
                setRoleMenuOpen(false);
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              placeholder="Buscar empleados, productos, compras o procedimientos..."
              aria-label="Búsqueda global"
              className="w-full pl-9 pr-8 py-1.5 text-sm text-[#1C1917] bg-[#F8F7F4] border border-[#DFD9CE] hover:border-[#C9C2B6] focus:bg-white focus:border-[#7C2D36] focus:outline-none focus:ring-1 focus:ring-[#7C2D36] rounded-md placeholder:text-[#8C847A] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#736B63] hover:text-[#1C1917] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#E6E2D8] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="max-h-80 overflow-y-auto divide-y divide-[#F2EFE9]">
                  {searchResults.length === 0 ? (
                    <p className="p-4 text-xs text-[#6B635B]">
                      Sin resultados para "{searchQuery}" con el perfil actual.
                    </p>
                  ) : (
                    searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={res.onSelect}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F8F7F4] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[#1C1917] truncate">{res.title}</div>
                          <div className="text-xs text-[#6B635B] truncate">{res.subtitle}</div>
                        </div>
                        <span className="text-xs text-[#7C2D36] font-medium shrink-0">
                          {res.category}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden xl:inline text-xs font-mono tabular-nums text-[#6B635B] pr-3 border-r border-[#E6E2D8] whitespace-nowrap">
              {formatDateAR(todayISO())} · Modo demostración
            </span>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
              className="md:hidden p-2 text-[#5E5851] hover:text-[#1C1917] hover:bg-[#F2EFE9] rounded-md transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Operational Alerts Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAlertsOpen((o) => !o);
                  setRoleMenuOpen(false);
                }}
                aria-label="Alertas operativas"
                className="relative p-2 text-[#5E5851] hover:text-[#1C1917] hover:bg-[#F2EFE9] rounded-md transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {operationalAlerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[10px] font-mono font-semibold text-white bg-[#7C2D36] rounded flex items-center justify-center">
                    {operationalAlerts.length}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6E2D8] rounded-lg shadow-lg z-40">
                  <div className="px-4 py-3 border-b border-[#E6E2D8] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1C1917]">
                      Alertas activas
                    </span>
                    <button
                      type="button"
                      onClick={() => setAlertsOpen(false)}
                      className="text-xs text-[#6B635B] hover:text-[#1C1917] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="divide-y divide-[#EFECE5] max-h-80 overflow-y-auto">
                    {operationalAlerts.length === 0 ? (
                      <p className="p-4 text-xs text-[#6B635B]">Sin alertas pendientes para este perfil.</p>
                    ) : (
                      operationalAlerts.map((al) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={al.onClick}
                          className="w-full text-left px-4 py-3 hover:bg-[#F8F7F4] transition-colors cursor-pointer"
                        >
                          <div
                            className={`text-xs font-semibold ${
                              al.severity === 'danger'
                                ? 'text-[#C83E43]'
                                : al.severity === 'warning'
                                  ? 'text-[#D97706]'
                                  : 'text-[#1769C2]'
                            }`}
                          >
                            {al.title}
                          </div>
                          <p className="mt-0.5 text-xs text-[#6B635B] line-clamp-2">{al.detail}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Simplified Profile / Role Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRoleMenuOpen((o) => !o);
                  setAlertsOpen(false);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F8F7F4] border border-[#D6D0C4] hover:border-[#7C2D36] rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#7C2D36] shrink-0" />
                <span className="max-w-[120px] sm:max-w-[165px] truncate">{activeUser.roleLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B635B] shrink-0" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E6E2D8] rounded-lg shadow-lg z-40">
                  <div className="px-4 py-2.5 border-b border-[#E6E2D8]">
                    <p className="text-xs font-semibold text-[#1C1917]">Cambiar perfil</p>
                  </div>
                  <div className="py-1 max-h-80 overflow-y-auto divide-y divide-[#F2EFE9]">
                    {DEMO_USERS.map((u) => {
                      const active = u.roleId === activeUser.roleId;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchDemoRole(u.roleId);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 transition-colors cursor-pointer ${
                            active ? 'bg-[#7C2D36]/8' : 'hover:bg-[#F8F7F4]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-medium ${
                                active ? 'text-[#7C2D36]' : 'text-[#1C1917]'
                              }`}
                            >
                              {u.roleLabel}
                            </span>
                            {active && (
                              <span className="text-[11px] font-semibold text-[#7C2D36]">Activo</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B635B] mt-0.5">{u.title}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Discreet Single-Instance Global Footer */}
        <footer className="border-t border-[#E6E2D8] bg-white/70 px-4 sm:px-8 py-3 text-xs text-[#6B635B] flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
          <span>La Rueda 1975 · Puerto Iguazú, Misiones</span>
          <span>Tecnología y transformación digital por VEGEN</span>
        </footer>
      </div>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-start justify-center pt-16 px-4 no-print"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white border border-[#E6E2D8] rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E6E2D8]">
              <Search className="w-4 h-4 text-[#5E5851] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar empleados, legajos, productos, compras o procedimientos..."
                className="flex-1 text-sm text-[#1C1917] placeholder:text-[#9A938A] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-xs text-[#5E5851] hover:text-[#1C1917] px-2 py-1 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[#F2EFE9]">
              {searchQuery.trim().length < 2 ? (
                <p className="p-5 text-xs text-[#5E5851]">
                  Escribí al menos 2 caracteres para buscar en Organización, Gestión y Personal.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="p-5 text-xs text-[#5E5851]">
                  No se encontraron registros para "{searchQuery}" con el rol actual.
                </p>
              ) : (
                searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={res.onSelect}
                    className="w-full text-left px-4 py-3 hover:bg-[#F8F7F4] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1C1917] truncate">{res.title}</div>
                      <div className="text-xs text-[#5E5851] truncate">{res.subtitle}</div>
                    </div>
                    <span className="text-xs text-[#7C2D36] font-medium shrink-0">
                      {res.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {employeeModal && (
        <EmployeeProfileModal
          employeeId={employeeModal.employeeId}
          initialTab={employeeModal.initialTab}
          onClose={closeEmployeeProfile}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
