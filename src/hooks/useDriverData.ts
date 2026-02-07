'use client';

import { useState, useEffect, useCallback } from 'react';
import { Driver, DriverDay, GPSPoint, Stop, Delivery } from '@/types';
import { getSampleDriverDay } from '@/data/sampleData';

// Flag to use sample data when database is not available
const USE_SAMPLE_DATA = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === 'true';

// Sample drivers for fallback
const sampleDrivers: Driver[] = [
  { id: 'driver-001', name: 'Alex Thompson', vehicleId: 'VAN-001' },
  { id: 'driver-002', name: 'Sarah Johnson', vehicleId: 'VAN-002' },
  { id: 'driver-003', name: 'Mike Williams', vehicleId: 'VAN-003' },
];

interface UseDriversResult {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseDriverDayResult {
  driverDay: DriverDay | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Parse dates from API response
function parseDriverDayResponse(data: {
  driverId: string;
  driverName: string;
  date: string;
  gpsTrack: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
  }>;
  stops: Array<{
    id: string;
    lat: number;
    lng: number;
    arrivalTime: string;
    departureTime: string;
    duration: number;
    type: 'delivery' | 'break';
  }>;
  deliveries: Array<{
    id: string;
    stopId: string;
    address: string;
    customerName: string;
    status: 'completed' | 'failed';
    completedAt?: string;
    notes?: string;
  }>;
}): DriverDay {
  return {
    driverId: data.driverId,
    driverName: data.driverName,
    date: new Date(data.date),
    gpsTrack: data.gpsTrack.map(point => ({
      lat: point.lat,
      lng: point.lng,
      timestamp: new Date(point.timestamp),
      speed: point.speed,
    })),
    stops: data.stops.map(stop => ({
      id: stop.id,
      lat: stop.lat,
      lng: stop.lng,
      arrivalTime: new Date(stop.arrivalTime),
      departureTime: new Date(stop.departureTime),
      duration: stop.duration,
      type: stop.type,
    })),
    deliveries: data.deliveries.map(delivery => ({
      id: delivery.id,
      stopId: delivery.stopId,
      address: delivery.address,
      customerName: delivery.customerName,
      status: delivery.status,
      completedAt: delivery.completedAt ? new Date(delivery.completedAt) : undefined,
      notes: delivery.notes,
    })),
  };
}

export function useDrivers(): UseDriversResult {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_SAMPLE_DATA) {
        setDrivers(sampleDrivers);
        return;
      }

      const response = await fetch('/api/drivers');

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const data = await response.json();
      setDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch drivers');
      // Fallback to sample data on error
      setDrivers(sampleDrivers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { drivers, loading, error, refetch: fetchDrivers };
}

export function useDriverDay(driverId: string, date: Date): UseDriverDayResult {
  const [driverDay, setDriverDay] = useState<DriverDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDriverDay = useCallback(async () => {
    if (!driverId) {
      setDriverDay(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (USE_SAMPLE_DATA) {
        // Use sample data
        const data = getSampleDriverDay();
        setDriverDay(data);
        return;
      }

      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/driver-day?driverId=${driverId}&date=${dateStr}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No data found for this driver and date');
        }
        throw new Error('Failed to fetch driver data');
      }

      const data = await response.json();
      setDriverDay(parseDriverDayResponse(data));
    } catch (err) {
      console.error('Error fetching driver day:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch driver data');
      // Fallback to sample data on error
      const data = getSampleDriverDay();
      setDriverDay(data);
    } finally {
      setLoading(false);
    }
  }, [driverId, date]);

  useEffect(() => {
    fetchDriverDay();
  }, [fetchDriverDay]);

  return { driverDay, loading, error, refetch: fetchDriverDay };
}
