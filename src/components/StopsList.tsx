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
  // Get all stops sorted by arrival time
  const allStopsSorted = useMemo(() => {
    return [...stops].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime());
  }, [stops]);

  // Filter stops by time range (ascending order)
  const filteredStops = useMemo(() => {
    if (!timeRange) return allStopsSorted;

    return allStopsSorted.filter(
      stop => stop.arrivalTime >= timeRange.start && stop.departureTime <= timeRange.end
    );
  }, [allStopsSorted, timeRange]);

  const getDeliveryForStop = (stopId: string) => {
    return deliveries.find(d => d.stopId === stopId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Stats for all stops (full day)
  const fullDayStats = useMemo(() => {
    const deliveryStops = allStopsSorted.filter(s => s.type === 'delivery');
    const completedDeliveries = deliveryStops.filter(s => {
      const delivery = getDeliveryForStop(s.id);
      return delivery?.status === 'completed';
    });

    return {
      total: allStopsSorted.length,
      completed: completedDeliveries.length,
      deliveries: deliveryStops.length,
    };
  }, [allStopsSorted, deliveries]);

  // Stats for filtered stops
  const filteredStats = useMemo(() => {
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

  const isFiltered = timeRange !== null;

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      <div className="p-4 border-b">
        {/* Header with filter context */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">Stops & Deliveries</h3>
            {isFiltered ? (
              <p className="text-xs text-blue-600">
                Showing {formatTime(timeRange.start)} - {formatTime(timeRange.end)}
              </p>
            ) : (
              <p className="text-xs text-gray-500">All stops for the day</p>
            )}
          </div>
          {isFiltered && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              Filtered
            </span>
          )}
        </div>

        {/* Comparison indicator when filtered */}
        {isFiltered && (
          <div className="bg-blue-50 rounded-lg p-2 mb-3 text-xs">
            <div className="flex justify-between text-blue-800">
              <span>Showing {filteredStats.total} of {fullDayStats.total} stops</span>
              <span>{filteredStats.completed} of {fullDayStats.completed} completed</span>
            </div>
          </div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Total Stops</span>
            <span className="float-right font-medium text-gray-900">{filteredStats.total}</span>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <span className="text-green-700">Completed</span>
            <span className="float-right font-medium text-green-700">{filteredStats.completed}</span>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <span className="text-red-700">Failed</span>
            <span className="float-right font-medium text-red-700">{filteredStats.failed}</span>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <span className="text-blue-700">Breaks</span>
            <span className="float-right font-medium text-blue-700">{filteredStats.breaks}</span>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex">
        <span className="w-8">#</span>
        <span className="flex-1">Location / Customer</span>
        <span className="w-16 text-right">Time</span>
        <span className="w-16 text-right">Status</span>
      </div>

      {/* Stops list */}
      <div className="flex-1 overflow-y-auto">
        {filteredStops.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No stops in selected time range</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting the time filter</p>
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
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        stop.type === 'break'
                          ? 'bg-blue-100 text-blue-700'
                          : delivery?.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
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
                    <span className="font-medium">
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

      {/* Footer with summary */}
      {filteredStops.length > 0 && (
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>
              {filteredStops[0] && filteredStops[filteredStops.length - 1] && (
                <>First stop: {formatTime(filteredStops[0].arrivalTime)} | Last stop: {formatTime(filteredStops[filteredStops.length - 1].departureTime)}</>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
