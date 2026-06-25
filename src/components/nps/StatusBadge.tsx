type Props = { status: 'Pending' | 'Submitted' };

export default function StatusBadge({ status }: Props) {
  if (status === 'Submitted') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ background: '#DCFCE7', color: '#15803D' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: '#FEF3C7', color: '#92400E' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
      Pending
    </span>
  );
}
