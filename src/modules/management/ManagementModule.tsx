import React from 'react';
import { SectionHeader, SegmentedTabs } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { DataImportSection } from './DataImportSection';
import { InventorySection, WasteLossSection } from './InventoryAndWasteSection';
import { DemandForecastSection, ManagementDashboardSection } from './ManagementDashboardSection';
import { MenuEngineeringSection } from './MenuEngineeringSection';
import { PurchasesSection } from './PurchasesSection';

export const ManagementModule: React.FC = () => {
  const { data, permissions, nav, navigate } = useAppStore();

  const validSections = [
    ...(permissions.canViewFinancialMetrics ? ['dashboard', 'ventas', 'menu', 'planificacion'] : []),
    'compras',
    ...(permissions.canManageInventory ? ['inventario'] : []),
    ...(permissions.canRegisterLosses ? ['mermas'] : []),
    ...(permissions.canImportData ? ['importacion'] : [])
  ];

  const activeSection = validSections.includes(nav.section)
    ? nav.section
    : validSections[0] ?? 'compras';

  const pendingReqCount = data.purchaseRequests.filter(
    (r) => r.status === 'solicitado' || r.status === 'pendiente_aprobacion'
  ).length;
  const criticalCount = data.products.filter((p) => p.active && p.currentStock < p.minStock).length;

  const tabs = [
    ...(permissions.canViewFinancialMetrics
      ? [
          { id: 'dashboard', label: 'Dashboard gerencial' },
          { id: 'ventas', label: 'Ventas y comensales' },
          { id: 'menu', label: 'Ingeniería de menú' }
        ]
      : []),
    { id: 'compras', label: 'Compras y órdenes', count: pendingReqCount },
    ...(permissions.canManageInventory
      ? [{ id: 'inventario', label: 'Inventarios', count: criticalCount }]
      : []),
    ...(permissions.canRegisterLosses
      ? [{ id: 'mermas', label: 'Mermas y desperdicios', count: data.lossEvents.length }]
      : []),
    ...(permissions.canViewFinancialMetrics
      ? [{ id: 'planificacion', label: 'Planificación y demanda' }]
      : []),
    ...(permissions.canImportData ? [{ id: 'importacion', label: 'Importación de datos' }] : [])
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestión"
        subtitle="Inteligencia operativa y financiera de La Rueda 1975: ventas, ingeniería de menú, compras verificadas, inventarios y pérdidas."
      />

      <SegmentedTabs
        activeId={activeSection}
        onChange={(id) => navigate({ module: 'gestion', section: id })}
        tabs={tabs}
      />

      {activeSection === 'dashboard' && <ManagementDashboardSection mode="dashboard" />}
      {activeSection === 'ventas' && <ManagementDashboardSection mode="ventas" />}
      {activeSection === 'menu' && <MenuEngineeringSection />}
      {activeSection === 'compras' && <PurchasesSection />}
      {activeSection === 'inventario' && <InventorySection />}
      {activeSection === 'mermas' && <WasteLossSection />}
      {activeSection === 'planificacion' && <DemandForecastSection />}
      {activeSection === 'importacion' && <DataImportSection />}
    </div>
  );
};
