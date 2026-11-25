import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { ToastItem } from '../../services/store';

// ==========================================
// KPI CARD (Single elevation, crisp 1px border, tabular numerals)
// ==========================================
interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  sourceTag?: string;
  tone?: 'default' | 'info' | 'positive' | 'warning' | 'danger';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  sourceTag,
  tone = 'default',
  onClick
}) => {
  const toneClass =
    tone === 'info'
      ? 'text-[#1769C2]'
      : tone === 'positive'
        ? 'text-[#168B68]'
        : tone === 'warning'
          ? 'text-[#D97706]'
          : tone === 'danger'
            ? 'text-[#C83E43]'
            : 'text-[#141210]';

  const Container = onClick ? 'button' : 'div';
  return (
    <Container
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left bg-white border border-[#E6E2D8] rounded-lg p-5 transition-colors duration-150 ${
        onClick
          ? 'hover:border-[#9A6B3F] hover:bg-[#FCFBF9] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7C2D36]'
          : ''
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[#5E5851] leading-snug">{label}</span>
        {sourceTag && (
          <span className="text-[11px] font-medium text-[#8C847A] whitespace-nowrap shrink-0">
            {sourceTag}
          </span>
        )}
      </div>
      <div className={`mt-2.5 text-2xl sm:text-[1.65rem] font-semibold font-mono tabular-nums tracking-tight leading-none ${toneClass}`}>
        {value}
      </div>
      {subtitle && <p className="mt-2 text-xs text-[#6B635B] leading-relaxed">{subtitle}</p>}
    </Container>
  );
};

// ==========================================
// ZERO-PILL STATUS TEXT (Clean unboxed semantic text + explicit label)
// ==========================================
export type StatusTone = 'neutral' | 'info' | 'positive' | 'warning' | 'danger' | 'accent';

export const StatusText: React.FC<{ label: string; tone?: StatusTone }> = ({
  label,
  tone = 'neutral'
}) => {
  const color =
    tone === 'info'
      ? 'text-[#1769C2]'
      : tone === 'positive'
        ? 'text-[#168B68]'
        : tone === 'warning'
          ? 'text-[#D97706]'
          : tone === 'danger'
            ? 'text-[#C83E43]'
            : tone === 'accent'
              ? 'text-[#7C2D36]'
              : 'text-[#5E5851]';
  return <span className={`text-xs font-semibold whitespace-nowrap ${color}`}>{label}</span>;
};

// ==========================================
// SECTION HEADER
// ==========================================
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E6E2D8]">
    <div className="min-w-0">
      <h1 className="text-3xl sm:text-[2.2rem] font-editorial font-bold text-[#141210] tracking-tight leading-[1.12]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm text-[#6B635B] max-w-2xl leading-relaxed">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
  </div>
);

// ==========================================
// INTERACTIVE SEGMENTED TABS (Functional buttons)
// ==========================================
export interface TabOption {
  id: string;
  label: string;
  count?: number;
}

export const SegmentedTabs: React.FC<{
  tabs: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
}> = ({ tabs, activeId, onChange }) => (
  <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#E6E2D8]">
    {tabs.map((tab) => {
      const isActive = tab.id === activeId;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 cursor-pointer ${
            isActive
              ? 'border-[#7C2D36] text-[#7C2D36]'
              : 'border-transparent text-[#5E5851] hover:text-[#1C1917] hover:border-[#D6D0C4]'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 font-mono text-xs tabular-nums opacity-75">({tab.count})</span>
          )}
        </button>
      );
    })}
  </div>
);

// ==========================================
// MODAL DIALOG
// ==========================================
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, maxWidthClass = 'max-w-2xl', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${maxWidthClass} bg-white border border-[#E6E2D8] rounded-lg shadow-xl my-8 max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E6E2D8]">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-[#1C1917]">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#5E5851]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 text-[#5E5851] hover:text-[#1C1917] rounded-md hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ==========================================
// CONFIRM DIALOG
// ==========================================
export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, description, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) => (
  <Modal open={open} onClose={onCancel} title={title} maxWidthClass="max-w-md">
    <p className="text-sm text-[#5E5851] leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-[#1C1917] border border-[#D6D0C4] rounded-md hover:bg-[#F2EFE9] transition-colors cursor-pointer"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer ${
          danger ? 'bg-[#C83E43] hover:bg-[#A62E32]' : 'bg-[#168B68] hover:bg-[#117053]'
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

// ==========================================
// EMPTY STATE
// ==========================================
export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="border border-dashed border-[#D6D0C4] rounded-lg bg-white/60 py-12 px-6 text-center">
    <p className="text-base font-medium text-[#1C1917]">{title}</p>
    <p className="mt-1 text-sm text-[#5E5851] max-w-md mx-auto">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ==========================================
// TOAST CONTAINER
// ==========================================
export const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((t) => {
        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'warning'
              ? AlertTriangle
              : t.type === 'error'
                ? AlertCircle
                : Info;
        const iconColor =
          t.type === 'success'
            ? 'text-[#15803D]'
            : t.type === 'warning'
              ? 'text-[#B45309]'
              : t.type === 'error'
                ? 'text-[#B91C1C]'
                : 'text-[#7C2D36]';

        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-[#181615] text-[#F8F7F4] border border-[#342F2B] rounded-lg px-4 py-3 shadow-lg"
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
            <p className="text-xs leading-relaxed flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Descartar notificación"
              className="text-[#A8A29E] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Shared typography scale helpers
export const sectionTitleClass =
  'text-xl sm:text-[1.45rem] font-editorial font-bold text-[#141210] tracking-tight leading-snug';

export const cardTitleClass =
  'text-base font-bold text-[#141210] leading-snug';

export const metaTextClass = 'text-xs text-[#6B635B] leading-relaxed';

// Shared form input styling helpers
export const inputClass =
  'w-full rounded-md border border-[#D6D0C4] bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#9A938A] focus:border-[#168B68] focus:outline-none focus:ring-1 focus:ring-[#168B68]';

export const labelClass = 'block text-xs font-semibold text-[#44403C] mb-1';

// ==========================================
// GLOBAL BUTTON SEMANTIC SYSTEM
// A. Operational Action (Vibrant Green) — create, edit, load, execute forms & operational tasks
// B. Analytical Navigation (Vibrant Blue) — dashboards, KPIs, comparisons, insights, menu engineering
// C. Neutral / Support — cancel, close, expand/collapse, export, secondary helpers
// ==========================================
export const operationalBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#168B68] hover:bg-[#117053] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168B68] disabled:opacity-50 disabled:cursor-not-allowed';

export const operationalSecondaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#117053] bg-[#168B68]/[0.08] border border-[#168B68]/35 hover:bg-[#168B68]/[0.15] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168B68] disabled:opacity-50 disabled:cursor-not-allowed';

export const analyticsBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1769C2] hover:bg-[#12549D] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769C2] disabled:opacity-50 disabled:cursor-not-allowed';

export const analyticsLinkClass =
  'inline-flex items-center gap-1 text-xs font-semibold text-[#1769C2] hover:text-[#12549D] hover:underline whitespace-nowrap shrink-0 cursor-pointer transition-colors';

export const primaryBtnClass = operationalBtnClass;

export const secondaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#44403C] bg-white border border-[#D6D0C4] hover:bg-[#F2EFE9] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E5851] disabled:opacity-50 disabled:cursor-not-allowed';
