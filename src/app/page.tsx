'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DriverDay, TimeRange } from '@/types';
import { getSampleDriverDay } from '@/data/sampleData';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import StopsList from '@/components/StopsList';

// Dynamic import for map component (Leaflet requires window object)
const DriverMap = dynamic(() => import('@/components/DriverMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const [driverDay, setDriverDay] = useState<DriverDay | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  useEffect(() => {
    // Load sample data
    const data = getSampleDriverDay();
    setDriverDay(data);
  }, []);

  if (!driverDay) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading driver data...</div>
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
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Distance</div>
              <div className="font-semibold text-gray-900">42.3 km</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Active Time</div>
              <div className="font-semibold text-gray-900">6h 24m</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-gray-50 p-4 flex flex-col gap-4 overflow-y-auto">
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Route</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
