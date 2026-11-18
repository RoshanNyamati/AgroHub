import { useMemo, useState } from 'react';
import { CloudRain, MapPin, Navigation, Tractor } from 'lucide-react';
import type { Booking, Disruption, Equipment, Plot } from '../types/fieldshare';
import { ACTIVE_BOOKING_STATUSES } from '../engine/scheduler';

interface GeoFieldMapProps {
  equipment: Equipment[];
  plots: Plot[];
  bookings: Booking[];
  disruptions: Disruption[];
  title?: string;
  subtitle?: string;
  onSelectPlot?: (plotId: string) => void;
  onSelectEquipment?: (equipmentId: string) => void;
}

export function GeoFieldMap({
  equipment,
  plots,
  bookings,
  disruptions,
  title = 'Geospatial Dispatch Map',
  subtitle = 'Live GPS positions of machinery bases, farm plots, and chained transit paths',
  onSelectPlot,
  onSelectEquipment,
}: GeoFieldMapProps) {
  const [selectedLabel, setSelectedLabel] = useState<string>(
    'Tap any machine depot or farm plot to inspect coordinates & active route.'
  );

  const bounds = useMemo(() => {
    const allPoints = [
      ...equipment.map((e) => ({ lat: e.latitude, lng: e.longitude })),
      ...plots.map((p) => ({ lat: p.latitude, lng: p.longitude })),
    ];
    if (allPoints.length === 0) {
      return { minLat: 38.53, maxLat: 38.63, minLng: -121.83, maxLng: -121.72 };
    }
    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);
    const padLat = 0.016;
    const padLng = 0.026;
    return {
      minLat: Math.min(...lats) - padLat,
      maxLat: Math.max(...lats) + padLat,
      minLng: Math.min(...lngs) - padLng,
      maxLng: Math.max(...lngs) + padLng,
    };
  }, [equipment, plots]);

  const project = (lat: number, lng: number) => {
    const x =
      ((lng - bounds.minLng) / Math.max(0.001, bounds.maxLng - bounds.minLng)) *
        500 +
      40;
    const y =
      320 -
      ((lat - bounds.minLat) / Math.max(0.001, bounds.maxLat - bounds.minLat)) *
        280;
    return { x, y };
  };

  const activeRoutes = useMemo(() => {
    const plotsById = new Map(plots.map((p) => [p.id, p]));
    return equipment.map((eq) => {
      const jobs = bookings
        .filter(
          (b) =>
            b.equipmentId === eq.id &&
            ACTIVE_BOOKING_STATUSES.has(b.status) &&
            plotsById.has(b.plotId)
        )
        .sort(
          (a, b) =>
            new Date(a.fieldStartAt).getTime() -
            new Date(b.fieldStartAt).getTime()
        );

      const start = project(eq.latitude, eq.longitude);
      const pts = [start];
      for (const job of jobs) {
        const plot = plotsById.get(job.plotId)!;
        pts.push(project(plot.latitude, plot.longitude));
      }
      return {
        equipmentId: eq.id,
        pointsAttr: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
        hasRoute: pts.length > 1,
      };
    });
  }, [equipment, plots, bookings, bounds]);

  const activeRainAlerts = disruptions.filter(
    (d) => !d.resolved && d.type === 'RAIN'
  );

  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-white/10 dark:bg-slate-900/65 dark:backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-950 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-stone-600 dark:text-slate-300">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-stone-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Tractor className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            Machinery ({equipment.length})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            Farm Plots ({plots.length})
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-slate-950/80">
        <svg
          viewBox="0 0 600 360"
          className="h-64 w-full sm:h-72"
          role="img"
          aria-label="Geospatial dispatch map of farm plots and machinery"
        >
          {/* Subtle topographic coordinate grid */}
          {[60, 120, 180, 240, 300].map((y) => (
            <line
              key={`h-${y}`}
              x1="0"
              y1={y}
              x2="600"
              y2={y}
              stroke="currentColor"
              className="text-stone-200 dark:text-slate-800/80"
              strokeWidth="1"
            />
          ))}
          {[100, 200, 300, 400, 500].map((x) => (
            <line
              key={`v-${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2="360"
              stroke="currentColor"
              className="text-stone-200 dark:text-slate-800/80"
              strokeWidth="1"
            />
          ))}

          {/* Active Rain Disruption Zone */}
          {activeRainAlerts.map((alert) => {
            const center = project(alert.centerLat, alert.centerLng);
            return (
              <g key={alert.id}>
                <circle
                  cx={center.x}
                  cy={center.y}
                  r={Math.min(130, alert.affectedRadiusKm * 7)}
                  className="fill-amber-500/15 stroke-amber-600 dark:fill-amber-400/15 dark:stroke-amber-400"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              </g>
            );
          })}

          {/* Chained Route Polylines */}
          {activeRoutes
            .filter((r) => r.hasRoute)
            .map((route) => (
              <polyline
                key={route.equipmentId}
                points={route.pointsAttr}
                fill="none"
                stroke="#15803d"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

          {/* Plot Nodes */}
          {plots.map((plot) => {
            const pt = project(plot.latitude, plot.longitude);
            const shortPlotName =
              plot.name.length > 16
                ? `${plot.name.slice(0, 15).trimEnd()}…`
                : plot.name;
            return (
              <g
                key={plot.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedLabel(
                    `${plot.name} · ${plot.cropType} · ${plot.areaAcres} ac (${plot.latitude.toFixed(3)}, ${plot.longitude.toFixed(3)})`
                  );
                  onSelectPlot?.(plot.id);
                }}
              >
                <circle
                  r="11"
                  className="fill-amber-100 stroke-amber-700 dark:fill-amber-900/70 dark:stroke-amber-400"
                  strokeWidth="2"
                />
                <circle
                  r="4"
                  className="fill-amber-700 dark:fill-amber-300"
                />
                <text
                  x="15"
                  y="4"
                  className="fill-stone-800 text-[10px] font-semibold dark:fill-slate-200"
                >
                  {shortPlotName}
                </text>
              </g>
            );
          })}

          {/* Machinery Base Nodes */}
          {equipment.map((eq) => {
            const pt = project(eq.latitude, eq.longitude);
            const isDown = eq.status === 'MAINTENANCE';
            return (
              <g
                key={eq.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedLabel(
                    `${eq.name} · ${eq.workRateAcresHr} ac/hr · ${eq.baseVillage} (${eq.status})`
                  );
                  onSelectEquipment?.(eq.id);
                }}
              >
                <rect
                  x="-11"
                  y="-11"
                  width="22"
                  height="22"
                  rx="6"
                  className={
                    isDown
                      ? 'fill-red-600 stroke-white dark:stroke-slate-950'
                      : 'fill-emerald-700 stroke-white dark:fill-emerald-500 dark:stroke-slate-950'
                  }
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className="fill-white text-[10px] font-bold"
                >
                  {eq.category[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Navigation className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
          {selectedLabel}
        </span>
        {activeRainAlerts.length > 0 && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
            <CloudRain className="h-3.5 w-3.5" />
            Weather zone active ({activeRainAlerts[0].affectedRadiusKm} km radius)
          </span>
        )}
      </div>
    </div>
  );
}
