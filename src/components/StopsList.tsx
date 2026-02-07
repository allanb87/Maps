'use client';

import { useMemo } from 'react';
import { Stop, TimeRange } from '@/types';

interface StopsListProps {
  stops: Stop[];
  timeRange: TimeRange | null;
}

export default function StopsList({ stops, timeRange }: StopsListProps) {
  const filteredStops = useMemo(() => {
    if (!timeRange) return stops;
    return stops.filter(
      stop => stop.arrivalTime >= timeRange.start && stop.arrivalTime <= timeRange.end
    );
  }, [stops, timeRange]);

  const pickups = filteredStops.filter(s => s.type === 'pickup').length;
  const delivered = filteredStops.filter(s => s.type === 'delivered').length;

  return (
    <div className="flex gap-3">
      <div className="flex-1 flex flex-col items-center">
        <span className="text-xs font-medium text-amber-700 mb-1">Pickups</span>
        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg py-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-amber-700">{pickups}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-xs font-medium text-green-700 mb-1">Delivered</span>
        <div className="w-full bg-green-50 border border-green-200 rounded-lg py-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-green-700">{delivered}</span>
        </div>
      </div>
    </div>
  );
}
