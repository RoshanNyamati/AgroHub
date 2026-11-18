import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  MapPin,
  Plus,
  Route,
  Sparkles,
  Tractor,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  ACTIVE_BOOKING_STATUSES,
  sortBookingsByPriority,
} from '../engine/scheduler';
import { SEED_REFERENCE_ISO } from '../data/seed';
import type { Translations } from '../i18n/translations';
import type { FieldShareState } from '../types/fieldshare';
import { formatRupees, formatShortTime, triggerHaptic } from '../utils/feedback';
import { EquipmentPhoto } from './EquipmentPhoto';
import { GeoFieldMap } from './GeoFieldMap';
import type { AppTab } from './TopNav';

interface OverviewViewProps {
  state: FieldShareState;
  userRole: 'FARMER' | 'OWNER';
  t: Translations;
  busyAction: string | null;
  onNavigate: (tab: AppTab) => void;
  onOpenBooking: (preset?: { plotId?: string; equipmentId?: string }) => void;
  onOpenAddEquipment: () => void;
  onDecision: (bookingId: string, decision: 'CONFIRMED' | 'REJECTED') => void;
  onOptimize: () => void;
}

export function OverviewView({
  state,
  userRole,
  t,
  busyAction,
  onNavigate,
  onOpenBooking,
  onOpenAddEquipment,
  onDecision,
  onOptimize,
}: OverviewViewProps) {
  const isOwner = userRole === 'OWNER';

  const plotsById = useMemo(
    () => new Map(state.plots.map((p) => [p.id, p])),
    [state.plots]
  );
  const equipmentById = useMemo(
    () => new Map(state.equipment.map((e) => [e.id, e])),
    [state.equipment]
  );

  const pendingRanked = useMemo(() => {
    const pending = state.bookings.filter((b) => b.status === 'PENDING');
    return sortBookingsByPriority(pending, plotsById, SEED_REFERENCE_ISO);
  }, [state.bookings, plotsById]);

  const activeBookings = useMemo(
    () => state.bookings.filter((b) => ACTIVE_BOOKING_STATUSES.has(b.status)),
    [state.bookings]
  );

  const farmerBookings = useMemo(() => {
    const order: Record<string, number> = {
      RESCHEDULED: 0,
      PENDING: 1,
      CONFIRMED: 2,
      IN_PROGRESS: 3,
      COMPLETED: 4,
      REJECTED: 5,
    };
    return [...state.bookings]
      .sort((a, b) => {
        const rankDiff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
        if (rankDiff !== 0) return rankDiff;
        return new Date(a.effectiveStartAt).getTime() - new Date(b.effectiveStartAt).getTime();
      })
      .slice(0, 4);
  }, [state.bookings]);

  const totalScheduledAcres = useMemo(() => {
    return activeBookings.reduce((sum, b) => {
      const plot = plotsById.get(b.plotId);
      return sum + (plot?.areaAcres ?? 0);
    }, 0);
  }, [activeBookings, plotsById]);

  const totalPlotAcres = useMemo(
    () => state.plots.reduce((sum, p) => sum + p.areaAcres, 0),
    [state.plots]
  );

  const scheduledRevenueInr = useMemo(
    () => activeBookings.reduce((sum, b) => sum + b.estimatedCostInr, 0),
    [activeBookings]
  );

  const activeDisruptions = useMemo(
    () => state.disruptions.filter((d) => !d.resolved),
    [state.disruptions]
  );

  const availableMachines = state.equipment.filter(
    (e) => e.status === 'AVAILABLE'
  ).length;

  return (
    <div className="space-y-6 animate-settle">
      {/* Active Disruption Banner (if any unresolved alerts exist) */}
      {activeDisruptions.length > 0 && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-400 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
            <div>
              <p className="text-sm font-bold">{activeDisruptions[0].title}</p>
              <p className="text-xs text-amber-900 dark:text-amber-200">
                {activeDisruptions[0].cascadeSummary[0]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('dispatch')}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-amber-800 px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-amber-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <span>{t.overview.inspectRecovery}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Split Hero Section (Role-Scoped) */}
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-stone-300 bg-white p-6 sm:p-8 lg:col-span-7 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-wide text-emerald-800 dark:text-emerald-300">
              {isOwner ? t.overview.kickerOwner : t.overview.kickerFarmer}
            </p>
            <h1 className="text-balance font-display text-2xl font-extrabold tracking-tight text-stone-950 sm:text-4xl dark:text-white">
              {isOwner ? t.overview.ownerHeroTitle : t.overview.farmerHeroTitle}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-stone-700 dark:text-slate-300">
              {isOwner ? t.overview.ownerHeroSubtitle : t.overview.farmerHeroSubtitle}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isOwner ? (
              <>
                <button
                  type="button"
                  disabled={busyAction === 'optimize'}
                  onClick={() => {
                    triggerHaptic(16);
                    onOptimize();
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60 whitespace-nowrap shrink-0 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <Route className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {busyAction === 'optimize'
                      ? t.overview.optimizing
                      : t.overview.optimizeRoute}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(14);
                    onOpenAddEquipment();
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-950 transition-colors hover:bg-stone-200 whitespace-nowrap shrink-0 dark:border-white/15 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  <span>{t.nav.addEquipment}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(16);
                    onOpenBooking();
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.overview.bookMachinery}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    onNavigate('plots');
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-950 transition-colors hover:bg-stone-200 whitespace-nowrap shrink-0 dark:border-white/15 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  <span>{t.overview.managePlots}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-stone-300 lg:col-span-5 dark:border-white/10">
          <EquipmentPhoto
            src="/src/assets/images/hero_tractor_field_1794954398722.jpg"
            alt="Utility tractor cultivating terraced smallholder farmland"
            className="h-full w-full object-cover lg:h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-medium text-emerald-300">
              {t.overview.liveFieldCoverage}
            </p>
            <p className="mt-1 font-display text-lg font-bold">
              {totalScheduledAcres.toFixed(1)} acres · {activeBookings.length} active slots
            </p>
          </div>
        </div>
      </section>

      {/* Full-width 4-column Role-Scoped KPI Strip */}
      {isOwner ? (
        <section
          aria-label="Owner operational metrics"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.readyMachinery}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-stone-950 dark:text-white">
              {availableMachines} / {state.equipment.length}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {t.overview.readySub}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.scheduledRevenue}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-stone-950 dark:text-white">
              {formatRupees(scheduledRevenueInr)}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {t.overview.revenueSub}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.pendingApprovals}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-800 dark:text-amber-300">
              {pendingRanked.length}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {t.overview.pendingSub}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.transitSaved}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
              {state.lastOptimizationSavedKm.toFixed(1)} km
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {state.lastOptimizedAt
                ? t.overview.transitSubOptimized
                : t.overview.transitSubDefault}
            </p>
          </div>
        </section>
      ) : (
        <section
          aria-label="Farmer operational metrics"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.readyMachinery}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-stone-950 dark:text-white">
              {availableMachines} / {state.equipment.length}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {t.overview.readySub}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.activePlots}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-stone-950 dark:text-white">
              {state.plots.length}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {totalPlotAcres.toFixed(1)} ac · {t.overview.activePlotsSub}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.myBookingsCount}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
              {activeBookings.length + pendingRanked.length}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {t.overview.myBookingsCountSub}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {t.overview.scheduledCoverage}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-stone-950 dark:text-white">
              {totalScheduledAcres.toFixed(1)} ac
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
              {activeBookings.length} active slots
            </p>
          </div>
        </section>
      )}

      {/* Map + Role-Scoped Right Column */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <GeoFieldMap
            equipment={state.equipment}
            plots={state.plots}
            bookings={state.bookings}
            disruptions={state.disruptions}
            title={t.overview.mapTitle}
            subtitle={t.overview.mapSubtitle}
            onSelectPlot={(plotId) => {
              if (!isOwner) {
                onOpenBooking({ plotId });
              } else {
                onNavigate('dispatch');
              }
            }}
            onSelectEquipment={(equipmentId) => {
              if (!isOwner) {
                onOpenBooking({ equipmentId });
              } else {
                onNavigate('machinery');
              }
            }}
          />
        </div>

        <div className="flex flex-col rounded-2xl border border-stone-300 bg-white p-5 lg:col-span-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-950 dark:text-white">
                {isOwner ? t.overview.priorityQueueTitle : t.overview.myBookingsTitle}
              </h2>
              <p className="text-xs text-stone-600 dark:text-slate-300">
                {isOwner ? t.overview.priorityQueueSub : t.overview.myBookingsSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dispatch')}
              className="min-h-[44px] text-xs font-semibold text-emerald-800 underline-offset-4 hover:underline whitespace-nowrap shrink-0 dark:text-emerald-300"
            >
              {t.overview.fullSchedule}
            </button>
          </div>

          {isOwner ? (
            pendingRanked.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 p-6 text-center dark:border-white/15">
                <Sparkles className="h-8 w-8 text-emerald-700 dark:text-emerald-400" />
                <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-white">
                  {t.overview.allProcessed}
                </p>
                <button
                  type="button"
                  disabled={busyAction === 'optimize'}
                  onClick={() => {
                    triggerHaptic(14);
                    onOptimize();
                  }}
                  className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600"
                >
                  <Route className="h-4 w-4" />
                  <span>{t.overview.optimizeRoute}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRanked.map((item) => {
                  const eq = equipmentById.get(item.booking.equipmentId);
                  return (
                    <article
                      key={item.booking.id}
                      className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-slate-950/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-stone-950 dark:text-white">
                            {item.plot?.name ?? 'Farm Plot'}
                          </h3>
                          <p className="mt-0.5 text-xs text-stone-600 dark:text-slate-300">
                            {eq?.name ?? 'Machinery'} · {item.plot?.areaAcres ?? 0} ac ·{' '}
                            <span className="font-mono tabular-nums">
                              {formatRupees(item.booking.estimatedCostInr)}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${
                            item.urgencyTier === 'CRITICAL'
                              ? 'text-red-700 dark:text-red-400'
                              : item.urgencyTier === 'HIGH'
                                ? 'text-amber-800 dark:text-amber-300'
                                : 'text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {item.hoursUntilDeadline}h left
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-stone-600 dark:text-slate-400">
                        Window:{' '}
                        <span className="font-mono tabular-nums">
                          {formatShortTime(item.booking.fieldStartAt)}
                        </span>{' '}
                        · {item.booking.travelMinutes}m transit + {item.booking.workMinutes}m work
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busyAction === item.booking.id}
                          onClick={() => {
                            triggerHaptic(16);
                            onDecision(item.booking.id, 'CONFIRMED');
                          }}
                          aria-label={`Accept booking for ${item.plot?.name ?? 'plot'}`}
                          className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>{t.overview.accept}</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyAction === item.booking.id}
                          onClick={() => {
                            triggerHaptic(12);
                            onDecision(item.booking.id, 'REJECTED');
                          }}
                          aria-label={`Reject booking for ${item.plot?.name ?? 'plot'}`}
                          className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-100 disabled:opacity-60 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span>{t.overview.reject}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          ) : farmerBookings.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 p-6 text-center dark:border-white/15">
              <Tractor className="h-8 w-8 text-emerald-700 dark:text-emerald-400" />
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-white">
                {t.overview.requestMachine}
              </p>
              <button
                type="button"
                onClick={() => onOpenBooking()}
                className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>{t.overview.bookMachinery}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="space-y-3">
                {farmerBookings.map((booking) => {
                  const plot = plotsById.get(booking.plotId);
                  const eq = equipmentById.get(booking.equipmentId);
                  const statusTone =
                    booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS'
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : booking.status === 'RESCHEDULED' || booking.status === 'PENDING'
                        ? 'text-amber-800 dark:text-amber-300'
                        : booking.status === 'REJECTED'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-stone-700 dark:text-slate-300';
                  return (
                    <article
                      key={booking.id}
                      className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-slate-950/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-stone-950 dark:text-white">
                            {plot?.name ?? 'Farm Plot'}
                          </h3>
                          <p className="mt-0.5 text-xs text-stone-600 dark:text-slate-300">
                            {eq?.name ?? 'Machinery'} · {plot?.areaAcres ?? 0} ac ·{' '}
                            <span className="font-mono tabular-nums">
                              {formatRupees(booking.estimatedCostInr)}
                            </span>
                          </p>
                        </div>
                        <span className={`text-xs font-bold whitespace-nowrap ${statusTone}`}>
                          {booking.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-stone-600 dark:text-slate-400">
                        Arrival:{' '}
                        <span className="font-mono tabular-nums">
                          {formatShortTime(booking.effectiveStartAt)}
                        </span>{' '}
                        · {booking.travelMinutes}m transit + {booking.workMinutes}m work
                      </p>

                      {booking.rescheduleReason && (
                        <p className="mt-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          {booking.rescheduleReason}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(14);
                  onOpenBooking();
                }}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <Tractor className="h-4 w-4" aria-hidden="true" />
                <span>{t.overview.requestMachine}</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
