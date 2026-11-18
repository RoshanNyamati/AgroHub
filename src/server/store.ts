import fs from 'fs';
import path from 'path';
import { INITIAL_SEED_STATE, SEED_REFERENCE_ISO } from '../data/seed';
import {
  calculateBookingWindow,
  checkAvailability,
  computePriorityScore,
  handleDisruptionCascade,
  optimizeEquipmentSchedule,
} from '../engine/scheduler';
import type {
  Booking,
  DisruptionSeverity,
  DisruptionType,
  Equipment,
  EquipmentCategory,
  FieldShareState,
  Plot,
} from '../types/fieldshare';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'fieldshare-db.json');

function cloneSeed(): FieldShareState {
  return JSON.parse(JSON.stringify(INITIAL_SEED_STATE)) as FieldShareState;
}

export function loadState(): FieldShareState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const seed = cloneSeed();
      saveState(seed);
      return seed;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as FieldShareState;
    if (
      !parsed ||
      !Array.isArray(parsed.equipment) ||
      !Array.isArray(parsed.plots) ||
      parsed.equipment.some((e) => typeof e.hourlyRateInr !== 'number')
    ) {
      const seed = cloneSeed();
      saveState(seed);
      return seed;
    }
    return parsed;
  } catch {
    return cloneSeed();
  }
}

