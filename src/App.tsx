import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { BookingModal } from './components/BookingModal';
import { DispatchView } from './components/DispatchView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/LoginPage';
import { MachineryView } from './components/MachineryView';
import { MobileBottomBar } from './components/MobileBottomBar';
import { OverviewView } from './components/OverviewView';
import { PlotsView } from './components/PlotsView';
import { SkeletonGrid } from './components/SkeletonGrid';
import { TopNav, type AppTab } from './components/TopNav';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import type { AvailabilityCheckResult } from './engine/scheduler';
import { TRANSLATIONS, type LanguageCode } from './i18n/translations';
import { auth } from './lib/firebase';
import type {
  AuthUser,
  DisruptionType,
  EquipmentCategory,
  FieldShareState,
} from './types/fieldshare';

const LANG_STORAGE_KEY = 'agrohub_lang';
const SESSION_TOKEN_KEY = 'agrohub_session_token';

function readStoredSessionToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const sessionTokenRef = useRef<string | null>(readStoredSessionToken());
  const [state, setState] = useState<FieldShareState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [addEquipmentSignal, setAddEquipmentSignal] = useState(0);
  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'kn' || saved === 'hi') return saved;
    } catch {
      // Ignore storage failures
    }
    return 'en';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    plotId?: string;
    equipmentId?: string;
  }>({ open: false });

  const [lastOptimizationReport, setLastOptimizationReport] = useState<{
    beforeTransitKm: number;
    afterTransitKm: number;
    distanceSavedKm: number;
    fuelSavedLiters: number;
    reorderedCount: number;
  } | null>(null);

  const t = TRANSLATIONS[language];

  const showToast = useCallback(
    (kind: 'success' | 'error', message: string) => {
      setToast({ kind, message });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 4200);
    },
    []
  );

  // Sync Tailwind .dark class and <html lang>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  const authFetch = useCallback(
    (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (sessionTokenRef.current && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${sessionTokenRef.current}`);
      }
      return fetch(input, {
        ...init,
        headers,
        credentials: 'same-origin',
      });
    },
    []
  );

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await authFetch('/api/state');
      if (res.status === 401) {
        sessionTokenRef.current = null;
        try {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
        } catch {
          // Ignore storage error
        }
        setCurrentUser(null);
        setState(null);
        return;
      }
      if (!res.ok) {
        throw new Error(`Unable to load AgroHub workspace (${res.status})`);
      }
      const data = (await res.json()) as FieldShareState;
      setState(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to connect to AgroHub API.'
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await authFetch('/api/auth/session');
        if (res.ok) {
          const data = (await res.json()) as { user: AuthUser | null };
          if (active && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch {
        // Ignore initial session check errors
      } finally {
        if (active) setAuthChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authFetch]);

  useEffect(() => {
    if (currentUser?.role === 'OWNER' && activeTab === 'plots') {
      setActiveTab('overview');
    }
  }, [currentUser?.role, activeTab]);

  useEffect(() => {
    if (currentUser) {
      fetchState();
    } else {
      setState(null);
    }
  }, [currentUser, fetchState]);

  const handleAuthenticated = useCallback((user: AuthUser, token?: string) => {
    if (token) {
      sessionTokenRef.current = token;
      try {
        sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      } catch {
        // Ignore storage errors
      }
    }
    setLoadError(null);
    setCurrentUser(user);
    setActiveTab('overview');
  }, []);

  const openAddEquipment = useCallback(() => {
    setActiveTab('machinery');
    setAddEquipmentSignal((prev) => prev + 1);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
      await signOut(auth).catch(() => undefined);
    } finally {
      sessionTokenRef.current = null;
      try {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
      } catch {
        // Ignore storage errors
      }
      setCurrentUser(null);
      setState(null);
    }
  }, [authFetch]);

  const handleAddEquipment = async (payload: {
    name: string;
    modelCode: string;
    category: EquipmentCategory;
    hourlyRateInr: number;
    workRateAcresHr: number;
    transitSpeedKmh: number;
    horsepower: number;
    baseVillage: string;
    latitude: number;
    longitude: number;
  }) => {
    const res = await authFetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not register machinery.');
    }
    setState(data.state);
    showToast('success', `${data.equipment.name} added to Machinery Registry.`);
  };

  const handleAddPlot = async (payload: {
    name: string;
    cropType: string;
    areaAcres: number;
    villageName: string;
    latitude: number;
    longitude: number;
    requiredCategory: EquipmentCategory;
    targetStartAt: string;
    deadlineAt: string;
    soilCondition: string;
  }) => {
    const res = await authFetch('/api/plots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not register farm plot.');
    }
    setState(data.state);
    showToast('success', `${data.plot.name} registered for scheduling.`);
  };

  const handleCheckAvailability = useCallback(
    async (payload: {
      equipmentId: string;
      plotId: string;
      requestedFieldStartAt: string;
    }): Promise<AvailabilityCheckResult> => {
      const res = await authFetch('/api/bookings/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Availability check failed.');
      }
      return data as AvailabilityCheckResult;
    },
    []
  );

  const handleCreateBooking = async (payload: {
    equipmentId: string;
    plotId: string;
    requestedFieldStartAt: string;
    notes?: string;
  }) => {
    const res = await authFetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Booking request failed.');
    }
    setState(data.state);
    showToast('success', 'Booking request submitted to owner approval queue.');
  };

  const handleDecision = async (
    bookingId: string,
    decision: 'CONFIRMED' | 'REJECTED'
  ) => {
    if (!state) return;
    const prevSnapshot = state;

    setState({
      ...state,
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: decision } : b
      ),
    });
    setBusyAction(bookingId);

    try {
      const res = await authFetch(`/api/bookings/${bookingId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Decision failed.');
      }
      setState(data.state);
      showToast(
        'success',
        data.warning ||
          (decision === 'CONFIRMED'
            ? 'Booking confirmed and locked into schedule.'
            : 'Booking request declined.')
      );
    } catch (err) {
      setState(prevSnapshot);
      showToast(
        'error',
        err instanceof Error ? err.message : 'Could not update booking.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleOptimize = async () => {
    setBusyAction('optimize');
    try {
      const res = await authFetch('/api/schedule/optimize', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Optimization failed.');
      }
      setState(data.state);
      setLastOptimizationReport(data.optimization);
      showToast(
        'success',
        `Routes optimized: saved ${data.optimization.distanceSavedKm} km transit.`
      );
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Schedule optimization failed.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleTriggerDisruption = async (payload: {
    type: DisruptionType;
    severity: 'MODERATE' | 'CRITICAL';
    title: string;
    description: string;
    equipmentId?: string;
    centerLat: number;
    centerLng: number;
    affectedRadiusKm: number;
    delayHours: number;
  }) => {
    const res = await authFetch('/api/disruptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Disruption cascade failed.');
    }
    setState(data.state);
    showToast(
      'success',
      `Disruption processed: ${data.cascade.affectedCount} booking(s) automatically updated.`
    );
  };

  const handleResolveDisruption = async (disruptionId: string) => {
    const res = await authFetch(`/api/disruptions/${disruptionId}/resolve`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('error', data.error || 'Failed to resolve alert.');
      return;
    }
    setState(data.state);
    showToast('success', 'Disruption cleared and machinery returned to Available.');
  };

  const handleResetWorkspace = async () => {
    const res = await authFetch('/api/reset', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setState(data.state);
      setLastOptimizationReport(null);
      showToast('success', 'Workspace restored to baseline seed schedule.');
    }
  };

  if (authChecking) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <SkeletonGrid />
      </main>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        language={language}
        onChangeLanguage={setLanguage}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        t={t}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const effectiveTab: AppTab =
    currentUser.role === 'OWNER' && activeTab === 'plots' ? 'overview' : activeTab;

  return (
    <div className="min-h-screen pb-20 md:pb-10">
      <TopNav
        activeTab={effectiveTab}
        userRole={currentUser.role}
        t={t}
        onSelectTab={setActiveTab}
        onPrimaryAction={() => {
          if (currentUser.role === 'OWNER') {
            openAddEquipment();
          } else {
            setBookingModal({ open: true });
          }
        }}
      />

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <WorkspaceToolbar
          language={language}
          onChangeLanguage={setLanguage}
          t={t}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              toast.kind === 'success'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-100'
                : 'border-red-400 bg-red-50 text-red-950 dark:border-red-500/30 dark:bg-red-950/60 dark:text-red-100'
            }`}
          >
            {toast.kind === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-700 dark:text-red-400" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <ErrorBoundary onReset={fetchState}>
          {loading ? (
            <SkeletonGrid />
          ) : loadError || !state ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-300 bg-white p-8 text-center dark:border-red-500/30 dark:bg-slate-900"
            >
              <p className="text-base font-bold text-stone-950 dark:text-white">
                {loadError || 'Unable to load AgroHub data.'}
              </p>
              <button
                type="button"
                onClick={fetchState}
                className="mt-4 min-h-[48px] rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {effectiveTab === 'overview' && (
                <OverviewView
                  state={state}
                  userRole={currentUser.role}
                  t={t}
                  busyAction={busyAction}
                  onNavigate={setActiveTab}
                  onOpenBooking={(preset) =>
                    setBookingModal({ open: true, ...preset })
                  }
                  onOpenAddEquipment={openAddEquipment}
                  onDecision={handleDecision}
                  onOptimize={handleOptimize}
                />
              )}

              {effectiveTab === 'machinery' && (
                <MachineryView
                  equipment={state.equipment}
                  userRole={currentUser.role}
                  searchQuery={searchQuery}
                  t={t}
                  addModalTrigger={addEquipmentSignal}
                  onAddEquipment={handleAddEquipment}
                  onBookEquipment={(equipmentId) =>
                    setBookingModal({ open: true, equipmentId })
                  }
                  onViewDispatch={() => setActiveTab('dispatch')}
                />
              )}

              {effectiveTab === 'plots' && currentUser.role === 'FARMER' && (
                <PlotsView
                  plots={state.plots}
                  searchQuery={searchQuery}
                  t={t}
                  onAddPlot={handleAddPlot}
                  onRequestMachineForPlot={(plotId) =>
                    setBookingModal({ open: true, plotId })
                  }
                />
              )}

              {effectiveTab === 'dispatch' && (
                <DispatchView
                  state={state}
                  userRole={currentUser.role}
                  t={t}
                  busyAction={busyAction}
                  lastOptimizationReport={lastOptimizationReport}
                  onDecision={handleDecision}
                  onOptimize={handleOptimize}
                  onOpenBooking={() => setBookingModal({ open: true })}
                  onTriggerDisruption={handleTriggerDisruption}
                  onResolveDisruption={handleResolveDisruption}
                  onResetWorkspace={handleResetWorkspace}
                />
              )}
            </>
          )}
        </ErrorBoundary>
      </main>

      {state && currentUser.role === 'FARMER' && (
        <BookingModal
          open={bookingModal.open}
          t={t}
          equipment={state.equipment}
          plots={state.plots}
          presetPlotId={bookingModal.plotId}
          presetEquipmentId={bookingModal.equipmentId}
          onClose={() => setBookingModal({ open: false })}
          onCheckAvailability={handleCheckAvailability}
          onCreateBooking={handleCreateBooking}
        />
      )}

      <MobileBottomBar
        activeTab={effectiveTab}
        userRole={currentUser.role}
        t={t}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
