import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Plus, UserCheck, Users } from 'lucide-react';
import {
  inputClass,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { Position, Sector } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { todayISO } from '../../utils/formatters';

export const OrgChartSection: React.FC = () => {
  const { data, permissions, nav, navigate, createSector, updateSector, createPosition } = useAppStore();
  const today = todayISO();

  const [selectedSectorId, setSelectedSectorId] = useState<string>(
    nav.selectedSectorId ?? data.sectors[8]?.id ?? data.sectors[0]?.id ?? ''
  );
  const [expandedPositionIds, setExpandedPositionIds] = useState<Record<string, boolean>>({});
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [positionModalOpen, setPositionModalOpen] = useState(false);

  // Sector form state
  const [secName, setSecName] = useState('');
  const [secCode, setSecCode] = useState('');
  const [secDesc, setSecDesc] = useState('');
  const [secMinHeadcount, setSecMinHeadcount] = useState(2);
  const [secManagerId, setSecManagerId] = useState('');

  // Position form state
  const [posName, setPosName] = useState('');
  const [posLevel, setPosLevel] = useState<Position['level']>('operativo');
  const [posTarget, setPosTarget] = useState(2);
  const [posDesc, setPosDesc] = useState('');

  const sectorStats = useMemo(() => {
    const map = new Map<
      string,
      {
        assigned: number;
        active: number;
        scheduledToday: number;
        absencesToday: number;
        vacant: number;
        managerName: string;
      }
    >();

    data.sectors.forEach((sec) => {
      const secEmps = data.employees.filter((e) => e.currentSectorId === sec.id);
      const activeEmps = secEmps.filter((e) => e.status === 'activo');
      const todayShifts = data.shiftAssignments.filter(
        (s) => s.sectorId === sec.id && s.operationalDate === today
      );
      const scheduledToday = todayShifts.filter(
        (s) => s.status === 'programado' || s.status === 'presente'
      ).length;
      const absencesToday = todayShifts.filter(
        (s) => s.status === 'ausente_justificado' || s.status === 'ausente_injustificado'
      ).length;
      const secPositions = data.positions.filter((p) => p.sectorId === sec.id && p.active);
      const totalTarget = secPositions.reduce((acc, p) => acc + p.targetHeadcount, 0);
      const vacant = Math.max(0, totalTarget - activeEmps.length);
      const mgr = data.employees.find((e) => e.id === sec.managerEmployeeId);

      map.set(sec.id, {
        assigned: secEmps.length,
        active: activeEmps.length,
        scheduledToday,
        absencesToday,
        vacant,
        managerName: mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Sin asignar'
      });
    });
    return map;
  }, [data.sectors, data.employees, data.positions, data.shiftAssignments, today]);

  const selectedSector = data.sectors.find((s) => s.id === selectedSectorId) ?? data.sectors[0];
  const selectedPositions = useMemo(
    () => data.positions.filter((p) => p.sectorId === selectedSector?.id),
    [data.positions, selectedSector]
  );

  const openCreateSector = () => {
    setEditingSector(null);
    setSecName('');
    setSecCode('');
    setSecDesc('');
    setSecMinHeadcount(2);
    setSecManagerId('');
    setSectorModalOpen(true);
  };

  const openEditSector = (sec: Sector) => {
    setEditingSector(sec);
    setSecName(sec.name);
    setSecCode(sec.code);
    setSecDesc(sec.description);
    setSecMinHeadcount(sec.dailyMinHeadcount);
    setSecManagerId(sec.managerEmployeeId ?? '');
    setSectorModalOpen(true);
  };

  const handleSaveSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secName.trim()) return;
    if (editingSector) {
      updateSector(editingSector.id, {
        name: secName.trim(),
        description: secDesc.trim(),
        dailyMinHeadcount: Number(secMinHeadcount) || 1,
        managerEmployeeId: secManagerId || undefined
      });
    } else {
      createSector({
        name: secName.trim(),
        code: secCode.trim() || secName.slice(0, 3).toUpperCase(),
        description: secDesc.trim(),
        dailyMinHeadcount: Number(secMinHeadcount) || 1,
        managerEmployeeId: secManagerId || undefined
      });
    }
    setSectorModalOpen(false);
  };

  const handleSavePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSector || !posName.trim()) return;
    createPosition({
      sectorId: selectedSector.id,
      name: posName.trim(),
      level: posLevel,
      targetHeadcount: Math.max(1, Number(posTarget) || 1),
      description: posDesc.trim()
    });
    setPosName('');
    setPosDesc('');
    setPositionModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1C1917]">
            Estructura jerárquica — {data.organization.name}
          </h2>
          <p className="text-xs text-[#5E5851] mt-0.5">
            Restaurante → Sector → Puesto → Colaboradores asignados (vinculados en vivo con el módulo Personal)
          </p>
        </div>
        {permissions.canEditOrgStructure && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={openCreateSector} className={secondaryBtnClass}>
              <Plus className="w-4 h-4" />
              Nuevo sector
            </button>
            <button
              type="button"
              onClick={() => setPositionModalOpen(true)}
              className={primaryBtnClass}
              disabled={!selectedSector}
            >
              <Plus className="w-4 h-4" />
              Nuevo puesto
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sectors Tree List */}
        <div className="lg:col-span-5 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1C1917]">
              Áreas y sectores ({data.sectors.length})
            </span>
            <span className="text-xs font-mono tabular-nums text-[#5E5851]">
              {data.employees.length} personas
            </span>
          </div>
          <div className="divide-y divide-[#F2EFE9] max-h-[620px] overflow-y-auto">
            {data.sectors.map((sec) => {
              const st = sectorStats.get(sec.id);
              const isSelected = selectedSector?.id === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectorId(sec.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#7C2D36]/8' : 'hover:bg-[#F8F7F4]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-[#7C2D36]' : 'text-[#1C1917]'
                      }`}
                    >
                      {sec.name}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-[#5E5851]">
                      {st?.assigned ?? 0} asig. · {st?.scheduledToday ?? 0} hoy
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#5E5851]">
                    <span>Resp: {st?.managerName}</span>
                    {st && st.absencesToday > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#B91C1C] font-medium">
                          {st.absencesToday} ausencia(s)
                        </span>
                      </>
                    )}
                    {st && st.vacant > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#B45309] font-medium">{st.vacant} vacante(s)</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Sector Detail + Expandable Positions & Linked Employees */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSector && (
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#EFECE5]">
                <div>
                  <div className="text-xs text-[#5E5851] font-mono">
                    Código {selectedSector.code} · Dotación mínima diaria: {selectedSector.dailyMinHeadcount}
                  </div>
                  <h3 className="mt-1 text-2xl font-editorial font-semibold text-[#1C1917]">
                    {selectedSector.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#5E5851]">{selectedSector.description}</p>
                </div>
                {permissions.canEditOrgStructure && (
                  <button
                    type="button"
                    onClick={() => openEditSector(selectedSector)}
                    className={secondaryBtnClass}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar sector
                  </button>
                )}
              </div>

              {/* Sector Metric Summary Strip */}
              {(() => {
                const st = sectorStats.get(selectedSector.id);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-b border-[#EFECE5]">
                    <div>
                      <div className="text-[11px] text-[#5E5851]">Dotación asignada</div>
                      <div className="mt-0.5 text-lg font-mono font-semibold tabular-nums">
                        {st?.assigned ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#5E5851]">Activos</div>
                      <div className="mt-0.5 text-lg font-mono font-semibold tabular-nums text-[#15803D]">
                        {st?.active ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#5E5851]">Turnos hoy</div>
                      <div className="mt-0.5 text-lg font-mono font-semibold tabular-nums">
                        {st?.scheduledToday ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#5E5851]">Ausencias hoy</div>
                      <div
                        className={`mt-0.5 text-lg font-mono font-semibold tabular-nums ${
                          (st?.absencesToday ?? 0) > 0 ? 'text-[#B91C1C]' : 'text-[#5E5851]'
                        }`}
                      >
                        {st?.absencesToday ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#5E5851]">Vacantes</div>
                      <div
                        className={`mt-0.5 text-lg font-mono font-semibold tabular-nums ${
                          (st?.vacant ?? 0) > 0 ? 'text-[#B45309]' : 'text-[#5E5851]'
                        }`}
                      >
                        {st?.vacant ?? 0}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Expandable Positions List */}
              <div className="mt-4 space-y-2.5">
                <div className="text-xs font-semibold text-[#5E5851]">
                  Puestos del sector ({selectedPositions.length}) — seleccioná un puesto para ver colaboradores
                </div>
                {selectedPositions.map((pos) => {
                  const posEmps = data.employees.filter((e) => e.currentPositionId === pos.id);
                  const isOpen = expandedPositionIds[pos.id] ?? true;
                  const vacant = Math.max(0, pos.targetHeadcount - posEmps.filter((e) => e.status === 'activo').length);

                  return (
                    <div key={pos.id} className="border border-[#E6E2D8] rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPositionIds((prev) => ({ ...prev, [pos.id]: !isOpen }))
                        }
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#F8F7F4] hover:bg-[#F2EFE9] transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-[#5E5851] shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#5E5851] shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-[#1C1917] truncate">
                            {pos.name}
                          </span>
                          <span className="text-xs text-[#5E5851] hidden sm:inline">
                            · {pos.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono tabular-nums shrink-0">
                          <span className="text-[#1C1917]">
                            {posEmps.length}/{pos.targetHeadcount}
                          </span>
                          {vacant > 0 && <StatusText label={`${vacant} vac.`} tone="warning" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-[#F2EFE9] bg-white">
                          {posEmps.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-[#5E5851]">
                              Puesto actualmente vacante. Podés dar de alta o trasladar personal desde el módulo Personal.
                            </div>
                          ) : (
                            posEmps.map((emp) => {
                              const todayShift = data.shiftAssignments.find(
                                (s) => s.employeeId === emp.id && s.operationalDate === today
                              );
                              return (
                                <div
                                  key={emp.id}
                                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-[#F8F7F4]"
                                >
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate({
                                          module: 'personal',
                                          section: 'legajo',
                                          selectedEmployeeId: emp.id,
                                          selectedEmployeeTab: 'resumen'
                                        })
                                      }
                                      className="text-sm font-medium text-[#7C2D36] hover:underline text-left cursor-pointer"
                                    >
                                      {emp.lastName}, {emp.firstName}
                                    </button>
                                    <div className="text-[11px] text-[#5E5851] flex items-center gap-2">
                                      <span className="font-mono">{emp.legajo}</span>
                                      <span aria-hidden="true">·</span>
                                      <span>Estado: {emp.status}</span>
                                      {todayShift && (
                                        <>
                                          <span aria-hidden="true">·</span>
                                          <span>
                                            Hoy: {todayShift.status.replace('_', ' ')} ({todayShift.startTime}–{todayShift.endTime})
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate({
                                        module: 'personal',
                                        section: 'legajo',
                                        selectedEmployeeId: emp.id,
                                        selectedEmployeeTab: 'asistencia'
                                      })
                                    }
                                    className="text-xs text-[#5E5851] hover:text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    Abrir legajo →
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Sector Modal */}
      <Modal
        open={sectorModalOpen}
        onClose={() => setSectorModalOpen(false)}
        title={editingSector ? `Editar sector: ${editingSector.name}` : 'Crear nuevo sector'}
      >
        <form onSubmit={handleSaveSector} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nombre del sector *</label>
              <input
                type="text"
                required
                value={secName}
                onChange={(e) => setSecName(e.target.value)}
                placeholder="Ej. Eventos y Banquetes"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Código</label>
              <input
                type="text"
                disabled={!!editingSector}
                value={secCode}
                onChange={(e) => setSecCode(e.target.value)}
                placeholder="EVE"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Descripción operativa</label>
            <textarea
              rows={2}
              value={secDesc}
              onChange={(e) => setSecDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dotación mínima diaria *</label>
              <input
                type="number"
                min={1}
                required
                value={secMinHeadcount}
                onChange={(e) => setSecMinHeadcount(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Responsable asignado</label>
              <select
                value={secManagerId}
                onChange={(e) => setSecManagerId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin asignar</option>
                {data.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.lastName}, {e.firstName} ({e.legajo})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setSectorModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Guardar sector
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Position Modal */}
      <Modal
        open={positionModalOpen}
        onClose={() => setPositionModalOpen(false)}
        title={`Nuevo puesto en ${selectedSector?.name ?? ''}`}
      >
        <form onSubmit={handleSavePosition} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre del puesto *</label>
            <input
              type="text"
              required
              value={posName}
              onChange={(e) => setPosName(e.target.value)}
              placeholder="Ej. Sommelier de Salón"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nivel jerárquico</label>
              <select
                value={posLevel}
                onChange={(e) => setPosLevel(e.target.value as Position['level'])}
                className={inputClass}
              >
                <option value="direccion">Dirección</option>
                <option value="gerencia">Gerencia</option>
                <option value="encargado">Encargado</option>
                <option value="supervisor">Supervisor</option>
                <option value="operativo">Operativo</option>
                <option value="apoyo">Apoyo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Dotación objetivo *</label>
              <input
                type="number"
                min={1}
                required
                value={posTarget}
                onChange={(e) => setPosTarget(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Responsabilidades</label>
            <textarea
              rows={2}
              value={posDesc}
              onChange={(e) => setPosDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setPositionModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Crear puesto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
