import { useEffect } from 'react';
import { useNps } from '../../state/NpsStore';

export default function Toast() {
  const { state, dispatch } = useNps();
  const toast = state.toast;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500);
    return () => clearTimeout(t);
  }, [toast, dispatch]);

  if (!toast) return null;

  const isSuccess = toast.kind === 'success';
  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
      style={{
        background: isSuccess ? '#F0FDF4' : '#FEF2F2',
        color:      isSuccess ? '#15803D'  : '#B91C1C',
        border:     `1px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}`,
        minWidth: 260,
        maxWidth: 380,
        animation: 'slideUp 0.2s ease',
      }}
    >
      <span style={{ fontSize: 18 }}>{isSuccess ? '✓' : '✕'}</span>
      <span>{toast.message}</span>
      <button
        onClick={() => dispatch({ type: 'CLEAR_TOAST' })}
        className="ml-auto text-lg leading-none opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
