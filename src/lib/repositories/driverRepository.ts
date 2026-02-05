import { query } from '../db';
import { Driver, GPSPoint, Stop, Delivery, DriverDay } from '@/types';

interface DBDriver {
  id: string;
  name: string;
  vehicle_id: string | null;
  email: string | null;
  phone: string | null;
}

interface DBGPSPoint {
  id: number;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: Date;
}

interface DBStop {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  arrival_time: Date;
  departure_time: Date;
  duration: number;
  stop_type: 'delivery' | 'break' | 'pickup' | 'other';
}

interface DBDelivery {
  id: string;
  stop_id: string;
  address: string;
  customer_name: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  completed_at: Date | null;
  notes: string | null;
}

// Get all drivers
export async function getAllDrivers(): Promise<Driver[]> {
  const rows = await query<DBDriver[]>(
    'SELECT id, name, vehicle_id FROM drivers ORDER BY name'
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    vehicleId: row.vehicle_id || undefined,
  }));
}

// Get a single driver by ID
export async function getDriverById(driverId: string): Promise<Driver | null> {
  const rows = await query<DBDriver[]>(
    'SELECT id, name, vehicle_id FROM drivers WHERE id = ?',
    [driverId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    vehicleId: row.vehicle_id || undefined,
  };
}

// Get GPS track for a driver on a specific date
export async function getGPSTrack(driverId: string, date: Date): Promise<GPSPoint[]> {
  const dateStr = date.toISOString().split('T')[0];

  const rows = await query<DBGPSPoint[]>(
    `SELECT id, driver_id, latitude, longitude, speed, timestamp
     FROM gps_tracks
     WHERE driver_id = ? AND DATE(timestamp) = ?
     ORDER BY timestamp ASC`,
    [driverId, dateStr]
  );

  return rows.map(row => ({
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    timestamp: new Date(row.timestamp),
    speed: row.speed ? Number(row.speed) : undefined,
  }));
}

// Get stops for a driver on a specific date
export async function getStops(driverId: string, date: Date): Promise<Stop[]> {
  const dateStr = date.toISOString().split('T')[0];

  const rows = await query<DBStop[]>(
    `SELECT id, driver_id, latitude, longitude, arrival_time, departure_time, duration, stop_type
     FROM stops
     WHERE driver_id = ? AND DATE(arrival_time) = ?
     ORDER BY arrival_time ASC`,
    [driverId, dateStr]
  );

  return rows.map(row => ({
    id: row.id,
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    arrivalTime: new Date(row.arrival_time),
    departureTime: new Date(row.departure_time),
    duration: row.duration,
    type: row.stop_type === 'break' ? 'break' : 'delivery',
  }));
}

// Get deliveries for a set of stop IDs
export async function getDeliveries(stopIds: string[]): Promise<Delivery[]> {
  if (stopIds.length === 0) return [];

  const placeholders = stopIds.map(() => '?').join(',');
  const rows = await query<DBDelivery[]>(
    `SELECT id, stop_id, address, customer_name, status, completed_at, notes
     FROM deliveries
     WHERE stop_id IN (${placeholders})`,
    stopIds
  );

  return rows.map(row => ({
    id: row.id,
    stopId: row.stop_id,
    address: row.address,
    customerName: row.customer_name || 'Unknown',
    status: row.status as 'completed' | 'failed',
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    notes: row.notes || undefined,
  }));
}

// Get complete driver day data
export async function getDriverDay(driverId: string, date: Date): Promise<DriverDay | null> {
  const driver = await getDriverById(driverId);
  if (!driver) return null;

  const [gpsTrack, stops] = await Promise.all([
    getGPSTrack(driverId, date),
    getStops(driverId, date),
  ]);

  const stopIds = stops.map(s => s.id);
  const deliveries = await getDeliveries(stopIds);

  return {
    driverId: driver.id,
    driverName: driver.name,
    date,
    gpsTrack,
    stops,
    deliveries,
  };
}

// Get available dates for a driver (dates that have GPS data)
export async function getAvailableDates(driverId: string): Promise<Date[]> {
  const rows = await query<{ work_date: Date }[]>(
    `SELECT DISTINCT DATE(timestamp) as work_date
     FROM gps_tracks
     WHERE driver_id = ?
     ORDER BY work_date DESC
     LIMIT 30`,
    [driverId]
  );

  return rows.map(row => new Date(row.work_date));
}
