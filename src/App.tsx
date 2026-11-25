import React from 'react';
import { AppShell } from './app/AppShell';
import { AdminModule } from './modules/admin/AdminModule';
import { AnalyticsModule } from './modules/analytics/AnalyticsModule';
import { ExecutiveHome } from './modules/home/ExecutiveHome';
import { ManagementModule } from './modules/management/ManagementModule';
import { OrganizationModule } from './modules/organization/OrganizationModule';
import { PersonnelModule } from './modules/personnel/PersonnelModule';
import { AppStoreProvider, useAppStore } from './services/store';

const AppRouter: React.FC = () => {
  const { isLoading, nav } = useAppStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <img
            src="/assets/aistudio/logo_la_rueda_transparent.png"
            alt="La Rueda 1975"
            className="w-16 h-16 object-contain mx-auto"
          />
          <div className="font-editorial text-3xl font-semibold text-[#1C1917]">
            La Rueda 1975
          </div>
          <p className="text-xs text-[#5E5851]">
            Cargando entorno operativo local (Modo demostración)...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      {nav.module === 'inicio' && <ExecutiveHome />}
      {nav.module === 'organizacion' && <OrganizationModule />}
      {nav.module === 'gestion' && <ManagementModule />}
      {nav.module === 'personal' && <PersonnelModule />}
      {nav.module === 'analitica' && <AnalyticsModule />}
      {nav.module === 'administracion' && <AdminModule />}
    </AppShell>
  );
};

export function App() {
  return (
    <AppStoreProvider>
      <AppRouter />
    </AppStoreProvider>
  );
}

export default App;
