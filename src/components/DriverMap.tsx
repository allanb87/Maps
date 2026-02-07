'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GPSPoint, Stop, Delivery, TimeRange } from '@/types';
import 'leaflet/dist/leaflet.css';

const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const deliveredIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const selectedPickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #f59e0b; width: 30px; height: 30px; border-radius: 50%; border: 4px solid #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.35), 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const selectedDeliveredIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #22c55e; width: 30px; height: 30px; border-radius: 50%; border: 4px solid #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.35), 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const startIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #000; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">S</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface DriverMapProps {
  gpsTrack: GPSPoint[];
  stops: Stop[];
  deliveries: Delivery[];
  timeRange: TimeRange | null;
  selectedStopId: string | null;
  onStopSelect: (stopId: string | null) => void;
}

function MapBoundsUpdater({ points, stops }: { points: GPSPoint[]; stops: Stop[] }) {
  const map = useMap();

  useEffect(() => {
    const allCoords: [number, number][] = [
      ...points.map(p => [p.lat, p.lng] as [number, number]),
      ...stops.map(s => [s.lat, s.lng] as [number, number]),
    ];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, points, stops]);

  return null;
}

export default function DriverMap({
  gpsTrack,
  stops,
  deliveries,
  timeRange,
  selectedStopId,
  onStopSelect,
}: DriverMapProps) {
  const filteredTrack = useMemo(() => {
    if (!timeRange) return gpsTrack;
    return gpsTrack.filter(
      point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
    );
  }, [gpsTrack, timeRange]);

  const filteredStops = useMemo(() => {
    if (!timeRange) return stops;
    return stops.filter(
      stop => stop.arrivalTime >= timeRange.start && stop.arrivalTime <= timeRange.end
    );
  }, [stops, timeRange]);

  const routePositions = filteredTrack.map(point => [point.lat, point.lng] as [number, number]);

  const getDeliveryForStop = (stopId: string) => {
    return deliveries.find(d => d.stopId === stopId);
  };

  const getStopIcon = (stop: Stop, isSelected: boolean) => {
    if (isSelected) {
      return stop.type === 'pickup' ? selectedPickupIcon : selectedDeliveredIcon;
    }
    return stop.type === 'pickup' ? pickupIcon : deliveredIcon;
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

  const selectedStop = useMemo(
    () => stops.find(stop => stop.id === selectedStopId) ?? null,
    [stops, selectedStopId]
  );

  const selectedDelivery = useMemo(
    () => deliveries.find(delivery => delivery.stopId === selectedStopId) ?? null,
    [deliveries, selectedStopId]
  );

  if (typeof window === 'undefined') {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[-25.2744, 133.7751]}
        zoom={4}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater points={filteredTrack} stops={filteredStops} />

        {/* Route polyline */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}

        {/* Start marker */}
        {filteredTrack.length > 0 && (
          <Marker position={[filteredTrack[0].lat, filteredTrack[0].lng]} icon={startIcon} />
        )}

        {/* Stop markers */}
        {filteredStops.map((stop) => {
          const isSelected = stop.id === selectedStopId;

          return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={getStopIcon(stop, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onStopSelect(stop.id === selectedStopId ? null : stop.id),
              }}
            />
          );
        })}
      </MapContainer>

      {selectedStop && (
        <div className="absolute top-4 right-4 w-80 max-w-[90%] bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[1000]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4
                className={`text-sm font-semibold ${
                  selectedStop.type === 'pickup' ? 'text-amber-600' : 'text-green-600'
                }`}
              >
                {selectedStop.type === 'pickup' ? 'Pickup (In Transit)' : 'Delivered'}
              </h4>
              {selectedDelivery && (
                <p className="text-xs text-gray-500 mt-1">Job #{selectedDelivery.jobId}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onStopSelect(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
              aria-label="Close details"
            >
              Close
            </button>
          </div>

          {selectedDelivery?.jobDetails && (
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              {jobDetailKeys
                .map((key) => [key, selectedDelivery.jobDetails?.[key]] as const)
                .filter(([, value]) => value !== null && value !== undefined)
                .map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-2">
                    <span className="text-gray-400">{formatFieldName(key)}:</span>
                    <span className="text-right text-gray-700">{String(value)}</span>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            {formatTime(selectedStop.arrivalTime)}
          </div>
        </div>
      )}
    </div>
  );
}
