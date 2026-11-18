import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  CloudRain,
  RotateCcw,
  Route,
  Tractor,
  Wrench,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ACTIVE_BOOKING_STATUSES,
  sortBookingsByPriority,
} from '../engine/scheduler';
import { SEED_REFERENCE_ISO } from '../data/seed';
import type { Translations } from '../i18n/translations';
import type {
  DisruptionType,
  FieldShareState,
} from '../types/fieldshare';
import {
  formatClockOnly,
  formatRupees,
  formatShortTime,
  triggerHaptic,
} from '../utils/feedback';

interface DispatchViewProps {
  state: FieldShareState;
  userRole: 'FARMER' | 'OWNER';
  t: Translations;
  busyAction: string | null;
  lastOptimizationReport: {
    beforeTransitKm: number;
    afterTransitKm: number;
    distanceSavedKm: number;
    fuelSavedLiters: number;
    reorderedCount: number;
  } | null;
  onDecision: (bookingId: string, decision: 'CONFIRMED' | 'REJECTED') => void;
  onOptimize: () => void;
  onOpenBooking?: () => void;
  onTriggerDisruption: (payload: {
    type: DisruptionType;
    severity: 'MODERATE' | 'CRITICAL';
    title: string;
    description: string;
    equipmentId?: string;
    centerLat: number;
    centerLng: number;
    affectedRadiusKm: number;
    delayHours: number;
  }) => Promise<void>;
  onResolveDisruption: (disruptionId: string) => Promise<void>;
  onResetWorkspace: () => Promise<void>;
}

