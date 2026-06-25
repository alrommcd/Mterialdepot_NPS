import { useNps } from '../../state/NpsStore';
import { isFuture } from '../../lib/dates';

export default function EmptyState() {
  const { state } = useNps();
  const future = isFuture(state.selectedDate);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="text-4xl">📋</div>
      <p className="text-gray-500 font-medium">
        {future ? 'No visits can be logged for a future date.' : 'No customers for this store & date.'}
      </p>
    </div>
  );
}
