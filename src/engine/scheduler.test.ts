import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBookingWindow,
  calculateTravelMinutes,
  calculateWorkMinutes,
  checkAvailability,
  computePriorityScore,
  handleDisruptionCascade,
  haversineDistanceKm,
  optimizeEquipmentSchedule,
  sortBookingsByPriority,
} from './scheduler';
import type { Booking, Equipment, Plot } from '../types/fieldshare';

const baseTractor: Equipment = {
  id: 'eq_1',
  ownerId: 'usr_owner_1',
  name: 'Mahindra 575 DI',
  modelCode: 'M575-4WD',
  category: 'TRACTOR',
  status: 'AVAILABLE',
  hourlyRateInr: 850,
  workRateAcresHr: 2.0,
  transitSpeedKmh: 20,
  horsepower: 45,
  baseVillage: 'Riverbend Depot',
  latitude: 38.54,
  longitude: -121.74,
  imageUrl: '/src/assets/images/machine_tractor_utility_1794954399411.jpg',
};

const backupTractor: Equipment = {
  ...baseTractor,
  id: 'eq_2',
  name: 'Kubota MU4501',
  modelCode: 'K-MU45',
  latitude: 38.55,
  longitude: -121.75,
};

const plotNear: Plot = {
  id: 'plot_near',
  farmerId: 'usr_f1',
  name: 'North Paddy Terrace',
  cropType: 'Rice Paddy',
  areaAcres: 4,
  villageName: 'Willow Creek',
  latitude: 38.56,
  longitude: -121.74,
  requiredCategory: 'TRACTOR',
  targetStartAt: '2026-11-18T08:00:00.000Z',
  deadlineAt: '2026-11-18T20:00:00.000Z',
  soilCondition: 'Moist Clay',
};

const plotFar: Plot = {
  id: 'plot_far',
  farmerId: 'usr_f2',
  name: 'South Ridge Maize',
  cropType: 'Maize',
  areaAcres: 6,
  villageName: 'Oakhollow',
  latitude: 38.62,
  longitude: -121.82,
  requiredCategory: 'TRACTOR',
  targetStartAt: '2026-11-18T08:00:00.000Z',
  deadlineAt: '2026-11-21T18:00:00.000Z',
  soilCondition: 'Dry Loam',
};

test('haversineDistanceKm & calculateTravelMinutes compute realistic rural transit', () => {
  const dist = haversineDistanceKm(
    { latitude: 38.54, longitude: -121.74 },
    { latitude: 38.56, longitude: -121.74 }
  );
  assert.ok(dist > 2 && dist < 3, `Expected ~2.2km, got ${dist}`);

  const travel = calculateTravelMinutes(
    { latitude: 38.54, longitude: -121.74 },
    { latitude: 38.56, longitude: -121.74 },
    20
  );
  assert.ok(travel.travelMinutes >= 10);
  assert.ok(travel.distanceKm >= dist);
});

test('calculateWorkMinutes includes field setup buffer', () => {
  // 4 acres at 2 acres/hr = 120 min + 15 min setup = 135 min
  assert.equal(calculateWorkMinutes(4, 2), 135);
});

test('checkAvailability blocks overlapping travel + work buffers and suggests next open slot', () => {
  const plotsById = new Map<string, Plot>([
    [plotNear.id, plotNear],
    [plotFar.id, plotFar],
  ]);

  const win1 = calculateBookingWindow(
    baseTractor,
    plotNear,
    '2026-11-18T09:00:00.000Z'
  );
  const existing: Booking = {
    id: 'bk_1',
    equipmentId: baseTractor.id,
    plotId: plotNear.id,
    farmerId: 'usr_f1',
    status: 'CONFIRMED',
    effectiveStartAt: win1.effectiveStartAt,
    fieldStartAt: win1.fieldStartAt,
    endAt: win1.endAt,
    travelMinutes: win1.travelMinutes,
    workMinutes: win1.workMinutes,
    transitDistanceKm: win1.distanceKm,
    estimatedCostInr: win1.estimatedCostInr,
    priorityScore: 90,
    sequenceOrder: 1,
    createdAt: '2026-11-17T12:00:00.000Z',
  };

  // Overlapping attempt 30 minutes later
  const conflict = checkAvailability(
    baseTractor,
    plotFar,
    '2026-11-18T09:30:00.000Z',
    [existing],
    plotsById
  );
  assert.equal(conflict.available, false);
  assert.equal(conflict.conflictingBookings.length, 1);
  assert.ok(conflict.suggestedStartAt !== null);

  // Verify suggested slot passes availability
  const clear = checkAvailability(
    baseTractor,
    plotFar,
    conflict.suggestedStartAt!,
    [existing],
    plotsById
  );
  assert.equal(clear.available, true);
});

