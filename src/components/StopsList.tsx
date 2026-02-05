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
  // Filter and sort stops by arrival time (ascending order)
  const filteredStops = useMemo(() => {
    let result = [...stops];

    // Filter by time range if specified
    if (timeRange) {
      result = result.filter(
        stop => stop.arrivalTime >= timeRange.start && stop.departureTime <= timeRange.end
      );
    }

    // Sort by arrival time in ascending order
    result.sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime());

    return result;
  }, [stops, timeRange]);

  const getDeliveryForStop = (stopId: string) => {
    return deliveries.find(d => d.stopId === stopId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const stats = useMemo(() => {
    const deliveryStops = filteredStops.filter(s => s.type === 'delivery');
    const completedDeliveries = deliveryStops.filter(s => {
      const delivery = getDeliveryForStop(s.id);
      return delivery?.status === 'completed';
    });
    const failedDeliveries = deliveryStops.filter(s => {
      const delivery = getDeliveryForStop(s.id);
      return delivery?.status === 'failed';
    });

    return {
      total: filteredStops.length,
      deliveries: deliveryStops.length,
      completed: completedDeliveries.length,
      failed: failedDeliveries.length,
      breaks: filteredStops.filter(s => s.type === 'break').length,
    };
  }, [filteredStops, deliveries]);

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 mb-3">Stops & Deliveries</h3>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Total Stops</span>
            <span className="float-right font-medium">{stats.total}</span>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <span className="text-green-700">Completed</span>
            <span className="float-right font-medium text-green-700">{stats.completed}</span>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <span className="text-red-700">Failed</span>
            <span className="float-right font-medium text-red-700">{stats.failed}</span>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <span className="text-blue-700">Breaks</span>
            <span className="float-right font-medium text-blue-700">{stats.breaks}</span>
          </div>
        </div>
      </div>

      {/* Stops list */}
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
                        {stop.type === 'delivery' && delivery ? (
                          <>
                            <div className="font-medium text-gray-900 text-sm">
                              {delivery.address}
                            </div>
                            <div className="text-xs text-gray-500">
                              {delivery.customerName}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium text-blue-600 text-sm">
                            Break
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    {stop.type === 'delivery' && delivery && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          delivery.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {delivery.status}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 ml-8 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {formatTime(stop.arrivalTime)} - {formatTime(stop.departureTime)}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>{stop.duration} min</span>
                  </div>

                  {delivery?.notes && (
                    <div className="mt-1 ml-8 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded inline-block">
                      {delivery.notes}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
