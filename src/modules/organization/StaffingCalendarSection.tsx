import React, { useMemo, useState } from 'react';
import { Calendar, Moon, Plus } from 'lucide-react';
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
import { addDaysISO, formatDateAR, todayISO } from '../../utils/formatters';

const STATUS_LABELS: Record<
  ShiftAssignmentStatus,
  { label: string; tone: 'positive' | 'neutral' | 'warning' | 'danger' | 'accent' }
> = {
  programado: { label: 'Programado', tone: 'neutral' },
  presente: { label: 'Presente', tone: 'positive' },
  franco: { label: 'Franco programado', tone: 'neutral' },
  ausente_justificado: { label: 'Ausencia justificada', tone: 'warning' },
  ausente_injustificado: { label: 'Ausencia injustificada', tone: 'danger' },
  licencia: { label: 'Licencia', tone: 'accent' }
};

const WEEKDAY_OPTIONS: Array<{ day: number; label: string }> = [
  { day: 1, label: 'Lun' },
  { day: 2, label: 'Mar' },
  { day: 3, label: 'Mié' },
  { day: 4, label: 'Jue' },
  { day: 5, label: 'Vie' },
  { day: 6, label: 'Sáb' },
  { day: 0, label: 'Dom' }
];

export const StaffingCalendarSection: React.FC = () => {
  const { data, permissions, navigate, assignShift, assignRecurringShifts } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedSectorId, setSelectedSectorId] = useState<string>('todos');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'single' | 'recurring'>('single');

  // Modal state
  const [empId, setEmpId] = useState(data.employees[0]?.id ?? '');
  const [formSectorId, setFormSectorId] = useState(data.employees[0]?.currentSectorId ?? 'sec-salon');
  const [formPositionId, setFormPositionId] = useState(data.employees[0]?.currentPositionId ?? 'pos-mozo');
  const [shiftId, setShiftId] = useState(data.shifts[2]?.id ?? 'sh-mediodia');
  const [startTime, setStartTime] = useState('10:30');
  const [endTime, setEndTime] = useState('16:30');
  const [tempPositionId, setTempPositionId] = useState('');
  const [status, setStatus] = useState<ShiftAssignmentStatus>('programado');
  const [notes, setNotes] = useState('');

  // Recurring schedule fields
  const [weekdays, setWeekdays] = useState<number[]>([2, 3, 4, 5, 6, 0]);
  const [effectiveStartDate, setEffectiveStartDate] = useState(todayISO());
  const [effectiveEndDate, setEffectiveEndDate] = useState(addDaysISO(todayISO(), 14));
  const [openEnded, setOpenEnded] = useState(true);

  const isOvernightShift = endTime <= startTime;

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
    let absences = 0;
    let francos = 0;

    filteredEmployees.forEach((e) => {
      const a = assignmentMap.get(e.id);
      if (!a) return;
      if (a.status === 'presente' || a.status === 'programado') {
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
      absences,
      francos,
      shortfall: Math.max(0, minRequired - plannedOrPresent)
    };
  }, [data.sectors, selectedSectorId, filteredEmployees, assignmentMap]);

  const sectorPositions = useMemo(
    () => data.positions.filter((p) => p.sectorId === formSectorId),
    [data.positions, formSectorId]
  );

  const openQuickAssign = (employeeId: string, mode: 'single' | 'recurring' = 'single') => {
    const emp = data.employees.find((e) => e.id === employeeId);
    const existing = assignmentMap.get(employeeId);
    setScheduleMode(mode);
    setEmpId(employeeId);
    setFormSectorId(existing?.sectorId ?? emp?.currentSectorId ?? data.sectors[0]?.id ?? '');
    setFormPositionId(existing?.positionId ?? emp?.currentPositionId ?? data.positions[0]?.id ?? '');
    setShiftId(existing?.shiftId ?? 'sh-mediodia');
    setStartTime(existing?.startTime ?? '10:30');
    setEndTime(existing?.endTime ?? '16:30');
    setTempPositionId(existing?.temporaryPositionId ?? '');
    setStatus(existing?.status ?? 'programado');
    setNotes(existing?.notes ?? '');
    setEffectiveStartDate(selectedDate);
    setEffectiveEndDate(addDaysISO(selectedDate, 14));
    setOpenEnded(true);
    setWeekdays([2, 3, 4, 5, 6, 0]);
    if (emp) setAssignModalOpen(true);
  };

  const handleEmployeeChange = (newEmpId: string) => {
    setEmpId(newEmpId);
    const emp = data.employees.find((e) => e.id === newEmpId);
    if (emp) {
      setFormSectorId(emp.currentSectorId);
      setFormPositionId(emp.currentPositionId);
    }
  };

  const handleShiftTemplateChange = (newShiftId: string) => {
    setShiftId(newShiftId);
    const sh = data.shifts.find((s) => s.id === newShiftId);
    if (sh) {
      setStartTime(sh.startTime);
      setEndTime(sh.endTime);
    }
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = data.employees.find((item) => item.id === empId);
    if (!emp) return;

    if (scheduleMode === 'recurring') {
      if (weekdays.length === 0) return;
      assignRecurringShifts({
        employeeId: emp.id,
        sectorId: formSectorId,
        positionId: formPositionId,
        temporaryPositionId: tempPositionId || undefined,
        shiftId,
        startTime,
        endTime,
        weekdays,
        startDate: effectiveStartDate,
        endDate: openEnded ? undefined : effectiveEndDate,
        openEnded,
        status,
        notes: notes.trim() || undefined
      });
    } else {
      const overnightNote = isOvernightShift
        ? [notes.trim(), 'Turno nocturno (+1 día)'].filter(Boolean).join(' · ')
        : notes.trim() || undefined;
      assignShift({
        employeeId: emp.id,
        sectorId: formSectorId,
        positionId: formPositionId,
        temporaryPositionId: tempPositionId || undefined,
        shiftId,
        operationalDate: selectedDate,
        startTime,
        endTime,
        status,
        notes: overnightNote
      });
    }
    setAssignModalOpen(false);
  };

  const handleQuickToggleStatus = (employeeId: string, nextStatus: ShiftAssignmentStatus) => {
    const emp = data.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const existing = assignmentMap.get(employeeId);
    assignShift({
      employeeId: emp.id,
      sectorId: existing?.sectorId ?? emp.currentSectorId,
      positionId: existing?.positionId ?? emp.currentPositionId,
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
      {/* Operational Filter & Primary Action Bar */}
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-xl">
          <div>
            <label className={labelClass}>Fecha operativa</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Sector</label>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openQuickAssign(filteredEmployees[0]?.id ?? data.employees[0].id, 'recurring')}
              className={primaryBtnClass}
            >
              <Plus className="w-4 h-4" />
              Programar turno / cronograma
            </button>
          </div>
        )}
      </div>

      {/* Essential Operational Status Strip (No heavy charts on operational screen) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Cobertura activa hoy"
          value={`${summary.plannedOrPresent} / ${summary.minRequired}`}
          subtitle={`Jornada ${formatDateAR(selectedDate)}`}
          tone={summary.shortfall > 0 ? 'warning' : 'positive'}
        />
        <KpiCard
          label="Faltante vs mínimo"
          value={summary.shortfall > 0 ? `${summary.shortfall} pers.` : 'Completa'}
          subtitle="Según dotación mínima del sector"
          tone={summary.shortfall > 0 ? 'danger' : 'positive'}
        />
        <KpiCard
          label="Ausencias del día"
          value={String(summary.absences)}
          subtitle="Sincronizadas con Personal"
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
            Marcar ausencia sincroniza automáticamente con Personal
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
                const sec = data.sectors.find((s) => s.id === (asg?.sectorId ?? emp.currentSectorId));
                const pos = data.positions.find((p) => p.id === (asg?.positionId ?? emp.currentPositionId));
                const tempPos = asg?.temporaryPositionId
                  ? data.positions.find((p) => p.id === asg.temporaryPositionId)
                  : undefined;
                const shift = data.shifts.find((s) => s.id === asg?.shiftId);
                const stInfo = asg ? STATUS_LABELS[asg.status] : { label: 'Sin asignar', tone: 'neutral' as const };
                const rowOvernight = asg ? asg.endTime <= asg.startTime : false;

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
                          <span className="text-[#7C2D36] font-medium"> → Temp: {tempPos.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      {asg ? (
                        <div>
                          <div className="text-xs text-[#1C1917]">{shift?.name ?? 'Turno'}</div>
                          <div className="text-[11px] font-mono tabular-nums text-[#5E5851]">
                            {asg.startTime} – {asg.endTime}
                            {rowOvernight && <span className="text-[#7C2D36]"> (+1 día)</span>}
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
                        <div className="inline-flex items-center gap-2.5">
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
                            onClick={() => openQuickAssign(emp.id, 'single')}
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

      {/* Assign / Recurring Schedule Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={
          scheduleMode === 'recurring'
            ? 'Programar cronograma de turnos'
            : `Editar turno — ${formatDateAR(selectedDate)}`
        }
        subtitle="Definí sector, puesto, horario (incluye turnos nocturnos) y días de la semana. Las ausencias se reflejan en Personal."
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setScheduleMode('single')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                scheduleMode === 'single'
                  ? 'bg-[#181615] text-white'
                  : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8]'
              }`}
            >
              Jornada única ({formatDateAR(selectedDate)})
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('recurring')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                scheduleMode === 'recurring'
                  ? 'bg-[#181615] text-white'
                  : 'bg-[#F8F7F4] text-[#5E5851] border border-[#E6E2D8]'
              }`}
            >
              Cronograma recurrente (días y vigencia)
            </button>
          </div>

          <div>
            <label className={labelClass}>Colaborador *</label>
            <select
              value={empId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className={inputClass}
            >
              {data.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.lastName}, {e.firstName} ({e.legajo})
                </option>
              ))}
            </select>
          </div>

          {/* Sector & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sector *</label>
              <select
                value={formSectorId}
                onChange={(e) => {
                  const nextSec = e.target.value;
                  setFormSectorId(nextSec);
                  const firstPos = data.positions.find((p) => p.sectorId === nextSec);
                  if (firstPos) setFormPositionId(firstPos.id);
                }}
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
              <label className={labelClass}>Puesto *</label>
              <select
                value={formPositionId}
                onChange={(e) => setFormPositionId(e.target.value)}
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

          {/* Shift Template & Times (24h, overnight aware) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Plantilla de turno</label>
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
              <label className={labelClass}>Hora inicio (24h) *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Hora fin (24h) *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {isOvernightShift && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#F8F7F4] border border-[#E6E2D8] text-xs text-[#7C2D36]">
              <Moon className="w-3.5 h-3.5 shrink-0" />
              <span>
                Turno nocturno detectado ({startTime} a {endTime} del día siguiente). Se registrará en la jornada de inicio.
              </span>
            </div>
          )}

          {/* Weekday Checkboxes & Effective Dates when Recurring */}
          {scheduleMode === 'recurring' && (
            <div className="space-y-3 p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md">
              <div>
                <label className={labelClass}>Días de la semana *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {WEEKDAY_OPTIONS.map((opt) => {
                    const checked = weekdays.includes(opt.day);
                    return (
                      <label
                        key={opt.day}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[#7C2D36] text-white border-[#7C2D36]'
                            : 'bg-white text-[#1C1917] border-[#D6D0C4]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWeekday(opt.day)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Fecha de inicio efectiva *</label>
                  <input
                    type="date"
                    required
                    value={effectiveStartDate}
                    onChange={(e) => setEffectiveStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Fecha de fin (opcional)</label>
                  <input
                    type="date"
                    disabled={openEnded}
                    min={effectiveStartDate}
                    value={effectiveEndDate}
                    onChange={(e) => setEffectiveEndDate(e.target.value)}
                    className={`${inputClass} disabled:bg-[#EFECE5] disabled:text-[#8C847A]`}
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={openEnded}
                  onChange={(e) => setOpenEnded(e.target.checked)}
                  className="accent-[#7C2D36] w-4 h-4 cursor-pointer"
                />
                Cronograma recurrente sin fecha de fin (aplica sobre las próximas 4 semanas operativas)
              </label>
            </div>
          )}

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
              <label className={labelClass}>Puesto temporal / cobertura (opcional)</label>
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
            <button
              type="submit"
              disabled={scheduleMode === 'recurring' && weekdays.length === 0}
              className={primaryBtnClass}
            >
              {scheduleMode === 'recurring' ? 'Aplicar cronograma' : 'Guardar asignación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
