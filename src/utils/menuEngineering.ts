import { MenuItem, Sale } from '../domain/types';
import { StatusTone } from '../components/ui/Primitives';

export type MenuQuadrant =
  | 'Estrella'
  | 'Caballito'
  | 'Rompecabezas'
  | 'Perro'
  | 'Datos insuficientes';

export const MENU_QUADRANT_ORDER: MenuQuadrant[] = [
  'Estrella',
  'Caballito',
  'Rompecabezas',
  'Perro',
  'Datos insuficientes'
];

export interface MenuQuadrantMeta {
  singular: string;
  plural: string;
  subtitle: string;
  color: string;
  tone: StatusTone;
}

export const MENU_QUADRANT_META: Record<MenuQuadrant, MenuQuadrantMeta> = {
  Estrella: {
    singular: 'Estrella',
    plural: 'Estrellas',
    subtitle: 'Alta popularidad · Alto margen',
    color: '#168B68',
    tone: 'positive'
  },
  Caballito: {
    singular: 'Caballito',
    plural: 'Caballitos',
    subtitle: 'Alta popularidad · Bajo margen',
    color: '#1769C2',
    tone: 'info'
  },
  Rompecabezas: {
    singular: 'Rompecabezas',
    plural: 'Rompecabezas',
    subtitle: 'Baja popularidad · Alto margen',
    color: '#7C2D36',
    tone: 'accent'
  },
  Perro: {
    singular: 'Perro',
    plural: 'Perros',
    subtitle: 'Baja popularidad · Bajo margen',
    color: '#C83E43',
    tone: 'danger'
  },
  'Datos insuficientes': {
    singular: 'Datos insuficientes',
    plural: 'Datos insuficientes',
    subtitle: 'Sin costo de receta confiable',
    color: '#D97706',
    tone: 'warning'
  }
};

export interface MenuEngineeringRow {
  item: MenuItem;
  units: number;
  revenueArs: number;
  popularityPct: number;
  contributionMargin: number | null;
  foodCostPct: number | null;
  totalMarginArs: number | null;
  quadrant: MenuQuadrant;
}

export interface MenuScatterPoint {
  itemId: string;
  name: string;
  category: string;
  popularityPct: number;
  contributionMargin: number;
  units: number;
  revenueArs: number;
  quadrant: MenuQuadrant;
}

export interface MenuEngineeringAnalysis {
  rows: MenuEngineeringRow[];
  scatterPoints: MenuScatterPoint[];
  avgContributionMargin: number;
  popularityThresholdPct: number;
  totalUnits: number;
  totalRevenueArs: number;
  counts: Record<MenuQuadrant, number>;
}

/**
 * Single source of truth for Kasavana & Smith Hospitality Menu Engineering.
 * Shared identically by Analítica → Gestión → Ingeniería de menú and Gestión → Ventas → Productos.
 * - Popularity benchmark = (100% / N) * 0.70
 * - Weighted average contribution margin computed strictly on items with reliable/estimated recipe cost
 * - Sales volume and revenue come exclusively from actual sales line items (never inventory stock)
 */
export function computeMenuEngineering(
  sales: Sale[],
  menuItems: MenuItem[],
  fromDate: string,
  toDate: string,
  categoryFilter = 'todas'
): MenuEngineeringAnalysis {
  const periodSales = sales.filter(
    (s) => s.operationalDate >= fromDate && s.operationalDate <= toDate
  );

  const unitsMap = new Map<string, number>();
  const revenueMap = new Map<string, number>();
  periodSales.forEach((sale) => {
    sale.lines.forEach((line) => {
      unitsMap.set(line.menuItemId, (unitsMap.get(line.menuItemId) ?? 0) + line.quantity);
      revenueMap.set(
        line.menuItemId,
        (revenueMap.get(line.menuItemId) ?? 0) + line.quantity * line.unitPriceArs
      );
    });
  });

  const items = menuItems.filter(
    (m) => m.active && (categoryFilter === 'todas' || m.category === categoryFilter)
  );

  const totalUnits = items.reduce((acc, m) => acc + (unitsMap.get(m.id) ?? 0), 0);
  const totalRevenueArs = items.reduce((acc, m) => acc + (revenueMap.get(m.id) ?? 0), 0);
  const costedItems = items.filter(
    (m) => m.recipeCostArs !== null && m.costReliability !== 'sin_datos'
  );
  const totalCostedUnits = costedItems.reduce((acc, m) => acc + (unitsMap.get(m.id) ?? 0), 0);
  const totalContribution = costedItems.reduce((acc, m) => {
    const units = unitsMap.get(m.id) ?? 0;
    const cm = m.sellingPriceArs - (m.recipeCostArs ?? 0);
    return acc + cm * units;
  }, 0);

  const avgContributionMargin = totalCostedUnits > 0 ? totalContribution / totalCostedUnits : 0;
  const popularityThresholdPct = items.length > 0 ? (100 / items.length) * 0.7 : 0;

  const rows: MenuEngineeringRow[] = items.map((m) => {
    const units = unitsMap.get(m.id) ?? 0;
    const revenueArs = revenueMap.get(m.id) ?? units * m.sellingPriceArs;
    const popularityPct = totalUnits > 0 ? (units / totalUnits) * 100 : 0;
    const hasReliableCost = m.recipeCostArs !== null && m.costReliability !== 'sin_datos';
    const contributionMargin = hasReliableCost ? m.sellingPriceArs - (m.recipeCostArs ?? 0) : null;
    const foodCostPct =
      hasReliableCost && m.sellingPriceArs > 0
        ? ((m.recipeCostArs ?? 0) / m.sellingPriceArs) * 100
        : null;

    let quadrant: MenuQuadrant = 'Datos insuficientes';
    if (hasReliableCost && contributionMargin !== null) {
      const highPop = popularityPct >= popularityThresholdPct;
      const highMargin = contributionMargin >= avgContributionMargin;
      if (highPop && highMargin) quadrant = 'Estrella';
      else if (highPop && !highMargin) quadrant = 'Caballito';
      else if (!highPop && highMargin) quadrant = 'Rompecabezas';
      else quadrant = 'Perro';
    }

    return {
      item: m,
      units,
      revenueArs,
      popularityPct,
      contributionMargin,
      foodCostPct,
      totalMarginArs: contributionMargin !== null ? contributionMargin * units : null,
      quadrant
    };
  });

  const sortedRows = rows.sort((a, b) => b.units - a.units || b.revenueArs - a.revenueArs);

  const scatterPoints: MenuScatterPoint[] = sortedRows
    .filter((r) => r.quadrant !== 'Datos insuficientes' && r.contributionMargin !== null)
    .map((r) => ({
      itemId: r.item.id,
      name: r.item.name,
      category: r.item.category,
      popularityPct: Number(r.popularityPct.toFixed(2)),
      contributionMargin: r.contributionMargin ?? 0,
      units: r.units,
      revenueArs: r.revenueArs,
      quadrant: r.quadrant
    }));

  return {
    rows: sortedRows,
    scatterPoints,
    avgContributionMargin,
    popularityThresholdPct,
    totalUnits,
    totalRevenueArs,
    counts: {
      Estrella: sortedRows.filter((r) => r.quadrant === 'Estrella').length,
      Caballito: sortedRows.filter((r) => r.quadrant === 'Caballito').length,
      Rompecabezas: sortedRows.filter((r) => r.quadrant === 'Rompecabezas').length,
      Perro: sortedRows.filter((r) => r.quadrant === 'Perro').length,
      'Datos insuficientes': sortedRows.filter((r) => r.quadrant === 'Datos insuficientes').length
    }
  };
}
