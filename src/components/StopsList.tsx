'use client';

import { useMemo } from 'react';
import { Stop, Delivery, TimeRange } from '@/types';

interface StopsListProps {
  stops: Stop[];
  deliveries: Delivery[];
  timeRange: TimeRange | null;
  selectedStopId: string | null;
  onStopSelect: (stopId: string | null) => void;
}

export default function StopsList({
  stops,
  deliveries,
  timeRange,
  selectedStopId,
  onStopSelect,
}: StopsListProps) {
  const filteredStops = useMemo(() => {
    if (!timeRange) return stops;
    return stops.filter(
      stop => stop.arrivalTime >= timeRange.start && stop.arrivalTime <= timeRange.end
    );
  }, [stops, timeRange]);

  const getDeliveryForStop = (stopId: string) => {
    return deliveries.find(d => d.stopId === stopId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const stats = useMemo(() => {
    const pickups = filteredStops.filter(s => s.type === 'pickup');
    const delivered = filteredStops.filter(s => s.type === 'delivered');

    return {
      total: filteredStops.length,
      pickups: pickups.length,
      delivered: delivered.length,
    };
  }, [filteredStops]);

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 mb-3">Stops & Jobs</h3>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Total</span>
            <span className="float-right font-medium">{stats.total}</span>
          </div>
          <div className="bg-amber-50 p-2 rounded">
            <span className="text-amber-700">Pickups</span>
            <span className="float-right font-medium text-amber-700">{stats.pickups}</span>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <span className="text-green-700">Delivered</span>
            <span className="float-right font-medium text-green-700">{stats.delivered}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredStops.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No stops in selected time range
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredStops.map((stop, index) => {
              const delivery = getDeliveryForStop(stop.id);
              const isSelected = stop.id === selectedStopId;

              return (
                <li
                  key={stop.id}
                  onClick={() => onStopSelect(stop.id === selectedStopId ? null : stop.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-700">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {delivery ? `Job #${delivery.jobId}` : `Stop ${index + 1}`}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        stop.type === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {stop.type === 'delivered' ? 'Delivered' : 'Pickup'}
                    </span>
                  </div>

                  <div className="mt-1 ml-8 text-xs text-gray-500">
                    {formatTime(stop.arrivalTime)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
