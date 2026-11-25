import React from 'react';
import { BarChart3 } from 'lucide-react';
import { analyticsBtnClass, EmptyState, SectionHeader, SegmentedTabs } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { AttendanceWeeklyReportSection, LeavesAndTrainingSection } from './AttendanceAndLeavesSection';
import { EmployeeDirectorySection } from './EmployeeDirectorySection';
import { LoansSection, PayrollPreparationSection } from './LoansAndPayrollSection';

export const PersonnelModule: React.FC = () => {
  const { data, permissions, nav, navigate } = useAppStore();

  if (!permissions.canViewPersonnel) {
    return (
      <EmptyState
        title="Acceso restringido al módulo Personal"
        description="Cambiá de perfil en el selector superior (Recursos Humanos o Administrador) para acceder a legajos, novedades y liquidación."
      />
    );
  }

  const tabs = [
    { id: 'directorio', label: 'Legajos', count: data.employees.length },
    { id: 'asistencia', label: 'Asistencia' },
    {
      id: 'vacaciones',
      label: 'Vacaciones',
      count: data.leaveRequests.filter((l) => l.status === 'pendiente').length
    },
    { id: 'desempeno', label: 'Desempeño' },
    {
      id: 'prestamos',
      label: 'Adelantos',
      count: data.loans.filter((l) => l.status === 'aprobado' || l.status === 'en_curso').length
    },
    ...(permissions.canViewSalaryAndPayroll
      ? [{ id: 'preliquidacion', label: 'Liquidación' }]
      : [])
  ];

  const activeTab = tabs.some((t) => t.id === nav.section) ? nav.section : 'directorio';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Personal"
        subtitle="Ciclo laboral del equipo: legajos digitales, asistencia, vacaciones, desempeño, adelantos y pre-liquidación semanal."
        actions={
          permissions.canViewAnalytics &&
          permissions.canViewAllEmployees && (
            <button
              type="button"
              onClick={() => navigate({ module: 'analitica', section: 'personal' })}
              className={analyticsBtnClass}
            >
              <BarChart3 className="w-4 h-4" />
              Ver analítica de Personal
            </button>
          )
        }
      />

      <SegmentedTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={(section) => navigate({ module: 'personal', section })}
      />

      {activeTab === 'directorio' && <EmployeeDirectorySection />}
      {activeTab === 'asistencia' && <AttendanceWeeklyReportSection />}
      {activeTab === 'vacaciones' && <LeavesAndTrainingSection mode="vacaciones" />}
      {activeTab === 'desempeno' && <LeavesAndTrainingSection mode="desempeno" />}
      {activeTab === 'prestamos' && <LoansSection />}
      {activeTab === 'preliquidacion' && <PayrollPreparationSection />}
    </div>
  );
};
