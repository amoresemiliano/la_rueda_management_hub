import React from 'react';
import { EmptyState, SectionHeader, SegmentedTabs } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { AttendanceWeeklyReportSection, LeavesAndTrainingSection } from './AttendanceAndLeavesSection';
import { EmployeeDirectorySection } from './EmployeeDirectorySection';
import { EmployeeProfileView } from './EmployeeProfileView';
import { LoansSection, PayrollPreparationSection } from './LoansAndPayrollSection';

export const PersonnelModule: React.FC = () => {
  const { data, activeUser, permissions, nav, navigate } = useAppStore();

  if (!permissions.canViewPersonnel) {
    return (
      <EmptyState
        title="Acceso restringido al módulo Personal"
        description="Cambiá el rol de demostración desde la barra superior (por ejemplo RRHH — Raquel o Administrador VEGEN) para acceder a legajos, novedades y pre-liquidación."
      />
    );
  }

  const tabs = [
    { id: 'directorio', label: 'Directorio y legajos', count: data.employees.length },
    { id: 'asistencia', label: 'Asistencias y parte semanal' },
    {
      id: 'vacaciones',
      label: 'Vacaciones y licencias',
      count: data.leaveRequests.filter((l) => l.status === 'pendiente').length
    },
    { id: 'desempeno', label: 'Desempeño y capacitaciones' },
    {
      id: 'prestamos',
      label: 'Préstamos y adelantos',
      count: data.loans.filter((l) => l.status === 'aprobado' || l.status === 'en_curso').length
    },
    ...(permissions.canViewSalaryAndPayroll
      ? [{ id: 'preliquidacion', label: 'Propinas y pre-liquidación' }]
      : [])
  ];

  const isProfileView = nav.section === 'legajo';
  const activeTab = isProfileView
    ? 'directorio'
    : tabs.some((t) => t.id === nav.section)
      ? nav.section
      : 'directorio';

  const resolvedEmployeeId =
    nav.selectedEmployeeId ??
    activeUser.employeeId ??
    data.employees[0]?.id ??
    '';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Personal y Recursos Humanos"
        subtitle="Legajos digitales integrales, historial de puestos, parte semanal de novedades, vacaciones, desempeño, capacitaciones, adelantos y pre-liquidación semanal."
      />

      <SegmentedTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={(section) => navigate({ module: 'personal', section })}
      />

      {isProfileView ? (
        <EmployeeProfileView employeeId={resolvedEmployeeId} />
      ) : (
        <>
          {activeTab === 'directorio' && <EmployeeDirectorySection />}
          {activeTab === 'asistencia' && <AttendanceWeeklyReportSection />}
          {activeTab === 'vacaciones' && <LeavesAndTrainingSection mode="vacaciones" />}
          {activeTab === 'desempeno' && <LeavesAndTrainingSection mode="desempeno" />}
          {activeTab === 'prestamos' && <LoansSection />}
          {activeTab === 'preliquidacion' && <PayrollPreparationSection />}
        </>
      )}
    </div>
  );
};
