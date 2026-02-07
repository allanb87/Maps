'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DriverDay, TimeRange, Driver } from '@/types';
import { getSampleDriverDay } from '@/data/sampleData';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import StopsList from '@/components/StopsList';
import DriverSelector from '@/components/DriverSelector';
import DateSelector from '@/components/DateSelector';
import ActiveFilters from '@/components/ActiveFilters';

// Dynamic import for map component (Leaflet requires window object)
const DriverMap = dynamic(() => import('@/components/DriverMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

// Sample drivers for demo (will be replaced with database data)
const sampleDrivers: Driver[] = [
  { id: 'driver-001', name: 'Alex Thompson', vehicleId: 'VAN-001' },
  { id: 'driver-002', name: 'Sarah Johnson', vehicleId: 'VAN-002' },
  { id: 'driver-003', name: 'Mike Williams', vehicleId: 'VAN-003' },
];

export default function Home() {
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('driver-001');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    // Load sample data (will be replaced with API call to database)
    const data = getSampleDriverDay();
    setDriverDay(data);
  }, []);

  // Handle driver change (placeholder for database integration)
  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    setTimeRange(null); // Reset time filter when driver changes
    // TODO: Fetch driver data from database
    // const data = await fetchDriverDay(driverId, selectedDate);
    // setDriverDay(data);
  };

  // Handle date change (placeholder for database integration)
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setTimeRange(null); // Reset time range when date changes
    // TODO: Fetch driver data from database
    // const data = await fetchDriverDay(selectedDriverId, date);
    // setDriverDay(data);
  };

  // Clear time range filter
  const handleClearTimeRange = () => {
    setTimeRange(null);
  };

  // Get selected driver object
  const selectedDriver = sampleDrivers.find(d => d.id === selectedDriverId) || null;

  // Calculate average speed
  const averageSpeed = useMemo(() => {
    if (!driverDay?.gpsTrack?.length) return 0;
    const speeds = driverDay.gpsTrack
      .filter(p => (p.speed ?? 0) > 0)
      .map(p => p.speed ?? 0);
    if (speeds.length === 0) return 0;
    return speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
  }, [driverDay?.gpsTrack]);

  // Calculate total distance (rough estimate based on GPS points)
  const totalDistance = useMemo(() => {
    if (!driverDay?.gpsTrack?.length) return 0;
    let distance = 0;
    for (let i = 1; i < driverDay.gpsTrack.length; i++) {
      const prev = driverDay.gpsTrack[i - 1];
      const curr = driverDay.gpsTrack[i];
      // Haversine formula (simplified)
      const R = 6371; // Earth's radius in km
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLon = (curr.lng - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance += R * c;
    }
    return distance;
  }, [driverDay?.gpsTrack]);

  // Calculate active time
  const activeTime = useMemo(() => {
    if (!driverDay?.gpsTrack?.length) return { hours: 0, minutes: 0 };
    const first = driverDay.gpsTrack[0].timestamp;
    const last = driverDay.gpsTrack[driverDay.gpsTrack.length - 1].timestamp;
    const diffMs = last.getTime() - first.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }, [driverDay?.gpsTrack]);

  if (!driverDay) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No data available</div>
          <p className="text-sm text-gray-400">Select a different driver or date</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Driver History View</h1>
            <p className="text-sm text-gray-500">
              {driverDay.driverName} - {formatDate(driverDay.date)}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-500">Avg Speed</div>
              <div className="font-semibold text-gray-900">{averageSpeed.toFixed(1)} km/h</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Distance</div>
              <div className="font-semibold text-gray-900">{totalDistance.toFixed(1)} km</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Active Time</div>
              <div className="font-semibold text-gray-900">{activeTime.hours}h {activeTime.minutes}m</div>
            </div>
          </div>
        </div>
      </header>

      {/* Active filters bar */}
      <ActiveFilters
        driver={selectedDriver}
        date={selectedDate}
        timeRange={timeRange}
        onClearTimeRange={handleClearTimeRange}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-gray-50 p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Driver and Date Selectors */}
          <div className="grid grid-cols-1 gap-3">
            <DriverSelector
              drivers={sampleDrivers}
              selectedDriverId={selectedDriverId}
              onDriverChange={handleDriverChange}
            />
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              maxDate={new Date()}
            />
          </div>

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
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <DriverMap
            gpsTrack={driverDay.gpsTrack}
            stops={driverDay.stops}
            deliveries={driverDay.deliveries}
            timeRange={timeRange}
            selectedStopId={selectedStopId}
            onStopSelect={setSelectedStopId}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-white text-[8px] font-bold">S</div>
                <span className="text-gray-600">Start/End</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                <span className="text-gray-600">Completed Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
                <span className="text-gray-600">Failed Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                <span className="text-gray-600">Break</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-1">Route Speed</div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-full rounded" style={{ background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route info overlay when filtered */}
          {timeRange && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-700">Filtered View</span>
              </div>
              <p className="text-xs text-gray-600">
                Showing route segment from{' '}
                <span className="font-medium">{timeRange.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                {' '}to{' '}
                <span className="font-medium">{timeRange.end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
