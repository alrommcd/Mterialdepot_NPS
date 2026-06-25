import type { Band } from '../../lib/types';

type Props = { score: number; band: Band };

const STYLES: Record<Band, { bg: string; color: string }> = {
  promoter:  { bg: '#DCFCE7', color: '#15803D' },
  passive:   { bg: '#FEF3C7', color: '#92400E' },
  detractor: { bg: '#FEE2E2', color: '#B91C1C' },
};

const LABELS: Record<Band, string> = {
  promoter:  'Promoter',
  passive:   'Passive',
  detractor: 'Detractor',
};

export default function ResultBadge({ score, band }: Props) {
  const s = STYLES[band];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="font-bold">{score}</span>
      <span>·</span>
      <span>{LABELS[band]}</span>
    </span>
  );
}
