import { desc, eq, or } from 'drizzle-orm';
import { INITIAL_SEED_STATE, SEED_REFERENCE_ISO } from '../data/seed.ts';
import {
  calculateBookingWindow,
  checkAvailability,
  computePriorityScore,
  handleDisruptionCascade,
  optimizeEquipmentSchedule,
} from '../engine/scheduler.ts';
import { hashPassword, normalizePhone, verifyPassword } from '../server/auth.ts';
import type {
  AuthUser,
  Booking,
  BookingStatus,
  Disruption,
  DisruptionSeverity,
  DisruptionType,
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  FieldShareState,
  Plot,
  User,
  UserRole,
} from '../types/fieldshare.ts';
import { db } from './index.ts';
import {
  bookings,
  disruptions,
  equipment,
  plots,
  users,
  workspaceMeta,
} from './schema.ts';

const DEFAULT_IMAGE_BY_CATEGORY: Record<EquipmentCategory, string> = {
  TRACTOR: '/src/assets/images/machine_tractor_utility_1794954399411.jpg',
  HARVESTER: '/src/assets/images/machine_harvester_combine_1794954399679.jpg',
  PLANTER: '/src/assets/images/machine_planter_seeder_1794954400371.jpg',
  SPRAYER: '/src/assets/images/machine_boom_sprayer_1794954400108.jpg',
  TILLER: '/src/assets/images/hero_tractor_field_1794954398722.jpg',
};

function toPublicUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone || '',
    role: row.role as UserRole,
    villageName: row.villageName,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating,
  };
}

function toAuthUser(
  row: typeof users.$inferSelect,
  provider: 'phone' | 'google'
): AuthUser {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    role: row.role === 'OWNER' ? 'OWNER' : 'FARMER',
    villageName: row.villageName,
    authProvider: provider,
  };
}

function toEquipment(row: typeof equipment.$inferSelect): Equipment {
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    modelCode: row.modelCode,
    category: row.category as EquipmentCategory,
    status: row.status as EquipmentStatus,
    hourlyRateInr: row.hourlyRateInr,
    workRateAcresHr: row.workRateAcresHr,
    transitSpeedKmh: row.transitSpeedKmh,
    horsepower: row.horsepower,
    baseVillage: row.baseVillage,
    latitude: row.latitude,
    longitude: row.longitude,
    imageUrl: row.imageUrl,
  };
}

function toPlot(row: typeof plots.$inferSelect): Plot {
  return {
    id: row.id,
    farmerId: row.farmerId,
    name: row.name,
    cropType: row.cropType,
    areaAcres: row.areaAcres,
    villageName: row.villageName,
    latitude: row.latitude,
    longitude: row.longitude,
    requiredCategory: row.requiredCategory as EquipmentCategory,
    targetStartAt: row.targetStartAt.toISOString(),
    deadlineAt: row.deadlineAt.toISOString(),
    soilCondition: row.soilCondition,
  };
}

