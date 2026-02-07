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

  const [startMinutes, setStartMinutes] = useState(0);
  const [endMinutes, setEndMinutes] = useState(totalMinutes);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!timeRange) {
      setIsFiltering(false);
      setStartMinutes(0);
      setEndMinutes(totalMinutes);
      return;
    }

    const clampMinutes = (value: number) => Math.min(Math.max(value, 0), totalMinutes);
    const start = clampMinutes(
      Math.floor((timeRange.start.getTime() - minTime.getTime()) / 60000)
    );
    const endCandidate = clampMinutes(
      Math.floor((timeRange.end.getTime() - minTime.getTime()) / 60000)
    );
    const end = totalMinutes > 0 ? Math.max(endCandidate, start + 1) : endCandidate;

    setIsFiltering(true);
    setStartMinutes(start);
    setEndMinutes(end);
  }, [timeRange, totalMinutes, minTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const minutesToTime = (minutes: number) => {
    return new Date(minTime.getTime() + minutes * 60000);
  };

  const handleStartChange = (value: number) => {
    const newStart = Math.min(value, endMinutes - 1);
    setStartMinutes(newStart);
    if (isFiltering) {
      onTimeRangeChange({
        start: minutesToTime(newStart),
        end: minutesToTime(endMinutes),
      });
    }
  };

  const handleEndChange = (value: number) => {
    const newEnd = Math.max(value, startMinutes + 1);
    setEndMinutes(newEnd);
    if (isFiltering) {
      onTimeRangeChange({
        start: minutesToTime(startMinutes),
        end: minutesToTime(newEnd),
      });
    }
  };

  const toggleFiltering = () => {
    if (isFiltering) {
      setIsFiltering(false);
      onTimeRangeChange(null);
      setStartMinutes(0);
      setEndMinutes(totalMinutes);
    } else {
      setIsFiltering(true);
      onTimeRangeChange({
        start: minutesToTime(startMinutes),
        end: minutesToTime(endMinutes),
      });
    }
  };

  const quickSelectMorning = () => {
    const morningEnd = Math.min(Math.floor(totalMinutes * 0.4), totalMinutes);
    setStartMinutes(0);
    setEndMinutes(morningEnd);
    setIsFiltering(true);
    onTimeRangeChange({
      start: minutesToTime(0),
      end: minutesToTime(morningEnd),
    });
  };

  const quickSelectAfternoon = () => {
    const afternoonStart = Math.floor(totalMinutes * 0.4);
    setStartMinutes(afternoonStart);
    setEndMinutes(totalMinutes);
    setIsFiltering(true);
    onTimeRangeChange({
      start: minutesToTime(afternoonStart),
      end: minutesToTime(totalMinutes),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Time Range</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFiltering}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isFiltering
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isFiltering ? 'Clear Filter' : 'Enable Filter'}
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="px-2 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-100"
            aria-expanded={!isCollapsed}
            aria-controls="time-range-content"
            aria-label={isCollapsed ? 'Expand time range' : 'Collapse time range'}
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div id="time-range-content" className="space-y-4">
        {/* Full day range display */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>{formatTime(minTime)}</span>
          <span>{formatTime(maxTime)}</span>
        </div>

        {/* Range sliders */}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Start: {formatTime(minutesToTime(startMinutes))}
            </label>
            <input
              type="range"
              min={0}
              max={totalMinutes}
              value={startMinutes}
              onChange={(e) => handleStartChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              disabled={!isFiltering}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              End: {formatTime(minutesToTime(endMinutes))}
            </label>
            <input
              type="range"
              min={0}
              max={totalMinutes}
              value={endMinutes}
              onChange={(e) => handleEndChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              disabled={!isFiltering}
            />
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-2">
          <button
            onClick={quickSelectMorning}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Morning
          </button>
          <button
            onClick={quickSelectAfternoon}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Afternoon
          </button>
        </div>

        {/* Selected range indicator */}
        {isFiltering && (
          <div className="bg-blue-50 p-2 rounded text-sm text-blue-800">
            Showing: {formatTime(minutesToTime(startMinutes))} -{' '}
            {formatTime(minutesToTime(endMinutes))}
          </div>
        )}
        </div>
      )}
    </div>
  );
}
