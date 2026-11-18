import type {
  Booking,
  BookingStatus,
  Disruption,
  DisruptionSeverity,
  DisruptionType,
  Equipment,
  GeoPoint,
  Plot,
} from '../types/fieldshare';

const EARTH_RADIUS_KM = 6371;
const RURAL_ROAD_WINDING_FACTOR = 1.28;
const FIELD_SETUP_BUFFER_MINUTES = 15;
const MIN_TRAVEL_MINUTES = 10;

export const ACTIVE_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  'CONFIRMED',
  'IN_PROGRESS',
  'RESCHEDULED',
]);

export interface BookingWindowEstimate {
  distanceKm: number;
  travelMinutes: number;
  workMinutes: number;
  effectiveStartAt: string;
  fieldStartAt: string;
  endAt: string;
  estimatedCostInr: number;
}

export interface AvailabilityCheckResult {
  available: boolean;
  reason: string;
  estimate: BookingWindowEstimate;
  conflictingBookings: Booking[];
  suggestedStartAt: string | null;
}

export interface PriorityRankedBooking {
  booking: Booking;
  plot: Plot | undefined;
  priorityScore: number;
  hoursUntilDeadline: number;
  urgencyTier: 'CRITICAL' | 'HIGH' | 'STANDARD';
  rationale: string;
}

export interface ScheduleOptimizationResult {
  updatedBookings: Booking[];
  beforeTransitKm: number;
  afterTransitKm: number;
  distanceSavedKm: number;
  fuelSavedLiters: number;
  reorderedCount: number;
  routeSummaries: Array<{
    equipmentId: string;
    equipmentName: string;
    stopCount: number;
    beforeKm: number;
    afterKm: number;
    orderedPlotNames: string[];
  }>;
}