function toBooking(row: typeof bookings.$inferSelect): Booking {
  return {
    id: row.id,
    equipmentId: row.equipmentId,
    plotId: row.plotId,
    farmerId: row.farmerId,
    status: row.status as BookingStatus,
    effectiveStartAt: row.effectiveStartAt.toISOString(),
    fieldStartAt: row.fieldStartAt.toISOString(),
    endAt: row.endAt.toISOString(),
    travelMinutes: row.travelMinutes,
    workMinutes: row.workMinutes,
    transitDistanceKm: row.transitDistanceKm,
    estimatedCostInr: row.estimatedCostInr,
    priorityScore: row.priorityScore,
    sequenceOrder: row.sequenceOrder,
    rescheduleReason: row.rescheduleReason || undefined,
    notes: row.notes || undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDisruption(row: typeof disruptions.$inferSelect): Disruption {
  return {
    id: row.id,
    equipmentId: row.equipmentId || undefined,
    type: row.type as DisruptionType,
    severity: row.severity as DisruptionSeverity,
    title: row.title,
    description: row.description,
    affectedRadiusKm: row.affectedRadiusKm,
    centerLat: row.centerLat,
    centerLng: row.centerLng,
    delayHours: row.delayHours,
    resolved: row.resolved,
    cascadeSummary: Array.isArray(row.cascadeSummary) ? row.cascadeSummary : [],
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : undefined,
  };
}

async function seedInitialData(): Promise<void> {
  const farmerHash = hashPassword('farmer123');
  const ownerHash = hashPassword('owner123');

  for (const u of INITIAL_SEED_STATE.users) {
    await db
      .insert(users)
      .values({
        id: u.id,
        fullName: u.fullName,
        phone: normalizePhone(u.phone),
        passwordHash: u.role === 'OWNER' ? ownerHash : farmerHash,
        role: u.role,
        villageName: u.villageName,
        latitude: u.latitude,
        longitude: u.longitude,
        rating: u.rating,
      })
      .onConflictDoNothing();
  }

  for (const eqItem of INITIAL_SEED_STATE.equipment) {
    await db
      .insert(equipment)
      .values({
        id: eqItem.id,
        ownerId: eqItem.ownerId,
        name: eqItem.name,
        modelCode: eqItem.modelCode,
        category: eqItem.category,
        status: eqItem.status,
        hourlyRateInr: eqItem.hourlyRateInr,
        workRateAcresHr: eqItem.workRateAcresHr,
        transitSpeedKmh: eqItem.transitSpeedKmh,
        horsepower: eqItem.horsepower,
        baseVillage: eqItem.baseVillage,
        latitude: eqItem.latitude,
        longitude: eqItem.longitude,
        imageUrl: eqItem.imageUrl,
      })
      .onConflictDoNothing();
  }

  for (const p of INITIAL_SEED_STATE.plots) {
    await db
      .insert(plots)
      .values({
        id: p.id,
        farmerId: p.farmerId,
        name: p.name,
        cropType: p.cropType,
        areaAcres: p.areaAcres,
        villageName: p.villageName,
        latitude: p.latitude,
        longitude: p.longitude,
        requiredCategory: p.requiredCategory,
        targetStartAt: new Date(p.targetStartAt),
        deadlineAt: new Date(p.deadlineAt),
        soilCondition: p.soilCondition,
      })
      .onConflictDoNothing();
  }

  for (const b of INITIAL_SEED_STATE.bookings) {
    await db
      .insert(bookings)
      .values({
        id: b.id,
        equipmentId: b.equipmentId,
        plotId: b.plotId,
        farmerId: b.farmerId,
        status: b.status,
        effectiveStartAt: new Date(b.effectiveStartAt),
        fieldStartAt: new Date(b.fieldStartAt),
        endAt: new Date(b.endAt),
        travelMinutes: b.travelMinutes,
        workMinutes: b.workMinutes,
        transitDistanceKm: b.transitDistanceKm,
        estimatedCostInr: b.estimatedCostInr,
        priorityScore: b.priorityScore,
        sequenceOrder: b.sequenceOrder,
        rescheduleReason: b.rescheduleReason || null,
        notes: b.notes || null,
        createdAt: new Date(b.createdAt),
      })
      .onConflictDoNothing();
  }

  for (const d of INITIAL_SEED_STATE.disruptions) {
    await db
      .insert(disruptions)
      .values({
        id: d.id,
        equipmentId: d.equipmentId || null,
        type: d.type,
        severity: d.severity,
        title: d.title,
        description: d.description,
        affectedRadiusKm: d.affectedRadiusKm,
        centerLat: d.centerLat,
        centerLng: d.centerLng,
        delayHours: d.delayHours,
        resolved: d.resolved,
        cascadeSummary: d.cascadeSummary,
        createdAt: new Date(d.createdAt),
        resolvedAt: d.resolvedAt ? new Date(d.resolvedAt) : null,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(workspaceMeta)
    .values({
      id: 'default',
      lastOptimizedAt: null,
      lastOptimizationSavedKm: 0,
    })
    .onConflictDoNothing();
}

export async function ensureSeeded(): Promise<void> {
  try {
    const existing = await db
      .select({ id: equipment.id })
      .from(equipment)
      .limit(1);
    if (existing.length === 0) {
      await seedInitialData();
    }
  } catch (error) {
    console.error('Database seed check failed:', error);
    throw new Error('Failed to initialize AgroHub database.', { cause: error });
  }
}

export async function loadWorkspaceState(): Promise<FieldShareState> {
  try {
    await ensureSeeded();
    const [
      userRows,
      equipmentRows,
      plotRows,
      bookingRows,
      disruptionRows,
      metaRows,
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(equipment).orderBy(desc(equipment.createdAt)),
      db.select().from(plots).orderBy(desc(plots.createdAt)),
      db.select().from(bookings).orderBy(desc(bookings.createdAt)),
      db.select().from(disruptions).orderBy(desc(disruptions.createdAt)),
      db.select().from(workspaceMeta).where(eq(workspaceMeta.id, 'default')).limit(1),
    ]);

    const meta = metaRows[0];
    return {
      users: userRows.map(toPublicUser),
      equipment: equipmentRows.map(toEquipment),
      plots: plotRows.map(toPlot),
      bookings: bookingRows.map(toBooking),
      disruptions: disruptionRows.map(toDisruption),
      lastOptimizedAt: meta?.lastOptimizedAt
        ? meta.lastOptimizedAt.toISOString()
        : null,
      lastOptimizationSavedKm: meta?.lastOptimizationSavedKm ?? 0,
    };
  } catch (error) {
    console.error('Database loadWorkspaceState failed:', error);
    throw new Error('Unable to load AgroHub workspace from database.', {
      cause: error,
    });
  }
}

export async function resetWorkspaceDb(): Promise<FieldShareState> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(disruptions);
      await tx.delete(bookings);
      await tx.delete(plots);
      await tx.delete(equipment);
      await tx.delete(workspaceMeta);
    });
    await seedInitialData();
    return await loadWorkspaceState();
  } catch (error) {
    console.error('Database resetWorkspaceDb failed:', error);
    throw new Error('Unable to reset workspace data.', { cause: error });
  }
}

