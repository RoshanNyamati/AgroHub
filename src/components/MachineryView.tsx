import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CloudRain,
  Gauge,
  MapPin,
  Mic,
  Plus,
  Sprout,
  Tractor,
  Wheat,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Translations } from '../i18n/translations';
import type { Equipment, EquipmentCategory } from '../types/fieldshare';
import { formatRupees, triggerHaptic, useVoiceInput } from '../utils/feedback';
import { EquipmentPhoto } from './EquipmentPhoto';

interface MachineryViewProps {
  equipment: Equipment[];
  userRole: 'FARMER' | 'OWNER';
  searchQuery: string;
  t: Translations;
  addModalTrigger?: number;
  onAddEquipment: (payload: {
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
  }) => Promise<void>;
  onBookEquipment: (equipmentId: string) => void;
  onViewDispatch: () => void;
}

const VILLAGE_PRESETS = [
  { name: 'Riverbend Depot', lat: 38.541, lng: -121.738 },
  { name: 'Greenridge Co-op', lat: 38.591, lng: -121.781 },
  { name: 'Oakhollow Shed', lat: 38.604, lng: -121.795 },
  { name: 'Willow Creek Yard', lat: 38.558, lng: -121.745 },
];

export function MachineryView({
  equipment,
  userRole,
  searchQuery,
  t,
  addModalTrigger,
  onAddEquipment,
  onBookEquipment,
  onViewDispatch,
}: MachineryViewProps) {
  const isOwner = userRole === 'OWNER';
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | EquipmentCategory>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (addModalTrigger && addModalTrigger > 0 && isOwner) {
      setFormError(null);
      setModalOpen(true);
    }
  }, [addModalTrigger, isOwner]);

  const [name, setName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('TRACTOR');
  const [hourlyRateInr, setHourlyRateInr] = useState('900');
  const [workRateAcresHr, setWorkRateAcresHr] = useState('2.5');
  const [horsepower, setHorsepower] = useState('55');
  const [baseVillage, setBaseVillage] = useState('Riverbend Depot');
  const [latitude, setLatitude] = useState('38.541');
  const [longitude, setLongitude] = useState('-121.738');

  const categories: Array<{ id: 'ALL' | EquipmentCategory; label: string; icon: typeof Tractor }> = [
    { id: 'ALL', label: t.machinery.allFleet, icon: Tractor },
    { id: 'TRACTOR', label: t.machinery.tractors, icon: Tractor },
    { id: 'HARVESTER', label: t.machinery.harvesters, icon: Wheat },
    { id: 'PLANTER', label: t.machinery.planters, icon: Sprout },
    { id: 'SPRAYER', label: t.machinery.sprayers, icon: CloudRain },
  ];

  const { listening, voiceHint, startVoiceCapture } = useVoiceInput(
    (transcript) => setName(transcript),
    ['Kubota L4508 Tractor', 'Mahindra 605 Utility', 'Swaraj 744 FE']
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return equipment.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.modelCode.toLowerCase().includes(q) ||
        item.baseVillage.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [equipment, selectedCategory, searchQuery]);

  const handleVillageSelect = (villageName: string) => {
    setBaseVillage(villageName);
    const preset = VILLAGE_PRESETS.find((v) => v.name === villageName);
    if (preset) {
      setLatitude(String(preset.lat));
      setLongitude(String(preset.lng));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Please enter a machinery name.');
      return;
    }
    const rate = Number(hourlyRateInr);
    const workRate = Number(workRateAcresHr);
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(workRate) || workRate <= 0) {
      setFormError('Hourly rate and work rate (acres/hr) must be positive numbers.');
      return;
    }

    try {
      setSubmitting(true);
      await onAddEquipment({
        name: name.trim(),
        modelCode: modelCode.trim() || 'AG-CUSTOM',
        category,
        hourlyRateInr: rate,
        workRateAcresHr: workRate,
        transitSpeedKmh: 23,
        horsepower: Number(horsepower) || 55,
        baseVillage,
        latitude: Number(latitude) || 38.55,
        longitude: Number(longitude) || -121.75,
      });
      triggerHaptic([14, 30, 14]);
      setName('');
      setModelCode('');
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to register machinery.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-settle">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-950 dark:text-white">
            {t.machinery.title}
          </h1>
          <p className="mt-1 text-sm text-stone-700 dark:text-slate-300">
            {isOwner ? t.machinery.ownerSubtitle : t.machinery.subtitle}
          </p>
        </div>

        {isOwner && (
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
            <span>{t.machinery.addEquipment}</span>
          </button>
        )}
      </div>

      {/* Category Filter Tabs (48px touch targets) */}
      <div
        role="group"
        aria-label="Filter equipment by category"
        className="flex flex-wrap gap-2"
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setSelectedCategory(cat.id);
              }}
              aria-pressed={active}
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-600'
                  : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center dark:border-white/15 dark:bg-slate-900/60">
          <Tractor className="mx-auto h-10 w-10 text-stone-500 dark:text-slate-400" />
          <h2 className="mt-3 text-base font-bold text-stone-950 dark:text-white">
            No matching machinery found
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
            Clear your search filter or register a new machine into the cooperative fleet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isMaintenance = item.status === 'MAINTENANCE';
            const isWeatherHold = item.status === 'WEATHER_HOLD';
            return (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-stone-300 bg-white transition-colors dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl"
              >
                <div className="relative h-48 w-full overflow-hidden bg-stone-100 dark:bg-slate-950">
                  <EquipmentPhoto
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                    <span className="text-xs font-medium text-stone-200">
                      {item.category} · {item.modelCode}
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums">
                      {formatRupees(item.hourlyRateInr)}/hr
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-bold text-stone-950 dark:text-white">
                        {item.name}
                      </h2>
                    </div>

                    <p className="mt-1.5 font-mono text-xs font-medium tabular-nums text-stone-700 dark:text-slate-300">
                      {item.workRateAcresHr} ac/hr · {item.horsepower} HP · {item.transitSpeedKmh} km/h transit
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 text-xs dark:border-white/10">
                      <span className="inline-flex items-center gap-1.5 font-medium text-stone-700 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-stone-500 dark:text-slate-400" />
                        {item.baseVillage}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isMaintenance
                            ? 'text-red-700 dark:text-red-400'
                            : isWeatherHold
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {isMaintenance ? (
                          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : isWeatherHold ? (
                          <CloudRain className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {isMaintenance
                            ? t.machinery.underRepair
                            : isWeatherHold
                              ? t.machinery.weatherHold
                              : t.machinery.available}
                        </span>
                      </span>
                    </div>
                  </div>

                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(12);
                        onViewDispatch();
                      }}
                      className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-stone-200 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                      <span>{t.machinery.manageInDispatch}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(14);
                        onBookEquipment(item.id);
                      }}
                      className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition-transform hover:bg-stone-800 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      <Gauge className="h-4 w-4" aria-hidden="true" />
                      <span>{t.machinery.scheduleMachine}</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Register Machinery Modal (Owner-only) */}
      {isOwner && modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-equipment-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-300 bg-white p-6 text-stone-950 shadow-2xl dark:border-white/15 dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
              <h2 id="add-equipment-title" className="font-display text-xl font-bold">
                {t.machinery.registerTitle}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close register machinery modal"
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
                <label htmlFor="eq-name" className="block text-sm font-semibold">
                  {t.machinery.machineryName}
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="eq-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kubota L4508 Tractor"
                    className="min-h-[48px] flex-1 rounded-xl border border-stone-300 bg-stone-50 px-3.5 text-sm text-stone-950 focus:border-emerald-700 focus:bg-white focus:outline-none dark:border-white/15 dark:bg-slate-950 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={startVoiceCapture}
                    aria-label="Voice input machinery name"
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
                <span className="block text-sm font-semibold">{t.machinery.machineType}</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      { id: 'TRACTOR', label: t.machinery.tractors, icon: Tractor },
                      { id: 'HARVESTER', label: t.machinery.harvesters, icon: Wheat },
                      { id: 'PLANTER', label: t.machinery.planters, icon: Sprout },
                      { id: 'SPRAYER', label: t.machinery.sprayers, icon: CloudRain },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const active = category === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCategory(opt.id)}
                        className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-200'
                            : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/15 dark:bg-slate-950 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="eq-rate" className="block text-sm font-semibold">
                    {t.machinery.hourlyRateInr}
                  </label>
                  <input
                    id="eq-rate"
                    type="number"
                    step="10"
                    min="50"
                    required
                    value={hourlyRateInr}
                    onChange={(e) => setHourlyRateInr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 font-mono text-sm tabular-nums focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label htmlFor="eq-workrate" className="block text-sm font-semibold">
                    {t.machinery.workRate}
                  </label>
                  <input
                    id="eq-workrate"
                    type="number"
                    step="0.1"
                    min="0.2"
                    required
                    value={workRateAcresHr}
                    onChange={(e) => setWorkRateAcresHr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 font-mono text-sm tabular-nums focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="eq-hp" className="block text-sm font-semibold">
                    {t.machinery.horsepower}
                  </label>
                  <input
                    id="eq-hp"
                    type="number"
                    min="10"
                    value={horsepower}
                    onChange={(e) => setHorsepower(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 font-mono text-sm tabular-nums focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label htmlFor="eq-village" className="block text-sm font-semibold">
                    {t.machinery.baseDepot}
                  </label>
                  <select
                    id="eq-village"
                    value={baseVillage}
                    onChange={(e) => handleVillageSelect(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm focus:border-emerald-700 focus:outline-none dark:border-white/15 dark:bg-slate-950"
                  >
                    {VILLAGE_PRESETS.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="eq-lat" className="block text-xs font-semibold text-stone-600 dark:text-slate-400">
                    GPS Latitude
                  </label>
                  <input
                    id="eq-lat"
                    type="number"
                    step="0.001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3 font-mono text-xs tabular-nums dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label htmlFor="eq-lng" className="block text-xs font-semibold text-stone-600 dark:text-slate-400">
                    GPS Longitude
                  </label>
                  <input
                    id="eq-lng"
                    type="number"
                    step="0.001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-stone-300 bg-stone-50 px-3 font-mono text-xs tabular-nums dark:border-white/15 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[48px] rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-800 hover:bg-stone-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t.machinery.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {submitting ? 'Saving…' : t.machinery.saveMachinery}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
