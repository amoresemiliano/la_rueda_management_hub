import React, { useMemo, useState } from 'react';
import { Download, Eye, FileText, Upload } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  EmptyState,
  inputClass,
  KpiCard,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { AppDocument, DocumentCategory } from '../../domain/types';
import { useAppStore } from '../../services/store';
import { formatDateTimeAR, formatPercent, todayISO } from '../../utils/formatters';

export const ComplianceAnalyticsSection: React.FC = () => {
  const { data, permissions, resolveDiscrepancy } = useAppStore();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const metrics = useMemo(() => {
    const totalExec = data.checklistExecutions.length;
    const submitted = data.checklistExecutions.filter((e) => e.verificationStatus !== 'borrador');
    const verified = data.checklistExecutions.filter((e) => e.verificationStatus === 'verificado');
    const pendingVerif = data.checklistExecutions.filter((e) => e.verificationStatus === 'enviado');
    const openDisc = data.discrepancies.filter((d) => d.status !== 'resuelta');

    const bySector = data.sectors
      .map((s) => {
        const secExecs = data.checklistExecutions.filter((e) => e.sectorId === s.id);
        const secVerified = secExecs.filter((e) => e.verificationStatus === 'verificado').length;
        const secDisc = data.discrepancies.filter((d) => d.sectorId === s.id).length;
        return {
          sector: s.code,
          sectorName: s.name,
          ejecuciones: secExecs.length,
          verificadas: secVerified,
          discrepancias: secDisc
        };
      })
      .filter((row) => row.ejecuciones > 0 || row.discrepancias > 0);

    const today = todayISO();
    const todayShifts = data.shiftAssignments.filter((s) => s.operationalDate === today);
    const plannedCount = todayShifts.filter((s) => s.status !== 'franco' && s.status !== 'licencia').length;
    const actualCount = todayShifts.filter((s) => s.status === 'presente' || s.status === 'programado').length;

    return {
      completionRate: totalExec > 0 ? (submitted.length / totalExec) * 100 : 0,
      verifiedRate: submitted.length > 0 ? (verified.length / submitted.length) * 100 : 0,
      pendingVerifCount: pendingVerif.length,
      openDiscCount: openDisc.length,
      bySector,
      plannedCount,
      actualCount
    };
  }, [data]);

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolutionText.trim()) return;
    resolveDiscrepancy(resolvingId, resolutionText.trim());
    setResolvingId(null);
    setResolutionText('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tasa de cumplimiento enviado"
          value={formatPercent(metrics.completionRate, 0)}
          subtitle="Calculado sobre ejecuciones registradas"
        />
        <KpiCard
          label="Cumplimiento verificado"
          value={formatPercent(metrics.verifiedRate, 0)}
          subtitle={`${metrics.pendingVerifCount} checklist(s) pendientes de verificación`}
          tone={metrics.verifiedRate >= 70 ? 'positive' : 'warning'}
        />
        <KpiCard
          label="Discrepancias abiertas"
          value={String(metrics.openDiscCount)}
          subtitle={`${data.discrepancies.length} históricas registradas`}
          tone={metrics.openDiscCount > 0 ? 'danger' : 'positive'}
        />
        <KpiCard
          label="Dotación real vs planificada hoy"
          value={`${metrics.actualCount} / ${metrics.plannedCount}`}
          subtitle="Descontando francos y licencias"
        />
      </div>

      {/* Chart + Discrepancies Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-[#E6E2D8] rounded-lg p-6">
          <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
            Ejecuciones y discrepancias por sector
          </h3>
          <p className="text-xs text-[#5E5851] mt-0.5">
            Indicadores calculados exclusivamente desde eventos almacenados
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.bySector}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip />
                <Bar dataKey="verificadas" name="Verificadas" fill="#15803D" radius={[3, 3, 0, 0]} />
                <Bar dataKey="discrepancias" name="Discrepancias" fill="#B91C1C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4]">
            <h3 className="text-sm font-semibold text-[#1C1917]">
              Gestión de discrepancias operativas ({data.discrepancies.length})
            </h3>
            <p className="text-[11px] text-[#5E5851]">
              Una discrepancia documenta desvíos de traspaso o ejecución; nunca se computa automáticamente como falta disciplinaria.
            </p>
          </div>

          <div className="divide-y divide-[#F2EFE9]">
            {data.discrepancies.map((d) => {
              const sec = data.sectors.find((s) => s.id === d.sectorId);
              return (
                <div key={d.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusText
                        label={d.status === 'resuelta' ? 'Resuelta' : 'Abierta'}
                        tone={d.status === 'resuelta' ? 'positive' : 'danger'}
                      />
                      <span className="text-xs text-[#5E5851]">· {sec?.name}</span>
                      <span className="text-xs font-mono text-[#5E5851]">
                        · {formatDateTimeAR(d.reportedAt)}
                      </span>
                    </div>
                    {d.status !== 'resuelta' && permissions.canVerifyChecklists && (
                      <button
                        type="button"
                        onClick={() => setResolvingId(d.id)}
                        className="text-xs font-medium text-[#7C2D36] hover:underline cursor-pointer"
                      >
                        Registrar resolución
                      </button>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#1C1917]">{d.disputedTaskLabel}</div>
                  <p className="text-xs text-[#5E5851]">{d.observation}</p>
                  <div className="text-[11px] text-[#5E5851]">
                    Reportó: <strong className="text-[#1C1917]">{d.reportedByName}</strong>
                    {d.evidenceNote && ` · Evidencia: ${d.evidenceNote}`}
                  </div>
                  {d.resolution && (
                    <div className="mt-2 pt-2 border-t border-[#F2EFE9] text-xs text-[#15803D]">
                      <strong>Resolución ({d.verifiedByName}):</strong> {d.resolution}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={!!resolvingId}
        onClose={() => setResolvingId(null)}
        title="Registrar resolución de discrepancia"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className={labelClass}>Acción correctiva / resolución *</label>
            <textarea
              rows={3}
              required
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Ej. Se realizó saneamiento inmediato y se reforzó la lista de verificación del cierre nocturno."
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setResolvingId(null)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" className={primaryBtnClass}>
              Cerrar discrepancia
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const ManualsDocumentsSection: React.FC = () => {
  const { data, activeUser, permissions, uploadDocument, notify } = useAppStore();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('todos');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);

  // Upload form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('manual_operativo');
  const [sectorId, setSectorId] = useState(data.sectors[0]?.id ?? '');
  const [version, setVersion] = useState('v1.0');
  const [summary, setSummary] = useState('');
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  } | null>(null);

  const visibleDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.documents.filter((doc) => {
      if (!doc.allowedRoles.includes(activeUser.roleId) && activeUser.roleId !== 'admin_vegen') {
        return false;
      }
      if (sectorFilter !== 'todos' && doc.sectorId !== sectorFilter) return false;
      if (q && !`${doc.title} ${doc.summary} ${doc.fileName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.documents, activeUser.roleId, sectorFilter, search]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Honest demo persistence limit (2 MB) for IndexedDB browser storage
    if (file.size > 2 * 1024 * 1024) {
      notify(
        'En Modo Demostración (almacenamiento local IndexedDB) el límite máximo por archivo es 2 MB.',
        'warning'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileInfo({
        name: file.name,
        mimeType: file.type || 'application/pdf',
        sizeBytes: file.size,
        dataUrl: String(reader.result)
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileInfo) return;
    uploadDocument({
      title: title.trim(),
      category,
      sectorId: sectorId || undefined,
      version: version.trim() || 'v1.0',
      approvalStatus: 'vigente',
      approvedBy: activeUser.name,
      fileName: fileInfo.name,
      mimeType: fileInfo.mimeType,
      sizeBytes: fileInfo.sizeBytes,
      dataUrl: fileInfo.dataUrl,
      summary: summary.trim() || 'Documento cargado localmente en repositorio de demostración.',
      allowedRoles: [
        'admin_vegen',
        'direccion',
        'gerencia_pablo',
        'rrhh_raquel',
        'compras_rene',
        'responsable_sector',
        'colaborador'
      ]
    });
    setTitle('');
    setSummary('');
    setFileInfo(null);
    setUploadOpen(false);
  };

  const handleDownload = (doc: AppDocument) => {
    if (!doc.dataUrl) {
      notify('Archivo binario no disponible para este registro.', 'warning');
      return;
    }
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const decodeTextPreview = (dataUrl?: string) => {
    if (!dataUrl || !dataUrl.startsWith('data:text/plain')) return null;
    try {
      const b64 = dataUrl.split(',')[1];
      return decodeURIComponent(escape(atob(b64)));
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar manual o documento por título..."
            className={`${inputClass} max-w-xs`}
          />
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
        </div>

        {permissions.canUploadDocuments && (
          <button type="button" onClick={() => setUploadOpen(true)} className={primaryBtnClass}>
            <Upload className="w-4 h-4" />
            Subir documento (PDF / TXT)
          </button>
        )}
      </div>

      {visibleDocs.length === 0 ? (
        <EmptyState
          title="Sin documentos coincidentes"
          description="Ajustá los filtros de búsqueda o cargá un nuevo manual operativo."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleDocs.map((doc) => {
            const sec = data.sectors.find((s) => s.id === doc.sectorId);
            return (
              <div
                key={doc.id}
                className="bg-white border border-[#E6E2D8] rounded-lg p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5E5851]">
                    <span>
                      {sec?.name ?? 'General'} · {doc.version}
                    </span>
                    <StatusText
                      label={doc.approvalStatus === 'vigente' ? 'Vigente aprobado' : doc.approvalStatus}
                      tone={doc.approvalStatus === 'vigente' ? 'positive' : 'warning'}
                    />
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-[#1C1917] flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[#7C2D36] mt-0.5 shrink-0" />
                    <span>{doc.title}</span>
                  </h3>
                  <p className="mt-1.5 text-xs text-[#5E5851] leading-relaxed">{doc.summary}</p>
                </div>

                <div className="pt-3 border-t border-[#F2EFE9] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#5E5851] truncate">
                    {doc.fileName} ({Math.max(1, Math.round(doc.sizeBytes / 1024))} KB)
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingDoc(doc)}
                      className="inline-flex items-center gap-1 text-[#1C1917] hover:text-[#7C2D36] font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1 text-[#7C2D36] hover:underline font-medium cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Real Local File Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Subir manual o documento"
        subtitle="El archivo se almacena realmente en IndexedDB local (máx. 2 MB en Modo Demostración)."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Título del documento *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Manual de Limpieza de Parrilla y Campanas"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className={inputClass}
              >
                <option value="manual_operativo">Manual operativo</option>
                <option value="procedimiento">Procedimiento</option>
                <option value="seguridad_higiene">Seguridad e higiene</option>
                <option value="induccion">Inducción</option>
                <option value="rrhh_politica">Política RRHH</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Sector</label>
              <select
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
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
              <label className={labelClass}>Versión</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Resumen</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Archivo PDF o TXT (máx. 2 MB) *</label>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              required
              onChange={handleFileChange}
              className="block w-full text-xs text-[#5E5851] file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-[#D6D0C4] file:bg-[#F8F7F4] file:text-[#1C1917] file:font-medium hover:file:bg-[#EFECE5]"
            />
            {fileInfo && (
              <p className="mt-1.5 text-xs text-[#15803D]">
                Archivo listo: {fileInfo.name} ({Math.round(fileInfo.sizeBytes / 1024)} KB)
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setUploadOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="submit" disabled={!fileInfo} className={primaryBtnClass}>
              Guardar documento
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal
        open={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.title ?? ''}
        subtitle={
          viewingDoc
            ? `${viewingDoc.fileName} · Versión ${viewingDoc.version} · Aprobado por ${viewingDoc.approvedBy ?? '—'}`
            : ''
        }
        maxWidthClass="max-w-3xl"
      >
        {viewingDoc && (
          <div className="space-y-4">
            {viewingDoc.mimeType === 'application/pdf' && viewingDoc.dataUrl ? (
              <iframe
                src={viewingDoc.dataUrl}
                title={viewingDoc.title}
                className="w-full h-[60vh] border border-[#E6E2D8] rounded"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-xs bg-[#F8F7F4] border border-[#E6E2D8] rounded-md p-4 text-[#1C1917] leading-relaxed">
                {decodeTextPreview(viewingDoc.dataUrl) ??
                  'Vista previa no disponible para este formato. Utilizá el botón Descargar.'}
              </pre>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownload(viewingDoc)}
                className={primaryBtnClass}
              >
                <Download className="w-4 h-4" />
                Descargar archivo
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
