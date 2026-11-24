import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  inputClass,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { AttendanceEventType, LeaveType } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { addDaysISO, formatDateAR, todayISO } from '../../utils/formatters';

export const AttendanceWeeklyReportSection: React.FC = () => {
  const { data, permissions, navigate, recordAttendanceEvent } = useAppStore();
  const today = todayISO();
  const [fromDate, setFromDate] = useState(addDaysISO(today, -6));
  const [toDate, setToDate] = useState(today);
  const [modalOpen, setModalOpen] = useState(false);

  const [empId, setEmpId] = useState(data.employees[32]?.id ?? data.employees[0].id);
  const [opDate, setOpDate] = useState(today);
  const [eventType, setEventType] = useState<AttendanceEventType>('horas_extra');
  const [extraHours, setExtraHours] = useState(2);
  const [minutesLate, setMinutesLate] = useState(15);
  const [notes, setNotes] = useState('');

  const weeklyRows = useMemo(() => {
    const eventsInRange = data.attendanceEvents.filter(
      (a) => a.operationalDate >= fromDate && a.operationalDate <= toDate
    );
    const byEmp = new Map<
      string,
      {
        employeeId: string;
        extraHours: number;
        workedDaysOff: number;
        pendingCompRest: number;
        lateCount: number;
        lateMinutes: number;
        absences: number;
        notes: string[];
      }
    >();

    eventsInRange.forEach((ev) => {
      const row = byEmp.get(ev.employeeId) ?? {
        employeeId: ev.employeeId,
        extraHours: 0,
        workedDaysOff: 0,
        pendingCompRest: 0,
        lateCount: 0,
        lateMinutes: 0,
        absences: 0,
        notes: []
      };
      if (ev.eventType === 'horas_extra') row.extraHours += ev.extraHours ?? 0;
      if (ev.eventType === 'franco_trabajado') {
        row.workedDaysOff += 1;
        row.pendingCompRest += 1;
        row.extraHours += ev.extraHours ?? 0;
      }
      if (ev.eventType === 'franco_compensatorio') {
        row.pendingCompRest = Math.max(0, row.pendingCompRest - 1);
      }
      if (ev.eventType === 'tardanza') {
        row.lateCount += 1;
        row.lateMinutes += ev.minutesLate ?? 0;
      }
      if (ev.eventType === 'ausencia_injustificada' || ev.eventType === 'ausencia_justificada') {
        row.absences += 1;
      }
      if (ev.notes) row.notes.push(ev.notes);
      byEmp.set(ev.employeeId, row);
    });

    return Array.from(byEmp.values());
  }, [data.attendanceEvents, fromDate, toDate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = data.employees.find((x) => x.id === empId);
    if (!emp) return;
    recordAttendanceEvent({
      employeeId: emp.id,
      sectorId: emp.currentSectorId,
      operationalDate: opDate,
      eventType,
      extraHours: eventType === 'horas_extra' || eventType === 'franco_trabajado' ? extraHours : undefined,
      minutesLate: eventType === 'tardanza' ? minutesLate : undefined,
      justified: eventType === 'ausencia_justificada',
      notes: notes.trim() || 'Registrado en parte semanal digital.'
    });
    setNotes('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={labelClass}>Desde</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Hasta</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
          </div>
          <p className="text-xs text-[#5E5851] pb-2">
            Parte semanal digital (reemplaza planilla en papel seleccionando del directorio único).
          </p>
        </div>

        {permissions.canManageStaffing && (
          <button type="button" onClick={() => setModalOpen(true)} className={primaryBtnClass}>
            <Plus className="w-4 h-4" />
            Cargar novedad
          </button>
        )}
      </div>

      <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] text-xs font-semibold text-[#1C1917]">
          Resumen del parte semanal ({formatDateAR(fromDate)} al {formatDateAR(toDate)}) — {weeklyRows.length} colaboradores con novedades
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6E2D8] text-left text-xs text-[#5E5851]">
                <th className="py-2.5 px-4 font-medium">Colaborador</th>
                <th className="py-2.5 px-4 font-medium text-right">Hs extra</th>
                <th className="py-2.5 px-4 font-medium text-right">Francos trab.</th>
                <th className="py-2.5 px-4 font-medium text-right">Comp. pend.</th>
                <th className="py-2.5 px-4 font-medium text-right">Llegadas tarde</th>
                <th className="py-2.5 px-4 font-medium text-right">Ausencias</th>
                <th className="py-2.5 px-4 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {weeklyRows.map((row) => {
                const emp = data.employees.find((e) => e.id === row.employeeId);
                return (
                  <tr key={row.employeeId} className="hover:bg-[#F8F7F4]">
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            module: 'personal',
                            section: 'legajo',
                            selectedEmployeeId: row.employeeId,
                            selectedEmployeeTab: 'asistencia'
                          })
                        }
                        className="font-medium text-[#7C2D36] hover:underline text-left cursor-pointer"
                      >
                        {emp ? `${emp.lastName}, ${emp.firstName}` : row.employeeId}
                      </button>
                      <div className="text-[11px] font-mono text-[#5E5851]">{emp?.legajo}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.extraHours} hs</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.workedDaysOff}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.pendingCompRest}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {row.lateCount > 0 ? `${row.lateCount} (${row.lateMinutes}m)` : '0'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      <span className={row.absences > 0 ? 'text-[#B91C1C] font-semibold' : 'text-[#5E5851]'}>
                        {row.absences}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-[#5E5851] max-w-xs truncate">
                      {row.notes.join(' · ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cargar novedad en parte semanal">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Seleccionar colaborador del directorio *</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} className={inputClass}>
              {data.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.lastName}, {e.firstName} ({e.legajo})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha *</label>
              <input type="date" required value={opDate} onChange={(e) => setOpDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Evento *</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value as AttendanceEventType)} className={inputClass}>
                <option value="horas_extra">Horas extra</option>
                <option value="franco_trabajado">Franco trabajado</option>
                <option value="franco_compensatorio">Franco compensatorio tomado</option>
                <option value="tardanza">Llegada tarde</option>
                <option value="ausencia_justificada">Ausencia justificada</option>
                <option value="ausencia_injustificada">Ausencia injustificada</option>
              </select>
            </div>
          </div>
          {(eventType === 'horas_extra' || eventType === 'franco_trabajado') && (
            <div>
              <label className={labelClass}>Horas</label>
              <input type="number" step="0.5" min={0.5} value={extraHours} onChange={(e) => setExtraHours(Number(e.target.value))} className={inputClass} />
            </div>
          )}
          {eventType === 'tardanza' && (
            <div>
              <label className={labelClass}>Minutos</label>
              <input type="number" min={1} value={minutesLate} onChange={(e) => setMinutesLate(Number(e.target.value))} className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className={secondaryBtnClass}>Cancelar</button>
            <button type="submit" className={primaryBtnClass}>Guardar novedad</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const LeavesAndTrainingSection: React.FC<{ mode: 'vacaciones' | 'desempeno' }> = ({ mode }) => {
  const { data, permissions, navigate, createLeaveRequest, reviewLeaveRequest, markTrainingAttendance } = useAppStore();
  const [newLeaveOpen, setNewLeaveOpen] = useState(false);
  const [empId, setEmpId] = useState(data.employees[32]?.id ?? data.employees[0].id);
  const [leaveType, setLeaveType] = useState<LeaveType>('vacaciones');
  const [startDate, setStartDate] = useState(addDaysISO(todayISO(), 10));
  const [endDate, setEndDate] = useState(addDaysISO(todayISO(), 16));
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    createLeaveRequest({
      employeeId: empId,
      type: leaveType,
      startDate,
      endDate,
      daysRequested: Math.max(1, Number(days)),
      reason: reason.trim() || 'Solicitud de licencia.'
    });
    setReason('');
    setNewLeaveOpen(false);
  };

  if (mode === 'vacaciones') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
              Gestión de vacaciones, licencias y francos compensatorios
            </h3>
            <p className="text-xs text-[#5E5851]">
              Aprobar vacaciones descuenta automáticamente el saldo disponible del colaborador.
            </p>
          </div>
          <button type="button" onClick={() => setNewLeaveOpen(true)} className={primaryBtnClass}>
            <Plus className="w-4 h-4" />
            Nueva solicitud
          </button>
        </div>

        <div className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="divide-y divide-[#F2EFE9]">
            {data.leaveRequests.map((lv) => {
              const emp = data.employees.find((e) => e.id === lv.employeeId);
              const bal = data.vacationBalances.find((v) => v.employeeId === lv.employeeId);
              const avail = bal ? bal.entitledDays - bal.takenDays - bal.approvedPendingDays : 0;
              return (
                <div key={lv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            module: 'personal',
                            section: 'legajo',
                            selectedEmployeeId: lv.employeeId,
                            selectedEmployeeTab: 'vacaciones'
                          })
                        }
                        className="font-semibold text-[#7C2D36] hover:underline cursor-pointer"
                      >
                        {emp ? `${emp.lastName}, ${emp.firstName} (${emp.legajo})` : lv.employeeId}
                      </button>
                      <span>·</span>
                      <span className="capitalize font-medium text-[#1C1917]">
                        {lv.type.replace('_', ' ')} ({lv.daysRequested} días)
                      </span>
                      <span>·</span>
                      <StatusText
                        label={lv.status}
                        tone={
                          lv.status === 'aprobada'
                            ? 'positive'
                            : lv.status === 'rechazada'
                              ? 'danger'
                              : 'warning'
                        }
                      />
                    </div>
                    <div className="mt-1 text-xs text-[#5E5851]">
                      Del <span className="font-mono">{formatDateAR(lv.startDate)}</span> al{' '}
                      <span className="font-mono">{formatDateAR(lv.endDate)}</span> · Saldo vacacional actual:{' '}
                      <strong className="font-mono text-[#1C1917]">{avail} días</strong>
                    </div>
                    <p className="mt-0.5 text-xs text-[#5E5851]">{lv.reason}</p>
                  </div>

                  {lv.status === 'pendiente' && permissions.canApproveLeaves && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => reviewLeaveRequest(lv.id, 'aprobada', 'Aprobada por RRHH/Dirección.')}
                        className={primaryBtnClass}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewLeaveRequest(lv.id, 'rechazada', 'Rechazada por cobertura.')}
                        className={secondaryBtnClass}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Modal open={newLeaveOpen} onClose={() => setNewLeaveOpen(false)} title="Nueva solicitud de licencia">
          <form onSubmit={handleCreateLeave} className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tipo</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className={inputClass}>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="enfermedad">Licencia médica</option>
                  <option value="franco_compensatorio">Franco compensatorio</option>
                  <option value="estudio">Estudio</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Días *</label>
                <input type="number" min={1} required value={days} onChange={(e) => setDays(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Desde</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Hasta</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Motivo</label>
              <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNewLeaveOpen(false)} className={secondaryBtnClass}>Cancelar</button>
              <button type="submit" className={primaryBtnClass}>Registrar solicitud</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // mode === 'desempeno' -> Training Sessions & Recent Evaluations
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
          Capacitaciones y reuniones operativas ({data.trainingSessions.length})
        </h3>
        <div className="space-y-4">
          {data.trainingSessions.map((trn) => {
            const attendees = data.trainingAttendances.filter((ta) => ta.trainingSessionId === trn.id);
            return (
              <div key={trn.id} className="p-4 border border-[#E6E2D8] rounded-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917]">{trn.title}</div>
                    <div className="text-xs text-[#5E5851]">
                      {trn.topic} · Instructor: {trn.instructor} · Fecha: {formatDateAR(trn.scheduledDate)} ({trn.durationHours} hs)
                    </div>
                  </div>
                  <StatusText
                    label={trn.status === 'completada' ? 'Completada' : 'Programada'}
                    tone={trn.status === 'completada' ? 'positive' : 'accent'}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F2EFE9]">
                  {attendees.map((att) => {
                    const emp = data.employees.find((e) => e.id === att.employeeId);
                    return (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded text-xs"
                      >
                        <span className="text-[#1C1917]">
                          {emp ? `${emp.firstName} ${emp.lastName}` : att.employeeId}
                        </span>
                        <select
                          value={att.status}
                          onChange={(e) =>
                            markTrainingAttendance(
                              att.id,
                              e.target.value as 'inscripto' | 'asistio' | 'ausente'
                            )
                          }
                          className="text-[11px] bg-white border border-[#D6D0C4] rounded px-1 py-0.5"
                        >
                          <option value="inscripto">Inscripto</option>
                          <option value="asistio">Asistió</option>
                          <option value="ausente">Ausente</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-3">
        <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
          Evaluaciones y reconocimientos recientes ({data.performanceEvaluations.length})
        </h3>
        <div className="divide-y divide-[#F2EFE9]">
          {data.performanceEvaluations.map((ev) => {
            const emp = data.employees.find((e) => e.id === ev.employeeId);
            return (
              <div key={ev.id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        module: 'personal',
                        section: 'legajo',
                        selectedEmployeeId: ev.employeeId,
                        selectedEmployeeTab: 'desempeno'
                      })
                    }
                    className="font-semibold text-[#7C2D36] hover:underline cursor-pointer"
                  >
                    {emp ? `${emp.lastName}, ${emp.firstName}` : ev.employeeId}
                  </button>{' '}
                  <span className="text-[#5E5851]">· {ev.category.replace(/_/g, ' ')}</span>
                  <p className="mt-0.5 text-[#1C1917]">{ev.summary}</p>
                </div>
                <span className="font-mono text-[#5E5851] shrink-0">{formatDateAR(ev.operationalDate)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
