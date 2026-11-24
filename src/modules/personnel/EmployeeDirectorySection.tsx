import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, Plus, Search } from 'lucide-react';
import {
  EmptyState,
  inputClass,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { ContractType } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { calculateTenureLabel, formatDateAR, todayISO } from '../../utils/formatters';

export const EmployeeDirectorySection: React.FC = () => {
  const { data, activeUser, permissions, navigate, createEmployee } = useAppStore();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [createOpen, setCreateOpen] = useState(false);

  // Create Employee Form (Scenario 1)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fictionalDocCode, setFictionalDocCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+54 9 3757 00-');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [hireDate, setHireDate] = useState(todayISO());
  const [sectorId, setSectorId] = useState('sec-salon');
  const [positionId, setPositionId] = useState('pos-mozo');
  const [contractType, setContractType] = useState<ContractType>('tiempo_indeterminado');
  const [weeklyBaseSalaryArs, setWeeklyBaseSalaryArs] = useState(235000);

  const sectorPositions = useMemo(
    () => data.positions.filter((p) => p.sectorId === sectorId),
    [data.positions, sectorId]
  );

  const visibleEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.employees.filter((emp) => {
      // Role privacy scope
      if (!permissions.canViewAllEmployees) {
        if (activeUser.roleId === 'colaborador') {
          if (emp.id !== activeUser.employeeId) return false;
        } else if (activeUser.managedSectorIds) {
          if (!activeUser.managedSectorIds.includes(emp.currentSectorId)) return false;
        }
      }
      if (sectorFilter !== 'todos' && emp.currentSectorId !== sectorFilter) return false;
      if (statusFilter !== 'todos' && emp.status !== statusFilter) return false;
      if (q) {
        const sec = data.sectors.find((s) => s.id === emp.currentSectorId)?.name ?? '';
        const pos = data.positions.find((p) => p.id === emp.currentPositionId)?.name ?? '';
        if (!`${emp.firstName} ${emp.lastName} ${emp.legajo} ${sec} ${pos}`.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data.employees, data.sectors, data.positions, permissions.canViewAllEmployees, activeUser, sectorFilter, statusFilter, search]);

  const handleSectorChangeInForm = (newSecId: string) => {
    setSectorId(newSecId);
    const firstPos = data.positions.find((p) => p.sectorId === newSecId);
    if (firstPos) setPositionId(firstPos.id);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !positionId) return;
    const sec = data.sectors.find((s) => s.id === sectorId);
    const created = createEmployee({
      firstName,
      lastName,
      fictionalDocCode,
      email,
      phone,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      hireDate,
      sectorId,
      positionId,
      supervisorEmployeeId: sec?.managerEmployeeId,
      contractType,
      weeklyBaseSalaryArs: Number(weeklyBaseSalaryArs) || 210000
    });
    setFirstName('');
    setLastName('');
    setFictionalDocCode('');
    setEmail('');
    setCreateOpen(false);
    navigate({
      module: 'personal',
      section: 'legajo',
      selectedEmployeeId: created.id,
      selectedEmployeeTab: 'resumen'
    });
  };

  return (
    <div className="space-y-5">
      {/* Privacy Scope Notice for Restricted Roles */}
      {!permissions.canViewAllEmployees && (
        <div className="p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md text-xs text-[#5E5851]">
          Alcance de visibilidad activo para <strong className="text-[#1C1917]">{activeUser.roleLabel}</strong>:{' '}
          {activeUser.roleId === 'colaborador'
            ? 'solo se muestra tu legajo personal autorizado.'
            : 'solo se muestran colaboradores de tus sectores asignados (sin acceso a datos salariales ni disciplinarios privados).'}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-[#5E5851] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, apellido, legajo o puesto..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-xs text-[#1C1917]"
          >
            <option value="todos">Todos los sectores</option>
            {data.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-xs text-[#1C1917]"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="licencia">En licencia</option>
            <option value="suspendido">Suspendidos</option>
            <option value="egresado">Egresados</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex border border-[#D6D0C4] rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Vista tabla"
              className={`p-2 cursor-pointer ${
                viewMode === 'table' ? 'bg-[#181615] text-white' : 'bg-white text-[#5E5851]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-label="Vista tarjetas"
              className={`p-2 cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#181615] text-white' : 'bg-white text-[#5E5851]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {permissions.canCreateOrTransferEmployee && (
            <button type="button" onClick={() => setCreateOpen(true)} className={primaryBtnClass}>
              <Plus className="w-4 h-4" />
              Alta de colaborador
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {visibleEmployees.length === 0 ? (
        <EmptyState
          title="Sin colaboradores coincidentes"
          description="Modificá los filtros de búsqueda o sector."
        />
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6E2D8] bg-[#F8F7F4] text-left text-xs text-[#5E5851]">
                  <th className="py-2.5 px-4 font-medium">Legajo / Nombre</th>
                  <th className="py-2.5 px-4 font-medium">Sector actual</th>
                  <th className="py-2.5 px-4 font-medium">Puesto actual</th>
                  <th className="py-2.5 px-4 font-medium">Ingreso / Antigüedad</th>
                  <th className="py-2.5 px-4 font-medium">Supervisor</th>
                  <th className="py-2.5 px-4 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {visibleEmployees.map((emp) => {
                  const sec = data.sectors.find((s) => s.id === emp.currentSectorId);
                  const pos = data.positions.find((p) => p.id === emp.currentPositionId);
                  const sup = data.employees.find((e) => e.id === emp.supervisorEmployeeId);
                  return (
                    <tr
                      key={emp.id}
                      onClick={() =>
                        navigate({
                          module: 'personal',
                          section: 'legajo',
                          selectedEmployeeId: emp.id,
                          selectedEmployeeTab: 'resumen'
                        })
                      }
                      className="hover:bg-[#F8F7F4] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-[#7C2D36]">
                          {emp.lastName}, {emp.firstName}
                        </div>
                        <div className="text-[11px] font-mono text-[#5E5851]">{emp.legajo}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#1C1917]">{sec?.name ?? '—'}</td>
                      <td className="py-2.5 px-4 text-xs text-[#5E5851]">{pos?.name ?? '—'}</td>
                      <td className="py-2.5 px-4 text-xs">
                        <div className="font-mono tabular-nums text-[#1C1917]">
                          {formatDateAR(emp.hireDate)}
                        </div>
                        <div className="text-[11px] text-[#5E5851]">
                          {calculateTenureLabel(emp.hireDate)}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#5E5851]">
                        {sup ? `${sup.firstName} ${sup.lastName}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <StatusText
                          label={emp.status === 'activo' ? 'Activo' : emp.status}
                          tone={
                            emp.status === 'activo'
                              ? 'positive'
                              : emp.status === 'licencia'
                                ? 'warning'
                                : 'danger'
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEmployees.map((emp) => {
            const sec = data.sectors.find((s) => s.id === emp.currentSectorId);
            const pos = data.positions.find((p) => p.id === emp.currentPositionId);
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() =>
                  navigate({
                    module: 'personal',
                    section: 'legajo',
                    selectedEmployeeId: emp.id,
                    selectedEmployeeTab: 'resumen'
                  })
                }
                className="text-left bg-white border border-[#E6E2D8] hover:border-[#7C2D36] rounded-lg p-5 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-[#5E5851]">
                  <span className="font-mono">{emp.legajo}</span>
                  <StatusText
                    label={emp.status}
                    tone={emp.status === 'activo' ? 'positive' : 'warning'}
                  />
                </div>
                <div className="mt-1.5 text-base font-semibold text-[#1C1917]">
                  {emp.lastName}, {emp.firstName}
                </div>
                <div className="mt-1 text-xs text-[#7C2D36] font-medium">{pos?.name}</div>
                <div className="mt-2 pt-2 border-t border-[#F2EFE9] text-xs text-[#5E5851] flex items-center justify-between">
                  <span>{sec?.name}</span>
                  <span>Antigüedad: {calculateTenureLabel(emp.hireDate)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create Employee Modal (Scenario 1) */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Alta de colaborador (Personal + Organización)"
        subtitle="Se genera un único legajo digital con asignación inmediata en el organigrama. Usar datos sintéticos."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Santiago"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Apellido *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Morales"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Código ID ficticio (Demo)</label>
              <input
                type="text"
                value={fictionalDocCode}
                onChange={(e) => setFictionalDocCode(e.target.value)}
                placeholder="DEMO-ID-40900"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fecha de ingreso *</label>
              <input
                type="date"
                required
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Modalidad contractual</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className={inputClass}
              >
                <option value="tiempo_indeterminado">Tiempo indeterminado</option>
                <option value="temporada">Temporada</option>
                <option value="plazo_fijo">Plazo fijo</option>
                <option value="eventual">Eventual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md">
            <div>
              <label className={labelClass}>Sector asignado (Organización) *</label>
              <select
                value={sectorId}
                onChange={(e) => handleSectorChangeInForm(e.target.value)}
                className={inputClass}
              >
                {data.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Puesto inicial *</label>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                className={inputClass}
              >
                {sectorPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Email sintético</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@demo-larueda1975.invalid"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono demo</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Referencia semanal (ARS)</label>
              <input
                type="number"
                min={50000}
                step={1000}
                value={weeklyBaseSalaryArs}
                onChange={(e) => setWeeklyBaseSalaryArs(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contacto de emergencia</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Familiar Demo"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono de emergencia</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+54 9 3757 00-0000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setCreateOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Dar de alta colaborador
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
