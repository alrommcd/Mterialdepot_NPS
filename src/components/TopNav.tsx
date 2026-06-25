export default function TopNav() {
  return (
    <header style={{ background: '#0F1115' }} className="w-full px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-white font-bold text-lg tracking-tight">material</span>
          <span className="text-amber-400 font-bold text-lg tracking-tight">depot</span>
        </div>
        <span className="text-gray-500 text-sm font-medium">Sales CRM</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-300 text-sm font-medium">Arpan</span>
        <button
          className="text-gray-300 text-sm border border-gray-600 rounded px-3 py-1 hover:border-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
