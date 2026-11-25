import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Plus } from 'lucide-react';
import {
  inputClass,
  labelClass,
  Modal,
  operationalSecondaryBtnClass,
  primaryBtnClass,
  secondaryBtnClass,
  sectionTitleClass,
  StatusText
} from '../../components/ui/Primitives';
import { Position, Sector } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { todayISO } from '../../utils/formatters';

export const OrgChartSection: React.FC = () => {
  const { data, permissions, nav, navigate, createSector, updateSector, createPosition } = useAppStore();
  const today = todayISO();

  // All sectors start collapsed by default (unless navigated directly with a selectedSectorId context)
  const [expandedSectorIds, setExpandedSectorIds] = useState<Record<string, boolean>>(() =>
    nav.selectedSectorId ? { [nav.selectedSectorId]: true } : {}
  );

  useEffect(() => {
    if (nav.selectedSectorId) {
      setExpandedSectorIds((prev) => ({ ...prev, [nav.selectedSectorId!]: true }));
    }
  }, [nav.selectedSectorId]);
  const [expandedPositionIds, setExpandedPositionIds] = useState<Record<string, boolean>>({});
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [positionTargetSectorId, setPositionTargetSectorId] = useState<string>(data.sectors[0]?.id ?? '');

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
        positionsCount: number;
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
        positionsCount: secPositions.length,
        managerName: mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Sin asignar'
      });
    });
    return map;
  }, [data.sectors, data.employees, data.positions, data.shiftAssignments, today]);

  const anyExpanded = Object.values(expandedSectorIds).some(Boolean);

  const toggleSector = (sectorId: string) => {
    setExpandedSectorIds((prev) => ({ ...prev, [sectorId]: !prev[sectorId] }));
  };

  const toggleAllSectors = () => {
    if (anyExpanded) {
      setExpandedSectorIds({});
    } else {
      const all: Record<string, boolean> = {};
      data.sectors.forEach((s) => {
        all[s.id] = true;
      });
      setExpandedSectorIds(all);
    }
  };

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

  const openCreatePosition = (sectorId?: string) => {
    setPositionTargetSectorId(sectorId ?? data.sectors[0]?.id ?? '');
    setPosName('');
    setPosLevel('operativo');
    setPosTarget(2);
    setPosDesc('');
    setPositionModalOpen(true);
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
    if (!positionTargetSectorId || !posName.trim()) return;
    createPosition({
      sectorId: positionTargetSectorId,
      name: posName.trim(),
      level: posLevel,
      targetHeadcount: Math.max(1, Number(posTarget) || 1),
      description: posDesc.trim()
    });
    setExpandedSectorIds((prev) => ({ ...prev, [positionTargetSectorId]: true }));
    setPosName('');
    setPosDesc('');
    setPositionModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Compact Operational Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={sectionTitleClass}>
            Estructura por sectores ({data.sectors.length} áreas · {data.employees.length} personas)
          </h2>
          <p className="text-xs text-[#6B635B] mt-0.5">
            Expandí un sector para ver puestos y abrir legajos en Personal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleAllSectors} className={secondaryBtnClass}>
            {anyExpanded ? 'Contraer todos' : 'Expandir todos'}
          </button>
          {permissions.canEditOrgStructure && (
            <>
              <button type="button" onClick={openCreateSector} className={operationalSecondaryBtnClass}>
                <Plus className="w-4 h-4" />
                Nuevo sector
              </button>
              <button type="button" onClick={() => openCreatePosition()} className={primaryBtnClass}>
                <Plus className="w-4 h-4" />
                Nuevo puesto
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Accordion Tree: Sector -> Puesto -> Colaboradores */}
      <div className="space-y-2.5">
        {data.sectors.map((sec) => {
          const st = sectorStats.get(sec.id);
          const isSectorOpen = Boolean(expandedSectorIds[sec.id]);
          const secPositions = data.positions.filter((p) => p.sectorId === sec.id);

          return (
            <div
              key={sec.id}
              className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden"
            >
              {/* Sector Row Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[#FAF9F6] transition-colors">
                <button
                  type="button"
                  onClick={() => toggleSector(sec.id)}
                  className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left cursor-pointer min-w-0"
                  aria-expanded={isSectorOpen}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isSectorOpen ? (
                      <ChevronDown className="w-4 h-4 text-[#7C2D36] shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#5E5851] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1C1917] truncate">
                          {sec.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#8C847A]">{sec.code}</span>
                      </div>
                      <div className="text-[11px] text-[#5E5851] flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span>Responsable: {st?.managerName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{st?.positionsCount ?? 0} puesto(s)</span>
                        <span aria-hidden="true">·</span>
                        <span>Mín. diario: {sec.dailyMinHeadcount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums pl-6 sm:pl-0 shrink-0">
                    <span className="text-[#1C1917]">{st?.assigned ?? 0} pers.</span>
                    <span className="text-[#5E5851]">{st?.scheduledToday ?? 0} hoy</span>
                    {st && st.absencesToday > 0 && (
                      <StatusText label={`${st.absencesToday} aus.`} tone="danger" />
                    )}
                    {st && st.vacant > 0 && (
                      <StatusText label={`${st.vacant} vac.`} tone="warning" />
                    )}
                  </div>
                </button>

                {permissions.canEditOrgStructure && (
                  <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-[#EFECE5]">
                    <button
                      type="button"
                      onClick={() => openEditSector(sec)}
                      className="p-1.5 text-[#5E5851] hover:text-[#7C2D36] rounded hover:bg-[#F2EFE9] cursor-pointer"
                      title="Editar sector"
                      aria-label={`Editar sector ${sec.name}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreatePosition(sec.id)}
                      className="p-1.5 text-[#5E5851] hover:text-[#7C2D36] rounded hover:bg-[#F2EFE9] cursor-pointer"
                      title="Agregar puesto al sector"
                      aria-label={`Agregar puesto en ${sec.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Positions & Linked Employees */}
              {isSectorOpen && (
                <div className="border-t border-[#EFECE5] bg-[#FAF9F6] px-4 py-3.5 space-y-2.5">
                  {sec.description && (
                    <p className="text-xs text-[#5E5851]">{sec.description}</p>
                  )}

                  {secPositions.length === 0 ? (
                    <p className="text-xs text-[#5E5851]">
                      Sin puestos definidos aún en este sector.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {secPositions.map((pos) => {
                        const posEmps = data.employees.filter((e) => e.currentPositionId === pos.id);
                        const isPosOpen = expandedPositionIds[pos.id] ?? true;
                        const vacant = Math.max(
                          0,
                          pos.targetHeadcount - posEmps.filter((e) => e.status === 'activo').length
                        );

                        return (
                          <div
                            key={pos.id}
                            className="bg-white border border-[#E6E2D8] rounded-md overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPositionIds((prev) => ({ ...prev, [pos.id]: !isPosOpen }))
                              }
                              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-[#F8F7F4] transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isPosOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#5E5851] shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-[#5E5851] shrink-0" />
                                )}
                                <span className="text-xs font-semibold text-[#1C1917] truncate">
                                  {pos.name}
                                </span>
                                <span className="text-[11px] text-[#5E5851] hidden sm:inline">
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

                            {isPosOpen && (
                              <div className="divide-y divide-[#F2EFE9] border-t border-[#F2EFE9]">
                                {posEmps.length === 0 ? (
                                  <div className="px-4 py-2.5 text-xs text-[#5E5851]">
                                    Puesto vacante. Podés asignar o transferir personal desde el módulo Personal.
                                  </div>
                                ) : (
                                  posEmps.map((emp) => {
                                    const todayShift = data.shiftAssignments.find(
                                      (s) => s.employeeId === emp.id && s.operationalDate === today
                                    );
                                    return (
                                      <div
                                        key={emp.id}
                                        className="px-4 py-2 flex items-center justify-between gap-3 hover:bg-[#FAF9F6]"
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
                                            className="text-xs font-semibold text-[#7C2D36] hover:underline text-left cursor-pointer"
                                          >
                                            {emp.lastName}, {emp.firstName}
                                          </button>
                                          <div className="text-[11px] text-[#5E5851] flex flex-wrap items-center gap-1.5">
                                            <span className="font-mono">{emp.legajo}</span>
                                            <span aria-hidden="true">·</span>
                                            <span>{emp.status}</span>
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
                                              selectedEmployeeTab: 'resumen'
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
                  )}
                </div>
              )}
            </div>
          );
        })}
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
        title="Crear nuevo puesto"
      >
        <form onSubmit={handleSavePosition} className="space-y-4">
          <div>
            <label className={labelClass}>Sector *</label>
            <select
              value={positionTargetSectorId}
              onChange={(e) => setPositionTargetSectorId(e.target.value)}
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
