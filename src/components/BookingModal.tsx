import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AvailabilityCheckResult } from '../engine/scheduler';
import type { Translations } from '../i18n/translations';
import type { Equipment, Plot } from '../types/fieldshare';
import {
  formatRupees,
  formatShortTime,
  toDatetimeLocalValue,
  triggerHaptic,
} from '../utils/feedback';

interface BookingModalProps {
  open: boolean;
  t: Translations;
  equipment: Equipment[];
  plots: Plot[];
  presetPlotId?: string;
  presetEquipmentId?: string;
  onClose: () => void;
  onCheckAvailability: (payload: {
    equipmentId: string;
    plotId: string;
    requestedFieldStartAt: string;
  }) => Promise<AvailabilityCheckResult>;
  onCreateBooking: (payload: {
    equipmentId: string;
    plotId: string;
    requestedFieldStartAt: string;
    notes?: string;
  }) => Promise<void>;
}

export function BookingModal({
  open,
  t,
  equipment,
  plots,
  presetPlotId,
  presetEquipmentId,
  onClose,
  onCheckAvailability,
  onCreateBooking,
}: BookingModalProps) {
  const [plotId, setPlotId] = useState(presetPlotId || plots[0]?.id || '');
  const [equipmentId, setEquipmentId] = useState(
    presetEquipmentId || equipment[0]?.id || ''
  );
  const [startLocal, setStartLocal] = useState('2026-11-18T14:30');
  const [notes, setNotes] = useState('');

  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] =
    useState<AvailabilityCheckResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (presetPlotId) setPlotId(presetPlotId);
    else if (!plotId && plots[0]) setPlotId(plots[0].id);

    if (presetEquipmentId) setEquipmentId(presetEquipmentId);
    else if (!equipmentId && equipment[0]) setEquipmentId(equipment[0].id);
    setError(null);
  }, [open, presetPlotId, presetEquipmentId, plots, equipment]);

  useEffect(() => {
    if (!open || !plotId || !equipmentId || !startLocal) return;
    let active = true;
    setChecking(true);
    const iso = new Date(`${startLocal}:00.000Z`).toISOString();
    onCheckAvailability({
      equipmentId,
      plotId,
      requestedFieldStartAt: iso,
    })
      .then((res) => {
        if (active) {
          setAvailability(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Check failed');
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [open, plotId, equipmentId, startLocal, onCheckAvailability]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability?.available) {
      setError('Select an open time slot before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await onCreateBooking({
        equipmentId,
        plotId,
        requestedFieldStartAt: new Date(`${startLocal}:00.000Z`).toISOString(),
        notes: notes.trim() || undefined,
      });
      triggerHaptic([16, 30, 16]);
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-stone-300 bg-white p-6 text-stone-950 shadow-2xl dark:border-white/15 dark:bg-slate-900 dark:text-white">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
          <div>
            <h2 id="booking-modal-title" className="font-display text-xl font-bold">
              {t.booking.title}
            </h2>
            <p className="text-xs text-stone-600 dark:text-slate-300">
              {t.booking.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking modal"
            className="flex h-12 w-12 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="bk-plot" className="block text-sm font-semibold">
              {t.booking.stepPlot}
            </label>
            <select
              id="bk-plot"
              value={plotId}
              onChange={(e) => setPlotId(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.cropType} ({p.areaAcres} ac · {p.villageName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bk-eq" className="block text-sm font-semibold">
              {t.booking.stepEquipment}
            </label>
            <select
              id="bk-eq"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
            >
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.workRateAcresHr} ac/hr · {formatRupees(eq.hourlyRateInr)}/hr · {eq.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bk-start" className="block text-sm font-semibold">
              {t.booking.stepStart}
            </label>
            <input
              id="bk-start"
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 font-mono text-sm tabular-nums focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
            />
          </div>

          {/* Live Availability Engine Panel */}
          <div
            aria-live="polite"
            className={`rounded-xl border p-4 text-sm ${
              checking
                ? 'border-stone-300 bg-stone-50 dark:border-white/15 dark:bg-slate-950'
                : availability?.available
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100'
            }`}
          >
            {checking || !availability ? (
              <p className="text-xs font-medium">Calculating transit & field duration…</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  {availability.available ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                  )}
                  <div>
                    <p className="font-bold">
                      {availability.available
                        ? t.booking.slotAvailable
                        : t.booking.slotOverlap}
                    </p>
                    <p className="mt-0.5 text-xs opacity-90">{availability.reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-current/15 pt-2.5 text-xs">
                  <div>
                    <span className="opacity-75">{t.booking.roadTransit}</span>
                    <p className="font-mono font-bold tabular-nums">
                      {availability.estimate.travelMinutes}m ({availability.estimate.distanceKm} km)
                    </p>
                  </div>
                  <div>
                    <span className="opacity-75">{t.booking.fieldWork}</span>
                    <p className="font-mono font-bold tabular-nums">
                      {availability.estimate.workMinutes} min
                    </p>
                  </div>
                  <div>
                    <span className="opacity-75">{t.booking.estTotal}</span>
                    <p className="font-mono font-bold tabular-nums">
                      {formatRupees(availability.estimate.estimatedCostInr)}
                    </p>
                  </div>
                </div>

                {!availability.available && availability.suggestedStartAt && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      setStartLocal(toDatetimeLocalValue(availability.suggestedStartAt!));
                    }}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-3 text-xs font-semibold text-white hover:bg-amber-900 dark:bg-amber-500 dark:text-slate-950"
                  >
                    <Clock className="h-4 w-4" />
                    <span>
                      {t.booking.useNextSlot} ({formatShortTime(availability.suggestedStartAt)})
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="bk-notes" className="block text-sm font-semibold">
              {t.booking.notesLabel}
            </label>
            <input
              id="bk-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Enter via south culvert gate"
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t.machinery.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !availability?.available}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>{submitting ? 'Submitting…' : t.booking.submitBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
