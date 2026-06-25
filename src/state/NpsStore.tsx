import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Visit, NpsResponse } from '../lib/types';
import { today } from '../lib/dates';
import { ALL_STORES_ID } from '../lib/constants';
import { seedIfEmpty, saveVisits, upsertResponse, getLastStorageError } from '../lib/repository';

export type NpsState = {
  visits:          Visit[];
  responses:       NpsResponse[];
  selectedStoreId: string;        // '' = all stores
  selectedDate:    string;        // 'YYYY-MM-DD'
  searchQuery:     string;
  openVisitId:     string | null;
  addVisitOpen:    boolean;
  toast:           { kind: 'success' | 'error'; message: string } | null;
};

type Action =
  | { type: 'LOAD_FROM_STORAGE'; visits: Visit[]; responses: NpsResponse[] }
  | { type: 'ADD_VISIT';         visit: Visit }
  | { type: 'UPSERT_RESPONSE';   responses: NpsResponse[] }
  | { type: 'SET_STORE';         storeId: string }
  | { type: 'SET_DATE';          date: string }
  | { type: 'SET_SEARCH';        query: string }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'OPEN_FORM';         visitId: string }
  | { type: 'CLOSE_FORM' }
  | { type: 'OPEN_ADD_VISIT' }
  | { type: 'CLOSE_ADD_VISIT' }
  | { type: 'SET_TOAST';         toast: NpsState['toast'] }
  | { type: 'CLEAR_TOAST' };

function reducer(state: NpsState, action: Action): NpsState {
  switch (action.type) {
    case 'LOAD_FROM_STORAGE':
      return { ...state, visits: action.visits, responses: action.responses };
    case 'ADD_VISIT':
      return { ...state, visits: [...state.visits, action.visit] };
    case 'UPSERT_RESPONSE':
      return { ...state, responses: action.responses };
    case 'SET_STORE':
      return { ...state, selectedStoreId: action.storeId };
    case 'SET_DATE':
      return { ...state, selectedDate: action.date };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    case 'CLEAR_FILTERS':
      return { ...state, selectedStoreId: ALL_STORES_ID, selectedDate: today(), searchQuery: '' };
    case 'OPEN_FORM':
      return { ...state, openVisitId: action.visitId };
    case 'CLOSE_FORM':
      return { ...state, openVisitId: null };
    case 'OPEN_ADD_VISIT':
      return { ...state, addVisitOpen: true };
    case 'CLOSE_ADD_VISIT':
      return { ...state, addVisitOpen: false };
    case 'SET_TOAST':
      return { ...state, toast: action.toast };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}

const initialState: NpsState = {
  visits:          [],
  responses:       [],
  selectedStoreId: ALL_STORES_ID,
  selectedDate:    today(),
  searchQuery:     '',
  openVisitId:     null,
  addVisitOpen:    false,
  toast:           null,
};

type NpsCtx = {
  state: NpsState;
  dispatch: React.Dispatch<Action>;
  addVisit:     (visit: Visit) => void;
  submitResponse: (resp: Omit<NpsResponse, 'id' | 'band' | 'submittedAt'>) => void;
  showToast: (kind: 'success' | 'error', message: string) => void;
};

const NpsContext = createContext<NpsCtx | null>(null);

export function NpsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const { visits, responses } = seedIfEmpty();
    dispatch({ type: 'LOAD_FROM_STORAGE', visits, responses });

    const err = getLastStorageError();
    if (err) {
      dispatch({ type: 'SET_TOAST', toast: { kind: 'error', message: err.message } });
    }
  }, []);

  const showToast = useCallback((kind: 'success' | 'error', message: string) => {
    dispatch({ type: 'SET_TOAST', toast: { kind, message } });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500);
  }, []);

  const addVisit = useCallback((visit: Visit) => {
    dispatch({ type: 'ADD_VISIT', visit });
    const next = [...state.visits, visit];
    saveVisits(next);
    const err = getLastStorageError();
    if (err) showToast('error', err.message);
  }, [state.visits, showToast]);

  const submitResponse = useCallback((
    resp: Omit<NpsResponse, 'id' | 'band' | 'submittedAt'>,
  ) => {
    const next = upsertResponse(state.responses, resp);
    dispatch({ type: 'UPSERT_RESPONSE', responses: next });
    const err = getLastStorageError();
    if (err) showToast('error', err.message);
  }, [state.responses, showToast]);

  return (
    <NpsContext.Provider value={{ state, dispatch, addVisit, submitResponse, showToast }}>
      {children}
    </NpsContext.Provider>
  );
}

export function useNps(): NpsCtx {
  const ctx = useContext(NpsContext);
  if (!ctx) throw new Error('useNps must be inside NpsProvider');
  return ctx;
}
