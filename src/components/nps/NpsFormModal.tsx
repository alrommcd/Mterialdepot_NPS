import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNps } from '../../state/NpsStore';
import { STORES, REASON_LABELS } from '../../lib/constants';
import { formatDateDisplay, isToday } from '../../lib/dates';
import type { ReasonKey } from '../../lib/types';
import ResultBadge from './ResultBadge';
import { bandFor } from '../../lib/nps';

const REASON_KEYS: ReasonKey[] = ['pricing', 'collection', 'service_delivery', 'sales_experience'];

export default function NpsFormModal() {
  const { state, dispatch, submitResponse, showToast } = useNps();

  const visit = useMemo(
    () => state.visits.find(v => v.id === state.openVisitId) ?? null,
    [state.visits, state.openVisitId],
  );

  const existingResponse = useMemo(() => {
    if (!visit) return null;
    return state.responses.find(
      r => r.phone === visit.phone && r.visitDate === visit.visitDate,
    ) ?? null;
  }, [state.responses, visit]);

  const locked = visit ? !isToday(visit.visitDate) : false;

  const [score,       setScore]       = useState<number | null>(null);
  const [understood,  setUnderstood]  = useState<boolean | null>(null);
  const [reasons,     setReasons]     = useState<ReasonKey[]>([]);
  const [suggestion,  setSuggestion]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [fieldErrs,   setFieldErrs]   = useState<{ score?: string; understood?: string }>({});

  // Pre-fill from existing response
  useEffect(() => {
    if (existingResponse) {
      setScore(existingResponse.score);
      setUnderstood(existingResponse.understood);
      setReasons(existingResponse.reasons);
      setSuggestion(existingResponse.suggestion);
    } else {
      setScore(null);
      setUnderstood(null);
      setReasons([]);
      setSuggestion('');
    }
    setFieldErrs({});
  }, [existingResponse, state.openVisitId]);

  const showQ3 = score !== null && understood !== null
    && (understood === false || score <= 6);

  // Clear Q3 when no longer needed
  useEffect(() => {
    if (!showQ3) setReasons([]);
  }, [showQ3]);

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE_FORM' });
  }, [dispatch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  if (!visit) return null;

  const storeName = STORES.find(s => s.id === visit.storeId)?.name ?? visit.storeId;

  const toggleReason = (key: ReasonKey) => {
    setReasons(prev =>
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key],
    );
  };

  const handleSubmit = () => {
    const errs: typeof fieldErrs = {};
    if (score === null)      errs.score      = 'Please select a score.';
    if (understood === null) errs.understood = 'Please answer this question.';
    if (Object.keys(errs).length) { setFieldErrs(errs); return; }

    setSubmitting(true);
    setTimeout(() => {
      submitResponse({
        visitId:    visit.id,
        name:       visit.name,
        phone:      visit.phone,
        storeId:    visit.storeId,
        visitDate:  visit.visitDate,
        score:      score!,
        understood: understood!,
        reasons,
        suggestion,
      });
      showToast('success', 'NPS response saved successfully.');
      setSubmitting(false);
      close();
    }, 400);
  };

  const scoreColor = score === null
    ? '#6B7280'
    : score >= 9 ? '#15803D' : score >= 7 ? '#92400E' : '#B91C1C';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#111827' }}>NPS Survey</h2>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {locked ? 'Historical record — read only.' : 'Collect feedback from the customer.'}
              </p>
            </div>
            <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          {/* Pre-filled read-only fields */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Name',       value: visit.name },
              { label: 'Phone',      value: `+91 ${visit.phone}` },
              { label: 'Store',      value: storeName },
              { label: 'Visit Date', value: formatDateDisplay(visit.visitDate) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs font-medium mb-0.5" style={{ color: '#9CA3AF' }}>{f.label}</p>
                <p className="text-sm font-medium" style={{ color: '#111827' }}>{f.value}</p>
              </div>
            ))}
          </div>

          {locked && (
            <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>
              Locked — historical record. Only today's records can be edited.
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Q1 — Score */}
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>
              Q1. How likely are you to recommend Material Depot to a friend? <span className="text-red-500">*</span>
            </p>
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>0 = Not at all likely, 10 = Extremely likely</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => i).map(n => {
                const selected = score === n;
                const color = n >= 9 ? '#15803D' : n >= 7 ? '#92400E' : '#B91C1C';
                return (
                  <button
                    key={n}
                    disabled={locked}
                    onClick={() => {
                      setScore(n);
                      setFieldErrs(prev => ({ ...prev, score: undefined }));
                    }}
                    className="w-9 h-9 rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed"
                    style={selected
                      ? { background: color, color: '#fff', border: `2px solid ${color}` }
                      : { background: '#F9FAFB', color: '#374151', border: '1px solid #D1D5DB' }
                    }
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {score !== null && (
              <p className="text-xs mt-2 font-medium" style={{ color: scoreColor }}>
                {score >= 9 ? 'Promoter (9–10)' : score >= 7 ? 'Passive (7–8)' : 'Detractor (0–6)'}
              </p>
            )}
            {fieldErrs.score && <p className="text-xs text-red-500 mt-1">{fieldErrs.score}</p>}
          </div>

          {/* Q2 — Understood */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>
              Q2. Did our team understand what you were looking for? <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-3">
              {([true, false] as const).map(val => {
                const selected = understood === val;
                return (
                  <button
                    key={String(val)}
                    disabled={locked}
                    onClick={() => {
                      setUnderstood(val);
                      setFieldErrs(prev => ({ ...prev, understood: undefined }));
                    }}
                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed"
                    style={selected
                      ? { background: '#1F2937', color: '#fff', border: '2px solid #1F2937' }
                      : { background: '#F9FAFB', color: '#374151', border: '1px solid #D1D5DB' }
                    }
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                );
              })}
            </div>
            {fieldErrs.understood && <p className="text-xs text-red-500 mt-1">{fieldErrs.understood}</p>}
          </div>

          {/* Q3 — Reasons (conditional) */}
          {showQ3 && (
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>
                Q3. What could we have done better? <span className="text-xs font-normal text-gray-400">(optional)</span>
              </p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {REASON_KEYS.map(key => {
                  const selected = reasons.includes(key);
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                      style={{
                        border: selected ? '1.5px solid #1F2937' : '1px solid #D1D5DB',
                        background: selected ? '#F8FAFC' : '#FAFAFA',
                        opacity: locked ? 0.6 : 1,
                        pointerEvents: locked ? 'none' : 'auto',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleReason(key)}
                        disabled={locked}
                        className="w-4 h-4 rounded accent-slate-800"
                      />
                      <span className="text-sm" style={{ color: '#374151' }}>{REASON_LABELS[key]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Q4 — Suggestion */}
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>
              Q4. Any suggestions for us? <span className="text-xs font-normal text-gray-400">(optional)</span>
            </p>
            <textarea
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              disabled={locked}
              placeholder="Tell us how we can improve your experience."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              style={{ border: '1px solid #D1D5DB', color: '#111827' }}
            />
          </div>
        </div>

        {/* Submit bar */}
        <div className="px-6 py-4 border-t flex items-center gap-3 justify-between" style={{ borderColor: '#F3F4F6' }}>
          <div>
            {existingResponse && !locked && (
              <div className="flex items-center gap-2">
                <ResultBadge score={existingResponse.score} band={bandFor(existingResponse.score)} />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Submitted — you can correct it.</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={close}
              className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #D1D5DB', color: '#374151' }}
            >
              {locked ? 'Close' : 'Cancel'}
            </button>
            {!locked && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-60"
                style={{ background: '#1F2937', minWidth: 100 }}
              >
                {submitting ? 'Saving…' : existingResponse ? 'Update' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