export interface DisruptionCascadeResult {
  disruption: Disruption;
  updatedBookings: Booking[];
  updatedEquipment: Equipment[];
  affectedCount: number;
  reassignedCount: number;
  rescheduledCount: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Computes straight-line great-circle distance in kilometers between two GPS coordinates.
 */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Estimates rural road travel time in minutes between two coordinates using winding factor.
 */
export function calculateTravelMinutes(
  from: GeoPoint,
  to: GeoPoint,
  transitSpeedKmh = 22
): { distanceKm: number; travelMinutes: number } {
  const straightKm = haversineDistanceKm(from, to);
  const roadKm = Number((straightKm * RURAL_ROAD_WINDING_FACTOR).toFixed(2));
  if (roadKm <= 0.1) {
    return { distanceKm: 0, travelMinutes: MIN_TRAVEL_MINUTES };
  }
  const safeSpeed = Math.max(8, transitSpeedKmh);
  const rawMinutes = Math.ceil((roadKm / safeSpeed) * 60);
  return {
    distanceKm: roadKm,
    travelMinutes: Math.max(MIN_TRAVEL_MINUTES, rawMinutes),
  };
}

/**
 * Calculates field execution minutes from plot acreage and machinery work rate (acres/hr).
 */
export function calculateWorkMinutes(
  areaAcres: number,
  workRateAcresHr: number
): number {
  const safeAcres = Math.max(0.25, areaAcres);
  const safeRate = Math.max(0.5, workRateAcresHr);
  const activeFieldMinutes = Math.ceil((safeAcres / safeRate) * 60);
  return activeFieldMinutes + FIELD_SETUP_BUFFER_MINUTES;
}

/**
 * Computes the complete travel + work time window and estimated cost for a booking.
 */
export function calculateBookingWindow(
  equipment: Equipment,
  plot: Plot,
  requestedFieldStartIso: string,
  departureOrigin?: GeoPoint
): BookingWindowEstimate {
  const origin: GeoPoint = departureOrigin ?? {
    latitude: equipment.latitude,
    longitude: equipment.longitude,
  };
  const destination: GeoPoint = {
    latitude: plot.latitude,
    longitude: plot.longitude,
  };

  const { distanceKm, travelMinutes } = calculateTravelMinutes(
    origin,
    destination,
    equipment.transitSpeedKmh
  );
  const workMinutes = calculateWorkMinutes(
    plot.areaAcres,
    equipment.workRateAcresHr
  );

  const fieldStartMs = new Date(requestedFieldStartIso).getTime();
  const effectiveStartMs = fieldStartMs - travelMinutes * 60_000;
  const endMs = fieldStartMs + workMinutes * 60_000;

  const billableHours = (workMinutes + travelMinutes * 0.5) / 60;
  const estimatedCostInr = Math.round(billableHours * equipment.hourlyRateInr);

  return {
    distanceKm,
    travelMinutes,
    workMinutes,
    effectiveStartAt: new Date(effectiveStartMs).toISOString(),
    fieldStartAt: new Date(fieldStartMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    estimatedCostInr,
  };
}

export function intervalsOverlap(
  aStartIso: string,
  aEndIso: string,
  bStartIso: string,
  bEndIso: string
): boolean {
  const aStart = new Date(aStartIso).getTime();
  const aEnd = new Date(aEndIso).getTime();
  const bStart = new Date(bStartIso).getTime();
  const bEnd = new Date(bEndIso).getTime();
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Availability Engine:
 * Evaluates machinery operational status, dynamic transit origin from previous job on the same machine,
 * and temporal overlap against all confirmed/in-progress/rescheduled bookings.
 */
export function checkAvailability(
  equipment: Equipment,
  plot: Plot,
  requestedFieldStartIso: string,
  allBookings: Booking[],
  plotsById: Map<string, Plot>,
  ignoreBookingId?: string
): AvailabilityCheckResult {
  const activeOnMachine = allBookings
    .filter(
      (b) =>
        b.equipmentId === equipment.id &&
        b.id !== ignoreBookingId &&
        ACTIVE_BOOKING_STATUSES.has(b.status)
    )
    .sort(
      (a, b) =>
        new Date(a.effectiveStartAt).getTime() -
        new Date(b.effectiveStartAt).getTime()
    );

  const requestedStartMs = new Date(requestedFieldStartIso).getTime();

  // Determine departure origin: if there's a preceding booking ending before requested start,
  // depart from that plot instead of home base.
  const priorBookings = activeOnMachine.filter(
    (b) => new Date(b.endAt).getTime() <= requestedStartMs
  );
  const lastPrior = priorBookings[priorBookings.length - 1];
  const priorPlot = lastPrior ? plotsById.get(lastPrior.plotId) : undefined;
  const departureOrigin: GeoPoint = priorPlot
    ? { latitude: priorPlot.latitude, longitude: priorPlot.longitude }
    : { latitude: equipment.latitude, longitude: equipment.longitude };

  const estimate = calculateBookingWindow(
    equipment,
    plot,
    requestedFieldStartIso,
    departureOrigin
  );

  if (equipment.status === 'MAINTENANCE') {
    return {
      available: false,
      reason: `${equipment.name} is currently under mechanical repair.`,
      estimate,
      conflictingBookings: [],
      suggestedStartAt: null,
    };
  }

  if (equipment.status === 'WEATHER_HOLD') {
    return {
      available: false,
      reason: `${equipment.name} is paused under a local rain/weather hold.`,
      estimate,
      conflictingBookings: [],
      suggestedStartAt: null,
    };
  }

  const conflictingBookings = activeOnMachine.filter((existing) =>
    intervalsOverlap(
      estimate.effectiveStartAt,
      estimate.endAt,
      existing.effectiveStartAt,
      existing.endAt
    )
  );

  if (conflictingBookings.length === 0) {
    return {
      available: true,
      reason: `Clear window (${estimate.travelMinutes}m travel + ${estimate.workMinutes}m field work).`,
      estimate,
      conflictingBookings: [],
      suggestedStartAt: null,
    };
  }

  // Find earliest conflict-free slot after the latest conflicting or active job
  const suggestedStartAt = findNextAvailableSlot(
    equipment,
    plot,
    requestedFieldStartIso,
    activeOnMachine,
    plotsById
  );

  const firstConflict = conflictingBookings[0];
  const conflictPlot = plotsById.get(firstConflict.plotId);
  return {
    available: false,
    reason: `Overlaps with ${conflictPlot?.name ?? 'scheduled job'} (${estimate.travelMinutes}m transit buffer included).`,
    estimate,
    conflictingBookings,
    suggestedStartAt,
  };
}

export function findNextAvailableSlot(
  equipment: Equipment,
  plot: Plot,
  earliestFieldStartIso: string,
  activeBookingsOnMachine: Booking[],
  plotsById: Map<string, Plot>
): string {
  const sorted = [...activeBookingsOnMachine].sort(
    (a, b) =>
      new Date(a.effectiveStartAt).getTime() -
      new Date(b.effectiveStartAt).getTime()
  );

  let candidateFieldStartMs = new Date(earliestFieldStartIso).getTime();

  for (const existing of sorted) {
    const prevPlot = plotsById.get(existing.plotId);
    const origin: GeoPoint = prevPlot
      ? { latitude: prevPlot.latitude, longitude: prevPlot.longitude }
      : { latitude: equipment.latitude, longitude: equipment.longitude };

    const est = calculateBookingWindow(
      equipment,
      plot,
      new Date(candidateFieldStartMs).toISOString()
    );

    if (
      intervalsOverlap(
        est.effectiveStartAt,
        est.endAt,
        existing.effectiveStartAt,
        existing.endAt
      )
    ) {
      // Shift candidate start right after existing booking finishes plus transit from that plot
      const { travelMinutes } = calculateTravelMinutes(
        origin,
        { latitude: plot.latitude, longitude: plot.longitude },
        equipment.transitSpeedKmh
      );
      candidateFieldStartMs =
        new Date(existing.endAt).getTime() + travelMinutes * 60_000;
    }
  }

  // Round up cleanly to next 15-minute boundary
  const fifteenMinMs = 15 * 60_000;
  const roundedMs =
    Math.ceil(candidateFieldStartMs / fifteenMinMs) * fifteenMinMs;
  return new Date(roundedMs).toISOString();
}

/**
 * Priority Algorithm:
 * Computes urgency score using deadline proximity, crop window sensitivity, and plot size.
 * Higher score = higher dispatch priority.
 */
export function computePriorityScore(
  plot: Plot,
  referenceIso: string
): {
  priorityScore: number;
  hoursUntilDeadline: number;
  urgencyTier: 'CRITICAL' | 'HIGH' | 'STANDARD';
  rationale: string;
} {
  const refMs = new Date(referenceIso).getTime();
  const deadlineMs = new Date(plot.deadlineAt).getTime();
  const hoursUntilDeadline = Number(
    ((deadlineMs - refMs) / 3_600_000).toFixed(1)
  );

  // Deadline proximity dominates: <= 24h gets up to 100 pts, decays smoothly over 120h
  const clampedHours = Math.max(1, hoursUntilDeadline);
  const deadlineUrgency =
    hoursUntilDeadline <= 0
      ? 110
      : Math.min(100, Math.round((2400 / (clampedHours + 12)) * 10) / 10);

  const cropLower = plot.cropType.toLowerCase();
  const cropSensitivityBonus =
    cropLower.includes('rice') ||
    cropLower.includes('paddy') ||
    cropLower.includes('wheat') ||
    cropLower.includes('tomato')
      ? 12
      : 6;

  const scaleBonus = Math.min(10, Number((plot.areaAcres * 0.8).toFixed(1)));
  const priorityScore = Number(
    (deadlineUrgency + cropSensitivityBonus + scaleBonus).toFixed(1)
  );

  const urgencyTier: 'CRITICAL' | 'HIGH' | 'STANDARD' =
    hoursUntilDeadline <= 30
      ? 'CRITICAL'
      : hoursUntilDeadline <= 60
        ? 'HIGH'
        : 'STANDARD';

  const rationale =
    hoursUntilDeadline <= 0
      ? `Overdue deadline · ${plot.cropType} (${plot.areaAcres} ac)`
      : `${hoursUntilDeadline}h until deadline · ${plot.cropType} (${plot.areaAcres} ac)`;

  return {
    priorityScore,
    hoursUntilDeadline,
    urgencyTier,
    rationale,
  };
}

export function sortBookingsByPriority(
  bookings: Booking[],
  plotsById: Map<string, Plot>,
  referenceIso: string
): PriorityRankedBooking[] {
  return bookings
    .map((booking) => {
      const plot = plotsById.get(booking.plotId);
      if (!plot) {
        return {
          booking,
          plot: undefined,
          priorityScore: booking.priorityScore,
          hoursUntilDeadline: 72,
          urgencyTier: 'STANDARD' as const,
          rationale: 'Standard priority',
        };
      }
      const metrics = computePriorityScore(plot, referenceIso);
      return {
        booking: {
          ...booking,
          priorityScore: metrics.priorityScore,
        },
        plot,
        ...metrics,
      };
    })
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return (
        new Date(a.booking.fieldStartAt).getTime() -
        new Date(b.booking.fieldStartAt).getTime()
      );
    });
}

/**
 * Schedule Optimizer:
 * Reorders each machine's scheduled jobs using nearest-neighbor + deadline guardrails
 * to minimize deadhead transit distance and pack sequential work slots cleanly.
 */
export function optimizeEquipmentSchedule(
  equipmentList: Equipment[],
  bookings: Booking[],
  plots: Plot[],
  referenceIso: string
): ScheduleOptimizationResult {
  const plotsById = new Map(plots.map((p) => [p.id, p]));
  const equipmentById = new Map(equipmentList.map((e) => [e.id, e]));

  let beforeTransitKm = 0;
  let afterTransitKm = 0;
  let reorderedCount = 0;

  const updatedById = new Map<string, Booking>(
    bookings.map((b) => [b.id, { ...b }])
  );
  const routeSummaries: ScheduleOptimizationResult['routeSummaries'] = [];

  for (const eq of equipmentList) {
    const machineJobs = bookings
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

    if (machineJobs.length === 0) {
      continue;
    }

    // Calculate baseline transit distance for current ordering
    let currentOrigin: GeoPoint = {
      latitude: eq.latitude,
      longitude: eq.longitude,
    };
    let eqBeforeKm = 0;
    for (const job of machineJobs) {
      const p = plotsById.get(job.plotId)!;
      const { distanceKm } = calculateTravelMinutes(
        currentOrigin,
        { latitude: p.latitude, longitude: p.longitude },
        eq.transitSpeedKmh
      );
      eqBeforeKm += distanceKm;
      currentOrigin = { latitude: p.latitude, longitude: p.longitude };
    }
    beforeTransitKm += eqBeforeKm;

    // Nearest-neighbor selection weighted by deadline urgency so urgent plots never miss deadlines
    const remaining = [...machineJobs];
    const optimizedOrder: Booking[] = [];
    let cursorPos: GeoPoint = { latitude: eq.latitude, longitude: eq.longitude };
    const earliestAnchorMs = Math.min(
      ...machineJobs.map((j) => new Date(j.fieldStartAt).getTime())
    );
    let cursorTimeMs = Math.max(
      earliestAnchorMs,
      new Date(referenceIso).getTime() + 30 * 60_000
    );

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestCost = Number.POSITIVE_INFINITY;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const plot = plotsById.get(candidate.plotId)!;
        const { distanceKm, travelMinutes } = calculateTravelMinutes(
          cursorPos,
          { latitude: plot.latitude, longitude: plot.longitude },
          eq.transitSpeedKmh
        );
        const workMinutes = calculateWorkMinutes(
          plot.areaAcres,
          eq.workRateAcresHr
        );
        const projectedEndMs =
          cursorTimeMs + (travelMinutes + workMinutes) * 60_000;
        const deadlineMs = new Date(plot.deadlineAt).getTime();
        const slackHours = (deadlineMs - projectedEndMs) / 3_600_000;

        // Heavy penalty if choosing this stop next risks missing its deadline
        const deadlinePenalty = slackHours < 6 ? 120 : slackHours < 18 ? 18 : 0;
        const score = distanceKm + deadlinePenalty;

        if (score < bestCost) {
          bestCost = score;
          bestIdx = i;
        }
      }

      const chosen = remaining.splice(bestIdx, 1)[0];
      optimizedOrder.push(chosen);
      const chosenPlot = plotsById.get(chosen.plotId)!;
      const { travelMinutes } = calculateTravelMinutes(
        cursorPos,
        { latitude: chosenPlot.latitude, longitude: chosenPlot.longitude },
        eq.transitSpeedKmh
      );
      const workMinutes = calculateWorkMinutes(
        chosenPlot.areaAcres,
        eq.workRateAcresHr
      );
      cursorTimeMs =
        Math.max(cursorTimeMs + travelMinutes * 60_000, new Date(chosenPlot.targetStartAt).getTime()) +
        workMinutes * 60_000;
      cursorPos = {
        latitude: chosenPlot.latitude,
        longitude: chosenPlot.longitude,
      };
    }

