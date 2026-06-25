import { useState, useEffect, useCallback } from 'react';
import { useNps } from '../../state/NpsStore';
import { STORES, ALL_STORES_ID } from '../../lib/constants';
import { today, nowTimeIST, formatDateDisplay } from '../../lib/dates';

function validate(name: string, phone: string): { name?: string; phone?: string } {
  const errs: { name?: string; phone?: string } = {};
  if (!name.trim()) errs.name = 'Name is required.';
  if (!/^\d{10}$/.test(phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number.';
  return errs;
}

export default function AddVisitModal() {
  const { state, dispatch, addVisit, showToast } = useNps();
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [errs,  setErrs]  = useState<{ name?: string; phone?: string }>({});

  const storeId = state.selectedStoreId === ALL_STORES_ID
    ? STORES[0].id
    : state.selectedStoreId;

  const storeName = STORES.find(s => s.id === storeId)?.name ?? storeId;
  const visitDate = today();

  const reset = useCallback(() => {
    setName(''); setPhone(''); setErrs({});
  }, []);

  const close = useCallback(() => {
    reset();
    dispatch({ type: 'CLOSE_ADD_VISIT' });
  }, [dispatch, reset]);

  // Close on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  if (!state.addVisitOpen) return null;

  const handleSubmit = () => {
    const e = validate(name, phone);
    if (Object.keys(e).length) { setErrs(e); return; }

    // Check duplicate phone + date
    const dup = state.visits.find(v => v.phone === phone && v.visitDate === visitDate);
    if (dup) {
      showToast('error', `A visit for +91 ${phone} is already recorded today.`);
      return;
    }

    addVisit({
      id:        crypto.randomUUID(),
      name:      name.trim(),
      phone,
      storeId,
      visitDate,
      visitTime: nowTimeIST(),
      createdAt: new Date().toISOString(),
    });
    showToast('success', `Visit added for ${name.trim()}.`);
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Add Walk-in Visit</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Capture customer details before the NPS survey.</p>
          </div>
          <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Pre-filled read-only */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Store">
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#F9FAFB', border: '1px solid #ECECEF', color: '#6B7280' }}>
              {storeName}
            </div>
          </Field>
          <Field label="Visit Date">
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#F9FAFB', border: '1px solid #ECECEF', color: '#6B7280' }}>
              {formatDateDisplay(visitDate)}
            </div>
          </Field>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrs(prev => ({ ...prev, name: undefined })); }}
            placeholder="Customer name"
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              border: errs.name ? '1px solid #EF4444' : '1px solid #D1D5DB',
              color: '#111827',
            }}
          />
          {errs.name && <p className="text-xs text-red-500 mt-1">{errs.name}</p>}
        </div>

        {/* Phone */}
        <div className="mb-5">
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Phone <span className="text-red-500">*</span>
          </label>
          <div className="flex rounded-lg overflow-hidden" style={{ border: errs.phone ? '1px solid #EF4444' : '1px solid #D1D5DB' }}>
            <span className="px-3 py-2 text-sm font-medium flex-shrink-0" style={{ background: '#F3F4F6', color: '#6B7280', borderRight: '1px solid #D1D5DB' }}>
              +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(v);
                setErrs(prev => ({ ...prev, phone: undefined }));
              }}
              placeholder="10-digit number"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ color: '#111827' }}
            />
          </div>
          {errs.phone && <p className="text-xs text-red-500 mt-1">{errs.phone}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={close}
            className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50 transition-colors"
            style={{ border: '1px solid #D1D5DB', color: '#374151' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:opacity-90"
            style={{ background: '#1F2937' }}
          >
            Save Visit
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}
