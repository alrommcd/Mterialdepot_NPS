export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="text-4xl">📋</div>
      <p className="text-gray-500 font-medium">No customers for this store and date range.</p>
    </div>
  );
}
