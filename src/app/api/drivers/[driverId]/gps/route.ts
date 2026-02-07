import { NextRequest, NextResponse } from 'next/server';
import pool, { dbConfigError, classifyDbError } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface GPSRow extends RowDataPacket {
  lat: number;
  lng: number;
  datetime: string;
  speed: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const { driverId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date query parameter is required (YYYY-MM-DD)' }, { status: 400 });
  }

  if (!pool) {
    return NextResponse.json(
      { error: dbConfigError ?? 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const [rows] = await pool.query<GPSRow[]>(
      `SELECT lat, lng, datetime, speed
       FROM tbl_driver_stats_2020_q3
       WHERE driver_id = ? AND DATE(datetime) = ?
         AND lat IS NOT NULL AND lng IS NOT NULL
       ORDER BY datetime ASC`,
      [driverId, date]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching GPS data:', error);
    const classified = classifyDbError(error);
    return NextResponse.json(
      { error: classified.message || 'Failed to fetch GPS data' },
      { status: classified.status }
    );
  }
}
