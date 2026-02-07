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
  type: 'pickup' | 'delivered' | 'break' | 'unknown';
}

export interface Delivery {
  id: string;
  stopId: string;
  jobId: number;
  status: 'pickup' | 'delivered';
  completedAt?: Date;
  jobDetails?: Record<string, unknown>;
}

export interface Driver {
  driver_id: number;
  display_name: string;
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
