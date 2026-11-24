import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Plus } from 'lucide-react';
import {
  inputClass,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { ChecklistAnswer, ChecklistExecution, VerificationStatus } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { formatDateAR, formatDateTimeAR, todayISO } from '../../utils/formatters';

const VERIF_META: Record<VerificationStatus, { label: string; tone: 'neutral' | 'warning' | 'positive' | 'danger' }> = {
  borrador: { label: 'Borrador', tone: 'neutral' },
  enviado: { label: 'Enviado — Pendiente verificación', tone: 'warning' },
  verificado: { label: 'Verificado conforme', tone: 'positive' },
  observado_discrepancia: { label: 'Observado con discrepancia', tone: 'danger' }
};

export const ChecklistsSection: React.FC = () => {
  const {
    data,
    activeUser,
    permissions,
    saveChecklistExecution,
    verifyChecklistExecution,
    disputeChecklistExecution,
    notify
  } = useAppStore();

  const [sectorFilter, setSectorFilter] = useState('todos');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>(
    data.checklistExecutions[0]?.id ?? ''
  );

  // New / Edit Execution Modal
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [selectedProcId, setSelectedProcId] = useState(data.procedures[0]?.id ?? '');
  const [shiftId, setShiftId] = useState('sh-mediodia');
  const [opDate, setOpDate] = useState(todayISO());
  const [assignedEmpId, setAssignedEmpId] = useState(activeUser.employeeId ?? data.employees[0].id);
  const [performedEmpId, setPerformedEmpId] = useState(activeUser.employeeId ?? data.employees[0].id);
  const [answerMap, setAnswerMap] = useState<Record<string, string | number | boolean | null>>({});
  const [execObservations, setExecObservations] = useState('');

  // Discrepancy Modal
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputedFieldId, setDisputedFieldId] = useState('');
  const [disputedTaskLabel, setDisputedTaskLabel] = useState('');
  const [disputeObs, setDisputeObs] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');

  // Verification Modal
  const [verifyNote, setVerifyNote] = useState('');
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const filteredExecutions = useMemo(
    () =>
      data.checklistExecutions.filter(
        (ex) => sectorFilter === 'todos' || ex.sectorId === sectorFilter
      ),
    [data.checklistExecutions, sectorFilter]
  );

  const selectedExecution: ChecklistExecution | undefined =
    data.checklistExecutions.find((e) => e.id === selectedExecutionId) ?? filteredExecutions[0];

  const selectedTemplate = useMemo(
    () =>
      selectedExecution
        ? data.checklistTemplates.find((t) => t.id === selectedExecution.checklistTemplateId)
        : undefined,
    [data.checklistTemplates, selectedExecution]
  );

  const activeModalProc = data.procedures.find((p) => p.id === selectedProcId);
  const activeModalTemplate = useMemo(() => {
    const pv = data.procedureVersions.find((v) => v.id === activeModalProc?.currentVersionId);
    return data.checklistTemplates.find((t) => t.id === pv?.checklistTemplateId);
  }, [activeModalProc, data.procedureVersions, data.checklistTemplates]);

  const openRunChecklist = (procId?: string) => {
    const targetProc = procId ?? data.procedures[0]?.id ?? '';
    setSelectedProcId(targetProc);
    setOpDate(todayISO());
    setAssignedEmpId(activeUser.employeeId ?? data.employees[0].id);
    setPerformedEmpId(activeUser.employeeId ?? data.employees[0].id);
    setAnswerMap({});
    setExecObservations('');
    setRunModalOpen(true);
  };

  const handleSubmitChecklist = (submit: boolean) => {
    if (!activeModalTemplate) return;
    const answers: ChecklistAnswer[] = activeModalTemplate.fields.map((f) => ({
      fieldId: f.id,
      value: answerMap[f.id] ?? (f.type === 'checkbox' ? false : '')
    }));

    // Validate required fields on submit
    if (submit) {
      const missing = activeModalTemplate.fields.find((f) => {
        if (!f.required) return false;
        const val = answerMap[f.id];
        if (f.type === 'checkbox') return false; // checkbox false is still a valid explicit answer
        return val === undefined || val === null || val === '';
      });
      if (missing) {
        notify(`Completá el campo obligatorio: ${missing.label}`, 'warning');
        return;
      }
    }

    const newId = saveChecklistExecution({
      procedureId: selectedProcId,
      shiftId,
      operationalDate: opDate,
      assignedEmployeeId: assignedEmpId,
      performedByEmployeeId: performedEmpId,
      answers,
      observations: execObservations.trim() || undefined,
      submit
    });
    setSelectedExecutionId(newId);
    setRunModalOpen(false);
  };

  const handleConfirmVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExecution) return;
    verifyChecklistExecution(selectedExecution.id, verifyNote.trim() || undefined);
    setVerifyNote('');
    setVerifyModalOpen(false);
  };

  const handleConfirmDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExecution || !disputeObs.trim()) return;
    disputeChecklistExecution({
      executionId: selectedExecution.id,
      fieldId: disputedFieldId || undefined,
      disputedTaskLabel: disputedTaskLabel || 'Tarea operativa declarada',
      observation: disputeObs.trim(),
      evidenceNote: disputeEvidence.trim() || undefined
    });
    setDisputeObs('');
    setDisputeEvidence('');
    setDisputeModalOpen(false);
  };

  const empName = (id?: string) => {
    if (!id) return '—';
    const e = data.employees.find((item) => item.id === id);
    return e ? `${e.firstName} ${e.lastName} (${e.legajo})` : id;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-sm text-[#1C1917]"
          >
            <option value="todos">Todos los sectores</option>
            {data.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#5E5851] hidden md:inline">
            Trazabilidad explícita: Asignado / Realizado / Registrado / Verificado
          </span>
        </div>

        {permissions.canExecuteChecklists && (
          <button type="button" onClick={() => openRunChecklist()} className={primaryBtnClass}>
            <Plus className="w-4 h-4" />
            Ejecutar checklist
          </button>
        )}
      </div>

      {/* Main Split: Executions List + Detailed Traceable View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1C1917]">
              Ejecuciones registradas ({filteredExecutions.length})
            </span>
          </div>
          <div className="divide-y divide-[#F2EFE9] max-h-[640px] overflow-y-auto">
            {filteredExecutions.map((ex) => {
              const proc = data.procedures.find((p) => p.id === ex.procedureId);
              const sec = data.sectors.find((s) => s.id === ex.sectorId);
              const meta = VERIF_META[ex.verificationStatus];
              const active = selectedExecution?.id === ex.id;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedExecutionId(ex.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    active ? 'bg-[#7C2D36]/8' : 'hover:bg-[#F8F7F4]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[#5E5851]">
                      {proc?.code} · {formatDateAR(ex.operationalDate)}
                    </span>
                    <StatusText label={meta.label} tone={meta.tone} />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#1C1917]">
                    {proc?.title ?? ex.procedureId}
                  </div>
                  <div className="mt-1 text-[11px] text-[#5E5851]">
                    {sec?.name} · Realizado por: {empName(ex.performedByEmployeeId)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Execution Detail */}
        <div className="lg:col-span-7">
          {selectedExecution && selectedTemplate && (
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#EFECE5]">
                <div>
                  <div className="text-xs font-mono text-[#5E5851]">
                    ID {selectedExecution.id} · Plantilla {selectedTemplate.versionNumber} · Fecha{' '}
                    {formatDateAR(selectedExecution.operationalDate)}
                  </div>
                  <h3 className="mt-1 text-2xl font-editorial font-semibold text-[#1C1917]">
                    {selectedTemplate.title}
                  </h3>
                  <div className="mt-1">
                    <StatusText
                      label={VERIF_META[selectedExecution.verificationStatus].label}
                      tone={VERIF_META[selectedExecution.verificationStatus].tone}
                    />
                  </div>
                </div>

                {permissions.canVerifyChecklists && selectedExecution.verificationStatus !== 'borrador' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedExecution.verificationStatus !== 'verificado' && (
                      <button
                        type="button"
                        onClick={() => setVerifyModalOpen(true)}
                        className={primaryBtnClass}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Verificar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const firstField = selectedTemplate.fields[0];
                        setDisputedFieldId(firstField?.id ?? '');
                        setDisputedTaskLabel(firstField?.label ?? selectedTemplate.title);
                        setDisputeModalOpen(true);
                      }}
                      className={secondaryBtnClass}
                    >
                      <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                      Reportar discrepancia
                    </button>
                  </div>
                )}
              </div>

              {/* Explicit 4-Actor Traceability Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md p-3.5 text-xs">
                <div>
                  <div className="text-[11px] text-[#5E5851] font-medium">1. Asignado</div>
                  <div className="mt-0.5 font-semibold text-[#1C1917]">
                    {empName(selectedExecution.assignedEmployeeId)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#5E5851] font-medium">2. Realizado por</div>
                  <div className="mt-0.5 font-semibold text-[#1C1917]">
                    {empName(selectedExecution.performedByEmployeeId)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#5E5851] font-medium">3. Registrado por</div>
                  <div className="mt-0.5 font-semibold text-[#1C1917]">
                    {selectedExecution.registeredByName}
                  </div>
                  <div className="text-[10px] font-mono text-[#5E5851]">
                    {formatDateTimeAR(selectedExecution.submittedAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#5E5851] font-medium">4. Verificado por</div>
                  <div className="mt-0.5 font-semibold text-[#1C1917]">
                    {selectedExecution.verifiedByName ?? 'Pendiente'}
                  </div>
                  <div className="text-[10px] font-mono text-[#5E5851]">
                    {formatDateTimeAR(selectedExecution.verifiedAt)}
                  </div>
                </div>
              </div>

              {/* Recorded Answers */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#5E5851]">Respuestas y mediciones asentadas</h4>
                <div className="divide-y divide-[#F2EFE9] border border-[#E6E2D8] rounded-md">
                  {selectedTemplate.fields.map((field) => {
                    const ans = selectedExecution.answers.find((a) => a.fieldId === field.id);
                    let displayVal = '—';
                    let outOfRange = false;

                    if (ans && ans.value !== null && ans.value !== undefined && ans.value !== '') {
                      if (field.type === 'checkbox') {
                        displayVal = ans.value ? 'Sí — Cumplido' : 'No cumplido';
                      } else if (field.type === 'product') {
                        const prod = data.products.find((p) => p.id === String(ans.value));
                        displayVal = prod ? `${prod.name} (${prod.sku})` : String(ans.value);
                      } else if (field.type === 'temperature') {
                        const num = Number(ans.value);
                        displayVal = `${num} ${field.unit ?? '°C'}`;
                        if (
                          (field.minValue !== undefined && num < field.minValue) ||
                          (field.maxValue !== undefined && num > field.maxValue)
                        ) {
                          outOfRange = true;
                        }
                      } else {
                        displayVal = `${ans.value}${field.unit ? ` ${field.unit}` : ''}`;
                      }
                    }

                    return (
                      <div key={field.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-medium text-[#1C1917]">{field.label}</div>
                          {field.helperText && (
                            <div className="text-[11px] text-[#5E5851]">{field.helperText}</div>
                          )}
                        </div>
                        <div className="text-sm font-mono tabular-nums font-semibold text-right">
                          <span className={outOfRange ? 'text-[#B91C1C]' : 'text-[#1C1917]'}>
                            {displayVal}
                          </span>
                          {outOfRange && (
                            <div className="text-[11px] font-sans text-[#B91C1C]">Fuera de rango</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Immutable History Trail */}
              <div>
                <h4 className="text-xs font-semibold text-[#5E5851] mb-2">
                  Historial trazable (sin sobrescritura silenciosa)
                </h4>
                <div className="space-y-2 border-l border-[#D6D0C4] pl-4">
                  {selectedExecution.history.map((h) => (
                    <div key={h.id} className="text-xs">
                      <div className="flex items-center gap-2 text-[#5E5851]">
                        <span className="font-mono tabular-nums">{formatDateTimeAR(h.timestamp)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#1C1917]">{h.actorName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#7C2D36]">{h.action.replace('_', ' ')}</span>
                      </div>
                      <p className="text-[#1C1917] mt-0.5">{h.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execute New Checklist Modal */}
      <Modal
        open={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        title="Ejecutar procedimiento y checklist digital"
        subtitle="Registrá con precisión quién fue asignado, quién realizó la tarea y quién la carga en el sistema."
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Procedimiento *</label>
              <select
                value={selectedProcId}
                onChange={(e) => {
                  setSelectedProcId(e.target.value);
                  setAnswerMap({});
                }}
                className={inputClass}
              >
                {data.procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Fecha *</label>
                <input
                  type="date"
                  value={opDate}
                  onChange={(e) => setOpDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Turno</label>
                <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className={inputClass}>
                  {data.shifts.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      {sh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Explicit Actors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md">
            <div>
              <label className={labelClass}>Colaborador Asignado *</label>
              <select
                value={assignedEmpId}
                onChange={(e) => setAssignedEmpId(e.target.value)}
                className={inputClass}
              >
                {data.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.lastName}, {e.firstName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Colaborador que Realizó *</label>
              <select
                value={performedEmpId}
                onChange={(e) => setPerformedEmpId(e.target.value)}
                className={inputClass}
              >
                {data.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.lastName}, {e.firstName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Usuario que Registra</label>
              <input type="text" disabled value={activeUser.name} className={`${inputClass} bg-[#EFECE5]`} />
            </div>
          </div>

          {/* Dynamic Checklist Fields */}
          {activeModalTemplate && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#7C2D36]" />
                Campos del checklist ({activeModalTemplate.versionNumber})
              </div>
              {activeModalTemplate.fields.map((field) => (
                <div key={field.id} className="p-3 border border-[#E6E2D8] rounded-md">
                  <label className={labelClass}>
                    {field.label} {field.required && <span className="text-[#B91C1C]">*</span>}
                  </label>
                  {field.type === 'checkbox' && (
                    <label className="inline-flex items-center gap-2 text-sm text-[#1C1917] cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(answerMap[field.id])}
                        onChange={(e) =>
                          setAnswerMap((prev) => ({ ...prev, [field.id]: e.target.checked }))
                        }
                        className="accent-[#7C2D36] w-4 h-4 cursor-pointer"
                      />
                      Confirmado / realizado
                    </label>
                  )}
                  {(field.type === 'number' || field.type === 'temperature') && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        value={String(answerMap[field.id] ?? '')}
                        onChange={(e) =>
                          setAnswerMap((prev) => ({
                            ...prev,
                            [field.id]: e.target.value === '' ? '' : Number(e.target.value)
                          }))
                        }
                        placeholder={field.helperText ?? 'Ingresar valor'}
                        className={inputClass}
                      />
                      {field.unit && (
                        <span className="text-xs font-mono text-[#5E5851] shrink-0">{field.unit}</span>
                      )}
                    </div>
                  )}
                  {field.type === 'time' && (
                    <input
                      type="time"
                      value={String(answerMap[field.id] ?? '')}
                      onChange={(e) =>
                        setAnswerMap((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className={inputClass}
                    />
                  )}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={String(answerMap[field.id] ?? todayISO())}
                      onChange={(e) =>
                        setAnswerMap((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className={inputClass}
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      value={String(answerMap[field.id] ?? '')}
                      onChange={(e) =>
                        setAnswerMap((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="">Seleccionar opción...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  {field.type === 'product' && (
                    <select
                      value={String(answerMap[field.id] ?? '')}
                      onChange={(e) =>
                        setAnswerMap((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="">Seleccionar producto de inventario...</option>
                      {data.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  )}
                  {(field.type === 'text' || field.type === 'evidence') && (
                    <input
                      type="text"
                      value={String(answerMap[field.id] ?? '')}
                      onChange={(e) =>
                        setAnswerMap((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      placeholder={
                        field.type === 'evidence'
                          ? 'Referencia de evidencia / foto (ej. foto_freezer_23hs.jpg)'
                          : 'Ingresar observación'
                      }
                      className={inputClass}
                    />
                  )}
                  {field.helperText && (
                    <p className="mt-1 text-[11px] text-[#5E5851]">{field.helperText}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className={labelClass}>Observaciones generales</label>
            <textarea
              rows={2}
              value={execObservations}
              onChange={(e) => setExecObservations(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setRunModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="button" onClick={() => handleSubmitChecklist(false)} className={secondaryBtnClass}>
              Guardar borrador
            </button>
            <button type="button" onClick={() => handleSubmitChecklist(true)} className={primaryBtnClass}>
              Enviar checklist
            </button>
          </div>
        </div>
      </Modal>

      {/* Verify Modal */}
      <Modal
        open={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verificar ejecución de checklist"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleConfirmVerify} className="space-y-4">
          <p className="text-xs text-[#5E5851]">
            Quedará registrado que <strong>{activeUser.name}</strong> verificó este checklist con fecha y hora exactas.
          </p>
          <div>
            <label className={labelClass}>Nota de verificación</label>
            <textarea
              rows={3}
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              placeholder="Ej. Verificado físicamente en el sector conforme al procedimiento vigente."
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setVerifyModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Confirmar verificación
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Discrepancy Modal */}
      <Modal
        open={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Reportar discrepancia operativa"
        subtitle="Una discrepancia registra un desvío entre lo declarado y lo verificado; no genera sanción disciplinaria automática."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleConfirmDispute} className="space-y-4">
          {selectedTemplate && (
            <div>
              <label className={labelClass}>Tarea observada</label>
              <select
                value={disputedFieldId}
                onChange={(e) => {
                  const id = e.target.value;
                  setDisputedFieldId(id);
                  const f = selectedTemplate.fields.find((item) => item.id === id);
                  setDisputedTaskLabel(f?.label ?? selectedTemplate.title);
                }}
                className={inputClass}
              >
                {selectedTemplate.fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelClass}>Detalle de lo constatado *</label>
            <textarea
              rows={3}
              required
              value={disputeObs}
              onChange={(e) => setDisputeObs(e.target.value)}
              placeholder="Ej. Al iniciar el turno mañana se encontró el freezer sin limpiar pese a figurar completado."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Referencia de evidencia (opcional)</label>
            <input
              type="text"
              value={disputeEvidence}
              onChange={(e) => setDisputeEvidence(e.target.value)}
              placeholder="Ej. Registro fotográfico / testigo de turno entrante"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setDisputeModalOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Registrar discrepancia
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
