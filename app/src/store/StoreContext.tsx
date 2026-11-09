import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { db, firebaseConfigured } from '../firebase';
import { blankYear, seedStore } from '../data/seed';
import type { Store, Year } from '../types/models';

// Local cache only — a fast-loading fallback so the UI isn't blank while the
// first Firestore round-trip completes, and a safety net if we're briefly
// offline. Firestore (see ../firebase.ts) is the shared source of truth, so
// data is the same for everyone who opens the app, not per-browser.
const CACHE_KEY = 'gcmpta_kpi_cache_v1';
const SAVE_DEBOUNCE_MS = 700;
const STORE_DOC = doc(db, 'stores', 'main');

export type SyncStatus = 'loading' | 'synced' | 'saving' | 'offline' | 'unconfigured';

function migrate(store: Store) {
  Object.values(store.years || {}).forEach((yr) => {
    if (!yr.ovr) yr.ovr = {};
    if (!yr.backups) yr.backups = [];
    if (!yr.shutdowns || yr.shutdowns.length === 0) yr.shutdowns = [blankYear().shutdowns[0]];
    if (!yr.shutdownPerf) yr.shutdownPerf = [];
    (yr.concern || []).forEach((c) => {
      if (!c.month) c.month = store.activeMonth;
    });
  });
}

function readCache(): Store | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as Store;
    if (store && store.years && Object.keys(store.years).length) return store;
  } catch {
    /* corrupt cache — ignore */
  }
  return null;
}

function writeCache(store: Store) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* quota or private-mode — non-fatal, Firestore is the source of truth */
  }
}

interface StoreContextValue {
  store: Store;
  year: Year;
  setStore: (mutator: (draft: Store) => void) => void;
  syncStatus: SyncStatus;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStoreState] = useState<Store>(() => {
    const cached = readCache();
    if (cached) return cached;
    const fresh = seedStore();
    migrate(fresh);
    return fresh;
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(firebaseConfigured ? 'loading' : 'unconfigured');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);
  // Set right before a setStoreState call that reflects Firestore's data
  // (initial load, or the live echo of any write — ours or someone else's)
  // so the save-effect below doesn't treat it as a new local edit and
  // re-write it right back (which would loop forever).
  const skipNextSaveRef = useRef(false);

  // Subscribe to the shared document — fires immediately with the current
  // value, then again in real time whenever anyone (including us) saves.
  useEffect(() => {
    if (!firebaseConfigured) {
      console.warn('Firebase is not configured (see .env.example) — running from local cache only.');
      return;
    }
    const unsub = onSnapshot(
      STORE_DOC,
      async (snap) => {
        if (snap.exists()) {
          const loaded = snap.data() as Store;
          migrate(loaded);
          skipNextSaveRef.current = true;
          setStoreState(loaded);
          writeCache(loaded);
        } else if (!loadedRef.current) {
          // First run ever — nothing in Firestore yet. Seed it.
          const fresh = seedStore();
          migrate(fresh);
          setStoreState(fresh);
          writeCache(fresh);
          try {
            await setDoc(STORE_DOC, fresh);
          } catch (e) {
            console.warn('Could not seed Firestore document.', e);
          }
        }
        setSyncStatus(snap.metadata.hasPendingWrites ? 'saving' : 'synced');
        loadedRef.current = true;
      },
      (err) => {
        console.warn('Firestore listener error; using local cache.', err);
        setSyncStatus('offline');
        loadedRef.current = true;
      }
    );
    return () => unsub();
  }, []);

  // Debounced save whenever the store changes because of a local edit
  // (not because of the Firestore echo handled above).
  useEffect(() => {
    writeCache(store);
    if (!loadedRef.current || !firebaseConfigured) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSyncStatus('saving');
      try {
        await setDoc(STORE_DOC, store);
        // onSnapshot will fire with hasPendingWrites:false shortly after
        // the server confirms; no need to set 'synced' here ourselves.
      } catch (e) {
        console.warn('Save to Firestore failed; will retry on next change.', e);
        setSyncStatus('offline');
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const setStore = (mutator: (draft: Store) => void) => {
    setStoreState((prev) => {
      const draft: Store = JSON.parse(JSON.stringify(prev));
      mutator(draft);
      return draft;
    });
  };

  const year = store.years[String(store.activeYear)];

  const value = useMemo(() => ({ store, year, setStore, syncStatus }), [store, year, syncStatus]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
