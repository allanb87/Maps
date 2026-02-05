'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GPSPoint, Stop, Delivery, TimeRange } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const deliveryIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const failedDeliveryIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const breakIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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

function MapBoundsUpdater({ points }: { points: GPSPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

function SelectedStopHighlight({ stop, map }: { stop: Stop | null; map: L.Map | null }) {
  useEffect(() => {
    if (stop && map) {
      map.setView([stop.lat, stop.lng], 16, { animate: true });
    }
  }, [stop, map]);

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
  // Filter GPS points by time range
  const filteredTrack = useMemo(() => {
    if (!timeRange) return gpsTrack;
    return gpsTrack.filter(
      point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
    );
  }, [gpsTrack, timeRange]);

  // Filter stops by time range
  const filteredStops = useMemo(() => {
    if (!timeRange) return stops;
    return stops.filter(
      stop => stop.arrivalTime >= timeRange.start && stop.departureTime <= timeRange.end
    );
  }, [stops, timeRange]);

  const routePositions = filteredTrack.map(point => [point.lat, point.lng] as [number, number]);

  const getDeliveryForStop = (stopId: string) => {
    return deliveries.find(d => d.stopId === stopId);
  };

  const getStopIcon = (stop: Stop) => {
    if (stop.type === 'break') return breakIcon;
    const delivery = getDeliveryForStop(stop.id);
    if (delivery?.status === 'failed') return failedDeliveryIcon;
    return deliveryIcon;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const selectedStop = selectedStopId ? stops.find(s => s.id === selectedStopId) : null;

  if (typeof window === 'undefined') {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>;
  }

  return (
    <MapContainer
      center={[51.5074, -0.1278]}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater points={filteredTrack} />

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
        <Marker position={[filteredTrack[0].lat, filteredTrack[0].lng]} icon={startIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Start</strong>
              <br />
              {formatTime(filteredTrack[0].timestamp)}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Stop markers */}
      {filteredStops.map(stop => {
        const delivery = getDeliveryForStop(stop.id);
        const isSelected = stop.id === selectedStopId;

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={getStopIcon(stop)}
            eventHandlers={{
              click: () => onStopSelect(stop.id === selectedStopId ? null : stop.id),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[150px]">
                {stop.type === 'delivery' && delivery ? (
                  <>
                    <strong className={delivery.status === 'failed' ? 'text-red-600' : 'text-green-600'}>
                      {delivery.status === 'failed' ? 'Failed Delivery' : 'Delivery'}
                    </strong>
                    <br />
                    <span className="text-gray-600">{delivery.address}</span>
                    <br />
                    <span className="text-gray-600">{delivery.customerName}</span>
                  </>
                ) : (
                  <strong className="text-blue-600">Break</strong>
                )}
                <hr className="my-1" />
                <span className="text-gray-500">
                  {formatTime(stop.arrivalTime)} - {formatTime(stop.departureTime)}
                </span>
                <br />
                <span className="text-gray-500">{stop.duration} min</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