export function saveState(state: FieldShareState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function resetState(): FieldShareState {
  const seed = cloneSeed();
  saveState(seed);
  return seed;
}

const DEFAULT_IMAGE_BY_CATEGORY: Record<EquipmentCategory, string> = {
  TRACTOR: '/src/assets/images/machine_tractor_utility_1794954399411.jpg',
  HARVESTER: '/src/assets/images/machine_harvester_combine_1794954399679.jpg',
  PLANTER: '/src/assets/images/machine_planter_seeder_1794954400371.jpg',
  SPRAYER: '/src/assets/images/machine_boom_sprayer_1794954400108.jpg',
  TILLER: '/src/assets/images/hero_tractor_field_1794954398722.jpg',
};

export function addEquipmentRecord(input: {
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
  ownerId?: string;
}): { state: FieldShareState; equipment: Equipment } {
  const state = loadState();
  const equipment: Equipment = {
    id: `eq_${Date.now().toString(36)}`,
    ownerId: input.ownerId || 'usr_owner_1',
    name: input.name.trim(),
    modelCode: input.modelCode.trim() || 'AG-CUSTOM',
    category: input.category,
    status: 'AVAILABLE',
    hourlyRateInr: Number(input.hourlyRateInr),
    workRateAcresHr: Number(input.workRateAcresHr),
    transitSpeedKmh: Number(input.transitSpeedKmh || 22),
    horsepower: Number(input.horsepower || 50),
    baseVillage: input.baseVillage.trim(),
    latitude: Number(input.latitude),
    longitude: Number(input.longitude),
    imageUrl: DEFAULT_IMAGE_BY_CATEGORY[input.category],
  };

  state.equipment = [equipment, ...state.equipment];
  saveState(state);
  return { state, equipment };
}

export function addPlotRecord(input: {
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
  farmerId?: string;
}): { state: FieldShareState; plot: Plot } {
  const state = loadState();
  const plot: Plot = {
    id: `plot_${Date.now().toString(36)}`,
    farmerId: input.farmerId || 'usr_farmer_1',
    name: input.name.trim(),
    cropType: input.cropType.trim(),
    areaAcres: Number(input.areaAcres),
    villageName: input.villageName.trim(),
    latitude: Number(input.latitude),
    longitude: Number(input.longitude),
    requiredCategory: input.requiredCategory,
    targetStartAt: new Date(input.targetStartAt).toISOString(),
    deadlineAt: new Date(input.deadlineAt).toISOString(),
    soilCondition: input.soilCondition.trim() || 'Dry Loam',
  };

  state.plots = [plot, ...state.plots];
  saveState(state);
  return { state, plot };
}

export function checkBookingAvailabilityRecord(input: {
  equipmentId: string;
  plotId: string;
  requestedFieldStartAt: string;
}) {
  const state = loadState();
  const equipment = state.equipment.find((e) => e.id === input.equipmentId);
  const plot = state.plots.find((p) => p.id === input.plotId);
  if (!equipment || !plot) {
    throw new Error('Equipment or plot not found');
  }
  const plotsById = new Map(state.plots.map((p) => [p.id, p]));
  return checkAvailability(
    equipment,
    plot,
    input.requestedFieldStartAt,
    state.bookings,
    plotsById
  );
}

export function createBookingRecord(input: {
  equipmentId: string;
  plotId: string;
  requestedFieldStartAt: string;
  notes?: string;
  farmerId?: string;
}): { state: FieldShareState; booking: Booking } {
  const state = loadState();
  const equipment = state.equipment.find((e) => e.id === input.equipmentId);
  const plot = state.plots.find((p) => p.id === input.plotId);
  if (!equipment || !plot) {
    throw new Error('Selected equipment or farm plot does not exist.');
  }

  const plotsById = new Map(state.plots.map((p) => [p.id, p]));
  const avail = checkAvailability(
    equipment,
    plot,
    input.requestedFieldStartAt,
    state.bookings,
    plotsById
  );

  if (!avail.available) {
    throw new Error(avail.reason);
  }

  const priority = computePriorityScore(plot, SEED_REFERENCE_ISO);
  const booking: Booking = {
    id: `bk_${Date.now().toString(36)}`,
    equipmentId: equipment.id,
    plotId: plot.id,
    farmerId: input.farmerId || plot.farmerId,
    status: 'PENDING',
    effectiveStartAt: avail.estimate.effectiveStartAt,
    fieldStartAt: avail.estimate.fieldStartAt,
    endAt: avail.estimate.endAt,
    travelMinutes: avail.estimate.travelMinutes,
    workMinutes: avail.estimate.workMinutes,
    transitDistanceKm: avail.estimate.distanceKm,
    estimatedCostInr: avail.estimate.estimatedCostInr,
    priorityScore: priority.priorityScore,
    sequenceOrder: state.bookings.filter((b) => b.equipmentId === equipment.id).length + 1,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  state.bookings = [booking, ...state.bookings];
  saveState(state);
  return { state, booking };
}

export function decideBookingRecord(
  bookingId: string,
  decision: 'CONFIRMED' | 'REJECTED'
): { state: FieldShareState; booking: Booking; warning?: string } {
  const state = loadState();
  const idx = state.bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) {
    throw new Error('Booking request not found.');
  }
  const target = state.bookings[idx];

  if (decision === 'REJECTED') {
    const updated: Booking = {
      ...target,
      status: 'REJECTED',
      rescheduleReason: 'Declined by machinery owner',
    };
    state.bookings[idx] = updated;
    saveState(state);
    return { state, booking: updated };
  }

  const equipment = state.equipment.find((e) => e.id === target.equipmentId);
  const plot = state.plots.find((p) => p.id === target.plotId);
  if (!equipment || !plot) {
    throw new Error('Associated equipment or plot missing.');
  }

  const plotsById = new Map(state.plots.map((p) => [p.id, p]));
  const avail = checkAvailability(
    equipment,
    plot,
    target.fieldStartAt,
    state.bookings,
    plotsById,
    target.id
  );

  if (!avail.available && avail.suggestedStartAt) {
    // Auto-shift to next available conflict-free window upon owner approval
    const shifted = calculateBookingWindow(equipment, plot, avail.suggestedStartAt);
    const updated: Booking = {
      ...target,
      status: 'CONFIRMED',
      effectiveStartAt: shifted.effectiveStartAt,
      fieldStartAt: shifted.fieldStartAt,
      endAt: shifted.endAt,
      travelMinutes: shifted.travelMinutes,
      workMinutes: shifted.workMinutes,
      transitDistanceKm: shifted.distanceKm,
      rescheduleReason: 'Auto-placed in next open slot to avoid travel/work overlap',
    };
    state.bookings[idx] = updated;
    saveState(state);
    return {
      state,
      booking: updated,
      warning: 'Adjusted start time to next conflict-free slot to preserve transit buffer.',
    };
  }

  if (!avail.available) {
    throw new Error(avail.reason);
  }

  const updated: Booking = {
    ...target,
    status: 'CONFIRMED',
    effectiveStartAt: avail.estimate.effectiveStartAt,
    fieldStartAt: avail.estimate.fieldStartAt,
    endAt: avail.estimate.endAt,
    travelMinutes: avail.estimate.travelMinutes,
    workMinutes: avail.estimate.workMinutes,
    transitDistanceKm: avail.estimate.distanceKm,
  };
  state.bookings[idx] = updated;
  saveState(state);
  return { state, booking: updated };
}

export function runScheduleOptimizationRecord() {
  const state = loadState();
  const result = optimizeEquipmentSchedule(
    state.equipment,
    state.bookings,
    state.plots,
    SEED_REFERENCE_ISO
  );
  state.bookings = result.updatedBookings;
  state.lastOptimizedAt = new Date().toISOString();
  state.lastOptimizationSavedKm = result.distanceSavedKm;
  saveState(state);
  return { state, optimization: result };
}

export function triggerDisruptionRecord(input: {
  type: DisruptionType;
  severity: DisruptionSeverity;
  title: string;
  description: string;
  equipmentId?: string;
  centerLat: number;
  centerLng: number;
  affectedRadiusKm: number;
  delayHours: number;
}) {
  const state = loadState();
  const cascade = handleDisruptionCascade({
    ...input,
    equipmentList: state.equipment,
    plots: state.plots,
    bookings: state.bookings,
    nowIso: SEED_REFERENCE_ISO,
  });

  state.equipment = cascade.updatedEquipment;
  state.bookings = cascade.updatedBookings;
  state.disruptions = [cascade.disruption, ...state.disruptions];
  saveState(state);
  return { state, cascade };
}

export function resolveDisruptionRecord(disruptionId: string): FieldShareState {
  const state = loadState();
  const dis = state.disruptions.find((d) => d.id === disruptionId);
  if (!dis) {
    throw new Error('Disruption alert not found.');
  }
  dis.resolved = true;
  dis.resolvedAt = new Date().toISOString();

  if (dis.equipmentId) {
    const eq = state.equipment.find((e) => e.id === dis.equipmentId);
    if (eq && eq.status === 'MAINTENANCE') {
      eq.status = 'AVAILABLE';
    }
  }
  if (dis.type === 'RAIN') {
    for (const eq of state.equipment) {
      if (eq.status === 'WEATHER_HOLD') {
        eq.status = 'AVAILABLE';
      }
    }
  }

  saveState(state);
  return state;
}
