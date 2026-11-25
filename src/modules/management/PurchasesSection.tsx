import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Mail,
  MessageSquare,
  PackageCheck,
  Plus,
  Printer,
  Trash2
} from 'lucide-react';
import {
  inputClass,
  labelClass,
  Modal,
  primaryBtnClass,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { PurchaseOrder, PurchaseRequestStatus } from '../../domain/types';
import { useAppStore } from '../../services/store';
import {
  addDaysISO,
  formatARS,
  formatDateAR,
  formatDateTimeAR,
  formatNumberAR,
  todayISO
} from '../../utils/formatters';
import { generatePurchaseOrderPdf } from '../../utils/pdfGenerator';

const PR_STATUS_META: Record<
  PurchaseRequestStatus,
  { label: string; tone: 'neutral' | 'warning' | 'positive' | 'danger' | 'accent' }
> = {
  borrador: { label: 'Borrador', tone: 'neutral' },
  solicitado: { label: 'Solicitado', tone: 'warning' },
  en_verificacion: { label: 'En verificación', tone: 'warning' },
  verificado: { label: 'Verificado', tone: 'accent' },
  pendiente_aprobacion: { label: 'Pendiente de aprobación', tone: 'warning' },
  aprobado: { label: 'Aprobado', tone: 'positive' },
  rechazado: { label: 'Rechazado', tone: 'danger' },
  enviado: { label: 'Orden enviada', tone: 'accent' },
  recibido: { label: 'Recibido', tone: 'positive' },
  cerrado: { label: 'Cerrado', tone: 'positive' }
};

export const PurchasesSection: React.FC = () => {
  const {
    data,
    permissions,
    nav,
    notify,
    createPurchaseRequest,
    verifyPurchaseRequest,
    decidePurchaseRequest,
    generatePurchaseOrdersFromRequest,
    receiveGoodsForOrder
  } = useAppStore();

  const [subTab, setSubTab] = useState<'solicitudes' | 'ordenes'>('solicitudes');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedReqId, setSelectedReqId] = useState<string>(
    nav.selectedPurchaseRequestId ?? data.purchaseRequests[0]?.id ?? ''
  );

  // Create Request Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [reqSectorId, setReqSectorId] = useState('sec-cocina');
  const [neededByDate, setNeededByDate] = useState(addDaysISO(todayISO(), 1));
  const [priority, setPriority] = useState<'normal' | 'alta' | 'urgente'>('normal');
  const [reqNotes, setReqNotes] = useState('');
  const [prodSearch, setProdSearch] = useState('');
  const [draftLines, setDraftLines] = useState<
    Array<{ productId: string; requestedQty: number; notes: string }>
  >([]);

  // Verify Stock Modal (René)
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyInputs, setVerifyInputs] = useState<
    Record<string, { physicalStock: number; verifiedQty: number; justification: string }>
  >({});
  const [verifyGeneralNote, setVerifyGeneralNote] = useState('');

  // Approve Modal (Pablo)
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveInputs, setApproveInputs] = useState<Record<string, number>>({});
  const [approveNote, setApproveNote] = useState('');

  // Goods Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<PurchaseOrder | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [receiptDiscrepancy, setReceiptDiscrepancy] = useState('');

  const filteredRequests = useMemo(
    () =>
      data.purchaseRequests.filter(
        (r) => statusFilter === 'todos' || r.status === statusFilter
      ),
    [data.purchaseRequests, statusFilter]
  );

  const selectedRequest =
    data.purchaseRequests.find((r) => r.id === selectedReqId) ?? filteredRequests[0];

  const relatedOrders = useMemo(
    () =>
      selectedRequest
        ? data.purchaseOrders.filter((o) => o.purchaseRequestId === selectedRequest.id)
        : [],
    [data.purchaseOrders, selectedRequest]
  );

  const filteredCatalog = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    return data.products
      .filter((p) => p.active && (!q || `${p.name} ${p.sku} ${p.subcategory}`.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [data.products, prodSearch]);

  const addDraftLine = (productId: string) => {
    if (draftLines.some((l) => l.productId === productId)) return;
    const prod = data.products.find((p) => p.id === productId);
    const suggested = prod ? Math.max(1, prod.minStock - prod.currentStock + 5) : 10;
    setDraftLines((prev) => [...prev, { productId, requestedQty: suggested, notes: '' }]);
  };

  const handleCreateSubmit = (submitNow: boolean) => {
    if (draftLines.length === 0) {
      notify('Agregá al menos un producto a la solicitud.', 'warning');
      return;
    }
    const newId = createPurchaseRequest({
      sectorId: reqSectorId,
      neededByDate,
      priority,
      observations: reqNotes.trim() || undefined,
      submitNow,
      lines: draftLines
    });
    setSelectedReqId(newId);
    setDraftLines([]);
    setReqNotes('');
    setCreateOpen(false);
  };

  const openVerifyModal = () => {
    if (!selectedRequest) return;
    const init: Record<string, { physicalStock: number; verifiedQty: number; justification: string }> = {};
    selectedRequest.lines.forEach((l) => {
      const prod = data.products.find((p) => p.id === l.productId);
      init[l.id] = {
        physicalStock: l.physicalVerifiedStock ?? prod?.currentStock ?? l.systemStockAtRequest,
        verifiedQty: l.verifiedQty ?? l.requestedQty,
        justification: l.justification ?? ''
      };
    });
    setVerifyInputs(init);
    setVerifyGeneralNote('');
    setVerifyOpen(true);
  };

  const handleConfirmVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    verifyPurchaseRequest(
      selectedRequest.id,
      selectedRequest.lines.map((l) => ({
        lineId: l.id,
        physicalVerifiedStock: Number(verifyInputs[l.id]?.physicalStock ?? 0),
        verifiedQty: Number(verifyInputs[l.id]?.verifiedQty ?? l.requestedQty),
        justification: verifyInputs[l.id]?.justification || undefined
      })),
      true,
      verifyGeneralNote.trim() || undefined
    );
    setVerifyOpen(false);
  };

  const openApproveModal = () => {
    if (!selectedRequest) return;
    const init: Record<string, number> = {};
    selectedRequest.lines.forEach((l) => {
      init[l.id] = l.approvedQty ?? l.verifiedQty ?? l.requestedQty;
    });
    setApproveInputs(init);
    setApproveNote('');
    setApproveOpen(true);
  };

  const handleDecision = (decision: 'aprobado' | 'rechazado') => {
    if (!selectedRequest) return;
    decidePurchaseRequest(
      selectedRequest.id,
      decision,
      selectedRequest.lines.map((l) => ({
        lineId: l.id,
        approvedQty: Number(approveInputs[l.id] ?? l.verifiedQty ?? l.requestedQty)
      })),
      approveNote.trim() || undefined
    );
    setApproveOpen(false);
  };

  const openReceiveModal = (order: PurchaseOrder) => {
    const init: Record<string, number> = {};
    order.lines.forEach((l) => {
      init[l.productId] = Math.max(0, l.approvedQty - l.receivedQty);
    });
    setReceivedQtys(init);
    setReceiptDiscrepancy('');
    setReceiptOrder(order);
  };

  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptOrder) return;
    receiveGoodsForOrder({
      orderId: receiptOrder.id,
      receivedLines: receiptOrder.lines.map((l) => ({
        productId: l.productId,
        receivedQty: Number(receivedQtys[l.productId] ?? 0)
      })),
      discrepancyNotes: receiptDiscrepancy.trim() || undefined
    });
    setReceiptOrder(null);
  };

  const shareOrderWhatsApp = (order: PurchaseOrder) => {
    const sup = data.suppliers.find((s) => s.id === order.supplierId);
    const itemsText = order.lines
      .map((l) => `- ${l.productName}: ${l.approvedQty} ${l.unit}`)
      .join('\n');
    const msg = `La Rueda 1975 — Orden de Compra ${order.orderNumber} (Demo)\nProveedor: ${sup?.name ?? ''}\nFecha: ${formatDateAR(order.issueDate)}\n\nDetalle:\n${itemsText}\n\nNota: Descargar el PDF adjunto desde la plataforma para compartirlo manualmente.`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.location.assign(url);
  };

  const shareOrderEmail = (order: PurchaseOrder) => {
    const sup = data.suppliers.find((s) => s.id === order.supplierId);
    const subject = `La Rueda 1975 — Orden de Compra ${order.orderNumber} (Demo)`;
    const body = `Estimados ${sup?.contactName ?? ''},\n\nAdjuntamos detalle de la Orden de Compra ${order.orderNumber} (emitida en Modo Demostración):\n\n${order.lines.map((l) => `* ${l.productName}: ${l.approvedQty} ${l.unit}`).join('\n')}\n\nEntrega: ${order.deliveryInfo}\n(Recuerde adjuntar el PDF descargado desde el botón "Descargar PDF").`;
    window.location.href = `mailto:${sup?.demoEmail ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('solicitudes')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md cursor-pointer ${
              subTab === 'solicitudes'
                ? 'bg-[#181615] text-white'
                : 'bg-white text-[#5E5851] border border-[#E6E2D8]'
            }`}
          >
            Solicitudes de compra ({data.purchaseRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('ordenes')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md cursor-pointer ${
              subTab === 'ordenes'
                ? 'bg-[#181615] text-white'
                : 'bg-white text-[#5E5851] border border-[#E6E2D8]'
            }`}
          >
            Órdenes de compra y recepciones ({data.purchaseOrders.length})
          </button>

          {subTab === 'solicitudes' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[#D6D0C4] bg-white px-3 py-1.5 text-xs text-[#1C1917]"
            >
              <option value="todos">Todos los estados</option>
              <option value="solicitado">Solicitado</option>
              <option value="pendiente_aprobacion">Pendiente de aprobación</option>
              <option value="aprobado">Aprobado</option>
              <option value="enviado">Orden enviada</option>
              <option value="recibido">Recibido</option>
              <option value="cerrado">Cerrado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          )}
        </div>

        {permissions.canCreatePurchaseRequest && (
          <button type="button" onClick={() => setCreateOpen(true)} className={primaryBtnClass}>
            <Plus className="w-4 h-4" />
            Nueva solicitud de compra
          </button>
        )}
      </div>

      {/* TAB 1: PURCHASE REQUESTS WORKFLOW */}
      {subTab === 'solicitudes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E6E2D8] bg-[#F8F7F4] text-xs font-semibold text-[#1C1917]">
              Circuito digital: Sector → Compras → Operación → Proveedor
            </div>
            <div className="divide-y divide-[#F2EFE9] max-h-[650px] overflow-y-auto">
              {filteredRequests.map((req) => {
                const sec = data.sectors.find((s) => s.id === req.sectorId);
                const meta = PR_STATUS_META[req.status];
                const active = selectedRequest?.id === req.id;
                return (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setSelectedReqId(req.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                      active ? 'bg-[#7C2D36]/8' : 'hover:bg-[#F8F7F4]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#1C1917]">
                        {req.code}
                      </span>
                      <StatusText label={meta.label} tone={meta.tone} />
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#1C1917]">
                      {sec?.name} · {req.requestedByName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#5E5851]">
                      {req.lines.length} ítem(s) · Necesidad {formatDateAR(req.neededByDate)} · Prioridad{' '}
                      {req.priority}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Detail Panel */}
          <div className="lg:col-span-8">
            {selectedRequest && (
              <div className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#EFECE5]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#5E5851]">
                      <span className="font-mono">{selectedRequest.code}</span>
                      <span>·</span>
                      <span>Solicitó: {selectedRequest.requestedByName}</span>
                      <span>·</span>
                      <span>Necesidad: {formatDateAR(selectedRequest.neededByDate)}</span>
                    </div>
                    <h3 className="mt-1 text-2xl font-editorial font-semibold text-[#1C1917]">
                      {data.sectors.find((s) => s.id === selectedRequest.sectorId)?.name ?? 'Sector'} — Solicitud de insumos
                    </h3>
                    <div className="mt-1">
                      <StatusText
                        label={PR_STATUS_META[selectedRequest.status].label}
                        tone={PR_STATUS_META[selectedRequest.status].tone}
                      />
                    </div>
                  </div>

                  {/* Role-gated Workflow Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {permissions.canVerifyPurchaseStock &&
                      ['solicitado', 'en_verificacion', 'borrador'].includes(selectedRequest.status) && (
                        <button type="button" onClick={openVerifyModal} className={primaryBtnClass}>
                          <ClipboardCheck className="w-4 h-4" />
                          Verificar stock físico
                        </button>
                      )}

                    {permissions.canApprovePurchases &&
                      ['verificado', 'pendiente_aprobacion', 'solicitado'].includes(
                        selectedRequest.status
                      ) && (
                        <button type="button" onClick={openApproveModal} className={primaryBtnClass}>
                          <CheckCircle2 className="w-4 h-4" />
                          Aprobar / Rechazar
                        </button>
                      )}

                    {(permissions.canVerifyPurchaseStock || permissions.canApprovePurchases) &&
                      selectedRequest.status === 'aprobado' && (
                        <button
                          type="button"
                          onClick={() => {
                            generatePurchaseOrdersFromRequest(selectedRequest.id);
                          }}
                          className={primaryBtnClass}
                        >
                          Emitir órdenes por proveedor
                        </button>
                      )}
                  </div>
                </div>

                {selectedRequest.observations && (
                  <p className="text-xs text-[#5E5851] bg-[#F8F7F4] border border-[#E6E2D8] rounded p-3">
                    <strong className="text-[#1C1917]">Observación de solicitud:</strong>{' '}
                    {selectedRequest.observations}
                  </p>
                )}

                {/* Quantities Progression Table: Requested -> Verified -> Approved -> Received */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E6E2D8] text-left text-xs text-[#5E5851]">
                        <th className="py-2 pr-3 font-medium">Producto / Proveedor</th>
                        <th className="py-2 px-2 font-medium text-right">Stock Sist.</th>
                        <th className="py-2 px-2 font-medium text-right">Stock Fís.</th>
                        <th className="py-2 px-2 font-medium text-right">Solicitado</th>
                        <th className="py-2 px-2 font-medium text-right">Verificado</th>
                        <th className="py-2 px-2 font-medium text-right">Aprobado</th>
                        <th className="py-2 pl-2 font-medium text-right">Recibido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE9]">
                      {selectedRequest.lines.map((line) => {
                        const prod = data.products.find((p) => p.id === line.productId);
                        const sup = data.suppliers.find((s) => s.id === line.supplierId);
                        return (
                          <tr key={line.id}>
                            <td className="py-2.5 pr-3">
                              <div className="font-medium text-[#1C1917]">
                                {prod?.name ?? line.productId}
                              </div>
                              <div className="text-[11px] text-[#5E5851]">
                                {sup?.name} · Ref. {formatARS(line.referenceUnitPriceArs ?? 0)}/{line.unit}
                              </div>
                              {line.justification && (
                                <div className="text-[11px] text-[#7C2D36] mt-0.5">
                                  Nota: {line.justification}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#5E5851]">
                              {formatNumberAR(line.systemStockAtRequest, 1)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                              {line.physicalVerifiedStock !== undefined
                                ? formatNumberAR(line.physicalVerifiedStock, 1)
                                : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                              {formatNumberAR(line.requestedQty, 1)} {line.unit}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums font-medium">
                              {line.verifiedQty !== undefined
                                ? `${formatNumberAR(line.verifiedQty, 1)} ${line.unit}`
                                : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold text-[#15803D]">
                              {line.approvedQty !== undefined
                                ? `${formatNumberAR(line.approvedQty, 1)} ${line.unit}`
                                : '—'}
                            </td>
                            <td className="py-2.5 pl-2 text-right font-mono tabular-nums">
                              {line.receivedQty !== undefined
                                ? `${formatNumberAR(line.receivedQty, 1)} ${line.unit}`
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Linked Purchase Orders */}
                {relatedOrders.length > 0 && (
                  <div className="pt-3 border-t border-[#EFECE5] space-y-2.5">
                    <h4 className="text-xs font-semibold text-[#1C1917]">
                      Órdenes de compra generadas desde esta solicitud ({relatedOrders.length})
                    </h4>
                    {relatedOrders.map((po) => {
                      const sup = data.suppliers.find((s) => s.id === po.supplierId);
                      return (
                        <div
                          key={po.id}
                          className="p-3.5 bg-[#F8F7F4] border border-[#E6E2D8] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-[#1C1917]">
                              {po.orderNumber} · {sup?.name}
                            </div>
                            <div className="text-xs text-[#5E5851]">
                              Emitida {formatDateAR(po.issueDate)} · Estado: {po.status} · {po.lines.length} ítem(s)
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => generatePurchaseOrderPdf(po, sup)}
                              className={secondaryBtnClass}
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              PDF
                            </button>
                            {permissions.canReceiveGoods &&
                              po.status !== 'recibida' &&
                              po.status !== 'cerrada' && (
                                <button
                                  type="button"
                                  onClick={() => openReceiveModal(po)}
                                  className={primaryBtnClass}
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  Registrar recepción
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Traceable Transition History */}
                <div className="pt-3 border-t border-[#EFECE5]">
                  <h4 className="text-xs font-semibold text-[#5E5851] mb-2">
                    Trazabilidad de actores y transiciones
                  </h4>
                  <div className="space-y-2 border-l border-[#D6D0C4] pl-4">
                    {selectedRequest.transitions.map((tr) => (
                      <div key={tr.id} className="text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-[#5E5851]">
                          <span className="font-mono tabular-nums">{formatDateTimeAR(tr.timestamp)}</span>
                          <span>·</span>
                          <span className="font-semibold text-[#1C1917]">{tr.actorName}</span>
                          <span>({tr.actorRole})</span>
                          <span>→</span>
                          <span className="font-medium text-[#7C2D36]">
                            {PR_STATUS_META[tr.toStatus].label}
                          </span>
                        </div>
                        {tr.notes && <p className="text-[#1C1917] mt-0.5">{tr.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS & PDF / SHARE / RECEIPTS */}
      {subTab === 'ordenes' && (
        <div className="space-y-4">
          {data.purchaseOrders.map((po) => {
            const sup = data.suppliers.find((s) => s.id === po.supplierId);
            const totalEst = po.lines.reduce(
              (acc, l) => acc + l.approvedQty * l.referenceUnitPriceArs,
              0
            );
            return (
              <div key={po.id} className="bg-white border border-[#E6E2D8] rounded-lg p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#EFECE5]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#5E5851]">
                      <span className="font-mono font-semibold text-[#1C1917]">{po.orderNumber}</span>
                      <span>·</span>
                      <span>Origen: {po.purchaseRequestCode}</span>
                      <span>·</span>
                      <span>Fecha: {formatDateAR(po.issueDate)}</span>
                      <span>·</span>
                      <StatusText
                        label={po.status.replace('_', ' ')}
                        tone={po.status === 'recibida' || po.status === 'cerrada' ? 'positive' : 'accent'}
                      />
                    </div>
                    <h3 className="mt-1 text-xl font-editorial font-semibold text-[#1C1917]">
                      {sup?.name ?? 'Proveedor'}
                    </h3>
                    <p className="text-xs text-[#5E5851] mt-0.5">
                      Autorizó: {po.authorizedByName} · Entrega: {po.deliveryInfo}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generatePurchaseOrderPdf(po, sup)}
                      className={secondaryBtnClass}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Descargar PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className={secondaryBtnClass}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir
                    </button>
                    <button
                      type="button"
                      onClick={() => shareOrderWhatsApp(po)}
                      className={secondaryBtnClass}
                      title="Abre WhatsApp con texto resumido; adjuntá el PDF descargado manualmente."
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => shareOrderEmail(po)}
                      className={secondaryBtnClass}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </button>
                    {permissions.canReceiveGoods &&
                      po.status !== 'recibida' &&
                      po.status !== 'cerrada' && (
                        <button
                          type="button"
                          onClick={() => openReceiveModal(po)}
                          className={primaryBtnClass}
                        >
                          <PackageCheck className="w-4 h-4" />
                          Recibir mercadería
                        </button>
                      )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#EFECE5] text-left text-xs text-[#5E5851]">
                        <th className="py-2 font-medium">Producto</th>
                        <th className="py-2 font-medium text-right">Aprobado</th>
                        <th className="py-2 font-medium text-right">Recibido</th>
                        <th className="py-2 font-medium text-right">Precio Ref.</th>
                        <th className="py-2 font-medium text-right">Subtotal Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE9]">
                      {po.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2 font-medium text-[#1C1917]">{l.productName}</td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {l.approvedQty} {l.unit}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {l.receivedQty} {l.unit}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-[#5E5851]">
                            {formatARS(l.referenceUnitPriceArs)}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums font-semibold">
                            {formatARS(l.approvedQty * l.referenceUnitPriceArs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-[#5E5851]">
                  <span>
                    Nota de compartir: los navegadores no adjuntan PDFs automáticamente; descargá el PDF para enviarlo.
                  </span>
                  <span className="font-mono text-sm font-semibold text-[#7C2D36]">
                    Total ref.: {formatARS(totalEst)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Purchase Request Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva solicitud digital de compra"
        subtitle="Reemplaza las planillas manuales preservando verificación física en depósito."
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Sector solicitante *</label>
              <select
                value={reqSectorId}
                onChange={(e) => setReqSectorId(e.target.value)}
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
              <label className={labelClass}>Fecha de necesidad *</label>
              <input
                type="date"
                value={neededByDate}
                onChange={(e) => setNeededByDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'normal' | 'alta' | 'urgente')}
                className={inputClass}
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Searchable Product Catalog Picker */}
          <div className="border border-[#E6E2D8] rounded-md p-3.5 bg-[#F8F7F4] space-y-2.5">
            <label className={labelClass}>Agregar productos desde el catálogo central</label>
            <input
              type="text"
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU (ej. Ojo de bife, Langostinos, Crema)..."
              className={inputClass}
            />
            <div className="max-h-40 overflow-y-auto divide-y divide-[#EFECE5] bg-white border border-[#E6E2D8] rounded">
              {filteredCatalog.map((p) => (
                <div
                  key={p.id}
                  className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-[#F8F7F4]"
                >
                  <div>
                    <span className="font-medium text-[#1C1917]">{p.name}</span>
                    <span className="text-[#5E5851]">
                      {' '}
                      · Stock: {p.currentStock}/{p.minStock} {p.baseUnit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addDraftLine(p.id)}
                    className="text-[#7C2D36] font-medium hover:underline cursor-pointer shrink-0"
                  >
                    + Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Lines */}
          {draftLines.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#1C1917]">
                Ítems solicitados ({draftLines.length})
              </div>
              {draftLines.map((line) => {
                const prod = data.products.find((p) => p.id === line.productId);
                return (
                  <div
                    key={line.productId}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 border border-[#E6E2D8] rounded text-xs"
                  >
                    <div className="sm:col-span-5 font-medium text-[#1C1917]">{prod?.name}</div>
                    <div className="sm:col-span-3 flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0.5}
                        step="any"
                        value={line.requestedQty}
                        onChange={(e) =>
                          setDraftLines((prev) =>
                            prev.map((l) =>
                              l.productId === line.productId
                                ? { ...l, requestedQty: Number(e.target.value) }
                                : l
                            )
                          )
                        }
                        className="w-20 rounded border border-[#D6D0C4] px-2 py-1 font-mono"
                      />
                      <span className="text-[#5E5851]">{prod?.baseUnit}</span>
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Nota..."
                        value={line.notes}
                        onChange={(e) =>
                          setDraftLines((prev) =>
                            prev.map((l) =>
                              l.productId === line.productId ? { ...l, notes: e.target.value } : l
                            )
                          )
                        }
                        className="w-full rounded border border-[#D6D0C4] px-2 py-1"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftLines((prev) =>
                            prev.filter((l) => l.productId !== line.productId)
                          )
                        }
                        aria-label="Quitar ítem"
                        className="text-[#B91C1C] hover:bg-[#B91C1C]/10 p-1 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className={labelClass}>Observaciones generales</label>
            <textarea
              rows={2}
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              placeholder="Ej. Reposición por reservas de grupos turísticos."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
            <button type="button" onClick={() => setCreateOpen(false)} className={secondaryBtnClass}>
              Cancelar
            </button>
            <button type="button" onClick={() => handleCreateSubmit(false)} className={secondaryBtnClass}>
              Guardar borrador
            </button>
            <button type="button" onClick={() => handleCreateSubmit(true)} className={primaryBtnClass}>
              Enviar a verificación
            </button>
          </div>
        </div>
      </Modal>

      {/* René Physical Stock Verification Modal */}
      <Modal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title={`Verificación física de existencias — ${selectedRequest?.code ?? ''}`}
        subtitle="Registrá el stock físico contado en depósito y ajustá la cantidad verificada con justificación."
        maxWidthClass="max-w-3xl"
      >
        {selectedRequest && (
          <form onSubmit={handleConfirmVerify} className="space-y-4">
            <div className="space-y-3">
              {selectedRequest.lines.map((line) => {
                const prod = data.products.find((p) => p.id === line.productId);
                const val = verifyInputs[line.id] ?? {
                  physicalStock: line.systemStockAtRequest,
                  verifiedQty: line.requestedQty,
                  justification: ''
                };
                return (
                  <div key={line.id} className="p-3.5 border border-[#E6E2D8] rounded-md space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1C1917]">{prod?.name}</span>
                      <span className="font-mono text-[#5E5851]">
                        Solicitado: {line.requestedQty} {line.unit} · Stock sistema: {line.systemStockAtRequest}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Stock físico verificado ({line.unit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          required
                          value={val.physicalStock}
                          onChange={(e) =>
                            setVerifyInputs((prev) => ({
                              ...prev,
                              [line.id]: { ...val, physicalStock: Number(e.target.value) }
                            }))
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Cantidad a comprar validada ({line.unit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          required
                          value={val.verifiedQty}
                          onChange={(e) =>
                            setVerifyInputs((prev) => ({
                              ...prev,
                              [line.id]: { ...val, verifiedQty: Number(e.target.value) }
                            }))
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Justificación del ajuste</label>
                        <input
                          type="text"
                          value={val.justification}
                          onChange={(e) =>
                            setVerifyInputs((prev) => ({
                              ...prev,
                              [line.id]: { ...val, justification: e.target.value }
                            }))
                          }
                          placeholder="Ej. Conteo físico en cámara"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <label className={labelClass}>Observación general para Operación</label>
              <textarea
                rows={2}
                value={verifyGeneralNote}
                onChange={(e) => setVerifyGeneralNote(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
              <button type="button" onClick={() => setVerifyOpen(false)} className={secondaryBtnClass}>
                Cancelar
              </button>
              <button type="submit" className={primaryBtnClass}>
                Confirmar verificación y elevar a aprobación
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Pablo Approval Modal */}
      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title={`Decisión de compra — ${selectedRequest?.code ?? ''}`}
        subtitle="Validá cantidades finales según demanda esperada, reservas y existencias verificadas."
        maxWidthClass="max-w-2xl"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {selectedRequest.lines.map((line) => {
                const prod = data.products.find((p) => p.id === line.productId);
                return (
                  <div
                    key={line.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-[#E6E2D8] rounded text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#1C1917]">{prod?.name}</div>
                      <div className="text-[#5E5851]">
                        Solic.: {line.requestedQty} · Verif. Compras: {line.verifiedQty ?? line.requestedQty}{' '}
                        {line.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5E5851]">Aprobado:</span>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={approveInputs[line.id] ?? line.verifiedQty ?? line.requestedQty}
                        onChange={(e) =>
                          setApproveInputs((prev) => ({
                            ...prev,
                            [line.id]: Number(e.target.value)
                          }))
                        }
                        className="w-24 rounded border border-[#D6D0C4] px-2 py-1 font-mono"
                      />
                      <span>{line.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <label className={labelClass}>Nota de decisión</label>
              <textarea
                rows={2}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Ej. Aprobado según proyección de ocupación del fin de semana."
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
              <button type="button" onClick={() => setApproveOpen(false)} className={secondaryBtnClass}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDecision('rechazado')}
                className="px-4 py-2 text-sm font-medium text-[#B91C1C] border border-[#B91C1C]/40 hover:bg-[#B91C1C]/8 rounded-md cursor-pointer"
              >
                Rechazar
              </button>
              <button type="button" onClick={() => handleDecision('aprobado')} className={primaryBtnClass}>
                Aprobar compra
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Goods Receipt Modal */}
      <Modal
        open={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        title={`Recepción de mercadería — ${receiptOrder?.orderNumber ?? ''}`}
        subtitle="Registrar recepción total o parcial actualiza automáticamente el inventario con trazabilidad."
      >
        {receiptOrder && (
          <form onSubmit={handleConfirmReceipt} className="space-y-4">
            <div className="space-y-2.5">
              {receiptOrder.lines.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 p-3 border border-[#E6E2D8] rounded text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#1C1917]">{l.productName}</div>
                    <div className="text-[#5E5851]">
                      Ordenado: {l.approvedQty} {l.unit} · Ya recibido: {l.receivedQty} {l.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[#5E5851]">Recibe ahora:</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={receivedQtys[l.productId] ?? 0}
                      onChange={(e) =>
                        setReceivedQtys((prev) => ({
                          ...prev,
                          [l.productId]: Number(e.target.value)
                        }))
                      }
                      className="w-24 rounded border border-[#D6D0C4] px-2 py-1 font-mono"
                    />
                    <span>{l.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className={labelClass}>Observaciones / diferencias de remito (opcional)</label>
              <textarea
                rows={2}
                value={receiptDiscrepancy}
                onChange={(e) => setReceiptDiscrepancy(e.target.value)}
                placeholder="Ej. Entrega parcial; saldo restante comprometido para mañana."
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFECE5]">
              <button type="button" onClick={() => setReceiptOrder(null)} className={secondaryBtnClass}>
                Cancelar
              </button>
              <button type="submit" className={primaryBtnClass}>
                Confirmar ingreso a stock
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
