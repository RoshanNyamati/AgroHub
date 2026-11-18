export type UserRole = 'FARMER' | 'OWNER' | 'DISPATCHER';

export type EquipmentCategory =
  | 'TRACTOR'
  | 'HARVESTER'
  | 'PLANTER'
  | 'SPRAYER'
  | 'TILLER';

export type EquipmentStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'WEATHER_HOLD';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type DisruptionType = 'RAIN' | 'BREAKDOWN' | 'ROAD_CLOSURE';

export type DisruptionSeverity = 'LOW' | 'MODERATE' | 'CRITICAL';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  villageName: string;
  latitude: number;
  longitude: number;
  rating: number;
}

export interface Equipment {
  id: string;
  ownerId: string;
  name: string;
  modelCode: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  hourlyRateInr: number;
  workRateAcresHr: number;
  transitSpeedKmh: number;
  horsepower: number;
  baseVillage: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

export interface Plot {
  id: string;
  farmerId: string;
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
}

export interface Booking {
  id: string;
  equipmentId: string;
  plotId: string;
  farmerId: string;
  status: BookingStatus;
  effectiveStartAt: string;
  fieldStartAt: string;
  endAt: string;
  travelMinutes: number;
  workMinutes: number;
  transitDistanceKm: number;
  estimatedCostInr: number;
  priorityScore: number;
  sequenceOrder: number;
  rescheduleReason?: string;
  notes?: string;
  createdAt: string;
}

export interface Disruption {
  id: string;
  equipmentId?: string;
  type: DisruptionType;
  severity: DisruptionSeverity;
  title: string;
  description: string;
  affectedRadiusKm: number;
  centerLat: number;
  centerLng: number;
  delayHours: number;
  resolved: boolean;
  cascadeSummary: string[];
  createdAt: string;
  resolvedAt?: string;
}

export interface FieldShareState {
  users: User[];
  equipment: Equipment[];
  plots: Plot[];
  bookings: Booking[];
  disruptions: Disruption[];
  lastOptimizedAt: string | null;
  lastOptimizationSavedKm: number;
}

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: 'FARMER' | 'OWNER';
  villageName: string;
  authProvider: 'phone' | 'google';
}

