import React from 'react';
import { BarChart3 } from 'lucide-react';
import {
  analyticsBtnClass,
  Modal,
  secondaryBtnClass,
  StatusText
} from '../../components/ui/Primitives';
import { MENU_QUADRANT_META, MenuEngineeringRow } from '../../utils/menuEngineering';
import { formatARS, formatIntAR, formatPercent } from '../../utils/formatters';

interface MenuProductDetailModalProps {
  row: MenuEngineeringRow | null;
  periodDays: 7 | 30;
  avgContributionMargin: number;
  popularityThresholdPct: number;
  onClose: () => void;
  onOpenMenuEngineering?: () => void;
}

export const MenuProductDetailModal: React.FC<MenuProductDetailModalProps> = ({
  row,
  periodDays,
  avgContributionMargin,
  popularityThresholdPct,
  onClose,
  onOpenMenuEngineering
}) => {
  if (!row) return null;
  const meta = MENU_QUADRANT_META[row.quadrant];
  const costReliabilityLabel =
    row.item.costReliability === 'verificado'
      ? 'Verificado'
      : row.item.costReliability === 'estimado'
        ? 'Estimado'
        : 'Sin datos de receta';

  return (
    <Modal
      open={Boolean(row)}
      onClose={onClose}
      title={row.item.name}
      subtitle={`${row.item.code} · ${row.item.category} · Período analizado: últimos ${periodDays} días`}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        {/* Classification Summary Banner */}
        <div className="p-4 bg-[#FAF9F6] border border-[#E6E2D8] rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-[#6B635B]">
              Clasificación Ingeniería de Menú
            </div>
            <div className="mt-1 flex items-center gap-2">
              <StatusText label={meta.singular} tone={meta.tone} />
              <span className="text-xs text-[#5E5851]">· {meta.subtitle}</span>
            </div>
          </div>
          <span className="text-xs font-mono text-[#5E5851]">
            Costo: <strong className="text-[#141210]">{costReliabilityLabel}</strong>
          </span>
        </div>

        {/* Commercial Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white border border-[#E6E2D8] rounded-md">
            <span className="text-[#6B635B]">Unidades vendidas</span>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#141210]">
              {formatIntAR(row.units)}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E6E2D8] rounded-md">
            <span className="text-[#6B635B]">Facturación ({periodDays}d)</span>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#1769C2]">
              {formatARS(row.revenueArs)}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E6E2D8] rounded-md">
            <span className="text-[#6B635B]">Popularidad</span>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#141210]">
              {formatPercent(row.popularityPct, 1)}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E6E2D8] rounded-md">
            <span className="text-[#6B635B]">Precio de venta</span>
            <div className="mt-1 font-mono text-sm font-bold tabular-nums text-[#141210]">
              {formatARS(row.item.sellingPriceArs)}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E6E2D8] rounded-md">
            <span className="text-[#6B635B]">Costo de receta</span>
            <div className="mt-1 font-mono text-sm font-bold tabular-nums text-[#5E5851]">
              {row.item.recipeCostArs !== null ? formatARS(row.item.recipeCostArs) : 'No cargado'}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E6E2D8] rounded-md">
            <span className="text-[#6B635B]">Margen unitario</span>
            <div className="mt-1 font-mono text-sm font-bold tabular-nums text-[#168B68]">
              {row.contributionMargin !== null ? formatARS(row.contributionMargin) : '—'}
            </div>
          </div>
        </div>

        {/* Benchmarks Comparison */}
        <dl className="divide-y divide-[#F2EFE9] text-xs border-t border-[#EFECE5] pt-2">
          <div className="flex justify-between py-2">
            <dt className="text-[#6B635B]">Margen total aportado ({periodDays}d)</dt>
            <dd className="font-mono font-semibold text-[#141210]">
              {row.totalMarginArs !== null ? formatARS(row.totalMarginArs) : 'Datos insuficientes'}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-[#6B635B]">Food Cost %</dt>
            <dd className="font-mono text-[#141210]">
              {row.foodCostPct !== null ? formatPercent(row.foodCostPct, 1) : '—'}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-[#6B635B]">Umbral de popularidad de referencia (70%)</dt>
            <dd className="font-mono text-[#5E5851]">
              {formatPercent(popularityThresholdPct, 1)}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-[#6B635B]">Margen de contribución promedio ponderado</dt>
            <dd className="font-mono text-[#5E5851]">{formatARS(avgContributionMargin)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#EFECE5]">
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            Cerrar
          </button>
          {onOpenMenuEngineering && (
            <button type="button" onClick={onOpenMenuEngineering} className={analyticsBtnClass}>
              <BarChart3 className="w-4 h-4" />
              Ingeniería de menú
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