    // Re-chain exact timestamps and transit distances for the optimized route
    let chainPos: GeoPoint = { latitude: eq.latitude, longitude: eq.longitude };
    let chainAvailableMs = Math.min(
      ...machineJobs.map((j) => new Date(j.effectiveStartAt).getTime())
    );
    let eqAfterKm = 0;

    optimizedOrder.forEach((job, idx) => {
      if (job.id !== machineJobs[idx].id) {
        reorderedCount += 1;
      }
      const plot = plotsById.get(job.plotId)!;
      const { distanceKm, travelMinutes } = calculateTravelMinutes(
        chainPos,
        { latitude: plot.latitude, longitude: plot.longitude },
        eq.transitSpeedKmh
      );
      const workMinutes = calculateWorkMinutes(
        plot.areaAcres,
        eq.workRateAcresHr
      );

      const departureMs = chainAvailableMs;
      const fieldStartMs = departureMs + travelMinutes * 60_000;
      const endMs = fieldStartMs + workMinutes * 60_000;

      const updated: Booking = {
        ...job,
        sequenceOrder: idx + 1,
        transitDistanceKm: distanceKm,
        travelMinutes,
        workMinutes,
        effectiveStartAt: new Date(departureMs).toISOString(),
        fieldStartAt: new Date(fieldStartMs).toISOString(),
        endAt: new Date(endMs).toISOString(),
        priorityScore: computePriorityScore(plot, referenceIso).priorityScore,
      };
      updatedById.set(job.id, updated);

      eqAfterKm += distanceKm;
      chainPos = { latitude: plot.latitude, longitude: plot.longitude };
      chainAvailableMs = endMs;
    });

