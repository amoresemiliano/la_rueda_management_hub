import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import { EmptyState, KpiCard, StatusText } from '../../components/ui/Primitives';
import { useAppStore } from '../../services/store';
import { formatARS, formatIntAR, formatNumberAR, formatPercent } from '../../utils/formatters';
import { ManagementDashboardSection } from '../management/ManagementDashboardSection';
import { MenuEngineeringSection } from '../management/MenuEngineeringSection';

type GestionAnalyticsTab = 'ventas' | 'menu' | 'compras' | 'inventario' | 'mermas';

export const AnalyticsManagementSection: React.FC = () => {
  const { data, permissions, nav, navigate } = useAppStore();

  const availableTabs = useMemo(() => {
    const list: Array<{ id: GestionAnalyticsTab; label: string }> = [];
    if (permissions.canViewFinancialMetrics) {
      list.push({ id: 'ventas', label: 'Ventas y rentabilidad' });
      list.push({ id: 'menu', label: 'Ingeniería de menú' });
    }
    if (permissions.canViewManagement) {
      list.push({ id: 'compras', label: 'Compras y proveedores' });
      list.push({ id: 'inventario', label: 'Inventario y rotación' });
      list.push({ id: 'mermas', label: 'Mermas y desperdicios' });
    }
    return list;
  }, [permissions.canViewFinancialMetrics, permissions.canViewManagement]);

  const [subTab, setSubTab] = useState<GestionAnalyticsTab>(() => {
    const requested = nav.analyticsSubTab as GestionAnalyticsTab | undefined;
    if (requested && availableTabs.some((t) => t.id === requested)) return requested;
    return availableTabs[0]?.id ?? 'compras';
  });

  useEffect(() => {
    const requested = nav.analyticsSubTab as GestionAnalyticsTab | undefined;
    if (requested && availableTabs.some((t) => t.id === requested)) {
      setSubTab(requested);
    }
  }, [nav.analyticsSubTab, availableTabs]);

  // Purchases analytics
  const purchaseAnalytics = useMemo(() => {
    const bySupplier = data.suppliers.map((sup) => {
      const orders = data.purchaseOrders.filter((o) => o.supplierId === sup.id);
      const totalArs = orders.reduce(
        (acc, o) => acc + o.lines.reduce((s, l) => s + l.approvedQty * l.referenceUnitPriceArs, 0),
        0
      );
      return {
        id: sup.id,
        name: sup.name,
        shortName: sup.name.slice(0, 18),
        ordersCount: orders.length,
        totalArs,
        leadTimeDays: sup.leadTimeDays
      };
    });

    const statusGroups = [
      { key: 'pendientes', label: 'Pend. verificación / aprob.', count: data.purchaseRequests.filter((r) => ['solicitado', 'en_verificacion', 'verificado', 'pendiente_aprobacion'].includes(r.status)).length },
      { key: 'aprobadas', label: 'Aprobadas / enviadas', count: data.purchaseRequests.filter((r) => ['aprobado', 'enviado'].includes(r.status)).length },
      { key: 'recibidas', label: 'Recibidas / cerradas', count: data.purchaseRequests.filter((r) => ['recibido', 'cerrado'].includes(r.status)).length },
      { key: 'rechazadas', label: 'Rechazadas', count: data.purchaseRequests.filter((r) => r.status === 'rechazado').length }
    ];

    const totalPoValue = bySupplier.reduce((a, b) => a + b.totalArs, 0);
    return {
      bySupplier: bySupplier.sort((a, b) => b.totalArs - a.totalArs),
      statusGroups,
      totalPoValue
    };
  }, [data.suppliers, data.purchaseOrders, data.purchaseRequests]);

  // Inventory analytics
  const inventoryAnalytics = useMemo(() => {
    const byCategory = data.productCategories.map((cat) => {
      const prods = data.products.filter((p) => p.categoryId === cat.id && p.active);
      const valuation = prods.reduce(
        (acc, p) => acc + (p.costReferenceArs !== null ? p.currentStock * p.costReferenceArs : 0),
        0
      );
      const critical = prods.filter((p) => p.currentStock < p.minStock).length;
      return {
        id: cat.id,
        name: cat.name,
        count: prods.length,
        valuation,
        critical
      };
    }).sort((a, b) => b.valuation - a.valuation);

    // Rotation count from movements
    const movCountByProd = new Map<string, { movements: number; outflows: number }>();
    data.inventoryMovements.forEach((m) => {
      const cur = movCountByProd.get(m.productId) ?? { movements: 0, outflows: 0 };
      cur.movements += 1;
      if (m.quantityDelta < 0) cur.outflows += Math.abs(m.quantityDelta);
      movCountByProd.set(m.productId, cur);
    });

    const rotationRows = data.products
      .map((p) => ({
        product: p,
        movements: movCountByProd.get(p.id)?.movements ?? 0,
        outflows: movCountByProd.get(p.id)?.outflows ?? 0,
        valuation: p.costReferenceArs !== null ? p.currentStock * p.costReferenceArs : null
      }))
      .sort((a, b) => b.movements - a.movements || b.outflows - a.outflows)
      .slice(0, 12);

    const totalValuation = byCategory.reduce((a, b) => a + b.valuation, 0);
    const totalCritical = byCategory.reduce((a, b) => a + b.critical, 0);
    const uncostedCount = data.products.filter((p) => p.costReferenceArs === null).length;

    return { byCategory, rotationRows, totalValuation, totalCritical, uncostedCount };
  }, [data.productCategories, data.products, data.inventoryMovements]);

  // Waste & Yield Loss analytics
  const lossAnalytics = useMemo(() => {
    const mermas = data.lossEvents.filter((l) => l.type === 'merma');
    const desperdicios = data.lossEvents.filter((l) => l.type === 'desperdicio');
    const mermaArs = mermas.reduce((a, b) => a + (b.estimatedImpactArs ?? 0), 0);
    const desperdicioArs = desperdicios.reduce((a, b) => a + (b.estimatedImpactArs ?? 0), 0);
    const avgYield =
      mermas.length > 0
        ? mermas.reduce((a, b) => a + (b.yieldPercentage ?? 0), 0) / mermas.length
        : null;
    const uncostedEvents = data.lossEvents.filter((l) => l.estimatedImpactArs === null).length;

    const bySector = data.sectors
      .map((s) => {
        const evts = data.lossEvents.filter((l) => l.sectorId === s.id);
        return {
          sector: s.code,
          sectorName: s.name,
          desperdicioArs: evts.filter((e) => e.type === 'desperdicio').reduce((a, b) => a + (b.estimatedImpactArs ?? 0), 0),
          mermaArs: evts.filter((e) => e.type === 'merma').reduce((a, b) => a + (b.estimatedImpactArs ?? 0), 0),
          eventsCount: evts.length
        };
      })
      .filter((r) => r.eventsCount > 0);

    const byReasonMap = new Map<string, { reason: string; count: number; impactArs: number }>();
    data.lossEvents.forEach((ev) => {
      const cur = byReasonMap.get(ev.reason) ?? { reason: ev.reason.replace(/_/g, ' '), count: 0, impactArs: 0 };
      cur.count += 1;
      cur.impactArs += ev.estimatedImpactArs ?? 0;
      byReasonMap.set(ev.reason, cur);
    });

    return {
      mermaCount: mermas.length,
      desperdicioCount: desperdicios.length,
      mermaArs,
      desperdicioArs,
      avgYield,
      uncostedEvents,
      bySector,
      byReason: Array.from(byReasonMap.values()).sort((a, b) => b.impactArs - a.impactArs || b.count - a.count)
    };
  }, [data.lossEvents, data.sectors]);

  if (availableTabs.length === 0) {
    return (
      <EmptyState
        title="Acceso restringido a analítica de Gestión"
        description="El perfil actual no tiene permisos para consultar indicadores comerciales, de compras o de inventario."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar inside Analítica / Gestión */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {availableTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#1769C2] text-white'
                  : 'bg-white text-[#5E5851] border border-[#E6E2D8] hover:text-[#1C1917] hover:bg-[#F8F7F4]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            navigate({
              module: 'gestion',
              section:
                subTab === 'compras'
                  ? 'compras'
                  : subTab === 'inventario'
                    ? 'inventario'
                    : subTab === 'mermas'
                      ? 'mermas'
                      : 'ventas'
            })
          }
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#168B68] hover:text-[#117053] hover:underline cursor-pointer"
        >
          Ir a operación en Gestión
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. VENTAS Y RENTABILIDAD (Reuses existing ManagementDashboardSection) */}
      {subTab === 'ventas' && <ManagementDashboardSection mode="dashboard" />}

      {/* 2. INGENIERÍA DE MENÚ (Reuses existing MenuEngineeringSection untouched) */}
      {subTab === 'menu' && <MenuEngineeringSection />}

      {/* 3. COMPRAS Y PROVEEDORES */}
      {subTab === 'compras' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Volumen en órdenes emitidas"
              value={formatARS(purchaseAnalytics.totalPoValue)}
              subtitle={`${data.purchaseOrders.length} orden(es) de compra`}
              onClick={() => navigate({ module: 'gestion', section: 'compras' })}
            />
            {purchaseAnalytics.statusGroups.slice(0, 3).map((g) => (
              <KpiCard
                key={g.key}
                label={g.label}
                value={String(g.count)}
                subtitle="Sobre solicitudes digitales"
                tone={g.key === 'pendientes' && g.count > 0 ? 'warning' : 'default'}
                onClick={() => navigate({ module: 'gestion', section: 'compras' })}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg p-6">
              <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                Monto de compra por proveedor (ARS)
              </h3>
              <p className="text-xs text-[#5E5851]">
                Basado en órdenes de compra aprobadas y emitidas
              </p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchaseAnalytics.bySupplier} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#1C1917' }} width={130} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: unknown) => formatARS(Number(v))} />
                    <Bar dataKey="totalArs" name="Total OC" fill="#1769C2" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4]">
                <span className="text-xs font-semibold text-[#1C1917]">
                  Desempeño y plazos de proveedores ({data.suppliers.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                      <th className="py-2.5 px-4 font-medium">Proveedor</th>
                      <th className="py-2.5 px-4 font-medium text-right">Lead time</th>
                      <th className="py-2.5 px-4 font-medium text-right">Órdenes</th>
                      <th className="py-2.5 px-4 font-medium text-right">Total ref.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EFE9]">
                    {purchaseAnalytics.bySupplier.map((s) => (
                      <tr key={s.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-2.5 px-4 font-medium text-[#1C1917]">{s.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5E5851]">
                          {s.leadTimeDays} día(s)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{s.ordersCount}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                          {s.totalArs > 0 ? formatARS(s.totalArs) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. INVENTARIO Y ROTACIÓN */}
      {subTab === 'inventario' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Valuación estimada de stock"
              value={formatARS(inventoryAnalytics.totalValuation)}
              subtitle={`Excluye ${inventoryAnalytics.uncostedCount} producto(s) sin costo cargado`}
            />
            <KpiCard
              label="Insumos bajo mínimo"
              value={String(inventoryAnalytics.totalCritical)}
              subtitle="Click para abrir catálogo filtrado"
              tone={inventoryAnalytics.totalCritical > 0 ? 'danger' : 'positive'}
              onClick={() =>
                navigate({ module: 'gestion', section: 'inventario', inventoryOnlyCritical: true })
              }
            />
            <KpiCard
              label="Movimientos registrados"
              value={formatIntAR(data.inventoryMovements.length)}
              subtitle="Compras, consumos, ajustes y bajas"
            />
            <KpiCard
              label="Rubros activos"
              value={String(data.productCategories.length)}
              subtitle={`${data.products.length} productos catalogados`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg p-6">
              <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                Valuación de inventario por rubro (ARS)
              </h3>
              <p className="text-xs text-[#5E5851]">
                Stock actual multiplicado por costo de referencia disponible
              </p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryAnalytics.byCategory} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#1C1917' }} width={132} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: unknown) => formatARS(Number(v))} />
                    <Bar dataKey="valuation" name="Valuación" fill="#9A6B3F" radius={[0, 3, 3, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4]">
                <span className="text-xs font-semibold text-[#1C1917]">
                  Insumos con mayor actividad y rotación
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                      <th className="py-2.5 px-4 font-medium">Producto</th>
                      <th className="py-2.5 px-3 font-medium text-right">Stock</th>
                      <th className="py-2.5 px-3 font-medium text-right">Movim.</th>
                      <th className="py-2.5 px-4 font-medium text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EFE9]">
                    {inventoryAnalytics.rotationRows.map((row) => {
                      const low = row.product.currentStock < row.product.minStock;
                      return (
                        <tr key={row.product.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-2.5 px-4 font-medium text-[#1C1917]">
                            {row.product.name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatNumberAR(row.product.currentStock, 1)} {row.product.baseUnit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5E5851]">
                            {row.movements}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <StatusText
                              label={low ? 'Bajo mínimo' : 'Normal'}
                              tone={low ? 'danger' : 'positive'}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MERMAS Y DESPERDICIOS (Centralized Economic & Yield Analytics) */}
      {subTab === 'mermas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Desperdicio evitable (impacto)"
              value={formatARS(lossAnalytics.desperdicioArs)}
              subtitle={`${lossAnalytics.desperdicioCount} evento(s) anormal(es)`}
              tone={lossAnalytics.desperdicioArs > 0 ? 'danger' : 'positive'}
              onClick={() => navigate({ module: 'gestion', section: 'mermas' })}
            />
            <KpiCard
              label="Merma normal de proceso"
              value={formatARS(lossAnalytics.mermaArs)}
              subtitle={`${lossAnalytics.mermaCount} registros de rendimiento`}
              onClick={() => navigate({ module: 'gestion', section: 'mermas' })}
            />
            <KpiCard
              label="Rendimiento promedio"
              value={lossAnalytics.avgYield !== null ? formatPercent(lossAnalytics.avgYield, 1) : '—'}
              subtitle="Sobre procesos de limpieza y desposte"
              tone="positive"
            />
            <KpiCard
              label="Eventos sin costo asignado"
              value={String(lossAnalytics.uncostedEvents)}
              subtitle="Sin impacto monetario inventado"
              tone={lossAnalytics.uncostedEvents > 0 ? 'warning' : 'default'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg p-6">
              <h3 className="text-lg font-editorial font-semibold text-[#1C1917]">
                Desperdicio vs. Merma por sector (ARS)
              </h3>
              <p className="text-xs text-[#5E5851]">
                Actualizado en vivo con cada registro operativo de pérdidas
              </p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lossAnalytics.bySector}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFECE5" vertical={false} />
                    <XAxis dataKey="sector" tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: '#5E5851' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip formatter={(v: unknown) => formatARS(Number(v))} />
                    <Bar dataKey="desperdicioArs" name="Desperdicio evitable" fill="#B91C1C" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="mermaArs" name="Merma de proceso" fill="#9A6B3F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-[#E6E2D8] rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E6E2D8] bg-[#F8F7F4] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1C1917]">
                  Causas principales de pérdida
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ module: 'gestion', section: 'mermas' })}
                  className="text-xs font-semibold text-[#168B68] hover:text-[#117053] hover:underline cursor-pointer"
                >
                  Registrar pérdida →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2D8] bg-[#FAF9F6] text-[#5E5851]">
                      <th className="py-2.5 px-4 font-medium">Motivo</th>
                      <th className="py-2.5 px-4 font-medium text-right">Eventos</th>
                      <th className="py-2.5 px-4 font-medium text-right">Impacto est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EFE9]">
                    {lossAnalytics.byReason.map((r) => (
                      <tr key={r.reason} className="hover:bg-[#FAF9F6]">
                        <td className="py-2.5 px-4 capitalize font-medium text-[#1C1917]">{r.reason}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{r.count}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                          {r.impactArs > 0 ? formatARS(r.impactArs) : 'Sin costo'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
