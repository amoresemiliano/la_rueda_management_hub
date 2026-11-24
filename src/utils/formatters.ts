// Argentine Spanish formatting & parsing utilities (ARS, DD/MM/YYYY, 24h)

export function formatARS(amount: number | null | undefined, showDecimals = false): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Sin costo';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(amount);
}

export function formatNumberAR(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatIntAR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${formatNumberAR(value, decimals)}%`;
}

export function formatDateAR(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const clean = isoDate.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateTimeAR(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '—';
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return isoTimestamp;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function todayISO(): string {
  // Use current operational demo date anchored consistently
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addDaysISO(baseIso: string, days: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function calculateTenureLabel(hireDate: string): string {
  const start = new Date(hireDate);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} ${remMonths === 1 ? 'mes' : 'meses'}`;
  if (remMonths === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years} ${years === 1 ? 'año' : 'años'}, ${remMonths} m.`;
}

/**
 * Parses Argentine numeric formats carefully without silent reinterpretation.
 * Supports: "1.250,50", "$ 1.250,50", "1250,50", "1250.50", "1250"
 * Returns { value: number | null, ambiguous: boolean }
 */
export function parseArgentineNumber(raw: unknown): { value: number | null; ambiguous: boolean } {
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return { value: raw, ambiguous: false };
  }
  if (raw === null || raw === undefined) return { value: null, ambiguous: false };
  const s = String(raw).trim().replace(/ARS|\$/gi, '').replace(/\s+/g, '');
  if (!s) return { value: null, ambiguous: false };

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Determine which comes last
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Standard AR format: 1.234,56
      const normalized = s.replace(/\./g, '').replace(',', '.');
      const n = Number(normalized);
      return { value: Number.isNaN(n) ? null : n, ambiguous: false };
    } else {
      // US format: 1,234.56
      const normalized = s.replace(/,/g, '');
      const n = Number(normalized);
      return { value: Number.isNaN(n) ? null : n, ambiguous: false };
    }
  }

  if (hasComma) {
    // Check if single comma with 1-2 digits after -> decimal comma
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      const n = Number(`${parts[0]}.${parts[1]}`);
      return { value: Number.isNaN(n) ? null : n, ambiguous: false };
    }
    if (parts.length === 2 && parts[1].length === 3) {
      return { value: null, ambiguous: true };
    }
    const n = Number(s.replace(',', '.'));
    return { value: Number.isNaN(n) ? null : n, ambiguous: false };
  }

  if (hasDot) {
    const parts = s.split('.');
    if (parts.length > 2) {
      // Multiple dots: 1.250.000 -> thousands separator
      const n = Number(s.replace(/\./g, ''));
      return { value: Number.isNaN(n) ? null : n, ambiguous: false };
    }
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      // Ambiguous: could be 1.500 (1500) or 1.500 (1.5)
      return { value: null, ambiguous: true };
    }
    const n = Number(s);
    return { value: Number.isNaN(n) ? null : n, ambiguous: false };
  }

  const n = Number(s);
  return { value: Number.isNaN(n) ? null : n, ambiguous: false };
}

/**
 * Parses DD/MM/YYYY or YYYY-MM-DD into YYYY-MM-DD strictly without guessing MM/DD.
 */
export function parseArgentineDate(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const arMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (arMatch) {
    const [, d, m, y] = arMatch;
    const day = Number(d);
    const month = Number(m);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return null;
}

export function createFingerprint(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return `fp-${(hash >>> 0).toString(16)}`;
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
