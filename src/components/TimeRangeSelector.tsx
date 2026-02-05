'use client';

import { useState, useEffect, useMemo } from 'react';
import { GPSPoint, TimeRange } from '@/types';

interface TimeRangeSelectorProps {
  gpsTrack: GPSPoint[];
  timeRange: TimeRange | null;
  onTimeRangeChange: (range: TimeRange | null) => void;
}

export default function TimeRangeSelector({
  gpsTrack,
  timeRange,
  onTimeRangeChange,
}: TimeRangeSelectorProps) {
  const { minTime, maxTime } = useMemo(() => {
    if (gpsTrack.length === 0) {
      const now = new Date();
      return { minTime: now, maxTime: now };
    }
    const times = gpsTrack.map(p => p.timestamp.getTime());
    return {
      minTime: new Date(Math.min(...times)),
      maxTime: new Date(Math.max(...times)),
    };
  }, [gpsTrack]);

  const totalMinutes = Math.floor((maxTime.getTime() - minTime.getTime()) / 60000);

  // Pending values (what user is adjusting)
  const [pendingStartMinutes, setPendingStartMinutes] = useState(0);
  const [pendingEndMinutes, setPendingEndMinutes] = useState(totalMinutes);

  // Track if user has made changes that need to be applied
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

  useEffect(() => {
    setPendingEndMinutes(totalMinutes);
  }, [totalMinutes]);

  // Sync pending values when applied filter changes externally
  useEffect(() => {
    if (timeRange) {
      const startMin = Math.floor((timeRange.start.getTime() - minTime.getTime()) / 60000);
      const endMin = Math.floor((timeRange.end.getTime() - minTime.getTime()) / 60000);
      setPendingStartMinutes(startMin);
      setPendingEndMinutes(endMin);
    }
  }, [timeRange, minTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const minutesToTime = (minutes: number) => {
    return new Date(minTime.getTime() + minutes * 60000);
  };

  const handleStartChange = (value: number) => {
    const newStart = Math.min(value, pendingEndMinutes - 1);
    setPendingStartMinutes(newStart);
    setHasUnappliedChanges(true);
  };

  const handleEndChange = (value: number) => {
    const newEnd = Math.max(value, pendingStartMinutes + 1);
    setPendingEndMinutes(newEnd);
    setHasUnappliedChanges(true);
  };

  const applyFilter = () => {
    onTimeRangeChange({
      start: minutesToTime(pendingStartMinutes),
      end: minutesToTime(pendingEndMinutes),
    });
    setHasUnappliedChanges(false);
  };

  const clearFilter = () => {
    onTimeRangeChange(null);
    setPendingStartMinutes(0);
    setPendingEndMinutes(totalMinutes);
    setHasUnappliedChanges(false);
  };

  const quickSelectMorning = () => {
    const morningEnd = Math.min(Math.floor(totalMinutes * 0.4), totalMinutes);
    setPendingStartMinutes(0);
    setPendingEndMinutes(morningEnd);
    setHasUnappliedChanges(true);
  };

  const quickSelectAfternoon = () => {
    const afternoonStart = Math.floor(totalMinutes * 0.4);
    setPendingStartMinutes(afternoonStart);
    setPendingEndMinutes(totalMinutes);
    setHasUnappliedChanges(true);
  };

  const quickSelectFullDay = () => {
    setPendingStartMinutes(0);
    setPendingEndMinutes(totalMinutes);
    setHasUnappliedChanges(true);
  };

  // Calculate duration of selected range
  const selectedDuration = pendingEndMinutes - pendingStartMinutes;
  const selectedHours = Math.floor(selectedDuration / 60);
  const selectedMins = selectedDuration % 60;
  const durationText = selectedHours > 0
    ? `${selectedHours}h ${selectedMins}m`
    : `${selectedMins}m`;

  const isFiltered = timeRange !== null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Filter by Time</h3>
          <p className="text-xs text-gray-500">Select a portion of the day to view</p>
        </div>
        {isFiltered && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            Active
          </span>
        )}
      </div>

      {/* Full day range display */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Full Day Range</div>
        <div className="flex justify-between text-sm font-medium text-gray-700">
          <span>{formatTime(minTime)}</span>
          <span className="text-gray-400">to</span>
          <span>{formatTime(maxTime)}</span>
        </div>
      </div>

      {/* Selected range preview */}
      <div className={`rounded-lg p-3 mb-4 border-2 ${
        hasUnappliedChanges
          ? 'bg-amber-50 border-amber-300'
          : isFiltered
            ? 'bg-blue-50 border-blue-300'
            : 'bg-gray-50 border-transparent'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">
            {hasUnappliedChanges ? 'Preview (not applied)' : isFiltered ? 'Currently Showing' : 'Selection'}
          </span>
          <span className="text-xs text-gray-500">{durationText}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-gray-900">
          <span>{formatTime(minutesToTime(pendingStartMinutes))}</span>
          <span className="text-gray-400">→</span>
          <span>{formatTime(minutesToTime(pendingEndMinutes))}</span>
        </div>
      </div>

      {/* Range sliders */}
      <div className="space-y-4 mb-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1 font-medium">
            Start Time
          </label>
          <input
            type="range"
            min={0}
            max={totalMinutes}
            value={pendingStartMinutes}
            onChange={(e) => handleStartChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1 font-medium">
            End Time
          </label>
          <input
            type="range"
            min={0}
            max={totalMinutes}
            value={pendingEndMinutes}
            onChange={(e) => handleEndChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Quick Select</div>
        <div className="flex gap-2">
          <button
            onClick={quickSelectMorning}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors font-medium"
          >
            Morning
          </button>
          <button
            onClick={quickSelectAfternoon}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors font-medium"
          >
            Afternoon
          </button>
          <button
            onClick={quickSelectFullDay}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors font-medium"
          >
            Full Day
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={applyFilter}
          disabled={!hasUnappliedChanges}
          className={`flex-1 px-4 py-2 rounded font-medium text-sm transition-colors ${
            hasUnappliedChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Apply Filter
        </button>
        {isFiltered && (
          <button
            onClick={clearFilter}
            className="px-4 py-2 rounded font-medium text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Help text */}
      {hasUnappliedChanges && (
        <p className="mt-2 text-xs text-amber-600 text-center">
          Click &quot;Apply Filter&quot; to update the map and stops list
        </p>
      )}
    </div>
  );
}
