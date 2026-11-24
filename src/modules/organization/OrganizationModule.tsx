import React from 'react';
import { SectionHeader, SegmentedTabs } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { ChecklistsSection } from './ChecklistsSection';
import { ComplianceAnalyticsSection, ManualsDocumentsSection } from './ComplianceAndDocumentsSection';
import { OrgChartSection } from './OrgChartSection';
import { StaffingCalendarSection } from './StaffingCalendarSection';

export const OrganizationModule: React.FC = () => {
  const { data, nav, navigate } = useAppStore();

  const openDiscCount = data.discrepancies.filter((d) => d.status !== 'resuelta').length;
  const pendingVerifCount = data.checklistExecutions.filter(
    (c) => c.verificationStatus === 'enviado'
  ).length;

  const activeSection = ['organigrama', 'dotacion', 'checklists', 'cumplimiento', 'manuales'].includes(
    nav.section
  )
    ? nav.section
    : 'organigrama';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Organización"
        subtitle="Estructura operativa de La Rueda 1975: quién hace qué, cuándo y bajo qué procedimiento verificado."
      />

      <SegmentedTabs
        activeId={activeSection}
        onChange={(id) => navigate({ module: 'organizacion', section: id })}
        tabs={[
          { id: 'organigrama', label: 'Organigrama y sectores', count: data.sectors.length },
          { id: 'dotacion', label: 'Dotación y turnos' },
          { id: 'checklists', label: 'Procedimientos y checklists', count: pendingVerifCount },
          { id: 'cumplimiento', label: 'Discrepancias y analítica', count: openDiscCount },
          { id: 'manuales', label: 'Manuales y documentos', count: data.documents.length }
        ]}
      />

      {activeSection === 'organigrama' && <OrgChartSection />}
      {activeSection === 'dotacion' && <StaffingCalendarSection />}
      {activeSection === 'checklists' && <ChecklistsSection />}
      {activeSection === 'cumplimiento' && <ComplianceAnalyticsSection />}
      {activeSection === 'manuales' && <ManualsDocumentsSection />}
    </div>
  );
};
