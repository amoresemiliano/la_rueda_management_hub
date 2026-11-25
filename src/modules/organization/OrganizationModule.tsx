import React from 'react';
import { BarChart3 } from 'lucide-react';
import { analyticsBtnClass, SectionHeader, SegmentedTabs } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { AnalyticsDiscrepanciesSection } from '../analytics/AnalyticsOrgAndPersonnelSection';
import { ChecklistsSection } from './ChecklistsSection';
import { ManualsDocumentsSection } from './ComplianceAndDocumentsSection';
import { OrgChartSection } from './OrgChartSection';
import { StaffingCalendarSection } from './StaffingCalendarSection';

export const OrganizationModule: React.FC = () => {
  const { data, permissions, nav, navigate } = useAppStore();

  const pendingVerifCount = data.checklistExecutions.filter(
    (c) => c.verificationStatus === 'enviado'
  ).length;

  // Preserve backward compatibility if a deep link points to 'cumplimiento'
  const isLegacyCompliance = nav.section === 'cumplimiento';
  const activeSection = ['organigrama', 'dotacion', 'checklists', 'manuales'].includes(nav.section)
    ? nav.section
    : 'organigrama';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Organización"
        subtitle="Estructura de sectores, dotación diaria, procedimientos y manuales vigentes."
        actions={
          permissions.canViewAnalytics && (
            <button
              type="button"
              onClick={() => navigate({ module: 'analitica', section: 'organizacion' })}
              className={analyticsBtnClass}
            >
              <BarChart3 className="w-4 h-4" />
              Ver analítica de Organización
            </button>
          )
        }
      />

      <SegmentedTabs
        activeId={activeSection}
        onChange={(id) => navigate({ module: 'organizacion', section: id, checklistStatusFilter: undefined })}
        tabs={[
          { id: 'organigrama', label: 'Organigrama', count: data.sectors.length },
          { id: 'dotacion', label: 'Dotación' },
          { id: 'checklists', label: 'Procedimientos', count: pendingVerifCount },
          { id: 'manuales', label: 'Manuales', count: data.documents.length }
        ]}
      />

      {isLegacyCompliance ? (
        <AnalyticsDiscrepanciesSection />
      ) : (
        <>
          {activeSection === 'organigrama' && <OrgChartSection />}
          {activeSection === 'dotacion' && <StaffingCalendarSection />}
          {activeSection === 'checklists' && <ChecklistsSection />}
          {activeSection === 'manuales' && <ManualsDocumentsSection />}
        </>
      )}
    </div>
  );
};
