export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number; // km/h
}

export interface Stop {
  id: string;
  lat: number;
  lng: number;
  arrivalTime: Date;
  departureTime: Date;
  duration: number; // minutes
  type: 'delivery' | 'break' | 'unknown';
}

export interface Delivery {
  id: string;
  stopId: string;
  address: string;
  customerName: string;
  status: 'completed' | 'failed' | 'pending';
  completedAt?: Date;
  notes?: string;
}

export interface DriverDay {
  driverId: string;
  driverName: string;
  date: Date;
  gpsTrack: GPSPoint[];
  stops: Stop[];
  deliveries: Delivery[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface Driver {
  id: string;
  name: string;
  vehicleId?: string;
}

export interface RouteSegment {
  start: GPSPoint;
  end: GPSPoint;
  avgSpeed: number;
  color: string;
}