test('Priority algorithm ranks closer deadline higher than distant deadline', () => {
  const nowIso = '2026-11-18T06:00:00.000Z';
  const urgentScore = computePriorityScore(plotNear, nowIso);
  const laterScore = computePriorityScore(plotFar, nowIso);
  assert.ok(urgentScore.priorityScore > laterScore.priorityScore);
  assert.equal(urgentScore.urgencyTier, 'CRITICAL');

  const plotsById = new Map([
    [plotNear.id, plotNear],
    [plotFar.id, plotFar],
  ]);
  const ranked = sortBookingsByPriority(
    [
      {
        id: 'bk_far',
        equipmentId: 'eq_1',
        plotId: plotFar.id,
        farmerId: 'usr_f2',
        status: 'PENDING',
        effectiveStartAt: '2026-11-18T08:00:00.000Z',
        fieldStartAt: '2026-11-18T08:30:00.000Z',
        endAt: '2026-11-18T11:30:00.000Z',
        travelMinutes: 30,
        workMinutes: 180,
        transitDistanceKm: 10,
        estimatedCostInr: 2200,
        priorityScore: 0,
        sequenceOrder: 1,
        createdAt: nowIso,
      },
      {
        id: 'bk_near',
        equipmentId: 'eq_1',
        plotId: plotNear.id,
        farmerId: 'usr_f1',
        status: 'PENDING',
        effectiveStartAt: '2026-11-18T08:00:00.000Z',
        fieldStartAt: '2026-11-18T08:15:00.000Z',
        endAt: '2026-11-18T10:30:00.000Z',
        travelMinutes: 15,
        workMinutes: 135,
        transitDistanceKm: 3,
        estimatedCostInr: 1900,
        priorityScore: 0,
        sequenceOrder: 2,
        createdAt: nowIso,
      },
    ],
    plotsById,
    nowIso
  );

  assert.equal(ranked[0].booking.id, 'bk_near');
});

test('Schedule optimizer reduces transit km when suboptimal order exists', () => {
  const plotMid: Plot = {
    ...plotNear,
    id: 'plot_mid',
    name: 'Mid Valley Plot',
    latitude: 38.58,
    longitude: -121.77,
    deadlineAt: '2026-11-21T18:00:00.000Z',
  };
  const plots = [plotFar, plotNear, plotMid];

  // Intentionally suboptimal order: Base -> Far -> Near -> Mid
  const bookings: Booking[] = [
    {
      id: 'b1',
      equipmentId: 'eq_1',
      plotId: plotFar.id,
      farmerId: 'usr_f2',
      status: 'CONFIRMED',
      effectiveStartAt: '2026-11-18T07:00:00.000Z',
      fieldStartAt: '2026-11-18T07:40:00.000Z',
      endAt: '2026-11-18T10:55:00.000Z',
      travelMinutes: 40,
      workMinutes: 195,
      transitDistanceKm: 14,
      estimatedCostInr: 2600,
      priorityScore: 40,
      sequenceOrder: 1,
      createdAt: '2026-11-17T10:00:00.000Z',
    },
    {
      id: 'b2',
      equipmentId: 'eq_1',
      plotId: plotNear.id,
      farmerId: 'usr_f1',
      status: 'CONFIRMED',
      effectiveStartAt: '2026-11-18T11:00:00.000Z',
      fieldStartAt: '2026-11-18T11:40:00.000Z',
      endAt: '2026-11-18T13:55:00.000Z',
      travelMinutes: 40,
      workMinutes: 135,
      transitDistanceKm: 12,
      estimatedCostInr: 2100,
      priorityScore: 95,
      sequenceOrder: 2,
      createdAt: '2026-11-17T10:00:00.000Z',
    },
    {
      id: 'b3',
      equipmentId: 'eq_1',
      plotId: plotMid.id,
      farmerId: 'usr_f1',
      status: 'CONFIRMED',
      effectiveStartAt: '2026-11-18T14:00:00.000Z',
      fieldStartAt: '2026-11-18T14:20:00.000Z',
      endAt: '2026-11-18T16:35:00.000Z',
      travelMinutes: 20,
      workMinutes: 135,
      transitDistanceKm: 4,
      estimatedCostInr: 1950,
      priorityScore: 40,
      sequenceOrder: 3,
      createdAt: '2026-11-17T10:00:00.000Z',
    },
  ];

  const result = optimizeEquipmentSchedule(
    [baseTractor],
    bookings,
    plots,
    '2026-11-18T06:00:00.000Z'
  );
  assert.ok(
    result.afterTransitKm < result.beforeTransitKm,
    `Expected optimized ${result.afterTransitKm} < baseline ${result.beforeTransitKm}`
  );
  assert.ok(result.distanceSavedKm > 0);
});

test('Disruption handler reassigns bookings on breakdown when backup equipment exists', () => {
  const win = calculateBookingWindow(
    baseTractor,
    plotNear,
    '2026-11-18T09:00:00.000Z'
  );
  const booking: Booking = {
    id: 'bk_active',
    equipmentId: baseTractor.id,
    plotId: plotNear.id,
    farmerId: 'usr_f1',
    status: 'CONFIRMED',
    effectiveStartAt: win.effectiveStartAt,
    fieldStartAt: win.fieldStartAt,
    endAt: win.endAt,
    travelMinutes: win.travelMinutes,
    workMinutes: win.workMinutes,
    transitDistanceKm: win.distanceKm,
    estimatedCostInr: win.estimatedCostInr,
    priorityScore: 88,
    sequenceOrder: 1,
    createdAt: '2026-11-17T12:00:00.000Z',
  };

  const cascade = handleDisruptionCascade({
    type: 'BREAKDOWN',
    severity: 'CRITICAL',
    title: 'Hydraulic Pump Failure',
    description: 'Pressure drop on Mahindra 575 DI',
    equipmentId: baseTractor.id,
    centerLat: baseTractor.latitude,
    centerLng: baseTractor.longitude,
    affectedRadiusKm: 15,
    delayHours: 6,
    equipmentList: [baseTractor, backupTractor],
    plots: [plotNear],
    bookings: [booking],
    nowIso: '2026-11-18T06:00:00.000Z',
  });

  assert.equal(cascade.affectedCount, 1);
  assert.equal(cascade.reassignedCount, 1);
  assert.equal(cascade.updatedBookings[0].equipmentId, backupTractor.id);
  assert.equal(cascade.updatedBookings[0].status, 'RESCHEDULED');
  const eq1 = cascade.updatedEquipment.find((e) => e.id === baseTractor.id);
  assert.equal(eq1?.status, 'MAINTENANCE');
});
