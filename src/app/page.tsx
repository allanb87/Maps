'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Driver, DriverDay, GPSPoint, Stop, Delivery, TimeRange } from '@/types';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import SearchableSelect from '@/components/SearchableSelect';
import StopsList from '@/components/StopsList';

const DriverMap = dynamic(() => import('@/components/DriverMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

interface GPSRow {
  lat: number;
  lng: number;
  datetime: string;
  speed: number;
}

interface DeliveryRow {
  job_id: number;
  job_datetime: string;
  latitude: number;
  longitude: number;
  status: string;
  [key: string]: unknown;
}

function buildDriverDay(
  driverId: string,
  driverName: string,
  date: Date,
  gpsRows: GPSRow[],
  deliveryRows: DeliveryRow[]
): DriverDay {
  const gpsTrack: GPSPoint[] = gpsRows.map(row => ({
    lat: row.lat,
    lng: row.lng,
    timestamp: new Date(row.datetime),
    speed: row.speed,
  }));

  const stops: Stop[] = [];
  const deliveries: Delivery[] = [];

  deliveryRows.forEach((row, index) => {
    const stopId = `stop-${row.job_id}-${index}`;
    const jobTime = new Date(row.job_datetime);
    const stopType = row.status === 'in transit' ? 'pickup' : 'delivered';

    stops.push({
      id: stopId,
      lat: row.latitude,
      lng: row.longitude,
      arrivalTime: jobTime,
      departureTime: jobTime,
      duration: 0,
      type: stopType,
    });

    // Extract tbl_job fields (everything beyond the known tbl_job_history columns)
    const knownKeys = new Set(['job_id', 'job_datetime', 'latitude', 'longitude', 'status']);
    const jobDetails: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (!knownKeys.has(key) && value !== null && value !== undefined) {
        jobDetails[key] = value;
      }
    }

    deliveries.push({
      id: `delivery-${row.job_id}-${index}`,
      stopId,
      jobId: row.job_id,
      status: stopType,
      completedAt: jobTime,
      jobDetails: Object.keys(jobDetails).length > 0 ? jobDetails : undefined,
    });
  });

  return { driverId, driverName, date, gpsTrack, stops, deliveries };
}

const DEFAULT_DATE = '2020-08-01';

export default function Home() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_DATE);
  const [driverDay, setDriverDay] = useState<DriverDay | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipFilterResetRef = useRef(false);

  const FILTER_STORAGE_KEY = 'driver-history-filters';

  const fetchJson = useCallback(async <T,>(input: RequestInfo | URL): Promise<T> => {
    const res = await fetch(input);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON, got: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }, []);

  // Fetch drivers list on mount
  useEffect(() => {
    fetchJson<Driver[]>('/api/drivers')
      .then((data) => {
        if (Array.isArray(data)) {
          setDrivers(data);
        }
      })
      .catch(err => console.error('Failed to fetch drivers:', err));
  }, [fetchJson]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        driverId?: string;
        date?: string;
        timeRange?: { start: string; end: string } | null;
      };

      skipFilterResetRef.current = true;
      if (parsed.driverId) setSelectedDriverId(String(parsed.driverId));
      if (parsed.date) setSelectedDate(parsed.date);
      if (parsed.timeRange?.start && parsed.timeRange?.end) {
        const start = new Date(parsed.timeRange.start);
        const end = new Date(parsed.timeRange.end);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          setTimeRange({ start, end });
        }
      }
    } catch {
      // Ignore invalid persisted data
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      driverId: selectedDriverId,
      date: selectedDate,
      timeRange: timeRange
        ? { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() }
        : null,
    };
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [selectedDriverId, selectedDate, timeRange]);

  useEffect(() => {
    if (skipFilterResetRef.current) {
      skipFilterResetRef.current = false;
      return;
    }
    setTimeRange(null);
    setSelectedStopId(null);
  }, [selectedDriverId, selectedDate]);
  const fetchDriverData = useCallback(async () => {
    if (!selectedDriverId || !selectedDate) return;

    setLoading(true);
    setError(null);
    setDriverDay(null);
    setSelectedStopId(null);

    try {
      const [gpsData, deliveryData] = await Promise.all([
        fetchJson<GPSRow[]>(
          `/api/drivers/${selectedDriverId}/gps?date=${selectedDate}`
        ),
        fetchJson<DeliveryRow[]>(
          `/api/drivers/${selectedDriverId}/deliveries?date=${selectedDate}`
        ),
      ]);

      const driver = drivers.find(d => String(d.driver_id) === selectedDriverId);
      const driverName = driver?.display_name ?? `Driver ${selectedDriverId}`;

      const data = buildDriverDay(
        selectedDriverId,
        driverName,
        new Date(selectedDate),
        gpsData,
        deliveryData
      );

      setDriverDay(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedDriverId, selectedDate, drivers]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const resetFilters = () => {
    setSelectedDriverId('');
    setSelectedDate(DEFAULT_DATE);
    setTimeRange(null);
    setSelectedStopId(null);
    setDriverDay(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Driver History View</h1>
            {driverDay ? (
              <p className="text-sm text-gray-500">
                {driverDay.driverName} - {formatDate(driverDay.date)}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Select a driver and date to view route</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <SearchableSelect
              options={drivers}
              value={selectedDriverId}
              onChange={setSelectedDriverId}
              getOptionValue={driver => String(driver.driver_id)}
              getOptionLabel={driver => driver.display_name}
              placeholder="Select Driver"
              className="min-w-[200px]"
            />

            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
              suppressHydrationWarning
            />

            <button
              onClick={fetchDriverData}
              disabled={!selectedDriverId || !selectedDate || loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-gray-50 p-4 flex flex-col gap-4 overflow-y-auto">
          {driverDay && (
            <>
              <TimeRangeSelector
                gpsTrack={driverDay.gpsTrack}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
              <div className="flex-1 min-h-0">
                <StopsList
                  stops={driverDay.stops}
                  deliveries={driverDay.deliveries}
                  timeRange={timeRange}
                  selectedStopId={selectedStopId}
                  onStopSelect={setSelectedStopId}
                />
              </div>
            </>
          )}
          {!driverDay && !loading && !error && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select a driver and date, then click Load
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading driver data...
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          {driverDay ? (
            <DriverMap
              gpsTrack={driverDay.gpsTrack}
              stops={driverDay.stops}
              deliveries={driverDay.deliveries}
              timeRange={timeRange}
              selectedStopId={selectedStopId}
              onStopSelect={setSelectedStopId}
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <div className="text-gray-500">
                {loading ? 'Loading map data...' : 'No data loaded'}
              </div>
            </div>
          )}

          {/* Legend */}
          {driverDay && (
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-white text-[8px] font-bold">S</div>
                  <span className="text-gray-600">Start/End</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow"></div>
                  <span className="text-gray-600">Pickup (In Transit)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                  <span className="text-gray-600">Delivered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Route</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
