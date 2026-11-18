import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone').unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('FARMER'),
  villageName: text('village_name').notNull().default('Willow Creek'),
  latitude: doublePrecision('latitude').notNull().default(38.558),
  longitude: doublePrecision('longitude').notNull().default(-121.744),
  rating: doublePrecision('rating').notNull().default(4.9),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const equipment = pgTable('equipment', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  modelCode: text('model_code').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('AVAILABLE'),
  hourlyRateInr: integer('hourly_rate_inr').notNull(),
  workRateAcresHr: doublePrecision('work_rate_acres_hr').notNull(),
  transitSpeedKmh: doublePrecision('transit_speed_kmh').notNull().default(22),
  horsepower: integer('horsepower').notNull().default(50),
  baseVillage: text('base_village').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const plots = pgTable('plots', {
  id: text('id').primaryKey(),
  farmerId: text('farmer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  cropType: text('crop_type').notNull(),
  areaAcres: doublePrecision('area_acres').notNull(),
  villageName: text('village_name').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  requiredCategory: text('required_category').notNull(),
  targetStartAt: timestamp('target_start_at', { withTimezone: true }).notNull(),
  deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
  soilCondition: text('soil_condition').notNull().default('Dry Loam'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  equipmentId: text('equipment_id')
    .references(() => equipment.id, { onDelete: 'cascade' })
    .notNull(),
  plotId: text('plot_id')
    .references(() => plots.id, { onDelete: 'cascade' })
    .notNull(),
  farmerId: text('farmer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('PENDING'),
  effectiveStartAt: timestamp('effective_start_at', { withTimezone: true }).notNull(),
  fieldStartAt: timestamp('field_start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  travelMinutes: integer('travel_minutes').notNull(),
  workMinutes: integer('work_minutes').notNull(),
  transitDistanceKm: doublePrecision('transit_distance_km').notNull(),
  estimatedCostInr: integer('estimated_cost_inr').notNull(),
  priorityScore: doublePrecision('priority_score').notNull().default(0),
  sequenceOrder: integer('sequence_order').notNull().default(0),
  rescheduleReason: text('reschedule_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const disruptions = pgTable('disruptions', {
  id: text('id').primaryKey(),
  equipmentId: text('equipment_id').references(() => equipment.id, {
    onDelete: 'set null',
  }),
  type: text('type').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  affectedRadiusKm: doublePrecision('affected_radius_km').notNull().default(15),
  centerLat: doublePrecision('center_lat').notNull(),
  centerLng: doublePrecision('center_lng').notNull(),
  delayHours: integer('delay_hours').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  cascadeSummary: jsonb('cascade_summary').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const workspaceMeta = pgTable('workspace_meta', {
  id: text('id').primaryKey(),
  lastOptimizedAt: timestamp('last_optimized_at', { withTimezone: true }),
  lastOptimizationSavedKm: doublePrecision('last_optimization_saved_km')
    .notNull()
    .default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedEquipment: many(equipment),
  plots: many(plots),
  bookings: many(bookings),
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  owner: one(users, { fields: [equipment.ownerId], references: [users.id] }),
  bookings: many(bookings),
  disruptions: many(disruptions),
}));

export const plotsRelations = relations(plots, ({ one, many }) => ({
  farmer: one(users, { fields: [plots.farmerId], references: [users.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  equipment: one(equipment, {
    fields: [bookings.equipmentId],
    references: [equipment.id],
  }),
  plot: one(plots, { fields: [bookings.plotId], references: [plots.id] }),
  farmer: one(users, { fields: [bookings.farmerId], references: [users.id] }),
}));

export const disruptionsRelations = relations(disruptions, ({ one }) => ({
  equipment: one(equipment, {
    fields: [disruptions.equipmentId],
    references: [equipment.id],
  }),
}));
