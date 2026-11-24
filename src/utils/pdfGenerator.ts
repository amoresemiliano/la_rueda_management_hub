import { jsPDF } from 'jspdf';
import { Employee, PayrollPeriod, PayrollPreparationLine, PurchaseOrder, Supplier } from '../domain/types';
import { formatARS, formatDateAR, formatNumberAR } from './formatters';

export function generatePurchaseOrderPdf(
  order: PurchaseOrder,
  supplier: Supplier | undefined
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(24, 22, 21);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text('LA RUEDA 1975', 16, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(214, 206, 196);
  doc.text('Puerto Iguazú, Misiones, Argentina · Orden de Compra (Modo demostración)', 16, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(order.orderNumber, pageWidth - 16, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${formatDateAR(order.issueDate)}`, pageWidth - 16, 22, { align: 'right' });

  // Supplier and metadata block
  let y = 44;
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PROVEEDOR', 16, y);
  doc.text('DATOS DE ENTREGA Y AUTORIZACIÓN', 110, y);

  doc.setDrawColor(230, 226, 216);
  doc.line(16, y + 2, pageWidth - 16, y + 2);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(supplier?.name ?? 'Proveedor no especificado', 16, y);
  doc.text(`Solicitud origen: ${order.purchaseRequestCode}`, 110, y);

  y += 5.5;
  doc.setTextColor(94, 88, 81);
  doc.text(`Identificador demo: ${supplier?.fictionalTaxCode ?? '—'}`, 16, y);
  doc.text(`Autorizado por: ${order.authorizedByName}`, 110, y);

  y += 5.5;
  doc.text(`Contacto: ${supplier?.contactName ?? '—'} (${supplier?.demoPhone ?? '—'})`, 16, y);
  doc.text(`Entrega: ${order.deliveryInfo}`, 110, y);

  y += 5.5;
  doc.text(`Email demo: ${supplier?.demoEmail ?? '—'}`, 16, y);
  doc.text(`Estado actual: ${order.status.toUpperCase()}`, 110, y);

  // Table header
  y += 14;
  doc.setFillColor(242, 239, 233);
  doc.rect(16, y - 5, pageWidth - 32, 8, 'F');
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Producto', 18, y);
  doc.text('Unidad', 108, y);
  doc.text('Cant. Aprobada', 132, y, { align: 'right' });
  doc.text('Precio Ref.', 164, y, { align: 'right' });
  doc.text('Subtotal Est.', pageWidth - 18, y, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  let grandTotal = 0;

  order.lines.forEach((line) => {
    const subtotal = line.approvedQty * line.referenceUnitPriceArs;
    grandTotal += subtotal;

    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(28, 25, 23);
    doc.text(line.productName.slice(0, 44), 18, y);
    doc.setTextColor(94, 88, 81);
    doc.text(line.unit, 108, y);
    doc.setTextColor(28, 25, 23);
    doc.text(formatNumberAR(line.approvedQty, 2), 132, y, { align: 'right' });
    doc.text(formatARS(line.referenceUnitPriceArs), 164, y, { align: 'right' });
    doc.text(formatARS(subtotal), pageWidth - 18, y, { align: 'right' });

    doc.setDrawColor(238, 235, 229);
    doc.line(16, y + 2.5, pageWidth - 16, y + 2.5);
    y += 7.5;
  });

  // Total row
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(124, 45, 54);
  doc.text('TOTAL ESTIMADO DE REFERENCIA:', 110, y);
  doc.text(formatARS(grandTotal), pageWidth - 18, y, { align: 'right' });

  if (order.notes) {
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    doc.text('OBSERVACIONES:', 16, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(94, 88, 81);
    const wrapped = doc.splitTextToSize(order.notes, pageWidth - 32);
    doc.text(wrapped, 16, y);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(130, 124, 117);
  doc.text(
    'Documento generado en Modo Demostración — Datos sintéticos. Tecnología y transformación digital por VEGEN.',
    pageWidth / 2,
    286,
    { align: 'center' }
  );

  doc.save(`${order.orderNumber}_LaRueda1975.pdf`);
}

export function generatePayrollSummaryPdf(
  period: PayrollPeriod,
  lines: PayrollPreparationLine[],
  employees: Employee[]
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const empMap = new Map(employees.map((e) => [e.id, e]));

  doc.setFillColor(24, 22, 21);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.text('LA RUEDA 1975 — Pre-liquidación Semanal (Herramienta de Gestión)', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Período: ${period.label} (${formatDateAR(period.startDate)} al ${formatDateAR(period.endDate)}) · No reemplaza liquidación legal certificada`,
    14,
    20
  );

  let y = 36;
  doc.setFillColor(242, 239, 233);
  doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Legajo', 16, y);
  doc.text('Empleado', 36, y);
  doc.text('Base Sem.', 112, y, { align: 'right' });
  doc.text('Hs Extra', 136, y, { align: 'right' });
  doc.text('Propinas', 162, y, { align: 'right' });
  doc.text('Adelantos/Prést.', 196, y, { align: 'right' });
  doc.text('Ajustes', 222, y, { align: 'right' });
  doc.text('Neto Est.', 252, y, { align: 'right' });
  doc.text('Estado', 280, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  let totalNet = 0;

  lines.forEach((line) => {
    const emp = empMap.get(line.employeeId);
    totalNet += line.netEstimatedArs;
    if (y > 190) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(28, 25, 23);
    doc.text(emp?.legajo ?? '—', 16, y);
    doc.text(emp ? `${emp.lastName}, ${emp.firstName}`.slice(0, 28) : line.employeeId, 36, y);
    doc.text(formatARS(line.baseWeeklyArs), 112, y, { align: 'right' });
    doc.text(formatARS(line.extraHoursAmountArs), 136, y, { align: 'right' });
    doc.text(formatARS(line.tipsAmountArs), 162, y, { align: 'right' });
    doc.text(formatARS(-(line.advancesDeductionArs + line.loanInstallmentArs)), 196, y, {
      align: 'right'
    });
    doc.text(formatARS(line.otherAdjustmentsArs), 222, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatARS(line.netEstimatedArs), 252, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(line.reviewStatus, 280, y, { align: 'right' });
    y += 6.5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(124, 45, 54);
  doc.text(`TOTAL NETO ESTIMADO (${lines.length} colaboradores): ${formatARS(totalNet)}`, 252, y, {
    align: 'right'
  });

  doc.save(`Preliquidacion_${period.code}_LaRueda1975.pdf`);
}