export async function getOrCreateGoogleUser(input: {
  uid: string;
  email: string;
  fullName: string;
  role: 'FARMER' | 'OWNER';
}): Promise<AuthUser> {
  try {
    await ensureSeeded();
    const existingByUidOrEmail = await db
      .select()
      .from(users)
      .where(or(eq(users.uid, input.uid), eq(users.email, input.email)))
      .limit(1);

    if (existingByUidOrEmail.length > 0) {
      const existing = existingByUidOrEmail[0];
      const updated = await db
        .update(users)
        .set({
          uid: input.uid,
          email: input.email,
          fullName: input.fullName || existing.fullName,
          role: input.role,
        })
        .where(eq(users.id, existing.id))
        .returning();
      return toAuthUser(updated[0], 'google');
    }

    const newId = `usr_g_${Date.now().toString(36)}`;
    const inserted = await db
      .insert(users)
      .values({
        id: newId,
        uid: input.uid,
        email: input.email,
        fullName: input.fullName || 'AgroHub User',
        role: input.role,
        villageName: input.role === 'OWNER' ? 'Riverbend Depot' : 'Willow Creek',
        latitude: input.role === 'OWNER' ? 38.545 : 38.56,
        longitude: input.role === 'OWNER' ? -121.74 : -121.746,
        rating: 4.9,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: input.email,
          fullName: input.fullName || 'AgroHub User',
          role: input.role,
        },
      })
      .returning();

    return toAuthUser(inserted[0], 'google');
  } catch (error) {
    console.error('Database getOrCreateGoogleUser failed:', error);
    throw new Error('Unable to save Google account profile.', { cause: error });
  }
}

export async function loginWithPhonePassword(input: {
  phone: string;
  password: string;
  role: 'FARMER' | 'OWNER';
}): Promise<{ user?: AuthUser; error?: string; status?: number }> {
  try {
    await ensureSeeded();
    const normalized = normalizePhone(input.phone);
    if (!normalized) {
      return { error: 'Please enter a valid phone number.', status: 400 };
    }
    const found = await db
      .select()
      .from(users)
      .where(eq(users.phone, normalized))
      .limit(1);

    if (found.length === 0) {
      return {
        error: 'No account found with this phone number.',
        status: 401,
      };
    }

    const row = found[0];
    if (!row.passwordHash || !verifyPassword(input.password, row.passwordHash)) {
      return { error: 'Incorrect phone number or password.', status: 401 };
    }

    if (row.role !== input.role) {
      const registeredLabel = row.role === 'OWNER' ? 'Owner' : 'Farmer';
      return {
        error: `This phone number is registered as a ${registeredLabel}. Switch the account type above to ${registeredLabel}.`,
        status: 403,
      };
    }

    return { user: toAuthUser(row, 'phone') };
  } catch (error) {
    console.error('Database loginWithPhonePassword failed:', error);
    throw new Error('Login failed due to a database error.', { cause: error });
  }
}

