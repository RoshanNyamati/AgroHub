import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  addEquipmentRecordDb,
  addPlotRecordDb,
  checkBookingAvailabilityDb,
  createBookingRecordDb,
  decideBookingRecordDb,
  getOrCreateGoogleUser,
  loadWorkspaceState,
  loginWithPhonePassword,
  registerWithPhonePassword,
  resetWorkspaceDb,
  resolveDisruptionDb,
  runScheduleOptimizationDb,
  triggerDisruptionDb,
} from './src/db/repository.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  type AuthRequest,
  requireAuth,
  resolveAuthUser,
} from './src/middleware/auth.ts';
import { clearSessionCookie, setSessionCookie } from './src/server/auth.ts';
import type {
  DisruptionSeverity,
  DisruptionType,
  EquipmentCategory,
} from './src/types/fieldshare.ts';

async function startServer() {
  const app = express();
  const port = 3000;

  app.set('trust proxy', 1);
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/auth/session', async (req, res) => {
    try {
      const user = await resolveAuthUser(req);
      res.json({ user: user || null });
    } catch (error) {
      console.error('Session check error:', error);
      res.json({ user: null });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phone, password, role } = req.body ?? {};
      const selectedRole = role === 'OWNER' ? 'OWNER' : 'FARMER';
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ error: 'Phone number is required.' });
      }
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required.' });
      }

      const result = await loginWithPhonePassword({
        phone,
        password,
        role: selectedRole,
      });

      if (!result.user) {
        return res
          .status(result.status || 401)
          .json({ error: result.error || 'Invalid credentials.' });
      }

      const token = setSessionCookie(res, result.user, req);
      res.json({ user: result.user, token });
    } catch (error) {
      console.error('Phone login failed:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unable to sign in right now.',
      });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { fullName, phone, password, role, villageName } = req.body ?? {};
      const selectedRole = role === 'OWNER' ? 'OWNER' : 'FARMER';
      const result = await registerWithPhonePassword({
        fullName: typeof fullName === 'string' ? fullName : '',
        phone: typeof phone === 'string' ? phone : '',
        password: typeof password === 'string' ? password : '',
        role: selectedRole,
        villageName: typeof villageName === 'string' ? villageName : undefined,
      });

      if (!result.user) {
        return res
          .status(result.status || 400)
          .json({ error: result.error || 'Could not create account.' });
      }

      const token = setSessionCookie(res, result.user, req);
      res.status(201).json({ user: result.user, token });
    } catch (error) {
      console.error('Phone registration failed:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create account right now.',
      });
    }
  });

  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken, role } = req.body ?? {};
      if (!idToken || typeof idToken !== 'string') {
        return res.status(400).json({ error: 'Google ID token is required.' });
      }
      const selectedRole = role === 'OWNER' ? 'OWNER' : 'FARMER';
      const decoded = await adminAuth.verifyIdToken(idToken);
      const user = await getOrCreateGoogleUser({
        uid: decoded.uid,
        email: decoded.email || `${decoded.uid}@users.agrohub.local`,
        fullName: decoded.name || decoded.email?.split('@')[0] || 'AgroHub User',
        role: selectedRole,
      });
      const token = setSessionCookie(res, user, req);
      res.json({ user, token });
    } catch (error) {
      console.error('Google sign-in verification failed:', error);
      res.status(401).json({
        error: 'Unable to verify Google sign-in. Please try again.',
      });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(res, req);
    res.json({ ok: true });
  });

  app.get('/api/state', requireAuth, async (_req, res) => {
    try {
      const state = await loadWorkspaceState();
      res.json(state);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to load AgroHub state',
      });
    }
  });

  app.post('/api/equipment', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        name,
        modelCode,
        category,
        hourlyRateInr,
        workRateAcresHr,
        transitSpeedKmh,
        horsepower,
        baseVillage,
        latitude,
        longitude,
      } = req.body ?? {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Machinery name is required.' });
      }
      if (!baseVillage || typeof baseVillage !== 'string' || !baseVillage.trim()) {
        return res.status(400).json({ error: 'Base village or depot is required.' });
      }
      const rate = Number(hourlyRateInr);
      const workRate = Number(workRateAcresHr);
      if (!Number.isFinite(rate) || rate <= 0) {
        return res.status(400).json({ error: 'Hourly rate must be greater than 0.' });
      }
      if (!Number.isFinite(workRate) || workRate <= 0) {
        return res
          .status(400)
          .json({ error: 'Work rate (acres/hr) must be greater than 0.' });
      }

      const result = await addEquipmentRecordDb({
        name,
        modelCode: modelCode || 'AG-UNIT',
        category: (category || 'TRACTOR') as EquipmentCategory,
        hourlyRateInr: rate,
        workRateAcresHr: workRate,
        transitSpeedKmh: Number(transitSpeedKmh || 22),
        horsepower: Number(horsepower || 50),
        baseVillage,
        latitude: Number(latitude ?? 38.565),
        longitude: Number(longitude ?? -121.755),
        ownerId:
          req.authUser?.role === 'OWNER' ? req.authUser.id : undefined,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : 'Could not register machinery.',
      });
    }
  });

  app.post('/api/plots', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        name,
        cropType,
        areaAcres,
        villageName,
        latitude,
        longitude,
        requiredCategory,
        targetStartAt,
        deadlineAt,
        soilCondition,
      } = req.body ?? {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Plot name is required.' });
      }
      if (!cropType || typeof cropType !== 'string' || !cropType.trim()) {
        return res.status(400).json({ error: 'Crop type is required.' });
      }
      const acres = Number(areaAcres);
      if (!Number.isFinite(acres) || acres <= 0) {
        return res
          .status(400)
          .json({ error: 'Plot acreage must be greater than 0.' });
      }
      if (!targetStartAt || !deadlineAt) {
        return res
          .status(400)
          .json({ error: 'Target date and deadline are required.' });
      }
      if (new Date(deadlineAt).getTime() <= new Date(targetStartAt).getTime()) {
        return res
          .status(400)
          .json({ error: 'Deadline must be after the target start time.' });
      }

      const result = await addPlotRecordDb({
        name,
        cropType,
        areaAcres: acres,
        villageName: villageName || 'Willow Creek',
        latitude: Number(latitude ?? 38.572),
        longitude: Number(longitude ?? -121.768),
        requiredCategory: (requiredCategory || 'TRACTOR') as EquipmentCategory,
        targetStartAt,
        deadlineAt,
        soilCondition: soilCondition || 'Dry Loam',
        farmerId:
          req.authUser?.role === 'FARMER' ? req.authUser.id : undefined,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : 'Could not register farm plot.',
      });
    }
  });

  app.post('/api/bookings/check', requireAuth, async (req, res) => {
    try {
      const { equipmentId, plotId, requestedFieldStartAt } = req.body ?? {};
      if (!equipmentId || !plotId || !requestedFieldStartAt) {
        return res.status(400).json({
          error: 'Equipment, plot, and requested time are required.',
        });
      }
      const result = await checkBookingAvailabilityDb({
        equipmentId,
        plotId,
        requestedFieldStartAt,
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : 'Availability check failed.',
      });
    }
  });

  app.post('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { equipmentId, plotId, requestedFieldStartAt, notes } = req.body ?? {};
      if (!equipmentId || !plotId || !requestedFieldStartAt) {
        return res
          .status(400)
          .json({ error: 'Equipment, plot, and start time are required.' });
      }
      const result = await createBookingRecordDb({
        equipmentId,
        plotId,
        requestedFieldStartAt,
        notes,
        farmerId:
          req.authUser?.role === 'FARMER' ? req.authUser.id : undefined,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(409).json({
        error:
          error instanceof Error ? error.message : 'Booking conflict detected.',
      });
    }
  });

  app.patch('/api/bookings/:id/decision', requireAuth, async (req, res) => {
    try {
      const { decision } = req.body ?? {};
      if (decision !== 'CONFIRMED' && decision !== 'REJECTED') {
        return res
          .status(400)
          .json({ error: 'Decision must be CONFIRMED or REJECTED.' });
      }
      const result = await decideBookingRecordDb(req.params.id, decision);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update booking decision.',
      });
    }
  });

  app.post('/api/schedule/optimize', requireAuth, async (_req, res) => {
    try {
      const result = await runScheduleOptimizationDb();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Schedule optimization failed.',
      });
    }
  });

  app.post('/api/disruptions', requireAuth, async (req, res) => {
    try {
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
      } = req.body ?? {};

      if (!type || !title) {
        return res
          .status(400)
          .json({ error: 'Disruption type and title are required.' });
      }

      const result = await triggerDisruptionDb({
        type: type as DisruptionType,
        severity: (severity || 'CRITICAL') as DisruptionSeverity,
        title,
        description: description || 'Field disruption reported by operator.',
        equipmentId: equipmentId || undefined,
        centerLat: Number(centerLat ?? 38.575),
        centerLng: Number(centerLng ?? -121.765),
        affectedRadiusKm: Number(affectedRadiusKm ?? 15),
        delayHours: Math.max(1, Number(delayHours ?? 4)),
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : 'Could not process disruption.',
      });
    }
  });

  app.post('/api/disruptions/:id/resolve', requireAuth, async (req, res) => {
    try {
      const state = await resolveDisruptionDb(req.params.id);
      res.json({ state });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : 'Could not resolve disruption.',
      });
    }
  });

  app.post('/api/reset', requireAuth, async (_req, res) => {
    try {
      const state = await resetWorkspaceDb();
      res.json({ state });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Reset failed.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AgroHub server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