    afterTransitKm += eqAfterKm;
    routeSummaries.push({
      equipmentId: eq.id,
      equipmentName: equipmentById.get(eq.id)?.name ?? eq.id,
      stopCount: optimizedOrder.length,
      beforeKm: Number(eqBeforeKm.toFixed(2)),
      afterKm: Number(eqAfterKm.toFixed(2)),
      orderedPlotNames: optimizedOrder.map(
        (j) => plotsById.get(j.plotId)?.name ?? j.plotId
      ),
    });
  }

  const roundedBefore = Number(beforeTransitKm.toFixed(2));
  const roundedAfter = Number(afterTransitKm.toFixed(2));
  const distanceSavedKm = Number(
    Math.max(0, roundedBefore - roundedAfter).toFixed(2)
  );
  const fuelSavedLiters = Number((distanceSavedKm * 0.42).toFixed(2));

  return {
    updatedBookings: Array.from(updatedById.values()),
    beforeTransitKm: roundedBefore,
    afterTransitKm: roundedAfter,
    distanceSavedKm,
    fuelSavedLiters,
    reorderedCount,
    routeSummaries,
  };
}

/**
 * Disruption Handler:
 * Handles RAIN (shifts jobs inside weather radius forward by delayHours cleanly without overlap)
 * and BREAKDOWN (marks machine MAINTENANCE, attempts auto-reassignment to nearest compatible machine,
 * or reschedules after repair window if no substitute is free).
 */
