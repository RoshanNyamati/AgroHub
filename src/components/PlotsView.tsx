import {
  AlertCircle,
  CalendarClock,
  MapPin,
  Mic,
  Plus,
  Sprout,
  Tractor,
  Wheat,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { computePriorityScore } from '../engine/scheduler';
import { SEED_REFERENCE_ISO } from '../data/seed';
import type { Translations } from '../i18n/translations';
import type { EquipmentCategory, Plot } from '../types/fieldshare';
import {
  formatShortTime,
  triggerHaptic,
  useVoiceInput,
} from '../utils/feedback';

interface PlotsViewProps {
  plots: Plot[];
  searchQuery: string;
  t: Translations;
  onAddPlot: (payload: {
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
  }) => Promise<void>;
  onRequestMachineForPlot: (plotId: string) => void;
}

const CROP_QUICK_PICKS = ['Winter Wheat', 'Rice Paddy', 'Maize', 'Soybeans', 'Tomatoes'];

const PLOT_VILLAGES = [
  { name: 'Willow Creek', lat: 38.558, lng: -121.744 },
  { name: 'Sunridge Flats', lat: 38.579, lng: -121.762 },
  { name: 'Oakhollow Basin', lat: 38.612, lng: -121.805 },
  { name: 'Riverbend East', lat: 38.545, lng: -121.732 },
];

export function PlotsView({
  plots,
  searchQuery,
  t,
  onAddPlot,
  onRequestMachineForPlot,
}: PlotsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('Rice Paddy');
  const [areaAcres, setAreaAcres] = useState('4.5');
  const [villageName, setVillageName] = useState('Willow Creek');
  const [latitude, setLatitude] = useState('38.558');
  const [longitude, setLongitude] = useState('-121.744');
  const [requiredCategory, setRequiredCategory] = useState<EquipmentCategory>('TRACTOR');
  const [targetStart, setTargetStart] = useState('2026-11-18T14:00');
  const [deadline, setDeadline] = useState('2026-11-19T18:00');
  const [soilCondition, setSoilCondition] = useState('Firm Loam');

  const { listening, voiceHint, startVoiceCapture } = useVoiceInput(
    (transcript) => setName(transcript),
    ['East River Terrace', 'South Orchard Block', 'Creekside Millet Plot']
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return plots
      .map((plot) => ({
        plot,
        priority: computePriorityScore(plot, SEED_REFERENCE_ISO),
      }))
      .filter(({ plot }) => {
        if (!q) return true;
        return (
          plot.name.toLowerCase().includes(q) ||
          plot.cropType.toLowerCase().includes(q) ||
          plot.villageName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.priority.priorityScore - a.priority.priorityScore);
  }, [plots, searchQuery]);

  const handleVillageChange = (vName: string) => {
    setVillageName(vName);
    const preset = PLOT_VILLAGES.find((v) => v.name === vName);
    if (preset) {
      setLatitude(String(preset.lat));
      setLongitude(String(preset.lng));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !cropType.trim()) {
      setFormError('Plot name and crop type are required.');
      return;
    }
    const acres = Number(areaAcres);
    if (!Number.isFinite(acres) || acres <= 0) {
      setFormError('Plot size in acres must be greater than 0.');
      return;
    }
    const startIso = new Date(`${targetStart}:00.000Z`).toISOString();
    const deadlineIso = new Date(`${deadline}:00.000Z`).toISOString();
    if (new Date(deadlineIso).getTime() <= new Date(startIso).getTime()) {
      setFormError('Harvest/operation deadline must be after the target start time.');
      return;
    }

    try {
      setSubmitting(true);
      await onAddPlot({
        name: name.trim(),
        cropType: cropType.trim(),
        areaAcres: acres,
        villageName,
        latitude: Number(latitude) || 38.56,
        longitude: Number(longitude) || -121.75,
        requiredCategory,
        targetStartAt: startIso,
        deadlineAt: deadlineIso,
        soilCondition,
      });
      triggerHaptic([14, 30, 14]);
      setName('');
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save farm plot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-settle">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-950 dark:text-white">
            {t.plots.title}
          </h1>
          <p className="mt-1 text-sm text-stone-700 dark:text-slate-300">
            {t.plots.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(14);
            setFormError(null);
            setModalOpen(true);
          }}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t.plots.registerPlot}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ plot, priority }) => (
          <article
            key={plot.id}
            className="flex flex-col justify-between rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300">
                    {plot.cropType.toLowerCase().includes('wheat') ||
                    plot.cropType.toLowerCase().includes('barley') ? (
                      <Wheat className="h-6 w-6" />
                    ) : (
                      <Sprout className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-950 dark:text-white">
                      {plot.name}
                    </h2>
                    <p className="text-xs font-medium text-stone-600 dark:text-slate-300">
                      {plot.cropType} · {plot.soilCondition}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold tabular-nums ${
                    priority.urgencyTier === 'CRITICAL'
                      ? 'text-red-700 dark:text-red-400'
                      : priority.urgencyTier === 'HIGH'
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {priority.hoursUntilDeadline}h left
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200 pt-3 text-xs dark:border-white/10">
                <div>
                  <span className="text-stone-500 dark:text-slate-400">{t.plots.plotArea}</span>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-stone-950 dark:text-white">
                    {plot.areaAcres} acres
                  </p>
                </div>
                <div>
                  <span className="text-stone-500 dark:text-slate-400">{t.plots.needs}</span>
                  <p className="mt-0.5 font-semibold text-stone-950 dark:text-white">
                    {plot.requiredCategory}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500 dark:text-slate-400">{t.plots.location}</span>
                  <p className="mt-0.5 inline-flex items-center gap-1 font-medium text-stone-800 dark:text-slate-200">
                    <MapPin className="h-3.5 w-3.5 text-stone-500" />
                    {plot.villageName}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500 dark:text-slate-400">{t.plots.deadline}</span>
                  <p className="mt-0.5 font-mono font-medium tabular-nums text-stone-800 dark:text-slate-200">
                    {formatShortTime(plot.deadlineAt)}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(14);
                onRequestMachineForPlot(plot.id);
              }}
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <Tractor className="h-4 w-4" aria-hidden="true" />
              <span>{t.plots.bookForPlot}</span>
            </button>
          </article>
        ))}
      </div>

      {/* Register Farm Plot Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-plot-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-300 bg-white p-6 text-stone-950 shadow-2xl dark:border-white/15 dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
              <h2 id="add-plot-title" className="font-display text-xl font-bold">
                {t.plots.modalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close register farm plot modal"
                className="flex h-12 w-12 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-900 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label htmlFor="plot-name" className="block text-sm font-semibold">
                  Plot Name
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="plot-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. East River Terrace"
                    className="min-h-[48px] flex-1 rounded-xl border border-stone-300 bg-stone-50 px-3.5 text-sm focus:border-emerald-700 focus:bg-white focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={startVoiceCapture}
                    aria-label="Voice input plot name"
                    className={`flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition-colors ${
                      listening
                        ? 'border-emerald-700 bg-emerald-700 text-white'
                        : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
                {voiceHint && (
                  <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {voiceHint}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="plot-crop" className="block text-sm font-semibold">
                  Crop Type
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {CROP_QUICK_PICKS.map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => setCropType(crop)}
                      className={`min-h-[40px] rounded-lg border px-3 text-xs font-semibold transition-colors ${
                        cropType === crop
                          ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-600'
                          : 'border-stone-300 bg-stone-50 text-stone-800 dark:border-white/15 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
                <input
                  id="plot-crop"
                  type="text"
                  required
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="plot-acres" className="block text-sm font-semibold">
                    Plot Size (Acres)
                  </label>
                  <input
                    id="plot-acres"
                    type="number"
                    step="0.1"
                    min="0.2"
                    required
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 font-mono text-sm tabular-nums focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label htmlFor="plot-cat" className="block text-sm font-semibold">
                    Machinery Needed
                  </label>
                  <select
                    id="plot-cat"
                    value={requiredCategory}
                    onChange={(e) => setRequiredCategory(e.target.value as EquipmentCategory)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  >
                    <option value="TRACTOR">Tractor</option>
                    <option value="HARVESTER">Harvester</option>
                    <option value="PLANTER">Planter</option>
                    <option value="SPRAYER">Sprayer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="plot-village" className="block text-sm font-semibold">
                    Village Zone
                  </label>
                  <select
                    id="plot-village"
                    value={villageName}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  >
                    {PLOT_VILLAGES.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="plot-soil" className="block text-sm font-semibold">
                    Soil Condition
                  </label>
                  <input
                    id="plot-soil"
                    type="text"
                    value={soilCondition}
                    onChange={(e) => setSoilCondition(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="plot-start" className="block text-sm font-semibold">
                    Required Start (UTC)
                  </label>
                  <input
                    id="plot-start"
                    type="datetime-local"
                    required
                    value={targetStart}
                    onChange={(e) => setTargetStart(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3 font-mono text-xs tabular-nums focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label htmlFor="plot-deadline" className="block text-sm font-semibold">
                    Hard Deadline (UTC)
                  </label>
                  <input
                    id="plot-deadline"
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3 font-mono text-xs tabular-nums focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[48px] rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <CalendarClock className="h-4 w-4" />
                  <span>{submitting ? 'Registering…' : t.plots.savePlot}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
