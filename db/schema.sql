-- AgroHub Production PostgreSQL + PostGIS DDL Schema
-- Supports GIST spatial indexing, temporal overlap constraints, and priority dispatch queries.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('FARMER', 'OWNER', 'DISPATCHER');
CREATE TYPE equipment_category AS ENUM ('TRACTOR', 'HARVESTER', 'PLANTER', 'SPRAYER', 'TILLER');
CREATE TYPE equipment_status AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'WEATHER_HOLD');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED', 'COMPLETED', 'REJECTED', 'CANCELLED');
CREATE TYPE disruption_type AS ENUM ('RAIN', 'BREAKDOWN', 'ROAD_CLOSURE');
CREATE TYPE disruption_severity AS ENUM ('LOW', 'MODERATE', 'CRITICAL');

CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL UNIQUE,
  email        TEXT UNIQUE,
  role         user_role NOT NULL DEFAULT 'FARMER',
  village_name TEXT NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  location     GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  rating       NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating BETWEEN 1.00 AND 5.00),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_location_gist ON users USING GIST (location);

CREATE TABLE equipment (
  id                 TEXT PRIMARY KEY,
  owner_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  model_code         TEXT NOT NULL,
  category           equipment_category NOT NULL,
  status             equipment_status NOT NULL DEFAULT 'AVAILABLE',
  hourly_rate_inr    NUMERIC(10, 2) NOT NULL CHECK (hourly_rate_inr > 0),
  work_rate_acres_hr NUMERIC(6, 2) NOT NULL CHECK (work_rate_acres_hr > 0),
  transit_speed_kmh  NUMERIC(5, 2) NOT NULL DEFAULT 22.00 CHECK (transit_speed_kmh > 0),
  horsepower         INTEGER NOT NULL CHECK (horsepower > 0),
  base_village       TEXT NOT NULL,
  latitude           DOUBLE PRECISION NOT NULL,
  longitude          DOUBLE PRECISION NOT NULL,
  location           GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  image_url          TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_owner ON equipment (owner_id);
CREATE INDEX idx_equipment_category_status ON equipment (category, status);
CREATE INDEX idx_equipment_location_gist ON equipment USING GIST (location);

CREATE TABLE plots (
  id                TEXT PRIMARY KEY,
  farmer_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  crop_type         TEXT NOT NULL,
  area_acres        NUMERIC(8, 2) NOT NULL CHECK (area_acres > 0),
  village_name      TEXT NOT NULL,
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  location          GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  required_category equipment_category NOT NULL,
  target_start_at   TIMESTAMPTZ NOT NULL,
  deadline_at       TIMESTAMPTZ NOT NULL CHECK (deadline_at > target_start_at),
  soil_condition    TEXT NOT NULL DEFAULT 'Dry Loam',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plots_farmer ON plots (farmer_id);
CREATE INDEX idx_plots_deadline ON plots (deadline_at ASC);
CREATE INDEX idx_plots_location_gist ON plots USING GIST (location);

CREATE TABLE bookings (
  id                  TEXT PRIMARY KEY,
  equipment_id        TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  plot_id             TEXT NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  farmer_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              booking_status NOT NULL DEFAULT 'PENDING',
  effective_start_at  TIMESTAMPTZ NOT NULL,
  field_start_at      TIMESTAMPTZ NOT NULL,
  end_at              TIMESTAMPTZ NOT NULL,
  travel_minutes      INTEGER NOT NULL CHECK (travel_minutes >= 0),
  work_minutes        INTEGER NOT NULL CHECK (work_minutes > 0),
  transit_distance_km NUMERIC(8, 2) NOT NULL CHECK (transit_distance_km >= 0),
  estimated_cost_inr  NUMERIC(12, 2) NOT NULL CHECK (estimated_cost_inr >= 0),
  priority_score      NUMERIC(8, 2) NOT NULL DEFAULT 0,
  sequence_order      INTEGER NOT NULL DEFAULT 0,
  reschedule_reason   TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (field_start_at >= effective_start_at AND end_at > field_start_at),
  CONSTRAINT no_overlapping_active_bookings EXCLUDE USING GIST (
    equipment_id WITH =,
    tstzrange(effective_start_at, end_at) WITH &&
  ) WHERE (status IN ('CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'))
);

CREATE INDEX idx_bookings_equipment_window ON bookings (equipment_id, effective_start_at, end_at);
CREATE INDEX idx_bookings_status_priority ON bookings (status, priority_score DESC);

CREATE TABLE disruptions (
  id                 TEXT PRIMARY KEY,
  equipment_id       TEXT REFERENCES equipment(id) ON DELETE SET NULL,
  type               disruption_type NOT NULL,
  severity           disruption_severity NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  affected_radius_km NUMERIC(6, 2) NOT NULL DEFAULT 15.0,
  center_lat         DOUBLE PRECISION NOT NULL,
  center_lng         DOUBLE PRECISION NOT NULL,
  location           GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
  ) STORED,
  delay_hours        INTEGER NOT NULL CHECK (delay_hours > 0),
  resolved           BOOLEAN NOT NULL DEFAULT FALSE,
  cascade_summary    TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at        TIMESTAMPTZ
);

CREATE INDEX idx_disruptions_active ON disruptions (resolved, created_at DESC);
CREATE INDEX idx_disruptions_location_gist ON disruptions USING GIST (location);