export async function registerWithPhonePassword(input: {
  fullName: string;
  phone: string;
  password: string;
  role: 'FARMER' | 'OWNER';
  villageName?: string;
}): Promise<{ user?: AuthUser; error?: string; status?: number }> {
  try {
    await ensureSeeded();
    const normalized = normalizePhone(input.phone);
    if (!normalized || normalized.length < 10) {
      return { error: 'Please enter a valid 10-digit phone number.', status: 400 };
    }
    if (!input.fullName.trim()) {
      return { error: 'Full name is required.', status: 400 };
    }
    if (!input.password || input.password.length < 6) {
      return {
        error: 'Password must be at least 6 characters.',
        status: 400,
      };
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, normalized))
      .limit(1);

    if (existing.length > 0) {
      return {
        error: 'An account with this phone number already exists. Please sign in.',
        status: 409,
      };
    }

    const id = `usr_${input.role.toLowerCase()}_${Date.now().toString(36)}`;
    const inserted = await db
      .insert(users)
      .values({
        id,
        fullName: input.fullName.trim(),
        phone: normalized,
        passwordHash: hashPassword(input.password),
        role: input.role,
        villageName:
          input.villageName?.trim() ||
          (input.role === 'OWNER' ? 'Riverbend Depot' : 'Willow Creek'),
        latitude: input.role === 'OWNER' ? 38.545 : 38.56,
        longitude: input.role === 'OWNER' ? -121.74 : -121.746,
        rating: 4.9,
      })
      .returning();

    return { user: toAuthUser(inserted[0], 'phone') };
  } catch (error) {
    console.error('Database registerWithPhonePassword failed:', error);
    throw new Error('Registration failed due to a database error.', {
      cause: error,
    });
  }
}

export async function addEquipmentRecordDb(input: {
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
}): Promise<{ state: FieldShareState; equipment: Equipment }> {
  try {
    await ensureSeeded();
    const id = `eq_${Date.now().toString(36)}`;
    const inserted = await db
      .insert(equipment)
      .values({
        id,
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
      })
      .returning();

    const state = await loadWorkspaceState();
    return { state, equipment: toEquipment(inserted[0]) };
  } catch (error) {
    console.error('Database addEquipmentRecordDb failed:', error);
    throw new Error('Could not register machinery in database.', { cause: error });
  }
}

export async function addPlotRecordDb(input: {
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
}): Promise<{ state: FieldShareState; plot: Plot }> {
  try {
    await ensureSeeded();
    const id = `plot_${Date.now().toString(36)}`;
    const inserted = await db
      .insert(plots)
      .values({
        id,
        farmerId: input.farmerId || 'usr_farmer_1',
        name: input.name.trim(),
        cropType: input.cropType.trim(),
        areaAcres: Number(input.areaAcres),
        villageName: input.villageName.trim(),
        latitude: Number(input.latitude),
        longitude: Number(input.longitude),
        requiredCategory: input.requiredCategory,
        targetStartAt: new Date(input.targetStartAt),
        deadlineAt: new Date(input.deadlineAt),
        soilCondition: input.soilCondition.trim() || 'Dry Loam',
      })
      .returning();

    const state = await loadWorkspaceState();
    return { state, plot: toPlot(inserted[0]) };
  } catch (error) {
    console.error('Database addPlotRecordDb failed:', error);
    throw new Error('Could not register farm plot in database.', { cause: error });
  }
}

export async function checkBookingAvailabilityDb(input: {
  equipmentId: string;
  plotId: string;
  requestedFieldStartAt: string;
}) {
  const state = await loadWorkspaceState();
  const eqItem = state.equipment.find((e) => e.id === input.equipmentId);
  const plot = state.plots.find((p) => p.id === input.plotId);
  if (!eqItem || !plot) {
    throw new Error('Equipment or plot not found');
  }
  const plotsById = new Map(state.plots.map((p) => [p.id, p]));
  return checkAvailability(
    eqItem,
    plot,
    input.requestedFieldStartAt,
    state.bookings,
    plotsById
  );
}