export function DispatchView({
  state,
  userRole,
  t,
  busyAction,
  lastOptimizationReport,
  onDecision,
  onOptimize,
  onOpenBooking,
  onTriggerDisruption,
  onResolveDisruption,
  onResetWorkspace,
}: DispatchViewProps) {
  const isOwner = userRole === 'OWNER';
  const [disruptionType, setDisruptionType] = useState<DisruptionType>('RAIN');
  const activeJobCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of state.bookings) {
      if (ACTIVE_BOOKING_STATUSES.has(b.status)) {
        counts.set(b.equipmentId, (counts.get(b.equipmentId) ?? 0) + 1);
      }
    }
    return counts;
  }, [state.bookings]);

  const defaultMachineWithJobs = useMemo(() => {
    return (
      state.equipment.find((e) => (activeJobCounts.get(e.id) ?? 0) > 0)?.id ??
      state.equipment[0]?.id ??
      ''
    );
  }, [state.equipment, activeJobCounts]);

  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    defaultMachineWithJobs
  );
  const [delayHours, setDelayHours] = useState('4');
  const [affectedRadiusKm, setAffectedRadiusKm] = useState('15');
  const [submittingDisruption, setSubmittingDisruption] = useState(false);

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

  const machineTimelines = useMemo(() => {
    return state.equipment.map((eq) => {
      const jobs = state.bookings
        .filter(
          (b) =>
            b.equipmentId === eq.id && ACTIVE_BOOKING_STATUSES.has(b.status)
        )
        .sort(
          (a, b) =>
            new Date(a.effectiveStartAt).getTime() -
            new Date(b.effectiveStartAt).getTime()
        );
      const totalTransitKm = jobs.reduce((s, j) => s + j.transitDistanceKm, 0);
      return {
        equipment: eq,
        jobs,
        totalTransitKm: Number(totalTransitKm.toFixed(2)),
      };
    });
  }, [state.equipment, state.bookings]);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic([20, 40, 20]);
    setSubmittingDisruption(true);
    try {
      const machine = equipmentById.get(selectedMachineId) ?? state.equipment[0];
      if (disruptionType === 'BREAKDOWN') {
        await onTriggerDisruption({
          type: 'BREAKDOWN',
          severity: 'CRITICAL',
          title: `Mechanical Breakdown · ${machine?.name ?? 'Machinery'}`,
          description: `Hydraulic pressure loss reported on ${machine?.name ?? 'unit'}. Auto-reassigning compatible backup fleet.`,
          equipmentId: machine?.id,
          centerLat: machine?.latitude ?? 38.56,
          centerLng: machine?.longitude ?? -121.75,
          affectedRadiusKm: 15,
          delayHours: Math.max(1, Number(delayHours) || 6),
        });
      } else {
        await onTriggerDisruption({
          type: 'RAIN',
          severity: 'MODERATE',
          title: 'Heavy Rain Cell Across Riverbend & Sunridge',
          description: `22mm rainfall alert. Shifting active soil operations forward by ${delayHours}h.`,
          centerLat: 38.575,
          centerLng: -121.765,
          affectedRadiusKm: Math.max(2, Number(affectedRadiusKm) || 15),
          delayHours: Math.max(1, Number(delayHours) || 4),
        });
      }
    } finally {
      setSubmittingDisruption(false);
    }
  };

  const farmerSortedBookings = useMemo(() => {
    return [...state.bookings].sort(
      (a, b) =>
        new Date(a.effectiveStartAt).getTime() -
        new Date(b.effectiveStartAt).getTime()
    );
  }, [state.bookings]);

  if (!isOwner) {
    return (
      <div className="space-y-6 animate-settle">
        {/* Farmer Bookings & Schedule Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-950 dark:text-white">
              {t.dispatch.farmerTitle}
            </h1>
            <p className="mt-1 text-sm text-stone-700 dark:text-slate-300">
              {t.dispatch.farmerSubtitle}
            </p>
          </div>

          {onOpenBooking && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(16);
                onOpenBooking();
              }}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              <span>{t.nav.bookMachine}</span>
            </button>
          )}
        </div>

        {/* Farmer Scheduled Equipment Slots */}
        <section className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-stone-950 dark:text-white">
              {t.dispatch.farmerTimelineTitle}
            </h2>
            <p className="text-xs text-stone-600 dark:text-slate-300">
              {t.dispatch.farmerTimelineSub}
            </p>
          </div>

          {farmerSortedBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600 dark:border-white/15 dark:text-slate-400">
              No equipment bookings submitted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {farmerSortedBookings.map((job) => {
                const plot = plotsById.get(job.plotId);
                const eq = equipmentById.get(job.equipmentId);
                const isRescheduled = job.status === 'RESCHEDULED';
                const statusTone =
                  job.status === 'CONFIRMED' || job.status === 'IN_PROGRESS'
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : job.status === 'RESCHEDULED' || job.status === 'PENDING'
                      ? 'text-amber-800 dark:text-amber-300'
                      : job.status === 'REJECTED'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-stone-700 dark:text-slate-300';

                return (
                  <article
                    key={job.id}
                    className={`rounded-xl border p-4 ${
                      isRescheduled
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-950/35'
                        : 'border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {formatShortTime(job.effectiveStartAt)} – {formatClockOnly(job.endAt)}
                      </span>
                      <span className={`font-bold ${statusTone}`}>{job.status}</span>
                    </div>

                    <h3 className="mt-1.5 text-sm font-bold text-stone-950 dark:text-white">
                      {plot?.name ?? 'Farm Plot'}
                    </h3>
                    <p className="mt-0.5 text-xs text-stone-700 dark:text-slate-300">
                      {eq?.name ?? 'Machinery'} · {eq?.baseVillage ?? 'Depot'}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-200 pt-2 text-xs dark:border-white/10">
                      <span className="font-mono tabular-nums text-stone-600 dark:text-slate-400">
                        {job.travelMinutes}m transit + {job.workMinutes}m work
                      </span>
                      <span className="font-mono font-bold tabular-nums text-stone-950 dark:text-white">
                        {formatRupees(job.estimatedCostInr)}
                      </span>
                    </div>

                    {job.rescheduleReason && (
                      <p className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
                        {job.rescheduleReason}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Read-only Weather & Field Delay Notices for Farmers */}
        <section className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
          <h2 className="text-base font-bold text-stone-950 dark:text-white">
            {t.dispatch.farmerAlertsTitle}
          </h2>
          <div className="mt-4 space-y-2.5">
            {state.disruptions.length === 0 ? (
              <p className="text-sm text-stone-600 dark:text-slate-400">
                No active weather or breakdown alerts affecting your plots.
              </p>
            ) : (
              state.disruptions.map((dis) => (
                <div
                  key={dis.id}
                  className={`rounded-xl border p-3.5 text-xs ${
                    dis.resolved
                      ? 'border-stone-200 bg-stone-50 text-stone-700 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300'
                      : 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/35 dark:text-amber-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{dis.title}</p>
                      <p className="mt-0.5 opacity-90">{dis.description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {dis.resolved ? t.dispatch.resolved : 'Active'}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 border-t border-current/15 pt-2">
                    {dis.cascadeSummary.map((line, i) => (
                      <li key={i} className="font-medium">
                        • {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-settle">
      {/* Owner Header & Primary Optimizer Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-950 dark:text-white">
            {t.dispatch.title}
          </h1>
          <p className="mt-1 text-sm text-stone-700 dark:text-slate-300">
            {t.dispatch.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={busyAction === 'optimize'}
            onClick={() => {
              triggerHaptic(16);
              onOptimize();
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60 whitespace-nowrap shrink-0 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Route className="h-4 w-4" aria-hidden="true" />
            <span>
              {busyAction === 'optimize' ? t.overview.optimizing : t.dispatch.optimizeBtn}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onResetWorkspace();
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-800 hover:bg-stone-100 whitespace-nowrap shrink-0 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{t.dispatch.resetSeed}</span>
          </button>
        </div>
      </div>

      {/* Optimization Outcome Summary */}
      {lastOptimizationReport && (
        <div
          role="status"
          className="grid grid-cols-2 gap-4 rounded-2xl border border-emerald-400 bg-emerald-50 p-4 text-emerald-950 sm:grid-cols-4 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          <div>
            <span className="text-xs font-medium opacity-80">Baseline Transit</span>
            <p className="font-mono text-lg font-bold tabular-nums">
              {lastOptimizationReport.beforeTransitKm} km
            </p>
          </div>
          <div>
            <span className="text-xs font-medium opacity-80">Optimized Transit</span>
            <p className="font-mono text-lg font-bold tabular-nums">
              {lastOptimizationReport.afterTransitKm} km
            </p>
          </div>
          <div>
            <span className="text-xs font-medium opacity-80">Distance Saved</span>
            <p className="font-mono text-lg font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
              -{lastOptimizationReport.distanceSavedKm} km
            </p>
          </div>
          <div>
            <span className="text-xs font-medium opacity-80">Diesel Saved</span>
            <p className="font-mono text-lg font-bold tabular-nums">
              {lastOptimizationReport.fuelSavedLiters} L ({lastOptimizationReport.reorderedCount} stops reordered)
            </p>
          </div>
        </div>
      )}

      {/* Machine Schedule Timeline */}
      <section className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-950 dark:text-white">
              {t.dispatch.timelineTitle}
            </h2>
            <p className="text-xs text-stone-600 dark:text-slate-300">
              {t.dispatch.timelineSub}
            </p>
          </div>
        </div>

        <div className="divide-y divide-stone-200 dark:divide-white/10">
          {machineTimelines.map(({ equipment, jobs, totalTransitKm }) => (
            <div key={equipment.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Tractor className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-stone-950 dark:text-white">
                    {equipment.name}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-slate-400">
                    · {equipment.baseVillage} · {equipment.workRateAcresHr} ac/hr
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
                  <span className="font-mono text-stone-700 dark:text-slate-300">
                    {totalTransitKm} km route
                  </span>
                  <span
                    className={
                      equipment.status === 'MAINTENANCE'
                        ? 'text-red-700 dark:text-red-400'
                        : equipment.status === 'WEATHER_HOLD'
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-emerald-800 dark:text-emerald-300'
                    }
                  >
                    {equipment.status}
                  </span>
                </div>
              </div>

              {jobs.length === 0 ? (
                <p className="mt-2 text-xs text-stone-500 dark:text-slate-400">
                  No confirmed jobs assigned on this window — standing by at {equipment.baseVillage}.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((job, idx) => {
                    const plot = plotsById.get(job.plotId);
                    const isRescheduled = job.status === 'RESCHEDULED';
                    return (
                      <div
                        key={job.id}
                        className={`rounded-xl p-3 ${
                          isRescheduled
                            ? 'bg-amber-100/80 dark:bg-amber-950/40'
                            : 'bg-stone-100 dark:bg-slate-950/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                            Stop {idx + 1} · {formatClockOnly(job.effectiveStartAt)}–{formatClockOnly(job.endAt)}
                          </span>
                          <span className="font-semibold text-stone-600 dark:text-slate-300">
                            {job.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-stone-950 dark:text-white">
                          {plot?.name ?? 'Farm Plot'}
                        </p>
                        <p className="mt-0.5 font-mono text-xs tabular-nums text-stone-600 dark:text-slate-400">
                          {job.travelMinutes}m travel ({job.transitDistanceKm} km) + {job.workMinutes}m work
                        </p>
                        {job.rescheduleReason && (
                          <p className="mt-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300">
                            {job.rescheduleReason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Split: Priority Queue + Disruption Command */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Competing Booking Requests (Priority Sorted) */}
        <section className="rounded-2xl border border-stone-300 bg-white p-5 lg:col-span-6 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
          <h2 className="text-base font-bold text-stone-950 dark:text-white">
            {t.dispatch.conflictQueueTitle} ({pendingRanked.length})
          </h2>
          <p className="mt-0.5 text-xs text-stone-600 dark:text-slate-300">
            {t.dispatch.conflictQueueSub}
          </p>

          <div className="mt-4 space-y-3">
            {pendingRanked.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600 dark:border-white/15 dark:text-slate-400">
                No pending conflicts in queue.
              </div>
            ) : (
              pendingRanked.map((item) => {
                const eq = equipmentById.get(item.booking.equipmentId);
                return (
                  <div
                    key={item.booking.id}
                    className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-stone-950 dark:text-white">
                          {item.plot?.name ?? 'Plot'} → {eq?.name ?? 'Machine'}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-600 dark:text-slate-300">
                          {item.rationale} · Priority {item.priorityScore}
                        </p>
                        <p className="mt-1 font-mono text-xs tabular-nums text-stone-600 dark:text-slate-400">
                          Requested: {formatShortTime(item.booking.fieldStartAt)} ({item.booking.travelMinutes}m travel)
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busyAction === item.booking.id}
                        onClick={() => onDecision(item.booking.id, 'CONFIRMED')}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600"
                      >
                        <Check className="h-4 w-4" />
                        <span>{t.dispatch.acceptRequest}</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyAction === item.booking.id}
                        onClick={() => onDecision(item.booking.id, 'REJECTED')}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <X className="h-4 w-4" />
                        <span>{t.overview.reject}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Disruption Handler & Auto-Reschedule Simulator */}
        <section className="rounded-2xl border border-stone-300 bg-white p-5 lg:col-span-6 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
          <h2 className="text-base font-bold text-stone-950 dark:text-white">
            {t.dispatch.disruptionTitle}
          </h2>
          <p className="mt-0.5 text-xs text-stone-600 dark:text-slate-300">
            {t.dispatch.disruptionSub}
          </p>

          <form onSubmit={handleTrigger} className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDisruptionType('RAIN')}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors ${
                  disruptionType === 'RAIN'
                    ? 'border-amber-600 bg-amber-100 text-amber-950 dark:border-amber-400 dark:bg-amber-500/20 dark:text-amber-200'
                    : 'border-stone-300 bg-white text-stone-700 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <CloudRain className="h-4 w-4" />
                <span>{t.dispatch.rainAlertBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setDisruptionType('BREAKDOWN')}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors ${
                  disruptionType === 'BREAKDOWN'
                    ? 'border-red-600 bg-red-100 text-red-950 dark:border-red-400 dark:bg-red-500/20 dark:text-red-200'
                    : 'border-stone-300 bg-white text-stone-700 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span>{t.dispatch.breakdownBtn}</span>
              </button>
            </div>

            {disruptionType === 'BREAKDOWN' ? (
              <div>
                <label htmlFor="dis-machine" className="block text-xs font-semibold">
                  Affected Machine
                </label>
                <select
                  id="dis-machine"
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-900"
                >
                  {state.equipment.map((eq) => {
                    const count = activeJobCounts.get(eq.id) ?? 0;
                    return (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.category} · {count} active {count === 1 ? 'job' : 'jobs'})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="dis-radius" className="block text-xs font-semibold">
                  Weather Impact Radius (km)
                </label>
                <input
                  id="dis-radius"
                  type="number"
                  min="2"
                  max="50"
                  value={affectedRadiusKm}
                  onChange={(e) => setAffectedRadiusKm(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3 font-mono text-sm tabular-nums dark:border-white/15 dark:bg-slate-900"
                />
              </div>
            )}

            <div>
              <label htmlFor="dis-delay" className="block text-xs font-semibold">
                Delay / Repair Window (Hours)
              </label>
              <input
                id="dis-delay"
                type="number"
                min="1"
                max="48"
                value={delayHours}
                onChange={(e) => setDelayHours(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3 font-mono text-sm tabular-nums dark:border-white/15 dark:bg-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submittingDisruption}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white transition-transform hover:bg-amber-800 active:scale-[0.98] disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>
                {submittingDisruption
                  ? 'Running Auto-Reschedule…'
                  : t.dispatch.triggerBtn}
              </span>
            </button>
          </form>

          {/* Disruption Log Feed */}
          <div className="mt-4 space-y-2.5">
            {state.disruptions.map((dis) => (
              <div
                key={dis.id}
                className={`rounded-xl border p-3.5 text-xs ${
                  dis.resolved
                    ? 'border-stone-200 bg-stone-50 text-stone-700 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300'
                    : 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/35 dark:text-amber-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{dis.title}</p>
                    <p className="mt-0.5 opacity-90">{dis.description}</p>
                  </div>
                  {!dis.resolved ? (
                    <button
                      type="button"
                      onClick={() => onResolveDisruption(dis.id)}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-stone-900 px-3 font-semibold text-white whitespace-nowrap shrink-0 hover:bg-stone-800 dark:bg-emerald-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{t.dispatch.markCleared}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 whitespace-nowrap shrink-0 dark:text-emerald-300">
                      <Clock className="h-3.5 w-3.5" />
                      {t.dispatch.resolved}
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-1 border-t border-current/15 pt-2">
                  {dis.cascadeSummary.map((line, i) => (
                    <li key={i} className="font-medium">
                      • {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
