import React, { useMemo, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import {
  inputClass,
  KpiCard,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { ShiftAssignmentStatus } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { formatDateAR, todayISO } from '../../utils/formatters';

const STATUS_LABELS: Record<ShiftAssignmentStatus, { label: string; tone: 'positive' | 'neutral' | 'warning' | 'danger' | 'accent' }> = {
  programado: { label: 'Programado', tone: 'neutral' },
  presente: { label: 'Presente', tone: 'positive' },
  franco: { label: 'Franco programado', tone: 'neutral' },
  ausente_justificado: { label: 'Ausencia justificada', tone: 'warning' },
  ausente_injustificado: { label: 'Ausencia injustificada', tone: 'danger' },
  licencia: { label: 'Licencia', tone: 'accent' }
};

export const StaffingCalendarSection: React.FC = () => {
  const { data, permissions, navigate, assignShift } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedSectorId, setSelectedSectorId] = useState<string>('todos');
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Modal state
  const [empId, setEmpId] = useState(data.employees[0]?.id ?? '');
  const [shiftId, setShiftId] = useState(data.shifts[2]?.id ?? 'sh-mediodia');
  const [startTime, setStartTime] = useState('10:30');
  const [endTime, setEndTime] = useState('16:30');
  const [tempPositionId, setTempPositionId] = useState('');
  const [status, setStatus] = useState<ShiftAssignmentStatus>('programado');
  const [notes, setNotes] = useState('');

  const filteredEmployees = useMemo(() => {
    return data.employees.filter(
      (e) =>
        e.status !== 'egresado' &&
        (selectedSectorId === 'todos' || e.currentSectorId === selectedSectorId)
    );
  }, [data.employees, selectedSectorId]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, (typeof data.shiftAssignments)[0]>();
    data.shiftAssignments
      .filter((s) => s.operationalDate === selectedDate)
      .forEach((s) => map.set(s.employeeId, s));
    return map;
  }, [data.shiftAssignments, selectedDate]);

  const summary = useMemo(() => {
    const relevantSectors =
      selectedSectorId === 'todos'
        ? data.sectors
        : data.sectors.filter((s) => s.id === selectedSectorId);
    const minRequired = relevantSectors.reduce((acc, s) => acc + s.dailyMinHeadcount, 0);
    let plannedOrPresent = 0;
    let present = 0;
    let absences = 0;
    let francos = 0;

    filteredEmployees.forEach((e) => {
      const a = assignmentMap.get(e.id);
      if (!a) return;
      if (a.status === 'presente') {
        present++;
        plannedOrPresent++;
      } else if (a.status === 'programado') {
        plannedOrPresent++;
      } else if (a.status === 'ausente_justificado' || a.status === 'ausente_injustificado') {
        absences++;
      } else if (a.status === 'franco') {
        francos++;
      }
    });

    return {
      minRequired,
      plannedOrPresent,
      present,
      absences,
      francos,
      shortfall: Math.max(0, minRequired - plannedOrPresent)
    };
  }, [data.sectors, selectedSectorId, filteredEmployees, assignmentMap]);

  const openQuickAssign = (employeeId: string) => {
    const emp = data.employees.find((e) => e.id === employeeId);
    const existing = assignmentMap.get(employeeId);
    setEmpId(employeeId);
    setShiftId(existing?.shiftId ?? 'sh-mediodia');
    setStartTime(existing?.startTime ?? '10:30');
    setEndTime(existing?.endTime ?? '16:30');
    setTempPositionId(existing?.temporaryPositionId ?? '');
    setStatus(existing?.status ?? 'programado');
    setNotes(existing?.notes ?? '');
    if (emp) setAssignModalOpen(true);
  };

  const handleShiftTemplateChange = (newShiftId: string) => {
    setShiftId(newShiftId);
    const sh = data.shifts.find((s) => s.id === newShiftId);
    if (sh) {
      setStartTime(sh.startTime);
      setEndTime(sh.endTime);
    }
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = data.employees.find((item) => item.id === empId);
    if (!emp) return;
    assignShift({
      employeeId: emp.id,
      sectorId: emp.currentSectorId,
      positionId: emp.currentPositionId,
      temporaryPositionId: tempPositionId || undefined,
      shiftId,
      operationalDate: selectedDate,
      startTime,
      endTime,
      status,
      notes: notes.trim() || undefined
    });
    setAssignModalOpen(false);
  };

  const handleQuickToggleStatus = (employeeId: string, nextStatus: ShiftAssignmentStatus) => {
    const emp = data.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const existing = assignmentMap.get(employeeId);
    assignShift({
      employeeId: emp.id,
      sectorId: emp.currentSectorId,
      positionId: emp.currentPositionId,
      temporaryPositionId: existing?.temporaryPositionId,
      shiftId: existing?.shiftId ?? 'sh-mediodia',
      operationalDate: selectedDate,
      startTime: existing?.startTime ?? '10:30',
      endTime: existing?.endTime ?? '16:30',
      status: nextStatus,
      notes:
        nextStatus === 'ausente_injustificado'
          ? 'Ausencia registrada desde tablero diario de dotación.'
          : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-xl">
          <div>
            <label className={labelClass}>Fecha operativa</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Filtrar por sector</label>
            <select
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value)}
              className={inputClass}
            >
              <option value="todos">Todos los sectores ({data.sectors.length})</option>
              {data.sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {permissions.canManageStaffing && (
          <button
            type="button"
            onClick={() => openQuickAssign(filteredEmployees[0]?.id ?? data.employees[0].id)}
            className={primaryBtnClass}
          >
            <Plus className="w-4 h-4" />
            Asignar turno / novedad
          </button>
        )}
      </div>

      {/* Coverage KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Cobertura activa / programada"
          value={`${summary.plannedOrPresent} / ${summary.minRequired}`}
          subtitle={`Jornada ${formatDateAR(selectedDate)}`}
          tone={summary.shortfall > 0 ? 'warning' : 'positive'}
        />
        <KpiCard
          label="Cobertura faltante"
          value={summary.shortfall > 0 ? `${summary.shortfall} persona(s)` : 'Completa'}
          subtitle="Comparativa vs mínimo diario del sector"
          tone={summary.shortfall > 0 ? 'danger' : 'positive'}
        />
        <KpiCard
          label="Ausencias registradas"
          value={String(summary.absences)}
          subtitle="Sincronizadas en módulo Personal"
          tone={summary.absences > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          label="Francos programados"
          value={String(summary.francos)}
          subtitle="Descanso semanal asignado"
        />
      </div>

      {/* Interactive Staffing Roster Table */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7C2D36]" />
            <h3 className="text-sm font-semibold text-[#1C1917]">
              Planilla de dotación — {formatDateAR(selectedDate)} ({filteredEmployees.length} colaboradores)
            </h3>
          </div>
          <span className="text-xs text-[#5E5851] hidden sm:inline">
            Marcar ausencia crea automáticamente el evento en Personal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E2D8] bg-[#F8F7F4] text-left text-xs text-[#5E5851]">
                <th className="py-2.5 px-4 font-medium">Colaborador</th>
                <th className="py-2.5 px-4 font-medium">Sector / Puesto</th>
                <th className="py-2.5 px-4 font-medium">Turno y horario</th>
                <th className="py-2.5 px-4 font-medium">Estado</th>
                {permissions.canManageStaffing && (
                  <th className="py-2.5 px-4 font-medium text-right">Acciones rápidas</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {filteredEmployees.map((emp) => {
                const asg = assignmentMap.get(emp.id);
                const sec = data.sectors.find((s) => s.id === emp.currentSectorId);
                const pos = data.positions.find((p) => p.id === emp.currentPositionId);
                const tempPos = asg?.temporaryPositionId
                  ? data.positions.find((p) => p.id === asg.temporaryPositionId)
                  : undefined;
                const shift = data.shifts.find((s) => s.id === asg?.shiftId);
                const stInfo = asg ? STATUS_LABELS[asg.status] : { label: 'Sin asignar', tone: 'neutral' as const };

                return (
                  <tr key={emp.id} className="hover:bg-[#F8F7F4] transition-colors">
                    <td className="py-2.5 px-4">
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
                        className="font-medium text-[#7C2D36] hover:underline text-left cursor-pointer"
                      >
                        {emp.lastName}, {emp.firstName}
                      </button>
                      <div className="text-[11px] font-mono text-[#5E5851]">{emp.legajo}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="text-xs font-medium text-[#1C1917]">{sec?.name}</div>
                      <div className="text-[11px] text-[#5E5851]">
                        {pos?.name}
                        {tempPos && (
                          <span className="text-[#7C2D36] font-medium">
                            {' '}
                            → Temp: {tempPos.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      {asg ? (
                        <div>
                          <div className="text-xs text-[#1C1917]">{shift?.name ?? 'Turno'}</div>
                          <div className="text-[11px] font-mono tabular-nums text-[#5E5851]">
                            {asg.startTime} – {asg.endTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8C847A]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusText label={stInfo.label} tone={stInfo.tone} />
                      {asg?.notes && (
                        <div className="text-[11px] text-[#5E5851] mt-0.5 max-w-[200px] truncate">
                          {asg.notes}
                        </div>
                      )}
                    </td>
                    {permissions.canManageStaffing && (
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 text-xs text-[#1C1917] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={asg?.status === 'presente'}
                              onChange={(e) =>
                                handleQuickToggleStatus(
                                  emp.id,
                                  e.target.checked ? 'presente' : 'programado'
                                )
                              }
                              className="accent-[#7C2D36] rounded cursor-pointer"
                            />
                            Presente
                          </label>
                          <button
                            type="button"
                            onClick={() => handleQuickToggleStatus(emp.id, 'ausente_injustificado')}
                            className="text-xs text-[#B91C1C] hover:underline cursor-pointer"
                          >
                            Ausencia
                          </button>
                          <button
                            type="button"
                            onClick={() => openQuickAssign(emp.id)}
                            className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign / Edit Shift Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Asignación de turno — ${formatDateAR(selectedDate)}`}
        subtitle="Los cambios de estado (presente, franco o ausencia) se reflejan automáticamente en Personal."
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <div>
            <label className={labelClass}>Colaborador *</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} className={inputClass}>
              {data.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.lastName}, {e.firstName} ({e.legajo})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Turno base</label>
              <select
                value={shiftId}
                onChange={(e) => handleShiftTemplateChange(e.target.value)}
                className={inputClass}
              >
                {data.shifts.map((sh) => (
                  <option key={sh.id} value={sh.id}>
                    {sh.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Hora inicio (24h)</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Hora fin (24h)</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Estado de asistencia *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShiftAssignmentStatus)}
                className={inputClass}
              >
                <option value="programado">Programado</option>
                <option value="presente">Presente</option>
                <option value="franco">Franco programado</option>
                <option value="ausente_justificado">Ausencia justificada</option>
                <option value="ausente_injustificado">Ausencia injustificada</option>
                <option value="licencia">Licencia</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Puesto temporal (opcional)</label>
              <select
                value={tempPositionId}
                onChange={(e) => setTempPositionId(e.target.value)}
                className={inputClass}
              >
                <option value="">Puesto titular habitual</option>
                {data.positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Cobertura temporal por alta ocupación o justificativo de ausencia..."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setAssignModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Guardar asignación
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