export function handleDisruptionCascade(params: {
  type: DisruptionType;
  severity: DisruptionSeverity;
  title: string;
  description: string;
  equipmentId?: string;
  centerLat: number;
  centerLng: number;
  affectedRadiusKm: number;
  delayHours: number;
  equipmentList: Equipment[];
  plots: Plot[];
  bookings: Booking[];
  nowIso: string;
}): DisruptionCascadeResult {
  const {
    type,
    severity,
    title,
    description,
    equipmentId,
    centerLat,
    centerLng,
    affectedRadiusKm,
    delayHours,
    equipmentList,
    plots,
    bookings,
    nowIso,
  } = params;

  const plotsById = new Map(plots.map((p) => [p.id, p]));
  const updatedEquipment = equipmentList.map((e) => ({ ...e }));
  const updatedBookings = bookings.map((b) => ({ ...b }));
  const cascadeSummary: string[] = [];

  let affectedCount = 0;
  let reassignedCount = 0;
  let rescheduledCount = 0;

  const centerPoint: GeoPoint = { latitude: centerLat, longitude: centerLng };

  if (type === 'BREAKDOWN' && equipmentId) {
    const brokenEq = updatedEquipment.find((e) => e.id === equipmentId);
    if (brokenEq) {
      brokenEq.status = 'MAINTENANCE';
    }

    const impacted = updatedBookings
      .filter(
        (b) =>
          b.equipmentId === equipmentId && ACTIVE_BOOKING_STATUSES.has(b.status)
      )
      .sort(
        (a, b) =>
          computePriorityScore(plotsById.get(b.plotId)!, nowIso).priorityScore -
          computePriorityScore(plotsById.get(a.plotId)!, nowIso).priorityScore
      );

    for (const job of impacted) {
      affectedCount += 1;
      const plot = plotsById.get(job.plotId);
      if (!plot || !brokenEq) continue;

      // Try to find a compatible healthy backup machine
      const candidates = updatedEquipment
        .filter(
          (candidate) =>
            candidate.id !== brokenEq.id &&
            candidate.category === brokenEq.category &&
            candidate.status === 'AVAILABLE'
        )
        .sort((a, b) => {
          const dA = haversineDistanceKm(
            { latitude: a.latitude, longitude: a.longitude },
            { latitude: plot.latitude, longitude: plot.longitude }
          );
          const dB = haversineDistanceKm(
            { latitude: b.latitude, longitude: b.longitude },
            { latitude: plot.latitude, longitude: plot.longitude }
          );
          return dA - dB;
        });

      let reassigned = false;
      for (const backup of candidates) {
        const check = checkAvailability(
          backup,
          plot,
          job.fieldStartAt,
          updatedBookings,
          plotsById,
          job.id
        );

        const targetStart = check.available
          ? job.fieldStartAt
          : check.suggestedStartAt;

        if (targetStart) {
          const nextEst = calculateBookingWindow(backup, plot, targetStart);
          const idx = updatedBookings.findIndex((b) => b.id === job.id);
          updatedBookings[idx] = {
            ...job,
            equipmentId: backup.id,
            status: 'RESCHEDULED',
            effectiveStartAt: nextEst.effectiveStartAt,
            fieldStartAt: nextEst.fieldStartAt,
            endAt: nextEst.endAt,
            travelMinutes: nextEst.travelMinutes,
            workMinutes: nextEst.workMinutes,
            transitDistanceKm: nextEst.distanceKm,
            rescheduleReason: `Auto-reassigned from ${brokenEq.name} (${title})`,
          };
          reassigned = true;
          reassignedCount += 1;
          cascadeSummary.push(
            `${plot.name} reassigned to ${backup.name} (${nextEst.distanceKm} km away)`
          );
          break;
        }
      }

      if (!reassigned) {
        const delayedStartIso = new Date(
          new Date(job.fieldStartAt).getTime() + delayHours * 3_600_000
        ).toISOString();
        const nextEst = calculateBookingWindow(
          brokenEq,
          plot,
          delayedStartIso
        );
        const idx = updatedBookings.findIndex((b) => b.id === job.id);
        updatedBookings[idx] = {
          ...job,
          status: 'RESCHEDULED',
          effectiveStartAt: nextEst.effectiveStartAt,
          fieldStartAt: nextEst.fieldStartAt,
          endAt: nextEst.endAt,
          rescheduleReason: `Delayed +${delayHours}h awaiting ${brokenEq.name} repair`,
        };
        rescheduledCount += 1;
        cascadeSummary.push(
          `${plot.name} pushed +${delayHours}h pending ${brokenEq.name} repair`
        );
      }
    }
  } else {
    // RAIN or ROAD_CLOSURE: shift all active bookings inside affected radius by delayHours
    for (const eq of updatedEquipment) {
      const dist = haversineDistanceKm(centerPoint, {
        latitude: eq.latitude,
        longitude: eq.longitude,
      });
      if (type === 'RAIN' && dist <= affectedRadiusKm && eq.status === 'AVAILABLE') {
        eq.status = 'WEATHER_HOLD';
      }
    }

    const impacted = updatedBookings
      .filter((b) => {
        if (!ACTIVE_BOOKING_STATUSES.has(b.status)) return false;
        const plot = plotsById.get(b.plotId);
        if (!plot) return false;
        const dist = haversineDistanceKm(centerPoint, {
          latitude: plot.latitude,
          longitude: plot.longitude,
        });
        return dist <= affectedRadiusKm;
      })
      .sort(
        (a, b) =>
          new Date(a.fieldStartAt).getTime() -
          new Date(b.fieldStartAt).getTime()
      );

    for (const job of impacted) {
      affectedCount += 1;
      const plot = plotsById.get(job.plotId)!;
      const eq = updatedEquipment.find((e) => e.id === job.equipmentId);
      if (!eq) continue;

      const candidateStartIso = new Date(
        new Date(job.fieldStartAt).getTime() + delayHours * 3_600_000
      ).toISOString();

      // Check against other already-shifted jobs on this machine
      const machineActives = updatedBookings.filter(
        (b) =>
          b.equipmentId === eq.id &&
          b.id !== job.id &&
          ACTIVE_BOOKING_STATUSES.has(b.status)
      );
      const conflictFreeStart = findNextAvailableSlot(
        eq,
        plot,
        candidateStartIso,
        machineActives,
        plotsById
      );
      const nextEst = calculateBookingWindow(eq, plot, conflictFreeStart);
      const idx = updatedBookings.findIndex((b) => b.id === job.id);
      updatedBookings[idx] = {
        ...job,
        status: 'RESCHEDULED',
        effectiveStartAt: nextEst.effectiveStartAt,
        fieldStartAt: nextEst.fieldStartAt,
        endAt: nextEst.endAt,
        rescheduleReason: `${type === 'RAIN' ? 'Rain delay' : 'Road detour'} (+${delayHours}h shift)`,
      };
      rescheduledCount += 1;
      cascadeSummary.push(
        `${plot.name} shifted +${delayHours}h (${eq.name})`
      );
    }
  }

  if (cascadeSummary.length === 0) {
    cascadeSummary.push(
      'Alert logged; no active field windows fell inside impact zone.'
    );
  }

  const disruption: Disruption = {
    id: `dis_${Date.now().toString(36)}`,
    equipmentId,
    type,
    severity,
    title,
    description,
    affectedRadiusKm,
    centerLat,
    centerLng,
    delayHours,
    resolved: false,
    cascadeSummary,
    createdAt: nowIso,
  };

  return {
    disruption,
    updatedBookings,
    updatedEquipment,
    affectedCount,
    reassignedCount,
    rescheduledCount,
  };
}
