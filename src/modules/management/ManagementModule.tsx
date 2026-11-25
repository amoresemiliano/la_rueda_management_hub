import React from 'react';
import { BarChart3 } from 'lucide-react';
import { analyticsBtnClass, SectionHeader, SegmentedTabs } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { DataImportSection } from './DataImportSection';
import { InventorySection, WasteLossSection } from './InventoryAndWasteSection';
import { DemandForecastSection, ManagementDashboardSection } from './ManagementDashboardSection';
import { MenuEngineeringSection } from './MenuEngineeringSection';
import { OperationalSalesSection } from './OperationalSalesSection';
import { PurchasesSection } from './PurchasesSection';

export const ManagementModule: React.FC = () => {
  const { data, permissions, nav, navigate } = useAppStore();

  const operationalSections = [
    ...(permissions.canViewFinancialMetrics ? ['ventas'] : []),
    'compras',
    ...(permissions.canManageInventory ? ['inventario'] : []),
    ...(permissions.canRegisterLosses ? ['mermas'] : []),
    ...(permissions.canViewFinancialMetrics ? ['planificacion'] : []),
    ...(permissions.canImportData ? ['importacion'] : [])
  ];

  // Route compatibility for legacy links ('dashboard', 'menu')
  const isLegacyDashboard = nav.section === 'dashboard' && permissions.canViewFinancialMetrics;
  const isLegacyMenu = nav.section === 'menu' && permissions.canViewFinancialMetrics;

  const activeSection = operationalSections.includes(nav.section)
    ? nav.section
    : operationalSections[0] ?? 'compras';

  const pendingReqCount = data.purchaseRequests.filter(
    (r) => r.status === 'solicitado' || r.status === 'pendiente_aprobacion'
  ).length;
  const criticalCount = data.products.filter((p) => p.active && p.currentStock < p.minStock).length;

  const tabs = [
    ...(permissions.canViewFinancialMetrics ? [{ id: 'ventas', label: 'Ventas' }] : []),
    { id: 'compras', label: 'Compras', count: pendingReqCount },
    ...(permissions.canManageInventory
      ? [{ id: 'inventario', label: 'Inventarios', count: criticalCount }]
      : []),
    ...(permissions.canRegisterLosses
      ? [{ id: 'mermas', label: 'Mermas y desperdicios', count: data.lossEvents.length }]
      : []),
    ...(permissions.canViewFinancialMetrics
      ? [{ id: 'planificacion', label: 'Planificación' }]
      : []),
    ...(permissions.canImportData ? [{ id: 'importacion', label: 'Importación' }] : [])
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestión"
        subtitle="Operación comercial y suministros: ventas, compras, inventarios, mermas, planificación e importación."
        actions={
          permissions.canViewAnalytics && (
            <button
              type="button"
              onClick={() => navigate({ module: 'analitica', section: 'gestion' })}
              className={analyticsBtnClass}
            >
              <BarChart3 className="w-4 h-4" />
              Ver analítica de Gestión
            </button>
          )
        }
      />

      <SegmentedTabs
        activeId={activeSection}
        onChange={(id) =>
          navigate({
            module: 'gestion',
            section: id,
            inventoryOnlyCritical: undefined
          })
        }
        tabs={tabs}
      />

      {isLegacyDashboard ? (
        <ManagementDashboardSection mode="dashboard" />
      ) : isLegacyMenu ? (
        <MenuEngineeringSection />
      ) : (
        <>
          {activeSection === 'ventas' && <OperationalSalesSection />}
          {activeSection === 'compras' && <PurchasesSection />}
          {activeSection === 'inventario' && <InventorySection />}
          {activeSection === 'mermas' && <WasteLossSection />}
          {activeSection === 'planificacion' && <DemandForecastSection />}
          {activeSection === 'importacion' && <DataImportSection />}
        </>
      )}
    </div>
  );
};
