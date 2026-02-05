'use client';

import { TimeRange, Driver } from '@/types';

interface ActiveFiltersProps {
  driver: Driver | null;
  date: Date;
  timeRange: TimeRange | null;
  onClearTimeRange: () => void;
}

export default function ActiveFilters({
  driver,
  date,
  timeRange,
  onClearTimeRange,
}: ActiveFiltersProps) {
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const hasActiveFilters = timeRange !== null;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-blue-700 font-medium">Active Filters:</span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Driver filter tag */}
          {driver && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs text-gray-700 border border-gray-200">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {driver.name}
            </span>
          )}

          {/* Date filter tag */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs text-gray-700 border border-gray-200">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(date)}
          </span>

          {/* Time range filter tag */}
          {timeRange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded-full text-xs text-blue-800 border border-blue-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(timeRange.start)} - {formatTime(timeRange.end)}
              <button
                onClick={onClearTimeRange}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                title="Clear time filter"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>

        {/* Clear all button */}
        {timeRange && (
          <button
            onClick={onClearTimeRange}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear time filter
          </button>
        )}
      </div>
    </div>
  );
}