export async function createBookingRecordDb(input: {
  equipmentId: string;
  plotId: string;
  requestedFieldStartAt: string;
  notes?: string;
  farmerId?: string;
}): Promise<{ state: FieldShareState; booking: Booking }> {
  const state = await loadWorkspaceState();
  const eqItem = state.equipment.find((e) => e.id === input.equipmentId);
  const plot = state.plots.find((p) => p.id === input.plotId);
  if (!eqItem || !plot) {
    throw new Error('Selected equipment or farm plot does not exist.');
  }

  const plotsById = new Map(state.plots.map((p) => [p.id, p]));
  const avail = checkAvailability(
    eqItem,
    plot,
    input.requestedFieldStartAt,
    state.bookings,
    plotsById
  );

  if (!avail.available) {
    throw new Error(avail.reason);
  }

  const priority = computePriorityScore(plot, SEED_REFERENCE_ISO);
  try {
    const inserted = await db
      .insert(bookings)
      .values({
        id: `bk_${Date.now().toString(36)}`,
        equipmentId: eqItem.id,
        plotId: plot.id,
        farmerId: input.farmerId || plot.farmerId,
        status: 'PENDING',
        effectiveStartAt: new Date(avail.estimate.effectiveStartAt),
        fieldStartAt: new Date(avail.estimate.fieldStartAt),
        endAt: new Date(avail.estimate.endAt),
        travelMinutes: avail.estimate.travelMinutes,
        workMinutes: avail.estimate.workMinutes,
        transitDistanceKm: avail.estimate.distanceKm,
        estimatedCostInr: avail.estimate.estimatedCostInr,
        priorityScore: priority.priorityScore,
        sequenceOrder:
          state.bookings.filter((b) => b.equipmentId === eqItem.id).length + 1,
        notes: input.notes?.trim() || null,
      })
      .returning();

    const updatedState = await loadWorkspaceState();
    return { state: updatedState, booking: toBooking(inserted[0]) };
  } catch (error) {
    console.error('Database createBookingRecordDb failed:', error);
    throw new Error('Could not create booking request in database.', {
      cause: error,
    });
  }
}

export async function decideBookingRecordDb(
  bookingId: string,
  decision: 'CONFIRMED' | 'REJECTED'
): Promise<{ state: FieldShareState; booking: Booking; warning?: string }> {
  const state = await loadWorkspaceState();
  const target = state.bookings.find((b) => b.id === bookingId);
  if (!target) {
    throw new Error('Booking request not found.');
  }

  if (decision === 'REJECTED') {
    try {
      const updated = await db
        .update(bookings)
        .set({
          status: 'REJECTED',
          rescheduleReason: 'Declined by machinery owner',
        })
        .where(eq(bookings.id, bookingId))
        .returning();
      const updatedState = await loadWorkspaceState();
      return { state: updatedState, booking: toBooking(updated[0]) };
    } catch (error) {
      console.error('Database reject booking failed:', error);
      throw new Error('Could not decline booking.', { cause: error });
    }
  }

  const eqItem = state.equipment.find((e) => e.id === target.equipmentId);
  const plot = state.plots.find((p) => p.id === target.plotId);
  if (!eqItem || !plot) {
    throw new Error('Associated equipment or plot missing.');
  }

  const plotsById = new Map(state.plots.map((p) => [p.id, p]));
  const avail = checkAvailability(
    eqItem,
    plot,
    target.fieldStartAt,
    state.bookings,
    plotsById,
    target.id
  );

  let warning: string | undefined;
  let updateFields: Partial<typeof bookings.$inferInsert>;

  if (!avail.available && avail.suggestedStartAt) {
    const shifted = calculateBookingWindow(eqItem, plot, avail.suggestedStartAt);
    warning =
      'Adjusted start time to next conflict-free slot to preserve transit buffer.';
    updateFields = {
      status: 'CONFIRMED',
      effectiveStartAt: new Date(shifted.effectiveStartAt),
      fieldStartAt: new Date(shifted.fieldStartAt),
      endAt: new Date(shifted.endAt),
      travelMinutes: shifted.travelMinutes,
      workMinutes: shifted.workMinutes,
      transitDistanceKm: shifted.distanceKm,
      rescheduleReason:
        'Auto-placed in next open slot to avoid travel/work overlap',
    };
  } else if (!avail.available) {
    throw new Error(avail.reason);
  } else {
    updateFields = {
      status: 'CONFIRMED',
      effectiveStartAt: new Date(avail.estimate.effectiveStartAt),
      fieldStartAt: new Date(avail.estimate.fieldStartAt),
      endAt: new Date(avail.estimate.endAt),
      travelMinutes: avail.estimate.travelMinutes,
      workMinutes: avail.estimate.workMinutes,
      transitDistanceKm: avail.estimate.distanceKm,
    };
  }

  try {
    const updated = await db
      .update(bookings)
      .set(updateFields)
      .where(eq(bookings.id, bookingId))
      .returning();
    const updatedState = await loadWorkspaceState();
    return { state: updatedState, booking: toBooking(updated[0]), warning };
  } catch (error) {
    console.error('Database confirm booking failed:', error);
    throw new Error('Could not confirm booking in database.', { cause: error });
  }
}

