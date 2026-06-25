type Props = {
  label:    string;
  value:    number | null;
  count:    number;
  accent:   string;
};

export default function KpiCard({ label, value, count, accent }: Props) {
  return (
    <div
      className="flex-1 rounded-xl p-5 flex flex-col gap-1"
      style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: accent }}>
        {value === null ? 'N/A' : (value > 0 ? `+${value}` : `${value}`)}
      </p>
      <p className="text-xs" style={{ color: '#9CA3AF' }}>
        {count} response{count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
