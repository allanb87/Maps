'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedJobs, setCollapsedJobs] = useState<Record<string, boolean>>({});
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

  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const jobDetailKeys = useMemo(
    () => [
      'master_account_name',
      'pickup_location_name',
      'delivery_location_name',
      'service_name',
      'order_eta',
    ],
    []
  );

  const stats = useMemo(() => {
    const pickups = filteredStops.filter(s => s.type === 'pickup');
    const delivered = filteredStops.filter(s => s.type === 'delivered');

    return {
      pickups: pickups.length,
      delivered: delivered.length,
    };
  }, [filteredStops]);

  useEffect(() => {
    if (selectedStopId && !filteredStops.some(stop => stop.id === selectedStopId)) {
      onStopSelect(null);
    }
  }, [filteredStops, onStopSelect, selectedStopId]);

  const toggleJobCollapsed = (stopId: string) => {
    setCollapsedJobs((prev) => ({ ...prev, [stopId]: !prev[stopId] }));
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Job List</h3>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="px-2 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-100"
            aria-expanded={!isCollapsed}
            aria-controls="stops-jobs-content"
            aria-label={isCollapsed ? 'Expand stops list' : 'Collapse stops list'}
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-amber-50 p-2 rounded flex items-center justify-between">
              <span className="text-amber-700">Pickups</span>
              <span className="font-medium text-amber-700">{stats.pickups}</span>
            </div>
            <div className="bg-green-50 p-2 rounded flex items-center justify-between">
              <span className="text-green-700">Deliveries</span>
              <span className="font-medium text-green-700">{stats.delivered}</span>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div id="stops-jobs-content" className="flex-1 overflow-y-auto">
          {filteredStops.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No stops in selected time range
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredStops.map((stop, index) => {
                const delivery = getDeliveryForStop(stop.id);
                const isSelected = stop.id === selectedStopId;
                const isJobCollapsed = collapsedJobs[stop.id] ?? false;
                const isDelivery = stop.type === 'delivered';
                const jobLabel = delivery ? `Job #${delivery.jobId}` : `Stop ${index + 1}`;

                return (
                  <li
                    key={stop.id}
                    className={`p-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-pointer hover:shadow transition-shadow"
                      onClick={() => onStopSelect(stop.id === selectedStopId ? null : stop.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isDelivery ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}
                            aria-label={isDelivery ? 'Delivery' : 'Pickup'}
                          >
                            {isDelivery ? 'D' : 'P'}
                          </span>
                          <div className="font-medium text-gray-900 text-sm">{jobLabel}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isDelivery ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isDelivery ? 'Delivered' : 'Pickup'}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleJobCollapsed(stop.id);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                            aria-expanded={!isJobCollapsed}
                            aria-label={isJobCollapsed ? 'Expand job card' : 'Collapse job card'}
                          >
                            {isJobCollapsed ? 'Expand' : 'Collapse'}
                          </button>
                        </div>
                      </div>

                      {!isJobCollapsed && (
                        <>
                          {delivery?.jobDetails && (
                            <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                              {jobDetailKeys
                                .map((key) => [key, delivery.jobDetails?.[key]] as const)
                                .filter(([, value]) => value !== null && value !== undefined)
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-gray-400">{formatFieldName(key)}:</span>{' '}
                                    {String(value)}
                                  </div>
                                ))}
                            </div>
                          )}

                          <div className="mt-2 text-xs text-gray-500">
                            {formatTime(stop.arrivalTime)}
                            {isSelected && (
                              <span className="ml-2 text-gray-400">Map point #{index + 1}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
