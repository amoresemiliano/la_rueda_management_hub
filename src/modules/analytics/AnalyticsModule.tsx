import React, { useMemo } from 'react';
import { EmptyState, SectionHeader, SegmentedTabs } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { AnalyticsManagementSection } from './AnalyticsManagementSection';
import {
  AnalyticsAuditSection,
  AnalyticsDiscrepanciesSection,
  AnalyticsOrganizationSection,
  AnalyticsPersonnelSection
} from './AnalyticsOrgAndPersonnelSection';
import { AnalyticsOverviewSection } from './AnalyticsOverviewSection';

export const AnalyticsModule: React.FC = () => {
  const { data, permissions, nav, navigate } = useAppStore();

  const openDiscCount = data.discrepancies.filter((d) => d.status !== 'resuelta').length;

  const tabs = useMemo(() => {
    const list: Array<{ id: string; label: string; count?: number }> = [
      { id: 'resumen', label: 'Resumen general' },
      { id: 'organizacion', label: 'Organización' }
    ];
    if (permissions.canViewManagement || permissions.canViewFinancialMetrics) {
      list.push({ id: 'gestion', label: 'Gestión' });
    }
    if (permissions.canViewPersonnel && permissions.canViewAllEmployees) {
      list.push({ id: 'personal', label: 'Personal' });
    }
    list.push({ id: 'discrepancias', label: 'Discrepancias', count: openDiscCount });
    list.push({ id: 'auditoria', label: 'Auditoría y actividad', count: data.auditEvents.length });
    return list;
  }, [permissions, openDiscCount, data.auditEvents.length]);

  if (!permissions.canViewAnalytics) {
    return (
      <EmptyState
        title="Módulo Analítica restringido para este perfil"
        description="Cambiá el perfil en el selector superior (Dirección, Operación, Recursos Humanos, Compras o Administrador) para consultar tableros e indicadores."
      />
    );
  }

  const activeSection = tabs.some((t) => t.id === nav.section) ? nav.section : 'resumen';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analítica"
        subtitle="Indicadores consolidados, tendencias de ventas, ingeniería de menú, pérdidas, cumplimiento y auditoría."
      />

      <SegmentedTabs
        tabs={tabs}
        activeId={activeSection}
        onChange={(section) => navigate({ module: 'analitica', section })}
      />

      {activeSection === 'resumen' && <AnalyticsOverviewSection />}
      {activeSection === 'organizacion' && <AnalyticsOrganizationSection />}
      {activeSection === 'gestion' && <AnalyticsManagementSection />}
      {activeSection === 'personal' && <AnalyticsPersonnelSection />}
      {activeSection === 'discrepancias' && <AnalyticsDiscrepanciesSection />}
      {activeSection === 'auditoria' && <AnalyticsAuditSection />}
    </div>
  );
};