export async function runScheduleOptimizationDb() {
  const state = await loadWorkspaceState();
  const result = optimizeEquipmentSchedule(
    state.equipment,
    state.bookings,
    state.plots,
    SEED_REFERENCE_ISO
  );

  try {
    await db.transaction(async (tx) => {
      for (const b of result.updatedBookings) {
        await tx
          .update(bookings)
          .set({
            status: b.status,
            effectiveStartAt: new Date(b.effectiveStartAt),
            fieldStartAt: new Date(b.fieldStartAt),
            endAt: new Date(b.endAt),
            travelMinutes: b.travelMinutes,
            workMinutes: b.workMinutes,
            transitDistanceKm: b.transitDistanceKm,
            sequenceOrder: b.sequenceOrder,
            rescheduleReason: b.rescheduleReason || null,
          })
          .where(eq(bookings.id, b.id));
      }

      await tx
        .insert(workspaceMeta)
        .values({
          id: 'default',
          lastOptimizedAt: new Date(),
          lastOptimizationSavedKm: result.distanceSavedKm,
        })
        .onConflictDoUpdate({
          target: workspaceMeta.id,
          set: {
            lastOptimizedAt: new Date(),
            lastOptimizationSavedKm: result.distanceSavedKm,
          },
        });
    });

    const updatedState = await loadWorkspaceState();
    return { state: updatedState, optimization: result };
  } catch (error) {
    console.error('Database runScheduleOptimizationDb failed:', error);
    throw new Error('Could not save optimized schedule.', { cause: error });
  }
}

export async function triggerDisruptionDb(input: {
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
  const state = await loadWorkspaceState();
  const cascade = handleDisruptionCascade({
    ...input,
    equipmentList: state.equipment,
    plots: state.plots,
    bookings: state.bookings,
    nowIso: SEED_REFERENCE_ISO,
  });

  try {
    await db.transaction(async (tx) => {
      for (const eqItem of cascade.updatedEquipment) {
        await tx
          .update(equipment)
          .set({ status: eqItem.status })
          .where(eq(equipment.id, eqItem.id));
      }

      for (const b of cascade.updatedBookings) {
        await tx
          .update(bookings)
          .set({
            equipmentId: b.equipmentId,
            status: b.status,
            effectiveStartAt: new Date(b.effectiveStartAt),
            fieldStartAt: new Date(b.fieldStartAt),
            endAt: new Date(b.endAt),
            travelMinutes: b.travelMinutes,
            workMinutes: b.workMinutes,
            transitDistanceKm: b.transitDistanceKm,
            rescheduleReason: b.rescheduleReason || null,
          })
          .where(eq(bookings.id, b.id));
      }

      const d = cascade.disruption;
      await tx.insert(disruptions).values({
        id: d.id,
        equipmentId: d.equipmentId || null,
        type: d.type,
        severity: d.severity,
        title: d.title,
        description: d.description,
        affectedRadiusKm: d.affectedRadiusKm,
        centerLat: d.centerLat,
        centerLng: d.centerLng,
        delayHours: d.delayHours,
        resolved: d.resolved,
        cascadeSummary: d.cascadeSummary,
        createdAt: new Date(d.createdAt),
        resolvedAt: d.resolvedAt ? new Date(d.resolvedAt) : null,
      });
    });

    const updatedState = await loadWorkspaceState();
    return { state: updatedState, cascade };
  } catch (error) {
    console.error('Database triggerDisruptionDb failed:', error);
    throw new Error('Could not save disruption cascade.', { cause: error });
  }
}

export async function resolveDisruptionDb(
  disruptionId: string
): Promise<FieldShareState> {
  try {
    const rows = await db
      .select()
      .from(disruptions)
      .where(eq(disruptions.id, disruptionId))
      .limit(1);

    if (rows.length === 0) {
      throw new Error('Disruption alert not found.');
    }
    const dis = rows[0];

    await db.transaction(async (tx) => {
      await tx
        .update(disruptions)
        .set({ resolved: true, resolvedAt: new Date() })
        .where(eq(disruptions.id, disruptionId));

      if (dis.equipmentId) {
        await tx
          .update(equipment)
          .set({ status: 'AVAILABLE' })
          .where(eq(equipment.id, dis.equipmentId));
      }
      if (dis.type === 'RAIN') {
        await tx
          .update(equipment)
          .set({ status: 'AVAILABLE' })
          .where(eq(equipment.status, 'WEATHER_HOLD'));
      }
    });

    return await loadWorkspaceState();
  } catch (error) {
    console.error('Database resolveDisruptionDb failed:', error);
    throw new Error('Could not resolve disruption alert.', { cause: error });
  }
}
